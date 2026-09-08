import { z } from "zod";

/**
 * Esquema de validación Zod para el registro de interacciones y analítica en tiempo real.
 */
export const InteractionsSchema = z.object({
  slideViews: z.record(z.string(), z.number()).default({}),
  whatsappClicks: z.number().default(0),
  toolClicks: z.number().default(0),
  calculatorInteractions: z.number().default(0),
  timeSpentSeconds: z.number().default(0),
});

export type Interactions = z.infer<typeof InteractionsSchema>;

/**
 * Esquema de validación Zod para la subtabla de analítica de reporte.
 */
export const ReportAnalyticsSubtableSchema = z.object({
  id: z.string().optional(),
  reportId: z.string().optional(),
  viewCount: z.number().default(0),
  openCount: z.number().default(0),
  uniqueVisitors: z.number().default(0),
  uniqueVisitorIds: z.array(z.string()).default([]),
});

export type ReportAnalyticsSubtable = z.infer<typeof ReportAnalyticsSubtableSchema>;
