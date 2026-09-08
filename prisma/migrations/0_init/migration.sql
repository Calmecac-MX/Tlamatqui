-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Superusuario', 'Administrador', 'Agente', 'Visor');

-- CreateEnum
CREATE TYPE "ShopifyPlan" AS ENUM ('basic', 'grow', 'advanced', 'plus', 'custom');

-- CreateEnum
CREATE TYPE "TiendanubePlan" AS ENUM ('basic', 'tiendanube', 'advanced', 'evolution');

-- CreateEnum
CREATE TYPE "CostType" AS ENUM ('exact', 'range');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('MXN', 'USD');

-- CreateEnum
CREATE TYPE "Semaphore" AS ENUM ('green', 'yellow', 'red');

-- CreateEnum
CREATE TYPE "LogoType" AS ENUM ('text', 'logo');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'Visor',
    "avatar" TEXT,
    "sub" TEXT,
    "accessToken" TEXT,
    "idToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamConfig" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamReportConfig" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "emailReport" TEXT,
    "phoneReport" DOUBLE PRECISION,
    "userId" TEXT,
    "reportLogos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamReportConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportPageSpeed" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
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

    CONSTRAINT "ReportPageSpeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportMetrics" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "visitasMensuales" INTEGER NOT NULL DEFAULT 0,
    "gmv" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fugasCantidad" INTEGER,
    "fugasRangoMin" DOUBLE PRECISION,
    "fugasRangoMax" DOUBLE PRECISION,

    CONSTRAINT "ReportMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportPlatformConfig" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "shopifyPlan" "ShopifyPlan" NOT NULL DEFAULT 'grow',
    "shopifyFee" DOUBLE PRECISION,
    "msi" TEXT,
    "shopifyPlanCustomFee" DOUBLE PRECISION,
    "shopifyPlanCustomPrice" DOUBLE PRECISION,
    "shopifyAppsCostUSD" DOUBLE PRECISION,
    "shopifyAppsCostMXN" DOUBLE PRECISION,
    "tiendanubePlan" "TiendanubePlan" NOT NULL DEFAULT 'evolution',

    CONSTRAINT "ReportPlatformConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportAnalytics" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "uniqueVisitors" INTEGER NOT NULL DEFAULT 0,
    "uniqueVisitorIds" JSONB,

    CONSTRAINT "ReportAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportTool" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "ReportTool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportComparisonRow" (
    "id" TEXT NOT NULL,
    "variable" TEXT NOT NULL,
    "shopify" TEXT NOT NULL,
    "tiendanube" TEXT NOT NULL,
    "pillText" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,

    CONSTRAINT "ReportComparisonRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportInteraction" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "slideViews" JSONB NOT NULL,
    "whatsappClicks" INTEGER NOT NULL DEFAULT 0,
    "toolClicks" INTEGER NOT NULL DEFAULT 0,
    "calculatorInteractions" INTEGER NOT NULL DEFAULT 0,
    "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ReportInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComparisonTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ComparisonTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComparisonTemplateRow" (
    "id" TEXT NOT NULL,
    "variable" TEXT NOT NULL,
    "shopify" TEXT NOT NULL,
    "tiendanube" TEXT NOT NULL,
    "pillText" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,

    CONSTRAINT "ComparisonTemplateRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Socio Principal',
    "logo" TEXT NOT NULL DEFAULT 'https://logo.clearbit.com/tiendanube.com',
    "description" TEXT DEFAULT 'Socio Estratégico en Migraciones y Optimización',
    "link" TEXT DEFAULT 'https://www.tiendanube.com.mx',
    "representativeEmail" TEXT,
    "teamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Lector',
    "partnerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Config" (
    "id" TEXT NOT NULL DEFAULT 'default',
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
    "domainVerifiedAt" TIMESTAMP(3),

    CONSTRAINT "Config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogoConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "logoType" "LogoType" NOT NULL DEFAULT 'text',
    "logoText" TEXT,
    "logoFile" TEXT,
    "globalEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LogoConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "maskedKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdByName" TEXT,
    "createdById" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "apiLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockReason" TEXT DEFAULT 'Mantenimiento programado de la API',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_sub_key" ON "User"("sub");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Team_ownerEmail_idx" ON "Team"("ownerEmail");

-- CreateIndex
CREATE INDEX "Team_ownerId_idx" ON "Team"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamConfig_teamId_key" ON "TeamConfig"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamReportConfig_configId_key" ON "TeamReportConfig"("configId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamReportConfig_userId_key" ON "TeamReportConfig"("userId");

-- CreateIndex
CREATE INDEX "TeamReportConfig_userId_idx" ON "TeamReportConfig"("userId");

-- CreateIndex
CREATE INDEX "TeamMember_teamId_idx" ON "TeamMember"("teamId");

-- CreateIndex
CREATE INDEX "TeamMember_userId_idx" ON "TeamMember"("userId");

-- CreateIndex
CREATE INDEX "TeamMember_email_idx" ON "TeamMember"("email");

-- CreateIndex
CREATE INDEX "Report_teamId_idx" ON "Report"("teamId");

-- CreateIndex
CREATE INDEX "Report_creatorId_idx" ON "Report"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportPageSpeed_reportId_key" ON "ReportPageSpeed"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportMetrics_reportId_key" ON "ReportMetrics"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportPlatformConfig_reportId_key" ON "ReportPlatformConfig"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportAnalytics_reportId_key" ON "ReportAnalytics"("reportId");

-- CreateIndex
CREATE INDEX "ReportTool_reportId_idx" ON "ReportTool"("reportId");

-- CreateIndex
CREATE INDEX "ReportComparisonRow_reportId_idx" ON "ReportComparisonRow"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportInteraction_reportId_key" ON "ReportInteraction"("reportId");

-- CreateIndex
CREATE INDEX "ComparisonTemplateRow_templateId_idx" ON "ComparisonTemplateRow"("templateId");

-- CreateIndex
CREATE INDEX "Partner_teamId_idx" ON "Partner"("teamId");

-- CreateIndex
CREATE INDEX "PartnerMember_partnerId_idx" ON "PartnerMember"("partnerId");

-- CreateIndex
CREATE INDEX "PartnerMember_email_idx" ON "PartnerMember"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_createdById_idx" ON "ApiKey"("createdById");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamConfig" ADD CONSTRAINT "TeamConfig_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamReportConfig" ADD CONSTRAINT "TeamReportConfig_configId_fkey" FOREIGN KEY ("configId") REFERENCES "TeamConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamReportConfig" ADD CONSTRAINT "TeamReportConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportPageSpeed" ADD CONSTRAINT "ReportPageSpeed_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportMetrics" ADD CONSTRAINT "ReportMetrics_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportPlatformConfig" ADD CONSTRAINT "ReportPlatformConfig_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportAnalytics" ADD CONSTRAINT "ReportAnalytics_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportTool" ADD CONSTRAINT "ReportTool_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportComparisonRow" ADD CONSTRAINT "ReportComparisonRow_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportInteraction" ADD CONSTRAINT "ReportInteraction_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonTemplateRow" ADD CONSTRAINT "ComparisonTemplateRow_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ComparisonTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerMember" ADD CONSTRAINT "PartnerMember_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
