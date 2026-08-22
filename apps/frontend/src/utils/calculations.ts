/**
 * @file calculations.ts
 * @description Funciones de cálculo financiero, proyecciones de ahorro y desgloses de comisiones por plataforma.
 */

import { Tool } from "../types";

/**
 * Determina el porcentaje de comisión por transacción cobrado según el plan de Shopify.
 *
 * @param {string} plan - Nombre del plan de Shopify ('basic', 'grow', 'advanced', 'plus', 'custom').
 * @param {number} [customFee] - Porcentaje de comisión personalizado si el plan es 'custom'.
 * @returns {number} Porcentaje de comisión aplicable (ej. 2.0 para 2%).
 */
export const calculateShopifyTransactionFeeRate = (plan: string, customFee?: number): number => {
  switch (plan.toLowerCase()) {
    case 'basic':
      return 2.0;
    case 'grow':
    case 'shopify':
      return 1.0;
    case 'advanced':
      return 0.6;
    case 'plus':
      return 0.2;
    case 'custom':
      return customFee !== undefined ? customFee : 2.0;
    default:
      return 2.0;
  }
};

/**
 * Calcula el gasto total mensual en aplicaciones de terceros convirtiendo dólares a MXN.
 *
 * @param {Tool[]} tools - Lista de herramientas/aplicaciones auditadas.
 * @param {number} exchangeRate - Tipo de cambio activo USD/MXN.
 * @returns {number} Monto mensual acumulado en MXN.
 */
export const calculateAppCostsMXN = (tools: Tool[], exchangeRate: number): number => {
  if (!tools || tools.length === 0) return 0;
  
  return tools.reduce((total, tool) => {
    let monthlyUSD = 0;
    if (tool.costType === 'exact' && tool.costExact) {
      monthlyUSD = typeof tool.costExact === 'number' ? tool.costExact : parseFloat(tool.costExact) || 0;
    } else if (tool.costMin !== undefined && tool.costMax !== undefined) {
      monthlyUSD = (tool.costMin + tool.costMax) / 2;
    }

    if (tool.currency === 'MXN') {
      return total + monthlyUSD;
    }
    return total + (monthlyUSD * exchangeRate);
  }, 0);
};

/**
 * Calcula las comisiones cobradas por transacciones en MXN.
 *
 * @param {number} gmv - Facturación mensual total (GMV) en MXN.
 * @param {number} feeRate - Porcentaje de comisión aplicable (ej. 2.0 para 2%).
 * @returns {number} Monto estimado de comisiones en MXN.
 */
export const calculateCommissionsMXN = (gmv: number, feeRate: number): number => {
  return (gmv * feeRate) / 100;
};

/**
 * Calcula el rango estimado de ahorro mensual al migrar de Shopify a Tiendanube.
 *
 * @param {number} gmv - GMV mensual proyectado en MXN.
 * @param {number} visitas - Visitas mensuales estimadas.
 * @param {string} shopifyPlan - Plan origen de Shopify.
 * @param {number} exchangeRate - Tipo de cambio USD/MXN.
 * @param {Tool[]} [tools=[]] - Lista de aplicaciones auditadas.
 * @returns {{ shopifyAppCosts: number; shopifyCommissions: number; tiendanubeSavingsMin: number; tiendanubeSavingsMax: number }} Resultado detallado de ahorro.
 */
export const calculateSavingsProjection = (
  gmv: number,
  visitas: number,
  shopifyPlan: string,
  exchangeRate: number,
  tools: Tool[] = []
) => {
  const feeRate = calculateShopifyTransactionFeeRate(shopifyPlan);
  const shopifyCommissions = calculateCommissionsMXN(gmv, feeRate);
  const shopifyAppCosts = calculateAppCostsMXN(tools, exchangeRate);
  
  // Tiendanube no cobra comisión por transacción (0%)
  const totalFugasShopify = shopifyCommissions + shopifyAppCosts;
  
  const tiendanubeSavingsMin = Math.round(totalFugasShopify * 0.70);
  const tiendanubeSavingsMax = Math.round(totalFugasShopify * 0.95);

  return {
    shopifyAppCosts,
    shopifyCommissions,
    tiendanubeSavingsMin,
    tiendanubeSavingsMax,
  };
};
