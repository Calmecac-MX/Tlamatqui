import dns from "node:dns/promises";
import crypto from "node:crypto";
import { getPrisma, isPrismaEnabled, ensureDatabaseSchema } from "./lib/prisma.js";
import {
  Team,
  TeamMember,
  Ally,
  Report,
  ComparisonTemplate,
  ComparisonRow,
  Tool,
  LogoConfig,
  UserAccount,
  UserRole,
  ApiKeyItem,
  SystemHealthData
} from "./types.js";
import { resolveTechnologyLogo } from "./scrapper.js";
import { encryptData, decryptData, encryptText, decryptText } from "./encryptionService.js";
import { resolveUserAvatar } from "./gravatarService.js";

// Caché ultra-rápido en RAM con TTL para acelerar lecturas frecuentes y evitar sobrecarga en la base de datos
const apiQueryCache = new Map<string, { data: any; expiresAt: number }>();

function getCachedQueryResult<T>(key: string): T | null {
  const item = apiQueryCache.get(key);
  if (item && Date.now() < item.expiresAt) {
    return item.data as T;
  }
  return null;
}

function setCachedQueryResult<T>(key: string, data: T, ttlMs: number = 3000): void {
  apiQueryCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function invalidateApiQueryCache(prefix?: string): void {
  if (!prefix) {
    apiQueryCache.clear();
    return;
  }
  for (const key of apiQueryCache.keys()) {
    if (key.startsWith(prefix)) {
      apiQueryCache.delete(key);
    }
  }
}

/**
 * Enuelve cualquier consulta asíncrona de Prisma en un límite de tiempo (timeout) de 5s.
 * Evita que bloqueos de red en el driver de base de datos demoren indefinidamente la respuesta.
 */
async function withDbTimeout<T>(promise: Promise<T>, ms: number = 5000): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Consulta a la base de datos excedió ${ms}ms.`)), ms);
  });
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timer!);
    return result;
  } catch (err) {
    clearTimeout(timer!);
    throw err;
  }
}

// ============================================================================
// VALORES POR DEFECTO Y SEMILLA INICIAL (ESTRICTAMENTE EN BASE DE DATOS)
// ============================================================================

const DEFAULT_CONFIG = {
  adminLogoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
  adminLogo2Url: "",
  adminLogo3Url: "",
  adminTextUrl: "Tlamatqui Diagnostics",
  appUrl: "http://localhost:3000",
  defaultContactEmail: "cesar.ayar19@gmail.com",
  defaultContactWhatsapp: "5512345678",
  customExchangeRate: 18.50,
  userName: "César Ayar",
  userEmail: "cesar.ayar19@gmail.com",
  userRole: "Administrador",
  userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
  metricsUpdateInterval: 30,
  tagline: "Auditoría Financiera y Simulación de Ahorros",
  brandCard1Title: "Evolución Digital",
  brandCard1Desc: "Expertos en migración y optimización de e-commerce.",
  brandCard1Logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
  brandCard1Link: "https://evolucion.mx",
  brandCard2Title: "Tiendanube Partner",
  brandCard2Desc: "Plataforma líder para escalar tu tienda online sin costos ocultos.",
  brandCard2Logo: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=100&q=80",
  brandCard2Link: "https://tiendanube.com",
  customDomain: "",
  domainVerificationToken: "tlamatqui-verify-sec_default_token",
  domainVerified: false
};

const DEFAULT_TEAMS: Team[] = [
  {
    id: "Calmécac",
    name: "Calmécac",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
    ownerName: "César Ayar",
    ownerEmail: "cesar.ayar19@gmail.com",
    contactEmail: "cesar.ayar19@gmail.com",
    contactPhone: "+52 9651057561",
    inviteToken: "team-inv-sec_e83b4c10a29f",
    inviteRole: "Agente",
    teamBrandName: "Calmécac",
    teamBrandLogo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
    teamBrandWebsite: "https://calmecac.lat",
    members: [
      {
        id: "mem_1",
        name: "César Ayar",
        email: "cesar.ayar19@gmail.com",
        role: "Superusuario",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
        status: "approved",
        isExternal: false
      }
    ],
    allies: [],
    config: {
      id: "tc_Calmécac",
      teamId: "Calmécac",
      reportConfig: {
        id: "trc_tc_Calmécac",
        configId: "tc_Calmécac",
        emailReport: "cesar.ayar19@gmail.com",
        phoneReport: 529651057561,
        reportLogos: []
      }
    },
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_TEMPLATES: ComparisonTemplate[] = [
  {
    id: "tpl_standard",
    name: "Comparativa Estándar (Shopify vs Tiendanube)",
    rows: [
      {
        id: "row_1",
        variable: "Costo de Transacción",
        shopify: "2.0% + $0.30 USD por venta (sin Shopify Payments)",
        tiendanube: "0% usando Pago Nube / Pasarelas integradas",
        pillText: "Ahorro Directo"
      },
      {
        id: "row_2",
        variable: "Soporte Técnico Local",
        shopify: "Tickets y soporte en inglés / bots",
        tiendanube: "Soporte 100% humano y en español",
        pillText: "Atención Humana"
      },
      {
        id: "row_3",
        variable: "Ecosistema de Aplicaciones",
        shopify: "Costos mensuales recurrentes en USD",
        tiendanube: "Herramientas clave nativas y en moneda local",
        pillText: "Menor Gasto Fijo"
      }
    ]
  }
];

const DEFAULT_REPORTS: Report[] = [];
const inMemoryReportsFallback: Map<string, Report> = new Map();

const DEFAULT_PARTNER = {
  id: "default",
  name: "Evolución Digital",
  logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
  description: "Consultoría especializada en optimización y migración estratégica de plataformas e-commerce.",
  link: "https://evolucion.mx",
  members: [
    {
      id: "mem_partner_1",
      name: "César Ayar",
      email: "cesar.ayar19@gmail.com",
      role: "Lead Consultant"
    }
  ]
};

const DEFAULT_LOGO_CONFIG: LogoConfig = {
  id: "default",
  logoType: "logo",
  logoText: "Tlamatqui",
  logoFile: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
  globalEmail: "cesar.ayar19@gmail.com"
};

// ============================================================================
// FUNCIONES AUXILIARES DE SANITIZACIÓN DE DATOS
// ============================================================================

function sanitizeInt(val: any, fallback = 0): number {
  const parsed = parseInt(String(val), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sanitizeFloat(val: any, fallback = 0): number {
  const parsed = parseFloat(String(val));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sanitizeShopifyPlan(val: any): "basic" | "grow" | "advanced" | "plus" | "custom" {
  const valid = ["basic", "grow", "advanced", "plus", "custom"];
  return valid.includes(val) ? val : "grow";
}

function sanitizeTiendanubePlan(val: any): "basic" | "tiendanube" | "advanced" | "evolution" {
  const valid = ["basic", "tiendanube", "advanced", "evolution"];
  return valid.includes(val) ? val : "evolution";
}

function sanitizeCostType(val: any): "exact" | "range" {
  return val === "range" ? "range" : "exact";
}

function sanitizeCurrency(val: any): "USD" | "MXN" {
  return val === "MXN" ? "MXN" : "USD";
}

function sanitizeSemaphore(val: any): "green" | "yellow" | "red" {
  const valid = ["green", "yellow", "red"];
  return valid.includes(val) ? val : "green";
}

function sanitizePageSpeed(pageSpeed: any): any {
  if (!pageSpeed || typeof pageSpeed !== "object") return null;
  return {
    performanceScore: sanitizeInt(pageSpeed.performanceScore, 0),
    accessibilityScore: sanitizeInt(pageSpeed.accessibilityScore, 0),
    seoScore: sanitizeInt(pageSpeed.seoScore, 0),
    fcp: pageSpeed.fcp ? String(pageSpeed.fcp).trim() : null,
    lcp: pageSpeed.lcp ? String(pageSpeed.lcp).trim() : null,
    tbt: pageSpeed.tbt ? String(pageSpeed.tbt).trim() : null,
    cls: pageSpeed.cls ? String(pageSpeed.cls).trim() : null,
    speedIndex: pageSpeed.speedIndex ? String(pageSpeed.speedIndex).trim() : null,
    interactive: pageSpeed.interactive ? String(pageSpeed.interactive).trim() : null,
    isDemo: Boolean(pageSpeed.isDemo)
  };
}

// ============================================================================
// INICIALIZACIÓN Y SEMILLA DE LA BASE DE DATOS (100% POSTGRESQL / PRISMA)
// ============================================================================

let isDatabaseInitialized = false;

export async function initializeDatabase() {
  if (isDatabaseInitialized) return;
  isDatabaseInitialized = true;

  if (!isPrismaEnabled()) {
    console.warn("Prisma no está configurado (DATABASE_URL no detectada).");
    return;
  }

  const prisma = getPrisma();
  if (!prisma) return;

  try {
    console.log("Verificando esquema y conectividad a PostgreSQL...");
    await ensureDatabaseSchema(prisma);

    // 1. Semilla Config
    const configCount = await prisma.config.count();
    if (configCount === 0) {
      console.log("Creando configuración global inicial en PostgreSQL...");
      await prisma.config.create({
        data: {
          id: "default",
          adminLogoUrl: DEFAULT_CONFIG.adminLogoUrl,
          adminLogo2Url: DEFAULT_CONFIG.adminLogo2Url,
          adminLogo3Url: DEFAULT_CONFIG.adminLogo3Url,
          adminTextUrl: DEFAULT_CONFIG.adminTextUrl,
          appUrl: DEFAULT_CONFIG.appUrl,
          defaultContactEmail: DEFAULT_CONFIG.defaultContactEmail,
          defaultContactWhatsapp: DEFAULT_CONFIG.defaultContactWhatsapp,
          customExchangeRate: DEFAULT_CONFIG.customExchangeRate,
          userName: DEFAULT_CONFIG.userName,
          userEmail: DEFAULT_CONFIG.userEmail,
          userRole: DEFAULT_CONFIG.userRole as any,
          userAvatar: DEFAULT_CONFIG.userAvatar,
          metricsUpdateInterval: DEFAULT_CONFIG.metricsUpdateInterval,
          brandCard1Title: DEFAULT_CONFIG.brandCard1Title,
          brandCard1Desc: DEFAULT_CONFIG.brandCard1Desc,
          brandCard1Logo: DEFAULT_CONFIG.brandCard1Logo,
          brandCard1Link: DEFAULT_CONFIG.brandCard1Link,
          brandCard2Title: DEFAULT_CONFIG.brandCard2Title,
          brandCard2Desc: DEFAULT_CONFIG.brandCard2Desc,
          brandCard2Logo: DEFAULT_CONFIG.brandCard2Logo,
          brandCard2Link: DEFAULT_CONFIG.brandCard2Link,
          domainVerificationToken: DEFAULT_CONFIG.domainVerificationToken
        }
      });
    }

    // 2. Semilla Teams & Members
    const teamsCount = await prisma.team.count();
    if (teamsCount === 0) {
      console.log("Creando equipos iniciales en PostgreSQL...");
      for (const t of DEFAULT_TEAMS) {
        await prisma.team.create({
          data: {
            id: t.id,
            name: t.name,
            image: t.image,
            ownerName: t.ownerName,
            ownerEmail: t.ownerEmail,
            inviteToken: t.inviteToken,
            inviteRole: (t.inviteRole as any) || "Agente",
            teamBrandName: t.teamBrandName,
            teamBrandLogo: t.teamBrandLogo,
            teamBrandWebsite: t.teamBrandWebsite,
            createdAt: new Date(t.createdAt),
            members: {
              create: t.members.map(m => ({
                id: m.id,
                name: m.name,
                email: m.email,
                role: m.role as any,
                avatar: m.avatar,
                status: m.status || "approved",
                isExternal: Boolean(m.isExternal)
              }))
            },
            config: t.config ? {
              create: {
                id: t.config.id || `tc_${t.id}`,
                reportConfig: t.config.reportConfig ? {
                  create: {
                    id: t.config.reportConfig.id || `trc_${t.id}`,
                    emailReport: t.config.reportConfig.emailReport || null,
                    phoneReport: t.config.reportConfig.phoneReport !== undefined ? Number(t.config.reportConfig.phoneReport) : null,
                    reportLogos: t.config.reportConfig.reportLogos || []
                  }
                } : undefined
              }
            } : undefined
          }
        });
      }
    }

    // 3. Semilla Comparison Templates
    const templatesCount = await prisma.comparisonTemplate.count();
    if (templatesCount === 0) {
      console.log("Creando plantillas comparativas iniciales en PostgreSQL...");
      for (const tp of DEFAULT_TEMPLATES) {
        await prisma.comparisonTemplate.create({
          data: {
            id: tp.id,
            name: tp.name,
            rows: {
              create: tp.rows.map(r => ({
                id: r.id,
                variable: r.variable,
                shopify: r.shopify,
                tiendanube: r.tiendanube,
                pillText: r.pillText
              }))
            }
          }
        });
      }
    }

    // 4. Semilla Partner
    const partnerCount = await prisma.partner.count();
    if (partnerCount === 0) {
      console.log("Creando Partner consultor inicial en PostgreSQL...");
      await prisma.partner.create({
        data: {
          id: DEFAULT_PARTNER.id,
          name: DEFAULT_PARTNER.name,
          logo: DEFAULT_PARTNER.logo,
          description: DEFAULT_PARTNER.description,
          link: DEFAULT_PARTNER.link,
          members: {
            create: DEFAULT_PARTNER.members.map(m => ({
              id: m.id,
              name: m.name,
              email: m.email,
              role: m.role
            }))
          }
        }
      });
    }

    // 5. Semilla LogoConfig
    const logoConfigCount = await prisma.logoConfig.count();
    if (logoConfigCount === 0) {
      console.log("Creando LogoConfig inicial en PostgreSQL...");
      await prisma.logoConfig.create({
        data: {
          id: "default",
          logoType: DEFAULT_LOGO_CONFIG.logoType as any,
          logoText: DEFAULT_LOGO_CONFIG.logoText,
          logoFile: DEFAULT_LOGO_CONFIG.logoFile,
          globalEmail: DEFAULT_LOGO_CONFIG.globalEmail
        }
      });
    }

    // 6. Semilla SystemSetting
    const systemSettingCount = await prisma.systemSetting.count();
    if (systemSettingCount === 0) {
      await prisma.systemSetting.create({
        data: {
          id: "default",
          apiLocked: false,
          lockReason: "Mantenimiento programado de la API"
        }
      });
    }

    console.log("🟢 Inicialización y sincronización de base de datos PostgreSQL completada.");
  } catch (error) {
    console.error("Error durante la inicialización de la base de datos:", error);
  }
}

// ============================================================================
// CONFIG CRUD OPERATORS (POSTGRESQL)
// ============================================================================

export async function getDbConfig(): Promise<any> {
  const cachedConfig = getCachedQueryResult<any>("config");
  if (cachedConfig) return cachedConfig;

  let config: any = null;
  const prisma = getPrisma();
  if (prisma) {
    try {
      const raw = await withDbTimeout(prisma.config.findUnique({ where: { id: "default" } }), 3500);
      if (raw) {
        config = decryptData(raw);
      } else {
        // Auto-crear si no existe en la BD
        const created = await prisma.config.create({
          data: {
            id: "default",
            adminLogoUrl: DEFAULT_CONFIG.adminLogoUrl,
            adminLogo2Url: DEFAULT_CONFIG.adminLogo2Url,
            adminLogo3Url: DEFAULT_CONFIG.adminLogo3Url,
            adminTextUrl: DEFAULT_CONFIG.adminTextUrl,
            appUrl: DEFAULT_CONFIG.appUrl,
            defaultContactEmail: DEFAULT_CONFIG.defaultContactEmail,
            defaultContactWhatsapp: DEFAULT_CONFIG.defaultContactWhatsapp,
            customExchangeRate: DEFAULT_CONFIG.customExchangeRate,
            userName: DEFAULT_CONFIG.userName,
            userEmail: DEFAULT_CONFIG.userEmail,
            userRole: DEFAULT_CONFIG.userRole as any,
            userAvatar: DEFAULT_CONFIG.userAvatar,
            metricsUpdateInterval: DEFAULT_CONFIG.metricsUpdateInterval,
            domainVerificationToken: DEFAULT_CONFIG.domainVerificationToken
          }
        });
        config = decryptData(created);
      }
    } catch (err) {
      console.error("Error reading config from database:", err);
    }
  }

  if (!config) {
    config = { ...DEFAULT_CONFIG };
  }

  if (!config.domainVerificationToken) {
    config.domainVerificationToken = "tlamatqui-verify-sec_default_token";
  }

  setCachedQueryResult("config", config, 10000);
  return config;
}

export async function saveDbConfig(config: any): Promise<any> {
  const currentConfig = await getDbConfig().catch(() => ({}));
  const cleanConfig = {
    adminLogoUrl: config.adminLogoUrl || DEFAULT_CONFIG.adminLogoUrl,
    adminLogo2Url: config.adminLogo2Url !== undefined ? config.adminLogo2Url : (currentConfig.adminLogo2Url || ""),
    adminLogo3Url: config.adminLogo3Url !== undefined ? config.adminLogo3Url : (currentConfig.adminLogo3Url || ""),
    adminTextUrl: config.adminTextUrl || DEFAULT_CONFIG.adminTextUrl,
    appUrl: config.appUrl || DEFAULT_CONFIG.appUrl,
    defaultContactEmail: config.defaultContactEmail || DEFAULT_CONFIG.defaultContactEmail,
    defaultContactWhatsapp: config.defaultContactWhatsapp || DEFAULT_CONFIG.defaultContactWhatsapp,
    customExchangeRate: Number(config.customExchangeRate) || DEFAULT_CONFIG.customExchangeRate,
    userName: config.userName || DEFAULT_CONFIG.userName,
    userEmail: config.userEmail || DEFAULT_CONFIG.userEmail,
    userRole: config.userRole || DEFAULT_CONFIG.userRole,
    userAvatar: config.userAvatar || DEFAULT_CONFIG.userAvatar,
    metricsUpdateInterval: Number(config.metricsUpdateInterval) || DEFAULT_CONFIG.metricsUpdateInterval,
    tagline: config.tagline !== undefined ? config.tagline : (currentConfig.tagline || "Auditoría Financiera y Simulación de Ahorros"),
    brandCard1Title: config.brandCard1Title !== undefined ? config.brandCard1Title : (currentConfig.brandCard1Title || null),
    brandCard1Desc: config.brandCard1Desc !== undefined ? config.brandCard1Desc : (currentConfig.brandCard1Desc || null),
    brandCard1Logo: config.brandCard1Logo !== undefined ? config.brandCard1Logo : (currentConfig.brandCard1Logo || null),
    brandCard1Link: config.brandCard1Link !== undefined ? config.brandCard1Link : (currentConfig.brandCard1Link || null),
    brandCard2Title: config.brandCard2Title !== undefined ? config.brandCard2Title : (currentConfig.brandCard2Title || null),
    brandCard2Desc: config.brandCard2Desc !== undefined ? config.brandCard2Desc : (currentConfig.brandCard2Desc || null),
    brandCard2Logo: config.brandCard2Logo !== undefined ? config.brandCard2Logo : (currentConfig.brandCard2Logo || null),
    brandCard2Link: config.brandCard2Link !== undefined ? config.brandCard2Link : (currentConfig.brandCard2Link || null),
    customDomain: config.customDomain !== undefined ? config.customDomain : (currentConfig.customDomain || null),
    domainVerificationToken: currentConfig.domainVerificationToken || `tlamatqui-verify-sec_${crypto.randomBytes(8).toString("hex")}`,
    domainVerified: config.domainVerified !== undefined ? Boolean(config.domainVerified) : Boolean(currentConfig.domainVerified)
  };

  const prisma = getPrisma();
  if (prisma) {
    try {
      await prisma.config.upsert({
        where: { id: "default" },
        update: {
          ...cleanConfig,
          userRole: cleanConfig.userRole as any
        },
        create: {
          id: "default",
          ...cleanConfig,
          userRole: cleanConfig.userRole as any
        }
      });
    } catch (err) {
      console.error("Error saving config to database:", err);
    }
  }

  invalidateApiQueryCache("config");
  setCachedQueryResult("config", cleanConfig, 10000);
  return cleanConfig;
}

export async function verifyCustomDomainDNS(rawDomain: string, expectedToken: string): Promise<{ success: boolean; message: string; config?: any }> {
  const domain = rawDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  if (!domain || domain.length < 3 || !domain.includes(".")) {
    return { success: false, message: "Dominio inválido. Ingresa un FQDN válido (ejemplo: portal.midominio.com)." };
  }

  const recordName = `_tlamatqui-challenge.${domain}`;

  try {
    const txtRecords = await dns.resolveTxt(recordName);
    const flatRecords = txtRecords.map(chunk => chunk.join(""));
    const tokenFound = flatRecords.some(r => r.trim() === expectedToken.trim());

    if (tokenFound) {
      const updatedConfig = await saveDbConfig({
        customDomain: domain,
        domainVerified: true
      });

      return {
        success: true,
        message: `Dominio '${domain}' verificado exitosamente mediante registro TXT DNS.`,
        config: updatedConfig
      };
    } else {
      return {
        success: false,
        message: `Se encontró el registro TXT en '${recordName}', pero el valor no coincide con el token de verificación esperado.`
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `No se pudo encontrar el registro TXT en '${recordName}'. Verifica que esté propagado globalmente en tus servidores DNS.`
    };
  }
}

// ============================================================================
// TEAMS CRUD OPERATORS (POSTGRESQL)
// ============================================================================

export async function getDbTeams(): Promise<Team[]> {
  const cachedTeams = getCachedQueryResult<Team[]>("teams");
  if (cachedTeams) return cachedTeams;

  let result: Team[] = [];
  const prisma = getPrisma();
  if (prisma) {
    try {
      const teams = await withDbTimeout(
        prisma.team.findMany({
          include: {
            members: true,
            partners: {
              include: { members: true }
            },
            config: {
              include: {
                reportConfig: true
              }
            }
          },
          orderBy: { createdAt: "desc" }
        }),
        3500
      );

      result = (teams as any[]).map((t: any) => ({
        id: t.id,
        name: t.name,
        image: t.image || undefined,
        ownerName: t.ownerName,
        ownerEmail: t.ownerEmail,
        contactEmail: t.contactEmail || undefined,
        contactPhone: t.contactPhone || undefined,
        inviteToken: t.inviteToken || undefined,
        inviteRole: (t.inviteRole as any) || "Visor",
        teamBrandName: t.teamBrandName || undefined,
        teamBrandLogo: t.teamBrandLogo || undefined,
        teamBrandWebsite: t.teamBrandWebsite || undefined,
        members: (t.members || []).map((m: any) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          role: m.role as any,
          avatar: m.avatar || undefined,
          status: (m.status as any) || "approved",
          isExternal: Boolean(m.isExternal),
          partnerEmail: m.partnerEmail || undefined,
          addedByAllyEmail: m.partnerEmail || undefined,
          requestedAt: m.requestedAt ? m.requestedAt.toISOString() : undefined
        })),
        allies: (t.partners || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          logo: p.logo,
          url: p.link || "",
          description: p.description || undefined,
          representativeEmail: p.representativeEmail || undefined,
          teamId: p.teamId || undefined,
          members: (p.members || []).map((pm: any) => ({
            id: pm.id,
            name: pm.name,
            email: pm.email,
            role: pm.role
          }))
        })),
        config: t.config ? {
          id: t.config.id,
          teamId: t.config.teamId,
          reportConfig: t.config.reportConfig ? {
            id: t.config.reportConfig.id,
            configId: t.config.reportConfig.configId,
            emailReport: t.config.reportConfig.emailReport || undefined,
            phoneReport: t.config.reportConfig.phoneReport !== null && t.config.reportConfig.phoneReport !== undefined ? Number(t.config.reportConfig.phoneReport) : undefined,
            userId: t.config.reportConfig.userId || undefined,
            reportLogos: Array.isArray(t.config.reportConfig.reportLogos) ? (t.config.reportConfig.reportLogos as any) : [],
            createdAt: t.config.reportConfig.createdAt?.toISOString(),
            updatedAt: t.config.reportConfig.updatedAt?.toISOString()
          } : undefined,
          createdAt: t.config.createdAt?.toISOString(),
          updatedAt: t.config.updatedAt?.toISOString()
        } : undefined,
        createdAt: t.createdAt.toISOString()
      }));
    } catch (err) {
      console.error("Error fetching teams from database:", err);
    }
  }

  setCachedQueryResult("teams", result, 3000);
  return result;
}

export async function getDbTeamById(id: string): Promise<Team | null> {
  const cleanId = String(id).trim();
  const prisma = getPrisma();
  if (prisma) {
    try {
      const t: any = await prisma.team.findUnique({
        where: { id: cleanId },
        include: {
          members: true,
          partners: {
            include: { members: true }
          },
          config: {
            include: {
              reportConfig: true
            }
          }
        }
      });

      if (t) {
        return {
          id: t.id,
          name: t.name,
          image: t.image || undefined,
          ownerName: t.ownerName,
          ownerEmail: t.ownerEmail,
          contactEmail: t.contactEmail || undefined,
          contactPhone: t.contactPhone || undefined,
          inviteToken: t.inviteToken || undefined,
          inviteRole: (t.inviteRole as any) || "Visor",
          teamBrandName: t.teamBrandName || undefined,
          teamBrandLogo: t.teamBrandLogo || undefined,
          teamBrandWebsite: t.teamBrandWebsite || undefined,
          members: (t.members || []).map((m: any) => ({
            id: m.id,
            name: m.name,
            email: m.email,
            role: m.role as any,
            avatar: m.avatar || undefined,
            status: (m.status as any) || "approved",
            isExternal: Boolean(m.isExternal),
            partnerEmail: m.partnerEmail || undefined,
            requestedAt: m.requestedAt ? m.requestedAt.toISOString() : undefined
          })),
          allies: (t.partners || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            logo: p.logo,
            url: p.link || "",
            description: p.description || undefined,
            representativeEmail: p.representativeEmail || undefined,
            teamId: p.teamId || undefined,
            members: (p.members || []).map((pm: any) => ({
              id: pm.id,
              name: pm.name,
              email: pm.email,
              role: pm.role
            }))
          })),
          config: t.config ? {
            id: t.config.id,
            teamId: t.config.teamId,
            reportConfig: t.config.reportConfig ? {
              id: t.config.reportConfig.id,
              configId: t.config.reportConfig.configId,
              emailReport: t.config.reportConfig.emailReport || undefined,
              phoneReport: t.config.reportConfig.phoneReport !== null && t.config.reportConfig.phoneReport !== undefined ? Number(t.config.reportConfig.phoneReport) : undefined,
              userId: t.config.reportConfig.userId || undefined,
              reportLogos: Array.isArray(t.config.reportConfig.reportLogos) ? (t.config.reportConfig.reportLogos as any) : [],
              createdAt: t.config.reportConfig.createdAt?.toISOString(),
              updatedAt: t.config.reportConfig.updatedAt?.toISOString()
            } : undefined,
            createdAt: t.config.createdAt?.toISOString(),
            updatedAt: t.config.updatedAt?.toISOString()
          } : undefined,
          createdAt: t.createdAt.toISOString()
        };
      }
    } catch (err) {
      console.error("Error fetching team by ID from database:", err);
    }
  }
  return null;
}

/**
 * Genera el slug base del equipo a partir del nombre:
 * - Convierte espacios en guiones medios (-)
 * - Mantiene mayúsculas y minúsculas intactas
 * - Limpia caracteres inválidos de URI/ID manteniendo letras (con acentos), números y guiones
 */
export function slugifyTeamName(name: string): string {
  if (!name || typeof name !== "string") {
    return `Equipo-${Date.now()}`;
  }
  const trimmed = name.trim();
  const slug = trimmed
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\-_]/g, "");

  return slug.length > 0 ? slug : `Equipo-${Date.now()}`;
}

/**
 * Garantiza la unicidad del ID de un equipo en la base de datos o almacenamiento local.
 * Si ya existe otro equipo con el mismo slug (y no es el mismo registro siendo editado),
 * agrega sufijos numéricos (-2, -3, etc.).
 */
export async function generateUniqueTeamId(name: string, excludeTeamId?: string): Promise<string> {
  const baseSlug = slugifyTeamName(name);
  let candidate = baseSlug;
  let counter = 1;

  const prisma = getPrisma();
  if (prisma) {
    while (true) {
      const existing = await prisma.team.findUnique({
        where: { id: candidate },
        select: { id: true }
      }).catch(() => null);

      if (!existing || (excludeTeamId && existing.id === excludeTeamId)) {
        return candidate;
      }
      counter++;
      candidate = `${baseSlug}-${counter}`;
    }
  }

  // Fallback en memoria / JSON
  const existingTeams = await getDbTeams();
  while (true) {
    const exists = existingTeams.some(t => t.id === candidate && t.id !== excludeTeamId);
    if (!exists) {
      return candidate;
    }
    counter++;
    candidate = `${baseSlug}-${counter}`;
  }
}

export async function saveDbTeam(team: Team): Promise<Team> {
  // Asegurar que el ID sea generado a partir del nombre si es un nuevo equipo o si viene con prefijo temporal
  const finalId = (!team.id || team.id.startsWith("team-") || team.id === "new")
    ? await generateUniqueTeamId(team.name || "Equipo", team.id)
    : team.id;

  const cleanTeam: Team = {
    ...team,
    id: finalId,
    inviteToken: team.inviteToken || `team-inv-sec_${crypto.randomBytes(6).toString("hex")}`,
    inviteRole: team.inviteRole || "Visor",
    members: (team.members || []).map(m => ({
      ...m,
      status: m.status || "approved",
      isExternal: Boolean(m.isExternal),
      addedByAllyEmail: m.addedByAllyEmail || undefined
    })),
    allies: (team.allies || []).map(a => ({
      ...a,
      id: a.id || "ally-" + Math.random().toString(36).substring(2, 11),
      members: a.members || []
    })),
    createdAt: team.createdAt || new Date().toISOString()
  };

  const prisma = getPrisma();
  if (prisma) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.teamMember.deleteMany({ where: { teamId: cleanTeam.id } });
        await tx.partner.deleteMany({ where: { teamId: cleanTeam.id } });

        await tx.team.upsert({
          where: { id: cleanTeam.id },
          update: {
            name: cleanTeam.name,
            image: cleanTeam.image || null,
            ownerName: cleanTeam.ownerName,
            ownerEmail: cleanTeam.ownerEmail,
            contactEmail: (cleanTeam as any).contactEmail || null,
            contactPhone: (cleanTeam as any).contactPhone || null,
            inviteToken: cleanTeam.inviteToken,
            inviteRole: (cleanTeam.inviteRole as any) || "Visor",
            teamBrandName: cleanTeam.teamBrandName || null,
            teamBrandLogo: cleanTeam.teamBrandLogo || null,
            teamBrandWebsite: cleanTeam.teamBrandWebsite || null,
            members: {
              create: cleanTeam.members.map(m => ({
                id: m.id || `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                name: m.name,
                email: m.email,
                role: m.role as any,
                avatar: m.avatar || null,
                status: m.status || "approved",
                isExternal: Boolean(m.isExternal),
                partnerEmail: (m as any).partnerEmail || m.addedByAllyEmail || null,
                requestedAt: m.requestedAt ? new Date(m.requestedAt) : (m.status === "pending" ? new Date() : null)
              }))
            },
            partners: {
              create: (cleanTeam.allies || (cleanTeam as any).partners || []).map(a => ({
                id: a.id || `partner-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                name: a.name,
                logo: a.logo,
                link: a.url || (a as any).link || null,
                description: (a as any).description || null,
                representativeEmail: a.representativeEmail || null,
                members: {
                  create: (a.members || []).map((pm: any) => ({
                    id: pm.id || `pm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                    name: pm.name,
                    email: pm.email,
                    role: pm.role || "Lector"
                  }))
                }
              }))
            }
          },
          create: {
            id: cleanTeam.id,
            name: cleanTeam.name,
            image: cleanTeam.image || null,
            ownerName: cleanTeam.ownerName,
            ownerEmail: cleanTeam.ownerEmail,
            contactEmail: (cleanTeam as any).contactEmail || null,
            contactPhone: (cleanTeam as any).contactPhone || null,
            inviteToken: cleanTeam.inviteToken,
            inviteRole: (cleanTeam.inviteRole as any) || "Visor",
            teamBrandName: cleanTeam.teamBrandName || null,
            teamBrandLogo: cleanTeam.teamBrandLogo || null,
            teamBrandWebsite: cleanTeam.teamBrandWebsite || null,
            createdAt: cleanTeam.createdAt ? new Date(cleanTeam.createdAt) : new Date(),
            members: {
              create: cleanTeam.members.map(m => ({
                id: m.id || `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                name: m.name,
                email: m.email,
                role: m.role as any,
                avatar: m.avatar || null,
                status: m.status || "approved",
                isExternal: Boolean(m.isExternal),
                partnerEmail: (m as any).partnerEmail || m.addedByAllyEmail || null,
                requestedAt: m.requestedAt ? new Date(m.requestedAt) : (m.status === "pending" ? new Date() : null)
              }))
            },
            partners: {
              create: (cleanTeam.allies || (cleanTeam as any).partners || []).map(a => ({
                id: a.id || `partner-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                name: a.name,
                logo: a.logo,
                link: a.url || (a as any).link || null,
                description: (a as any).description || null,
                representativeEmail: a.representativeEmail || null,
                members: {
                  create: (a.members || []).map((pm: any) => ({
                    id: pm.id || `pm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                    name: pm.name,
                    email: pm.email,
                    role: pm.role || "Lector"
                  }))
                }
              }))
            }
          }
        });

        // Configuración y subtabla ReportConfig del equipo
        if (cleanTeam.config) {
          const teamConfig = await tx.teamConfig.upsert({
            where: { teamId: cleanTeam.id },
            update: {},
            create: {
              id: cleanTeam.config.id || `tc-${cleanTeam.id}`,
              teamId: cleanTeam.id
            }
          });

          if (cleanTeam.config.reportConfig) {
            const rc = cleanTeam.config.reportConfig;
            await tx.teamReportConfig.upsert({
              where: { configId: teamConfig.id },
              update: {
                emailReport: rc.emailReport || null,
                phoneReport: rc.phoneReport !== undefined && rc.phoneReport !== null ? Number(rc.phoneReport) : null,
                userId: rc.userId || null,
                reportLogos: Array.isArray(rc.reportLogos) ? rc.reportLogos : []
              },
              create: {
                id: rc.id || `trc-${teamConfig.id}`,
                configId: teamConfig.id,
                emailReport: rc.emailReport || null,
                phoneReport: rc.phoneReport !== undefined && rc.phoneReport !== null ? Number(rc.phoneReport) : null,
                userId: rc.userId || null,
                reportLogos: Array.isArray(rc.reportLogos) ? rc.reportLogos : []
              }
            });
          }
        }
      });

      invalidateApiQueryCache("teams");
      return cleanTeam;
    } catch (err) {
      console.error("Error saving team to database:", err);
    }
  }

  invalidateApiQueryCache("teams");
  return cleanTeam;
}

export async function deleteDbTeam(id: string): Promise<boolean> {
  const prisma = getPrisma();
  if (prisma) {
    try {
      await prisma.team.delete({ where: { id } });
      invalidateApiQueryCache("teams");
      return true;
    } catch (err) {
      console.error("Error deleting team from database:", err);
    }
  }
  return false;
}

export async function getTeamByInviteToken(token: string): Promise<Team | null> {
  if (!token || token.trim() === "") return null;
  const teams = await getDbTeams();
  return teams.find(t => t.inviteToken === token.trim()) || null;
}

export async function resetTeamInviteToken(teamId: string): Promise<Team | null> {
  const team = await getDbTeamById(teamId);
  if (!team) return null;

  team.inviteToken = `team-inv-sec_${crypto.randomBytes(6).toString("hex")}`;
  return await saveDbTeam(team);
}

export async function joinTeamViaInviteToken(
  token: string,
  name: string,
  email: string,
  avatar?: string
): Promise<{ success: boolean; message: string; pendingApproval?: boolean; team?: Team; member?: any }> {
  const team = await getTeamByInviteToken(token);
  if (!team) {
    return { success: false, message: "El enlace de invitación no es válido o ha caducado." };
  }

  if (!email || !email.includes("@")) {
    return { success: false, message: "Ingresa un correo electrónico válido." };
  }

  const cleanEmail = email.trim().toLowerCase();
  const existingMember = team.members.find(m => m.email.toLowerCase() === cleanEmail);

  if (existingMember) {
    if (existingMember.status === "pending") {
      return {
        success: true,
        pendingApproval: true,
        message: `Tu solicitud para unirte al equipo '${team.name}' ya fue recibida y está en espera de aprobación por el dueño del equipo.`,
        team,
        member: existingMember
      };
    }

    return {
      success: true,
      pendingApproval: false,
      message: `¡Ya formas parte activa del equipo '${team.name}'!`,
      team,
      member: existingMember
    };
  }

  const memberAvatar = await resolveUserAvatar(cleanEmail, avatar, name);

  const newMember = {
    id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim() || cleanEmail.split("@")[0],
    email: cleanEmail,
    role: team.inviteRole || "Visor",
    avatar: memberAvatar,
    status: "pending" as const,
    isExternal: false,
    requestedAt: new Date().toISOString()
  };

  team.members.push(newMember);
  const updatedTeam = await saveDbTeam(team);

  return {
    success: true,
    pendingApproval: true,
    message: `¡Solicitud enviada! Al no estar pre-registrado, tu ingreso al equipo '${team.name}' está en espera de aprobación por el administrador.`,
    team: updatedTeam,
    member: newMember
  };
}

export async function approveTeamMember(
  teamId: string,
  memberId: string
): Promise<{ success: boolean; message: string; team?: Team }> {
  const team = await getDbTeamById(teamId);
  if (!team) {
    return { success: false, message: "Equipo no encontrado" };
  }

  const member = team.members.find(m => m.id === memberId);
  if (!member) {
    return { success: false, message: "Miembro no encontrado en el equipo" };
  }

  member.status = "approved";
  const updatedTeam = await saveDbTeam(team);

  // Sincronizar el rol del usuario en la base de datos
  const prisma = getPrisma();
  if (prisma) {
    try {
      const dbUser = await prisma.user.findFirst({ where: { email: { equals: member.email, mode: "insensitive" } } });
      if (dbUser && (dbUser.role === "Visor" || !dbUser.role)) {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { role: (member.role || "Agente") as any }
        });
      }
    } catch (e) {
      console.warn("No se pudo actualizar el rol de la cuenta del usuario en BD:", e);
    }
  }

  return {
    success: true,
    message: `El miembro '${member.name}' ha sido aprobado exitosamente.`,
    team: updatedTeam
  };
}

export async function rejectTeamMember(
  teamId: string,
  memberId: string
): Promise<{ success: boolean; message: string; team?: Team }> {
  const team = await getDbTeamById(teamId);
  if (!team) {
    return { success: false, message: "Equipo no encontrado" };
  }

  const memberIndex = team.members.findIndex(m => m.id === memberId);
  if (memberIndex === -1) {
    return { success: false, message: "Miembro no encontrado en el equipo" };
  }

  const removed = team.members.splice(memberIndex, 1)[0];
  const updatedTeam = await saveDbTeam(team);

  return {
    success: true,
    message: `La solicitud de '${removed.name}' ha sido rechazada y eliminada.`,
    team: updatedTeam
  };
}

export async function addExternalAllyMember(
  teamId: string,
  allyId: string,
  memberData: { name: string; email: string }
): Promise<{ success: boolean; message: string; team?: Team }> {
  const team = await getDbTeamById(teamId);
  if (!team) {
    return { success: false, message: "Equipo no encontrado" };
  }

  const ally = (team.allies || []).find(a => a.id === allyId);
  if (!ally) {
    return { success: false, message: "Aliado no encontrado en el equipo" };
  }

  const cleanEmail = memberData.email.trim().toLowerCase();
  if (!cleanEmail.includes("@")) {
    return { success: false, message: "Correo no válido" };
  }

  if (team.members.some(m => m.email.toLowerCase() === cleanEmail)) {
    return { success: false, message: "Este correo ya está registrado en el equipo" };
  }

  const newExtMember: TeamMember = {
    id: `mem-ext-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: memberData.name.trim() || cleanEmail.split("@")[0],
    email: cleanEmail,
    role: "Visor",
    avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80`,
    status: "approved",
    isExternal: true,
    addedByAllyEmail: ally.representativeEmail || undefined
  };

  team.members.push(newExtMember);
  if (!ally.members) ally.members = [];
  ally.members.push({ id: newExtMember.id, name: newExtMember.name, email: newExtMember.email, role: "Visor" });

  const updatedTeam = await saveDbTeam(team);
  return {
    success: true,
    message: `Miembro externo '${newExtMember.name}' agregado exitosamente como Visor.`,
    team: updatedTeam
  };
}

// ============================================================================
// REPORTS CRUD OPERATORS (POSTGRESQL)
// ============================================================================

function mapPrismaReportToDomain(r: any): Report {
  const m = r.metrics || {};
  const pc = r.platformConfig || {};
  const a = r.analytics || {};

  return {
    id: r.id,
    name: r.name,
    logo: r.logo || undefined,
    tagline: r.tagline || undefined,
    businessUrl: r.businessUrl || undefined,
    fugasCantidad: m.fugasCantidad ?? r.fugasCantidad ?? 0,
    fugasRangoMin: m.fugasRangoMin ?? r.fugasRangoMin ?? 0,
    fugasRangoMax: m.fugasRangoMax ?? r.fugasRangoMax ?? 0,
    visitasMensuales: m.visitasMensuales ?? r.visitasMensuales ?? 0,
    gmv: m.gmv ?? r.gmv ?? 0,
    shopifyFee: pc.shopifyFee ?? r.shopifyFee ?? 0,
    msi: pc.msi || r.msi || undefined,
    shopifyPlan: (pc.shopifyPlan || r.shopifyPlan || "grow") as any,
    shopifyPlanCustomFee: pc.shopifyPlanCustomFee ?? r.shopifyPlanCustomFee ?? undefined,
    shopifyPlanCustomPrice: pc.shopifyPlanCustomPrice ?? r.shopifyPlanCustomPrice ?? undefined,
    shopifyAppsCostUSD: pc.shopifyAppsCostUSD ?? r.shopifyAppsCostUSD ?? undefined,
    shopifyAppsCostMXN: pc.shopifyAppsCostMXN ?? r.shopifyAppsCostMXN ?? undefined,
    tiendanubePlan: (pc.tiendanubePlan || r.tiendanubePlan || "evolution") as any,
    detectedCms: r.detectedCms || undefined,
    activeTheme: r.activeTheme || undefined,
    screenshotDesktop: r.screenshotDesktop || undefined,
    screenshotMobile: r.screenshotMobile || undefined,
    paymentGateways: (r.paymentGateways as any as string[]) || undefined,
    pixels: (r.pixels as any) || undefined,
    infrastructure: (r.infrastructure as any) || undefined,
    serverLocation: (r.serverLocation as any) || undefined,
    serverLatencyMs: r.serverLatencyMs || undefined,
    pageSpeed: r.pageSpeed ? {
      id: r.pageSpeed.id,
      performanceScore: r.pageSpeed.performanceScore,
      accessibilityScore: r.pageSpeed.accessibilityScore,
      seoScore: r.pageSpeed.seoScore,
      fcp: r.pageSpeed.fcp || undefined,
      lcp: r.pageSpeed.lcp || undefined,
      tbt: r.pageSpeed.tbt || undefined,
      cls: r.pageSpeed.cls || undefined,
      speedIndex: r.pageSpeed.speedIndex || undefined,
      interactive: r.pageSpeed.interactive || undefined,
      isDemo: r.pageSpeed.isDemo
    } : undefined,
    tools: (r.tools || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      category: t.category,
      costType: t.costType as any,
      costExact: t.costExact,
      costMin: t.costMin,
      costMax: t.costMax,
      currency: t.currency as any,
      semaphore: t.semaphore as any,
      url: t.url || undefined,
      description: t.description || undefined,
      logo: resolveTechnologyLogo(t.name, t.url, t.logo)
    })),
    comparisonRows: (r.comparisonRows || []).map((row: any) => ({
      id: row.id,
      variable: row.variable,
      shopify: row.shopify,
      tiendanube: row.tiendanube,
      pillText: row.pillText
    })),
    contactEmail: r.contactEmail || undefined,
    contactWhatsapp: r.contactWhatsapp || undefined,
    adminLogos: [],
    brandCard1Title: undefined,
    brandCard1Desc: undefined,
    brandCard1Logo: undefined,
    brandCard1Link: undefined,
    brandCard2Title: undefined,
    brandCard2Desc: undefined,
    brandCard2Logo: undefined,
    brandCard2Link: undefined,
    finalSlideMainLogo: undefined,
    createdBy: r.creatorId || undefined,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : (r.createdAt || new Date().toISOString()),
    viewCount: a.viewCount ?? r.viewCount ?? 0,
    openCount: a.openCount ?? r.openCount ?? 0,
    uniqueVisitors: a.uniqueVisitors ?? r.uniqueVisitors ?? 0,
    uniqueVisitorIds: (a.uniqueVisitorIds as any as string[]) || (r.uniqueVisitorIds as any as string[]) || [],
    interactions: r.interactions ? {
      slideViews: r.interactions.slideViews as any,
      whatsappClicks: r.interactions.whatsappClicks,
      toolClicks: r.interactions.toolClicks,
      calculatorInteractions: r.interactions.calculatorInteractions,
      timeSpentSeconds: r.interactions.timeSpentSeconds
    } : undefined,
    teamId: r.teamId || undefined,
    team: r.team ? {
      id: r.team.id,
      name: r.team.name,
      image: r.team.image || undefined,
      ownerName: r.team.ownerName,
      ownerEmail: r.team.ownerEmail,
      members: [],
      inviteToken: r.team.inviteToken || undefined,
      inviteRole: (r.team.inviteRole as any) || "Visor",
      teamBrandName: r.team.teamBrandName || undefined,
      teamBrandLogo: r.team.teamBrandLogo || undefined,
      teamBrandWebsite: r.team.teamBrandWebsite || undefined,
      allies: (r.team.partners || r.team.allies || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        logo: p.logo,
        url: p.link || p.url || "",
        teamId: p.teamId
      })),
      createdAt: r.team.createdAt.toISOString()
    } : undefined
  };
}

export async function getDbReports(): Promise<Report[]> {
  const cachedReports = getCachedQueryResult<Report[]>("reports");
  if (cachedReports) return cachedReports;

  let result: Report[] = [];
  const prisma = getPrisma();
  if (prisma) {
    try {
      const dbReports = await withDbTimeout(
        prisma.report.findMany({
          include: {
            tools: true,
            comparisonRows: true,
            interactions: true,
            metrics: true,
            platformConfig: true,
            analytics: true,
            pageSpeed: true,
            team: {
              include: { partners: true }
            }
          },
          orderBy: { createdAt: "desc" }
        }),
        4500
      );

      result = (dbReports as any[]).map(r => mapPrismaReportToDomain(r));
    } catch (err: any) {
      if (err?.code === "P2022" || String(err?.message || "").includes("does not exist in the current database") || String(err?.message || "").includes("ColumnNotFound")) {
        console.warn("[Prisma Auto-Repair] Column mismatch in getDbReports, reparando columnas automáticamente...", err.message);
        try {
          await ensureDatabaseSchema(prisma);
          const retryReports = await prisma.report.findMany({
            include: {
              tools: true,
              comparisonRows: true,
              interactions: true,
              metrics: true,
              platformConfig: true,
              analytics: true,
              pageSpeed: true,
              team: {
                include: { partners: true }
              }
            },
            orderBy: { createdAt: "desc" }
          });
          result = retryReports.map(r => mapPrismaReportToDomain(r));
        } catch (retryErr) {
          console.error("[Prisma Auto-Repair Error in getDbReports]:", retryErr);
        }
      } else {
        console.error("Error fetching reports from database:", err);
      }
    }
  }

  if (result.length === 0 && inMemoryReportsFallback.size > 0) {
    result = Array.from(inMemoryReportsFallback.values());
  }

  result = result.map(report => ({
    ...report,
    tools: (report.tools || []).map(t => ({
      ...t,
      logo: resolveTechnologyLogo(t.name, t.url, t.logo)
    }))
  }));

  setCachedQueryResult("reports", result, 3000);
  return result;
}

export async function getDbReportById(id: string): Promise<Report | null> {
  if (!id) return null;
  const cleanId = String(id).trim();

  const cachedReport = getCachedQueryResult<Report>(`report_${cleanId}`);
  if (cachedReport) return cachedReport;

  const prisma = getPrisma();
  if (prisma) {
    try {
      const r = await prisma.report.findFirst({
        where: {
          OR: [
            { id: cleanId },
            { id: { equals: cleanId, mode: "insensitive" } }
          ]
        },
        include: {
          tools: true,
          comparisonRows: true,
          interactions: true,
          metrics: true,
          platformConfig: true,
          analytics: true,
          pageSpeed: true,
          team: {
            include: { partners: true }
          }
        }
      });
      if (r) {
        const mappedReport = mapPrismaReportToDomain(r);
        setCachedQueryResult(`report_${cleanId}`, mappedReport, 3000);
        return mappedReport;
      }
    } catch (err: any) {
      if (err?.code === "P2022" || String(err?.message || "").includes("does not exist in the current database") || String(err?.message || "").includes("ColumnNotFound")) {
        console.warn(`[Prisma Auto-Repair] Column mismatch in getDbReportById(${cleanId}), reparando columnas automáticamente...`, err.message);
        try {
          await ensureDatabaseSchema(prisma);
          const retryReport = await prisma.report.findFirst({
            where: {
              OR: [
                { id: cleanId },
                { id: { equals: cleanId, mode: "insensitive" } }
              ]
            },
            include: {
              tools: true,
              comparisonRows: true,
              interactions: true,
              metrics: true,
              platformConfig: true,
              analytics: true,
              pageSpeed: true,
              team: {
                include: { partners: true }
              }
            }
          });
          if (retryReport) {
            const mappedReport = mapPrismaReportToDomain(retryReport);
            setCachedQueryResult(`report_${cleanId}`, mappedReport, 3000);
            return mappedReport;
          }
        } catch (retryErr) {
          console.error(`[Prisma Auto-Repair Error in getDbReportById for ${cleanId}]:`, retryErr);
        }
      } else {
        console.error("Error fetching report by ID from database:", err);
      }
    }
  }

  return inMemoryReportsFallback.get(cleanId) || inMemoryReportsFallback.get(cleanId.toLowerCase()) || null;
}

export async function saveDbReport(report: Report): Promise<Report> {
  const cleanReport: Report = {
    ...report,
    id: report.id || Math.random().toString(36).substring(2, 11),
    tools: report.tools || [],
    comparisonRows: report.comparisonRows || [],
    adminLogos: report.adminLogos || [],
    contactEmail: report.contactEmail ? String(report.contactEmail).trim() : undefined,
    contactWhatsapp: report.contactWhatsapp ? String(report.contactWhatsapp).trim() : undefined,
    createdAt: report.createdAt || new Date().toISOString()
  };

  const sanitizedPaymentGateways = Array.isArray(cleanReport.paymentGateways)
    ? cleanReport.paymentGateways.map(p => String(p))
    : [];

  const sanitizedPixels = Array.isArray(cleanReport.pixels) ? cleanReport.pixels : [];
  const sanitizedInfrastructure = Array.isArray(cleanReport.infrastructure) ? cleanReport.infrastructure : [];
  const sanitizedServerLocation = cleanReport.serverLocation && typeof cleanReport.serverLocation === "object"
    ? cleanReport.serverLocation
    : null;
  const sanitizedServerLatencyMs = cleanReport.serverLatencyMs != null
    ? sanitizeInt(cleanReport.serverLatencyMs, 0)
    : null;
  const sanitizedPageSpeed = sanitizePageSpeed(cleanReport.pageSpeed);

  const prismaReportData = {
    name: String(cleanReport.name || "").trim(),
    logo: cleanReport.logo ? String(cleanReport.logo).trim() : null,
    tagline: cleanReport.tagline ? String(cleanReport.tagline).trim() : null,
    businessUrl: cleanReport.businessUrl ? String(cleanReport.businessUrl).trim() : null,
    detectedCms: cleanReport.detectedCms ? String(cleanReport.detectedCms).trim() : "Shopify",
    activeTheme: cleanReport.activeTheme ? String(cleanReport.activeTheme).trim() : null,
    screenshotDesktop: cleanReport.screenshotDesktop ? String(cleanReport.screenshotDesktop).trim() : null,
    screenshotMobile: cleanReport.screenshotMobile ? String(cleanReport.screenshotMobile).trim() : null,
    paymentGateways: sanitizedPaymentGateways as any,
    pixels: sanitizedPixels as any,
    infrastructure: sanitizedInfrastructure as any,
    serverLocation: sanitizedServerLocation as any,
    serverLatencyMs: sanitizedServerLatencyMs,
    contactEmail: cleanReport.contactEmail ? String(cleanReport.contactEmail).trim() : null,
    contactWhatsapp: cleanReport.contactWhatsapp ? String(cleanReport.contactWhatsapp).trim() : null
  };

  const metricsData = {
    visitasMensuales: sanitizeInt(cleanReport.visitasMensuales, 0),
    gmv: sanitizeFloat(cleanReport.gmv, 0),
    fugasCantidad: sanitizeInt(cleanReport.fugasCantidad, 0),
    fugasRangoMin: sanitizeFloat(cleanReport.fugasRangoMin, 0),
    fugasRangoMax: sanitizeFloat(cleanReport.fugasRangoMax, 0)
  };

  const platformConfigData = {
    shopifyPlan: sanitizeShopifyPlan(cleanReport.shopifyPlan),
    shopifyFee: sanitizeFloat(cleanReport.shopifyFee, 0),
    msi: cleanReport.msi ? String(cleanReport.msi).trim() : null,
    shopifyPlanCustomFee: cleanReport.shopifyPlanCustomFee != null ? sanitizeFloat(cleanReport.shopifyPlanCustomFee, 0) : null,
    shopifyPlanCustomPrice: cleanReport.shopifyPlanCustomPrice != null ? sanitizeFloat(cleanReport.shopifyPlanCustomPrice, 0) : null,
    shopifyAppsCostUSD: (cleanReport as any).shopifyAppsCostUSD != null ? sanitizeFloat((cleanReport as any).shopifyAppsCostUSD, 0) : null,
    shopifyAppsCostMXN: (cleanReport as any).shopifyAppsCostMXN != null ? sanitizeFloat((cleanReport as any).shopifyAppsCostMXN, 0) : null,
    tiendanubePlan: sanitizeTiendanubePlan(cleanReport.tiendanubePlan)
  };

  const analyticsData = {
    viewCount: sanitizeInt(cleanReport.viewCount, 0),
    openCount: sanitizeInt(cleanReport.openCount, 0),
    uniqueVisitors: sanitizeInt(cleanReport.uniqueVisitors, 0),
    uniqueVisitorIds: (Array.isArray(cleanReport.uniqueVisitorIds) ? cleanReport.uniqueVisitorIds : []) as any
  };

  const sanitizedTools = (cleanReport.tools || []).map((t, idx) => ({
    id: t.id && String(t.id).trim().length > 0 ? String(t.id).trim() : `tool_${cleanReport.id}_${idx}_${Date.now()}`,
    reportId: cleanReport.id,
    name: String(t.name || "Herramienta"),
    category: String(t.category || "General"),
    costType: sanitizeCostType(t.costType),
    costExact: sanitizeFloat(t.costExact, 0),
    costMin: sanitizeFloat(t.costMin, 0),
    costMax: sanitizeFloat(t.costMax, 0),
    currency: sanitizeCurrency(t.currency),
    semaphore: sanitizeSemaphore(t.semaphore),
    url: t.url ? String(t.url).trim() : null,
    description: t.description ? String(t.description).trim() : null,
    logo: t.logo ? String(t.logo).trim() : null,
    precios: Array.isArray(t.precios) ? (t.precios as any) : null,
    selectedPlanId: t.selectedPlanId != null ? String(t.selectedPlanId) : null
  }));

  const sanitizedComparisonRows = (cleanReport.comparisonRows || []).map((row, idx) => ({
    id: row.id && String(row.id).trim().length > 0 ? String(row.id).trim() : `row_${cleanReport.id}_${idx}_${Date.now()}`,
    reportId: cleanReport.id,
    variable: String(row.variable || ""),
    shopify: String(row.shopify || ""),
    tiendanube: String(row.tiendanube || ""),
    pillText: row.pillText ? String(row.pillText).trim() : null
  }));

  const prisma = getPrisma();
  if (prisma) {
    try {
      await prisma.$transaction(async (tx) => {
        // Validar que teamId y creatorId existan realmente en la base de datos para no romper claves foráneas
        let validTeamId: string | null = null;
        if (cleanReport.teamId && typeof cleanReport.teamId === "string" && cleanReport.teamId.trim() !== "") {
          const teamExists = await tx.team.findUnique({
            where: { id: cleanReport.teamId.trim() },
            select: { id: true }
          }).catch(() => null);
          if (teamExists) {
            validTeamId = teamExists.id;
          }
        }

        let validCreatorId: string | null = null;
        const candidateCreator = (cleanReport as any).creatorId || cleanReport.createdBy;
        if (candidateCreator && typeof candidateCreator === "string" && candidateCreator.trim() !== "") {
          const trimmedCreator = candidateCreator.trim();
          const userExists = await tx.user.findFirst({
            where: {
              OR: [
                { id: trimmedCreator },
                { email: trimmedCreator },
                { sub: trimmedCreator }
              ]
            },
            select: { id: true }
          }).catch(() => null);

          if (userExists) {
            validCreatorId = userExists.id;
          }
        }

        await tx.report.upsert({
          where: { id: cleanReport.id },
          update: {
            ...prismaReportData,
            teamId: validTeamId,
            creatorId: validCreatorId
          },
          create: {
            id: cleanReport.id,
            ...prismaReportData,
            teamId: validTeamId,
            creatorId: validCreatorId,
            createdAt: cleanReport.createdAt ? new Date(cleanReport.createdAt) : new Date()
          }
        });

        await tx.reportMetrics.upsert({
          where: { reportId: cleanReport.id },
          update: metricsData,
          create: { ...metricsData, report: { connect: { id: cleanReport.id } } }
        });

        await tx.reportPlatformConfig.upsert({
          where: { reportId: cleanReport.id },
          update: platformConfigData,
          create: { ...platformConfigData, report: { connect: { id: cleanReport.id } } }
        });

        await tx.reportAnalytics.upsert({
          where: { reportId: cleanReport.id },
          update: analyticsData,
          create: { ...analyticsData, report: { connect: { id: cleanReport.id } } }
        });

        if (sanitizedPageSpeed) {
          await tx.reportPageSpeed.upsert({
            where: { reportId: cleanReport.id },
            update: sanitizedPageSpeed,
            create: { ...sanitizedPageSpeed, report: { connect: { id: cleanReport.id } } }
          });
        }

        if (cleanReport.interactions) {
          await tx.reportInteraction.upsert({
            where: { reportId: cleanReport.id },
            update: {
              slideViews: (cleanReport.interactions.slideViews || {}) as any,
              whatsappClicks: sanitizeInt(cleanReport.interactions.whatsappClicks, 0),
              toolClicks: sanitizeInt(cleanReport.interactions.toolClicks, 0),
              calculatorInteractions: sanitizeInt(cleanReport.interactions.calculatorInteractions, 0),
              timeSpentSeconds: sanitizeInt(cleanReport.interactions.timeSpentSeconds, 0)
            },
            create: {
              slideViews: (cleanReport.interactions.slideViews || {}) as any,
              whatsappClicks: sanitizeInt(cleanReport.interactions.whatsappClicks, 0),
              toolClicks: sanitizeInt(cleanReport.interactions.toolClicks, 0),
              calculatorInteractions: sanitizeInt(cleanReport.interactions.calculatorInteractions, 0),
              timeSpentSeconds: sanitizeInt(cleanReport.interactions.timeSpentSeconds, 0),
              report: { connect: { id: cleanReport.id } }
            }
          });
        }

        await tx.reportTool.deleteMany({ where: { reportId: cleanReport.id } });
        if (sanitizedTools.length > 0) {
          await tx.reportTool.createMany({ data: sanitizedTools as any });
        }

        await tx.reportComparisonRow.deleteMany({ where: { reportId: cleanReport.id } });
        if (sanitizedComparisonRows.length > 0) {
          await tx.reportComparisonRow.createMany({ data: sanitizedComparisonRows });
        }
      });
    } catch (err: any) {
      const isFkError = err?.code === "P2003" || 
                        String(err?.message || "").includes("Foreign key constraint violated") ||
                        String(err?.message || "").includes("ForeignKeyConstraintViolation") ||
                        String(err?.message || "").toLowerCase().includes("foreign key") ||
                        String(err?.meta?.driverAdapterError || "").includes("ForeignKeyConstraintViolation");

      if (isFkError) {
        console.warn(`[Prisma Foreign-Key Fallback] Clave foránea no encontrada para saveDbReport(${cleanReport.id}), reintentando sin teamId/creatorId...`);
        try {
          await prisma.$transaction(async (tx) => {
            await tx.report.upsert({
              where: { id: cleanReport.id },
              update: {
                ...prismaReportData,
                teamId: null,
                creatorId: null
              },
              create: {
                id: cleanReport.id,
                ...prismaReportData,
                teamId: null,
                creatorId: null,
                createdAt: cleanReport.createdAt ? new Date(cleanReport.createdAt) : new Date()
              }
            });
            await tx.reportMetrics.upsert({
              where: { reportId: cleanReport.id },
              update: metricsData,
              create: { ...metricsData, report: { connect: { id: cleanReport.id } } }
            });
            await tx.reportPlatformConfig.upsert({
              where: { reportId: cleanReport.id },
              update: platformConfigData,
              create: { ...platformConfigData, report: { connect: { id: cleanReport.id } } }
            });
            await tx.reportAnalytics.upsert({
              where: { reportId: cleanReport.id },
              update: analyticsData,
              create: { ...analyticsData, report: { connect: { id: cleanReport.id } } }
            });
            if (sanitizedPageSpeed) {
              await tx.reportPageSpeed.upsert({
                where: { reportId: cleanReport.id },
                update: sanitizedPageSpeed,
                create: { ...sanitizedPageSpeed, report: { connect: { id: cleanReport.id } } }
              });
            }
            await tx.reportTool.deleteMany({ where: { reportId: cleanReport.id } });
            if (sanitizedTools.length > 0) {
              await tx.reportTool.createMany({ data: sanitizedTools as any });
            }
            await tx.reportComparisonRow.deleteMany({ where: { reportId: cleanReport.id } });
            if (sanitizedComparisonRows.length > 0) {
              await tx.reportComparisonRow.createMany({ data: sanitizedComparisonRows });
            }
          });
        } catch (fkRetryErr) {
          console.error(`[Prisma FK Fallback Error in saveDbReport for ${cleanReport.id}]:`, fkRetryErr);
        }
      } else if (err?.code === "P2022" || String(err?.message || "").includes("does not exist in the current database") || String(err?.message || "").includes("ColumnNotFound")) {
        console.warn(`[Prisma Auto-Repair] Column mismatch in saveDbReport(${cleanReport.id}), reparando columnas automáticamente...`, err.message);
        try {
          await ensureDatabaseSchema(prisma);
          await prisma.report.upsert({
            where: { id: cleanReport.id },
            update: {
              ...prismaReportData,
              teamId: null,
              creatorId: null
            },
            create: {
              id: cleanReport.id,
              ...prismaReportData,
              teamId: null,
              creatorId: null,
              createdAt: cleanReport.createdAt ? new Date(cleanReport.createdAt) : new Date()
            }
          });
          await prisma.reportMetrics.upsert({
            where: { reportId: cleanReport.id },
            update: metricsData,
            create: { ...metricsData, report: { connect: { id: cleanReport.id } } }
          });
          await prisma.reportPlatformConfig.upsert({
            where: { reportId: cleanReport.id },
            update: platformConfigData,
            create: { ...platformConfigData, report: { connect: { id: cleanReport.id } } }
          });
          await prisma.reportAnalytics.upsert({
            where: { reportId: cleanReport.id },
            update: analyticsData,
            create: { ...analyticsData, report: { connect: { id: cleanReport.id } } }
          });
          await prisma.reportTool.deleteMany({ where: { reportId: cleanReport.id } });
          if (sanitizedTools.length > 0) {
            await prisma.reportTool.createMany({ data: sanitizedTools as any });
          }
          await prisma.reportComparisonRow.deleteMany({ where: { reportId: cleanReport.id } });
          if (sanitizedComparisonRows.length > 0) {
            await prisma.reportComparisonRow.createMany({ data: sanitizedComparisonRows });
          }
        } catch (retryErr) {
          console.error(`[Prisma Auto-Repair Error in saveDbReport for ${cleanReport.id}]:`, retryErr);
        }
      } else {
        console.error("Error saving report to database:", err);
      }
    }
  }

  inMemoryReportsFallback.set(cleanReport.id, cleanReport);
  invalidateApiQueryCache("reports");
  invalidateApiQueryCache(`report_${cleanReport.id}`);
  invalidateApiQueryCache(`report_${cleanReport.id.toLowerCase()}`);
  return cleanReport;
}

export async function deleteDbReport(id: string): Promise<boolean> {
  inMemoryReportsFallback.delete(id);
  const prisma = getPrisma();
  if (prisma) {
    try {
      await prisma.report.delete({ where: { id } });
      invalidateApiQueryCache("reports");
      invalidateApiQueryCache(`report_${id}`);
      return true;
    } catch (err) {
      console.error("Error deleting report from database:", err);
    }
  }
  return true;
}

// ============================================================================
// TEMPLATES CRUD OPERATORS (POSTGRESQL)
// ============================================================================

export async function getDbTemplates(): Promise<ComparisonTemplate[]> {
  const prisma = getPrisma();
  if (prisma) {
    try {
      const dbTemplates = await prisma.comparisonTemplate.findMany({
        include: { rows: true }
      });
      return dbTemplates.map(t => ({
        id: t.id,
        name: t.name,
        rows: t.rows.map(row => ({
          id: row.id,
          variable: row.variable,
          shopify: row.shopify,
          tiendanube: row.tiendanube,
          pillText: row.pillText || undefined
        }))
      }));
    } catch (err) {
      console.error("Error fetching templates from database:", err);
    }
  }
  return [];
}

export async function saveDbTemplate(template: ComparisonTemplate): Promise<ComparisonTemplate> {
  const prisma = getPrisma();
  if (prisma) {
    try {
      await prisma.$transaction([
        prisma.comparisonTemplateRow.deleteMany({ where: { templateId: template.id } }),
        prisma.comparisonTemplate.upsert({
          where: { id: template.id },
          update: {
            name: template.name,
            rows: {
              create: template.rows.map(r => ({
                id: r.id,
                variable: r.variable,
                shopify: r.shopify,
                tiendanube: r.tiendanube,
                pillText: r.pillText || null
              }))
            }
          },
          create: {
            id: template.id,
            name: template.name,
            rows: {
              create: template.rows.map(r => ({
                id: r.id,
                variable: r.variable,
                shopify: r.shopify,
                tiendanube: r.tiendanube,
                pillText: r.pillText || null
              }))
            }
          }
        })
      ]);

      return template;
    } catch (err) {
      console.error("Error saving template to database:", err);
    }
  }
  return template;
}

export async function deleteDbTemplate(id: string): Promise<boolean> {
  const prisma = getPrisma();
  if (prisma) {
    try {
      await prisma.comparisonTemplate.delete({ where: { id } });
      return true;
    } catch (err) {
      console.error("Error deleting template from database:", err);
    }
  }
  return false;
}

// ============================================================================
// PARTNERS CRUD OPERATORS (POSTGRESQL)
// ============================================================================

export async function getDbPartner(): Promise<any> {
  const prisma = getPrisma();
  if (prisma) {
    try {
      const partner = await prisma.partner.findUnique({
        where: { id: "default" },
        include: { members: true }
      });
      if (partner) return partner;
    } catch (err) {
      console.error("Error reading partner from database:", err);
    }
  }
  return DEFAULT_PARTNER;
}

export async function saveDbPartner(partner: any): Promise<any> {
  const cleanPartner = {
    name: partner.name || DEFAULT_PARTNER.name,
    logo: partner.logo || DEFAULT_PARTNER.logo,
    description: partner.description || DEFAULT_PARTNER.description,
    link: partner.link || DEFAULT_PARTNER.link,
  };

  const prisma = getPrisma();
  if (prisma) {
    try {
      await prisma.$transaction([
        prisma.partnerMember.deleteMany({ where: { partnerId: "default" } }),
        prisma.partner.upsert({
          where: { id: "default" },
          update: {
            ...cleanPartner,
            members: {
              create: (partner.members || []).map((m: any) => ({
                id: m.id || "m-" + Math.random().toString(36).substring(2, 11),
                name: m.name,
                email: m.email,
                role: m.role || "Lector"
              }))
            }
          },
          create: {
            id: "default",
            ...cleanPartner,
            members: {
              create: (partner.members || []).map((m: any) => ({
                id: m.id || "m-" + Math.random().toString(36).substring(2, 11),
                name: m.name,
                email: m.email,
                role: m.role || "Lector"
              }))
            }
          }
        })
      ]);
      return await getDbPartner();
    } catch (err) {
      console.error("Error writing partner to database:", err);
    }
  }

  return { id: "default", ...cleanPartner, members: partner.members || [] };
}

// ============================================================================
// LOGO CONFIG CRUD OPERATORS (POSTGRESQL)
// ============================================================================

export async function getDbLogoConfig(): Promise<any> {
  const prisma = getPrisma();
  if (prisma) {
    try {
      const logoConfig = await prisma.logoConfig.findUnique({ where: { id: "default" } });
      if (logoConfig) return logoConfig;
    } catch (err) {
      console.error("Error reading logo config from database:", err);
    }
  }
  return DEFAULT_LOGO_CONFIG;
}

export async function saveDbLogoConfig(logoConfig: any): Promise<any> {
  const cleanConfig = {
    logoType: logoConfig.logoType === "logo" ? "logo" : "text",
    logoText: logoConfig.logoText !== undefined ? logoConfig.logoText : DEFAULT_LOGO_CONFIG.logoText,
    logoFile: logoConfig.logoFile !== undefined ? logoConfig.logoFile : DEFAULT_LOGO_CONFIG.logoFile,
    globalEmail: logoConfig.globalEmail !== undefined ? logoConfig.globalEmail : DEFAULT_LOGO_CONFIG.globalEmail
  };

  const prisma = getPrisma();
  if (prisma) {
    try {
      const updated = await prisma.logoConfig.upsert({
        where: { id: "default" },
        update: {
          ...cleanConfig,
          logoType: cleanConfig.logoType as any
        },
        create: {
          id: "default",
          ...cleanConfig,
          logoType: cleanConfig.logoType as any
        }
      });
      return updated;
    } catch (err) {
      console.error("Error writing logo config to database:", err);
    }
  }

  return { id: "default", ...cleanConfig };
}

// ============================================================================
// GESTIÓN Y PERSISTENCIA DE USUARIOS Y SUPERADMINS (POSTGRESQL)
// ============================================================================

export async function getDbUsers(): Promise<UserAccount[]> {
  const prisma = getPrisma();
  if (prisma) {
    try {
      const users = await withDbTimeout(
        prisma.user.findMany({
          orderBy: { createdAt: "asc" }
        }),
        3500
      );
      return (users as any[]).map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role as any,
        avatar: u.avatar || undefined,
        sub: u.sub || undefined,
        accessToken: u.accessToken ? decryptText(u.accessToken) : undefined,
        idToken: u.idToken ? decryptText(u.idToken) : undefined,
        tokenExpiresAt: u.tokenExpiresAt ? u.tokenExpiresAt.toISOString() : undefined,
        lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : undefined,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString()
      }));
    } catch (err) {
      console.error("Error al obtener usuarios con Prisma:", err);
    }
  }
  return [];
}

export function getConfiguredSuperAdminEmail(): string {
  return (
    process.env.SUPERADMIN_EMAIL ||
    process.env.INITIAL_SUPERADMIN_EMAIL ||
    process.env.FIRST_SUPERADMIN_EMAIL ||
    ""
  ).trim().toLowerCase();
}

export async function getPersistentSuperAdminEmails(): Promise<string[]> {
  const envEmail = getConfiguredSuperAdminEmail();
  const list = new Set<string>();
  if (envEmail) list.add(envEmail.toLowerCase());

  const prisma = getPrisma();
  if (prisma) {
    try {
      const superAdmins = await prisma.user.findMany({
        where: { role: "Superusuario" },
        select: { email: true }
      });
      superAdmins.forEach(u => {
        if (u.email) list.add(u.email.trim().toLowerCase());
      });
    } catch (err) {
      console.error("Error al obtener superadmin emails desde BD:", err);
    }
  }

  return Array.from(list);
}

export async function addPersistentSuperAdminEmail(email: string): Promise<void> {
  if (!email || typeof email !== "string" || !email.includes("@")) return;
  const clean = email.trim().toLowerCase();

  const prisma = getPrisma();
  if (prisma) {
    try {
      const existing = await prisma.user.findFirst({
        where: { email: { equals: clean, mode: "insensitive" } }
      });
      if (existing) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { role: "Superusuario" }
        });
      }
    } catch (err) {
      console.error("Error al persistir superadmin en BD:", err);
    }
  }
}

export async function registerOrSyncUser(userData: {
  email: string;
  name?: string;
  avatar?: string;
  sub?: string;
  role?: "Superusuario" | "Administrador" | "Agente" | "Visor";
  accessToken?: string;
  idToken?: string;
  tokenExpiresAt?: string | Date;
  lastLoginAt?: string | Date;
}): Promise<UserAccount> {
  const cleanEmail = userData.email.trim().toLowerCase();
  const configuredSuperAdminEmail = getConfiguredSuperAdminEmail();
  const persistentSuperAdmins = await getPersistentSuperAdminEmails();

  const isSuperAdminEmail = Boolean(
    cleanEmail && (
      (configuredSuperAdminEmail && cleanEmail === configuredSuperAdminEmail) ||
      persistentSuperAdmins.includes(cleanEmail)
    )
  );

  const formattedExpiresAt = userData.tokenExpiresAt
    ? new Date(userData.tokenExpiresAt).toISOString()
    : undefined;
  const formattedLastLoginAt = userData.lastLoginAt
    ? new Date(userData.lastLoginAt).toISOString()
    : new Date().toISOString();

  const encryptedAccessToken = userData.accessToken ? encryptText(userData.accessToken) : undefined;
  const encryptedIdToken = userData.idToken ? encryptText(userData.idToken) : undefined;

  const resolvedAvatar = await resolveUserAvatar(cleanEmail, userData.avatar, userData.name);

  const prisma = getPrisma();
  if (prisma) {
    try {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: cleanEmail, mode: "insensitive" } },
            ...(userData.sub ? [{ sub: userData.sub }] : [])
          ]
        }
      });

      if (existingUser) {
        const isSuperUser = existingUser.role === "Superusuario" || isSuperAdminEmail || userData.role === "Superusuario";
        const targetRole = isSuperUser ? "Superusuario" : (existingUser.role as any);

        const updated = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: userData.name || existingUser.name,
            avatar: (userData.avatar && !userData.avatar.includes("photo-1535713875002-d1d0cf377fde")) 
              ? userData.avatar 
              : (existingUser.avatar && !existingUser.avatar.includes("photo-1535713875002-d1d0cf377fde") ? existingUser.avatar : resolvedAvatar),
            sub: userData.sub || existingUser.sub,
            role: targetRole,
            accessToken: encryptedAccessToken || existingUser.accessToken,
            idToken: encryptedIdToken || existingUser.idToken,
            tokenExpiresAt: formattedExpiresAt ? new Date(formattedExpiresAt) : existingUser.tokenExpiresAt,
            lastLoginAt: new Date(formattedLastLoginAt)
          }
        });

        return {
          id: updated.id,
          email: updated.email,
          name: updated.name,
          role: updated.role as any,
          avatar: updated.avatar || undefined,
          sub: updated.sub || undefined,
          accessToken: userData.accessToken || (updated.accessToken ? decryptText(updated.accessToken) : undefined),
          idToken: userData.idToken || (updated.idToken ? decryptText(updated.idToken) : undefined),
          tokenExpiresAt: updated.tokenExpiresAt ? updated.tokenExpiresAt.toISOString() : undefined,
          lastLoginAt: updated.lastLoginAt ? updated.lastLoginAt.toISOString() : undefined,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString()
        };
      }

      // Usuario Nuevo
      const userCount = await prisma.user.count();
      const isFirstUserInSystem = userCount === 0;
      const assignedRole: "Superusuario" | "Administrador" | "Agente" | "Visor" = (isFirstUserInSystem || isSuperAdminEmail || userData.role === "Superusuario")
        ? "Superusuario"
        : (userData.role || "Visor");

      const newId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const created = await prisma.user.create({
        data: {
          id: newId,
          email: cleanEmail,
          name: userData.name || cleanEmail.split("@")[0] || "Usuario",
          role: assignedRole,
          avatar: resolvedAvatar,
          sub: userData.sub || null,
          accessToken: encryptedAccessToken || null,
          idToken: encryptedIdToken || null,
          tokenExpiresAt: formattedExpiresAt ? new Date(formattedExpiresAt) : null,
          lastLoginAt: new Date(formattedLastLoginAt)
        }
      });

      return {
        id: created.id,
        email: created.email,
        name: created.name,
        role: created.role as any,
        avatar: created.avatar || undefined,
        sub: created.sub || undefined,
        accessToken: userData.accessToken,
        idToken: userData.idToken,
        tokenExpiresAt: created.tokenExpiresAt ? created.tokenExpiresAt.toISOString() : undefined,
        lastLoginAt: created.lastLoginAt ? created.lastLoginAt.toISOString() : undefined,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString()
      };
    } catch (err) {
      console.error("Error al registrar o sincronizar usuario en Prisma:", err);
    }
  }

  return {
    id: `user_${Date.now()}`,
    email: cleanEmail,
    name: userData.name || "Usuario",
    role: isSuperAdminEmail ? "Superusuario" : (userData.role || "Visor"),
    avatar: resolvedAvatar,
    sub: userData.sub,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export async function updateUserRole(userId: string, newRole: "Superusuario" | "Administrador" | "Agente" | "Visor"): Promise<UserAccount | null> {
  const prisma = getPrisma();
  if (prisma) {
    try {
      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            { id: userId },
            { email: { equals: userId, mode: "insensitive" } }
          ]
        }
      });

      if (!existing) return null;

      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: { role: newRole as any }
      });

      return {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role as any,
        avatar: updated.avatar || undefined,
        sub: updated.sub || undefined,
        accessToken: updated.accessToken ? decryptText(updated.accessToken) : undefined,
        idToken: updated.idToken ? decryptText(updated.idToken) : undefined,
        tokenExpiresAt: updated.tokenExpiresAt ? updated.tokenExpiresAt.toISOString() : undefined,
        lastLoginAt: updated.lastLoginAt ? updated.lastLoginAt.toISOString() : undefined,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString()
      };
    } catch (err) {
      console.error("Error al actualizar rol de usuario en Prisma:", err);
    }
  }
  return null;
}

// ============================================================================
// SYSTEM HEALTH, API KEYS & API LOCK (POSTGRESQL)
// ============================================================================

export async function getSystemHealthStatus(): Promise<SystemHealthData> {
  const startTime = Date.now();
  let dbStatus: "connected" | "disconnected" | "fallback_json" = "disconnected";
  let dbProvider = "PostgreSQL (Prisma ORM)";
  let dbLatencyMs = 0;
  let reportCount = 0;
  let teamCount = 0;
  let userCount = 0;
  let templateCount = 0;

  const prisma = getPrisma();
  if (prisma) {
    try {
      const pingStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - pingStart;
      dbStatus = "connected";

      reportCount = await prisma.report.count();
      teamCount = await prisma.team.count();
      userCount = await prisma.user.count();
      templateCount = await prisma.comparisonTemplate.count();
    } catch (err) {
      console.error("Prisma health check failed:", err);
      dbStatus = "disconnected";
      dbLatencyMs = Date.now() - startTime;
    }
  }

  const mem = process.memoryUsage();
  const lockInfo = await getApiLockStatus();

  return {
    status: dbStatus === "disconnected" ? "degraded" : lockInfo.apiLocked ? "warning" : "healthy",
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsage: {
      rssMB: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
      heapTotalMB: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
      heapUsedMB: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
      externalMB: Math.round(((mem.external || 0) / 1024 / 1024) * 100) / 100
    },
    database: {
      status: dbStatus,
      provider: dbProvider,
      latencyMs: dbLatencyMs,
      counts: {
        reports: reportCount,
        teams: teamCount,
        users: userCount,
        templates: templateCount
      }
    },
    serverInfo: {
      nodeVersion: process.version,
      platform: `${process.platform} ${process.arch}`,
      environment: process.env.NODE_ENV || "development",
      apiLocked: lockInfo.apiLocked,
      lockReason: lockInfo.lockReason
    }
  };
}

export async function getDbApiKeys(): Promise<ApiKeyItem[]> {
  const prisma = getPrisma();
  if (prisma) {
    try {
      const keys = await prisma.apiKey.findMany({
        orderBy: { createdAt: "desc" }
      });
      return keys.map((k: any) => ({
        id: k.id,
        name: k.name,
        maskedKey: k.maskedKey,
        status: k.status as any,
        createdByName: k.createdByName || undefined,
        lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString() : undefined,
        createdAt: k.createdAt.toISOString()
      }));
    } catch (err) {
      console.error("Error al leer API keys en Prisma:", err);
    }
  }
  return [];
}

export async function createDbApiKey(name: string, createdByName?: string): Promise<{ apiKey: ApiKeyItem; rawToken: string }> {
  const rawToken = `tlm_live_${crypto.randomBytes(24).toString("hex")}`;
  const maskedKey = `${rawToken.substring(0, 12)}...${rawToken.substring(rawToken.length - 4)}`;
  const keyHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const newId = `key_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const newKey: ApiKeyItem = {
    id: newId,
    name: name.trim() || "Integración API",
    maskedKey,
    rawToken,
    status: "active",
    createdByName: createdByName || "Superusuario",
    createdAt: new Date().toISOString()
  };

  const prisma = getPrisma();
  if (prisma) {
    try {
      await prisma.apiKey.create({
        data: {
          id: newId,
          name: newKey.name,
          keyHash,
          maskedKey,
          status: "active",
          createdByName: newKey.createdByName
        }
      });
    } catch (err) {
      console.error("Error al crear API Key en Prisma:", err);
    }
  }

  return { apiKey: newKey, rawToken };
}

export async function deleteDbApiKey(id: string): Promise<boolean> {
  const prisma = getPrisma();
  if (prisma) {
    try {
      await prisma.apiKey.delete({ where: { id } });
      return true;
    } catch (err) {
      console.error("Error al eliminar API key en Prisma:", err);
    }
  }
  return false;
}

export async function getApiLockStatus(): Promise<{ apiLocked: boolean; lockReason: string }> {
  const prisma = getPrisma();
  if (prisma) {
    try {
      const setting = await prisma.systemSetting.findUnique({ where: { id: "default" } });
      if (setting) {
        return {
          apiLocked: setting.apiLocked,
          lockReason: setting.lockReason || "Mantenimiento programado de la API"
        };
      }
    } catch (err) {
      console.error("Error al leer SystemSetting en Prisma:", err);
    }
  }

  return {
    apiLocked: false,
    lockReason: "Mantenimiento programado de la API"
  };
}

export async function toggleApiLock(apiLocked: boolean, lockReason?: string): Promise<{ apiLocked: boolean; lockReason: string }> {
  const cleanReason = lockReason?.trim() || "Mantenimiento programado de la API";
  const result = { apiLocked, lockReason: cleanReason };

  const prisma = getPrisma();
  if (prisma) {
    try {
      await prisma.systemSetting.upsert({
        where: { id: "default" },
        update: { apiLocked, lockReason: cleanReason },
        create: { id: "default", apiLocked, lockReason: cleanReason }
      });
    } catch (err) {
      console.error("Error al actualizar SystemSetting en Prisma:", err);
    }
  }

  return result;
}

export async function resetInstanceToFactorySettings(): Promise<{ success: boolean; message: string }> {
  try {
    const prisma = getPrisma();
    if (prisma) {
      await prisma.$transaction([
        prisma.reportTool.deleteMany({}),
        prisma.reportComparisonRow.deleteMany({}),
        prisma.reportInteraction.deleteMany({}),
        prisma.reportPageSpeed.deleteMany({}),
        prisma.reportMetrics.deleteMany({}),
        prisma.reportPlatformConfig.deleteMany({}),
        prisma.reportAnalytics.deleteMany({}),
        prisma.report.deleteMany({}),
        prisma.teamReportConfig.deleteMany({}),
        prisma.teamConfig.deleteMany({}),
        prisma.teamMember.deleteMany({}),
        prisma.team.deleteMany({}),
        prisma.partnerMember.deleteMany({}),
        prisma.partner.deleteMany({}),
        prisma.comparisonTemplateRow.deleteMany({}),
        prisma.comparisonTemplate.deleteMany({}),
        prisma.apiKey.deleteMany({}),
        prisma.user.deleteMany({}),
        prisma.config.deleteMany({}),
        prisma.logoConfig.deleteMany({}),
        prisma.systemSetting.deleteMany({})
      ]);

      isDatabaseInitialized = false;
      await initializeDatabase();
    }

    invalidateApiQueryCache();

    return {
      success: true,
      message: "🟢 La instancia ha sido restablecida exitosamente a su configuración de fábrica en PostgreSQL."
    };
  } catch (error: any) {
    console.error("Error al ejecutar restablecimiento a configuración de fábrica:", error);
    return {
      success: false,
      message: `Error al restablecer la instancia: ${error?.message || "Fallo interno de almacenamiento en base de datos"}`
    };
  }
}
