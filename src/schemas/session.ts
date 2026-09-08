import { z } from "zod";
import { UserRoleSchema } from "./common";

/**
 * Esquema de validación Zod para el usuario almacenado en la cookie de sesión.
 */
export const SessionUserSchema = z.object({
  id: z.string().optional(),
  email: z.string().email(),
  name: z.string().optional(),
  role: UserRoleSchema.default("Administrador"),
  sub: z.string().optional(),
  avatar: z.string().optional(),
  createdAt: z.number(),
  exp: z.number(),
});

export type SessionUser = z.infer<typeof SessionUserSchema>;

/**
 * Esquema de validación Zod para la respuesta de verificación de sesión (/api/auth/session).
 */
export const SessionVerificationResponseSchema = z.object({
  authenticated: z.boolean(),
  user: SessionUserSchema.optional(),
  sessionSource: z.enum(["secure_cookie", "bearer_token"]).optional(),
  message: z.string().optional(),
  error: z.string().optional(),
});

export type SessionVerificationResponse = z.infer<typeof SessionVerificationResponseSchema>;
