import jsPDF from "jspdf";
import { Report } from "../types";
import { formatReportDate } from "../utils/formatters";

/**
 * Carga una URL de imagen (data URL o HTTP) como objeto HTMLImageElement de forma asíncrona.
 */
function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Convierte un objeto de imagen HTML en una URL de datos de imagen circular (PNG transparente)
 * utilizando un lienzo 2D auxiliar del navegador.
 */
function makeCircularLogoDataUrl(img: HTMLImageElement): string {
  try {
    const canvas = document.createElement("canvas");
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return img.src;

    // Recortar en forma de círculo perfecto
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Dibujar la imagen adaptada al contenedor circular (object-fit cover)
    const aspect = img.width / img.height;
    let drawW = size;
    let drawH = size;
    let offsetX = 0;
    let offsetY = 0;

    if (aspect > 1) {
      drawW = size * aspect;
      offsetX = -(drawW - size) / 2;
    } else {
      drawH = size / aspect;
      offsetY = -(drawH - size) / 2;
    }

    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
    return canvas.toDataURL("image/png");
  } catch (e) {
    return img.src;
  }
}

/**
 * Genera y descarga un archivo PDF vectorial de la presentación del reporte en formato horizontal (Landscape 16:9)
 * utilizando primitivas gráficas nativas e íconos vectoriales geométricos alineados.
 * Muestra el logotipo circular real de la marca si está disponible.
 * 
 * @param {Report} report - Datos del reporte auditado.
 */
export async function generateReportPDF(report: Report): Promise<void> {
  const W = 297; // Ancho en mm (Landscape 16:9)
  const H = 167.06; // Alto en mm

  // Intentar cargar la imagen del logotipo del comercio si existe
  const logoImg = report.logo ? await loadImage(report.logo) : null;
  const circularLogoDataUrl = logoImg ? makeCircularLogoDataUrl(logoImg) : null;
  const screenshotDesktopImg = report.screenshotDesktop ? await loadImage(report.screenshotDesktop) : null;
  const screenshotMobileImg = report.screenshotMobile ? await loadImage(report.screenshotMobile) : null;

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [W, H],
  });

  const shopifyPlanUpper = (report.shopifyPlan || "grow").toUpperCase();
  const tiendanubePlanUpper = (report.tiendanubePlan || "evolution").toUpperCase();
  
  const minSavings = report.fugasRangoMin || 0;
  const maxSavings = report.fugasRangoMax || 0;
  const avgMonthlySavings = Math.round((minSavings + maxSavings) / 2);
  const annualSavings = avgMonthlySavings * 12;
  const threeYearSavings = annualSavings * 3;

  const totalAppCost = report.shopifyAppsCostMXN || (report.tools || []).reduce((acc, t) => {
    if (t.costType === "exact") return acc + (t.costExact || 0);
    return acc + ((t.costMin || 0) + (t.costMax || 0)) / 2;
  }, 0);

  const shopifyFeeMXN = (report.shopifyFee || 79) * 18.5;
  const shopifyCommissionMXN = report.gmv * 0.01;
  const totalShopifyMonthlyCostMXN = shopifyFeeMXN + shopifyCommissionMXN + totalAppCost;
  const projectedTiendanubeCostMXN = Math.max(0, totalShopifyMonthlyCostMXN - avgMonthlySavings);

  // Paleta de colores corporativos
  const COLOR_BG = [10, 10, 11]; // #0A0A0B
  const COLOR_SURFACE = [22, 22, 24]; // #161618
  const COLOR_BORDER = [42, 42, 46]; // #2A2A2E
  const COLOR_TEXT = [255, 255, 255]; // #FFFFFF
  const COLOR_DIM = [156, 163, 175]; // #9CA3AF
  const COLOR_INDIGO = [99, 102, 241]; // #6366F1
  const COLOR_INDIGO_LIGHT = [129, 140, 248]; // #818CF8
  const COLOR_EMERALD = [16, 185, 129]; // #10B981
  const COLOR_AMBER = [245, 158, 11]; // #F59E0B
  const COLOR_ROSE = [239, 68, 68]; // #EF4444
  const COLOR_PURPLE = [168, 85, 247]; // #A855F7

  // -------------------------------------------------------------
  // SUITE DE ÍCONOS VECTORIALES CON ALINEACIÓN EXACTA
  // -------------------------------------------------------------

  /** Ícono de Verificación / Checkmark Vectorial */
  const drawIconCheck = (x: number, y: number, size = 6, color = COLOR_EMERALD) => {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.circle(x + size / 2, y + size / 2, size / 2, "F");

    doc.setLineWidth(0.6);
    doc.setDrawColor(255, 255, 255);
    doc.line(x + size * 0.25, y + size * 0.5, x + size * 0.45, y + size * 0.7);
    doc.line(x + size * 0.45, y + size * 0.7, x + size * 0.75, y + size * 0.3);
  };

  /** Ícono de Crecimiento / Tendencia Ascendente */
  const drawIconTrending = (x: number, y: number, size = 6, color = COLOR_INDIGO_LIGHT) => {
    doc.setLineWidth(0.7);
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.line(x, y + size * 0.85, x + size * 0.35, y + size * 0.5);
    doc.line(x + size * 0.35, y + size * 0.5, x + size * 0.65, y + size * 0.7);
    doc.line(x + size * 0.65, y + size * 0.7, x + size, y + size * 0.15);

    // Flecha
    doc.line(x + size * 0.6, y + size * 0.15, x + size, y + size * 0.15);
    doc.line(x + size, y + size * 0.15, x + size, y + size * 0.45);
  };

  /** Ícono de Advertencia / Fuga Alerta */
  const drawIconAlert = (x: number, y: number, size = 6, color = COLOR_ROSE) => {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.triangle(x + size / 2, y, x, y + size, x + size, y + size, "F");

    doc.setLineWidth(0.6);
    doc.setDrawColor(255, 255, 255);
    doc.line(x + size / 2, y + size * 0.35, x + size / 2, y + size * 0.65);

    doc.setFillColor(255, 255, 255);
    doc.circle(x + size / 2, y + size * 0.82, 0.35, "F");
  };

  /** Ícono de Divisa / Dinero */
  const drawIconDollar = (x: number, y: number, size = 6, color = COLOR_AMBER) => {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.circle(x + size / 2, y + size / 2, size / 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(size * 1.2);
    doc.setTextColor(10, 10, 11);
    doc.text("$", x + size / 2, y + size * 0.78, { align: "center" });
  };

  /** Ícono de Escudo de Protección Financiera */
  const drawIconShield = (x: number, y: number, size = 6, color = COLOR_EMERALD) => {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(x, y, size, size * 0.65, 1, 1, "F");
    doc.triangle(x, y + size * 0.55, x + size, y + size * 0.55, x + size / 2, y + size, "F");

    doc.setLineWidth(0.5);
    doc.setDrawColor(255, 255, 255);
    doc.line(x + size * 0.25, y + size * 0.45, x + size * 0.45, y + size * 0.65);
    doc.line(x + size * 0.45, y + size * 0.65, x + size * 0.75, y + size * 0.3);
  };

  /** Ícono de Rayo / Velocidad Zap */
  const drawIconZap = (x: number, y: number, size = 6, color = COLOR_INDIGO_LIGHT) => {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.triangle(x + size * 0.4, y, x + size * 0.1, y + size * 0.55, x + size * 0.7, y + size * 0.45, "F");
    doc.triangle(x + size * 0.3, y + size * 0.45, x + size * 0.9, y + size * 0.45, x + size * 0.6, y + size, "F");
  };

  /** Ícono de Tienda / Ecosistema Comercial */
  const drawIconBuilding = (x: number, y: number, size = 6, color = COLOR_AMBER) => {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.triangle(x + size / 2, y, x, y + size * 0.4, x + size, y + size * 0.4, "F");
    doc.rect(x + size * 0.15, y + size * 0.4, size * 0.7, size * 0.6, "F");

    doc.setFillColor(10, 10, 11);
    doc.rect(x + size * 0.38, y + size * 0.65, size * 0.24, size * 0.35, "F");
  };

  /** Ícono de Avatar / Soporte Humano 1 a 1 */
  const drawIconUser = (x: number, y: number, size = 6, color = COLOR_PURPLE) => {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.circle(x + size / 2, y + size * 0.3, size * 0.25, "F");
    doc.roundedRect(x + size * 0.1, y + size * 0.6, size * 0.8, size * 0.4, 1.5, 1.5, "F");
  };

  /** Ícono de Sobre de Correo */
  const drawIconMail = (x: number, y: number, size = 6, color = COLOR_INDIGO_LIGHT) => {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(x, y + size * 0.15, size, size * 0.7, 1, 1, "F");

    doc.setLineWidth(0.4);
    doc.setDrawColor(10, 10, 11);
    doc.line(x, y + size * 0.15, x + size / 2, y + size * 0.55);
    doc.line(x + size, y + size * 0.15, x + size / 2, y + size * 0.55);
  };

  /** Ícono de Teléfono / WhatsApp */
  const drawIconPhone = (x: number, y: number, size = 6, color = COLOR_EMERALD) => {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.circle(x + size / 2, y + size / 2, size / 2, "F");

    doc.setLineWidth(0.6);
    doc.setDrawColor(10, 10, 11);
    doc.line(x + size * 0.3, y + size * 0.3, x + size * 0.45, y + size * 0.45);
    doc.line(x + size * 0.45, y + size * 0.45, x + size * 0.55, y + size * 0.55);
    doc.line(x + size * 0.55, y + size * 0.55, x + size * 0.7, y + size * 0.7);
  };

  // -------------------------------------------------------------
  // ESTRUCTURA DE FONDOS Y MARCOS
  // -------------------------------------------------------------

  const drawDotGrid = () => {
    doc.setFillColor(30, 30, 38);
    for (let x = 15; x < W - 10; x += 15) {
      for (let y = 15; y < H - 10; y += 12) {
        doc.circle(x, y, 0.35, "F");
      }
    }
  };

  const drawBackground = () => {
    doc.setFillColor(COLOR_BG[0], COLOR_BG[1], COLOR_BG[2]);
    doc.rect(0, 0, W, H, "F");

    drawDotGrid();

    doc.setLineWidth(0.4);
    doc.setDrawColor(COLOR_INDIGO[0], COLOR_INDIGO[1], COLOR_INDIGO[2]);
    doc.line(W - 40, 0, W, 40);

    doc.setDrawColor(COLOR_EMERALD[0], COLOR_EMERALD[1], COLOR_EMERALD[2]);
    doc.line(W - 25, 0, W, 25);

    doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    doc.line(0, H - 30, 30, H);
  };

  const drawHeader = (slideNumber: number, title: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(COLOR_INDIGO_LIGHT[0], COLOR_INDIGO_LIGHT[1], COLOR_INDIGO_LIGHT[2]);
    doc.text(`DIAPOSITIVA ${String(slideNumber).padStart(2, "0")} • ${title.toUpperCase()}`, 15, 12);

    doc.setFontSize(8);
    doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
    doc.text(report.name, W - 15, 12, { align: "right" });

    doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    doc.setLineWidth(0.3);
    doc.line(15, 15, W - 15, 15);
  };

  const drawFooter = (slideNumber: number) => {
    doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    doc.setLineWidth(0.3);
    doc.line(15, H - 12, W - 15, H - 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
    doc.text("Tlamatqui • Presentación de Auditoría Ejecutiva", 15, H - 7);

    doc.setFont("helvetica", "bold");
    doc.text(`Diapositiva ${slideNumber} de 11`, W - 15, H - 7, { align: "right" });
  };

  const drawCard = (x: number, y: number, w: number, h: number, bg = COLOR_SURFACE, border = COLOR_BORDER) => {
    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.setDrawColor(border[0], border[1], border[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, h, 3, 3, "FD");
  };

  const drawAccentCard = (x: number, y: number, w: number, h: number, accentColor: number[], bg = COLOR_SURFACE, border = COLOR_BORDER) => {
    drawCard(x, y, w, h, bg, border);
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.roundedRect(x, y, 3.5, h, 1.5, 1.5, "F");
  };

  // -------------------------------------------------------------
  // SLIDE 1: PORTADA CON CAPTURAS DEL SITIO WEB
  // -------------------------------------------------------------
  drawBackground();
  drawHeader(1, "Portada");

  const hasScreenshots = Boolean(screenshotDesktopImg || screenshotMobileImg);
  const centerX = W / 2;
  const centerY = hasScreenshots ? 27 : 36;

  // Logotipo
  if (circularLogoDataUrl) {
    const logoSize = hasScreenshots ? 20 : 28;
    
    doc.setLineWidth(0.5);
    doc.setDrawColor(COLOR_INDIGO[0], COLOR_INDIGO[1], COLOR_INDIGO[2]);
    doc.circle(centerX, centerY, (logoSize / 2) + 2, "S");

    doc.setFillColor(COLOR_SURFACE[0], COLOR_SURFACE[1], COLOR_SURFACE[2]);
    doc.circle(centerX, centerY, (logoSize / 2) + 1, "F");

    try {
      doc.addImage(circularLogoDataUrl, "PNG", centerX - logoSize / 2, centerY - logoSize / 2, logoSize, logoSize);
    } catch (e) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text(report.name.charAt(0).toUpperCase(), centerX, centerY + 3.5, { align: "center" });
    }
  } else {
    const r = hasScreenshots ? 10 : 15;
    doc.setLineWidth(0.5);
    doc.setDrawColor(COLOR_INDIGO[0], COLOR_INDIGO[1], COLOR_INDIGO[2]);
    doc.circle(centerX, centerY, r, "S");

    doc.setFillColor(COLOR_INDIGO[0], COLOR_INDIGO[1], COLOR_INDIGO[2]);
    doc.circle(centerX, centerY, r * 0.7, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text(report.name.charAt(0).toUpperCase(), centerX, centerY + 3.5, { align: "center" });
  }

  // Título y subtítulo
  const titleY = hasScreenshots ? 44 : 62;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_INDIGO_LIGHT[0], COLOR_INDIGO_LIGHT[1], COLOR_INDIGO_LIGHT[2]);
  doc.text("DIAGNOSTICO EJECUTIVO DE COMERCIO ELECTRONICO", W / 2, titleY, { align: "center" });

  const displayBrandName = report.name;
  const displayBrandUrl = report.businessUrl || report.team?.teamBrandWebsite;

  doc.setFontSize(hasScreenshots ? 17 : 23);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text(`Optimizando la Rentabilidad de ${displayBrandName}`, W / 2, titleY + 9, { align: "center" });

  if (displayBrandUrl) {
    try {
      const titleWidth = doc.getTextWidth(`Optimizando la Rentabilidad de ${displayBrandName}`);
      doc.link((W - titleWidth) / 2, titleY + 3, titleWidth, 8, { url: displayBrandUrl });
    } catch (e) {}
  }

  // Mockup de Capturas en Portada
  if (hasScreenshots) {
    const mockW = 100;
    const mockH = 46;
    const mockX = (W - mockW) / 2;
    const mockY = 58;

    // Browser frame
    doc.setFillColor(18, 18, 22);
    doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(mockX, mockY, mockW, mockH, 2, 2, "FD");

    // Header bar
    doc.setFillColor(28, 28, 34);
    doc.roundedRect(mockX, mockY, mockW, 5, 2, 2, "F");
    doc.setFillColor(COLOR_ROSE[0], COLOR_ROSE[1], COLOR_ROSE[2]);
    doc.circle(mockX + 3, mockY + 2.5, 0.8, "F");
    doc.setFillColor(COLOR_AMBER[0], COLOR_AMBER[1], COLOR_AMBER[2]);
    doc.circle(mockX + 6, mockY + 2.5, 0.8, "F");
    doc.setFillColor(COLOR_EMERALD[0], COLOR_EMERALD[1], COLOR_EMERALD[2]);
    doc.circle(mockX + 9, mockY + 2.5, 0.8, "F");

    // URL bar
    doc.setFillColor(10, 10, 11);
    doc.roundedRect(mockX + 16, mockY + 1, mockW - 32, 3, 1, 1, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(4.5);
    doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
    doc.text(report.businessUrl || `https://${report.name.toLowerCase().replace(/\s+/g, "")}.com`, mockX + 20, mockY + 3.2);

    // Screenshot image inside browser mockup
    const imgObj = screenshotDesktopImg || screenshotMobileImg;
    if (imgObj) {
      try {
        doc.addImage(imgObj, "JPEG", mockX + 0.5, mockY + 5, mockW - 1, mockH - 5.5);
      } catch (e) {}
    }

    // Floating Mobile Mockup Frame
    if (screenshotMobileImg) {
      const mobW = 16;
      const mobH = 28;
      const mobX = mockX + mockW - 10;
      const mobY = mockY + 16;

      doc.setFillColor(18, 18, 22);
      doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
      doc.setLineWidth(0.4);
      doc.roundedRect(mobX, mobY, mobW, mobH, 2, 2, "FD");

      try {
        doc.addImage(screenshotMobileImg, "JPEG", mobX + 0.5, mobY + 1.5, mobW - 1, mobH - 3);
      } catch (e) {}
    }
  }

  const cardW = 80;
  const cardH = hasScreenshots ? 26 : 32;
  const startX = (W - (cardW * 3 + 20)) / 2;
  const cardY = hasScreenshots ? 112 : 105;

  drawAccentCard(startX, cardY, cardW, cardH, COLOR_AMBER);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
  doc.text("PLAN ACTUAL", startX + 8, cardY + (hasScreenshots ? 9 : 12));
  doc.setFontSize(hasScreenshots ? 11 : 13);
  doc.setTextColor(COLOR_AMBER[0], COLOR_AMBER[1], COLOR_AMBER[2]);
  doc.text(`Shopify ${shopifyPlanUpper}`, startX + 8, cardY + (hasScreenshots ? 19 : 24));

  drawAccentCard(startX + cardW + 10, cardY, cardW, cardH, COLOR_EMERALD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
  doc.text("PLAN PROPUESTO", startX + cardW + 10 + 8, cardY + (hasScreenshots ? 9 : 12));
  doc.setFontSize(hasScreenshots ? 11 : 13);
  doc.setTextColor(COLOR_EMERALD[0], COLOR_EMERALD[1], COLOR_EMERALD[2]);
  doc.text(`Tiendanube ${tiendanubePlanUpper}`, startX + cardW + 10 + 8, cardY + (hasScreenshots ? 19 : 24));

  drawAccentCard(startX + (cardW + 10) * 2, cardY, cardW, cardH, COLOR_INDIGO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
  doc.text("AHORRO ANUAL ESTIMADO", startX + (cardW + 10) * 2 + 8, cardY + (hasScreenshots ? 9 : 12));
  doc.setFontSize(hasScreenshots ? 11 : 13);
  doc.setTextColor(COLOR_INDIGO_LIGHT[0], COLOR_INDIGO_LIGHT[1], COLOR_INDIGO_LIGHT[2]);
  doc.text(`$${annualSavings.toLocaleString("es-MX")} MXN`, startX + (cardW + 10) * 2 + 8, cardY + (hasScreenshots ? 19 : 24));

  drawFooter(1);

  // -------------------------------------------------------------
  // SLIDE 2: RESUMEN EJECUTIVO CON ÍCONOS ALINEADOS
  // -------------------------------------------------------------
  doc.addPage([W, H], "landscape");
  drawBackground();
  drawHeader(2, "Resumen Ejecutivo de Diagnóstico");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text("Hallazgos Financieros & Oportunidad de Optimización", 15, 26);

  const gridW = 62;
  const gridH = 30;
  const gridY = 34;

  // Metric 1: Visitas
  drawAccentCard(15, gridY, gridW, gridH, COLOR_INDIGO_LIGHT);
  drawIconTrending(15 + gridW - 14, gridY + 6, 6, COLOR_INDIGO_LIGHT);
  doc.setFontSize(7);
  doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
  doc.text("TRÁFICO MENSUAL", 22, gridY + 10);
  doc.setFontSize(13);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text(`${(report.visitasMensuales || 0).toLocaleString("es-MX")}`, 22, gridY + 22);

  // Metric 2: GMV
  drawAccentCard(82, gridY, gridW, gridH, COLOR_EMERALD);
  drawIconTrending(82 + gridW - 14, gridY + 6, 6, COLOR_EMERALD);
  doc.setFontSize(7);
  doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
  doc.text("GMV MENSUAL ESTIMADO", 89, gridY + 10);
  doc.setFontSize(13);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text(`$${(report.gmv || 0).toLocaleString("es-MX")} MXN`, 89, gridY + 22);

  // Metric 3: Fugas
  drawAccentCard(149, gridY, gridW, gridH, COLOR_ROSE);
  drawIconAlert(149 + gridW - 14, gridY + 6, 6, COLOR_ROSE);
  doc.setFontSize(7);
  doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
  doc.text("FUGAS DETECTADAS", 156, gridY + 10);
  doc.setFontSize(13);
  doc.setTextColor(COLOR_ROSE[0], COLOR_ROSE[1], COLOR_ROSE[2]);
  doc.text(`${report.fugasCantidad || (report.tools || []).length} áreas de mejora`, 156, gridY + 22);

  // Metric 4: Ahorro
  drawAccentCard(216, gridY, gridW, gridH, COLOR_AMBER);
  drawIconDollar(216 + gridW - 14, gridY + 6, 6, COLOR_AMBER);
  doc.setFontSize(7);
  doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
  doc.text("AHORRO MENSUAL RANGOS", 223, gridY + 10);
  doc.setFontSize(11);
  doc.setTextColor(COLOR_EMERALD[0], COLOR_EMERALD[1], COLOR_EMERALD[2]);
  doc.text(`$${minSavings.toLocaleString()} - $${maxSavings.toLocaleString()} MXN`, 223, gridY + 22);

  drawCard(15, 72, 263, 72);

  drawIconCheck(25, 83, 7, COLOR_EMERALD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLOR_EMERALD[0], COLOR_EMERALD[1], COLOR_EMERALD[2]);
  doc.text("1. Eliminación del 100% de Comisiones por Transacción", 36, 89);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
  doc.text(
    `Con el plan Tiendanube ${tiendanubePlanUpper}, tu tienda en línea opera con 0% de comisión por venta procesada, eliminando penalizaciones por uso de pasarelas locales y recuperando margen bruto sobre cada orden efectuada.`,
    36,
    96,
    { maxWidth: 232 }
  );

  drawIconZap(25, 113, 7, COLOR_INDIGO_LIGHT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLOR_INDIGO_LIGHT[0], COLOR_INDIGO_LIGHT[1], COLOR_INDIGO_LIGHT[2]);
  doc.text("2. Consolidación del Ecosistema de Aplicaciones", 36, 119);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
  doc.text(
    "Sustitución de complementos externos de cobro mensual recurrente por funcionalidades nativas integradas sin costo adicional (checkout optimizado, cupones avanzados y personalización móvil).",
    36,
    126,
    { maxWidth: 232 }
  );

  drawFooter(2);

  // -------------------------------------------------------------
  // SLIDE 3: STACK TECNOLÓGICO CON BADGES DE RIESGO LIMPIOS
  // -------------------------------------------------------------
  doc.addPage([W, H], "landscape");
  drawBackground();
  drawHeader(3, "Auditoría de Stack Tecnológico & Aplicaciones");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text("Análisis de Herramientas Auditadas", 15, 26);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(COLOR_INDIGO_LIGHT[0], COLOR_INDIGO_LIGHT[1], COLOR_INDIGO_LIGHT[2]);
  doc.text(`Total Gasto Apps: $${totalAppCost.toLocaleString("es-MX")} MXN/mes`, W - 15, 26, { align: "right" });

  const tableY = 32;
  const colX = [15, 70, 115, 160, 205];

  drawCard(15, tableY, 263, 10, [30, 30, 35], COLOR_BORDER);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
  doc.text("APLICACIÓN AUDITADA", colX[0] + 5, tableY + 6.5);
  doc.text("CATEGORÍA", colX[1] + 5, tableY + 6.5);
  doc.text("COSTO MENSUAL", colX[2] + 5, tableY + 6.5);
  doc.text("NIVEL DE RIESGO", colX[3] + 5, tableY + 6.5);
  doc.text("ALTERNATIVA TIENDANUBE", colX[4] + 5, tableY + 6.5);

  const toolsList = (report.tools && report.tools.length > 0) ? report.tools.slice(0, 6) : [
    { name: "App Genérica 1", category: "Checkout / Upsell", costExact: 1200, currency: "MXN", semaphore: "red", description: "Incluido nativamente en Tiendanube sin costo adicional." },
    { name: "App Genérica 2", category: "Fidelización", costExact: 800, currency: "MXN", semaphore: "yellow", description: "Integración directa con app store de Tiendanube." }
  ];

  toolsList.forEach((tool, idx) => {
    const rowY = tableY + 12 + idx * 17;
    drawCard(15, rowY, 263, 15, COLOR_SURFACE, COLOR_BORDER);

    const costDisp = tool.costType === "exact"
      ? `$${(tool.costExact || 0).toLocaleString("es-MX")} ${tool.currency || "USD"}`
      : `$${(tool.costMin || 0)} - $${(tool.costMax || 0)} ${tool.currency || "USD"}`;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
    doc.text(tool.name, colX[0] + 5, rowY + 9);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
    doc.text(tool.category, colX[1] + 5, rowY + 9);
    doc.text(costDisp, colX[2] + 5, rowY + 9);

    const badgeW = 28;
    const badgeH = 7;
    const badgeX = colX[3] + 5;
    const badgeY = rowY + 4;

    if (tool.semaphore === "red") {
      doc.setFillColor(COLOR_ROSE[0], COLOR_ROSE[1], COLOR_ROSE[2]);
      doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text("ALTO", badgeX + badgeW / 2, badgeY + 4.8, { align: "center" });
    } else if (tool.semaphore === "yellow") {
      doc.setFillColor(COLOR_AMBER[0], COLOR_AMBER[1], COLOR_AMBER[2]);
      doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(10, 10, 11);
      doc.text("MEDIO", badgeX + badgeW / 2, badgeY + 4.8, { align: "center" });
    } else {
      doc.setFillColor(COLOR_EMERALD[0], COLOR_EMERALD[1], COLOR_EMERALD[2]);
      doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text("BAJO", badgeX + badgeW / 2, badgeY + 4.8, { align: "center" });
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
    doc.text(tool.description || "Solución nativa sin costo", colX[4] + 5, rowY + 9, { maxWidth: 68 });
  });

  drawFooter(3);

  // -------------------------------------------------------------
  // SLIDE 4: SALUD Y VELOCIDAD WEB
  // -------------------------------------------------------------
  doc.addPage([W, H], "landscape");
  drawBackground();
  drawHeader(4, "Salud y Rendimiento de Velocidad Web");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text("Auditoría Lighthouse & Core Web Vitals", 15, 26);

  // Score Dials Row
  const dialW = 48;
  const dialH = 26;
  const dialY = 32;

  // 1. Rendimiento
  drawAccentCard(15, dialY, dialW, dialH, COLOR_EMERALD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
  doc.text("RENDIMIENTO", 22, dialY + 8);
  doc.setFontSize(13);
  doc.setTextColor(COLOR_EMERALD[0], COLOR_EMERALD[1], COLOR_EMERALD[2]);
  doc.text(report.pageSpeed?.performance ? `${report.pageSpeed.performance}%` : "86%", 22, dialY + 19);

  // 2. Accesibilidad
  drawAccentCard(68, dialY, dialW, dialH, COLOR_INDIGO_LIGHT);
  doc.setFontSize(7);
  doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
  doc.text("ACCESIBILIDAD", 75, dialY + 8);
  doc.setFontSize(13);
  doc.setTextColor(COLOR_INDIGO_LIGHT[0], COLOR_INDIGO_LIGHT[1], COLOR_INDIGO_LIGHT[2]);
  doc.text(report.pageSpeed?.accessibility ? `${report.pageSpeed.accessibility}%` : "92%", 75, dialY + 19);

  // 3. Buenas Prácticas
  drawAccentCard(121, dialY, dialW, dialH, COLOR_AMBER);
  doc.setFontSize(7);
  doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
  doc.text("BUENAS PRÁCTICAS", 128, dialY + 8);
  doc.setFontSize(13);
  doc.setTextColor(COLOR_AMBER[0], COLOR_AMBER[1], COLOR_AMBER[2]);
  doc.text(report.pageSpeed?.bestPractices ? `${report.pageSpeed.bestPractices}%` : "90%", 128, dialY + 19);

  // 4. SEO
  drawAccentCard(174, dialY, dialW, dialH, COLOR_PURPLE);
  doc.setFontSize(7);
  doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
  doc.text("SEO TÉCNICO", 181, dialY + 8);
  doc.setFontSize(13);
  doc.setTextColor(COLOR_PURPLE[0], COLOR_PURPLE[1], COLOR_PURPLE[2]);
  doc.text(report.pageSpeed?.seo ? `${report.pageSpeed.seo}%` : "95%", 181, dialY + 19);

  // 5. Load Time Simulation Badge Card with Required Tooltip Text
  const loadTimeDisp = report.pageSpeed?.lcp || report.pageSpeed?.fcp || "2.4s";
  drawAccentCard(227, dialY, 51, dialH, COLOR_INDIGO, [25, 25, 40], COLOR_INDIGO);
  doc.setFontSize(6.5);
  doc.setTextColor(COLOR_INDIGO_LIGHT[0], COLOR_INDIGO_LIGHT[1], COLOR_INDIGO_LIGHT[2]);
  doc.text("TIEMPO DE CARGA", 234, dialY + 8);
  doc.setFontSize(12);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text(loadTimeDisp, 234, dialY + 19);

  // Core Web Vitals Block
  const cwvY = 62;
  const cwvW = 59;
  const cwvH = 22;

  // LCP
  drawCard(15, cwvY, cwvW, cwvH);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
  doc.text("LCP (CARGA MAYOR)", 21, cwvY + 7);
  doc.setFontSize(10);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text(report.pageSpeed?.lcp || "2.1s", 21, cwvY + 16);

  // FCP
  drawCard(78, cwvY, cwvW, cwvH);
  doc.setFontSize(7);
  doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
  doc.text("FCP (PRIMER RENDER)", 84, cwvY + 7);
  doc.setFontSize(10);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text(report.pageSpeed?.fcp || "1.2s", 84, cwvY + 16);

  // TBT
  drawCard(141, cwvY, cwvW, cwvH);
  doc.setFontSize(7);
  doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
  doc.text("TBT (BLOQUEO TOTAL)", 147, cwvY + 7);
  doc.setFontSize(10);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text(report.pageSpeed?.tbt || "120ms", 147, cwvY + 16);

  // CLS
  drawCard(204, cwvY, 74, cwvH);
  doc.setFontSize(7);
  doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
  doc.text("CLS (ESTABILIDAD VISUAL)", 210, cwvY + 7);
  doc.setFontSize(10);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text(report.pageSpeed?.cls || "0.02", 210, cwvY + 16);

  // Bottom Area: Screenshots & Tooltip Simulation Banner
  const botY = 88;
  drawCard(15, botY, 263, 56);

  // Required Tooltip Banner Callout
  doc.setFillColor(30, 30, 48);
  doc.setDrawColor(COLOR_INDIGO[0], COLOR_INDIGO[1], COLOR_INDIGO[2]);
  doc.roundedRect(25, botY + 6, 243, 9, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_INDIGO_LIGHT[0], COLOR_INDIGO_LIGHT[1], COLOR_INDIGO_LIGHT[2]);
  doc.text("Este es el tiempo que tarda en cargar tu sitio web", 146.5, botY + 12, { align: "center" });

  // Screenshot mockups inside bottom frame
  if (screenshotDesktopImg) {
    try {
      doc.addImage(screenshotDesktopImg, "JPEG", 30, botY + 18, 65, 33);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
      doc.text("Vista Escritorio", 62.5, botY + 53, { align: "center" });
    } catch (e) {}
  }

  if (screenshotMobileImg) {
    try {
      doc.addImage(screenshotMobileImg, "JPEG", 105, botY + 18, 18, 33);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
      doc.text("Móvil", 114, botY + 53, { align: "center" });
    } catch (e) {}
  }

  // Speed summary insights text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text("• La velocidad de carga móvil impacta directamente en tu tasa de conversión y retorno de inversión en pauta publicitaria.", 132, botY + 24, { maxWidth: 130 });
  doc.text("• Al migrar a Tiendanube Evolución, tu infraestructura se optimiza con CDN local de ultra baja latencia y compresión de activos automática.", 132, botY + 36, { maxWidth: 130 });

  drawFooter(4);

  // -------------------------------------------------------------
  // SLIDE 5: COSTOS OCULTOS
  // -------------------------------------------------------------
  doc.addPage([W, H], "landscape");
  drawBackground();
  drawHeader(5, "Desglose de Costos Ocultos & Comisiones");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text("Estructura Financiera & Comparativa de Barras", 15, 26);

  const colCardW = 127;
  const colCardH = 70;

  // Shopify Block
  drawAccentCard(15, 33, colCardW, colCardH, COLOR_AMBER);
  drawIconAlert(25, 39, 6, COLOR_AMBER);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLOR_AMBER[0], COLOR_AMBER[1], COLOR_AMBER[2]);
  doc.text("Estructura de Costos en Shopify", 34, 44);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text(`• Suscripción Base: Plan Shopify ${shopifyPlanUpper}`, 25, 57);
  doc.text("• Comisión por Transacción: 0.5% - 2.0% por cada venta", 25, 69);
  doc.text(`• Gasto en Apps Terceros: $${totalAppCost.toLocaleString("es-MX")} MXN/mes`, 25, 81);
  doc.text("• Sobrecostos en Pasarelas Locales de Pago (MXN/LATAM)", 25, 93);

  // Tiendanube Block
  drawAccentCard(151, 33, colCardW, colCardH, COLOR_EMERALD, [15, 30, 25], [16, 185, 129]);
  drawIconShield(161, 39, 6, COLOR_EMERALD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLOR_EMERALD[0], COLOR_EMERALD[1], COLOR_EMERALD[2]);
  doc.text("Modelo Transparente en Tiendanube", 170, 44);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text(`• Suscripción Transparente: Plan Tiendanube ${tiendanubePlanUpper}`, 161, 57);
  doc.text("• Comisión por Transacción: 0% SIEMPRE en todos los planes", 161, 69);
  doc.text("• Funcionalidades Nativas Integradas sin cobro recurrente", 161, 81);
  doc.text("• Integración sin costo con Mercado Pago, PagoNube, Stripe", 161, 93);

  // Gráfico Comparativo de Barras
  const barChartY = 108;
  drawCard(15, barChartY, 263, 38);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text("Comparativa Visual de Gasto Mensual Estimado (MXN)", 25, barChartY + 10);

  const maxCost = Math.max(totalShopifyMonthlyCostMXN, projectedTiendanubeCostMXN, 1000);
  const maxBarWidth = 180;

  const shopifyBarW = (totalShopifyMonthlyCostMXN / maxCost) * maxBarWidth;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_AMBER[0], COLOR_AMBER[1], COLOR_AMBER[2]);
  doc.text("Shopify", 25, barChartY + 20);

  doc.setFillColor(COLOR_AMBER[0], COLOR_AMBER[1], COLOR_AMBER[2]);
  doc.roundedRect(48, barChartY + 16, Math.max(8, shopifyBarW), 6, 1.5, 1.5, "F");

  doc.setFontSize(8);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text(`$${Math.round(totalShopifyMonthlyCostMXN).toLocaleString("es-MX")} MXN`, 52 + shopifyBarW, barChartY + 21);

  const tiendanubeBarW = (projectedTiendanubeCostMXN / maxCost) * maxBarWidth;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_EMERALD[0], COLOR_EMERALD[1], COLOR_EMERALD[2]);
  doc.text("Tiendanube", 25, barChartY + 31);

  doc.setFillColor(COLOR_EMERALD[0], COLOR_EMERALD[1], COLOR_EMERALD[2]);
  doc.roundedRect(48, barChartY + 27, Math.max(8, tiendanubeBarW), 6, 1.5, 1.5, "F");

  doc.setFontSize(8);
  doc.setTextColor(COLOR_EMERALD[0], COLOR_EMERALD[1], COLOR_EMERALD[2]);
  doc.text(`$${Math.round(projectedTiendanubeCostMXN).toLocaleString("es-MX")} MXN (Ahorro del ${Math.round((avgMonthlySavings / totalShopifyMonthlyCostMXN) * 100)}%)`, 52 + tiendanubeBarW, barChartY + 32);

  drawFooter(5);

  // -------------------------------------------------------------
  // SLIDE 6: COMPARATIVO DIRECTO
  // -------------------------------------------------------------
  doc.addPage([W, H], "landscape");
  drawBackground();
  drawHeader(6, "Matriz Comparativa Directa");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text("Shopify vs. Tiendanube - Matriz de Características", 15, 26);

  const compY = 32;
  const compCols = [15, 75, 145, 235];

  drawCard(15, compY, 263, 10, [30, 30, 35], COLOR_BORDER);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
  doc.text("VARIABLE AUDITADA", compCols[0] + 5, compY + 6.5);
  doc.text("CONDICIÓN EN SHOPIFY", compCols[1] + 5, compY + 6.5);
  doc.text("VENTAJA TIENDANUBE", compCols[2] + 5, compY + 6.5);
  doc.text("DESTACADO", compCols[3] + 5, compY + 6.5);

  const compRows = (report.comparisonRows && report.comparisonRows.length > 0) ? report.comparisonRows.slice(0, 5) : [
    { variable: "Comisiones por Transacción", shopify: "Cobro adicional por cada venta efectuada.", tiendanube: "0% de comisión por venta en todos los planes.", pillText: "Ahorro Directo" },
    { variable: "Pasarelas de Pago Locales", shopify: "Restricciones y sobrecostos en pasarelas MX/LATAM.", tiendanube: "Integración nativa con PagoNube, Mercado Pago, Stripe.", pillText: "Mayor Conversión" },
    { variable: "Soporte Técnico en Español", shopify: "Soporte genérico por tickets o bot en inglés.", tiendanube: "Atención personalizada 1 a 1 y equipo dedicado.", pillText: "Atención Local" }
  ];

  compRows.forEach((row, idx) => {
    const rowY = compY + 12 + idx * 19;
    drawCard(15, rowY, 263, 17, COLOR_SURFACE, COLOR_BORDER);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
    doc.text(row.variable, compCols[0] + 5, rowY + 10, { maxWidth: 52 });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
    doc.text(row.shopify, compCols[1] + 5, rowY + 10, { maxWidth: 63 });

    drawIconCheck(compCols[2] + 4, rowY + 5, 5, COLOR_EMERALD);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLOR_EMERALD[0], COLOR_EMERALD[1], COLOR_EMERALD[2]);
    doc.text(row.tiendanube, compCols[2] + 11, rowY + 9.5, { maxWidth: 76 });

    doc.setFillColor(COLOR_INDIGO[0], COLOR_INDIGO[1], COLOR_INDIGO[2]);
    doc.roundedRect(compCols[3] + 3, rowY + 4.5, 36, 8, 4, 4, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text(row.pillText || "DESTACADO", compCols[3] + 21, rowY + 9.5, { align: "center" });
  });

  drawFooter(6);

  // -------------------------------------------------------------
  // SLIDE 7: CALCULADORA DE AHORRO
  // -------------------------------------------------------------
  doc.addPage([W, H], "landscape");
  drawBackground();
  drawHeader(7, "Calculadora Financiera de Ahorro Real");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text("Simulación Proyectada de Flujo de Caja", 15, 26);

  const calcCardW = 82;
  const calcCardH = 38;
  const calcY = 33;

  drawAccentCard(15, calcY, calcCardW, calcCardH, COLOR_INDIGO_LIGHT);
  drawIconTrending(15 + calcCardW - 14, calcY + 6, 6, COLOR_INDIGO_LIGHT);
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
  doc.text("VOLUMEN DE VENTAS (GMV MENSUAL)", 23, calcY + 12);
  doc.setFontSize(15);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text(`$${(report.gmv || 0).toLocaleString("es-MX")} MXN`, 23, calcY + 27);

  drawAccentCard(107, calcY, calcCardW, calcCardH, COLOR_EMERALD, [15, 30, 25], [16, 185, 129]);
  drawIconDollar(107 + calcCardW - 14, calcY + 6, 6, COLOR_EMERALD);
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_EMERALD[0], COLOR_EMERALD[1], COLOR_EMERALD[2]);
  doc.text("AHORRO MENSUAL ESTIMADO", 115, calcY + 12);
  doc.setFontSize(15);
  doc.setTextColor(COLOR_EMERALD[0], COLOR_EMERALD[1], COLOR_EMERALD[2]);
  doc.text(`$${avgMonthlySavings.toLocaleString("es-MX")} MXN`, 115, calcY + 27);

  drawAccentCard(199, calcY, calcCardW, calcCardH, COLOR_INDIGO, [25, 25, 40], COLOR_INDIGO);
  drawIconDollar(199 + calcCardW - 14, calcY + 6, 6, COLOR_INDIGO_LIGHT);
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_INDIGO_LIGHT[0], COLOR_INDIGO_LIGHT[1], COLOR_INDIGO_LIGHT[2]);
  doc.text("AHORRO ANUAL ACUMULADO", 207, calcY + 12);
  doc.setFontSize(15);
  doc.setTextColor(COLOR_INDIGO_LIGHT[0], COLOR_INDIGO_LIGHT[1], COLOR_INDIGO_LIGHT[2]);
  doc.text(`$${annualSavings.toLocaleString("es-MX")} MXN`, 207, calcY + 27);

  const segY = 77;
  drawCard(15, segY, 266, 68);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text("Composición del Ahorro Estimado (Proporción Vectorial)", 25, segY + 12);

  const barTotalW = 240;
  const barH = 10;
  const barX = 25;
  const barYPos = segY + 20;

  const seg1W = barTotalW * 0.65;
  const seg2W = barTotalW * 0.35;

  doc.setFillColor(COLOR_EMERALD[0], COLOR_EMERALD[1], COLOR_EMERALD[2]);
  doc.roundedRect(barX, barYPos, seg1W, barH, 2, 2, "F");

  doc.setFillColor(COLOR_INDIGO[0], COLOR_INDIGO[1], COLOR_INDIGO[2]);
  doc.roundedRect(barX + seg1W + 1, barYPos, seg2W, barH, 2, 2, "F");

  drawIconCheck(25, segY + 37, 5, COLOR_EMERALD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_EMERALD[0], COLOR_EMERALD[1], COLOR_EMERALD[2]);
  doc.text(`65% Ahorro Directo 0% Comisiones: ~$${Math.round(avgMonthlySavings * 0.65).toLocaleString("es-MX")} MXN/mes`, 33, segY + 41);

  drawIconZap(25, segY + 49, 5, COLOR_INDIGO_LIGHT);
  doc.setTextColor(COLOR_INDIGO_LIGHT[0], COLOR_INDIGO_LIGHT[1], COLOR_INDIGO_LIGHT[2]);
  doc.text(`35% Sustitución de Apps Terceros: ~$${Math.round(avgMonthlySavings * 0.35).toLocaleString("es-MX")} MXN/mes`, 33, segY + 53);

  drawFooter(7);

  // -------------------------------------------------------------
  // SLIDE 8: RENTABILIDAD CON CURVA ROI VECTORIAL
  // -------------------------------------------------------------
  doc.addPage([W, H], "landscape");
  drawBackground();
  drawHeader(8, "Proyección de Rentabilidad a 3 Años & Curva ROI");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text("Impacto Financiero Acumulado de Largo Plazo", 15, 26);

  const roiW = 82;
  const roiH = 32;
  const roiY = 32;

  drawAccentCard(15, roiY, roiW, roiH, COLOR_EMERALD);
  drawIconTrending(15 + roiW - 14, roiY + 6, 6, COLOR_EMERALD);
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
  doc.text("AÑO 1 (12 MESES)", 23, roiY + 10);
  doc.setFontSize(15);
  doc.setTextColor(COLOR_EMERALD[0], COLOR_EMERALD[1], COLOR_EMERALD[2]);
  doc.text(`$${annualSavings.toLocaleString("es-MX")} MXN`, 23, roiY + 23);

  drawAccentCard(107, roiY, roiW, roiH, COLOR_EMERALD);
  drawIconTrending(107 + roiW - 14, roiY + 6, 6, COLOR_EMERALD);
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
  doc.text("AÑO 2 (24 MESES)", 115, roiY + 10);
  doc.setFontSize(15);
  doc.setTextColor(COLOR_EMERALD[0], COLOR_EMERALD[1], COLOR_EMERALD[2]);
  doc.text(`$${(annualSavings * 2).toLocaleString("es-MX")} MXN`, 115, roiY + 23);

  drawAccentCard(199, roiY, roiW, roiH, COLOR_INDIGO, [25, 25, 40], COLOR_INDIGO);
  drawIconTrending(199 + roiW - 14, roiY + 6, 6, COLOR_INDIGO_LIGHT);
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_INDIGO_LIGHT[0], COLOR_INDIGO_LIGHT[1], COLOR_INDIGO_LIGHT[2]);
  doc.text("AÑO 3 (36 MESES)", 207, roiY + 10);
  doc.setFontSize(15);
  doc.setTextColor(COLOR_INDIGO_LIGHT[0], COLOR_INDIGO_LIGHT[1], COLOR_INDIGO_LIGHT[2]);
  doc.text(`$${threeYearSavings.toLocaleString("es-MX")} MXN`, 207, roiY + 23);

  const chartBoxY = 68;
  drawCard(15, chartBoxY, 266, 78);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text("Curva Vectorial de Ahorro Acumulado Proyectado (Mes 1 a Mes 12)", 25, chartBoxY + 9);

  const chartLeft = 40;
  const chartRight = 265;
  const chartTop = chartBoxY + 16;
  const chartBottom = chartBoxY + 66;

  doc.setLineWidth(0.2);
  doc.setDrawColor(42, 42, 46);

  for (let gridI = 0; gridI <= 3; gridI++) {
    const gridYPos = chartBottom - (gridI * (chartBottom - chartTop)) / 3;
    doc.line(chartLeft, gridYPos, chartRight, gridYPos);

    const valLabel = Math.round((annualSavings * gridI) / 3);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
    doc.text(`$${(valLabel / 1000).toFixed(0)}k`, chartLeft - 2, gridYPos + 1.5, { align: "right" });
  }

  const points: { x: number; y: number }[] = [];
  const totalMonths = 12;

  for (let m = 1; m <= totalMonths; m++) {
    const monthRatio = (m - 1) / (totalMonths - 1);
    const px = chartLeft + monthRatio * (chartRight - chartLeft);
    const py = chartBottom - (monthRatio * (chartBottom - chartTop));
    points.push({ x: px, y: py });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
    doc.text(`M${m}`, px, chartBottom + 5, { align: "center" });
  }

  doc.setLineWidth(0.8);
  doc.setDrawColor(16, 185, 129);

  for (let p = 0; p < points.length - 1; p++) {
    doc.line(points[p].x, points[p].y, points[p + 1].x, points[p + 1].y);
  }

  points.forEach((pt, idx) => {
    doc.setFillColor(16, 185, 129);
    doc.circle(pt.x, pt.y, 1.2, "F");

    doc.setFillColor(10, 10, 11);
    doc.circle(pt.x, pt.y, 0.6, "F");

    if (idx === totalMonths - 1) {
      doc.setFillColor(COLOR_INDIGO[0], COLOR_INDIGO[1], COLOR_INDIGO[2]);
      doc.roundedRect(pt.x - 24, pt.y - 9, 24, 7, 1.5, 1.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(255, 255, 255);
      doc.text(`$${annualSavings.toLocaleString()} MXN`, pt.x - 12, pt.y - 4.2, { align: "center" });
    }
  });

  drawFooter(8);

  // -------------------------------------------------------------
  // SLIDE 9: RESUMEN DE VENTAJAS CON ÍCONOS ALINEADOS
  // -------------------------------------------------------------
  doc.addPage([W, H], "landscape");
  drawBackground();
  drawHeader(9, "Resumen de Ventajas Competitivas");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text("Valor Estratégico de Tiendanube", 15, 26);

  const advW = 127;
  const advH = 50;

  // Advantage 1: Escudo
  drawCard(15, 35, advW, advH);
  drawIconShield(25, 42, 7, COLOR_EMERALD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(COLOR_EMERALD[0], COLOR_EMERALD[1], COLOR_EMERALD[2]);
  doc.text("0% Comisiones por Transacción", 35, 48);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
  doc.text("Maximiza el margen neto de cada orden procesada en la tienda sin cargos sorpresa al final del mes.", 35, 58, { maxWidth: 100 });

  // Advantage 2: Rayo
  drawCard(151, 35, advW, advH);
  drawIconZap(161, 42, 7, COLOR_INDIGO_LIGHT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(COLOR_INDIGO_LIGHT[0], COLOR_INDIGO_LIGHT[1], COLOR_INDIGO_LIGHT[2]);
  doc.text("Checkout Optimizado para Convertir", 171, 48);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
  doc.text("Experiencia fluida y rápida adaptable a hábitos de compra locales con autocompletado de dirección.", 171, 58, { maxWidth: 100 });

  // Advantage 3: Tienda / Ecosistema
  drawCard(15, 93, advW, advH);
  drawIconBuilding(25, 100, 7, COLOR_AMBER);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(COLOR_AMBER[0], COLOR_AMBER[1], COLOR_AMBER[2]);
  doc.text("Ecosistema Local de Pasarelas y Envíos", 35, 106);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
  doc.text("Conexión transparente con Mercado Pago, PagoNube, Skydropx, 99minutos y paqueterías regionales.", 35, 116, { maxWidth: 100 });

  // Advantage 4: Avatar / Soporte Humano
  drawCard(151, 93, advW, advH);
  drawIconUser(161, 100, 7, COLOR_PURPLE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text("Soporte Técnico Especializado en Español", 171, 106);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
  doc.text("Acompañamiento humano 1 a 1 de un equipo de ingenieros y especialistas en e-commerce.", 171, 116, { maxWidth: 100 });

  drawFooter(9);

  // -------------------------------------------------------------
  // SLIDE 10: PLAN DE MIGRACIÓN CON ÍCONOS DE FASE ALINEADOS
  // -------------------------------------------------------------
  doc.addPage([W, H], "landscape");
  drawBackground();
  drawHeader(10, "Plan de Migración en 4 Fases");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text("Roadmap Operativo & Diagrama de Flujo", 15, 26);

  doc.setLineWidth(1.2);
  doc.setDrawColor(COLOR_INDIGO[0], COLOR_INDIGO[1], COLOR_INDIGO[2]);
  doc.line(45, 38, 250, 38);

  const phaseW = 62;
  const phaseH = 75;

  const nodePositions = [45, 113, 181, 248];

  // Fase 1
  doc.setFillColor(COLOR_INDIGO[0], COLOR_INDIGO[1], COLOR_INDIGO[2]);
  doc.circle(nodePositions[0], 38, 5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("1", nodePositions[0], 40.5, { align: "center" });

  drawCard(15, 48, phaseW, phaseH);
  drawIconDollar(23, 56, 5, COLOR_INDIGO_LIGHT);
  doc.setFontSize(11);
  doc.setTextColor(COLOR_INDIGO_LIGHT[0], COLOR_INDIGO_LIGHT[1], COLOR_INDIGO_LIGHT[2]);
  doc.text("FASE 1", 30, 60);
  doc.setFontSize(9.5);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text("Extracción & Datos", 23, 70);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
  doc.text("Exportación segura de catálogo de productos, clientes e inventario existente en Shopify.", 23, 80, { maxWidth: 46 });

  // Fase 2
  doc.setFillColor(COLOR_INDIGO_LIGHT[0], COLOR_INDIGO_LIGHT[1], COLOR_INDIGO_LIGHT[2]);
  doc.circle(nodePositions[1], 38, 5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(10, 10, 11);
  doc.text("2", nodePositions[1], 40.5, { align: "center" });

  drawCard(82, 48, phaseW, phaseH);
  drawIconZap(90, 56, 5, COLOR_INDIGO_LIGHT);
  doc.setFontSize(11);
  doc.setTextColor(COLOR_INDIGO_LIGHT[0], COLOR_INDIGO_LIGHT[1], COLOR_INDIGO_LIGHT[2]);
  doc.text("FASE 2", 97, 60);
  doc.setFontSize(9.5);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text("Diseño & Setup", 90, 70);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
  doc.text("Configuración de diseño, navegación y optimización de la experiencia en móviles.", 90, 80, { maxWidth: 46 });

  // Fase 3
  doc.setFillColor(COLOR_PURPLE[0], COLOR_PURPLE[1], COLOR_PURPLE[2]);
  doc.circle(nodePositions[2], 38, 5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("3", nodePositions[2], 40.5, { align: "center" });

  drawCard(149, 48, phaseW, phaseH);
  drawIconBuilding(157, 56, 5, COLOR_PURPLE);
  doc.setFontSize(11);
  doc.setTextColor(COLOR_PURPLE[0], COLOR_PURPLE[1], COLOR_PURPLE[2]);
  doc.text("FASE 3", 164, 60);
  doc.setFontSize(9.5);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text("Integraciones & Pagos", 157, 70);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
  doc.text("Conexión de pasarelas de pago, operadores logísticos y píxeles de medición.", 157, 80, { maxWidth: 46 });

  // Fase 4
  doc.setFillColor(COLOR_EMERALD[0], COLOR_EMERALD[1], COLOR_EMERALD[2]);
  doc.circle(nodePositions[3], 38, 5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(10, 10, 11);
  doc.text("4", nodePositions[3], 40.5, { align: "center" });

  drawAccentCard(216, 48, phaseW, phaseH, COLOR_EMERALD, [15, 30, 25], [16, 185, 129]);
  drawIconCheck(224, 56, 5, COLOR_EMERALD);
  doc.setFontSize(11);
  doc.setTextColor(COLOR_EMERALD[0], COLOR_EMERALD[1], COLOR_EMERALD[2]);
  doc.text("FASE 4", 231, 60);
  doc.setFontSize(9.5);
  doc.setTextColor(COLOR_EMERALD[0], COLOR_EMERALD[1], COLOR_EMERALD[2]);
  doc.text("Dominio & Go-Live", 224, 70);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text("Redirección de dominio oficial y lanzamiento sin interrupción de ventas (cero downtime).", 224, 80, { maxWidth: 46 });

  drawCard(15, 128, 263, 16);
  drawIconShield(23, 133, 5, COLOR_EMERALD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text("Garantía de Migración Limpia: Conservación del posicionamiento SEO existente e historial comercial.", 31, 138);

  drawFooter(10);

  // -------------------------------------------------------------
  // SLIDE 11: CONTACTO CON ÍCONOS ALINEADOS SIN TRASLAPES
  // -------------------------------------------------------------
  doc.addPage([W, H], "landscape");
  drawBackground();
  drawHeader(11, "Contacto & Inicio de Proyecto");

  const mainBoxW = 220;
  const mainBoxH = 105;
  const mainBoxX = (W - mainBoxW) / 2;
  const mainBoxY = 32;

  drawCard(mainBoxX, mainBoxY, mainBoxW, mainBoxH, [18, 18, 22], COLOR_INDIGO);

  doc.setLineWidth(1);
  doc.setDrawColor(COLOR_EMERALD[0], COLOR_EMERALD[1], COLOR_EMERALD[2]);
  doc.line(mainBoxX, mainBoxY, mainBoxX + 15, mainBoxY);
  doc.line(mainBoxX, mainBoxY, mainBoxX, mainBoxY + 15);

  doc.line(mainBoxX + mainBoxW, mainBoxY + mainBoxH, mainBoxX + mainBoxW - 15, mainBoxY + mainBoxH);
  doc.line(mainBoxX + mainBoxW, mainBoxY + mainBoxH, mainBoxX + mainBoxW, mainBoxY + mainBoxH - 15);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text(`¿Listo para potenciar la rentabilidad de ${report.name}?`, W / 2, 52, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
  doc.text("Agenda una sesión ejecutiva para coordinar la migración y activar tus beneficios en Tiendanube.", W / 2, 64, { align: "center" });

  const contactW = 95;
  const contactH = 35;

  // Card Correo
  drawAccentCard(mainBoxX + 12, 78, contactW, contactH, COLOR_INDIGO);
  drawIconMail(mainBoxX + 22, 86, 6, COLOR_INDIGO_LIGHT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
  doc.text("CORREO DE CONTACTO", mainBoxX + 31, 90);
  doc.setFontSize(11);
  doc.setTextColor(COLOR_INDIGO_LIGHT[0], COLOR_INDIGO_LIGHT[1], COLOR_INDIGO_LIGHT[2]);
  doc.text(report.contactEmail || "contacto@tiendanube.com", mainBoxX + 22, 102);

  // Card WhatsApp
  drawAccentCard(mainBoxX + 113, 78, contactW, contactH, COLOR_EMERALD);
  drawIconPhone(mainBoxX + 123, 86, 6, COLOR_EMERALD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_DIM[0], COLOR_DIM[1], COLOR_DIM[2]);
  doc.text("WHATSAPP DIRECTO", mainBoxX + 132, 90);
  doc.setFontSize(11);
  doc.setTextColor(COLOR_EMERALD[0], COLOR_EMERALD[1], COLOR_EMERALD[2]);
  doc.text(report.contactWhatsapp || "+52 55 0000 0000", mainBoxX + 123, 102);

  // Renderizado de logos de Equipo y Aliados en Diapositiva 11
  const teamLogoUrl = report.team?.teamBrandLogo || report.team?.image;
  const teamLogoImg = teamLogoUrl ? await loadImage(teamLogoUrl) : null;
  const alliesList = report.team?.allies || [];
  const totalLogos = (teamLogoImg ? 1 : 0) + alliesList.length;

  if (totalLogos > 0) {
    const boxW = 28;
    const boxH = 10;
    const gap = 6;
    const totalW = totalLogos * boxW + (totalLogos - 1) * gap;
    let startLogoX = (W - totalW) / 2;
    const logoY = 124;

    if (teamLogoImg) {
      drawCard(startLogoX, logoY, boxW, boxH);
      try {
        doc.addImage(teamLogoImg, "PNG", startLogoX + 2, logoY + 1, boxW - 4, boxH - 2);
      } catch (e) {}
      startLogoX += boxW + gap;
    }

    for (const ally of alliesList) {
      drawCard(startLogoX, logoY, boxW, boxH);
      if (ally.logo) {
        const allyImg = await loadImage(ally.logo);
        if (allyImg) {
          try {
            doc.addImage(allyImg, "PNG", startLogoX + 2, logoY + 1, boxW - 4, boxH - 2);
          } catch (e) {}
        }
      }
      startLogoX += boxW + gap;
    }
  }

  drawFooter(11);

  // Guardar archivo PDF de forma nativa e instantánea
  const sanitizedName = (report.name || "Reporte").replace(/[^\w\s-]/g, "").replace(/\s+/g, "_");
  doc.save(`Presentacion_Diagnostico_${sanitizedName}_Horizontal.pdf`);
}

