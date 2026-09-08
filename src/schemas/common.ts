import { z } from "zod";

/**
 * Esquema y tipo para divisas soportadas en el sistema.
 */
export const CurrencySchema = z.enum(["MXN", "USD"]);
export type Currency = z.infer<typeof CurrencySchema>;

/**
 * Esquema y tipo para roles de usuario en el sistema RBAC.
 */
export const UserRoleSchema = z.enum(["Superusuario", "Administrador", "Agente", "Visor"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

/**
 * Esquema y tipo de semáforo de impacto financiero para herramientas de terceros.
 */
export const SemaphoreSchema = z.enum(["green", "yellow", "red"]);
export type Semaphore = z.infer<typeof SemaphoreSchema>;

/**
 * Esquema y tipo para el formato de logotipo en configuraciones de marca.
 */
export const LogoTypeSchema = z.enum(["text", "logo"]);
export type LogoType = z.infer<typeof LogoTypeSchema>;

/**
 * Esquema y tipo para el estado de salud y monitoreo del servidor.
 */
export const SystemHealthStatusSchema = z.enum(["healthy", "warning", "degraded"]);
export type SystemHealthStatus = z.infer<typeof SystemHealthStatusSchema>;
