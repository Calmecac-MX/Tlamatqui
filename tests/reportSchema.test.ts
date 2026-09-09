import test from "node:test";
import assert from "node:assert/strict";
import {
  ReportSchema,
  ReportPageSpeedSchema,
  ReportMetricsSubtableSchema,
  ReportPlatformConfigSubtableSchema
} from "../src/schemas/report.ts";
import { ToolSchema } from "../src/schemas/tool.ts";
import { ComparisonRowSchema } from "../src/schemas/comparison.ts";

test("ToolSchema - Validación de aplicaciones auditadas", () => {
  const validTool = {
    id: "tool-1",
    name: "Klaviyo",
    category: "Email Marketing",
    costType: "exact",
    costExact: 100,
    currency: "USD",
    semaphore: "green",
    url: "https://klaviyo.com",
    description: "Plataforma de automatización de marketing"
  };

  const parsed = ToolSchema.parse(validTool);
  assert.strictEqual(parsed.id, "tool-1");
  assert.strictEqual(parsed.name, "Klaviyo");
  assert.strictEqual(parsed.costExact, 100);
  assert.strictEqual(parsed.semaphore, "green");

  // Validación de falla al omitir campos obligatorios
  assert.throws(() => {
    ToolSchema.parse({ id: "" });
  });
});

test("ComparisonRowSchema - Validación de tabla comparativa", () => {
  const validRow = {
    id: "row-1",
    variable: "Facturación",
    shopify: "Pesificada en USD + 16% IVA",
    tiendanube: "100% Pesificada en MXN Factura Local",
    pillText: "Ahorro Fiscal"
  };

  const parsed = ComparisonRowSchema.parse(validRow);
  assert.strictEqual(parsed.variable, "Facturación");
  assert.strictEqual(parsed.pillText, "Ahorro Fiscal");
});

test("ReportPageSpeedSchema - Validación de Core Web Vitals y Lighthouse", () => {
  const validPageSpeed = {
    performanceScore: 88,
    accessibilityScore: 92,
    fcp: "1.2s",
    lcp: "2.4s",
    cls: "0.01",
    tbt: "120ms",
    speedIndex: "1.8s",
    latencyMs: 85,
    isDemo: false
  };

  const parsed = ReportPageSpeedSchema.parse(validPageSpeed);
  assert.strictEqual(parsed.performanceScore, 88);
  assert.strictEqual(parsed.fcp, "1.2s");
  assert.strictEqual(parsed.isDemo, false);
});

test("ReportSchema - Validación completa de Reporte y valores por defecto", () => {
  const sampleReport = {
    id: "rep_sample_123",
    name: "Tienda Demo México",
    visitasMensuales: 45000,
    gmv: 850000,
    shopifyPlan: "basic",
    tiendanubePlan: "tiendanube",
    tools: [
      {
        id: "t1",
        name: "Shopify Inbox",
        category: "Atención al Cliente",
        costType: "exact",
        costExact: 0,
        currency: "USD",
        semaphore: "green"
      }
    ],
    comparisonRows: [
      {
        id: "c1",
        variable: "Comisiones",
        shopify: "2.0%",
        tiendanube: "0%",
        pillText: "0% Comisión"
      }
    ]
  };

  const parsed = ReportSchema.parse(sampleReport);
  assert.strictEqual(parsed.id, "rep_sample_123");
  assert.strictEqual(parsed.name, "Tienda Demo México");
  assert.strictEqual(parsed.gmv, 850000);
  assert.strictEqual(parsed.visitasMensuales, 45000);
  assert.strictEqual(parsed.tools.length, 1);
  assert.strictEqual(parsed.comparisonRows.length, 1);
  assert.deepStrictEqual(parsed.adminLogos, []);

  // Validación de falla cuando falta ID o Nombre
  assert.throws(() => {
    ReportSchema.parse({
      id: "",
      name: "Sin ID"
    });
  });

  assert.throws(() => {
    ReportSchema.parse({
      id: "rep_123",
      name: ""
    });
  });

  // Validación de enum para shopifyPlan
  assert.throws(() => {
    ReportSchema.parse({
      id: "rep_123",
      name: "Tienda Test",
      shopifyPlan: "invalid-plan-name" as any
    });
  });
});
