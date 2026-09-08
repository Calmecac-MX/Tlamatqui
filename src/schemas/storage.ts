import { z } from "zod";

/**
 * Esquema de validación Zod para el estado del almacenamiento S3 y Bunny CDN.
 */
export const StorageStatusSchema = z.object({
  isS3Configured: z.boolean(),
  isBunnyCdnConfigured: z.boolean(),
  bucket: z.string(),
  region: z.string(),
  endpoint: z.string(),
  cdnHostname: z.string(),
  forcePathStyle: z.boolean(),
});

export type StorageStatus = z.infer<typeof StorageStatusSchema>;

/**
 * Esquema de validación Zod para peticiones de subida de archivos (Base64 / Archivos).
 */
export const UploadFileRequestSchema = z.object({
  data: z.string().min(1, "El contenido del archivo es requerido"),
  filename: z.string().min(1, "El nombre del archivo es requerido"),
  folder: z.string().default("uploads"),
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
});

export type UploadFileResponse = z.infer<typeof UploadFileResponseSchema>;

/**
 * Esquema de validación Zod para la solicitud de purga de Bunny CDN.
 */
export const PurgeCdnRequestSchema = z.object({
  urlOrKey: z.string().optional(),
});

export type PurgeCdnRequest = z.infer<typeof PurgeCdnRequestSchema>;
