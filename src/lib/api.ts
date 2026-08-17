/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Utilidad unificada de llamadas API para la arquitectura desacoplada.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

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
 * Wrapper reutilizable de fetch con manejo de JSON, tokens de Auth0 y cabeceras predeterminadas.
 */
export async function apiFetch<T = any>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { token, headers: customHeaders, ...restOptions } = options;
  const url = getApiUrl(path);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
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

