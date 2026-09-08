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
 * - Control de acceso granular (RBAC) y distribución pública de contenido para screenshots, logos y perfiles.
 * - Rutas de almacenamiento modulares y configurables mediante variables de entorno en un espacio unificado.
 * - Bunny CDN Advanced Token Authentication (HMAC-SHA256): URLs firmadas, tokens de directorio, IP locking, geo-restricción y speed limits.
 */

import crypto from "crypto";
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
import type {
  StorageFolderCategory,
  StoragePathsConfig,
  StorageAccessPolicy,
  SignBunnyCdnTokenRequest,
  SignBunnyCdnTokenResponse
} from "../src/schemas/storage.js";

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

// Configuración de rutas destino para unificación de espacios de almacenamiento
export const STORAGE_BASE_PATH = (process.env.STORAGE_BASE_PATH || "").trim().replace(/^\/+|\/+$/g, "");
export const STORAGE_PATH_SCREENSHOTS = (process.env.STORAGE_PATH_SCREENSHOTS || "screenshots").trim().replace(/^\/+|\/+$/g, "");
export const STORAGE_PATH_ALLIES = (process.env.STORAGE_PATH_ALLIES || process.env.STORAGE_PATH_PARTNER_LOGOS || "allies").trim().replace(/^\/+|\/+$/g, "");
export const STORAGE_PATH_TEAMS = (process.env.STORAGE_PATH_TEAMS || process.env.STORAGE_PATH_TEAM_LOGOS || "teams").trim().replace(/^\/+|\/+$/g, "");
export const STORAGE_PATH_AVATARS = (process.env.STORAGE_PATH_AVATARS || process.env.STORAGE_PATH_PROFILES || "avatars").trim().replace(/^\/+|\/+$/g, "");

// Claves de autenticación y firma avanzada de tokens de Bunny CDN
const BUNNY_CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME || process.env.BUNNY_PULL_ZONE_URL || "";
const BUNNY_API_KEY = process.env.BUNNY_API_KEY || "";
const BUNNY_CDN_SECURITY_KEY = (
  process.env.BUNNY_CDN_SECURITY_KEY ||
  process.env.BUNNY_CDN_TOKEN_KEY ||
  process.env.BUNNY_TOKEN_AUTH_KEY ||
  ""
).trim();

/**
 * Retorna la configuración de rutas activas de almacenamiento.
 */
export function getStoragePathsConfig(): StoragePathsConfig {
  return {
    basePath: STORAGE_BASE_PATH,
    screenshots: STORAGE_PATH_SCREENSHOTS,
    allies: STORAGE_PATH_ALLIES,
    teams: STORAGE_PATH_TEAMS,
    avatars: STORAGE_PATH_AVATARS,
  };
}

/**
 * Obtiene la subcarpeta correspondiente a una categoría de almacenamiento.
 */
export function getStorageFolder(category: StorageFolderCategory): string {
  switch (category) {
    case "screenshots":
      return STORAGE_PATH_SCREENSHOTS;
    case "allies":
      return STORAGE_PATH_ALLIES;
    case "teams":
      return STORAGE_PATH_TEAMS;
    case "avatars":
      return STORAGE_PATH_AVATARS;
    case "general":
    default:
      return "uploads";
  }
}

/**
 * Construye una clave (key) canónica para S3, aplicando el espacio base (STORAGE_BASE_PATH) y la categoría.
 * 
 * @param category Categoría del recurso (screenshots, allies, teams, avatars, general).
 * @param filename Nombre del archivo.
 * @returns Ruta completa y normalizada dentro del bucket (ej. "tlamatqui/screenshots/audit_123.webp").
 */
export function buildStorageKey(category: StorageFolderCategory, filename: string): string {
  const folder = getStorageFolder(category);
  const cleanFilename = filename.replace(/^\/+/, "");
  
  if (STORAGE_BASE_PATH) {
    return `${STORAGE_BASE_PATH}/${folder}/${cleanFilename}`;
  }
  return `${folder}/${cleanFilename}`;
}

/**
 * Detecta la categoría de un archivo a partir de su clave de almacenamiento o ruta.
 */
export function detectCategoryFromKey(key: string): StorageFolderCategory {
  const normalized = key.toLowerCase();
  if (normalized.includes(`/${STORAGE_PATH_SCREENSHOTS}/`) || normalized.startsWith(`${STORAGE_PATH_SCREENSHOTS}/`)) {
    return "screenshots";
  }
  if (normalized.includes(`/${STORAGE_PATH_ALLIES}/`) || normalized.startsWith(`${STORAGE_PATH_ALLIES}/`)) {
    return "allies";
  }
  if (normalized.includes(`/${STORAGE_PATH_TEAMS}/`) || normalized.startsWith(`${STORAGE_PATH_TEAMS}/`)) {
    return "teams";
  }
  if (normalized.includes(`/${STORAGE_PATH_AVATARS}/`) || normalized.startsWith(`${STORAGE_PATH_AVATARS}/`)) {
    return "avatars";
  }
  return "general";
}

/**
 * Matriz de políticas de control de acceso (RBAC) y definición de contenido público.
 */
export function getStorageAccessPolicies(): StorageAccessPolicy[] {
  return [
    {
      category: "screenshots",
      configuredPath: buildStorageKey("screenshots", ""),
      isPublicRead: true,
      allowedUploadRoles: ["Superusuario", "Administrador", "Agente", "PublicWorkflow"],
      allowedDeleteRoles: ["Superusuario", "Administrador"],
      description: "Capturas de pantalla de tiendas y diagnósticos. Lectura pública global mediante Bunny CDN."
    },
    {
      category: "allies",
      configuredPath: buildStorageKey("allies", ""),
      isPublicRead: true,
      allowedUploadRoles: ["Superusuario", "Administrador"],
      allowedDeleteRoles: ["Superusuario", "Administrador"],
      description: "Logos oficiales de aliados, pasarelas de pago y proveedores. Lectura pública global."
    },
    {
      category: "teams",
      configuredPath: buildStorageKey("teams", ""),
      isPublicRead: true,
      allowedUploadRoles: ["Superusuario", "Administrador", "Agente"],
      allowedDeleteRoles: ["Superusuario", "Administrador"],
      description: "Logos e identidades visuales de agencias y equipos de trabajo. Lectura pública global."
    },
    {
      category: "avatars",
      configuredPath: buildStorageKey("avatars", ""),
      isPublicRead: true,
      allowedUploadRoles: ["Superusuario", "Administrador", "Agente", "Visor", "Invitado"],
      allowedDeleteRoles: ["Superusuario", "Administrador"],
      description: "Fotos de perfil y avatares de usuarios. Lectura pública acelerada por CDN."
    },
    {
      category: "general",
      configuredPath: buildStorageKey("general", ""),
      isPublicRead: true,
      allowedUploadRoles: ["Superusuario", "Administrador", "Agente"],
      allowedDeleteRoles: ["Superusuario", "Administrador"],
      description: "Archivos generales y multimedia administrativa."
    }
  ];
}

/**
 * Valida si un rol tiene autorización para ejecutar una acción en la categoría especificada.
 */
export function isStorageActionAllowed(
  userRole: string | undefined,
  category: StorageFolderCategory,
  action: "read" | "upload" | "delete"
): { allowed: boolean; reason?: string } {
  // Lectura pública permitida para todos los contenidos de la suite
  if (action === "read") {
    return { allowed: true };
  }

  const role = userRole || "Invitado";

  // El Superusuario siempre tiene acceso total
  if (role === "Superusuario") {
    return { allowed: true };
  }

  const policies = getStorageAccessPolicies();
  const policy = policies.find(p => p.category === category);

  if (!policy) {
    return { allowed: false, reason: `Categoría '${category}' no reconocida.` };
  }

  if (action === "upload") {
    if (policy.allowedUploadRoles.includes(role)) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: `El rol '${role}' no tiene permisos de subida en la categoría '${category}'. Requerido: ${policy.allowedUploadRoles.join(", ")}.`
    };
  }

  if (action === "delete") {
    if (policy.allowedDeleteRoles.includes(role)) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: `El rol '${role}' no tiene permisos de eliminación en la categoría '${category}'. Requerido: ${policy.allowedDeleteRoles.join(", ")}.`
    };
  }

  return { allowed: false, reason: "Acción no permitida." };
}

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
 * Comprueba si la clave de autenticación por Token de Bunny CDN está configurada.
 */
export function isBunnyTokenAuthEnabled(): boolean {
  return Boolean(BUNNY_CDN_SECURITY_KEY);
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
 * Normaliza y enmascara direcciones IP para firma de tokens según la especificación de Bunny CDN:
 * - IPv4: dirección exacta o máscara de red /24.
 * - IPv6: enmascarada a los primeros 4 bloques (prefijo /64).
 */
function normalizeUserIpForSigning(ip: string): string {
  const trimmed = ip.trim();
  if (!trimmed) return "";
  
  if (trimmed.includes(":")) {
    if (trimmed.includes("::")) {
      const parts = trimmed.split("::");
      const left = parts[0].split(":").filter(Boolean);
      const prefix = left.slice(0, 4);
      while (prefix.length < 4) prefix.push("0");
      return prefix.join(":") + "::";
    }
    const parts = trimmed.split(":");
    return parts.slice(0, 4).join(":") + "::";
  }
  
  return trimmed;
}

/**
 * Opciones para la firma de URLs con Bunny CDN Advanced Token Authentication.
 */
export interface BunnySignUrlOptions {
  url?: string;
  key?: string;
  securityKey?: string;
  expirationTime?: number;
  expiresAt?: number;
  userIp?: string;
  isDirectory?: boolean;
  pathAllowed?: string;
  countriesAllowed?: string;
  countriesBlocked?: string;
  ignoreParams?: boolean;
  speedLimit?: number;
}

/**
 * Genera una URL firmada segura utilizando Bunny CDN Advanced Token Authentication (HMAC-SHA256).
 * 
 * Fórmula oficial:
 * token = "HS256-" + flags + Base64URL(HMAC-SHA256(security_key, signature_path + expires + user_ip + signing_data))
 */
export function signBunnyCdnUrl(options: BunnySignUrlOptions): SignBunnyCdnTokenResponse {
  const securityKey = options.securityKey || BUNNY_CDN_SECURITY_KEY;
  if (!securityKey) {
    throw new Error("BUNNY_CDN_SECURITY_KEY no está configurada para firmar URLs con token de autenticación.");
  }

  // Resolver URL destino completa
  let targetUrlString = options.url || "";
  if (!targetUrlString && options.key) {
    targetUrlString = getPublicCdnUrl(options.key);
  }
  if (!targetUrlString.startsWith("http")) {
    targetUrlString = `https://${targetUrlString}`;
  }

  const parsedUrl = new URL(targetUrlString);
  const path = parsedUrl.pathname;
  const signaturePath = options.pathAllowed || path;

  // Calcular timestamp de expiración UNIX
  let expires: number;
  if (options.expiresAt && options.expiresAt > 0) {
    expires = Math.floor(options.expiresAt);
  } else {
    const offsetSeconds = options.expirationTime && options.expirationTime > 0 ? options.expirationTime : 3600;
    expires = Math.floor(Date.now() / 1000) + offsetSeconds;
  }

  const expiresStr = expires.toString();

  // Enmascaramiento y validación de IP (IP Locking)
  const normalizedIp = options.userIp ? normalizeUserIpForSigning(options.userIp) : "";
  const flags = normalizedIp ? "1-" : "";

  // Construcción de parámetros de firma (ordenamiento alfabético estricto)
  const signingParams: Record<string, string> = {};

  if (options.countriesAllowed) {
    signingParams["token_countries"] = options.countriesAllowed.trim().toUpperCase();
  }
  if (options.countriesBlocked) {
    signingParams["token_countries_blocked"] = options.countriesBlocked.trim().toUpperCase();
  }
  if (options.ignoreParams) {
    signingParams["token_ignore_params"] = "true";
  } else {
    parsedUrl.searchParams.forEach((val, key) => {
      if (key !== "token" && key !== "expires") {
        signingParams[key] = val;
      }
    });
  }
  if (options.pathAllowed) {
    signingParams["token_path"] = options.pathAllowed;
  }
  if (options.speedLimit && options.speedLimit > 0) {
    signingParams["limit"] = options.speedLimit.toString();
  }

  const sortedKeys = Object.keys(signingParams).sort();
  const signingData = sortedKeys.map(k => `${k}=${signingParams[k]}`).join("&");

  // HMAC-SHA256(security_key, signature_path + expires + user_ip + signing_data)
  const messageToSign = `${signaturePath}${expiresStr}${normalizedIp}${signingData}`;
  const hmac = crypto.createHmac("sha256", securityKey);
  hmac.update(messageToSign);
  const rawBase64 = hmac.digest("base64");
  const base64UrlHash = rawBase64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const token = `HS256-${flags}${base64UrlHash}`;

  let signedUrl = "";

  if (options.isDirectory) {
    // Path-based token format (/bcdn_token=.../path/to/file)
    const tokenParams: string[] = [`token=${token}`, `expires=${expiresStr}`];
    sortedKeys.forEach(k => {
      tokenParams.push(`${encodeURIComponent(k)}=${encodeURIComponent(signingParams[k])}`);
    });
    const tokenPathSegment = `bcdn_token=${tokenParams.join("&")}`;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    signedUrl = `${parsedUrl.protocol}//${parsedUrl.host}/${tokenPathSegment}${cleanPath}${parsedUrl.search}`;
  } else {
    // Query string token format (?token=...&expires=...)
    const finalUrl = new URL(targetUrlString);
    finalUrl.searchParams.set("token", token);
    finalUrl.searchParams.set("expires", expiresStr);
    sortedKeys.forEach(k => {
      finalUrl.searchParams.set(k, signingParams[k]);
    });
    signedUrl = finalUrl.toString();
  }

  return {
    success: true,
    signedUrl,
    token,
    expires,
    isDirectory: Boolean(options.isDirectory),
    path: signaturePath,
    expiresInSeconds: Math.max(0, expires - Math.floor(Date.now() / 1000)),
  };
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
 * Retorna el estado consolidado de la infraestructura de almacenamiento S3, rutas activas y políticas RBAC.
 */
export function getStorageStatus() {
  return {
    isS3Configured: isS3Configured(),
    isBunnyCdnConfigured: isBunnyCdnConfigured(),
    isTokenAuthEnabled: isBunnyTokenAuthEnabled(),
    bucket: S3_BUCKET_NAME,
    region: S3_REGION,
    endpoint: S3_ENDPOINT || "AWS S3 Default",
    cdnHostname: BUNNY_CDN_HOSTNAME || "Sin CDN configurada (Directo a S3)",
    forcePathStyle: S3_FORCE_PATH_STYLE,
    paths: getStoragePathsConfig(),
    policies: getStorageAccessPolicies(),
    supportedRegions: [...BUNNY_S3_REGIONS],
  };
}
