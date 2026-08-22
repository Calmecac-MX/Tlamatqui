import { z } from "zod";

export const ToolSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "El nombre de la aplicación es requerido"),
  category: z.string().default("General"),
  costType: z.enum(["exact", "range"]).default("exact"),
  costExact: z.number().nonnegative().default(0),
  costMin: z.number().nonnegative().default(0),
  costMax: z.number().nonnegative().default(0),
  currency: z.enum(["MXN", "USD"]).default("USD"),
  semaphore: z.enum(["green", "yellow", "red"]).default("yellow"),
  url: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
});

export const ComparisonRowSchema = z.object({
  id: z.string().optional(),
  variable: z.string().min(1),
  shopify: z.string(),
  tiendanube: z.string(),
  pillText: z.string().default("Comparativa"),
});

export const ReportSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "El nombre del comercio es obligatorio"),
  logo: z.string().optional(),
  tagline: z.string().optional(),
  fugasCantidad: z.number().optional(),
  fugasRangoMin: z.number().optional(),
  fugasRangoMax: z.number().optional(),
  visitasMensuales: z.number().nonnegative().default(0),
  gmv: z.number().nonnegative().default(0),
  shopifyFee: z.number().optional(),
  msi: z.string().optional(),
  businessUrl: z.string().optional(),
  shopifyPlan: z.enum(["basic", "grow", "advanced", "plus", "custom"]).default("basic"),
  shopifyPlanCustomFee: z.number().optional(),
  shopifyPlanCustomPrice: z.number().optional(),
  shopifyAppsCostUSD: z.number().optional(),
  shopifyAppsCostMXN: z.number().optional(),
  tiendanubePlan: z.enum(["basic", "tiendanube", "advanced", "evolution"]).default("basic"),
  tools: z.array(ToolSchema).default([]),
  comparisonRows: z.array(ComparisonRowSchema).default([]),
  contactEmail: z.string().email().or(z.string().length(0)).default("cesar.ayar19@gmail.com"),
  contactWhatsapp: z.string().default("5512345678"),
  adminLogos: z.array(z.string()).default([]),
  teamId: z.string().optional(),
  createdBy: z.string().optional(),
});

export const TeamSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "El nombre del equipo es obligatorio"),
  image: z.string().optional(),
  ownerName: z.string().min(1),
  ownerEmail: z.string().email(),
  members: z.array(z.object({
    id: z.string().optional(),
    name: z.string(),
    email: z.string().email(),
    role: z.enum(["Superusuario", "Administrador", "Agente", "Visor"]),
    avatar: z.string().optional(),
  })).default([]),
});

export const ScrapeRequestSchema = z.object({
  url: z.string().min(1, "La URL del comercio es obligatoria"),
});

export const SendEmailRequestSchema = z.object({
  toEmail: z.string().email("Correo electrónico no válido"),
  reportId: z.string().min(1, "El ID del reporte es obligatorio"),
  customSubject: z.string().optional(),
  note: z.string().optional(),
  pdfBase64: z.string().optional(),
});

export type SendEmailRequest = z.infer<typeof SendEmailRequestSchema>;

export const SendTeamInviteEmailRequestSchema = z.object({
  toEmail: z.string().email("Correo electrónico no válido"),
  recipientName: z.string().optional(),
  role: z.enum(["Superusuario", "Administrador", "Agente", "Visor"]).default("Visor"),
  customNote: z.string().optional(),
});


export type SendTeamInviteEmailRequest = z.infer<typeof SendTeamInviteEmailRequestSchema>;

