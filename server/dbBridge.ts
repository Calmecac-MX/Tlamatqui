import fs, { promises as fsPromises } from "fs";
import path from "path";
import dns from "node:dns/promises";
import crypto from "node:crypto";
import { getPrisma, isPrismaEnabled } from "../src/lib/prisma.js";
import { Team, Report, ComparisonTemplate, ComparisonRow, Tool, LogoConfig } from "../src/types.js";

// Async JSON file helper utilities (non-blocking I/O)
async function readJsonAsync<T>(filePath: string, fallback: T): Promise<T> {
  try {
    if (fs.existsSync(filePath)) {
      const content = await fsPromises.readFile(filePath, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error(`Error al leer archivo JSON asíncrono ${filePath}:`, error);
  }
  return fallback;
}

async function writeJsonAsync<T>(filePath: string, data: T): Promise<void> {
  try {
    await fsPromises.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error(`Error al escribir archivo JSON asíncrono ${filePath}:`, error);
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
        role: "Editor",
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
export async function initializeDatabase() {
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
  let config: any = null;
  if (isPrismaEnabled()) {
    const prisma = getPrisma();
    if (prisma) {
      try {
        config = await prisma.config.findUnique({ where: { id: "default" } });
      } catch (err) {
        console.error("Error reading config from database:", err);
      }
    }
  }

  if (!config) {
    config = await readJsonAsync(CONFIG_FILE, DEFAULT_CONFIG);
  }

  // Ensure token exists
  if (!config.domainVerificationToken) {
    config.domainVerificationToken = "tlamatqui-verify-sec_" + crypto.randomBytes(6).toString("hex");
    await saveDbConfig(config);
  }

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
    customDomain: config.customDomain !== undefined ? config.customDomain : (currentConfig.customDomain || ""),
    domainVerificationToken: config.domainVerificationToken || currentConfig.domainVerificationToken || ("tlamatqui-verify-sec_" + crypto.randomBytes(6).toString("hex")),
    domainVerified: Boolean(config.domainVerified !== undefined ? config.domainVerified : (currentConfig.domainVerified || false)),
    domainVerifiedAt: config.domainVerifiedAt !== undefined ? config.domainVerifiedAt : (currentConfig.domainVerifiedAt || null),
  };

  if (isPrismaEnabled()) {
    const prisma = getPrisma();
    if (prisma) {
      try {
        const updated = await prisma.config.upsert({
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
        return updated;
      } catch (err) {
        console.error("Error writing config to database:", err);
      }
    }
  }

  // Save to local file as fallback/sync
  await writeJsonAsync(CONFIG_FILE, cleanConfig);
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
  if (isPrismaEnabled()) {
    const prisma = getPrisma();
    if (prisma) {
      try {
        const dbTeams = await prisma.team.findMany({
          include: { members: true }
        });
        return dbTeams.map(t => ({
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

  // Local fallback
  try {
    if (fs.existsSync(TEAMS_FILE)) {
      return JSON.parse(fs.readFileSync(TEAMS_FILE, "utf-8"));
    }
  } catch (error) {
    console.error("Error reading local teams file:", error);
  }
  return [];
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
  if (isPrismaEnabled()) {
    const prisma = getPrisma();
    if (prisma) {
      try {
        const dbReports = await prisma.report.findMany({
          include: {
            tools: true,
            comparisonRows: true,
            interactions: true
          }
        });
        return dbReports.map(r => ({
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
        }));
      } catch (err) {
        console.error("Error fetching reports from database:", err);
      }
    }
  }

  // Local fallback
  try {
    if (fs.existsSync(REPORTS_FILE)) {
      return JSON.parse(fs.readFileSync(REPORTS_FILE, "utf-8"));
    }
  } catch (error) {
    console.error("Error reading local reports file:", error);
  }
  return [];
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

  try {
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing template to local file:", err);
  }
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
  try {
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(filtered, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error deleting template from local file:", err);
    return false;
  }
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
  try {
    if (fs.existsSync(PARTNERS_FILE)) {
      return JSON.parse(fs.readFileSync(PARTNERS_FILE, "utf-8"));
    }
  } catch (error) {
    console.error("Error reading local partner file:", error);
  }
  return DEFAULT_PARTNER;
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
  try {
    fs.writeFileSync(PARTNERS_FILE, JSON.stringify(fullPartner, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing partner to local file:", error);
  }
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
  try {
    if (fs.existsSync(LOGO_CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(LOGO_CONFIG_FILE, "utf-8"));
    }
  } catch (error) {
    console.error("Error reading local logo config file:", error);
  }
  return DEFAULT_LOGO_CONFIG;
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
  try {
    fs.writeFileSync(LOGO_CONFIG_FILE, JSON.stringify(result, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing logo config to local file:", error);
  }
  return result;
}

