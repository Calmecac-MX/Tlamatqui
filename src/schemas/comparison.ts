import { z } from "zod";

/**
 * Esquema de validación Zod para una fila de la matriz comparativa.
 */
export const ComparisonRowSchema = z.object({
  id: z.string().min(1, "El ID de la fila es requerido"),
  variable: z.string().min(1, "La variable comparativa es requerida"),
  shopify: z.string().default(""),
  tiendanube: z.string().default(""),
  pillText: z.string().default(""),
});

export type ComparisonRow = z.infer<typeof ComparisonRowSchema>;

/**
 * Esquema de validación Zod para una plantilla de matriz comparativa.
 */
export const ComparisonTemplateSchema = z.object({
  id: z.string().min(1, "El ID de la plantilla es requerido"),
  name: z.string().min(1, "El nombre de la plantilla es requerido"),
  rows: z.array(ComparisonRowSchema).default([]),
});

export type ComparisonTemplate = z.infer<typeof ComparisonTemplateSchema>;
