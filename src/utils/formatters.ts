/**
 * @file formatters.ts
 * @description Funciones de utilidad para formateo de fechas, montos financieros y métricas abreviadas.
 */

/**
 * Formatea una cadena de fecha en formato ISO a una representación legible en español (ej. "14 de agosto de 2026").
 *
 * @param {string} [dateStr] - Cadena de fecha en formato ISO u otro formato analizable por Date.
 * @returns {string} Fecha formateada en español. Si no se provee o es inválida, retorna la fecha actual.
 */
export const formatReportDate = (dateStr?: string): string => {
  if (!dateStr) {
    return new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) {
    return new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  }
};

/**
 * Convierte montos numéricos grandes a notación financiera abreviada (ej. 1500000 -> "$1.5M" o 450000 -> "$450k").
 *
 * @param {number} value - Cantidad numérica a abreviar.
 * @returns {string} Texto abreviado con sufijos 'k' o 'M'.
 */
export const formatAbbreviatedAmount = (value: number): string => {
  if (value >= 1000000) {
    const val = value / 1000000;
    return val % 1 === 0 ? `${val}M` : `${val.toFixed(2).replace(/\.?0+$/, '')}M`;
  }
  if (value >= 1000) {
    const val = value / 1000;
    return val % 1 === 0 ? `${val}k` : `${val.toFixed(2).replace(/\.?0+$/, '')}k`;
  }
  return value.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/**
 * Formatea una cifra numérica a formato estándar de moneda local ($ MXN / $ USD).
 *
 * @param {number} amount - Cifra numérica.
 * @param {string} [currency='MXN'] - Código de divisa (MXN, USD).
 * @returns {string} Cifra formateada como divisa.
 */
export const formatCurrency = (amount: number, currency: string = 'MXN'): string => {
  return `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
};

/**
 * Formatea un número entero o decimal agregando comas como separadores de millares.
 *
 * @param {number} value - Valor numérico a formatear.
 * @returns {string} Número formateado con separadores de millar.
 */
export const formatNumber = (value: number): string => {
  return value.toLocaleString('es-MX');
};
