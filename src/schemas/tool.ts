import { z } from "zod";
import { SemaphoreSchema } from "./common";

/**
 * Esquema de validación Zod para un plan de precios de una herramienta.
 */
export const ToolPricePlanSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  plan: z.string().min(1, "El nombre del plan es requerido"),
  precio: z.number().nonnegative("El precio no puede ser negativo"),
  moneda: z.string().default("USD"),
});

export type ToolPricePlan = z.infer<typeof ToolPricePlanSchema>;

/**
 * Esquema de validación Zod para una aplicación o herramienta de terceros.
 */
export const ToolSchema = z.object({
  id: z.string().min(1, "El ID de la herramienta es requerido"),
  name: z.string().min(1, "El nombre de la herramienta es requerido"),
  category: z.string().default("General"),
  costType: z.enum(["exact", "range"]).default("exact"),
  costExact: z.number().default(0),
  costMin: z.number().default(0),
  costMax: z.number().default(0),
  currency: z.enum(["MXN", "USD"]).default("USD"),
  semaphore: SemaphoreSchema.default("yellow"),
  url: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
  precios: z.array(ToolPricePlanSchema).optional(),
  selectedPlanId: z.union([z.string(), z.number()]).optional(),
});

export type Tool = z.infer<typeof ToolSchema>;
