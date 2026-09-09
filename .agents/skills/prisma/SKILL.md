---
name: prisma
description: Use when managing Prisma ORM 8 schemas, generating Prisma client, executing Prisma database migrations, managing datasources, and validating database state in Tlamatqui.
---

# Prisma ORM Management Skill for Antigravity

This skill provides standard operating procedures for managing Prisma ORM 8 schemas, client generation, database schema deployment, and migration workflows within the Tlamatqui fullstack repository.

---

## 1. 📐 Architecture & Key Files

- **Prisma Schema:** `prisma/schema.prisma`
- **Prisma Config:** `prisma.config.ts`
- **Prisma Migrations:** `prisma/migrations/`
- **Prisma Singleton / Client:** `server/lib/prisma.ts`
- **Client Output:** `node_modules/@prisma/client`

---

## 2. 🚀 Core Workflows & Procedures

### A. Validating Schema Syntax
Always validate the schema after making structural changes to `prisma/schema.prisma`:
```bash
npx prisma validate
```

### B. Cliente y Adaptadores de Prisma ORM 8
En Prisma ORM 8 (`@prisma/client` + `@prisma/adapter-pg`), la arquitectura utiliza adaptadores dinámicos de conexión (`pg.Pool` / `PrismaPg` en [`server/lib/prisma.ts`](file:///Users/cesarayar/Documents/tlamatqui/server/lib/prisma.ts)) y configuración declarativa en [`prisma.config.ts`](file:///Users/cesarayar/Documents/tlamatqui/prisma.config.ts). El comando legacy `prisma generate` no forma parte de la CLI de Prisma 8.

### C. Despliegue Directo de Esquema DDL (`db:push`)
Para sincronizar el estado del esquema con la base de datos PostgreSQL de forma segura y directa:
```bash
npm run db:push
```
O para pasar una URL explícita:
```bash
npx tsx scripts/push-schema.ts --url="<DATABASE_URL>"
```

### D. Creating & Applying Migrations (Versioned SQL Migrations)
Create a new versioned migration SQL file and apply it:
```bash
npx prisma migrate dev --name <migration_name>
```

### E. Deploying Migrations to Staging / Production
Apply pending versioned migrations in CI/CD or production environments:
```bash
npx prisma migrate deploy
```

### F. Checking Migration Status
Inspect applied vs. pending migrations:
```bash
npx prisma migrate status
```

---

## 3. 🛡️ Connection & Database Environment Directives

1. **Prisma Accelerate & Direct URLs:**
   - `DATABASE_URL` carries the primary database connection string (e.g., `prisma+postgres://...` for Accelerate proxy or `postgresql://...` for direct Postgres connection).
   - For DDL operations (`migrate dev`, `migrate deploy`, `db push`), direct connection credentials or database write access are required.
2. **Type Safety & Build Verification:**
   - After updating models, always run `npm run lint` (`tsc --noEmit`) and `npm run build:backend` to confirm full TypeScript compatibility.
3. **Auto-Versioning & Brain Update:**
   - Run `npm run auto-version` to update backend versions if schema/backend code changed.
