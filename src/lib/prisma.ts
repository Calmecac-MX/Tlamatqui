/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Módulo de Inicialización Segura del Cliente de Prisma ORM.
 * Verifica la existencia de DB_URL o DATABASE_URL o ensambla la cadena PostgreSQL a partir de credenciales independientes.
 */

import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient | null = null;

/**
 * Verifica y ensambla dinámicamente la variable de conexión a la base de datos PostgreSQL.
 * Soporta DB_URL, DATABASE_URL o campos desglosados (DB_HOST, DB_USER, DB_PASSWORD, DB_PORT, DB_NAME, DB_SSL).
 * 
 * @returns {string | undefined} Cadena de conexión PostgreSQL o undefined si no hay credenciales configuradas.
 */
function checkAndAssembleDatabaseUrl(): string | undefined {
  // 1. Prioridad: Si DB_URL está configurada explícitamente en las variables de entorno
  if (process.env.DB_URL && process.env.DB_URL.trim() !== "") {
    const dbUrl = process.env.DB_URL.trim();
    process.env.DATABASE_URL = dbUrl;
    return dbUrl;
  }

  // 2. Si DATABASE_URL está definida directamente
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== "") {
    const dbUrl = process.env.DATABASE_URL.trim();
    process.env.DB_URL = dbUrl;
    return dbUrl;
  }

  // 3. Si se proporcionan los parámetros desglosados (DB_HOST, DB_USER, etc.)
  if (process.env.DB_HOST && process.env.DB_HOST.trim() !== "") {
    const user = process.env.DB_USER || "";
    const password = process.env.DB_PASSWORD || "";
    const host = process.env.DB_HOST;
    const port = process.env.DB_PORT || "5432";
    const name = process.env.DB_NAME || "";
    const ssl = process.env.DB_SSL === "true" ? "?sslmode=require" : "";
    
    const assembledUrl = `postgresql://${user}:${password}@${host}:${port}/${name}${ssl}`;
    process.env.DATABASE_URL = assembledUrl;
    process.env.DB_URL = assembledUrl;
    return assembledUrl;
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
  const dbUrl = checkAndAssembleDatabaseUrl();
  if (!dbUrl) {
    return null;
  }

  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: dbUrl
        }
      }
    });
  }
  return prisma;
}

/**
 * Comprueba si la persistencia remota mediante Prisma ORM está activa.
 * 
 * @returns {boolean} Verdadero si hay una base de datos PostgreSQL conectable.
 */
export function isPrismaEnabled(): boolean {
  return Boolean(checkAndAssembleDatabaseUrl());
}
