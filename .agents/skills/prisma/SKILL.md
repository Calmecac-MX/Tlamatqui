---
name: prisma
description: Use when managing Prisma ORM 7 schemas, generating Prisma client, executing Prisma database migrations (db push, migrate dev, migrate deploy), managing datasources, and validating database state in Tlamatqui.
---

# Prisma ORM Management Skill for Antigravity

This skill provides standard operating procedures for managing Prisma ORM 7 schemas, client generation, database schema deployment, and migration workflows within the Tlamatqui fullstack repository.

---

## 1. 📐 Architecture & Key Files

- **Prisma Schema:** `prisma/schema.prisma`
- **Prisma 7 Config:** `prisma.config.ts`
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

### B. Generating Prisma Client
Generate or update the Prisma Client whenever `prisma/schema.prisma` is modified:
```bash
npx prisma generate
```

### C. Direct Schema Deployment (Development / Prototype Sync)
Push schema state directly to the database without generating migration SQL files (useful for direct sync):
```bash
npx prisma db push
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
