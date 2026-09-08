import { z } from "zod";

/**
 * Esquema de validación Zod para la configuración de un dominio personalizado.
 */
export const CustomDomainConfigSchema = z.object({
  customDomainEnabled: z.boolean().default(false),
  customDomain: z.string().optional(),
  domainVerificationToken: z.string().optional(),
  domainVerified: z.boolean().default(false),
  domainVerifiedAt: z.string().optional(),
});

export type CustomDomainConfig = z.infer<typeof CustomDomainConfigSchema>;

/**
 * Esquema de validación Zod para el resultado del diagnóstico de verificación DNS.
 */
export const DomainVerificationResultSchema = z.object({
  verified: z.boolean(),
  domain: z.string(),
  challengeTxt: z.string(),
  resolvedRecords: z.array(z.string()).default([]),
  message: z.string(),
  timestamp: z.string(),
});

export type DomainVerificationResult = z.infer<typeof DomainVerificationResultSchema>;
