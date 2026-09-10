import { z } from "zod";
import { UserRoleSchema } from "./common";

/**
 * Esquema de validación Zod para un miembro de socio/partner consultor.
 */
export const PartnerMemberSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  email: z.string().email(),
  role: z.string().optional(),
  partnerId: z.string().optional(),
});

export type PartnerMember = z.infer<typeof PartnerMemberSchema>;

/**
 * Esquema de validación Zod para una marca de socio/partner consultor.
 */
export const PartnerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  logo: z.string().default(""),
  description: z.string().optional(),
  link: z.string().optional(),
  representativeEmail: z.string().email().optional(),
  teamId: z.string().optional(),
  members: z.array(PartnerMemberSchema).default([]),
});

export type Partner = z.infer<typeof PartnerSchema>;

/**
 * Esquema de validación Zod para un miembro de equipo.
 */
export const TeamMemberSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  role: UserRoleSchema.default("Agente"),
  avatar: z.string().optional(),
  status: z.enum(["approved", "pending"]).default("approved"),
  isExternal: z.boolean().default(false),
  addedByAllyEmail: z.string().email().optional(),
  requestedAt: z.string().optional(),
});

export type TeamMember = z.infer<typeof TeamMemberSchema>;

/**
 * Esquema de validación Zod para una organización o aliado externo vinculado al equipo.
 */
export const AllySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  logo: z.string().optional(),
  url: z.string().optional(),
  website: z.string().optional(),
  teamId: z.string().optional(),
  representativeEmail: z.string().email().optional(),
  members: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().optional(),
      email: z.string().email(),
      role: z.string().optional(),
    })
  ).optional(),
});

export type Ally = z.infer<typeof AllySchema>;

/**
 * Esquema de validación Zod para la subtabla de configuración de reporte de equipo.
 */
export const TeamReportConfigSchema = z.object({
  id: z.string().optional(),
  configId: z.string().optional(),
  emailReport: z.string().optional(),
  phoneReport: z.number().optional(),
  userId: z.string().optional(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  }).optional(),
  reportLogos: z.array(z.string()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type TeamReportConfig = z.infer<typeof TeamReportConfigSchema>;

/**
 * Esquema de validación Zod para la subtabla de configuración de equipo.
 */
export const TeamConfigSchema = z.object({
  id: z.string().optional(),
  teamId: z.string().optional(),
  reportConfig: TeamReportConfigSchema.optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type TeamConfig = z.infer<typeof TeamConfigSchema>;

/**
 * Esquema de validación Zod para un espacio de trabajo o equipo completo.
 */
export const TeamSchema = z.object({
  id: z.string().min(1),
  slug: z.string().optional(),
  name: z.string().min(1),
  image: z.string().optional(),
  ownerName: z.string().min(1),
  ownerEmail: z.string().email(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  website: z.string().optional(),
  brandName: z.string().optional(),
  brandLogo: z.string().optional(),
  brandColor: z.string().optional(),
  members: z.array(TeamMemberSchema).default([]),
  inviteToken: z.string().optional(),
  inviteRole: UserRoleSchema.optional(),
  teamBrandName: z.string().optional(),
  teamBrandLogo: z.string().optional(),
  teamBrandWebsite: z.string().optional(),
  allies: z.array(AllySchema).optional(),
  partners: z.array(PartnerSchema).optional(),
  config: TeamConfigSchema.optional(),
  createdAt: z.string(),
});

export type Team = z.infer<typeof TeamSchema>;

/**
 * Esquema de validación Zod para una cuenta de usuario en el sistema.
 */
export const UserAccountSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
  role: UserRoleSchema.default("Agente"),
  avatar: z.string().optional(),
  sub: z.string().optional(),
  accessToken: z.string().optional(),
  idToken: z.string().optional(),
  tokenExpiresAt: z.string().optional(),
  lastLoginAt: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type UserAccount = z.infer<typeof UserAccountSchema>;
