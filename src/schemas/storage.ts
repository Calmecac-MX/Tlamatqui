import { z } from "zod";

/**
 * Categorías estándar de carpetas de almacenamiento en el sistema.
 */
export const StorageFolderCategorySchema = z.enum([
  "screenshots",
  "allies",
  "teams",
  "avatars",
  "general"
]);

export type StorageFolderCategory = z.infer<typeof StorageFolderCategorySchema>;

/**
 * Esquema de configuración de rutas destino en S3 / Bunny Storage.
 */
export const StoragePathsConfigSchema = z.object({
  basePath: z.string(),
  screenshots: z.string(),
  allies: z.string(),
  teams: z.string(),
  avatars: z.string(),
});

export type StoragePathsConfig = z.infer<typeof StoragePathsConfigSchema>;

/**
 * Esquema de políticas de control de acceso (RBAC) por carpeta/categoría de almacenamiento.
 */
export const StorageAccessPolicySchema = z.object({
  category: StorageFolderCategorySchema,
  configuredPath: z.string(),
  isPublicRead: z.boolean(),
  allowedUploadRoles: z.array(z.string()),
  allowedDeleteRoles: z.array(z.string()),
  description: z.string(),
});

export type StorageAccessPolicy = z.infer<typeof StorageAccessPolicySchema>;

/**
 * Esquema de validación Zod para el estado del almacenamiento S3 y Bunny CDN.
 */
export const StorageStatusSchema = z.object({
  isS3Configured: z.boolean(),
  isBunnyCdnConfigured: z.boolean(),
  isTokenAuthEnabled: z.boolean().default(false),
  bucket: z.string(),
  region: z.string(),
  endpoint: z.string(),
  cdnHostname: z.string(),
  forcePathStyle: z.boolean(),
  paths: StoragePathsConfigSchema,
  policies: z.array(StorageAccessPolicySchema),
  supportedRegions: z.array(z.string()),
});

export type StorageStatus = z.infer<typeof StorageStatusSchema>;

/**
 * Esquema de validación Zod para peticiones de subida de archivos (Base64 / Archivos).
 */
export const UploadFileRequestSchema = z.object({
  data: z.string().min(1, "El contenido del archivo es requerido"),
  filename: z.string().min(1, "El nombre del archivo es requerido"),
  category: StorageFolderCategorySchema.optional().default("general"),
  folder: z.string().optional(),
  contentType: z.string().optional(),
});

export type UploadFileRequest = z.infer<typeof UploadFileRequestSchema>;

/**
 * Esquema de validación Zod para la respuesta de subida de archivos.
 */
export const UploadFileResponseSchema = z.object({
  success: z.boolean(),
  key: z.string(),
  url: z.string().url(),
  cdnUrl: z.string().url(),
  size: z.number(),
  category: StorageFolderCategorySchema.optional(),
});

export type UploadFileResponse = z.infer<typeof UploadFileResponseSchema>;

/**
 * Esquema de validación Zod para la solicitud de purga de Bunny CDN.
 */
export const PurgeCdnRequestSchema = z.object({
  urlOrKey: z.string().optional(),
});

export type PurgeCdnRequest = z.infer<typeof PurgeCdnRequestSchema>;

/**
 * Esquema de validación Zod para generar una URL prefirmada (Presigned URL) de subida o descarga S3.
 */
export const PresignUrlRequestSchema = z.object({
  key: z.string().min(1, "La clave del archivo es requerida"),
  type: z.enum(["upload", "download"]).default("download"),
  category: StorageFolderCategorySchema.optional(),
  contentType: z.string().optional(),
  expiresInSeconds: z.number().min(1).max(604800).default(3600),
});

export type PresignUrlRequest = z.infer<typeof PresignUrlRequestSchema>;

export const PresignUrlResponseSchema = z.object({
  success: z.boolean(),
  key: z.string(),
  presignedUrl: z.string().url(),
  publicCdnUrl: z.string().url(),
  expiresInSeconds: z.number(),
  category: StorageFolderCategorySchema.optional(),
});

export type PresignUrlResponse = z.infer<typeof PresignUrlResponseSchema>;

/**
 * Esquema de validación Zod para la generación de URLs firmadas con Bunny CDN Advanced Token Authentication (HMAC-SHA256).
 */
export const SignBunnyCdnTokenRequestSchema = z.object({
  url: z.string().optional(),
  key: z.string().optional(),
  securityKey: z.string().optional(),
  expirationTime: z.number().min(1).default(3600),
  expiresAt: z.number().optional(),
  userIp: z.string().optional(),
  isDirectory: z.boolean().default(false),
  pathAllowed: z.string().optional(),
  countriesAllowed: z.string().optional(),
  countriesBlocked: z.string().optional(),
  ignoreParams: z.boolean().default(false),
  speedLimit: z.number().min(0).default(0),
});

export type SignBunnyCdnTokenRequest = z.infer<typeof SignBunnyCdnTokenRequestSchema>;

export const SignBunnyCdnTokenResponseSchema = z.object({
  success: z.boolean(),
  signedUrl: z.string().url(),
  token: z.string(),
  expires: z.number(),
  isDirectory: z.boolean(),
  path: z.string(),
  expiresInSeconds: z.number(),
});

export type SignBunnyCdnTokenResponse = z.infer<typeof SignBunnyCdnTokenResponseSchema>;
