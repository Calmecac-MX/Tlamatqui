import { z } from "zod";
import { ToolSchema } from "./tool";
import { ComparisonRowSchema } from "./comparison";
import { InteractionsSchema, ReportAnalyticsSubtableSchema } from "./telemetry";
import { TeamSchema } from "./team";

/**
 * Esquema de validación Zod para auditoría de rendimiento Google Lighthouse / Core Web Vitals.
 */
export const ReportPageSpeedSchema = z.object({
  id: z.string().optional(),
  reportId: z.string().optional(),
  performanceScore: z.number().optional(),
  performance: z.number().optional(),
  accessibilityScore: z.number().optional(),
  accessibility: z.number().optional(),
  bestPractices: z.number().optional(),
  seoScore: z.number().optional(),
  seo: z.number().optional(),
  fcp: z.string().optional(),
  lcp: z.string().optional(),
  tbt: z.string().optional(),
  cls: z.string().optional(),
  speedIndex: z.string().optional(),
  interactive: z.string().optional(),
  latencyMs: z.number().optional(),
  loadTimeSeconds: z.number().optional(),
  isDemo: z.boolean().optional(),
});

export type ReportPageSpeed = z.infer<typeof ReportPageSpeedSchema>;

/**
 * Esquema de validación Zod para la subtabla de métricas del reporte.
 */
export const ReportMetricsSubtableSchema = z.object({
  id: z.string().optional(),
  reportId: z.string().optional(),
  visitasMensuales: z.number().default(0),
  gmv: z.number().default(0),
  fugasCantidad: z.number().optional(),
  fugasRangoMin: z.number().optional(),
  fugasRangoMax: z.number().optional(),
});

export type ReportMetricsSubtable = z.infer<typeof ReportMetricsSubtableSchema>;

/**
 * Esquema de validación Zod para la subtabla de configuración de plataforma del reporte.
 */
export const ReportPlatformConfigSubtableSchema = z.object({
  id: z.string().optional(),
  reportId: z.string().optional(),
  shopifyPlan: z.enum(["basic", "grow", "advanced", "plus", "custom"]).default("basic"),
  shopifyFee: z.number().optional(),
  msi: z.string().optional(),
  shopifyPlanCustomFee: z.number().optional(),
  shopifyPlanCustomPrice: z.number().optional(),
  shopifyAppsCostUSD: z.number().optional(),
  shopifyAppsCostMXN: z.number().optional(),
  tiendanubePlan: z.enum(["basic", "tiendanube", "advanced", "evolution"]).default("tiendanube"),
});

export type ReportPlatformConfigSubtable = z.infer<typeof ReportPlatformConfigSubtableSchema>;

/**
 * Esquema de validación Zod compuesto para el Reporte completo de auditoría financiera.
 */
export const ReportSchema = z.object({
  id: z.string().min(1, "El ID del reporte es requerido"),
  name: z.string().min(1, "El nombre del reporte es requerido"),
  logo: z.string().optional(),
  tagline: z.string().optional(),
  fugasCantidad: z.number().optional(),
  fugasRangoMin: z.number().optional(),
  fugasRangoMax: z.number().optional(),
  visitasMensuales: z.number().default(0),
  gmv: z.number().default(0),
  shopifyFee: z.number().optional(),
  msi: z.string().optional(),
  businessUrl: z.string().optional(),
  shopifyPlan: z.enum(["basic", "grow", "advanced", "plus", "custom"]).default("basic"),
  shopifyPlanCustomFee: z.number().optional(),
  shopifyPlanCustomPrice: z.number().optional(),
  shopifyAppsCostUSD: z.number().optional(),
  shopifyAppsCostMXN: z.number().optional(),
  tiendanubePlan: z.enum(["basic", "tiendanube", "advanced", "evolution"]).default("tiendanube"),
  tools: z.array(ToolSchema).default([]),
  comparisonRows: z.array(ComparisonRowSchema).default([]),
  contactEmail: z.string().optional(),
  contactWhatsapp: z.string().optional(),
  adminLogos: z.array(z.string()).default([]),
  brandCard1Title: z.string().optional(),
  brandCard1Desc: z.string().optional(),
  brandCard1Logo: z.string().optional(),
  brandCard1Link: z.string().optional(),
  brandCard2Title: z.string().optional(),
  brandCard2Desc: z.string().optional(),
  brandCard2Logo: z.string().optional(),
  brandCard2Link: z.string().optional(),
  finalSlideMainLogo: z.string().optional(),
  finalSlideLogo2: z.string().optional(),
  finalSlideLogo3: z.string().optional(),
  detectedCms: z.string().optional(),
  activeTheme: z.string().optional(),
  screenshotDesktop: z.string().optional(),
  screenshotMobile: z.string().optional(),
  paymentGateways: z.array(z.string()).optional(),
  pixels: z.array(z.object({ name: z.string(), category: z.string().optional(), web: z.string().optional() })).optional(),
  infrastructure: z.array(z.object({ name: z.string(), category: z.string().optional(), web: z.string().optional() })).optional(),
  serverLocation: z.object({
    ip: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    ll: z.array(z.number()).optional(),
  }).optional(),
  serverLatencyMs: z.number().optional(),
  pageSpeed: ReportPageSpeedSchema.optional(),
  createdAt: z.string().optional(),
  viewCount: z.number().optional(),
  openCount: z.number().optional(),
  uniqueVisitors: z.number().optional(),
  uniqueVisitorIds: z.array(z.string()).optional(),
  teamId: z.string().optional(),
  team: TeamSchema.optional(),
  createdBy: z.string().optional(),
  interactions: InteractionsSchema.optional(),
  metrics: ReportMetricsSubtableSchema.optional(),
  platformConfig: ReportPlatformConfigSubtableSchema.optional(),
  analytics: ReportAnalyticsSubtableSchema.optional(),
});

export type Report = z.infer<typeof ReportSchema>;
