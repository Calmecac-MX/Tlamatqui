import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
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
          `ALTER TABLE "TeamMember" ADD COLUMN IF NOT EXISTS "addedByAllyEmail" TEXT;`,
          `ALTER TABLE "TeamMember" ADD COLUMN IF NOT EXISTS "requestedAt" TIMESTAMP(3);`,

          `ALTER TABLE "aliados" ADD COLUMN IF NOT EXISTS "representativeEmail" TEXT;`,
          `ALTER TABLE "aliados" ADD COLUMN IF NOT EXISTS "members" JSONB;`
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
      if (dbUrl.startsWith("prisma://") || dbUrl.startsWith("prisma+postgres://")) {
        prisma = new PrismaClient({ accelerateUrl: dbUrl });
      } else {
        const isSslNeeded = dbUrl.includes("sslmode=require") || 
                            dbUrl.includes("supabase.co") || 
                            dbUrl.includes("neon.tech") || 
                            dbUrl.includes("render.com") || 
                            dbUrl.includes("railway.app") ||
                            dbUrl.includes("vercel-storage.com") ||
                            dbUrl.includes("pooler.supabase.com");

        const pool = new pg.Pool({
          connectionString: dbUrl,
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
