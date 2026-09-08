/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Servicio de Gestión y Validación de Cookies de Sesión Seguras (Session Cookie Security).
 * Implementa tokens de sesión firmados criptográficamente con HMAC-SHA256,
 * atributos HttpOnly, SameSite=Lax, Secure y validación estricta de caducidad.
 */

import crypto from "crypto";
import { createHmacSignature, verifyHmacSignature, encryptText, decryptText, isEncrypted } from "./encryptionService.js";

export interface SessionUser {
  id?: string;
  email: string;
  name?: string;
  role: "Superusuario" | "Administrador" | "Agente" | "Visor";
  sub?: string;
  avatar?: string;
  createdAt: number;
  exp: number; // Unix timestamp en milisegundos
}

export const SESSION_COOKIE_NAME = "tlamatqui_session";
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

/**
 * Parsea el encabezado 'Cookie' de la petición HTTP en un objeto clave-valor.
 */
export function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader || typeof cookieHeader !== "string") {
    return {};
  }

  const cookies: Record<string, string> = {};
  const pairs = cookieHeader.split(";");

  for (const pair of pairs) {
    const idx = pair.indexOf("=");
    if (idx < 0) continue;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    try {
      cookies[key] = decodeURIComponent(val);
    } catch {
      cookies[key] = val;
    }
  }

  return cookies;
}

/**
 * Genera un token de sesión seguro, cifrado y firmado con HMAC-SHA256.
 * 
 * @param user Datos esenciales del usuario autenticado.
 * @returns Token de sesión codificado en base64url.
 */
export function createSessionToken(user: Omit<SessionUser, "createdAt" | "exp"> & { maxAgeMs?: number }): string {
  const now = Date.now();
  const maxAge = user.maxAgeMs || SESSION_MAX_AGE_MS;
  const sessionPayload: SessionUser = {
    id: user.id || user.sub,
    email: user.email.toLowerCase().trim(),
    name: user.name || user.email.split("@")[0],
    role: user.role || "Administrador",
    sub: user.sub,
    avatar: user.avatar,
    createdAt: now,
    exp: now + maxAge,
  };

  const jsonString = JSON.stringify(sessionPayload);
  const encryptedPayload = encryptText(jsonString);
  const signature = createHmacSignature(encryptedPayload);

  // Formato: payloadCifrado.firmaHMAC
  const tokenString = `${encryptedPayload}.${signature}`;
  return Buffer.from(tokenString, "utf-8").toString("base64url");
}

/**
 * Valida y descifra un token de sesión de cookie.
 * 
 * @param token Token extraído de la cookie de sesión.
 * @returns Resultado de validación con el usuario deserializado si es válido.
 */
export function validateSessionToken(token: string): { valid: boolean; user?: SessionUser; error?: string } {
  if (!token || typeof token !== "string" || token.trim() === "") {
    return { valid: false, error: "Token de sesión vacío o no proporcionado" };
  }

  try {
    const raw = Buffer.from(token, "base64url").toString("utf-8");
    const lastDotIndex = raw.lastIndexOf(".");
    if (lastDotIndex === -1) {
      return { valid: false, error: "Estructura de token de sesión inválida" };
    }

    const encryptedPayload = raw.slice(0, lastDotIndex);
    const signature = raw.slice(lastDotIndex + 1);

    // 1. Validar integridad de la firma HMAC
    const isSignatureValid = verifyHmacSignature(encryptedPayload, signature);
    if (!isSignatureValid) {
      return { valid: false, error: "Firma criptográfica de sesión inválida o alterada" };
    }

    // 2. Descifrar el payload
    const decryptedJson = decryptText(encryptedPayload);
    const sessionUser: SessionUser = JSON.parse(decryptedJson);

    // 3. Validar caducidad temporal
    if (!sessionUser.exp || Date.now() > sessionUser.exp) {
      return { valid: false, error: "La cookie de sesión ha expirado" };
    }

    // 4. Validar integridad de campos obligatorios
    if (!sessionUser.email || !sessionUser.role) {
      return { valid: false, error: "Datos de usuario corruptos en la sesión" };
    }

    return { valid: true, user: sessionUser };
  } catch (err: any) {
    return { valid: false, error: `Error al procesar cookie de sesión: ${err.message}` };
  }
}

/**
 * Genera la directiva de cabecera 'Set-Cookie' segura con todos los flags de protección.
 */
export function buildSessionCookieHeader(token: string, maxAgeMs: number = SESSION_MAX_AGE_MS): string {
  const isProduction = process.env.NODE_ENV === "production";
  const maxAgeSeconds = Math.floor(maxAgeMs / 1000);
  const expiresDate = new Date(Date.now() + maxAgeMs).toUTCString();

  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    `Path=/`,
    `Max-Age=${maxAgeSeconds}`,
    `Expires=${expiresDate}`,
    `HttpOnly`,
    `SameSite=Lax`,
  ];

  if (isProduction) {
    parts.push(`Secure`);
  }

  return parts.join("; ");
}

/**
 * Genera la directiva de cabecera 'Set-Cookie' para invalidar/eliminar la sesión al hacer logout.
 */
export function buildClearSessionCookieHeader(): string {
  const isProduction = process.env.NODE_ENV === "production";
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    `Path=/`,
    `Max-Age=0`,
    `Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    `HttpOnly`,
    `SameSite=Lax`,
  ];

  if (isProduction) {
    parts.push(`Secure`);
  }

  return parts.join("; ");
}
