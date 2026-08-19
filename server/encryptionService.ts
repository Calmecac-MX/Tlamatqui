/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Servicio de encriptación y cifrado de datos criptográfico (AES-256-GCM / HMAC).
 * Proporciona funciones para cifrar datos sensibles en la base de datos y firmar tokens.
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const PREFIX = "$enc$gcm$";

/**
 * Obtiene la clave de encriptación de 32 bytes derivada de ENCRYPTION_KEY.
 * Si la clave no está en .env, utiliza una clave segura derivada por defecto en dev.
 */
function getDerivedKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY || "";
  
  if (envKey && envKey.length === 64 && /^[0-9a-fA-F]+$/.test(envKey)) {
    return Buffer.from(envKey, "hex");
  }

  if (envKey && envKey.trim() !== "") {
    return crypto.createHash("sha256").update(envKey).digest();
  }

  // Fallback seguro derivado del nombre del sistema para entornos local/dev sin .env
  return crypto.createHash("sha256").update("tlamatqui-default-encryption-key-fallback").digest();
}

/**
 * Comprueba si la variable ENCRYPTION_KEY está explícitamente configurada en el entorno.
 */
export function isEncryptionConfigured(): boolean {
  const envKey = process.env.ENCRYPTION_KEY;
  return Boolean(envKey && envKey.trim() !== "");
}

/**
 * Determina si una cadena dada ya está cifrada con la estructura $enc$gcm$...
 */
export function isEncrypted(data: string): boolean {
  if (typeof data !== "string") return false;
  return data.startsWith(PREFIX);
}

/**
 * Cifra un texto plano utilizando AES-256-GCM.
 * Retorna una cadena con prefijo $enc$gcm$<iv>:<authTag>:<contenidoCifrado>
 * 
 * @param {string} plainText - El texto original a cifrar.
 * @returns {string} El texto cifrado con iv y tag de autenticación incorporados.
 */
export function encryptText(plainText: string): string {
  if (!plainText || plainText.trim() === "") return plainText;
  if (isEncrypted(plainText)) return plainText; // Evitar doble cifrado

  const key = getDerivedKey();
  const iv = crypto.randomBytes(12); // 96 bits IV para GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${PREFIX}${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Descifra una cadena previamente cifrada con encryptText.
 * Si el texto no está cifrado, lo retorna de forma transparente (compatibilidad hacia atrás).
 * 
 * @param {string} encryptedData - La cadena cifrada.
 * @returns {string} El texto plano descifrado.
 */
export function decryptText(encryptedData: string): string {
  if (!encryptedData || typeof encryptedData !== "string") return encryptedData;
  if (!isEncrypted(encryptedData)) return encryptedData;

  try {
    const raw = encryptedData.slice(PREFIX.length);
    const parts = raw.split(":");
    if (parts.length !== 3) return encryptedData;

    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = getDerivedKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error: any) {
    console.error("\x1b[31m[Encryption Error]\x1b[0m Error al descifrar datos:", error.message);
    return encryptedData;
  }
}

/**
 * Genera una firma HMAC-SHA256 utilizando la ENCRYPTION_KEY.
 * Útil para la generación y verificación de tokens seguros de invitación.
 * 
 * @param {string} payload - El contenido a firmar.
 * @returns {string} Firma hexadecimal HMAC-SHA256.
 */
export function createHmacSignature(payload: string): string {
  const key = getDerivedKey();
  return crypto.createHmac("sha256", key).update(payload).digest("hex");
}

/**
 * Verifica si una firma HMAC-SHA256 coincide con el payload proporcionado.
 * 
 * @param {string} payload - El contenido a verificar.
 * @param {string} signature - La firma a comprobar.
 * @returns {boolean} True si la firma es válida.
 */
export function verifyHmacSignature(payload: string, signature: string): boolean {
  if (!payload || !signature) return false;
  const expectedSignature = createHmacSignature(payload);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}
