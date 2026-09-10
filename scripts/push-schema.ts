import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const ddl = `
-- 1. Crear Tipos ENUM si no existen
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
        CREATE TYPE "Role" AS ENUM ('Superusuario', 'Administrador', 'Agente', 'Visor');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ShopifyPlan') THEN
        CREATE TYPE "ShopifyPlan" AS ENUM ('basic', 'grow', 'advanced', 'plus', 'custom');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TiendanubePlan') THEN
        CREATE TYPE "TiendanubePlan" AS ENUM ('basic', 'tiendanube', 'advanced', 'evolution');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CostType') THEN
        CREATE TYPE "CostType" AS ENUM ('exact', 'range');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Currency') THEN
        CREATE TYPE "Currency" AS ENUM ('MXN', 'USD');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Semaphore') THEN
        CREATE TYPE "Semaphore" AS ENUM ('green', 'yellow', 'red');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LogoType') THEN
        CREATE TYPE "LogoType" AS ENUM ('text', 'logo');
    END IF;
END $$;

-- 2. Tablas
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'Visor',
    "avatar" TEXT,
    "sub" TEXT UNIQUE,
    "accessToken" TEXT,
    "idToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");

CREATE TABLE IF NOT EXISTS "Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT UNIQUE,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "ownerName" TEXT NOT NULL,
    "ownerEmail" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "ownerId" TEXT,
    "inviteToken" TEXT DEFAULT '',
    "inviteRole" "Role" NOT NULL DEFAULT 'Visor',
    "teamBrandName" TEXT,
    "teamBrandLogo" TEXT,
    "teamBrandWebsite" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Team_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Team_slug_idx" ON "Team"("slug");
CREATE INDEX IF NOT EXISTS "Team_ownerEmail_idx" ON "Team"("ownerEmail");
CREATE INDEX IF NOT EXISTS "Team_ownerId_idx" ON "Team"("ownerId");

CREATE TABLE IF NOT EXISTS "TeamConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamConfig_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "TeamReportConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "configId" TEXT NOT NULL UNIQUE,
    "emailReport" TEXT,
    "phoneReport" DOUBLE PRECISION,
    "userId" TEXT UNIQUE,
    "reportLogos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeamReportConfig_configId_fkey" FOREIGN KEY ("configId") REFERENCES "TeamConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamReportConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "TeamReportConfig_userId_idx" ON "TeamReportConfig"("userId");

CREATE TABLE IF NOT EXISTS "TeamMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'Visor',
    "avatar" TEXT,
    "status" TEXT NOT NULL DEFAULT 'approved',
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "partnerEmail" TEXT,
    "requestedAt" TIMESTAMP(3),
    "teamId" TEXT NOT NULL,
    "userId" TEXT,
    CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "TeamMember_teamId_idx" ON "TeamMember"("teamId");
CREATE INDEX IF NOT EXISTS "TeamMember_userId_idx" ON "TeamMember"("userId");
CREATE INDEX IF NOT EXISTS "TeamMember_email_idx" ON "TeamMember"("email");

CREATE TABLE IF NOT EXISTS "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "tagline" TEXT,
    "businessUrl" TEXT,
    "contactEmail" TEXT,
    "contactWhatsapp" TEXT,
    "detectedCms" TEXT DEFAULT 'Shopify',
    "activeTheme" TEXT,
    "screenshotDesktop" TEXT,
    "screenshotMobile" TEXT,
    "paymentGateways" JSONB,
    "pixels" JSONB,
    "infrastructure" JSONB,
    "serverLocation" JSONB,
    "serverLatencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "teamId" TEXT,
    "creatorId" TEXT,
    CONSTRAINT "Report_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Report_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Report_teamId_idx" ON "Report"("teamId");
CREATE INDEX IF NOT EXISTS "Report_creatorId_idx" ON "Report"("creatorId");

CREATE TABLE IF NOT EXISTS "ReportPageSpeed" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL UNIQUE,
    "performanceScore" INTEGER NOT NULL DEFAULT 0,
    "accessibilityScore" INTEGER NOT NULL DEFAULT 0,
    "seoScore" INTEGER NOT NULL DEFAULT 0,
    "fcp" TEXT,
    "lcp" TEXT,
    "tbt" TEXT,
    "cls" TEXT,
    "speedIndex" TEXT,
    "interactive" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ReportPageSpeed_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ReportMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL UNIQUE,
    "visitasMensuales" INTEGER NOT NULL DEFAULT 0,
    "gmv" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fugasCantidad" INTEGER,
    "fugasRangoMin" DOUBLE PRECISION,
    "fugasRangoMax" DOUBLE PRECISION,
    CONSTRAINT "ReportMetrics_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ReportPlatformConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL UNIQUE,
    "shopifyPlan" "ShopifyPlan" NOT NULL DEFAULT 'grow',
    "shopifyFee" DOUBLE PRECISION,
    "msi" TEXT,
    "shopifyPlanCustomFee" DOUBLE PRECISION,
    "shopifyPlanCustomPrice" DOUBLE PRECISION,
    "shopifyAppsCostUSD" DOUBLE PRECISION,
    "shopifyAppsCostMXN" DOUBLE PRECISION,
    "tiendanubePlan" "TiendanubePlan" NOT NULL DEFAULT 'evolution',
    CONSTRAINT "ReportPlatformConfig_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ReportAnalytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL UNIQUE,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "uniqueVisitors" INTEGER NOT NULL DEFAULT 0,
    "uniqueVisitorIds" JSONB,
    CONSTRAINT "ReportAnalytics_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ReportTool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "costType" "CostType" NOT NULL DEFAULT 'exact',
    "costExact" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costMin" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costMax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "semaphore" "Semaphore" NOT NULL DEFAULT 'green',
    "url" TEXT,
    "description" TEXT,
    "logo" TEXT,
    "precios" JSONB,
    "selectedPlanId" TEXT,
    "reportId" TEXT NOT NULL,
    CONSTRAINT "ReportTool_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ReportTool_reportId_idx" ON "ReportTool"("reportId");

CREATE TABLE IF NOT EXISTS "ReportComparisonRow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "variable" TEXT NOT NULL,
    "shopify" TEXT NOT NULL,
    "tiendanube" TEXT NOT NULL,
    "pillText" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    CONSTRAINT "ReportComparisonRow_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ReportComparisonRow_reportId_idx" ON "ReportComparisonRow"("reportId");

CREATE TABLE IF NOT EXISTS "ReportInteraction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL UNIQUE,
    "slideViews" JSONB NOT NULL,
    "whatsappClicks" INTEGER NOT NULL DEFAULT 0,
    "toolClicks" INTEGER NOT NULL DEFAULT 0,
    "calculatorInteractions" INTEGER NOT NULL DEFAULT 0,
    "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ReportInteraction_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ComparisonTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "ComparisonTemplateRow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "variable" TEXT NOT NULL,
    "shopify" TEXT NOT NULL,
    "tiendanube" TEXT NOT NULL,
    "pillText" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    CONSTRAINT "ComparisonTemplateRow_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ComparisonTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ComparisonTemplateRow_templateId_idx" ON "ComparisonTemplateRow"("templateId");

CREATE TABLE IF NOT EXISTS "Partner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL DEFAULT 'Socio Principal',
    "logo" TEXT NOT NULL DEFAULT 'https://logo.clearbit.com/tiendanube.com',
    "description" TEXT DEFAULT 'Socio Estratégico en Migraciones y Optimización',
    "link" TEXT DEFAULT 'https://www.tiendanube.com.mx',
    "representativeEmail" TEXT,
    "teamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Partner_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Partner_teamId_idx" ON "Partner"("teamId");

CREATE TABLE IF NOT EXISTS "PartnerMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Lector',
    "partnerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PartnerMember_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "PartnerMember_partnerId_idx" ON "PartnerMember"("partnerId");
CREATE INDEX IF NOT EXISTS "PartnerMember_email_idx" ON "PartnerMember"("email");

CREATE TABLE IF NOT EXISTS "Config" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "adminLogoUrl" TEXT NOT NULL,
    "adminLogo2Url" TEXT DEFAULT '',
    "adminLogo3Url" TEXT DEFAULT '',
    "adminTextUrl" TEXT NOT NULL,
    "appUrl" TEXT NOT NULL,
    "defaultContactEmail" TEXT NOT NULL,
    "defaultContactWhatsapp" TEXT NOT NULL,
    "customExchangeRate" DOUBLE PRECISION NOT NULL,
    "userName" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "userRole" "Role" NOT NULL DEFAULT 'Administrador',
    "userAvatar" TEXT NOT NULL,
    "metricsUpdateInterval" INTEGER NOT NULL,
    "tagline" TEXT DEFAULT 'Auditoría Financiera y Simulación de Ahorros',
    "brandCard1Title" TEXT,
    "brandCard1Desc" TEXT,
    "brandCard1Logo" TEXT,
    "brandCard1Link" TEXT,
    "brandCard2Title" TEXT,
    "brandCard2Desc" TEXT,
    "brandCard2Logo" TEXT,
    "brandCard2Link" TEXT,
    "finalSlideMainLogo" TEXT,
    "customDomain" TEXT DEFAULT '',
    "domainVerificationToken" TEXT DEFAULT '',
    "domainVerified" BOOLEAN NOT NULL DEFAULT false,
    "domainVerifiedAt" TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS "LogoConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "logoType" "LogoType" NOT NULL DEFAULT 'text',
    "logoText" TEXT,
    "logoFile" TEXT,
    "globalEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ApiKey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL UNIQUE,
    "maskedKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdByName" TEXT,
    "createdById" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApiKey_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ApiKey_createdById_idx" ON "ApiKey"("createdById");

CREATE TABLE IF NOT EXISTS "SystemSetting" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "apiLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockReason" TEXT DEFAULT 'Mantenimiento programado de la API',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;

export async function pushSchema(connectionUrl?: string) {
  const rawUrl = connectionUrl || process.env.DATABASE_URL;
  if (!rawUrl) {
    throw new Error("DATABASE_URL no configurada en las variables de entorno");
  }

  const url = rawUrl.includes("uselibpqcompat=true") || rawUrl.includes("sslmode=verify-full") || rawUrl.includes("sslmode=disable")
    ? rawUrl
    : rawUrl.includes("sslmode=require")
      ? (rawUrl.includes("?") ? `${rawUrl}&uselibpqcompat=true` : `${rawUrl}?uselibpqcompat=true&sslmode=require`)
      : rawUrl;

  console.log("🔗 Conectando a PostgreSQL...");
  const pool = new pg.Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();
    console.log("⚡ Conectado. Desplegando DDL en la base de datos...");
    await client.query(ddl);
    console.log("✅ DDL ejecutado con éxito.");

    const res = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
    );
    console.log("\n📋 Tablas activas y verificadas:");
    res.rows.forEach(r => console.log(`  - ${r.table_name}`));
    client.release();
  } finally {
    await pool.end();
  }
}

// Ejecución directa si se invoca desde CLI
if (process.argv[1]?.includes("push-schema")) {
  const urlArg = process.argv.find(a => a.startsWith("--url="))?.split("=")[1];
  pushSchema(urlArg)
    .then(() => console.log("\n🚀 Schema desplegado exitosamente."))
    .catch(err => {
      console.error("\n❌ Error al desplegar schema:", err.message);
      process.exit(1);
    });
}
