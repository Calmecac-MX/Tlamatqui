import { z } from "zod";
import { UserRoleSchema, LogoTypeSchema, SystemHealthStatusSchema } from "./common";

/**
 * Esquema de validación Zod para la configuración global del panel (Config).
 */
export const ConfigSchema = z.object({
  id: z.string().min(1),
  adminLogoUrl: z.string().default("/logo/Vector_Positivo.svg"),
  adminLogo2Url: z.string().default("/logo/Vector_Negativo.svg"),
  adminLogo3Url: z.string().optional(),
  adminTextUrl: z.string().default(""),
  appUrl: z.string().default(""),
  defaultContactEmail: z.string().default(""),
  defaultContactWhatsapp: z.string().default(""),
  customExchangeRate: z.number().default(20.0),
  userName: z.string().default(""),
  userEmail: z.string().default(""),
  userRole: UserRoleSchema.default("Superusuario"),
  userAvatar: z.string().default(""),
  metricsUpdateInterval: z.number().default(5000),
  tagline: z.string().optional(),
  brandCard1Title: z.string().optional(),
  brandCard1Desc: z.string().optional(),
  brandCard1Logo: z.string().optional(),
  brandCard1Link: z.string().optional(),
  brandCard2Title: z.string().optional(),
  brandCard2Desc: z.string().optional(),
  brandCard2Logo: z.string().optional(),
  brandCard2Link: z.string().optional(),
  finalSlideMainLogo: z.string().optional(),
  customDomainEnabled: z.boolean().optional(),
  customDomain: z.string().optional(),
  domainVerificationToken: z.string().optional(),
  domainVerified: z.boolean().optional(),
  domainVerifiedAt: z.string().optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

/**
 * Esquema de validación Zod para la configuración de marca y logotipo (LogoConfig).
 */
export const LogoConfigSchema = z.object({
  id: z.string().min(1),
  logoType: LogoTypeSchema.default("logo"),
  logoText: z.string().optional(),
  logoFile: z.string().optional(),
  globalEmail: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type LogoConfig = z.infer<typeof LogoConfigSchema>;

/**
 * Esquema de validación Zod para una llave de API (ApiKeyItem).
 */
export const ApiKeyItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  maskedKey: z.string().min(1),
  rawToken: z.string().optional(),
  status: z.enum(["active", "revoked"]).default("active"),
  createdByName: z.string().optional(),
  lastUsedAt: z.string().optional(),
  createdAt: z.string(),
});

export type ApiKeyItem = z.infer<typeof ApiKeyItemSchema>;

/**
 * Esquema de validación Zod para las métricas de monitoreo y salud del sistema.
 */
export const SystemHealthDataSchema = z.object({
  status: SystemHealthStatusSchema,
  uptimeSeconds: z.number(),
  memoryUsage: z.object({
    rssMB: z.number(),
    heapTotalMB: z.number(),
    heapUsedMB: z.number(),
    externalMB: z.number(),
  }),
  database: z.object({
    status: z.enum(["connected", "disconnected", "fallback_json"]),
    provider: z.string(),
    latencyMs: z.number(),
    counts: z.object({
      reports: z.number(),
      teams: z.number(),
      users: z.number(),
      templates: z.number(),
    }),
  }),
  serverInfo: z.object({
    nodeVersion: z.string(),
    platform: z.string(),
    environment: z.string(),
    apiLocked: z.boolean(),
    lockReason: z.string().optional(),
  }),
});

export type SystemHealthData = z.infer<typeof SystemHealthDataSchema>;
