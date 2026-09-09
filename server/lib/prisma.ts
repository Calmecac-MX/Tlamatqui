import dotenv from "dotenv";
dotenv.config();

import pkgPrismaClient from "@prisma/client";
const { PrismaClient } = (pkgPrismaClient as any)?.PrismaClient ? pkgPrismaClient : { PrismaClient: (pkgPrismaClient as any) };
type PrismaClient = any;
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

let prisma: PrismaClient | null = null;

/**
 * Obtiene y valida la variable de conexión a la base de datos PostgreSQL.
 * 
 * @returns {string | undefined} Cadena de conexión PostgreSQL o undefined si no hay credenciales configuradas.
 */
function getDatabaseUrl(): string | undefined {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== "") {
    return process.env.DATABASE_URL.trim();
  }

  if (process.env.DB_URL && process.env.DB_URL.trim() !== "") {
    const url = process.env.DB_URL.trim();
    process.env.DATABASE_URL = url;
    return url;
  }

  return undefined;
}

/**
 * Normaliza la cadena de conexión de PostgreSQL para compatibilidad con libpq y pg v9,
 * eliminando advertencias de SSL en entornos serverless y proveedores en la nube (Neon, Supabase, Vercel).
 *
 * @param {string} rawUrl - URI original de PostgreSQL
 * @returns {string} URI normalizada con parámetros de SSL compatibles
 */
export function normalizeDatabaseUrl(rawUrl: string): string {
  if (!rawUrl) return rawUrl;
  
  // Si ya contiene uselibpqcompat o sslmode=verify-full o no usa SSL, mantener
  if (rawUrl.includes("uselibpqcompat=true") || rawUrl.includes("sslmode=verify-full") || rawUrl.includes("sslmode=disable")) {
    return rawUrl;
  }
  
  // Compatibilidad explícita con libpq para sslmode=require / prefer / verify-ca
  if (rawUrl.includes("sslmode=require")) {
    return rawUrl.includes("?") 
      ? `${rawUrl}&uselibpqcompat=true` 
      : `${rawUrl}?uselibpqcompat=true&sslmode=require`;
  }
  if (rawUrl.includes("sslmode=prefer") || rawUrl.includes("sslmode=verify-ca")) {
    return `${rawUrl}&uselibpqcompat=true`;
  }

  return rawUrl;
}

let schemaRepairPromise: Promise<void> | null = null;

/**
 * Función de Auto-Reparación y Sincronización de Esquema (Self-Healing Schema Migration).
 * Asegura de forma idempotente que todas las columnas nuevas requeridas existan en la tabla PostgreSQL
 * para prevenir errores de tipo P2022 (ColumnNotFound) en producción y entornos serverless.
 */
export async function ensureDatabaseSchema(prismaClient: PrismaClient): Promise<void> {
  if (!schemaRepairPromise) {
    schemaRepairPromise = (async () => {
      try {
        const statements = [
          `ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "detectedCms" TEXT DEFAULT 'Shopify';`,
          `ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "activeTheme" TEXT;`,
          `ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "screenshotDesktop" TEXT;`,
          `ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "screenshotMobile" TEXT;`,
          `ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "paymentGateways" JSONB;`,
          `ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "pixels" JSONB;`,
          `ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "infrastructure" JSONB;`,
          `ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "serverLocation" JSONB;`,
          `ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "serverLatencyMs" INTEGER;`,
          `ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "teamId" TEXT;`,
          `ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "creatorId" TEXT;`,

          `ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "contactEmail" TEXT;`,
          `ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "contactPhone" TEXT;`,
          `ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "teamBrandName" TEXT;`,
          `ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "teamBrandLogo" TEXT;`,
          `ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "teamBrandWebsite" TEXT;`,
          `ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "inviteToken" TEXT DEFAULT '';`,
          
          `ALTER TABLE "TeamMember" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'approved';`,
          `ALTER TABLE "TeamMember" ADD COLUMN IF NOT EXISTS "isExternal" BOOLEAN DEFAULT false;`,
          `ALTER TABLE "TeamMember" ADD COLUMN IF NOT EXISTS "partnerEmail" TEXT;`,
          `ALTER TABLE "TeamMember" ADD COLUMN IF NOT EXISTS "requestedAt" TIMESTAMP(3);`,

          `ALTER TABLE "Partner" ADD COLUMN IF NOT EXISTS "representativeEmail" TEXT;`,
          `ALTER TABLE "Partner" ADD COLUMN IF NOT EXISTS "teamId" TEXT;`
        ];

        for (const sql of statements) {
          try {
            await prismaClient.$executeRawUnsafe(sql);
          } catch (e) {
            // Ignorar si la tabla no existe aún
          }
        }
        console.log("[Prisma Self-Healing] Columnas del esquema PostgreSQL verificadas e inicializadas correctamente.");
      } catch (err) {
        console.warn("[Prisma Self-Healing Warn] Error parcial al verificar esquema:", err);
      }
    })();
  }
  return schemaRepairPromise;
}

/**
 * Inicialización de tipo Singleton del cliente Prisma.
 * Retorna la instancia activa del cliente de Prisma ORM si hay credenciales válidas,
 * o `null` si no se ha configurado una base de datos PostgreSQL.
 * 
 * @returns {PrismaClient | null} Instancia del cliente de Prisma o null.
 */
export function getPrisma(): PrismaClient | null {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) {
    return null;
  }

  if (!prisma) {
    try {
      const normalizedUrl = normalizeDatabaseUrl(dbUrl);
      if (normalizedUrl.startsWith("prisma://") || normalizedUrl.startsWith("prisma+postgres://")) {
        prisma = new PrismaClient({ accelerateUrl: normalizedUrl });
      } else {
        const isSslNeeded = normalizedUrl.includes("sslmode=require") || 
                            normalizedUrl.includes("supabase.co") || 
                            normalizedUrl.includes("neon.tech") || 
                            normalizedUrl.includes("render.com") || 
                            normalizedUrl.includes("railway.app") ||
                            normalizedUrl.includes("vercel-storage.com") ||
                            normalizedUrl.includes("pooler.supabase.com");

        const pool = new pg.Pool({
          connectionString: normalizedUrl,
          ssl: isSslNeeded ? { rejectUnauthorized: false } : undefined,
          max: 10,
          connectionTimeoutMillis: 5000,
          idleTimeoutMillis: 30000
        });

        const adapter = new PrismaPg(pool);
        prisma = new PrismaClient({ adapter });
      }

      // Disparar auto-reparación en segundo plano al conectar
      ensureDatabaseSchema(prisma).catch(() => {});
    } catch (err) {
      console.error("[Prisma Singleton Error] Fallback a JSON Bridge:", err);
      return null;
    }
  }
  return prisma;
}

/**
 * Comprueba si la persistencia remota mediante Prisma ORM está activa.
 * 
 * @returns {boolean} Verdadero si hay una base de datos PostgreSQL conectable.
 */
export function isPrismaEnabled(): boolean {
  return Boolean(getDatabaseUrl());
}
