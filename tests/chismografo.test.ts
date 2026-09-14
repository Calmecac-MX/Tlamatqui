import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveChismografoLogo,
  normalizeChismografoPrices,
  normalizeChismografoTechItemToTool,
  ChismografoTechItem,
} from "../server/scrapper.js";

test("Chismografo OpenAPI - Resolución de Logotipos con LogoMetadata y /api/icon", () => {
  // 1. LogoMetadata local con colección
  const localLogo = resolveChismografoLogo(
    { id: "smile-io.webp", proveedor: "local" },
    "Smile: Loyalty & Rewards",
    "https://smile.io",
    "apps"
  );
  assert.strictEqual(
    localLogo,
    "https://chismografo.rifatela.lol/api/icon?id=smile-io.webp&provider=local&collection=apps"
  );

  // 2. LogoMetadata con BrandIcons y dominio
  const brandLogo = resolveChismografoLogo(
    { id: "clarity.microsoft.com", proveedor: "brandicons" },
    "Microsoft Clarity",
    "https://clarity.microsoft.com"
  );
  assert.strictEqual(
    brandLogo,
    "https://chismografo.rifatela.lol/api/icon?id=clarity.microsoft.com&provider=brandicons"
  );

  // 3. Logo con URL absoluta directa
  const directUrl = "https://cdn.shopify.com/app-store/smile.png";
  const urlLogo = resolveChismografoLogo(
    { id: directUrl, proveedor: "shopify" },
    "Smile.io"
  );
  assert.strictEqual(urlLogo, directUrl);

  // 4. Nombre de archivo estático en string
  const staticFileLogo = resolveChismografoLogo("infinite-options.webp", "Infinite Options", undefined, "apps");
  assert.strictEqual(
    staticFileLogo,
    "https://chismografo.rifatela.lol/api/icon?id=infinite-options.webp&provider=local&collection=apps"
  );
});

test("Chismografo OpenAPI - Normalización de Planes de Precios (PrecioPlan)", () => {
  const rawPrices = [
    {
      id: 1,
      plan: "Free Plan",
      precio: "Gratis",
      moneda: "USD",
      frecuencia: "mes",
      caracteristicas: ["Hasta 500 pedidos", "Soporte básico"],
    },
    {
      id: 2,
      plan: "Growth Plan",
      precio: { monto: 49, moneda: "USD" },
      moneda: "USD",
      frecuencia: "mes",
      features: ["Pedidos ilimitados", "Soporte prioritario"],
    },
    {
      id: 3,
      plan: "Pro Annual",
      precio: 199,
      moneda: "USD",
      frecuencia: "año",
    },
  ];

  const normalized = normalizeChismografoPrices(rawPrices);
  assert.strictEqual(normalized.length, 3);

  // Plan 1: Gratis -> precio 0
  assert.strictEqual(normalized[0].plan, "Free Plan");
  assert.strictEqual(normalized[0].precio, 0);
  assert.strictEqual(normalized[0].frecuencia, "mes");
  assert.deepStrictEqual(normalized[0].caracteristicas, ["Hasta 500 pedidos", "Soporte básico"]);

  // Plan 2: Objeto monto 49
  assert.strictEqual(normalized[1].plan, "Growth Plan");
  assert.strictEqual(normalized[1].precio, 49);
  assert.deepStrictEqual(normalized[1].features, ["Pedidos ilimitados", "Soporte prioritario"]);

  // Plan 3: Numérico 199
  assert.strictEqual(normalized[2].plan, "Pro Annual");
  assert.strictEqual(normalized[2].precio, 199);
  assert.strictEqual(normalized[2].frecuencia, "año");
});

test("Chismografo OpenAPI - Normalización de TechItem anidado (acercaDe) a Tool", () => {
  const nestedItem: ChismografoTechItem = {
    id: "smile-io",
    chismografo: {
      tipo: 1,
      version: 1.0,
      ultimaActualizacion: "2026-09-13",
      revision: 0,
      entorno: 2,
    },
    acercaDe: {
      detallesGenerales: {
        nombre: "Smile: Loyalty & Rewards",
        desarrollador: "Smile.io",
        web: "https://smile.io",
        categoria: "Lealtad y Recompensas",
        logo: {
          id: "smile-io.webp",
          proveedor: "local",
        },
      },
      calificacion: {
        puntaje: 4.9,
        resenas: 4572,
      },
      cmsCompatibles: [{ id: "shopify", slug: "smile-io" }],
      precios: [
        { id: 1, plan: "Free", precio: 0, moneda: "USD" },
        { id: 2, plan: "Growth", precio: { monto: 49, moneda: "USD" }, moneda: "USD" },
        { id: 3, plan: "Plus", precio: { monto: 199, moneda: "USD" }, moneda: "USD" },
      ],
    },
    herramienta: {
      reglasDeteccion: [
        {
          id: "rule-smile-js",
          tipo: "script-src",
          patron: "smile\\.io\\/v1\\/smile\\.js",
          descripcion: "Script CDN de Smile",
        },
      ],
    },
  };

  const tool = normalizeChismografoTechItemToTool(nestedItem, 0);

  assert.strictEqual(tool.name, "Smile: Loyalty & Rewards");
  assert.strictEqual(tool.category, "Lealtad y Recompensas");
  assert.strictEqual(tool.url, "https://smile.io");
  assert.strictEqual(
    tool.logo,
    "https://chismografo.rifatela.lol/api/icon?id=smile-io.webp&provider=local&collection=apps"
  );
  assert.strictEqual(tool.costType, "range");
  assert.strictEqual(tool.costMin, 0);
  assert.strictEqual(tool.costMax, 199);
  assert.strictEqual(tool.costExact, 49); // Primer plan con costo > 0
  assert.ok(tool.precios && tool.precios.length === 3);
});

test("Chismografo OpenAPI - Normalización de TechItem con propiedades planas / aliases", () => {
  const flatItem: ChismografoTechItem = {
    id: "klaviyo",
    nombre: "Klaviyo",
    desarrollador: "Klaviyo Inc.",
    categoria: "Marketing & Automatización",
    web: "https://klaviyo.com",
    logo: "klaviyo.webp",
    precios: [
      { id: 1, plan: "Free Tier", precio: "Gratis", moneda: "USD" },
      { id: 2, plan: "Email Growth", precio: 45, moneda: "USD" },
    ],
  };

  const tool = normalizeChismografoTechItemToTool(flatItem, 0);

  assert.strictEqual(tool.name, "Klaviyo");
  assert.strictEqual(tool.category, "Marketing & Automatización");
  assert.strictEqual(tool.url, "https://klaviyo.com");
  assert.strictEqual(tool.costExact, 45);
  assert.strictEqual(tool.costMin, 0);
  assert.strictEqual(tool.costMax, 45);
});
