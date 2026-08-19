/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Utilidad unificada de llamadas API para la arquitectura desacoplada.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "";
const API_SECRET_TOKEN = import.meta.env.VITE_API_SECRET_TOKEN || "";

/**
 * Obtiene las cabeceras predeterminadas de seguridad para las peticiones HTTP al Backend.
 */
export function getApiHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json",
  };

  if (API_SECRET_TOKEN && API_SECRET_TOKEN.trim() !== "") {
    headers["x-api-secret"] = API_SECRET_TOKEN;
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Interceptor global de window.fetch para inyectar automáticamente x-api-secret en todas las peticiones a /api.
 */
if (typeof window !== "undefined" && window.fetch && API_SECRET_TOKEN) {
  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const urlString = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

    // Solo adjuntar la cabecera si la petición va dirigida al Backend REST API (/api o VITE_API_URL)
    const isBackendRequest =
      urlString.startsWith("/api") ||
      urlString.includes("/api/") ||
      (API_BASE_URL && urlString.startsWith(API_BASE_URL));

    if (isBackendRequest) {
      init = init || {};
      const headers = new Headers(init.headers || {});
      if (!headers.has("x-api-secret")) {
        headers.set("x-api-secret", API_SECRET_TOKEN);
      }
      init.headers = headers;
    }

    return originalFetch.call(this, input, init);
  };
}

/**
 * Obtiene la URL completa del endpoint de la API REST.
 * Si VITE_API_URL está definida en el cliente, se utiliza como prefijo absoluto.
 * De lo contrario, se utiliza la ruta relativa '/api' que es canalizada mediante el Proxy de Vite.
 */
export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (API_BASE_URL && API_BASE_URL.trim() !== "") {
    const cleanBase = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    return `${cleanBase}${cleanPath}`;
  }
  return cleanPath;
}

export interface ApiFetchOptions extends RequestInit {
  token?: string;
}

/**
 * Wrapper reutilizable de fetch con manejo de JSON, tokens de Auth0, token secreto y cabeceras predeterminadas.
 */
export async function apiFetch<T = any>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { token, headers: customHeaders, ...restOptions } = options;
  const url = getApiUrl(path);

  const headers: Record<string, string> = {
    ...getApiHeaders(token),
    ...(customHeaders as Record<string, string> || {}),
  };

  const response = await fetch(url, { ...restOptions, headers });

  if (!response.ok) {
    let errorMessage = `Error HTTP ${response.status}`;
    try {
      const errData = await response.json();
      if (errData && errData.error) {
        errorMessage = errData.error;
      }
    } catch (_) {}
    throw new Error(errorMessage);
  }

  return response.json();
}


