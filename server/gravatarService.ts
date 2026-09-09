/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Gravatar Service - Integración y resolución de fotos de perfil mediante Gravatar.
 * Soporta hashing SHA-256 / MD5, detección de existencia de avatar con fallback inteligente
 * y caché de consultas para optimizar latencia.
 */

import crypto from "crypto";

const DEFAULT_AVATAR_PLACEHOLDER = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";

// Caché en memoria para evitar peticiones redundantes a Gravatar (TTL: 15 minutos)
const gravatarCache = new Map<string, { exists: boolean; gravatarUrl: string; timestamp: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000;

/**
 * Normaliza y genera el hash SHA-256 estándar requerido por Gravatar.
 * 
 * @param email Dirección de correo electrónico
 * @returns Hash SHA-256 en formato hexadecimal
 */
export function computeGravatarHash(email: string): string {
  const cleanEmail = (email || "").trim().toLowerCase();
  return crypto.createHash("sha256").update(cleanEmail).digest("hex");
}

/**
 * Construye la URL de Gravatar para un correo electrónico dado.
 * 
 * @param email Dirección de correo electrónico
 * @param options Opciones de tamaño, fallback y clasificación
 * @returns URL completa de Gravatar
 */
export function getGravatarUrl(
  email: string,
  options: {
    size?: number;
    defaultImage?: string;
    rating?: "g" | "pg" | "r" | "x";
  } = {}
): string {
  const hash = computeGravatarHash(email);
  const size = options.size || 200;
  const rating = options.rating || "g";
  const defaultParam = options.defaultImage 
    ? encodeURIComponent(options.defaultImage)
    : "mp"; // "mp" = Mystery Person

  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultParam}&r=${rating}`;
}

/**
 * Comprueba si un correo electrónico tiene una foto de perfil personalizada en Gravatar.
 * Utiliza una petición HTTP HEAD a la URL con 'd=404'. Si retorna 200, la foto existe.
 * 
 * @param email Dirección de correo electrónico a verificar
 * @returns Objeto con estado booleano de existencia y la URL directa
 */
export async function checkGravatarExists(email: string): Promise<{
  exists: boolean;
  gravatarUrl: string;
  email: string;
}> {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return {
      exists: false,
      gravatarUrl: DEFAULT_AVATAR_PLACEHOLDER,
      email: cleanEmail
    };
  }

  // Verificar caché
  const cached = gravatarCache.get(cleanEmail);
  const now = Date.now();
  if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
    return {
      exists: cached.exists,
      gravatarUrl: cached.gravatarUrl,
      email: cleanEmail
    };
  }

  const hash = computeGravatarHash(cleanEmail);
  const checkUrl = `https://www.gravatar.com/avatar/${hash}?d=404&s=200`;
  const directGravatarUrl = `https://www.gravatar.com/avatar/${hash}?s=200&d=mp`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(checkUrl, {
      method: "HEAD",
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const exists = response.ok && response.status === 200;
    const result = {
      exists,
      gravatarUrl: exists ? directGravatarUrl : DEFAULT_AVATAR_PLACEHOLDER,
      timestamp: now
    };

    gravatarCache.set(cleanEmail, result);

    return {
      exists: result.exists,
      gravatarUrl: exists ? directGravatarUrl : DEFAULT_AVATAR_PLACEHOLDER,
      email: cleanEmail
    };
  } catch (err) {
    // Si hay error de red o timeout, retornar URL de gravatar con fallback genérico
    return {
      exists: false,
      gravatarUrl: directGravatarUrl,
      email: cleanEmail
    };
  }
}

/**
 * Resuelve el avatar final de un usuario:
 * 1. Si el usuario ya tiene un avatar personalizado (ej. subido o custom), lo conserva.
 * 2. Si tiene el avatar por defecto o no tiene ninguno, consulta Gravatar.
 * 3. Si existe en Gravatar, retorna la URL de Gravatar.
 * 4. Si no, retorna un avatar estilizado con sus iniciales o el placeholder.
 * 
 * @param email Correo del usuario
 * @param currentAvatar Avatar actual registrado
 * @param name Nombre opcional para fallback
 */
export async function resolveUserAvatar(
  email: string,
  currentAvatar?: string,
  name?: string
): Promise<string> {
  const isDefaultOrPlaceholder = !currentAvatar || 
    currentAvatar.includes("photo-1535713875002-d1d0cf377fde") ||
    currentAvatar.includes("images.unsplash.com");

  // Si ya tiene un avatar explícito propio (Base64 o S3 o URL personalizada no por defecto), respetarlo
  if (currentAvatar && !isDefaultOrPlaceholder) {
    return currentAvatar;
  }

  if (email) {
    const gravatarResult = await checkGravatarExists(email);
    if (gravatarResult.exists) {
      return gravatarResult.gravatarUrl;
    }
  }

  // Fallback con avatar tipográfico de alta resolución con paleta Tlamatqui
  if (name) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0F172A&color=00FF66&bold=true&size=150`;
  }

  return currentAvatar || DEFAULT_AVATAR_PLACEHOLDER;
}
