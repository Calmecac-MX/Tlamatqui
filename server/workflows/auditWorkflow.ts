import { sanitizeDomain } from "../dnsIntegrationService.js";
import { detectStoreWithChismografo, scrapeShopifyStoreNative, resolveTechnologyLogo, ChismografoDiagnosticResult } from "../scrapper.js";
import { saveDbReport, getDbConfig } from "../dbBridge.js";
import { Report, Tool, ComparisonRow, ReportPageSpeed } from "../types.js";
import { sendWorkflowEmail } from "./emailWorkflow.js";
import { isS3Configured, uploadBase64ToStorage, buildStorageKey } from "../storageService.js";

export interface AuditWorkflowInput {
  url: string;
  teamId?: string;
  creatorId?: string;
  contactEmail?: string;
  contactWhatsapp?: string;
  customExchangeRate?: number;
  notifyEmail?: string;
}

export interface AuditWorkflowResult {
  success: boolean;
  report: Report;
  pageSpeed?: ReportPageSpeed;
  summary: {
    storeName: string;
    detectedCms: string;
    appsCount: number;
    estimatedSavingsMXN: number;
    pageSpeedScore: number;
  };
}

/**
 * Workflow Integral de Diagnóstico y Auditoría de E-Commerce (AuditWorkflow).
 * Orquesta la inspección técnica (Chismógrafo), auditoría Lighthouse (PageSpeed),
 * detección de aplicaciones, cálculo financiero y persistencia atómica en PostgreSQL.
 */
export async function runAuditWorkflow(input: AuditWorkflowInput): Promise<AuditWorkflowResult> {
  const normalizedUrl = sanitizeDomain(input.url);
  if (!normalizedUrl || normalizedUrl.length < 3) {
    throw new Error("URL de tienda no válida. Proporciona un dominio o URL accesible.");
  }

  const globalConfig = await getDbConfig().catch(() => ({}));
  const exchangeRate = input.customExchangeRate || globalConfig.customExchangeRate || 18.50;

  // 1. Paso: Chismógrafo técnico e infraestructura
  const chismografoData: ChismografoDiagnosticResult = await detectStoreWithChismografo(normalizedUrl).catch(() => ({
    url: normalizedUrl,
    storeName: normalizedUrl.replace(/^https?:\/\//, "").split(".")[0],
    technology: "Shopify",
    detectedTools: [] as Tool[],
    paymentGateways: [] as string[],
    pixels: [] as any[],
    infrastructure: [] as any[],
    shopifyPlanEstimate: "grow" as const,
    estimatedMonthlyAppCostUSD: 0
  }));

  // 2. Paso: Detección y scraping de herramientas/apps
  const scrapeData = await scrapeShopifyStoreNative(normalizedUrl).catch(() => ({
    url: normalizedUrl,
    storeName: normalizedUrl.replace(/^https?:\/\//, "").split(".")[0],
    detectedTools: [] as Tool[],
    shopifyPlanEstimate: "grow" as const,
    estimatedMonthlyAppCostUSD: 0
  }));

  // 3. Paso: Consolidación de herramientas detectadas y resolución de logotipos
  const combinedTools: Tool[] = [
    ...(scrapeData.detectedTools || []),
    ...(chismografoData.detectedTools || [])
  ];

  // Desduplicar herramientas por nombre
  const uniqueToolsMap = new Map<string, Tool>();
  combinedTools.forEach(t => {
    const key = t.name.trim().toLowerCase();
    if (!uniqueToolsMap.has(key)) {
      uniqueToolsMap.set(key, {
        ...t,
        logo: resolveTechnologyLogo(t.name, t.url, t.logo)
      });
    }
  });
  const finalizedTools = Array.from(uniqueToolsMap.values());

  // 4. Paso: Cálculo de ahorros y estructuración del Reporte
  const storeName = chismografoData.storeName || scrapeData.storeName || normalizedUrl.replace(/^https?:\/\//, "").split(".")[0];
  const gmv = 250000;
  const visitasMensuales = 15000;

  const defaultComparisonRows: ComparisonRow[] = [
    {
      id: `row-tx-${Date.now()}`,
      variable: "Comisión por transacción",
      shopify: "2.0% por venta sin Shopify Payments",
      tiendanube: "0% con Pago Nube / Pasarelas locales",
      pillText: "Ahorro Directo"
    },
    {
      id: `row-apps-${Date.now()}`,
      variable: "Ecosistema de Aplicaciones",
      shopify: "Cobro recurrente mensual en USD",
      tiendanube: "Herramientas clave nativas en MXN",
      pillText: "Menor Gasto Fijo"
    }
  ];

  const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 4.1. Subida optimizada de capturas a S3 con distribución en Bunny CDN
  let screenshotDesktop = chismografoData.screenshots?.desktop || undefined;
  let screenshotMobile = chismografoData.screenshots?.mobile || undefined;

  if (isS3Configured()) {
    try {
      if (screenshotDesktop && screenshotDesktop.startsWith("data:")) {
        const uploadedDesktop = await uploadBase64ToStorage(
          screenshotDesktop,
          buildStorageKey("screenshots", `${reportId}_desktop.webp`),
          "image/webp"
        );
        screenshotDesktop = uploadedDesktop.cdnUrl;
      }

      if (screenshotMobile && screenshotMobile.startsWith("data:")) {
        const uploadedMobile = await uploadBase64ToStorage(
          screenshotMobile,
          buildStorageKey("screenshots", `${reportId}_mobile.webp`),
          "image/webp"
        );
        screenshotMobile = uploadedMobile.cdnUrl;
      }
    } catch (err) {
      console.warn("[AuditWorkflow Storage Warning] Fallback local a captura base64:", err);
    }
  }

  const newReport: Report = {
    id: reportId,
    name: storeName,
    businessUrl: normalizedUrl.startsWith("http") ? normalizedUrl : `https://${normalizedUrl}`,
    tagline: `Auditoría financiera y optimización para ${storeName}`,
    logo: chismografoData.siteLogo || undefined,
    detectedCms: chismografoData.technology || "Shopify",
    activeTheme: chismografoData.theme || undefined,
    screenshotDesktop,
    screenshotMobile,
    paymentGateways: chismografoData.paymentGateways || [],
    pixels: chismografoData.pixels || [],
    infrastructure: chismografoData.infrastructure || [],
    serverLocation: chismografoData.location || undefined,
    serverLatencyMs: chismografoData.latency?.latencyMs || undefined,
    pageSpeed: chismografoData.pageSpeed || undefined,
    tools: finalizedTools,
    comparisonRows: defaultComparisonRows,
    adminLogos: [],
    visitasMensuales,
    gmv,
    fugasCantidad: finalizedTools.length,
    fugasRangoMin: Math.round(gmv * 0.02),
    fugasRangoMax: Math.round(gmv * 0.05),
    shopifyPlan: "grow",
    shopifyFee: 2.0,
    tiendanubePlan: "evolution",
    contactEmail: input.contactEmail || undefined,
    contactWhatsapp: input.contactWhatsapp || undefined,
    teamId: input.teamId || undefined,
    createdBy: input.creatorId || undefined,
    createdAt: new Date().toISOString()
  };

  // 5. Paso: Persistencia atómica en la base de datos PostgreSQL
  const savedReport = await saveDbReport(newReport);

  // 6. Paso: Notificación opcional por correo
  if (input.notifyEmail) {
    try {
      await sendWorkflowEmail({
        type: "report_created",
        recipient: input.notifyEmail,
        payload: {
          storeName: savedReport.name,
          reportUrl: `${globalConfig.appUrl || "https://tlamatqui.calmecac.lat"}/?report=${savedReport.id}`,
          savingsEstimate: savedReport.fugasRangoMax || 0
        }
      });
    } catch (emailErr) {
      console.warn(`[AuditWorkflow] Fallo al enviar email de notificación a ${input.notifyEmail}:`, emailErr);
    }
  }

  return {
    success: true,
    report: savedReport,
    pageSpeed: chismografoData.pageSpeed || undefined,
    summary: {
      storeName: savedReport.name,
      detectedCms: savedReport.detectedCms || "Shopify",
      appsCount: finalizedTools.length,
      estimatedSavingsMXN: savedReport.fugasRangoMax || 0,
      pageSpeedScore: chismografoData.pageSpeed?.performanceScore || 0
    }
  };
}
