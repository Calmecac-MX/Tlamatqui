/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Servicio unificado de Almacenamiento S3 y Aceleración CDN con Bunny.net (Bunny Storage S3 API).
 * Implementado estrictamente según las especificaciones de compatibilidad S3 de Bunny Storage:
 * - Autenticación: Access Key ID (Nombre de Storage Zone), Secret Access Key (Password de Storage Zone).
 * - Endpoints regionales: https://[region]-s3.storage.bunnycdn.com (de, ny, sg, uk, se, la, jh, syd).
 * - Operaciones soportadas: PutObject, GetObject, DeleteObject, HeadObject, ListObjectsV2, Presign.
 * - Sin encabezados no soportados en PutObject (sin Cache-Control ni ACLs en S3; la caché se gestiona en Bunny CDN).
 * - Distribución y purga perimetral instantánea mediante Bunny CDN Pull Zone.
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";

dotenv.config();

// Regiones válidas soportadas por Bunny S3
export const BUNNY_S3_REGIONS = ["de", "ny", "sg", "uk", "se", "la", "jh", "syd"] as const;
export type BunnyS3Region = typeof BUNNY_S3_REGIONS[number] | string;

// Variables de entorno S3 y Bunny CDN
const S3_REGION = (process.env.S3_REGION || process.env.BUNNY_STORAGE_REGION || "ny").toLowerCase().trim();
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || process.env.BUNNY_STORAGE_ZONE || "tlamatqui-assets";
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || process.env.BUNNY_STORAGE_ACCESS_KEY || S3_BUCKET_NAME;
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || process.env.BUNNY_STORAGE_SECRET_KEY || "";
const S3_FORCE_PATH_STYLE = process.env.S3_FORCE_PATH_STYLE !== "false"; // Soportado por Bunny Storage

// Resolver endpoint regional de Bunny S3 automáticamente si no se especifica uno explícito
function resolveS3Endpoint(): string | undefined {
  if (process.env.S3_ENDPOINT && process.env.S3_ENDPOINT.trim() !== "") {
    const raw = process.env.S3_ENDPOINT.trim();
    return raw.startsWith("http") ? raw : `https://${raw}`;
  }

  if (process.env.BUNNY_STORAGE_ENDPOINT && process.env.BUNNY_STORAGE_ENDPOINT.trim() !== "") {
    const raw = process.env.BUNNY_STORAGE_ENDPOINT.trim();
    return raw.startsWith("http") ? raw : `https://${raw}`;
  }

  // Si se utiliza Bunny S3 por defecto con región
  const region = BUNNY_S3_REGIONS.includes(S3_REGION as any) ? S3_REGION : "ny";
  return `https://${region}-s3.storage.bunnycdn.com`;
}

const S3_ENDPOINT = resolveS3Endpoint();

// Configuración de Bunny CDN Pull Zone
const BUNNY_CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME || process.env.BUNNY_PULL_ZONE_URL || "";
const BUNNY_API_KEY = process.env.BUNNY_API_KEY || "";

let s3ClientInstance: S3Client | null = null;

/**
 * Obtiene o inicializa la instancia singleton de S3Client configurada para Bunny Storage.
 */
export function getS3Client(): S3Client | null {
  if (!isS3Configured()) {
    return null;
  }

  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      endpoint: S3_ENDPOINT,
      region: S3_REGION,
      credentials: {
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_KEY,
      },
      forcePathStyle: S3_FORCE_PATH_STYLE,
    });
  }

  return s3ClientInstance;
}

/**
 * Comprueba si las credenciales mínimas de S3 / Bunny Storage están configuradas.
 */
export function isS3Configured(): boolean {
  return Boolean(S3_ACCESS_KEY && S3_SECRET_KEY && S3_BUCKET_NAME);
}

/**
 * Comprueba si la aceleración perimetral con Bunny CDN está configurada.
 */
export function isBunnyCdnConfigured(): boolean {
  return Boolean(BUNNY_CDN_HOSTNAME);
}

/**
 * Construye la URL pública optimizada para un archivo, priorizando Bunny CDN Pull Zone sobre el origen S3.
 * 
 * @param key Clave o ruta relativa del objeto en el bucket S3.
 * @returns URL pública distribuida por Bunny CDN o URL directa del bucket S3.
 */
export function getPublicCdnUrl(key: string): string {
  const sanitizedKey = key.replace(/^\/+/, "");

  if (BUNNY_CDN_HOSTNAME) {
    const baseCdn = BUNNY_CDN_HOSTNAME.startsWith("http")
      ? BUNNY_CDN_HOSTNAME.replace(/\/+$/, "")
      : `https://${BUNNY_CDN_HOSTNAME.replace(/\/+$/, "")}`;
    return `${baseCdn}/${sanitizedKey}`;
  }

  if (S3_ENDPOINT) {
    const baseEndpoint = S3_ENDPOINT.replace(/\/+$/, "");
    return `${baseEndpoint}/${S3_BUCKET_NAME}/${sanitizedKey}`;
  }

  return `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/${sanitizedKey}`;
}

/**
 * Sube un buffer binario a Bunny Storage S3.
 * NOTA: Cumpliendo con la especificación de Bunny Storage S3, se omite Cache-Control o ACL en la llamada PutObject;
 * la caché perimetral se gestiona a nivel de Bunny CDN Pull Zone.
 * 
 * @param buffer Contenido binario del archivo.
 * @param key Ruta o nombre único del archivo en el bucket (ej. "screenshots/report_123_desktop.webp").
 * @param contentType Tipo MIME del archivo (ej. "image/webp", "image/png", "application/pdf").
 */
export async function uploadBufferToStorage(
  buffer: Buffer,
  key: string,
  contentType: string = "application/octet-stream"
): Promise<{ key: string; url: string; cdnUrl: string; size: number }> {
  const client = getS3Client();
  const sanitizedKey = key.replace(/^\/+/, "");

  if (!client) {
    throw new Error("El servicio de almacenamiento S3 / Bunny Storage no está configurado.");
  }

  // PutObject estricto para Bunny S3 (Bucket, Key, Body, ContentType)
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: sanitizedKey,
    Body: buffer,
    ContentType: contentType,
  });

  await client.send(command);

  const cdnUrl = getPublicCdnUrl(sanitizedKey);

  return {
    key: sanitizedKey,
    url: cdnUrl,
    cdnUrl: cdnUrl,
    size: buffer.length,
  };
}

/**
 * Sube una imagen codificada en base64 a Bunny Storage S3.
 * 
 * @param base64Data Cadena base64 completa (ej. data:image/webp;base64,...) o cruda.
 * @param key Nombre o ruta del objeto en el bucket.
 * @param defaultContentType Tipo de contenido por defecto si no está especificado en el data URI.
 */
export async function uploadBase64ToStorage(
  base64Data: string,
  key: string,
  defaultContentType: string = "image/webp"
): Promise<{ key: string; url: string; cdnUrl: string; size: number }> {
  if (!base64Data || typeof base64Data !== "string") {
    throw new Error("Datos base64 inválidos o vacíos.");
  }

  let contentType = defaultContentType;
  let rawBase64 = base64Data;

  const match = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
  if (match) {
    contentType = match[1];
    rawBase64 = match[2];
  }

  const buffer = Buffer.from(rawBase64, "base64");
  return uploadBufferToStorage(buffer, key, contentType);
}

/**
 * Genera una URL prefirmada (Presigned URL) para descarga u obtención directa con expiración temporal.
 * 
 * @param key Clave del objeto en el bucket.
 * @param expiresInSeconds Duración de validez en segundos (por defecto 3600 = 1 hora, máximo 7 días).
 */
export async function getPresignedDownloadUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
  const client = getS3Client();
  if (!client) {
    throw new Error("Cliente S3 no disponible.");
  }

  const sanitizedKey = key.replace(/^\/+/, "");
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: sanitizedKey,
  });

  return getSignedUrl(client, command, { expiresIn: Math.min(expiresInSeconds, 604800) });
}

/**
 * Genera una URL prefirmada (Presigned URL) para subida directa (PUT) desde el navegador hacia Bunny Storage S3.
 * 
 * @param key Clave del destino en el bucket.
 * @param contentType Tipo MIME esperado.
 * @param expiresInSeconds Duración de validez en segundos (por defecto 3600 = 1 hora).
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string = "application/octet-stream",
  expiresInSeconds: number = 3600
): Promise<string> {
  const client = getS3Client();
  if (!client) {
    throw new Error("Cliente S3 no disponible.");
  }

  const sanitizedKey = key.replace(/^\/+/, "");
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: sanitizedKey,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn: Math.min(expiresInSeconds, 604800) });
}

/**
 * Elimina un objeto del bucket S3 (Single Object Delete) y purga la caché perimetral en Bunny CDN.
 * 
 * @param key Clave del objeto a eliminar.
 */
export async function deleteFileFromStorage(key: string): Promise<boolean> {
  const client = getS3Client();
  if (!client) return false;

  try {
    const sanitizedKey = key.replace(/^\/+/, "");
    await client.send(
      new DeleteObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: sanitizedKey,
      })
    );

    // Purgar de la CDN si está configurada
    if (BUNNY_API_KEY && BUNNY_CDN_HOSTNAME) {
      purgeBunnyCdnCache(sanitizedKey).catch(() => {});
    }

    return true;
  } catch (err) {
    console.error("[Storage Delete Error]", err);
    return false;
  }
}

/**
 * Purga la caché de Bunny CDN para un archivo específico o para toda la zona de distribución Pull Zone.
 * 
 * @param urlOrKey URL completa o clave del archivo a purgar de los nodos edge de Bunny.net.
 */
export async function purgeBunnyCdnCache(urlOrKey?: string): Promise<{ success: boolean; message: string }> {
  if (!BUNNY_API_KEY) {
    return {
      success: false,
      message: "BUNNY_API_KEY no está configurada para realizar la purga de caché.",
    };
  }

  try {
    let purgeUrl: string;

    if (urlOrKey && urlOrKey.startsWith("http")) {
      purgeUrl = urlOrKey;
    } else if (urlOrKey && BUNNY_CDN_HOSTNAME) {
      purgeUrl = getPublicCdnUrl(urlOrKey);
    } else {
      // Purga completa de zona si se proporciona URL base
      purgeUrl = BUNNY_CDN_HOSTNAME.startsWith("http")
        ? BUNNY_CDN_HOSTNAME
        : `https://${BUNNY_CDN_HOSTNAME}`;
    }

    const response = await fetch(`https://api.bunny.net/purge?url=${encodeURIComponent(purgeUrl)}`, {
      method: "POST",
      headers: {
        AccessKey: BUNNY_API_KEY,
        Accept: "application/json",
      },
    });

    if (response.ok) {
      return {
        success: true,
        message: `Caché de Bunny CDN purgada exitosamente para: ${purgeUrl}`,
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        message: `Error al purgar Bunny CDN (${response.status}): ${errorText}`,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Excepción al purgar Bunny CDN: ${error.message}`,
    };
  }
}

/**
 * Retorna el estado consolidado de la infraestructura de almacenamiento S3 y Bunny CDN.
 */
export function getStorageStatus() {
  return {
    isS3Configured: isS3Configured(),
    isBunnyCdnConfigured: isBunnyCdnConfigured(),
    bucket: S3_BUCKET_NAME,
    region: S3_REGION,
    endpoint: S3_ENDPOINT || "AWS S3 Default",
    cdnHostname: BUNNY_CDN_HOSTNAME || "Sin CDN configurada (Directo a S3)",
    forcePathStyle: S3_FORCE_PATH_STYLE,
    supportedRegions: BUNNY_S3_REGIONS,
  };
}
