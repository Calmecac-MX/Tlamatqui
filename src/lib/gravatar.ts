/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Gravatar Client Utility - Generación y resolución en tiempo real de fotos de perfil vía Gravatar.
 */

export const DEFAULT_AVATAR_PLACEHOLDER = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";

/**
 * Genera el hash SHA-256 de un texto usando crypto.subtle en el navegador
 * con fallback síncrono.
 */
export async function sha256Hex(message: string): Promise<string> {
  const clean = (message || "").trim().toLowerCase();
  
  if (typeof crypto !== "undefined" && crypto.subtle) {
    try {
      const msgUint8 = new TextEncoder().encode(clean);
      const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    } catch (e) {
      // Continuar al fallback
    }
  }

  // Fallback simple para entornos sin crypto.subtle
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    const char = clean.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(32, "0");
  return hex.repeat(2).slice(0, 64);
}

/**
 * Obtiene la URL de Gravatar de forma síncrona/inmediata si ya se tiene el hash,
 * o calcula la URL basada en SHA-256.
 */
export async function getGravatarUrlAsync(
  email: string,
  options: {
    size?: number;
    defaultImage?: string;
    rating?: "g" | "pg" | "r" | "x";
  } = {}
): Promise<string> {
  const hash = await sha256Hex(email);
  const size = options.size || 200;
  const rating = options.rating || "g";
  const defaultParam = options.defaultImage 
    ? encodeURIComponent(options.defaultImage)
    : "mp";

  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultParam}&r=${rating}`;
}

/**
 * Consulta el endpoint del backend para comprobar si un email tiene foto registrada en Gravatar.
 */
export async function lookupGravatar(email: string): Promise<{
  hasGravatar: boolean;
  gravatarUrl: string;
}> {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { hasGravatar: false, gravatarUrl: DEFAULT_AVATAR_PLACEHOLDER };
  }

  try {
    const res = await fetch(`/api/gravatar/lookup?email=${encodeURIComponent(cleanEmail)}`);
    if (res.ok) {
      const data = await res.json();
      return {
        hasGravatar: Boolean(data.hasGravatar),
        gravatarUrl: data.gravatarUrl || DEFAULT_AVATAR_PLACEHOLDER
      };
    }
  } catch (err) {
    console.warn("[Gravatar Lookup] Error al consultar Gravatar:", err);
  }

  // Fallback cliente directo
  const directUrl = await getGravatarUrlAsync(cleanEmail, { defaultImage: "mp" });
  return {
    hasGravatar: true,
    gravatarUrl: directUrl
  };
}

/**
 * Genera un avatar estilizado con las iniciales del usuario usando la paleta oficial de Tlamatqui.
 */
export function getInitialsAvatarUrl(name?: string, email?: string): string {
  const displayName = name || (email ? email.split("@")[0] : "Usuario");
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0F172A&color=00FF66&bold=true&size=150`;
}

/**
 * Determina si una URL de avatar es la plantilla por defecto no personalizada.
 */
export function isDefaultPlaceholderAvatar(avatarUrl?: string): boolean {
  if (!avatarUrl) return true;
  return (
    avatarUrl.includes("photo-1535713875002-d1d0cf377fde") ||
    avatarUrl.includes("images.unsplash.com/photo-1535713875002")
  );
}
