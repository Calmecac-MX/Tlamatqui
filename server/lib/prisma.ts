/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Módulo de Inicialización Segura del Cliente de Prisma ORM.
 * Verifica la existencia de DATABASE_URL o DB_URL para la persistencia en PostgreSQL.
 */

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
        const pool = new pg.Pool({ connectionString: dbUrl });
        const adapter = new PrismaPg(pool);
        prisma = new PrismaClient({ adapter });
      }
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
