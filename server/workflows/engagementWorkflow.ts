import { getDbReportById, saveDbReport } from "../dbBridge.js";
import { Report } from "../types.js";

export type EngagementEventType = "slide_view" | "whatsapp_click" | "tool_click" | "calculator_change" | "heartbeat";

export interface EngagementEventInput {
  reportId: string;
  visitorId?: string;
  type: EngagementEventType;
  details?: {
    slideName?: string;
    gmv?: number;
    shopifyPlan?: string;
    appsCostUSD?: number;
    appsCostMXN?: number;
    seconds?: number;
    [key: string]: any;
  };
}

export interface EngagementEventResult {
  success: boolean;
  uniqueVisitors: number;
  interactions: any;
  report?: Report;
}

/**
 * Workflow de Telemetría e Interacción en Tiempo Real (EngagementWorkflow).
 * Orquesta el procesamiento de eventos de engagement, rastreo de visitantes únicos,
 * heartbeat de tiempo de lectura, clics de conversión y recálculo dinámico de métricas.
 */
export async function runEngagementWorkflow(input: EngagementEventInput): Promise<EngagementEventResult> {
  const { reportId, visitorId, type, details } = input;

  const report = await getDbReportById(reportId);
  if (!report) {
    throw new Error(`Reporte con ID '${reportId}' no encontrado.`);
  }

  // 1. Rastreo de visitante único
  if (visitorId) {
    if (!report.uniqueVisitorIds) {
      report.uniqueVisitorIds = [];
    }
    if (!report.uniqueVisitorIds.includes(visitorId)) {
      report.uniqueVisitorIds.push(visitorId);
    }
    report.uniqueVisitors = report.uniqueVisitorIds.length;
  }

  // 2. Inicializar estructura de interacciones
  if (!report.interactions) {
    report.interactions = {
      slideViews: {},
      whatsappClicks: 0,
      toolClicks: 0,
      calculatorInteractions: 0,
      timeSpentSeconds: 0
    };
  }

  if (!report.interactions.slideViews) {
    report.interactions.slideViews = {};
  }

  // 3. Procesar tipo específico de evento
  switch (type) {
    case "slide_view": {
      const slide = details?.slideName || "unknown";
      report.interactions.slideViews[slide] = (report.interactions.slideViews[slide] || 0) + 1;
      break;
    }
    case "whatsapp_click": {
      report.interactions.whatsappClicks = (report.interactions.whatsappClicks || 0) + 1;
      break;
    }
    case "tool_click": {
      report.interactions.toolClicks = (report.interactions.toolClicks || 0) + 1;
      break;
    }
    case "calculator_change": {
      report.interactions.calculatorInteractions = (report.interactions.calculatorInteractions || 0) + 1;
      if (details) {
        if (typeof details.gmv === "number") report.gmv = details.gmv;
        if (typeof details.shopifyPlan === "string") report.shopifyPlan = details.shopifyPlan as any;
        if (typeof details.appsCostUSD === "number") (report as any).shopifyAppsCostUSD = details.appsCostUSD;
        if (typeof details.appsCostMXN === "number") (report as any).shopifyAppsCostMXN = details.appsCostMXN;
      }
      break;
    }
    case "heartbeat": {
      const seconds = details?.seconds || 5;
      report.interactions.timeSpentSeconds = (report.interactions.timeSpentSeconds || 0) + seconds;
      break;
    }
  }

  // 4. Persistencia atómica
  const savedReport = await saveDbReport(report);

  return {
    success: true,
    uniqueVisitors: savedReport.uniqueVisitors || 0,
    interactions: savedReport.interactions,
    report: savedReport
  };
}
