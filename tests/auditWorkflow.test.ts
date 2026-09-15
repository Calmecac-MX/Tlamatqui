import test from "node:test";
import assert from "node:assert/strict";
import { resolveTechnologyLogo } from "../server/scrapper.js";
import { sanitizeDomain } from "../server/dnsIntegrationService.js";
import { runAuditWorkflow } from "../server/workflows/auditWorkflow.js";
import { deleteDbReport, slugifyDomainToReportId, saveDbReport } from "../server/dbBridge.js";
import { ReportSchema } from "../src/schemas/report.js";

test("resolveTechnologyLogo - Resolución de logos de aplicaciones y tecnologías", () => {
  // 1. Preservar logo existente si ya es válido
  const existingLogo = "https://cdn.mycustombrand.com/logo.png";
  assert.strictEqual(resolveTechnologyLogo("Klaviyo", undefined, existingLogo), existingLogo);

  // 2. Tecnologías conocidas estándar y agregadas
  const klaviyoLogo = resolveTechnologyLogo("Klaviyo");
  assert.ok(klaviyoLogo.includes("klaviyo.com"), "Debe resolver icono con dominio klaviyo.com");

  const judgeLogo = resolveTechnologyLogo("Judge.me");
  assert.ok(judgeLogo.includes("judge.me"), "Debe resolver icono con dominio judge.me");

  const facturamaLogo = resolveTechnologyLogo("Facturama: Facturación CFDI");
  assert.ok(facturamaLogo.includes("facturama.mx"), "Debe resolver icono con dominio facturama.mx");

  const clarityLogo = resolveTechnologyLogo("Microsoft Clarity: AI Insights");
  assert.ok(clarityLogo.includes("clarity.microsoft.com"), "Debe resolver icono con dominio clarity.microsoft.com");

  const mailchimpLogo = resolveTechnologyLogo("Mailchimp: Email & SMS");
  assert.ok(mailchimpLogo.includes("mailchimp.com"), "Debe resolver icono con dominio mailchimp.com");

  const subiLogo = resolveTechnologyLogo("Subi Subscriptions App");
  assert.ok(subiLogo.includes("subi.me"), "Debe resolver icono con dominio subi.me");

  // 3. Inferencia por URL provista
  const customUrlLogo = resolveTechnologyLogo("Custom App", "https://mi-app-ecommerce.com/features");
  assert.ok(customUrlLogo.includes("mi-app-ecommerce.com"), "Debe inferir el dominio de la URL");
});

test("sanitizeDomain - Sanitización y normalización de dominios y URLs", () => {
  assert.strictEqual(sanitizeDomain("https://www.tienda-ejemplo.com/"), "www.tienda-ejemplo.com");
  assert.strictEqual(sanitizeDomain("http://tienda.myshopify.com/products"), "tienda.myshopify.com");
  assert.strictEqual(sanitizeDomain("  WWW.ROPA-ONLINE.MX  "), "www.ropa-online.mx");
  assert.strictEqual(sanitizeDomain("sub.dominio.co.uk/checkout"), "sub.dominio.co.uk");
});

test("slugifyDomainToReportId - Normalización de dominio a ID en kebab-case", () => {
  assert.strictEqual(slugifyDomainToReportId("https://tienda-demo-calmecac.myshopify.com"), "tienda-demo-calmecac-myshopify-com");
  assert.strictEqual(slugifyDomainToReportId("http://www.ropa-online.mx/products?ref=123"), "ropa-online-mx");
  assert.strictEqual(slugifyDomainToReportId("sub.dominio.co.uk/checkout"), "sub-dominio-co-uk");
  assert.strictEqual(slugifyDomainToReportId("  CALMÉCAC & PARTNERS (MX)  "), "calmecac-partners-mx");
  assert.strictEqual(slugifyDomainToReportId("tienda-demo-calmecac-myshopify-com"), "tienda-demo-calmecac-myshopify-com");
});

test("runAuditWorkflow - Generación integral y validación de reporte de auditoría con ID en kebab-case", async () => {
  const auditResult = await runAuditWorkflow({
    url: "https://tienda-demo-calmecac.myshopify.com",
    contactEmail: "contacto@tienda-demo.com",
    customExchangeRate: 20.0
  });

  assert.strictEqual(auditResult.success, true);
  assert.ok(auditResult.report, "Debe retornar un objeto Report");
  assert.ok(auditResult.summary, "Debe retornar un resumen ejecutivo");
  assert.strictEqual(auditResult.summary.detectedCms, "Shopify");
  assert.strictEqual(auditResult.report.id, "tienda-demo-calmecac-myshopify-com");

  // Validar contra el esquema estricto Zod de Report
  const validatedReport = ReportSchema.parse(auditResult.report);
  assert.strictEqual(validatedReport.id, "tienda-demo-calmecac-myshopify-com");
  assert.ok(Array.isArray(validatedReport.tools));
  assert.ok(Array.isArray(validatedReport.comparisonRows));

  // Limpieza
  await deleteDbReport(auditResult.report.id).catch(() => {});
});

test("saveDbReport & slugifyDomainToReportId - Unicidad y persistencia con kebab-case ID", async () => {
  const testId = slugifyDomainToReportId("https://mi-tienda-unica.com");
  assert.strictEqual(testId, "mi-tienda-unica-com");

  const report1 = await saveDbReport({
    id: testId,
    name: "Mi Tienda Única",
    businessUrl: "https://mi-tienda-unica.com",
    visitasMensuales: 10000,
    gmv: 100000,
    shopifyPlan: "basic",
    tiendanubePlan: "tiendanube",
    tools: [],
    comparisonRows: []
  });

  assert.strictEqual(report1.id, "mi-tienda-unica-com");

  // Re-guardar debe actualizar el mismo registro sin duplicar
  const report2 = await saveDbReport({
    id: "https://mi-tienda-unica.com",
    name: "Mi Tienda Única Actualizada",
    businessUrl: "https://mi-tienda-unica.com",
    visitasMensuales: 15000,
    gmv: 120000,
    shopifyPlan: "grow",
    tiendanubePlan: "tiendanube",
    tools: [],
    comparisonRows: []
  });

  assert.strictEqual(report2.id, "mi-tienda-unica-com");
  assert.strictEqual(report2.name, "Mi Tienda Única Actualizada");

  // Limpieza
  await deleteDbReport("mi-tienda-unica-com").catch(() => {});
});
