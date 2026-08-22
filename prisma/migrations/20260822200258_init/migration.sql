-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Superusuario', 'Administrador', 'Editor', 'Visor');

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
    "brandCard2Title" TEXT,
    "brandCard2Desc" TEXT,
    "brandCard2Logo" TEXT,
    "brandCard2Link" TEXT,
    "customDomain" TEXT DEFAULT '',
    "domainVerificationToken" TEXT DEFAULT '',
    "domainVerified" BOOLEAN NOT NULL DEFAULT false,
    "domainVerifiedAt" TIMESTAMP(3),

    CONSTRAINT "Config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "ownerName" TEXT NOT NULL,
    "ownerEmail" TEXT NOT NULL,
    "inviteToken" TEXT DEFAULT '',
    "inviteRole" "Role" NOT NULL DEFAULT 'Visor',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'Visor',
    "avatar" TEXT,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "tagline" TEXT,
    "fugasCantidad" INTEGER,
    "fugasRangoMin" DOUBLE PRECISION,
    "fugasRangoMax" DOUBLE PRECISION,
    "visitasMensuales" INTEGER NOT NULL,
    "gmv" DOUBLE PRECISION NOT NULL,
    "shopifyFee" DOUBLE PRECISION,
    "msi" TEXT,
    "businessUrl" TEXT,
    "shopifyPlan" "ShopifyPlan" NOT NULL DEFAULT 'grow',
    "shopifyPlanCustomFee" DOUBLE PRECISION,
    "shopifyPlanCustomPrice" DOUBLE PRECISION,
    "shopifyAppsCostUSD" DOUBLE PRECISION,
    "shopifyAppsCostMXN" DOUBLE PRECISION,
    "tiendanubePlan" "TiendanubePlan" NOT NULL DEFAULT 'evolution',
    "contactEmail" TEXT NOT NULL,
    "contactWhatsapp" TEXT NOT NULL,
    "adminLogos" JSONB NOT NULL,
    "brandCard1Title" TEXT,
    "brandCard1Desc" TEXT,
    "brandCard1Logo" TEXT,
    "brandCard1Link" TEXT,
    "brandCard2Title" TEXT,
    "brandCard2Desc" TEXT,
    "brandCard2Logo" TEXT,
    "brandCard2Link" TEXT,
    "finalSlideMainLogo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "uniqueVisitors" INTEGER NOT NULL DEFAULT 0,
    "uniqueVisitorIds" JSONB,
    "teamId" TEXT,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "name" TEXT NOT NULL DEFAULT 'Socio Principal',
    "logo" TEXT NOT NULL DEFAULT 'https://logo.clearbit.com/tiendanube.com',
    "description" TEXT NOT NULL DEFAULT 'Socio Estratégico en Migraciones y Optimización',
    "link" TEXT DEFAULT 'https://www.tiendanube.com.mx',

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Lector',
    "partnerId" TEXT NOT NULL,

    CONSTRAINT "PartnerMember_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'Visor',
    "avatar" TEXT,
    "sub" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "maskedKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdByName" TEXT,
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
CREATE INDEX "TeamMember_teamId_idx" ON "TeamMember"("teamId");

-- CreateIndex
CREATE INDEX "ComparisonTemplateRow_templateId_idx" ON "ComparisonTemplateRow"("templateId");

-- CreateIndex
CREATE INDEX "Report_teamId_idx" ON "Report"("teamId");

-- CreateIndex
CREATE INDEX "ReportTool_reportId_idx" ON "ReportTool"("reportId");

-- CreateIndex
CREATE INDEX "ReportComparisonRow_reportId_idx" ON "ReportComparisonRow"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportInteraction_reportId_key" ON "ReportInteraction"("reportId");

-- CreateIndex
CREATE INDEX "PartnerMember_partnerId_idx" ON "PartnerMember"("partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_sub_key" ON "User"("sub");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonTemplateRow" ADD CONSTRAINT "ComparisonTemplateRow_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ComparisonTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportTool" ADD CONSTRAINT "ReportTool_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportComparisonRow" ADD CONSTRAINT "ReportComparisonRow_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportInteraction" ADD CONSTRAINT "ReportInteraction_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerMember" ADD CONSTRAINT "PartnerMember_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
