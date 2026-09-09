import test from "node:test";
import assert from "node:assert/strict";
import { resolveTechnologyLogo } from "../server/scrapper.js";
import { sanitizeDomain } from "../server/dnsIntegrationService.js";
import { runAuditWorkflow } from "../server/workflows/auditWorkflow.js";
import { deleteDbReport } from "../server/dbBridge.js";
import { ReportSchema } from "../src/schemas/report.js";

test("resolveTechnologyLogo - Resolución de logos de aplicaciones y tecnologías", () => {
  // 1. Preservar logo existente si ya es válido
  const existingLogo = "https://cdn.mycustombrand.com/logo.png";
  assert.strictEqual(resolveTechnologyLogo("Klaviyo", undefined, existingLogo), existingLogo);

  // 2. Tecnología conocida (Klaviyo -> klaviyo.com)
  const klaviyoLogo = resolveTechnologyLogo("Klaviyo");
  assert.ok(klaviyoLogo.includes("klaviyo.com"), "Debe resolver icono con dominio klaviyo.com");

  // 3. Tecnología conocida (Judge.me -> judge.me)
  const judgeLogo = resolveTechnologyLogo("Judge.me");
  assert.ok(judgeLogo.includes("judge.me"), "Debe resolver icono con dominio judge.me");

  // 4. Inferencia por URL provista
  const customUrlLogo = resolveTechnologyLogo("Custom App", "https://mi-app-ecommerce.com/features");
  assert.ok(customUrlLogo.includes("mi-app-ecommerce.com"), "Debe inferir el dominio de la URL");
});

test("sanitizeDomain - Sanitización y normalización de dominios y URLs", () => {
  assert.strictEqual(sanitizeDomain("https://www.tienda-ejemplo.com/"), "www.tienda-ejemplo.com");
  assert.strictEqual(sanitizeDomain("http://tienda.myshopify.com/products"), "tienda.myshopify.com");
  assert.strictEqual(sanitizeDomain("  WWW.ROPA-ONLINE.MX  "), "www.ropa-online.mx");
  assert.strictEqual(sanitizeDomain("sub.dominio.co.uk/checkout"), "sub.dominio.co.uk");
});

test("runAuditWorkflow - Generación integral y validación de reporte de auditoría", async () => {
  const auditResult = await runAuditWorkflow({
    url: "https://tienda-demo-calmecac.myshopify.com",
    contactEmail: "contacto@tienda-demo.com",
    customExchangeRate: 20.0
  });

  assert.strictEqual(auditResult.success, true);
  assert.ok(auditResult.report, "Debe retornar un objeto Report");
  assert.ok(auditResult.summary, "Debe retornar un resumen ejecutivo");
  assert.strictEqual(auditResult.summary.detectedCms, "Shopify");
  assert.ok(auditResult.report.id.startsWith("rep_"));

  // Validar contra el esquema estricto Zod de Report
  const validatedReport = ReportSchema.parse(auditResult.report);
  assert.strictEqual(validatedReport.id, auditResult.report.id);
  assert.ok(Array.isArray(validatedReport.tools));
  assert.ok(Array.isArray(validatedReport.comparisonRows));

  // Limpieza
  await deleteDbReport(auditResult.report.id).catch(() => {});
});
