import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateShopifyTransactionFeeRate,
  calculateAppCostsMXN,
  calculateCommissionsMXN,
  calculateSavingsProjection
} from "../src/utils/calculations.ts";
import { Tool } from "../src/types.ts";

test("calculateShopifyTransactionFeeRate - Planes estándar y comisiones", () => {
  // Plan Basic: 2.0%
  assert.strictEqual(calculateShopifyTransactionFeeRate("basic"), 2.0);
  assert.strictEqual(calculateShopifyTransactionFeeRate("BASIC"), 2.0);

  // Plan Grow / Shopify: 1.0%
  assert.strictEqual(calculateShopifyTransactionFeeRate("grow"), 1.0);
  assert.strictEqual(calculateShopifyTransactionFeeRate("shopify"), 1.0);
  assert.strictEqual(calculateShopifyTransactionFeeRate("Grow"), 1.0);

  // Plan Advanced: 0.6%
  assert.strictEqual(calculateShopifyTransactionFeeRate("advanced"), 0.6);
  assert.strictEqual(calculateShopifyTransactionFeeRate("ADVANCED"), 0.6);

  // Plan Plus: 0.2%
  assert.strictEqual(calculateShopifyTransactionFeeRate("plus"), 0.2);
  assert.strictEqual(calculateShopifyTransactionFeeRate("Plus"), 0.2);

  // Plan Custom con comisión explícita
  assert.strictEqual(calculateShopifyTransactionFeeRate("custom", 1.5), 1.5);
  assert.strictEqual(calculateShopifyTransactionFeeRate("custom", 0.35), 0.35);

  // Plan Custom sin comisión provista (fallback a 2.0%)
  assert.strictEqual(calculateShopifyTransactionFeeRate("custom"), 2.0);

  // Plan no reconocido o valor por defecto
  assert.strictEqual(calculateShopifyTransactionFeeRate("enterprise-unknown"), 2.0);
  assert.strictEqual(calculateShopifyTransactionFeeRate(""), 2.0);
});

test("calculateAppCostsMXN - Conversión y cálculo de costos de aplicaciones", () => {
  const exchangeRate = 20.0;

  // Lista vacía retorna 0
  assert.strictEqual(calculateAppCostsMXN([], exchangeRate), 0);

  // Herramienta con costo exacto en USD
  const toolsUsdExact: Tool[] = [
    {
      id: "t1",
      name: "Klaviyo",
      costType: "exact",
      costExact: 100,
      currency: "USD",
      category: "Marketing"
    }
  ];
  assert.strictEqual(calculateAppCostsMXN(toolsUsdExact, exchangeRate), 2000); // 100 * 20 = 2000 MXN

  // Herramienta con costo exacto en MXN (no debe multiplicarse por tipo de cambio)
  const toolsMxnExact: Tool[] = [
    {
      id: "t2",
      name: "Facturación Local",
      costType: "exact",
      costExact: 500,
      currency: "MXN",
      category: "Facturación"
    }
  ];
  assert.strictEqual(calculateAppCostsMXN(toolsMxnExact, exchangeRate), 500);

  // Herramienta con costo en formato string
  const toolsStringCost: Tool[] = [
    {
      id: "t3",
      name: "Judge.me",
      costType: "exact",
      costExact: "29.99" as any,
      currency: "USD",
      category: "Reviews"
    }
  ];
  assert.strictEqual(calculateAppCostsMXN(toolsStringCost, exchangeRate), 29.99 * 20);

  // Herramienta con costo en rango (promedio min y max)
  const toolsRange: Tool[] = [
    {
      id: "t4",
      name: "Gorgias",
      costType: "range",
      costMin: 50,
      costMax: 150,
      currency: "USD",
      category: "Atención al Cliente"
    }
  ];
  // Promedio (50 + 150) / 2 = 100 USD -> 100 * 20 = 2000 MXN
  assert.strictEqual(calculateAppCostsMXN(toolsRange, exchangeRate), 2000);

  // Combinación múltiple de herramientas
  const toolsMixed: Tool[] = [
    {
      id: "t1",
      name: "App 1",
      costType: "exact",
      costExact: 50,
      currency: "USD",
      category: "Apps"
    }, // 50 * 20 = 1000 MXN
    {
      id: "t2",
      name: "App 2",
      costType: "exact",
      costExact: 300,
      currency: "MXN",
      category: "Apps"
    }, // 300 MXN
    {
      id: "t3",
      name: "App 3",
      costType: "range",
      costMin: 20,
      costMax: 40,
      currency: "USD",
      category: "Apps"
    } // (20+40)/2 = 30 * 20 = 600 MXN
  ];
  // Total esperado: 1000 + 300 + 600 = 1900 MXN
  assert.strictEqual(calculateAppCostsMXN(toolsMixed, exchangeRate), 1900);
});

test("calculateCommissionsMXN - Comisiones por transacción", () => {
  // GMV de $1,000,000 con tasa del 2% -> $20,000 MXN
  assert.strictEqual(calculateCommissionsMXN(1_000_000, 2.0), 20_000);

  // GMV de $500,000 con tasa del 0.6% -> $3,000 MXN
  assert.strictEqual(calculateCommissionsMXN(500_000, 0.6), 3_000);

  // GMV de $0 -> $0 MXN
  assert.strictEqual(calculateCommissionsMXN(0, 2.0), 0);

  // GMV de $250,000 con tasa del 1.0% -> $2,500 MXN
  assert.strictEqual(calculateCommissionsMXN(250_000, 1.0), 2_500);
});

test("calculateSavingsProjection - Proyección integral de fugas y ahorro Tiendanube", () => {
  const gmv = 1_000_000;
  const visitas = 50_000;
  const shopifyPlan = "basic"; // 2% fee -> $20,000 MXN
  const exchangeRate = 20.0;

  const tools: Tool[] = [
    {
      id: "tool-1",
      name: "App A",
      costType: "exact",
      costExact: 100, // 100 * 20 = 2000 MXN
      currency: "USD",
      category: "Test"
    },
    {
      id: "tool-2",
      name: "App B",
      costType: "exact",
      costExact: 150, // 150 * 20 = 3000 MXN
      currency: "USD",
      category: "Test"
    }
  ];

  const result = calculateSavingsProjection(gmv, visitas, shopifyPlan, exchangeRate, tools);

  // 1. Costo total de aplicaciones en MXN: 2000 + 3000 = 5000 MXN
  assert.strictEqual(result.shopifyAppCosts, 5000);

  // 2. Comisiones por transacción Shopify (2% de 1M): $20,000 MXN
  assert.strictEqual(result.shopifyCommissions, 20000);

  // 3. Fugas totales en Shopify: 20,000 + 5,000 = $25,000 MXN
  // Ahorro Tiendanube Mínimo (70% de $25,000): $17,500 MXN
  assert.strictEqual(result.tiendanubeSavingsMin, 17500);

  // Ahorro Tiendanube Máximo (95% de $25,000): $23,750 MXN
  assert.strictEqual(result.tiendanubeSavingsMax, 23750);
});
