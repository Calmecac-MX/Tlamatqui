import test from "node:test";
import assert from "node:assert/strict";
import {
  formatReportDate,
  formatAbbreviatedAmount,
  formatCurrency,
  formatNumber
} from "../src/utils/formatters.ts";

test("formatReportDate - Formato de fecha legible en español", () => {
  // Fecha ISO fija: 2026-08-14
  const formatted = formatReportDate("2026-08-14T12:00:00.000Z");
  assert.ok(formatted.includes("2026"), "Debe contener el año 2026");
  assert.ok(formatted.includes("agosto") || formatted.includes("14"), "Debe contener el mes o día legible");

  // Entrada vacía o nula retorna fecha válida
  const emptyFormatted = formatReportDate(undefined);
  assert.ok(typeof emptyFormatted === "string" && emptyFormatted.length > 0);

  // Entrada inválida retorna fallback sin lanzar excepción
  const invalidFormatted = formatReportDate("invalid-date-string-1234");
  assert.ok(typeof invalidFormatted === "string" && invalidFormatted.length > 0);
});

test("formatAbbreviatedAmount - Notación abreviada (M, k y decimales)", () => {
  // Millones
  assert.strictEqual(formatAbbreviatedAmount(1_000_000), "1M");
  assert.strictEqual(formatAbbreviatedAmount(1_500_000), "1.5M");
  assert.strictEqual(formatAbbreviatedAmount(2_000_000), "2M");
  assert.strictEqual(formatAbbreviatedAmount(10_250_000), "10.3M");

  // Cientos de miles (>= 100,000)
  assert.strictEqual(formatAbbreviatedAmount(450_000), "450k");
  assert.strictEqual(formatAbbreviatedAmount(100_000), "100k");
  assert.strictEqual(formatAbbreviatedAmount(999_999), "1000k");

  // Miles (1,000 a 99,999)
  assert.strictEqual(formatAbbreviatedAmount(1_000), "1k");
  assert.strictEqual(formatAbbreviatedAmount(12_500), "12.5k");
  assert.strictEqual(formatAbbreviatedAmount(5_000), "5k");

  // includeDecimals = false
  assert.strictEqual(formatAbbreviatedAmount(1_200_000, false), "1M");
  assert.strictEqual(formatAbbreviatedAmount(1_500_000, false), "2M");
  assert.strictEqual(formatAbbreviatedAmount(12_200, false), "12k");
  assert.strictEqual(formatAbbreviatedAmount(12_500, false), "13k");

  // Menor a 1000
  const subThousand = formatAbbreviatedAmount(500);
  assert.strictEqual(subThousand, "500");

  const subThousandDecimals = formatAbbreviatedAmount(49.99);
  assert.ok(subThousandDecimals.includes("49.99") || subThousandDecimals.includes("49,99"));

  assert.strictEqual(formatAbbreviatedAmount(0), "0");
});

test("formatCurrency - Formateo de moneda con soporte para notación compacta y decimales", () => {
  // Moneda estándar MXN
  const std = formatCurrency(1500, "MXN");
  assert.ok(std.startsWith("$"));
  assert.ok(std.includes("1,500") || std.includes("1500"));
  assert.ok(std.endsWith("MXN"));

  // Moneda compacta ($1.5M MXN)
  const compactMillion = formatCurrency(1_500_000, "MXN", { compact: true });
  assert.strictEqual(compactMillion, "$1.5M MXN");

  const compactThousand = formatCurrency(450_000, "USD", { compact: true });
  assert.strictEqual(compactThousand, "$450k USD");

  // Forzar decimales específicos
  const decimalsFixed = formatCurrency(29.99, "USD", { decimals: 2 });
  assert.ok(decimalsFixed.includes("29.99") || decimalsFixed.includes("29,99"));
  assert.ok(decimalsFixed.endsWith("USD"));

  const zeroDecimals = formatCurrency(1200.75, "MXN", { decimals: 0 });
  assert.ok(zeroDecimals.includes("1,201") || zeroDecimals.includes("1201"));
});

test("formatNumber - Formateo con separador de millar y decimales", () => {
  const formatted = formatNumber(1_000_000);
  assert.ok(formatted.includes("1,000,000") || formatted.includes("1.000.000"));

  const formattedDecimals = formatNumber(1234.5678, 2);
  assert.ok(formattedDecimals.includes("1,234.57") || formattedDecimals.includes("1.234,57"));

  assert.strictEqual(formatNumber(0), "0");
});
