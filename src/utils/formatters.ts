/**
 * @file formatters.ts
 * @description Funciones de utilidad para formateo de fechas, montos financieros con decimales y métricas abreviadas ($1.2M, $450k).
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
 * Convierte montos numéricos grandes a notación financiera abreviada elegante (ej. 1500000 -> "1.5M" o 450000 -> "450k").
 * Para montos con centavos que no son múltiplos grandes, muestra hasta 2 decimales.
 *
 * @param {number} value - Cantidad numérica a abreviar.
 * @param {boolean} [includeDecimals=true] - Si se deben preservar decimales significativos.
 * @returns {string} Texto abreviado con sufijos 'k' o 'M' o con 2 decimales.
 */
export const formatAbbreviatedAmount = (value: number, includeDecimals: boolean = true): string => {
  const num = Number(value) || 0;
  const abs = Math.abs(num);

  if (abs >= 1_000_000) {
    const val = num / 1_000_000;
    const formatted = val % 1 === 0 ? val.toString() : val.toFixed(includeDecimals ? 1 : 0).replace(/\.0$/, '');
    return `${formatted}M`;
  }
  if (abs >= 100_000) {
    const val = num / 1_000;
    const formatted = val % 1 === 0 ? val.toString() : val.toFixed(0);
    return `${formatted}k`;
  }
  if (abs >= 1_000) {
    const val = num / 1_000;
    const formatted = val % 1 === 0 ? val.toString() : val.toFixed(includeDecimals ? 1 : 0).replace(/\.0$/, '');
    return `${formatted}k`;
  }

  return num.toLocaleString("es-MX", {
    minimumFractionDigits: num % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2
  });
};

/**
 * Formatea una cifra numérica a formato estándar de moneda local ($ MXN / $ USD) con soporte para notación compacta ($1.2M) o decimales ($29.99).
 *
 * @param {number} amount - Cifra numérica.
 * @param {string} [currency='MXN'] - Código de divisa (MXN, USD).
 * @param {object} [options] - Opciones de configuración (compact, decimals).
 * @returns {string} Cifra formateada como divisa.
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'MXN',
  options?: { compact?: boolean; decimals?: number }
): string => {
  const num = Number(amount) || 0;
  const suffix = currency ? ` ${currency}` : '';

  if (options?.compact) {
    return `$${formatAbbreviatedAmount(num)}${suffix}`;
  }

  const minDecimals = options?.decimals !== undefined 
    ? options.decimals 
    : (num % 1 !== 0 ? 2 : 0);
  const maxDecimals = options?.decimals !== undefined ? options.decimals : 2;

  return `$${num.toLocaleString('es-MX', { minimumFractionDigits: minDecimals, maximumFractionDigits: maxDecimals })}${suffix}`;
};

/**
 * Formatea un número entero o decimal agregando comas como separadores de millares y preservando decimales.
 *
 * @param {number} value - Valor numérico a formatear.
 * @param {number} [decimals] - Cantidad opcional fija de decimales.
 * @returns {string} Número formateado con separadores de millar.
 */
export const formatNumber = (value: number, decimals?: number): string => {
  const num = Number(value) || 0;
  const minDecimals = decimals !== undefined ? decimals : (num % 1 !== 0 ? 2 : 0);
  const maxDecimals = decimals !== undefined ? decimals : 2;
  return num.toLocaleString('es-MX', { minimumFractionDigits: minDecimals, maximumFractionDigits: maxDecimals });
};

