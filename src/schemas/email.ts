import { z } from "zod";

/**
 * Esquema de validación Zod para el envío de correos transaccionales.
 */
export const EmailPayloadSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1, "El asunto es requerido"),
  html: z.string().min(1, "El contenido HTML es requerido"),
  text: z.string().optional(),
  reportName: z.string().optional(),
  teamName: z.string().optional(),
  shareUrl: z.string().url().optional(),
  senderName: z.string().optional(),
});

export type EmailPayload = z.infer<typeof EmailPayloadSchema>;

/**
 * Esquema de validación Zod para el resultado del envío de un correo.
 */
export const EmailResultSchema = z.object({
  success: z.boolean(),
  provider: z.enum(["brevo_api", "smtp_nodemailer", "simulated"]),
  messageId: z.string().optional(),
  error: z.string().optional(),
});

export type EmailResult = z.infer<typeof EmailResultSchema>;

/**
 * Esquema de validación Zod para el estado de los proveedores de correo.
 */
export const EmailProviderStatusSchema = z.object({
  brevoConfigured: z.boolean(),
  smtpConfigured: z.boolean(),
  activeStrategy: z.string(),
});

export type EmailProviderStatus = z.infer<typeof EmailProviderStatusSchema>;
