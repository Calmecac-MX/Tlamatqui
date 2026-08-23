import { Report } from "../types";
import { generateReportPDF } from "./pdfGenerator";
import ExcelJS from "exceljs";

/**
 * Helper para formatear valores como moneda de México (MXN)
 */
function formatCurrency(val: number): string {
  return `$${val.toLocaleString("es-MX")}`;
}

/**
 * Genera y descarga un archivo Excel (.xlsx) completo con múltiples pestañas y estilos ejecutivos.
 */
export async function exportReportToExcel(report: Report): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Tlamatqui Auditoría Financiera";
  workbook.created = new Date();

  // Color Tokens
  const navyHeaderFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F172A" }, // Slate 900
  };
  const sectionTitleFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E293B" }, // Slate 800
  };
  const subheaderFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF1F5F9" }, // Slate 100
  };
  const highlightFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFDCFCE7" }, // Emerald 100
  };

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FFCBD5E1" } },
    left: { style: "thin", color: { argb: "FFCBD5E1" } },
    bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
    right: { style: "thin", color: { argb: "FFCBD5E1" } },
  };

  // -------------------------------------------------------------
  // PESTAÑA 1: Resumen de Auditoría (Dashboard Completo)
  // -------------------------------------------------------------
  const wsMain = workbook.addWorksheet("Resumen Auditoría");
  wsMain.views = [{ showGridLines: true }];

  // Title Banner
  wsMain.mergeCells("A1:F1");
  const titleCell = wsMain.getCell("A1");
  titleCell.value = `DIAGNÓSTICO FINANCIERO E-COMMERCE - ${report.name.toUpperCase()}`;
  titleCell.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.fill = navyHeaderFill;
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  wsMain.getRow(1).height = 40;

  // Metadata Section
  wsMain.mergeCells("A3:C3");
  const metaTitle = wsMain.getCell("A3");
  metaTitle.value = "DATOS DE LA TIENDA Y PARÁMETROS AUDITADOS";
  metaTitle.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  metaTitle.fill = sectionTitleFill;

  const metaData = [
    ["Plan Shopify Actual", report.shopifyPlan.toUpperCase(), "Plataforma actual"],
    ["Plan Tiendanube Objetivo", report.tiendanubePlan.toUpperCase(), "Plataforma recomendada"],
    ["GMV Mensual Estimado", report.gmv, "MXN / mes"],
    ["Visitas Mensuales", report.visitasMensuales, "Tráfico estimado"],
    ["Ahorro Estimado Min (MXN)", report.fugasRangoMin || 0, "Ahorro mínimo proyectado"],
    ["Ahorro Estimado Max (MXN)", report.fugasRangoMax || 0, "Ahorro máximo proyectado"],
  ];

  metaData.forEach((item, index) => {
    const rowNum = 4 + index;
    const r = wsMain.getRow(rowNum);
    r.getCell(1).value = item[0];
    r.getCell(1).font = { bold: true };
    r.getCell(1).fill = subheaderFill;

    r.getCell(2).value = item[1];
    if (typeof item[1] === "number" && String(item[0]).includes("GMV") || String(item[0]).includes("Ahorro")) {
      r.getCell(2).numFmt = '"$"#,##0';
    } else if (typeof item[1] === "number") {
      r.getCell(2).numFmt = '#,##0';
    }

    r.getCell(3).value = item[2];
    r.getCell(3).font = { italic: true, color: { argb: "FF64748B" } };

    [1, 2, 3].forEach((col) => {
      r.getCell(col).border = thinBorder;
    });
  });

  // Callout Box: Ahorro Estimado Highlight
  wsMain.mergeCells("E3:F5");
  const savingBox = wsMain.getCell("E3");
  savingBox.value = `AHORRO ESTIMADO POTENCIAL\n${formatCurrency(report.fugasRangoMin || 0)} - ${formatCurrency(report.fugasRangoMax || 0)} MXN / mes`;
  savingBox.font = { name: "Calibri", size: 12, bold: true, color: { argb: "FF166534" } };
  savingBox.fill = highlightFill;
  savingBox.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  savingBox.border = {
    top: { style: "medium", color: { argb: "FF166534" } },
    left: { style: "medium", color: { argb: "FF166534" } },
    bottom: { style: "medium", color: { argb: "FF166534" } },
    right: { style: "medium", color: { argb: "FF166534" } },
  };

  // Section 1 Table: Aplicaciones Terceras
  const toolStartRow = 12;
  wsMain.mergeCells(`A${toolStartRow}:F${toolStartRow}`);
  const toolTitle = wsMain.getCell(`A${toolStartRow}`);
  toolTitle.value = "1. APLICACIONES TERCERAS AUDITADAS Y EVALUACIÓN DE RIESGO";
  toolTitle.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  toolTitle.fill = sectionTitleFill;

  const toolHeaders = ["Nombre App", "Categoría", "Costo Mensual", "Divisa", "Riesgo Semáforo", "Descripción / Alternativa Tiendanube"];
  const toolHeaderRow = wsMain.getRow(toolStartRow + 1);
  toolHeaderRow.height = 25;
  toolHeaders.forEach((h, idx) => {
    const c = toolHeaderRow.getCell(idx + 1);
    c.value = h;
    c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = navyHeaderFill;
    c.alignment = { vertical: "middle" };
    c.border = thinBorder;
  });

  (report.tools || []).forEach((tool, idx) => {
    const r = wsMain.getRow(toolStartRow + 2 + idx);
    const costText = tool.costType === "exact" ? tool.costExact : `${tool.costMin} - ${tool.costMax}`;
    const sem = tool.semaphore.toUpperCase();

    r.getCell(1).value = tool.name;
    r.getCell(1).font = { bold: true };
    r.getCell(2).value = tool.category;
    r.getCell(3).value = costText;
    r.getCell(4).value = tool.currency;

    const semCell = r.getCell(5);
    semCell.value = sem;
    semCell.alignment = { horizontal: "center" };
    semCell.font = { bold: true };
    if (sem === "BAJO") {
      semCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };
      semCell.font = { bold: true, color: { argb: "FF15803D" } };
    } else if (sem === "MEDIO") {
      semCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF9C3" } };
      semCell.font = { bold: true, color: { argb: "FFA16207" } };
    } else {
      semCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
      semCell.font = { bold: true, color: { argb: "FFB91C1C" } };
    }

    r.getCell(6).value = tool.description || "";
    r.getCell(6).alignment = { wrapText: true };

    [1, 2, 3, 4, 5, 6].forEach((col) => {
      r.getCell(col).border = thinBorder;
    });
  });

  // Section 2 Table: Matriz Comparativa
  const compStartRow = toolStartRow + 4 + (report.tools || []).length;
  wsMain.mergeCells(`A${compStartRow}:D${compStartRow}`);
  const compTitle = wsMain.getCell(`A${compStartRow}`);
  compTitle.value = "2. MATRIZ COMPARATIVA SHOPIFY VS TIENDANUBE";
  compTitle.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  compTitle.fill = sectionTitleFill;

  const compHeaders = ["Variable Auditoría", "Condición en Shopify", "Ventaja Operativa Tiendanube", "Etiqueta Destacada"];
  const compHeaderRow = wsMain.getRow(compStartRow + 1);
  compHeaderRow.height = 25;
  compHeaders.forEach((h, idx) => {
    const c = compHeaderRow.getCell(idx + 1);
    c.value = h;
    c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = navyHeaderFill;
    c.alignment = { vertical: "middle" };
    c.border = thinBorder;
  });

  (report.comparisonRows || []).forEach((row, idx) => {
    const r = wsMain.getRow(compStartRow + 2 + idx);
    r.getCell(1).value = row.variable;
    r.getCell(1).font = { bold: true };
    r.getCell(2).value = row.shopify;
    r.getCell(2).alignment = { wrapText: true };
    r.getCell(3).value = row.tiendanube;
    r.getCell(3).alignment = { wrapText: true };
    r.getCell(4).value = row.pillText;
    r.getCell(4).alignment = { horizontal: "center" };
    r.getCell(4).font = { bold: true, color: { argb: "FF0369A1" } };

    [1, 2, 3, 4].forEach((col) => {
      r.getCell(col).border = thinBorder;
    });
  });

  // Adjust Column Widths
  wsMain.columns.forEach((column, i) => {
    let maxLen = 15;
    column.eachCell?.({ includeEmpty: false }, (cell) => {
      const valStr = cell.value ? cell.value.toString() : "";
      if (valStr.length > maxLen && valStr.length < 60) {
        maxLen = valStr.length;
      }
    });
    column.width = Math.min(maxLen + 4, 45);
  });

  // -------------------------------------------------------------
  // PESTAÑA 2: Herramientas Auditadas
  // -------------------------------------------------------------
  const wsTools = workbook.addWorksheet("Herramientas Auditadas");
  wsTools.views = [{ showGridLines: true }];
  
  const toolTabHeaderRow = wsTools.getRow(1);
  toolTabHeaderRow.height = 28;
  toolHeaders.forEach((h, idx) => {
    const c = toolTabHeaderRow.getCell(idx + 1);
    c.value = h;
    c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = navyHeaderFill;
    c.alignment = { vertical: "middle" };
    c.border = thinBorder;
  });

  (report.tools || []).forEach((tool, idx) => {
    const r = wsTools.getRow(2 + idx);
    const costText = tool.costType === "exact" ? tool.costExact : `${tool.costMin} - ${tool.costMax}`;
    const sem = tool.semaphore.toUpperCase();

    r.getCell(1).value = tool.name;
    r.getCell(1).font = { bold: true };
    r.getCell(2).value = tool.category;
    r.getCell(3).value = costText;
    r.getCell(4).value = tool.currency;

    const semCell = r.getCell(5);
    semCell.value = sem;
    semCell.alignment = { horizontal: "center" };
    semCell.font = { bold: true };
    if (sem === "BAJO") {
      semCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };
      semCell.font = { bold: true, color: { argb: "FF15803D" } };
    } else if (sem === "MEDIO") {
      semCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF9C3" } };
      semCell.font = { bold: true, color: { argb: "FFA16207" } };
    } else {
      semCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
      semCell.font = { bold: true, color: { argb: "FFB91C1C" } };
    }

    r.getCell(6).value = tool.description || "";
    [1, 2, 3, 4, 5, 6].forEach((col) => {
      r.getCell(col).border = thinBorder;
    });
  });

  wsTools.columns.forEach((column) => {
    column.width = 25;
  });

  // -------------------------------------------------------------
  // PESTAÑA 3: Matriz Comparativa
  // -------------------------------------------------------------
  const wsComp = workbook.addWorksheet("Matriz Comparativa");
  wsComp.views = [{ showGridLines: true }];

  const compTabHeaderRow = wsComp.getRow(1);
  compTabHeaderRow.height = 28;
  compHeaders.forEach((h, idx) => {
    const c = compTabHeaderRow.getCell(idx + 1);
    c.value = h;
    c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = navyHeaderFill;
    c.alignment = { vertical: "middle" };
    c.border = thinBorder;
  });

  (report.comparisonRows || []).forEach((row, idx) => {
    const r = wsComp.getRow(2 + idx);
    r.getCell(1).value = row.variable;
    r.getCell(1).font = { bold: true };
    r.getCell(2).value = row.shopify;
    r.getCell(3).value = row.tiendanube;
    r.getCell(4).value = row.pillText;
    r.getCell(4).alignment = { horizontal: "center" };
    r.getCell(4).font = { bold: true, color: { argb: "FF0369A1" } };

    [1, 2, 3, 4].forEach((col) => {
      r.getCell(col).border = thinBorder;
    });
  });

  wsComp.columns.forEach((column) => {
    column.width = 30;
  });

  // Disparar Descarga en Navegador
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Auditoria_Financiera_${report.name.replace(/\s+/g, "_")}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Genera y dispara la descarga de un archivo CSV estilizado con delimitadores claros y BOM UTF-8.
 */
export function exportReportToCSV(report: Report): void {
  const lines: string[] = [];

  // Header Banner Decorativo
  lines.push("==================================================================================================");
  lines.push(`DIAGNÓSTICO FINANCIERO E-COMMERCE - ${report.name.toUpperCase()}`);
  lines.push("==================================================================================================");
  lines.push(`"Fecha de Emisión:","${new Date().toLocaleDateString("es-MX")}"`);
  lines.push(`"Plan Shopify Actual:","${report.shopifyPlan.toUpperCase()}"`);
  lines.push(`"Plan Tiendanube Objetivo:","${report.tiendanubePlan.toUpperCase()}"`);
  lines.push(`"GMV Mensual Estimado:","${formatCurrency(report.gmv)} MXN"`);
  lines.push(`"Visitas Mensuales:","${report.visitasMensuales.toLocaleString("es-MX")}"`);
  lines.push(`"Rango Ahorro Estimado:","${formatCurrency(report.fugasRangoMin || 0)} - ${formatCurrency(report.fugasRangoMax || 0)} MXN / mes"`);
  lines.push("");

  // Sección 1: Aplicaciones Terceras
  lines.push("--------------------------------------------------------------------------------------------------");
  lines.push("1. APLICACIONES TERCERAS AUDITADAS Y EVALUACIÓN DE RIESGO");
  lines.push("--------------------------------------------------------------------------------------------------");
  lines.push('"Nombre App","Categoría","Costo Mensual","Divisa","Riesgo Semáforo","Descripción / Alternativa Tiendanube"');

  (report.tools || []).forEach((tool) => {
    const costText = tool.costType === "exact" ? tool.costExact : `${tool.costMin} - ${tool.costMax}`;
    const sem = tool.semaphore.toUpperCase();
    const semBadge = sem === "BAJO" ? "🟢 BAJO" : sem === "MEDIO" ? "🟡 MEDIO" : "🔴 ALTO";
    lines.push([
      `"${tool.name.replace(/"/g, '""')}"`,
      `"${tool.category.replace(/"/g, '""')}"`,
      `"${costText}"`,
      `"${tool.currency}"`,
      `"${semBadge}"`,
      `"${(tool.description || "").replace(/"/g, '""')}"`
    ].join(","));
  });

  lines.push("");

  // Sección 2: Matriz Comparativa
  lines.push("--------------------------------------------------------------------------------------------------");
  lines.push("2. MATRIZ COMPARATIVA SHOPIFY VS TIENDANUBE");
  lines.push("--------------------------------------------------------------------------------------------------");
  lines.push('"Variable Auditoría","Condición en Shopify","Ventaja Operativa Tiendanube","Etiqueta Destacada"');

  (report.comparisonRows || []).forEach((row) => {
    lines.push([
      `"${row.variable.replace(/"/g, '""')}"`,
      `"${row.shopify.replace(/"/g, '""')}"`,
      `"${row.tiendanube.replace(/"/g, '""')}"`,
      `"${row.pillText.replace(/"/g, '""')}"`
    ].join(","));
  });

  lines.push("");
  lines.push("==================================================================================================");
  lines.push('"Generado por:","Tlamatqui - Suite de Diagnóstico Financiero e-Commerce"');
  lines.push("==================================================================================================");

  // UTF-8 BOM (\uFEFF) para visualización perfecta en Excel
  const csvContent = "\uFEFF" + lines.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Auditoria_Financiera_${report.name.replace(/\s+/g, "_")}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Genera y descarga un archivo en formato Markdown (.md) estructurado y estilizado.
 */
export function exportReportToMarkdown(report: Report): void {
  const mdLines: string[] = [];

  mdLines.push(`# 📊 Diagnóstico Financiero E-Commerce: ${report.name}`);
  mdLines.push("");
  mdLines.push(`> 💡 **Resumen Ejecutivo:** Evaluación integral de fugas financieras y comparativa operativa entre **Shopify** y **Tiendanube**.`);
  mdLines.push("");

  // Caja de Ahorro Estimado
  mdLines.push(`> 💵 **Rango de Ahorro Estimado:** **${formatCurrency(report.fugasRangoMin || 0)} MXN** a **${formatCurrency(report.fugasRangoMax || 0)} MXN / mes**`);
  mdLines.push("");

  // Tabla Parámetros del Diagnóstico
  mdLines.push("## 📈 Parámetros del Diagnóstico");
  mdLines.push("");
  mdLines.push("| Parámetro | Valor Auditoría |");
  mdLines.push("| :--- | :--- |");
  mdLines.push(`| **Plan Shopify Actual** | \`${report.shopifyPlan.toUpperCase()}\` |`);
  mdLines.push(`| **Plan Tiendanube Objetivo** | \`${report.tiendanubePlan.toUpperCase()}\` |`);
  mdLines.push(`| **GMV Mensual Estimado** | \`${formatCurrency(report.gmv)} MXN\` |`);
  mdLines.push(`| **Visitas Mensuales** | \`${report.visitasMensuales.toLocaleString("es-MX")}\` |`);
  mdLines.push(`| **Fugas Estimadas (Min)** | \`${formatCurrency(report.fugasRangoMin || 0)} MXN\` |`);
  mdLines.push(`| **Fugas Estimadas (Max)** | \`${formatCurrency(report.fugasRangoMax || 0)} MXN\` |`);
  mdLines.push("");

  // Sección 1: Aplicaciones Terceras
  mdLines.push("## 🛠️ 1. Aplicaciones Terceras Auditadas y Evaluación de Riesgo");
  mdLines.push("");
  mdLines.push("| Nombre App | Categoría | Costo Mensual | Divisa | Semáforo | Descripción / Alternativa Tiendanube |");
  mdLines.push("| :--- | :--- | :--- | :---: | :---: | :--- |");

  (report.tools || []).forEach((tool) => {
    const costText = tool.costType === "exact" ? tool.costExact : `${tool.costMin} - ${tool.costMax}`;
    const sem = tool.semaphore.toUpperCase();
    const semBadge = sem === "BAJO" ? "🟢 BAJO" : sem === "MEDIO" ? "🟡 MEDIO" : "🔴 ALTO";
    const desc = (tool.description || "").replace(/\|/g, "\\|");
    mdLines.push(`| **${tool.name}** | ${tool.category} | ${costText} | ${tool.currency} | ${semBadge} | ${desc} |`);
  });

  mdLines.push("");

  // Sección 2: Matriz Comparativa
  mdLines.push("## ⚖️ 2. Matriz Comparativa Shopify vs Tiendanube");
  mdLines.push("");
  mdLines.push("| Variable Auditoría | Condición en Shopify | Ventaja Operativa Tiendanube | Destacado |");
  mdLines.push("| :--- | :--- | :--- | :---: |");

  (report.comparisonRows || []).forEach((row) => {
    const shopifyText = row.shopify.replace(/\|/g, "\\|");
    const tiendanubeText = row.tiendanube.replace(/\|/g, "\\|");
    mdLines.push(`| **${row.variable}** | ${shopifyText} | ${tiendanubeText} | \`${row.pillText}\` |`);
  });

  mdLines.push("");
  mdLines.push("---");
  mdLines.push(`*Generado automáticamente por **Tlamatqui** (${new Date().toLocaleDateString("es-MX")}) - Suite de Diagnóstico Financiero e-Commerce.*`);

  const mdContent = mdLines.join("\n");
  const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Auditoria_Financiera_${report.name.replace(/\s+/g, "_")}.md`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Genera y descarga programáticamente la plantilla PDF de la presentación horizontal.
 */
export async function exportReportToPrintPDF(report: Report): Promise<void> {
  await generateReportPDF(report);
}
