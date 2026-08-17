import { Report } from "../types";
import { generateReportPDF } from "./pdfGenerator";

/**
 * Genera y dispara la descarga de un archivo CSV con la matriz completa de auditoría del reporte.
 */
export function exportReportToCSV(report: Report): void {
  const rows: string[][] = [];

  // Metadata Header
  rows.push(["DIAGNÓSTICO FINANCIERO E-COMMERCE", report.name]);
  rows.push(["Plan Shopify Actual", report.shopifyPlan.toUpperCase()]);
  rows.push(["Plan Tiendanube Objetivo", report.tiendanubePlan.toUpperCase()]);
  rows.push(["GMV Mensual Estimado (MXN)", `$${report.gmv.toLocaleString("es-MX")}`]);
  rows.push(["Visitas Mensuales", report.visitasMensuales.toLocaleString("es-MX")]);
  rows.push(["Rango Ahorro Estimado (MXN)", `$${(report.fugasRangoMin || 0).toLocaleString()} - $${(report.fugasRangoMax || 0).toLocaleString()}`]);
  rows.push([]);

  // Section 1: Audited Tools
  rows.push(["APLICACIONES TERCERAS AUDITADAS"]);
  rows.push(["Nombre App", "Categoría", "Costo Mensual", "Divisa", "Riesgo Semáforo", "Descripción / Alternativa Tiendanube"]);

  (report.tools || []).forEach((tool) => {
    const costText = tool.costType === "exact" ? tool.costExact : `${tool.costMin} - ${tool.costMax}`;
    rows.push([
      `"${tool.name}"`,
      `"${tool.category}"`,
      `"${costText}"`,
      `"${tool.currency}"`,
      `"${tool.semaphore.toUpperCase()}"`,
      `"${(tool.description || "").replace(/"/g, '""')}"`
    ]);
  });

  rows.push([]);

  // Section 2: Comparative Matrix
  rows.push(["MATRIZ COMPARATIVA SHOPIFY VS TIENDANUBE"]);
  rows.push(["Variable", "Condición Shopify", "Ventaja Tiendanube", "Destacado"]);

  (report.comparisonRows || []).forEach((row) => {
    rows.push([
      `"${row.variable}"`,
      `"${row.shopify.replace(/"/g, '""')}"`,
      `"${row.tiendanube.replace(/"/g, '""')}"`,
      `"${row.pillText}"`
    ]);
  });

  // Convert array of arrays to CSV text
  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + rows.map((e) => e.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Auditoria_Financiera_${report.name.replace(/\s+/g, "_")}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Genera y descarga programáticamente la plantilla PDF de la presentación horizontal.
 */
export async function exportReportToPrintPDF(report: Report): Promise<void> {
  await generateReportPDF(report);
}
