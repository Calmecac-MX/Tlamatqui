/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Favicon Service - Gestión reactiva del favicon según el modo del navegador (Oscuro / Claro)
 * y personalización de marca blanca.
 */

export const FAVICON_DARK_MODE = "/favicon/blanco.ico";
export const FAVICON_LIGHT_MODE = "/favicon/negro.ico";

/**
 * Actualiza la etiqueta <link rel="icon"> en el documento HTML.
 */
export function setDocumentFavicon(url: string): void {
  if (typeof document === "undefined") return;

  const links = document.querySelectorAll<HTMLLinkElement>("link[rel~='icon']");
  if (links.length > 0) {
    links.forEach(link => {
      link.href = url;
    });
  } else {
    const newLink = document.createElement("link");
    newLink.rel = "icon";
    newLink.type = "image/x-icon";
    newLink.href = url;
    document.head.appendChild(newLink);
  }
}

/**
 * Configura el escuchador dinámico para alternar automáticamente entre:
 * - blanco.ico cuando el navegador/sistema esté en modo oscuro (prefers-color-scheme: dark)
 * - negro.ico cuando el navegador/sistema esté en modo claro (prefers-color-scheme: light)
 * 
 * @param customFaviconUrl URL opcional de favicon personalizado (marca blanca)
 * @returns Función de limpieza para desmontar el escuchador
 */
export function setupDynamicFavicon(customFaviconUrl?: string): () => void {
  if (typeof window === "undefined") return () => {};

  const updateFavicon = () => {
    // Si el usuario configuró un favicon personalizado explícito de marca blanca, respetarlo
    if (
      customFaviconUrl &&
      !customFaviconUrl.includes("favicon.ico") &&
      !customFaviconUrl.includes("blanco.ico") &&
      !customFaviconUrl.includes("negro.ico")
    ) {
      setDocumentFavicon(customFaviconUrl);
      return;
    }

    const isBrowserDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const targetFavicon = isBrowserDark ? FAVICON_DARK_MODE : FAVICON_LIGHT_MODE;
    setDocumentFavicon(targetFavicon);
  };

  // Aplicar inmediatamente
  updateFavicon();

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = () => updateFavicon();

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", handleChange);
  } else if ((mediaQuery as any).addListener) {
    (mediaQuery as any).addListener(handleChange);
  }

  return () => {
    if (mediaQuery.removeEventListener) {
      mediaQuery.removeEventListener("change", handleChange);
    } else if ((mediaQuery as any).removeListener) {
      (mediaQuery as any).removeListener(handleChange);
    }
  };
}
