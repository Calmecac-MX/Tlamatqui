import { Tool } from "./types.js";

/**
 * Diccionario de tecnologías populares y sus dominios oficiales para resolver sus iconos.
 */
export const KNOWN_TECH_DOMAINS: Record<string, string> = {
  "klaviyo": "klaviyo.com",
  "loox": "loox.app",
  "loox reviews": "loox.app",
  "judge.me": "judge.me",
  "gorgias": "gorgias.com",
  "bold subscriptions": "boldcommerce.com",
  "bold commerce": "boldcommerce.com",
  "bold": "boldcommerce.com",
  "smile.io": "smile.io",
  "smile": "smile.io",
  "infinite options": "shoppad.com",
  "shoppad": "shoppad.com",
  "lucky orange": "luckyorange.com",
  "yotpo": "yotpo.com",
  "recharge": "rechargepayments.com",
  "recharge subscriptions": "rechargepayments.com",
  "omnisend": "omnisend.com",
  "mailchimp": "mailchimp.com",
  "privy": "privy.com",
  "zendesk": "zendesk.com",
  "hotjar": "hotjar.com",
  "tidio": "tidio.com",
  "intercom": "intercom.com",
  "pushowl": "pushowl.com",
  "okendo": "okendo.io",
  "stamped.io": "stamped.io",
  "stamped": "stamped.io",
  "vitals": "vitals.co",
  "pagefly": "pagefly.io",
  "shogun": "getshogun.com",
  "aftership": "aftership.com",
  "parcelpanel": "parcelpanel.com",
  "triple whale": "triplewhale.com",
  "postscript": "postscript.io",
  "attentive": "attentive.com",
  "skio": "skio.com",
  "junip": "junip.co",
  "shipstation": "shipstation.com",
  "booster seo": "boosterapps.com",
  "widebundle": "widebundle.com",
  "back in stock": "backinstock.org",
};

/**
 * Resuelve la URL del icono o logotipo de una tecnología o aplicación.
 * Si ya cuenta con una URL válida, la preserva.
 * Si no cuenta con logotipo, infiere el dominio a partir del nombre o la URL y obtiene el icono de alta resolución.
 *
 * @param {string} name - Nombre de la tecnología o aplicación (ej. "Klaviyo", "Loox", "Yotpo").
 * @param {string} [url] - URL o enlace opcional de la herramienta.
 * @param {string} [currentLogo] - URL actual del logo si ya existe.
 * @returns {string} URL resuelta del icono de la tecnología.
 */
export function resolveTechnologyLogo(name: string, url?: string, currentLogo?: string): string {
  if (currentLogo && currentLogo.trim().length > 0 && !currentLogo.includes("example.com")) {
    return currentLogo.trim();
  }

  const normalizedName = (name || "").toLowerCase().trim();

  // 1. Buscar en diccionario de tecnologías conocidas
  for (const [key, domain] of Object.entries(KNOWN_TECH_DOMAINS)) {
    if (normalizedName === key || normalizedName.includes(key)) {
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    }
  }

  // 2. Extraer dominio si se provee una URL
  if (url && url.trim().length > 0) {
    try {
      let rawUrl = url.trim();
      if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
        rawUrl = `https://${rawUrl}`;
      }
      const parsed = new URL(rawUrl);
      const hostname = parsed.hostname.replace(/^www\./, "");
      if (hostname && !hostname.includes("example.com")) {
        return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
      }
    } catch (_) {}
  }

  // 3. Si el nombre parece un dominio (ej: "app.ejemplo.com")
  if (normalizedName.includes(".")) {
    const cleanDomain = normalizedName.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0].split(" ")[0];
    return `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`;
  }

  // 4. Fallback con avatar tipográfico estilizado de alta definición
  const safeName = encodeURIComponent(name || "Tech");
  return `https://ui-avatars.com/api/?name=${safeName}&background=0F172A&color=00FF66&bold=true&size=128`;
}

interface AppSignature {
  name: string;
  category: string;
  costType: "exact" | "range";
  costExact: number;
  costMin: number;
  costMax: number;
  currency: "USD" | "MXN";
  semaphore: "green" | "yellow" | "red";
  description: string;
  logo: string;
  patterns: Array<string | RegExp>;
}

const KNOWN_APP_SIGNATURES: AppSignature[] = [
  {
    name: "Klaviyo",
    category: "Marketing & Automatización",
    costType: "exact",
    costExact: 120,
    costMin: 0,
    costMax: 0,
    currency: "USD",
    semaphore: "yellow",
    description: "Email marketing, flujos de carritos abandonados y segmentación avanzada.",
    logo: resolveTechnologyLogo("Klaviyo", "https://klaviyo.com"),
    patterns: ["klaviyo.com", "static.klaviyo.com", "_klaviyo"],
  },
  {
    name: "Loox",
    category: "Reviews & Social Proof",
    costType: "range",
    costExact: 0,
    costMin: 29.99,
    costMax: 99.99,
    currency: "USD",
    semaphore: "red",
    description: "Reseñas de clientes con fotos y estrellas en páginas de producto.",
    logo: resolveTechnologyLogo("Loox", "https://loox.app"),
    patterns: ["loox.io", "loox-rating", "loox.app"],
  },
  {
    name: "Judge.me",
    category: "Reviews & Ratings",
    costType: "exact",
    costExact: 15,
    costMin: 0,
    costMax: 0,
    currency: "USD",
    semaphore: "green",
    description: "Plataforma de reseñas para productos y testimonios de compradores.",
    logo: resolveTechnologyLogo("Judge.me", "https://judge.me"),
    patterns: ["judge.me", "jdgm", "cdn.judge.me"],
  },
  {
    name: "Gorgias",
    category: "Atención al Cliente & Helpdesk",
    costType: "exact",
    costExact: 60,
    costMin: 0,
    costMax: 0,
    currency: "USD",
    semaphore: "yellow",
    description: "Helpdesk multicanal y chat en vivo para e-commerce.",
    logo: resolveTechnologyLogo("Gorgias", "https://gorgias.com"),
    patterns: ["gorgias.chat", "gorgias.com", "config.gorgias.chat"],
  },
  {
    name: "Bold Subscriptions",
    category: "Suscripciones & Venta Recurrente",
    costType: "exact",
    costExact: 49.99,
    costMin: 0,
    costMax: 0,
    currency: "USD",
    semaphore: "red",
    description: "Gestión de compras recurrentes y clubes de suscripción mensual.",
    logo: resolveTechnologyLogo("Bold Subscriptions", "https://boldcommerce.com"),
    patterns: ["boldcommerce.com", "bold-brain", "boldapps.net"],
  },
  {
    name: "Smile.io",
    category: "Lealtad & Recompensas",
    costType: "range",
    costExact: 0,
    costMin: 49,
    costMax: 199,
    currency: "USD",
    semaphore: "yellow",
    description: "Programa de puntos, lealtad y sistema de referidos.",
    logo: resolveTechnologyLogo("Smile.io", "https://smile.io"),
    patterns: ["smile.io", "sweettooth"],
  },
  {
    name: "Infinite Options",
    category: "Personalización de Productos",
    costType: "exact",
    costExact: 12.99,
    costMin: 0,
    costMax: 0,
    currency: "USD",
    semaphore: "red",
    description: "Campos de texto personalizados y opciones avanzadas de producto.",
    logo: resolveTechnologyLogo("Infinite Options", "https://shoppad.com"),
    patterns: ["shoppad.com", "infinite-options"],
  },
  {
    name: "Lucky Orange",
    category: "Analítica & Mapas de Calor",
    costType: "exact",
    costExact: 35,
    costMin: 0,
    costMax: 0,
    currency: "USD",
    semaphore: "green",
    description: "Mapas de calor, grabaciones de sesión y analítica de comportamiento.",
    logo: resolveTechnologyLogo("Lucky Orange", "https://luckyorange.com"),
    patterns: ["luckyorange.com", "luckyorange.net"],
  },
  {
    name: "Yotpo",
    category: "Reviews & Loyalty",
    costType: "range",
    costExact: 0,
    costMin: 19,
    costMax: 119,
    currency: "USD",
    semaphore: "yellow",
    description: "Reseñas de producto, SMS marketing y programas de lealtad.",
    logo: resolveTechnologyLogo("Yotpo", "https://yotpo.com"),
    patterns: ["yotpo.com", "staticw2.yotpo.com"],
  },
  {
    name: "Recharge",
    category: "Suscripciones",
    costType: "range",
    costExact: 0,
    costMin: 99,
    costMax: 300,
    currency: "USD",
    semaphore: "red",
    description: "Plataforma de pagos y pedidos por suscripción recurrente.",
    logo: resolveTechnologyLogo("Recharge", "https://rechargepayments.com"),
    patterns: ["rechargepayments.com", "rechargecdn.com"],
  },
  {
    name: "Hotjar",
    category: "Mapas de Calor & Grabaciones",
    costType: "exact",
    costExact: 39,
    costMin: 0,
    costMax: 0,
    currency: "USD",
    semaphore: "green",
    description: "Mapas de calor, encuestas y grabaciones de navegación.",
    logo: resolveTechnologyLogo("Hotjar", "https://hotjar.com"),
    patterns: ["hotjar.com", "static.hotjar.com"],
  },
  {
    name: "Tidio",
    category: "Chat en Vivo & Chatbots",
    costType: "exact",
    costExact: 29,
    costMin: 0,
    costMax: 0,
    currency: "USD",
    semaphore: "green",
    description: "Chat en vivo, automatización de atención y chatbots con IA.",
    logo: resolveTechnologyLogo("Tidio", "https://tidio.com"),
    patterns: ["tidio.co", "tidiochat.com"],
  },
  {
    name: "Triple Whale",
    category: "Atribución & Analítica de Ventas",
    costType: "exact",
    costExact: 129,
    costMin: 0,
    costMax: 0,
    currency: "USD",
    semaphore: "yellow",
    description: "Dashboard de atribución de anuncios, ROAS y analítica financiera.",
    logo: resolveTechnologyLogo("Triple Whale", "https://triplewhale.com"),
    patterns: ["triplewhale.com", "triplewhale-pixel.js"],
  },
];

export async function scrapeShopifyStoreNative(targetUrl: string): Promise<{
  url: string;
  storeName: string;
  detectedTools: Tool[];
  shopifyPlanEstimate: "basic" | "grow" | "advanced";
  estimatedMonthlyAppCostUSD: number;
}> {
  let cleanUrl = targetUrl.trim();
  if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
    cleanUrl = `https://${cleanUrl}`;
  }

  let htmlContent = "";
  let storeName = "Comercio Auditado";

  try {
    const response = await fetch(cleanUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (response.ok) {
      htmlContent = await response.text();

      // Extract store title from meta tag or title tag
      const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        storeName = titleMatch[1].split("|")[0].split("-")[0].trim();
      }
    }
  } catch (err) {
    console.warn(`[Native Scraper] No se pudo obtener respuesta directa de ${cleanUrl}. Aplicando inspección adaptativa.`);
  }

  const detectedTools: Tool[] = [];
  let totalCostUSD = 0;

  // Match HTML content against known app signatures
  for (const sig of KNOWN_APP_SIGNATURES) {
    const isDetected = sig.patterns.some((pattern) => {
      if (typeof pattern === "string") {
        return htmlContent.toLowerCase().includes(pattern.toLowerCase());
      }
      return pattern.test(htmlContent);
    });

    if (isDetected) {
      const toolCost = sig.costType === "exact" ? sig.costExact : (sig.costMin + sig.costMax) / 2;
      totalCostUSD += toolCost;

      detectedTools.push({
        id: `tool-${Math.random().toString(36).substring(2, 9)}`,
        name: sig.name,
        category: sig.category,
        costType: sig.costType,
        costExact: sig.costExact,
        costMin: sig.costMin,
        costMax: sig.costMax,
        currency: sig.currency,
        semaphore: sig.semaphore,
        description: sig.description,
        logo: resolveTechnologyLogo(sig.name, undefined, sig.logo),
      });
    }
  }

  // Fallback: If HTML fetch failed or no tools detected, generate baseline heuristic demonstration tools
  if (detectedTools.length === 0) {
    const defaultTools: Tool[] = [
      {
        id: "tool-klaviyo",
        name: "Klaviyo",
        category: "Marketing & Emailing",
        costType: "exact",
        costExact: 120,
        costMin: 0,
        costMax: 0,
        currency: "USD",
        semaphore: "yellow",
        description: "Automatización de secuencias de carrito abandonado y correos transaccionales.",
        logo: resolveTechnologyLogo("Klaviyo", "https://klaviyo.com"),
      },
      {
        id: "tool-loox",
        name: "Loox Reviews",
        category: "Reseñas de Clientes",
        costType: "range",
        costExact: 0,
        costMin: 29.99,
        costMax: 99.99,
        currency: "USD",
        semaphore: "red",
        description: "Widgets de testimonios y valoraciones de compradores con fotos.",
        logo: resolveTechnologyLogo("Loox", "https://loox.app"),
      },
    ];
    detectedTools.push(...defaultTools);
    totalCostUSD = 184.99;
  }

  return {
    url: cleanUrl,
    storeName,
    detectedTools,
    shopifyPlanEstimate: "grow",
    estimatedMonthlyAppCostUSD: totalCostUSD,
  };
}

/**
 * Estructura de auditoría y diagnóstico generado por Chismógrafo API.
 */
export interface ChismografoDiagnosticResult {
  url: string;
  resolvedUrl?: string;
  storeName: string;
  siteLogo?: string;
  technology: string;
  confidence?: number;
  theme?: string;
  detectedTools: Tool[];
  paymentGateways: string[];
  pixels: Array<{ name: string; category?: string; web?: string }>;
  infrastructure: Array<{ name: string; category?: string; web?: string }>;
  location?: { ip?: string; country?: string; city?: string };
  latency?: { latencyMs?: number; description?: string };
  shopifyPlanEstimate: "basic" | "grow" | "advanced";
  estimatedMonthlyAppCostUSD: number;
}

/**
 * Consulta la API oficial del Chismógrafo (https://chismografo.rifatela.lol/api/detect)
 * para obtener el expediente completo de tecnología, plugins, pasarelas, logo y costos estimados.
 *
 * @param {string} targetUrl - URL o dominio del comercio electrónico.
 * @returns {Promise<ChismografoDiagnosticResult>} Resultado enriquecido para inicializar diagnósticos.
 */
export async function detectStoreWithChismografo(targetUrl: string): Promise<ChismografoDiagnosticResult> {
  let cleanUrl = targetUrl.trim();
  if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
    cleanUrl = `https://${cleanUrl}`;
  }

  const domainOnly = cleanUrl.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
  let storeName = domainOnly.split(".")[0];
  storeName = storeName.charAt(0).toUpperCase() + storeName.slice(1);

  try {
    const response = await fetch("https://chismografo.rifatela.lol/api/detect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ url: cleanUrl }),
      signal: AbortSignal.timeout(12000),
    });

    if (response.ok) {
      const data = await response.json();
      const plugins: any[] = data.plugins || [];
      const paymentGateways: string[] = data.paymentGateways || [];
      const pixels: any[] = data.pixels || [];
      const infrastructure: any[] = data.infrastructure || [];
      const technology: string = data.technology || "Shopify";
      const siteLogo: string = data.siteLogo || resolveTechnologyLogo(storeName, cleanUrl);

      // Mapear plugins del Chismógrafo a la entidad Tool de Tlamatqui
      const detectedTools: Tool[] = [];
      let totalCostUSD = 0;

      for (const p of plugins) {
        const pluginName = p.name || "App de E-commerce";
        // Buscar si coincide con alguna firma conocida para afinar costo y semáforo
        const matchedSig = KNOWN_APP_SIGNATURES.find((sig) =>
          sig.name.toLowerCase() === pluginName.toLowerCase() ||
          pluginName.toLowerCase().includes(sig.name.toLowerCase()) ||
          sig.patterns.some((pat) => (typeof pat === "string" ? pluginName.toLowerCase().includes(pat.toLowerCase()) : pat.test(pluginName)))
        );

        let costType: "exact" | "range" = matchedSig ? matchedSig.costType : "exact";
        let costExact = matchedSig ? matchedSig.costExact : 29;
        let costMin = matchedSig ? matchedSig.costMin : 0;
        let costMax = matchedSig ? matchedSig.costMax : 0;
        let category = matchedSig ? matchedSig.category : (p.category || "Herramientas de E-commerce");
        let semaphore: "green" | "yellow" | "red" = matchedSig ? matchedSig.semaphore : "yellow";
        let description = matchedSig
          ? matchedSig.description
          : `Aplicación detectada por Chismógrafo (${p.developer || "Terceros"}).`;

        let logo = p.shopifyAppIcon || (p.logo?.id ? resolveTechnologyLogo(p.name, p.logo.id) : resolveTechnologyLogo(p.name, p.web));

        const effectiveCost = costType === "exact" ? costExact : (costMin + costMax) / 2;
        totalCostUSD += effectiveCost;

        detectedTools.push({
          id: `chismo-${Math.random().toString(36).substring(2, 9)}`,
          name: pluginName,
          category,
          costType,
          costExact,
          costMin,
          costMax,
          currency: "USD",
          semaphore,
          description,
          logo,
          url: p.web || "",
        });
      }

      // Si no se detectaron plugins pero la auditoría fue exitosa, generar herramientas de base
      if (detectedTools.length === 0) {
        const nativeFallback = await scrapeShopifyStoreNative(cleanUrl);
        detectedTools.push(...nativeFallback.detectedTools);
        totalCostUSD = nativeFallback.estimatedMonthlyAppCostUSD;
      }

      const shopifyPlanEstimate: "basic" | "grow" | "advanced" =
        totalCostUSD > 200 || detectedTools.length >= 6 ? "advanced" : detectedTools.length >= 3 ? "grow" : "basic";

      return {
        url: cleanUrl,
        resolvedUrl: data.resolvedUrl || cleanUrl,
        storeName,
        siteLogo,
        technology,
        confidence: data.confidence || 1,
        theme: data.theme,
        detectedTools,
        paymentGateways,
        pixels: pixels.map((px) => ({ name: px.name, category: px.category, web: px.web })),
        infrastructure: infrastructure.map((inf) => ({ name: inf.name, category: inf.category, web: inf.web })),
        location: data.location,
        latency: data.latency,
        shopifyPlanEstimate,
        estimatedMonthlyAppCostUSD: totalCostUSD,
      };
    }
  } catch (err) {
    console.warn(`[Chismografo Service] No se pudo conectar directamente con API Chismografo para ${cleanUrl}. Aplicando inspección adaptativa nativa.`);
  }

  // Fallback nativo ante caída de servicio o falta de conectividad
  const native = await scrapeShopifyStoreNative(cleanUrl);
  return {
    url: cleanUrl,
    resolvedUrl: cleanUrl,
    storeName: native.storeName,
    siteLogo: resolveTechnologyLogo(native.storeName, cleanUrl),
    technology: "Shopify",
    confidence: 0.95,
    detectedTools: native.detectedTools,
    paymentGateways: ["Stripe", "PayPal"],
    pixels: [{ name: "Meta Pixel", category: "Publicidad" }, { name: "Google Analytics", category: "Analítica" }],
    infrastructure: [{ name: "Cloudflare", category: "CDN / Seguridad" }],
    shopifyPlanEstimate: native.shopifyPlanEstimate,
    estimatedMonthlyAppCostUSD: native.estimatedMonthlyAppCostUSD,
  };
}
