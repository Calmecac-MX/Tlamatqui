import test from "node:test";
import assert from "node:assert/strict";
import { runEngagementWorkflow } from "../server/workflows/engagementWorkflow.js";
import { saveDbReport, getDbReportById, deleteDbReport } from "../server/dbBridge.js";
import { Report } from "../src/types.js";

test("EngagementWorkflow - Rastreo de visitantes únicos, vistas de slides y clics", async () => {
  const testReportId = `rep_test_engagement_${Date.now()}`;
  const initialReport: Report = {
    id: testReportId,
    name: "Tienda Test Telemetría",
    gmv: 500000,
    visitasMensuales: 20000,
    shopifyPlan: "basic",
    tiendanubePlan: "tiendanube",
    tools: [],
    comparisonRows: []
  };

  // Crear reporte base
  await saveDbReport(initialReport);

  try {
    // 1. Evento slide_view con primer visitante
    const res1 = await runEngagementWorkflow({
      reportId: testReportId,
      visitorId: "vstr_user_alpha",
      type: "slide_view",
      details: { slideName: "portada" }
    });

    assert.strictEqual(res1.success, true);
    assert.strictEqual(res1.uniqueVisitors, 1);
    assert.strictEqual(res1.interactions.slideViews["portada"], 1);

    // 2. Mismo visitante ve otro slide (no debe duplicar visitantes únicos)
    const res2 = await runEngagementWorkflow({
      reportId: testReportId,
      visitorId: "vstr_user_alpha",
      type: "slide_view",
      details: { slideName: "ahorro" }
    });

    assert.strictEqual(res2.uniqueVisitors, 1);
    assert.strictEqual(res2.interactions.slideViews["ahorro"], 1);

    // 3. Nuevo visitante diferente
    const res3 = await runEngagementWorkflow({
      reportId: testReportId,
      visitorId: "vstr_user_beta",
      type: "slide_view",
      details: { slideName: "ahorro" }
    });

    assert.strictEqual(res3.uniqueVisitors, 2);
    assert.strictEqual(res3.interactions.slideViews["ahorro"], 2);

    // 4. Clic en WhatsApp
    const res4 = await runEngagementWorkflow({
      reportId: testReportId,
      visitorId: "vstr_user_beta",
      type: "whatsapp_click"
    });

    assert.strictEqual(res4.interactions.whatsappClicks, 1);

    // 5. Cambio en calculadora financiera (modifica GMV y Shopify Plan)
    const res5 = await runEngagementWorkflow({
      reportId: testReportId,
      visitorId: "vstr_user_alpha",
      type: "calculator_change",
      details: {
        gmv: 1200000,
        shopifyPlan: "advanced",
        appsCostMXN: 4500
      }
    });

    assert.strictEqual(res5.interactions.calculatorInteractions, 1);
    assert.strictEqual(res5.report?.gmv, 1200000);
    assert.strictEqual(res5.report?.shopifyPlan, "advanced");

    // 6. Heartbeat de permanencia (tiempo en segundos)
    const res6 = await runEngagementWorkflow({
      reportId: testReportId,
      visitorId: "vstr_user_alpha",
      type: "heartbeat",
      details: { seconds: 15 }
    });

    assert.strictEqual(res6.interactions.timeSpentSeconds, 15);
  } finally {
    // Limpieza
    await deleteDbReport(testReportId).catch(() => {});
  }
});
