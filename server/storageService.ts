/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Servicio unificado de Almacenamiento S3 y Aceleración CDN con Bunny.net.
 * Proporciona subida y gestión de objetos en buckets S3 compatibles (AWS S3, Bunny Storage S3, Cloudflare R2, MinIO)
 * con distribución optimizada en el Edge a través de Bunny CDN y purga de caché automatizada.
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

// Variables de entorno S3 y Bunny CDN
const S3_ENDPOINT = process.env.S3_ENDPOINT || process.env.BUNNY_STORAGE_ENDPOINT || "";
const S3_REGION = process.env.S3_REGION || "auto";
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || process.env.BUNNY_STORAGE_ZONE || "tlamatqui-assets";
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || process.env.BUNNY_STORAGE_ACCESS_KEY || "";
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || process.env.BUNNY_STORAGE_SECRET_KEY || "";
const S3_FORCE_PATH_STYLE = process.env.S3_FORCE_PATH_STYLE !== "false"; // Por defecto true para Bunny / R2 / MinIO

// Configuración de Bunny CDN
const BUNNY_CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME || process.env.BUNNY_PULL_ZONE_URL || "";
const BUNNY_API_KEY = process.env.BUNNY_API_KEY || "";

let s3ClientInstance: S3Client | null = null;

/**
 * Obtiene o inicializa la instancia singleton de S3Client.
 */
export function getS3Client(): S3Client | null {
  if (!isS3Configured()) {
    return null;
  }

  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      endpoint: S3_ENDPOINT ? (S3_ENDPOINT.startsWith("http") ? S3_ENDPOINT : `https://${S3_ENDPOINT}`) : undefined,
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
 * Construye la URL pública optimizada para un archivo, priorizando Bunny CDN sobre la URL directa de S3.
 * 
 * @param key Clave o ruta relativa del objeto en el bucket S3.
 * @returns URL pública distribuida por CDN o URL directa del bucket.
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
    const baseEndpoint = S3_ENDPOINT.startsWith("http")
      ? S3_ENDPOINT.replace(/\/+$/, "")
      : `https://${S3_ENDPOINT.replace(/\/+$/, "")}`;
    return `${baseEndpoint}/${S3_BUCKET_NAME}/${sanitizedKey}`;
  }

  return `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/${sanitizedKey}`;
}

/**
 * Sube un buffer de datos a S3 y retorna las URLs directa y de Bunny CDN.
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

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: sanitizedKey,
    Body: buffer,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
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
 * Sube una imagen codificada en base64 a S3 / Bunny Storage.
 * 
 * @param base64Data Cadena base64 completa (ej. data:image/png;base64,...) o cruda.
 * @param key Nombre o ruta del objeto.
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
 * Elimina un objeto del bucket S3 y opcionalmente purga la caché de Bunny CDN.
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
 * Purga la caché de Bunny CDN para un archivo específico o para toda la zona de distribución.
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
 * Retorna el estado consolidado de la infraestructura de almacenamiento S3 y CDN.
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
  };
}
