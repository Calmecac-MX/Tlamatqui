import fs, { promises as fsPromises } from "fs";
import path from "path";
import dns from "node:dns/promises";
import crypto from "node:crypto";
import { getPrisma, isPrismaEnabled } from "./lib/prisma.js";
import { Team, Report, ComparisonTemplate, ComparisonRow, Tool, LogoConfig, UserAccount, UserRole, ApiKeyItem, SystemHealthData } from "./types.js";

import { encryptData, decryptData, encryptText, decryptText } from "./encryptionService.js";

// Caché en memoria RAM para archivos JSON (evita releer de disco e invalidar cifrado AES en cada consulta)
const jsonMemoryCache = new Map<string, { data: any; mtime: number }>();

// Caché ultra-rápido en RAM con TTL de 3s para peticiones GET frecuentes de la API REST
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

// Async JSON file helper utilities (non-blocking I/O con cifrado transparente en reposo y caché RAM)

async function readJsonAsync<T>(filePath: string, fallback: T): Promise<T> {
  try {
    if (fs.existsSync(filePath)) {
      const stats = await fsPromises.stat(filePath);
      const cached = jsonMemoryCache.get(filePath);
      if (cached && cached.mtime === stats.mtimeMs) {
        return cached.data as T;
      }
      const content = await fsPromises.readFile(filePath, "utf-8");
      const rawData = JSON.parse(content);
      const decrypted = decryptData(rawData);
      jsonMemoryCache.set(filePath, { data: decrypted, mtime: stats.mtimeMs });
      return decrypted;
    }
  } catch (error) {
    console.error(`Error al leer archivo JSON asíncrono ${filePath}:`, error);
  }
  return fallback;
}

async function writeJsonAsync<T>(filePath: string, data: T): Promise<void> {
  try {
    const encryptedData = encryptData(data);
    await fsPromises.writeFile(filePath, JSON.stringify(encryptedData, null, 2), "utf-8");
    const stats = await fsPromises.stat(filePath);
    jsonMemoryCache.set(filePath, { data, mtime: stats.mtimeMs });
  } catch (error) {
    console.error(`Error al escribir archivo JSON asíncrono ${filePath}:`, error);
  }
}

/**
 * Enuelve cualquier consulta asíncrona de Prisma en un límite de tiempo (timeout) de 3.5s.
 * Evita que bloqueos de red en el driver de base de datos demoren la respuesta del servidor.
 */
async function withDbTimeout<T>(promise: Promise<T>, ms: number = 3500): Promise<T> {
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



// File storage paths (for JSON fallback)
const DATA_DIR = path.join(process.cwd(), "data");
const REPORTS_FILE = path.join(DATA_DIR, "reports.json");
const TEMPLATES_FILE = path.join(DATA_DIR, "templates.json");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");
const LOGO_CONFIG_FILE = path.join(DATA_DIR, "logo_config.json");
const TEAMS_FILE = path.join(DATA_DIR, "teams.json");
const PARTNERS_FILE = path.join(DATA_DIR, "partners.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const API_KEYS_FILE = path.join(DATA_DIR, "api_keys.json");
const SYSTEM_SETTINGS_FILE = path.join(DATA_DIR, "system_settings.json");
const SUPERADMIN_EMAILS_FILE = path.join(DATA_DIR, "superadmin_emails.json");

// Define defaults
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
  userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80",
  metricsUpdateInterval: 3000,
  brandCard2Title: "Socio Consultor Autorizado",
  brandCard2Desc: "Especialistas de confianza en migración, diseño UX/UI y optimización técnica para asegurar una transición fluida sin perder SEO.",
  brandCard2Logo: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=120&q=80",
  brandCard2Link: "mailto:cesar.ayar19@gmail.com",
  customDomainEnabled: false,
  customDomain: "",

  domainVerificationToken: "tlamatqui-verify-sec_" + crypto.randomBytes(6).toString("hex"),
  domainVerified: false,
  domainVerifiedAt: null
};

const DEFAULT_LOGO_CONFIG = {
  id: "default",
  logoType: "text",
  logoText: "Tlachiālōyan",
  logoFile: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
  globalEmail: "cesar.ayar19@gmail.com"
};

const DEFAULT_PARTNER = {
  id: "default",
  name: "Socio Principal",
  logo: "https://logo.clearbit.com/tiendanube.com",
  description: "Socio Estratégico en Migraciones y Optimización de Comercio Electrónico con más de 5 años de trayectoria.",
  link: "https://www.tiendanube.com.mx",
  members: [
    {
      id: "part-memb-1",
      name: "Juan Pérez",
      email: "juan.perez@tiendanube.com.mx",
      role: "Lector y Comentarista",
      partnerId: "default"
    }
  ]
};

const DEFAULT_TEAMS = [
  {
    id: "team-default",
    name: "Equipo Evolución",
    image: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=150&q=80",
    ownerName: "César Ayar",
    ownerEmail: "cesar.ayar19@gmail.com",
    members: [
      {
        id: "member-1",
        name: "César Ayar",
        email: "cesar.ayar19@gmail.com",
        role: "Administrador",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"
      },
      {
        id: "member-2",
        name: "Sofía Ruiz",
        email: "sofia.ruiz@evolucion.mx",
        role: "Agente",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80"
      },
      {
        id: "member-3",
        name: "Mateo Gómez",
        email: "mateo.gomez@evolucion.mx",
        role: "Visor",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80"
      }
    ],
    createdAt: new Date("2026-07-08T10:00:00Z").toISOString()
  }
];

const DEFAULT_TEMPLATES = [
  {
    id: "default-ecommerce",
    name: "Comparativo Shopify vs Tiendanube (Estándar)",
    rows: [
      { id: "row-1", variable: "Facturación", shopify: "Pesificada en USD + 16% IVA", tiendanube: "100% Pesificada en MXN Factura Local", pillText: "Ahorro Fiscal" },
      { id: "row-2", variable: "Soporte", shopify: "Ticket / Chat por bot (inglés)", tiendanube: "Soporte 1-1 en español vía WhatsApp local", pillText: "Soporte Humano" },
      { id: "row-3", variable: "Servidor", shopify: "Estabilidad global estándar", tiendanube: "Infraestructura en la nube optimizada para LatAm", pillText: "AWS Infra" },
      { id: "row-4", variable: "Punto de Venta", shopify: "POS Pro con cobro extra por sucursal", tiendanube: "Integraciones locales nativas sin costo extra", pillText: "Integración POS" },
      { id: "row-5", variable: "Comisión de transacción", shopify: "Cobro de 0.5% a 2% por cada venta", tiendanube: "0% comisión por transacción en todos los planes", pillText: "0% Comisión" },
      { id: "row-6", variable: "MSI", shopify: "Requiere apps costosas de cobro recurrente", tiendanube: "Configuración de MSI nativa sin apps terceras", pillText: "MSI Nativos" }
    ]
  }
];

const DEFAULT_REPORTS = [
  {
    id: "ginebra-evolucion",
    name: "Ginebra",
    teamId: "team-default",
    logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
    tagline: "Hemos detectado que estás perdiendo margen operativo en comisiones ocultas y aplicaciones redundantes.",
    fugasCantidad: 4,
    fugasRangoMin: 12000,
    fugasRangoMax: 45000,
    visitasMensuales: 45000,
    gmv: 450000,
    shopifyFee: 14900,
    msi: "3, 6, 9 meses sin intereses",
    shopifyPlan: "grow",
    shopifyPlanCustomFee: 1,
    shopifyPlanCustomPrice: 52,
    shopifyAppsCostUSD: 164.98,
    shopifyAppsCostMXN: 3052.13,
    tiendanubePlan: "evolution",
    tools: [
      {
        id: "tool-1",
        name: "Klaviyo",
        category: "Marketing & Automatización",
        costType: "exact",
        costExact: 120,
        costMin: 0,
        costMax: 0,
        currency: "USD",
        semaphore: "yellow",
        url: "https://www.klaviyo.com",
        description: "Automatización de emails, flujos de carritos abandonados y segmentación.",
        logo: "https://logo.clearbit.com/klaviyo.com"
      },
      {
        id: "tool-2",
        name: "Loox",
        category: "Reviews & Social Proof",
        costType: "range",
        costExact: 0,
        costMin: 29.99,
        costMax: 99.99,
        currency: "USD",
        semaphore: "green",
        url: "https://loox.io",
        description: "Prueba social interactiva con fotos de clientes comprando. Reemplazable nativamente en Tiendanube con apps gratuitas.",
        logo: "https://logo.clearbit.com/loox.io"
      },
      {
        id: "tool-3",
        name: "Infinite Options",
        category: "Conversión & Checkout",
        costType: "exact",
        costExact: 14.99,
        costMin: 0,
        costMax: 0,
        currency: "USD",
        semaphore: "green",
        url: "https://apps.shopify.com/infinite-options",
        description: "Personalización avanzada de variantes. Tiendanube permite propiedades de variante infinitas integradas.",
        logo: "https://logo.clearbit.com/shopcircle.co"
      },
      {
        id: "tool-4",
        name: "Bold Subscriptions",
        category: "Suscripciones",
        costType: "range",
        costExact: 0,
        costMin: 49.99,
        costMax: 199.99,
        currency: "USD",
        semaphore: "red",
        url: "https://boldcommerce.com",
        description: "Módulo de compras recurrentes. Representa costo oculto y cargos extras de pasarela.",
        logo: "https://logo.clearbit.com/boldcommerce.com"
      }
    ],
    comparisonRows: [
      { id: "row-1", variable: "Facturación", shopify: "Pesificada en USD + 16% IVA", tiendanube: "100% Pesificada en MXN Factura Local", pillText: "Ahorro Fiscal" },
      { id: "row-2", variable: "Soporte", shopify: "Ticket / Chat por bot (inglés)", tiendanube: "Soporte 1-1 en español vía WhatsApp local", pillText: "Soporte Humano" },
      { id: "row-3", variable: "Servidor", shopify: "Estabilidad global estándar", tiendanube: "Infraestructura en la nube optimizada para LatAm", pillText: "AWS Infra" },
      { id: "row-4", variable: "Punto de Venta", shopify: "POS Pro con cobro extra por sucursal", tiendanube: "Integraciones locales nativas sin costo extra", pillText: "Integración POS" },
      { id: "row-5", variable: "Comisión de transacción", shopify: "Cobro de 1.0% por transacción", tiendanube: "0% comisión por transacción en todos los planes", pillText: "0% Comisión" },
      { id: "row-6", variable: "MSI", shopify: "Configuración a través de apps y comisiones extra", tiendanube: "Configuración nativa directa en pasarela local", pillText: "MSI Nativos" }
    ],
    contactEmail: "cesar.ayar19@gmail.com",
    contactWhatsapp: "5512345678",
    adminLogos: [
      "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=100&q=80"
    ],
    brandCard1Title: "Tiendanube",
    brandCard1Desc: "La plataforma de comercio electrónico líder en América Latina con más de 120,000 tiendas activas y Pago Nube con 0% comisión por transacción.",
    brandCard1Logo: "https://logo.clearbit.com/tiendanube.com",
    brandCard1Link: "https://www.tiendanube.com.mx",
    brandCard2Title: "Socio Consultor Autorizado",
    brandCard2Desc: "Especialistas de confianza en migración, diseño UX/UI y optimización técnica para asegurar una transición fluida sin perder SEO.",
    brandCard2Logo: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=120&q=80",
    brandCard2Link: "mailto:cesar.ayar19@gmail.com",
    finalSlideMainLogo: "https://logo.clearbit.com/tiendanube.com",
    createdAt: new Date("2026-07-08T10:00:00Z").toISOString(),
    viewCount: 0,
    openCount: 0,
    uniqueVisitors: 0,
    uniqueVisitorIds: [] as string[],
    interactions: {
      slideViews: {} as Record<string, number>,
      whatsappClicks: 0,
      toolClicks: 0,
      calculatorInteractions: 0,
      timeSpentSeconds: 0
    }
  }
];

/**
 * Inicializa la persistencia de la base de datos y la semilla inicial (seeding).
 * Garantiza que la carpeta `./data` y los archivos JSON locales contengan los valores por defecto
 * y, si PostgreSQL/Prisma está configurado, sincroniza los registros iniciales en la base de datos remota.
 * 
 * @returns {Promise<void>} Promesa que resuelve tras completar la verificación.
 */
let isDatabaseInitialized = false;

export async function initializeDatabase() {
  if (isDatabaseInitialized) return;
  isDatabaseInitialized = true;

  // Ensure local folders exist

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Local files default creation
  if (!fs.existsSync(TEAMS_FILE)) {
    fs.writeFileSync(TEAMS_FILE, JSON.stringify(DEFAULT_TEAMS, null, 2), "utf-8");
  }
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf-8");
  }
  if (!fs.existsSync(TEMPLATES_FILE)) {
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(DEFAULT_TEMPLATES, null, 2), "utf-8");
  }
  if (!fs.existsSync(REPORTS_FILE)) {
    fs.writeFileSync(REPORTS_FILE, JSON.stringify(DEFAULT_REPORTS, null, 2), "utf-8");
  }
  if (!fs.existsSync(PARTNERS_FILE)) {
    fs.writeFileSync(PARTNERS_FILE, JSON.stringify(DEFAULT_PARTNER, null, 2), "utf-8");
  }
  if (!fs.existsSync(LOGO_CONFIG_FILE)) {
    fs.writeFileSync(LOGO_CONFIG_FILE, JSON.stringify(DEFAULT_LOGO_CONFIG, null, 2), "utf-8");
  }

  // Seed external DB if Prisma is enabled
  if (isPrismaEnabled()) {
    const prisma = getPrisma();
    if (!prisma) return;

    try {
      console.log("Checking database connection and seeding if necessary...");

      // 1. Seed Config
      const configCount = await prisma.config.count();
      if (configCount === 0) {
        console.log("Seeding default Config in database...");
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
            brandCard2Title: DEFAULT_CONFIG.brandCard2Title,
            brandCard2Desc: DEFAULT_CONFIG.brandCard2Desc,
            brandCard2Logo: DEFAULT_CONFIG.brandCard2Logo,
            brandCard2Link: DEFAULT_CONFIG.brandCard2Link
          }
        });
      }

      // 2. Seed Teams & Members
      const teamsCount = await prisma.team.count();
      if (teamsCount === 0) {
        console.log("Seeding default Teams in database...");
        for (const t of DEFAULT_TEAMS) {
          await prisma.team.create({
            data: {
              id: t.id,
              name: t.name,
              image: t.image,
              ownerName: t.ownerName,
              ownerEmail: t.ownerEmail,
              createdAt: new Date(t.createdAt),
              members: {
                create: t.members.map(m => ({
                  id: m.id,
                  name: m.name,
                  email: m.email,
                  role: m.role as any,
                  avatar: m.avatar
                }))
              }
            }
          });
        }
      }

      // 3. Seed Comparison Templates & rows
      const templatesCount = await prisma.comparisonTemplate.count();
      if (templatesCount === 0) {
        console.log("Seeding default Templates in database...");
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

      // 4. Seed Reports, Tools, ComparisonRows & Interactions
      const reportsCount = await prisma.report.count();
      if (reportsCount === 0) {
        console.log("Seeding default Reports in database...");
        for (const r of DEFAULT_REPORTS) {
          await prisma.report.create({
            data: {
              id: r.id,
              name: r.name,
              logo: r.logo,
              tagline: r.tagline,
              fugasCantidad: r.fugasCantidad,
              fugasRangoMin: r.fugasRangoMin,
              fugasRangoMax: r.fugasRangoMax,
              visitasMensuales: r.visitasMensuales,
              gmv: r.gmv,
              shopifyFee: r.shopifyFee,
              msi: r.msi,
              shopifyPlan: r.shopifyPlan as any,
              shopifyPlanCustomFee: r.shopifyPlanCustomFee,
              shopifyPlanCustomPrice: r.shopifyPlanCustomPrice,
              shopifyAppsCostUSD: r.shopifyAppsCostUSD,
              shopifyAppsCostMXN: r.shopifyAppsCostMXN,
              tiendanubePlan: r.tiendanubePlan as any,
              contactEmail: r.contactEmail,
              contactWhatsapp: r.contactWhatsapp,
              adminLogos: r.adminLogos as any,
              brandCard1Title: r.brandCard1Title,
              brandCard1Desc: r.brandCard1Desc,
              brandCard1Logo: r.brandCard1Logo,
              brandCard1Link: r.brandCard1Link,
              brandCard2Title: r.brandCard2Title,
              brandCard2Desc: r.brandCard2Desc,
              brandCard2Logo: r.brandCard2Logo,
              brandCard2Link: r.brandCard2Link,
              finalSlideMainLogo: r.finalSlideMainLogo,
              viewCount: r.viewCount,
              openCount: r.openCount,
              uniqueVisitors: r.uniqueVisitors,
              uniqueVisitorIds: r.uniqueVisitorIds as any,
              teamId: r.teamId,
              createdAt: new Date(r.createdAt),
              tools: {
                create: r.tools.map(tool => ({
                  id: tool.id,
                  name: tool.name,
                  category: tool.category,
                  costType: tool.costType as any,
                  costExact: tool.costExact,
                  costMin: tool.costMin,
                  costMax: tool.costMax,
                  currency: tool.currency as any,
                  semaphore: tool.semaphore as any,
                  url: tool.url,
                  description: tool.description,
                  logo: tool.logo
                }))
              },
              comparisonRows: {
                create: r.comparisonRows.map(row => ({
                  id: row.id,
                  variable: row.variable,
                  shopify: row.shopify,
                  tiendanube: row.tiendanube,
                  pillText: row.pillText
                }))
              },
              interactions: r.interactions ? {
                create: {
                  slideViews: r.interactions.slideViews as any,
                  whatsappClicks: r.interactions.whatsappClicks,
                  toolClicks: r.interactions.toolClicks,
                  calculatorInteractions: r.interactions.calculatorInteractions,
                  timeSpentSeconds: r.interactions.timeSpentSeconds
                }
              } : undefined
            }
          });
        }
      }
      // 5. Seed Partner
      const partnerCount = await prisma.partner.count();
      if (partnerCount === 0) {
        console.log("Seeding default Partner in database...");
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

      // 6. Seed LogoConfig
      const logoConfigCount = await prisma.logoConfig.count();
      if (logoConfigCount === 0) {
        console.log("Seeding default LogoConfig in database...");
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

      console.log("Database seed check complete.");
    } catch (error) {
      console.error("Prisma database error or connection failed. Falling back to local files.", error);
    }
  }
}

// ==========================================
// CONFIG CRUD OPERATORS
// ==========================================

/**
 * Obtiene los parámetros globales de configuración del panel.
 * Intenta leer desde PostgreSQL a través de Prisma ORM, o regresa la configuración desde `data/config.json`.
 * 
 * @returns {Promise<any>} Objeto con la configuración global del panel.
 */
export async function getDbConfig(): Promise<any> {
  const cachedConfig = getCachedQueryResult<any>("config");
  if (cachedConfig) return cachedConfig;

  let config: any = null;
  if (isPrismaEnabled()) {
    const prisma = getPrisma();
    if (prisma) {
      try {
        const raw = await withDbTimeout(prisma.config.findUnique({ where: { id: "default" } }), 3500);
        if (raw) {
          config = decryptData(raw);
        }
      } catch (err) {
        console.error("Error reading config from database:", err);
      }
    }
  }

  if (!config) {
    config = await readJsonAsync(CONFIG_FILE, DEFAULT_CONFIG);
  }

  // Ensure token exists in memory without blocking write
  if (!config.domainVerificationToken) {
    config.domainVerificationToken = "tlamatqui-verify-sec_default_token";
  }

  setCachedQueryResult("config", config, 10000);
  return config;
}

/**
 * Guarda o actualiza los parámetros de configuración global en la base de datos o archivo JSON.
 * 
 * @param {any} config - Objeto con las propiedades de configuración a actualizar.
 * @returns {Promise<any>} Configuración actualizada y guardada.
 */
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
    brandCard2Title: config.brandCard2Title || null,
    brandCard2Desc: config.brandCard2Desc || null,
    brandCard2Logo: config.brandCard2Logo || null,
    brandCard2Link: config.brandCard2Link || null,
    customDomainEnabled: Boolean(config.customDomainEnabled !== undefined ? config.customDomainEnabled : (currentConfig.customDomainEnabled !== undefined ? currentConfig.customDomainEnabled : false)),
    customDomain: config.customDomain !== undefined ? config.customDomain : (currentConfig.customDomain || ""),

    domainVerificationToken: config.domainVerificationToken || currentConfig.domainVerificationToken || ("tlamatqui-verify-sec_" + crypto.randomBytes(6).toString("hex")),
    domainVerified: Boolean(config.domainVerified !== undefined ? config.domainVerified : (currentConfig.domainVerified || false)),
    domainVerifiedAt: config.domainVerifiedAt !== undefined ? config.domainVerifiedAt : (currentConfig.domainVerifiedAt || null),
  };

  invalidateApiQueryCache("config");

  if (isPrismaEnabled()) {
    const prisma = getPrisma();
    if (prisma) {
      try {
        const dbPayload = encryptData(cleanConfig);
        const updated = await prisma.config.upsert({
          where: { id: "default" },
          update: {
            ...dbPayload,
            userRole: cleanConfig.userRole as any
          },
          create: {
            id: "default",
            ...dbPayload,
            userRole: cleanConfig.userRole as any
          }
        });
        const decryptedResult = decryptData(updated);
        setCachedQueryResult("config", decryptedResult, 10000);
        return decryptedResult;
      } catch (err) {
        console.error("Error writing config to database:", err);
      }
    }
  }

  // Save to local file as fallback/sync
  await writeJsonAsync(CONFIG_FILE, cleanConfig);
  setCachedQueryResult("config", cleanConfig, 10000);
  return cleanConfig;
}


/**
 * Consulta los registros TXT de DNS para verificar la propiedad del dominio personalizado.
 * 
 * @param {string} rawDomain - Nombre de dominio o subdominio a consultar.
 * @param {string} expectedToken - Token de verificación guardado en la configuración.
 * @returns {Promise<{ success: boolean; message: string; config?: any }>} Resultado de la verificación.
 */
export async function verifyCustomDomainDNS(rawDomain: string, expectedToken: string): Promise<{ success: boolean; message: string; config?: any }> {
  if (!rawDomain || typeof rawDomain !== "string") {
    return { success: false, message: "Ingresa un nombre de dominio válido." };
  }

  // Sanear el nombre de dominio
  const cleanDomain = rawDomain.trim().toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");

  if (!cleanDomain || !cleanDomain.includes(".")) {
    return { success: false, message: "El formato del dominio no es válido (ejemplo: reportes.miagencia.com)." };
  }

  const hostsToQuery = [
    `_tlamatqui-challenge.${cleanDomain}`,
    cleanDomain
  ];

  let foundToken = false;
  let queriedHost = "";

  for (const host of hostsToQuery) {
    try {
      const records = await dns.resolveTxt(host);
      // records es un arreglo de arreglos de cadenas: string[][]
      const flatRecords = records.map(r => r.join(""));
      for (const rec of flatRecords) {
        if (rec.includes(expectedToken) || rec.includes(expectedToken.replace("tlamatqui-verify-sec_", ""))) {
          foundToken = true;
          queriedHost = host;
          break;
        }
      }
      if (foundToken) break;
    } catch (e) {
      // Continuar al siguiente host si falla
    }
  }

  if (foundToken) {
    const config = await getDbConfig();
    config.customDomain = `https://${cleanDomain}`;
    config.domainVerified = true;
    config.domainVerifiedAt = new Date().toISOString();
    const updated = await saveDbConfig(config);
    return {
      success: true,
      message: `¡Dominio verificado con éxito en '${queriedHost}'!`,
      config: updated
    };
  }

  return {
    success: false,
    message: `No se encontró el registro TXT requerido en '${cleanDomain}' o '_tlamatqui-challenge.${cleanDomain}'. Verifica el valor e intenta nuevamente tras la propagación DNS.`
  };
}

// ==========================================
// TEAMS CRUD OPERATORS
// ==========================================

/**
 * Obtiene el listado de todos los equipos de trabajo registrados.
 * 
 * @returns {Promise<Team[]>} Arreglo de equipos con sus miembros asignados.
 */
export async function getDbTeams(): Promise<Team[]> {
  const cachedTeams = getCachedQueryResult<Team[]>("teams");
  if (cachedTeams) return cachedTeams;

  let result: Team[] = [];
  if (isPrismaEnabled()) {
    const prisma = getPrisma();
    if (prisma) {
      try {
        const dbTeams = await withDbTimeout(
          prisma.team.findMany({
            include: { members: true }
          }),
          3500
        );
        result = dbTeams.map(t => ({
          id: t.id,
          name: t.name,
          image: t.image || undefined,
          ownerName: t.ownerName,
          ownerEmail: t.ownerEmail,
          members: t.members.map(m => ({
            id: m.id,
            name: m.name,
            email: m.email,
            role: m.role as any,
            avatar: m.avatar || undefined
          })),
          inviteToken: t.inviteToken || `team-inv-sec_${crypto.randomBytes(6).toString("hex")}`,
          inviteRole: (t.inviteRole as any) || "Visor",
          createdAt: t.createdAt.toISOString()
        }));
      } catch (err) {
        console.error("Error fetching teams from database:", err);
      }
    }
  }

  if (!result || result.length === 0) {
    result = await readJsonAsync<Team[]>(TEAMS_FILE, []);
  }

  setCachedQueryResult("teams", result, 3000);
  return result;
}


/**
 * Guarda o actualiza un equipo de trabajo con sus miembros asociados.
 * 
 * @param {Team} team - Instancia del equipo a guardar.
 * @returns {Promise<Team>} Equipo guardado en la base de datos o almacenamiento local.
 */
export async function saveDbTeam(team: Team): Promise<Team> {
  if (isPrismaEnabled()) {
    const prisma = getPrisma();
    if (prisma) {
      try {
        // Since members are a child relation table, clear existing and insert to sync
        await prisma.$transaction([
          prisma.teamMember.deleteMany({ where: { teamId: team.id } }),
          prisma.team.upsert({
            where: { id: team.id },
            update: {
              name: team.name,
              image: team.image || null,
              ownerName: team.ownerName,
              ownerEmail: team.ownerEmail,
              inviteToken: team.inviteToken || `team-inv-sec_${crypto.randomBytes(6).toString("hex")}`,
              inviteRole: (team.inviteRole as any) || "Visor",
              members: {
                create: team.members.map(m => ({
                  id: m.id,
                  name: m.name,
                  email: m.email,
                  role: m.role as any,
                  avatar: m.avatar || null
                }))
              }
            },
            create: {
              id: team.id,
              name: team.name,
              image: team.image || null,
              ownerName: team.ownerName,
              ownerEmail: team.ownerEmail,
              inviteToken: team.inviteToken || `team-inv-sec_${crypto.randomBytes(6).toString("hex")}`,
              inviteRole: (team.inviteRole as any) || "Visor",
              createdAt: team.createdAt ? new Date(team.createdAt) : new Date(),
              members: {
                create: team.members.map(m => ({
                  id: m.id,
                  name: m.name,
                  email: m.email,
                  role: m.role as any,
                  avatar: m.avatar || null
                }))
              }
            }
          })
        ]);

        return team;
      } catch (err) {
        console.error("Error saving team to database:", err);
      }
    }
  }

  // Local fallback
  const teams = await getDbTeams();
  const index = teams.findIndex(t => t.id === team.id);
  const cleanTeam = {
    ...team,
    inviteToken: team.inviteToken || `team-inv-sec_${crypto.randomBytes(6).toString("hex")}`,
    inviteRole: team.inviteRole || "Visor",
    createdAt: team.createdAt || new Date().toISOString()
  };

  if (index === -1) {
    teams.push(cleanTeam);
  } else {
    teams[index] = cleanTeam;
  }

  try {
    fs.writeFileSync(TEAMS_FILE, JSON.stringify(teams, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing team to local file:", err);
  }
  return cleanTeam;
}

/**
 * Elimina un equipo de trabajo por su identificador único.
 * 
 * @param {string} id - ID del equipo a eliminar.
 * @returns {Promise<boolean>} Retorna verdadero si la eliminación fue exitosa.
 */
export async function deleteDbTeam(id: string): Promise<boolean> {
  if (isPrismaEnabled()) {
    const prisma = getPrisma();
    if (prisma) {
      try {
        await prisma.team.delete({ where: { id } });
        return true;
      } catch (err) {
        console.error("Error deleting team from database:", err);
      }
    }
  }

  // Local fallback
  const teams = await getDbTeams();
  const filtered = teams.filter(t => t.id !== id);
  if (teams.length === filtered.length) {
    return false;
  }
  try {
    fs.writeFileSync(TEAMS_FILE, JSON.stringify(filtered, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error deleting team from local file:", err);
    return false;
  }
}

/**
 * Busca un equipo de trabajo por su token de invitación.
 * 
 * @param {string} token - Token de invitación del equipo.
 * @returns {Promise<Team | null>} Objeto del equipo o null si no existe.
 */
export async function getTeamByInviteToken(token: string): Promise<Team | null> {
  if (!token || typeof token !== "string") return null;
  const teams = await getDbTeams();
  return teams.find(t => t.inviteToken === token.trim()) || null;
}

/**
 * Regenera un nuevo token de invitación para el equipo dado.
 * 
 * @param {string} teamId - ID del equipo.
 * @returns {Promise<Team | null>} Equipo con el nuevo token generado.
 */
export async function resetTeamInviteToken(teamId: string): Promise<Team | null> {
  const teams = await getDbTeams();
  const team = teams.find(t => t.id === teamId);
  if (!team) return null;
  team.inviteToken = `team-inv-sec_${crypto.randomBytes(6).toString("hex")}`;
  return saveDbTeam(team);
}

/**
 * Incorpora un nuevo miembro a un equipo mediante su token de invitación.
 * 
 * @param {string} token - Token de invitación.
 * @param {string} name - Nombre del usuario a incorporar.
 * @param {string} email - Correo del usuario a incorporar.
 * @param {string} [avatar] - Avatar del usuario opcional.
 * @returns {Promise<{ success: boolean; message: string; team?: Team; member?: any }>} Resultado.
 */
export async function joinTeamViaInviteToken(
  token: string,
  name: string,
  email: string,
  avatar?: string
): Promise<{ success: boolean; message: string; team?: Team; member?: any }> {
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
    return {
      success: true,
      message: `¡Ya formas parte del equipo '${team.name}'!`,
      team,
      member: existingMember
    };
  }

  const newMember = {
    id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim() || cleanEmail.split("@")[0],
    email: cleanEmail,
    role: team.inviteRole || "Visor",
    avatar: avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80`
  };

  team.members.push(newMember);
  const updatedTeam = await saveDbTeam(team);

  // Sincronizar el rol de la cuenta de usuario en el sistema
  try {
    const users = await getDbUsers();
    const targetUserIndex = users.findIndex(u => u.email.toLowerCase() === cleanEmail);
    if (targetUserIndex >= 0 && (users[targetUserIndex].role === "Visor" || !users[targetUserIndex].role)) {
      users[targetUserIndex].role = (team.inviteRole || "Agente") as UserRole;
      await writeJsonAsync(USERS_FILE, users);
    }
  } catch (e) {
    console.warn("No se pudo actualizar el rol de la cuenta del usuario:", e);
  }

  return {
    success: true,
    message: `¡Te has unido exitosamente al equipo '${team.name}' como ${newMember.role}!`,
    team: updatedTeam,
    member: newMember
  };
}


// ==========================================
// REPORTS CRUD OPERATORS
// ==========================================

/**
 * Obtiene el listado completo de reportes de diagnóstico.
 * 
 * @returns {Promise<Report[]>} Arreglo de reportes con herramientas, comparativas e interacciones.
 */
export async function getDbReports(): Promise<Report[]> {
  const cachedReports = getCachedQueryResult<Report[]>("reports");
  if (cachedReports) return cachedReports;

  let result: Report[] = [];
  if (isPrismaEnabled()) {
    const prisma = getPrisma();
    if (prisma) {
      try {
        const dbReports = await withDbTimeout(
          prisma.report.findMany({
            include: {
              tools: true,
              comparisonRows: true,
              interactions: true
            }
          }),
          3500
        );
        result = dbReports.map(r => ({
          id: r.id,
          name: r.name,
          logo: r.logo || undefined,
          tagline: r.tagline,
          fugasCantidad: r.fugasCantidad,
          fugasRangoMin: r.fugasRangoMin,
          fugasRangoMax: r.fugasRangoMax,
          visitasMensuales: r.visitasMensuales,
          gmv: r.gmv,
          shopifyFee: r.shopifyFee,
          msi: r.msi,
          shopifyPlan: r.shopifyPlan as any,
          shopifyPlanCustomFee: r.shopifyPlanCustomFee || undefined,
          shopifyPlanCustomPrice: r.shopifyPlanCustomPrice || undefined,
          shopifyAppsCostUSD: r.shopifyAppsCostUSD || undefined,
          shopifyAppsCostMXN: r.shopifyAppsCostMXN || undefined,
          tiendanubePlan: r.tiendanubePlan as any,
          tools: r.tools.map(t => ({
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
            logo: t.logo || undefined
          })),
          comparisonRows: r.comparisonRows.map(row => ({
            id: row.id,
            variable: row.variable,
            shopify: row.shopify,
            tiendanube: row.tiendanube,
            pillText: row.pillText
          })),
          contactEmail: r.contactEmail,
          contactWhatsapp: r.contactWhatsapp,
          adminLogos: r.adminLogos as any as string[],
          brandCard1Title: r.brandCard1Title || undefined,
          brandCard1Desc: r.brandCard1Desc || undefined,
          brandCard1Logo: r.brandCard1Logo || undefined,
          brandCard1Link: r.brandCard1Link || undefined,
          brandCard2Title: r.brandCard2Title || undefined,
          brandCard2Desc: r.brandCard2Desc || undefined,
          brandCard2Logo: r.brandCard2Logo || undefined,
          brandCard2Link: r.brandCard2Link || undefined,
          finalSlideMainLogo: r.finalSlideMainLogo || undefined,
          createdBy: r.createdBy || undefined,
          createdAt: r.createdAt.toISOString(),
          viewCount: r.viewCount,
          openCount: r.openCount,
          uniqueVisitors: r.uniqueVisitors,
          uniqueVisitorIds: (r.uniqueVisitorIds as any as string[]) || [],
          interactions: r.interactions ? {
            slideViews: r.interactions.slideViews as any,
            whatsappClicks: r.interactions.whatsappClicks,
            toolClicks: r.interactions.toolClicks,
            calculatorInteractions: r.interactions.calculatorInteractions,
            timeSpentSeconds: r.interactions.timeSpentSeconds
          } : undefined,
          teamId: r.teamId || undefined
        }));
      } catch (err) {
        console.error("Error fetching reports from database:", err);
      }
    }
  }

  if (!result || result.length === 0) {
    result = await readJsonAsync<Report[]>(REPORTS_FILE, []);
  }

  setCachedQueryResult("reports", result, 3000);
  return result;
}


/**
 * Obtiene un reporte de diagnóstico por su identificador único.
 * 
 * @param {string} id - ID del reporte.
 * @returns {Promise<Report | null>} Instancia del reporte o `null` si no existe.
 */
export async function getDbReportById(id: string): Promise<Report | null> {
  if (isPrismaEnabled()) {
    const prisma = getPrisma();
    if (prisma) {
      try {
        const r = await prisma.report.findUnique({
          where: { id },
          include: {
            tools: true,
            comparisonRows: true,
            interactions: true
          }
        });
        if (r) {
          return {
            id: r.id,
            name: r.name,
            logo: r.logo || undefined,
            tagline: r.tagline,
            fugasCantidad: r.fugasCantidad,
            fugasRangoMin: r.fugasRangoMin,
            fugasRangoMax: r.fugasRangoMax,
            visitasMensuales: r.visitasMensuales,
            gmv: r.gmv,
            shopifyFee: r.shopifyFee,
            msi: r.msi,
            shopifyPlan: r.shopifyPlan as any,
            shopifyPlanCustomFee: r.shopifyPlanCustomFee || undefined,
            shopifyPlanCustomPrice: r.shopifyPlanCustomPrice || undefined,
            shopifyAppsCostUSD: r.shopifyAppsCostUSD || undefined,
            shopifyAppsCostMXN: r.shopifyAppsCostMXN || undefined,
            tiendanubePlan: r.tiendanubePlan as any,
            tools: r.tools.map(t => ({
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
              logo: t.logo || undefined
            })),
            comparisonRows: r.comparisonRows.map(row => ({
              id: row.id,
              variable: row.variable,
              shopify: row.shopify,
              tiendanube: row.tiendanube,
              pillText: row.pillText
            })),
            contactEmail: r.contactEmail,
            contactWhatsapp: r.contactWhatsapp,
            adminLogos: r.adminLogos as any as string[],
            brandCard1Title: r.brandCard1Title || undefined,
            brandCard1Desc: r.brandCard1Desc || undefined,
            brandCard1Logo: r.brandCard1Logo || undefined,
            brandCard1Link: r.brandCard1Link || undefined,
            brandCard2Title: r.brandCard2Title || undefined,
            brandCard2Desc: r.brandCard2Desc || undefined,
            brandCard2Logo: r.brandCard2Logo || undefined,
            brandCard2Link: r.brandCard2Link || undefined,
            finalSlideMainLogo: r.finalSlideMainLogo || undefined,
            createdAt: r.createdAt.toISOString(),
            viewCount: r.viewCount,
            openCount: r.openCount,
            uniqueVisitors: r.uniqueVisitors,
            uniqueVisitorIds: (r.uniqueVisitorIds as any as string[]) || [],
            interactions: r.interactions ? {
              slideViews: r.interactions.slideViews as any,
              whatsappClicks: r.interactions.whatsappClicks,
              toolClicks: r.interactions.toolClicks,
              calculatorInteractions: r.interactions.calculatorInteractions,
              timeSpentSeconds: r.interactions.timeSpentSeconds
            } : undefined,
            teamId: r.teamId || undefined
          };
        }
      } catch (err) {
        console.error("Error fetching report by ID from database:", err);
      }
    }
  }

  // Local fallback
  const reports = await getDbReports();
  return reports.find(r => r.id === id) || null;
}

/**
 * Guarda o actualiza un reporte de diagnóstico financiero con sus herramientas e interacciones.
 * 
 * @param {Report} report - Datos completos del reporte de diagnóstico.
 * @returns {Promise<Report>} Reporte guardado.
 */
export async function saveDbReport(report: Report): Promise<Report> {
  const prismaReportData = {
    name: report.name,
    logo: report.logo || null,
    tagline: report.tagline,
    fugasCantidad: Math.round(report.fugasCantidad),
    fugasRangoMin: Number(report.fugasRangoMin),
    fugasRangoMax: Number(report.fugasRangoMax),
    visitasMensuales: Math.round(report.visitasMensuales),
    gmv: Number(report.gmv),
    shopifyFee: Number(report.shopifyFee),
    msi: report.msi,
    shopifyPlan: report.shopifyPlan as any,
    shopifyPlanCustomFee: report.shopifyPlanCustomFee || null,
    shopifyPlanCustomPrice: report.shopifyPlanCustomPrice || null,
    shopifyAppsCostUSD: (report as any).shopifyAppsCostUSD || null,
    shopifyAppsCostMXN: (report as any).shopifyAppsCostMXN || null,
    tiendanubePlan: report.tiendanubePlan as any,
    contactEmail: report.contactEmail,
    contactWhatsapp: report.contactWhatsapp,
    adminLogos: report.adminLogos as any,
    brandCard1Title: report.brandCard1Title || null,
    brandCard1Desc: report.brandCard1Desc || null,
    brandCard1Logo: report.brandCard1Logo || null,
    brandCard1Link: report.brandCard1Link || null,
    brandCard2Title: report.brandCard2Title || null,
    brandCard2Desc: report.brandCard2Desc || null,
    brandCard2Logo: report.brandCard2Logo || null,
    brandCard2Link: report.brandCard2Link || null,
    finalSlideMainLogo: report.finalSlideMainLogo || null,
    viewCount: report.viewCount || 0,
    openCount: report.openCount || 0,
    uniqueVisitors: report.uniqueVisitors || 0,
    uniqueVisitorIds: report.uniqueVisitorIds as any || [],
    teamId: report.teamId || null
  };

  if (isPrismaEnabled()) {
    const prisma = getPrisma();
    if (prisma) {
      try {
        await prisma.$transaction([
          // Clear sub relations
          prisma.reportTool.deleteMany({ where: { reportId: report.id } }),
          prisma.reportComparisonRow.deleteMany({ where: { reportId: report.id } }),
          // Upsert core record
          prisma.report.upsert({
            where: { id: report.id },
            update: {
              ...prismaReportData,
              tools: {
                create: report.tools.map(t => ({
                  id: t.id,
                  name: t.name,
                  category: t.category,
                  costType: t.costType as any,
                  costExact: t.costExact,
                  costMin: t.costMin,
                  costMax: t.costMax,
                  currency: t.currency as any,
                  semaphore: t.semaphore as any,
                  url: t.url || null,
                  description: t.description || null,
                  logo: t.logo || null
                }))
              },
              comparisonRows: {
                create: report.comparisonRows.map(row => ({
                  id: row.id,
                  variable: row.variable,
                  shopify: row.shopify,
                  tiendanube: row.tiendanube,
                  pillText: row.pillText
                }))
              },
              interactions: report.interactions ? {
                upsert: {
                  create: {
                    slideViews: report.interactions.slideViews as any,
                    whatsappClicks: report.interactions.whatsappClicks,
                    toolClicks: report.interactions.toolClicks,
                    calculatorInteractions: report.interactions.calculatorInteractions,
                    timeSpentSeconds: report.interactions.timeSpentSeconds
                  },
                  update: {
                    slideViews: report.interactions.slideViews as any,
                    whatsappClicks: report.interactions.whatsappClicks,
                    toolClicks: report.interactions.toolClicks,
                    calculatorInteractions: report.interactions.calculatorInteractions,
                    timeSpentSeconds: report.interactions.timeSpentSeconds
                  }
                }
              } : undefined
            },
            create: {
              id: report.id,
              ...prismaReportData,
              createdAt: report.createdAt ? new Date(report.createdAt) : new Date(),
              tools: {
                create: report.tools.map(t => ({
                  id: t.id,
                  name: t.name,
                  category: t.category,
                  costType: t.costType as any,
                  costExact: t.costExact,
                  costMin: t.costMin,
                  costMax: t.costMax,
                  currency: t.currency as any,
                  semaphore: t.semaphore as any,
                  url: t.url || null,
                  description: t.description || null,
                  logo: t.logo || null
                }))
              },
              comparisonRows: {
                create: report.comparisonRows.map(row => ({
                  id: row.id,
                  variable: row.variable,
                  shopify: row.shopify,
                  tiendanube: row.tiendanube,
                  pillText: row.pillText
                }))
              },
              interactions: report.interactions ? {
                create: {
                  slideViews: report.interactions.slideViews as any,
                  whatsappClicks: report.interactions.whatsappClicks,
                  toolClicks: report.interactions.toolClicks,
                  calculatorInteractions: report.interactions.calculatorInteractions,
                  timeSpentSeconds: report.interactions.timeSpentSeconds
                }
              } : undefined
            }
          })
        ]);

        return report;
      } catch (err) {
        console.error("Error saving report to database:", err);
      }
    }
  }

  // Local fallback
  const reports = await getDbReports();
  const index = reports.findIndex(r => r.id === report.id);
  const cleanReport = {
    ...report,
    createdAt: report.createdAt || new Date().toISOString()
  };

  if (index === -1) {
    reports.push(cleanReport);
  } else {
    reports[index] = cleanReport;
  }

  try {
    fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing report to local file:", err);
  }
  invalidateApiQueryCache("reports");
  return cleanReport;
}


/**
 * Elimina un reporte de diagnóstico por su ID.
 * 
 * @param {string} id - Identificador del reporte a eliminar.
 * @returns {Promise<boolean>} Verdadero si el reporte fue eliminado.
 */
export async function deleteDbReport(id: string): Promise<boolean> {
  if (isPrismaEnabled()) {
    const prisma = getPrisma();
    if (prisma) {
      try {
        await prisma.report.delete({ where: { id } });
        invalidateApiQueryCache("reports");
        return true;
      } catch (err) {
        console.error("Error deleting report from database:", err);
      }
    }
  }

  // Local fallback
  const reports = await getDbReports();
  const filtered = reports.filter(r => r.id !== id);
  if (reports.length === filtered.length) {
    return false;
  }
  try {
    fs.writeFileSync(REPORTS_FILE, JSON.stringify(filtered, null, 2), "utf-8");
    invalidateApiQueryCache("reports");
    return true;

  } catch (err) {
    console.error("Error deleting report from local file:", err);
    return false;
  }
}

// ==========================================
// TEMPLATES CRUD OPERATORS
// ==========================================

/**
 * Obtiene todas las plantillas comparativas registradas.
 * 
 * @returns {Promise<ComparisonTemplate[]>} Arreglo de plantillas con sus filas de comparación.
 */
export async function getDbTemplates(): Promise<ComparisonTemplate[]> {
  if (isPrismaEnabled()) {
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
            pillText: row.pillText
          }))
        }));
      } catch (err) {
        console.error("Error fetching templates from database:", err);
      }
    }
  }

  // Local fallback
  try {
    if (fs.existsSync(TEMPLATES_FILE)) {
      return JSON.parse(fs.readFileSync(TEMPLATES_FILE, "utf-8"));
    }
  } catch (error) {
    console.error("Error reading local templates file:", error);
  }
  return [];
}

/**
 * Guarda o actualiza una plantilla comparativa reutilizable.
 * 
 * @param {ComparisonTemplate} template - Datos de la plantilla comparativa.
 * @returns {Promise<ComparisonTemplate>} Plantilla guardada.
 */
export async function saveDbTemplate(template: ComparisonTemplate): Promise<ComparisonTemplate> {
  if (isPrismaEnabled()) {
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
                  pillText: r.pillText
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
                  pillText: r.pillText
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
  }

  // Local fallback
  const templates = await getDbTemplates();
  const index = templates.findIndex(t => t.id === template.id);
  const cleanTemplate = { ...template };

  if (index === -1) {
    templates.push(cleanTemplate);
  } else {
    templates[index] = cleanTemplate;
  }

  await writeJsonAsync(TEMPLATES_FILE, templates);
  return cleanTemplate;
}

/**
 * Elimina una plantilla comparativa por su ID.
 * 
 * @param {string} id - ID de la plantilla a eliminar.
 * @returns {Promise<boolean>} Verdadero si se eliminó correctamente.
 */
export async function deleteDbTemplate(id: string): Promise<boolean> {
  if (isPrismaEnabled()) {
    const prisma = getPrisma();
    if (prisma) {
      try {
        await prisma.comparisonTemplate.delete({ where: { id } });
        return true;
      } catch (err) {
        console.error("Error deleting template from database:", err);
      }
    }
  }

  // Local fallback
  const templates = await getDbTemplates();
  const filtered = templates.filter(t => t.id !== id);
  if (templates.length === filtered.length) {
    return false;
  }
  await writeJsonAsync(TEMPLATES_FILE, filtered);
  return true;
}

// ==========================================
// PARTNERS CRUD OPERATORS
// ==========================================

/**
 * Obtiene los datos del socio/partner consultor autorizado.
 * 
 * @returns {Promise<any>} Objeto con la información del socio.
 */
export async function getDbPartner(): Promise<any> {
  if (isPrismaEnabled()) {
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
  }

  // Fallback to local files
  return readJsonAsync(PARTNERS_FILE, DEFAULT_PARTNER);
}

/**
 * Guarda o actualiza la configuración del socio/partner consultor.
 * 
 * @param {any} partner - Datos del socio a guardar.
 * @returns {Promise<any>} Socio guardado.
 */
export async function saveDbPartner(partner: any): Promise<any> {
  const cleanPartner = {
    name: partner.name || DEFAULT_PARTNER.name,
    logo: partner.logo || DEFAULT_PARTNER.logo,
    description: partner.description || DEFAULT_PARTNER.description,
    link: partner.link || DEFAULT_PARTNER.link,
  };

  if (isPrismaEnabled()) {
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
  }

  // Save to local file
  const fullPartner = {
    id: "default",
    ...cleanPartner,
    members: (partner.members || []).map((m: any) => ({
      id: m.id || "m-" + Math.random().toString(36).substring(2, 11),
      name: m.name,
      email: m.email,
      role: m.role || "Lector",
      partnerId: "default"
    }))
  };

  await writeJsonAsync(PARTNERS_FILE, fullPartner);
  return fullPartner;
}

// ==========================================
// LOGO CONFIG CRUD OPERATORS
// ==========================================

/**
 * Obtiene la configuración del tipo de logo (texto o logo), texto/archivo de logo y correo global.
 * 
 * @returns {Promise<any>} Objeto de configuración de logo y correo global.
 */
export async function getDbLogoConfig(): Promise<any> {
  if (isPrismaEnabled()) {
    const prisma = getPrisma();
    if (prisma) {
      try {
        const logoConfig = await prisma.logoConfig.findUnique({ where: { id: "default" } });
        if (logoConfig) return logoConfig;
      } catch (err) {
        console.error("Error reading logo config from database:", err);
      }
    }
  }

  // Fallback to local files
  return readJsonAsync(LOGO_CONFIG_FILE, DEFAULT_LOGO_CONFIG);
}

/**
 * Guarda o actualiza la configuración del logo (tipo de logo, texto, archivo) y correo global.
 * 
 * @param {any} logoConfig - Objeto con la configuración del logo a actualizar.
 * @returns {Promise<any>} Configuración guardada.
 */
export async function saveDbLogoConfig(logoConfig: any): Promise<any> {
  const cleanConfig = {
    logoType: logoConfig.logoType === "logo" ? "logo" : "text",
    logoText: logoConfig.logoText !== undefined ? logoConfig.logoText : DEFAULT_LOGO_CONFIG.logoText,
    logoFile: logoConfig.logoFile !== undefined ? logoConfig.logoFile : DEFAULT_LOGO_CONFIG.logoFile,
    globalEmail: logoConfig.globalEmail !== undefined ? logoConfig.globalEmail : DEFAULT_LOGO_CONFIG.globalEmail
  };

  if (isPrismaEnabled()) {
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
  }

  const result = { id: "default", ...cleanConfig };
  await writeJsonAsync(LOGO_CONFIG_FILE, result);
  return result;
}

// ============================================================================
// GESTIÓN Y PERSISTENCIA MULTI-USUARIO (REGLA: PRIMER USUARIO = SUPERUSUARIO)
// ============================================================================

/**
 * Obtiene el listado completo de usuarios registrados en el sistema.
 */
export async function getDbUsers(): Promise<UserAccount[]> {
  if (isPrismaEnabled()) {
    const prisma = getPrisma();
    if (prisma) {
      try {
        const users = await withDbTimeout(
          prisma.user.findMany({
            orderBy: { createdAt: "asc" }
          }),
          3500
        );
        return users.map((u: any) => ({

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
  }
  const rawUsers = await readJsonAsync<UserAccount[]>(USERS_FILE, []);
  return rawUsers.map((u) => ({
    ...u,
    accessToken: u.accessToken ? decryptText(u.accessToken) : undefined,
    idToken: u.idToken ? decryptText(u.idToken) : undefined
  }));
}

/**
 * Retorna la dirección de correo configurada en variables de entorno como Superusuario Inicial.
 */
export function getConfiguredSuperAdminEmail(): string {
  return (
    process.env.SUPERADMIN_EMAIL ||
    process.env.INITIAL_SUPERADMIN_EMAIL ||
    process.env.FIRST_SUPERADMIN_EMAIL ||
    ""
  ).trim().toLowerCase();
}

/**
 * Obtiene la lista persistente de correos con rol de Superusuario preservados entre actualizaciones.
 */
export async function getPersistentSuperAdminEmails(): Promise<string[]> {
  const envEmail = getConfiguredSuperAdminEmail();
  const fileEmails = await readJsonAsync<string[]>(SUPERADMIN_EMAILS_FILE, []);
  const list = new Set<string>();
  if (envEmail) list.add(envEmail.toLowerCase());
  fileEmails.forEach((e) => {
    if (e && typeof e === "string") list.add(e.trim().toLowerCase());
  });
  return Array.from(list);
}

/**
 * Registra y preserva un correo en el listado de Superusuarios permanentes.
 */
export async function addPersistentSuperAdminEmail(email: string): Promise<void> {
  if (!email || typeof email !== "string" || !email.includes("@")) return;
  const clean = email.trim().toLowerCase();
  const current = await readJsonAsync<string[]>(SUPERADMIN_EMAILS_FILE, []);
  const normalized = current.map((e) => e.trim().toLowerCase());
  if (!normalized.includes(clean)) {
    normalized.push(clean);
    await writeJsonAsync(SUPERADMIN_EMAILS_FILE, normalized);
  }
}

/**
 * Registra un nuevo usuario o sincroniza su perfil y tokens Auth0 cifrados en cada inicio de sesión.
 * REGLA OBLIGATORIA: Si el usuario ya era Superusuario, su correo está registrado como Superusuario o es el 1er usuario, 
 * CONSERVA permanentemente el rol de "Superusuario" sin importar actualizaciones o inicios de sesión posteriores.
 */
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
  const users = await getDbUsers();
  const cleanEmail = userData.email.trim().toLowerCase();
  
  const persistentSuperAdmins = await getPersistentSuperAdminEmails();
  const configuredSuperAdminEmail = getConfiguredSuperAdminEmail();
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

  // Cifrado transparente AES-256-GCM para tokens Auth0
  const encryptedAccessToken = userData.accessToken ? encryptText(userData.accessToken) : undefined;
  const encryptedIdToken = userData.idToken ? encryptText(userData.idToken) : undefined;

  // Buscar si el usuario ya existe por email o sub de Auth0
  const existingUserIndex = users.findIndex(
    (u) => (cleanEmail && u.email.toLowerCase() === cleanEmail) || (userData.sub && u.sub === userData.sub)
  );

  // 1. SI EL USUARIO YA EXISTE: Actualizar datos de perfil y tokens de sesión cifrados (PRESERVANDO SUPERUSUARIO)
  if (existingUserIndex >= 0) {
    const existingUser = users[existingUserIndex];
    const isSuperUser = existingUser.role === "Superusuario" || isSuperAdminEmail || userData.role === "Superusuario";
    const targetRole = isSuperUser ? "Superusuario" : existingUser.role;

    if (isSuperUser && cleanEmail) {
      await addPersistentSuperAdminEmail(cleanEmail).catch(() => {});
    }

    const updatedUser: UserAccount = {
      ...existingUser,
      name: userData.name || existingUser.name,
      avatar: userData.avatar || existingUser.avatar,
      sub: userData.sub || existingUser.sub,
      role: targetRole,
      accessToken: userData.accessToken || existingUser.accessToken,
      idToken: userData.idToken || existingUser.idToken,
      tokenExpiresAt: formattedExpiresAt || existingUser.tokenExpiresAt,
      lastLoginAt: formattedLastLoginAt,
      updatedAt: new Date().toISOString()
    };

    // Para la lista en memoria/JSON guardamos la versión cifrada
    const updatedUserForStorage = {
      ...updatedUser,
      accessToken: encryptedAccessToken || (existingUser.accessToken ? encryptText(existingUser.accessToken) : undefined),
      idToken: encryptedIdToken || (existingUser.idToken ? encryptText(existingUser.idToken) : undefined)
    };

    users[existingUserIndex] = updatedUserForStorage;

    if (isPrismaEnabled()) {
      const prisma = getPrisma();
      if (prisma) {
        try {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              name: updatedUser.name,
              avatar: updatedUser.avatar,
              sub: updatedUser.sub,
              role: targetRole,
              accessToken: updatedUserForStorage.accessToken,
              idToken: updatedUserForStorage.idToken,
              tokenExpiresAt: updatedUser.tokenExpiresAt ? new Date(updatedUser.tokenExpiresAt) : null,
              lastLoginAt: new Date(updatedUser.lastLoginAt || new Date())
            }
          });
        } catch (err) {
          console.error("Error al actualizar usuario en Prisma:", err);
        }
      }
    }
    await writeJsonAsync(USERS_FILE, users);
    return updatedUser;
  }

  // 2. SI ES UN USUARIO NUEVO:
  const isFirstUserInSystem = users.length === 0;
  const assignedRole: "Superusuario" | "Administrador" | "Agente" | "Visor" = (isFirstUserInSystem || isSuperAdminEmail || userData.role === "Superusuario")
    ? "Superusuario"
    : (userData.role || "Visor");

  if (assignedRole === "Superusuario" && cleanEmail) {
    await addPersistentSuperAdminEmail(cleanEmail).catch(() => {});
  }

  if (isFirstUserInSystem || isSuperAdminEmail) {
    console.log(`\x1b[33m[User Manager]\x1b[0m Otorgando rol de Superusuario a: ${cleanEmail} (Motivo: ${isFirstUserInSystem ? "Primer usuario registrado en el sistema" : "Superusuario Persistente / Env SUPERADMIN_EMAIL"})`);
  }

  const newUser: UserAccount = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    email: cleanEmail,
    name: userData.name || cleanEmail.split("@")[0] || "Usuario",
    role: assignedRole,
    avatar: userData.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    sub: userData.sub || undefined,
    accessToken: userData.accessToken || undefined,
    idToken: userData.idToken || undefined,
    tokenExpiresAt: formattedExpiresAt || undefined,
    lastLoginAt: formattedLastLoginAt,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const newUserForStorage = {
    ...newUser,
    accessToken: encryptedAccessToken,
    idToken: encryptedIdToken
  };

  users.push(newUserForStorage);

  if (isPrismaEnabled()) {
    const prisma = getPrisma();
    if (prisma) {
      try {
        await prisma.user.create({
          data: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role as any,
            avatar: newUser.avatar,
            sub: newUser.sub,
            accessToken: encryptedAccessToken,
            idToken: encryptedIdToken,
            tokenExpiresAt: newUser.tokenExpiresAt ? new Date(newUser.tokenExpiresAt) : null,
            lastLoginAt: newUser.lastLoginAt ? new Date(newUser.lastLoginAt) : new Date()
          }
        });
      } catch (err) {
        console.error("Error al crear usuario en Prisma:", err);
      }
    }
  }

  await writeJsonAsync(USERS_FILE, users);
  return newUser;
}

/**
 * Actualiza el rol de un usuario existente (Requiere permisos de Superusuario o Administrador).
 * Preserva automáticamente la dirección de correo en la lista persistente de Superusuarios si se le asigna dicho rol.
 */
export async function updateUserRole(userId: string, newRole: "Superusuario" | "Administrador" | "Agente" | "Visor"): Promise<UserAccount | null> {
  const users = await getDbUsers();
  const userIndex = users.findIndex((u) => u.id === userId || u.email === userId);

  if (userIndex < 0) return null;

  users[userIndex].role = newRole;
  users[userIndex].updatedAt = new Date().toISOString();

  if (newRole === "Superusuario" && users[userIndex].email) {
    await addPersistentSuperAdminEmail(users[userIndex].email).catch(() => {});
  }

  if (isPrismaEnabled()) {
    const prisma = getPrisma();
    if (prisma) {
      try {
        await prisma.user.update({
          where: { id: users[userIndex].id },
          data: { role: newRole as any }
        });
      } catch (err) {
        console.error("Error al actualizar rol en Prisma:", err);
      }
    }
  }

  await writeJsonAsync(USERS_FILE, users);
  return users[userIndex];
}

// ============================================================================
// FUNCIONALIDADES EXCLUSIVAS DE SUPERUSUARIO: SALUD, MONITOREO Y ACCESO API
// ============================================================================

/**
 * Obtiene las métricas en tiempo real del estado de salud del sistema y la base de datos.
 */
export async function getSystemHealthStatus(): Promise<SystemHealthData> {
  const startTime = Date.now();
  let dbStatus: "connected" | "disconnected" | "fallback_json" = "fallback_json";
  let dbProvider = "JSON Encrypted Storage Bridge";
  let dbLatencyMs = 0;
  let reportCount = 0;
  let teamCount = 0;
  let userCount = 0;
  let templateCount = 0;

  if (isPrismaEnabled()) {
    const prisma = getPrisma();
    if (prisma) {
      try {
        const pingStart = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        dbLatencyMs = Date.now() - pingStart;
        dbStatus = "connected";
        dbProvider = "PostgreSQL (Prisma ORM)";

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
  }

  if (dbStatus !== "connected") {
    const reports = await readJsonAsync<any[]>(REPORTS_FILE, []);
    const teams = await readJsonAsync<any[]>(TEAMS_FILE, []);
    const users = await getDbUsers();
    const templates = await readJsonAsync<any[]>(TEMPLATES_FILE, []);
    reportCount = reports.length;
    teamCount = teams.length;
    userCount = users.length;
    templateCount = templates.length;
    dbLatencyMs = Date.now() - startTime;
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

/**
 * Obtiene el listado de API Keys registradas.
 */
export async function getDbApiKeys(): Promise<ApiKeyItem[]> {
  if (isPrismaEnabled()) {
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
  }
  return await readJsonAsync<ApiKeyItem[]>(API_KEYS_FILE, []);
}

/**
 * Crea una nueva API Key para integraciones externas.
 */
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

  if (isPrismaEnabled()) {
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
  }

  const existing = await readJsonAsync<ApiKeyItem[]>(API_KEYS_FILE, []);
  existing.unshift(newKey);
  await writeJsonAsync(API_KEYS_FILE, existing);

  return { apiKey: newKey, rawToken };
}

/**
 * Elimina o revoca una API Key existente.
 */
export async function deleteDbApiKey(id: string): Promise<boolean> {
  if (isPrismaEnabled()) {
    const prisma = getPrisma();
    if (prisma) {
      try {
        await prisma.apiKey.delete({ where: { id } });
      } catch (err) {
        console.error("Error al eliminar API key en Prisma:", err);
      }
    }
  }

  const existing = await readJsonAsync<ApiKeyItem[]>(API_KEYS_FILE, []);
  const filtered = existing.filter((k) => k.id !== id);
  await writeJsonAsync(API_KEYS_FILE, filtered);
  return true;
}

/**
 * Obtiene el estado actual del bloqueo global de la API.
 */
export async function getApiLockStatus(): Promise<{ apiLocked: boolean; lockReason: string }> {
  if (isPrismaEnabled()) {
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
  }

  const fallback = await readJsonAsync<{ apiLocked: boolean; lockReason: string }>(SYSTEM_SETTINGS_FILE, {
    apiLocked: false,
    lockReason: "Mantenimiento programado de la API"
  });
  return fallback;
}

/**
 * Bloquea o desbloquea el acceso global a la API REST.
 */
export async function toggleApiLock(apiLocked: boolean, lockReason?: string): Promise<{ apiLocked: boolean; lockReason: string }> {
  const cleanReason = lockReason?.trim() || "Mantenimiento programado de la API";
  const result = { apiLocked, lockReason: cleanReason };

  if (isPrismaEnabled()) {
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
  }

  await writeJsonAsync(SYSTEM_SETTINGS_FILE, result);
  return result;
}

/**
 * Restablece la instancia completa a su configuración de fábrica (Factory Reset).
 * Elimina reportes, usuarios, equipos, llaves de API, reinicia bloqueos de API y restaura la semilla inicial.
 */
export async function resetInstanceToFactorySettings(): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Limpieza de archivos JSON locales (Fallback Bridge)
    await writeJsonAsync(REPORTS_FILE, DEFAULT_REPORTS);
    await writeJsonAsync(TEAMS_FILE, DEFAULT_TEAMS);
    await writeJsonAsync(CONFIG_FILE, DEFAULT_CONFIG);
    await writeJsonAsync(TEMPLATES_FILE, DEFAULT_TEMPLATES);
    await writeJsonAsync(PARTNERS_FILE, DEFAULT_PARTNER);
    await writeJsonAsync(LOGO_CONFIG_FILE, DEFAULT_LOGO_CONFIG);
    await writeJsonAsync(USERS_FILE, []);
    await writeJsonAsync(API_KEYS_FILE, []);
    await writeJsonAsync(SYSTEM_SETTINGS_FILE, { id: "default", apiLocked: false, lockReason: "Mantenimiento programado de la API" });

    // 2. Limpieza y re-sembrado en PostgreSQL Prisma ORM
    if (isPrismaEnabled()) {
      const prisma = getPrisma();
      if (prisma) {
        await prisma.$transaction([
          prisma.reportTool.deleteMany({}),
          prisma.reportComparisonRow.deleteMany({}),
          prisma.reportInteraction.deleteMany({}),
          prisma.report.deleteMany({}),
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

        await initializeDatabase();
      }
    }

    return {
      success: true,
      message: "🟢 La instancia ha sido restablecida exitosamente a su configuración de fábrica."
    };
  } catch (error: any) {
    console.error("Error al ejecutar restablecimiento a configuración de fábrica:", error);
    return {
      success: false,
      message: `Error al restablecer la instancia: ${error?.message || "Fallo interno de almacenamiento"}`
    };
  }
}

