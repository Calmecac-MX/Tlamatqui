# ==========================================
# STAGE 1: Install Dependencies
# ==========================================
FROM node:24-alpine AS deps
WORKDIR /app

# Instalar dependencias del sistema necesarias para Prisma y paquetes nativos
RUN apk add --no-cache libc6-compat python3 make g++

COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci

# ==========================================
# STAGE 2: Build Project
# ==========================================
FROM node:24-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generar cliente de Prisma ORM para Alpine Linux
RUN npx prisma generate

# Compilar Frontend SPA (vite) y Backend (esbuild)
RUN npm run build

# ==========================================
# STAGE 3: Production Runner
# ==========================================
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV SERVE_STATIC=true

# Crear usuario y grupo del sistema no privilegiado por seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressjs

# Copiar configuración, dependencias y artefactos compilados
COPY package.json package-lock.json ./
COPY prisma ./prisma/
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data ./data

# Asegurar permisos en directorio de almacenamiento local JSON
RUN mkdir -p /app/data && chown -R expressjs:nodejs /app/data /app/dist /app/prisma

USER expressjs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1

CMD ["npm", "start"]
