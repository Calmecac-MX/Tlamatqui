# Tlamatqui 🛡️

> **Suite de Diagnóstico Financiero de E-Commerce & Auditoría Ejecutiva**  
> Evalúa métricas operativas de tiendas online (Shopify vs. Tiendanube), simula ahorros en comisiones y pasarelas de pago en tiempo real y ofrece analítica estratégica con generación de reportes ejecutivos.

[![Versión Frontend](https://img.shields.io/badge/Frontend-v2.5.31-blue.svg)](src/version.ts)
[![Versión Backend](https://img.shields.io/badge/Backend-v2.5.22-green.svg)](server/version.ts)
[![Node.js](https://img.shields.io/badge/Node.js-v24.0.0-brightgreen.svg)](package.json)
[![React](https://img.shields.io/badge/React-v19.0-61dafb.svg)](src/App.tsx)
[![Express](https://img.shields.io/badge/Express-v4.21-000000.svg)](server.ts)
[![Prisma](https://img.shields.io/badge/Prisma-v7.9.1-2D3748.svg)](prisma/schema.prisma)
[![Licencia](https://img.shields.io/badge/Licencia-AGPL--3.0-orange.svg)](LICENSE)

---

## 🏗️ Arquitectura Unificada Fullstack (Client / Server Single App)

El repositorio está estructurado bajo una **Arquitectura Unificada Fullstack** en una sola raíz desacoplada:

- 🎨 **Cliente Frontend (SPA React 19 + Vite 6):**
  - **Ubicación:** Directorios [`src/`](src/), [`index.html`](index.html), [`vite.config.ts`](vite.config.ts).
  - **Puerto Dev:** `http://localhost:3000`.
  - **Tecnologías:** React 19, Vite 6, Tailwind CSS v4, Zustand 5, Recharts 3, Auth0 (`@auth0/auth0-react`), Auth0 Lock, Lucide React, GSAP / Motion.

- ⚙️ **Servidor Backend (API REST Express + Prisma ORM 7):**
  - **Ubicación:** Archivo [`server.ts`](server.ts), directorios [`server/`](server/), [`prisma/`](prisma/), [`data/`](data/).
  - **Puerto Dev:** `http://localhost:4000` (API REST en `/api/*`).
  - **Tecnologías:** Express 4, TypeScript 5.8, Prisma ORM 7 (`@prisma/config`), Auth0 JWT, Nodemailer, Zod, esbuild.

---

## 🚀 Inicio Rápido en Desarrollo

### 1. Requisitos Previos
- **Node.js:** `24.x` (`>=24.0.0`)
- **npm:** `>=9.0.0`

### 2. Instalación de Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
Copia la plantilla de entorno y configura las credenciales correspondientes:
```bash
cp .env.example .env
```

### 4. Iniciar Entorno de Desarrollo Simultáneo
```bash
npm run dev
```
Este comando arranca en paralelo el servidor **Backend API** (`http://localhost:4000`) y el cliente **Frontend SPA** (`http://localhost:3000`) mediante `concurrently`.

---

## 🛠️ Comandos Principales de NPM

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Ejecuta **Backend** (puerto 4000) y **Frontend** (puerto 3000) en paralelo. |
| `npm run dev:backend` | Inicia únicamente la API REST Backend (`server.ts`) en `http://localhost:4000`. |
| `npm run dev:frontend` | Inicia únicamente el cliente SPA Frontend (`vite`) en `http://localhost:3000`. |
| `npm run build` | Compila el cliente Frontend (`dist/`) y empaqueta la API Backend (`dist/server.cjs`). |
| `npm run build:backend` | Compila únicamente el backend a `dist/server.cjs` utilizando `esbuild`. |
| `npm run build:frontend` | Compila únicamente la SPA cliente utilizando `vite build`. |
| `npm run lint` | Comprobación estricta de tipos de TypeScript sin emitir código (`tsc --noEmit`). |
| `npm run start` | Ejecuta el servidor compilado de producción (`node dist/server.cjs`). |
| `npm run cli` | Ejecuta la CLI del sistema (`tsx cli.ts`) para tareas administrativas (`list`, `seed`, etc.). |
| `npm run auto-version` | Analiza los hashes de código e incrementa las versiones del Frontend y Backend de forma independiente. |
| `npm run bump:frontend` | Incrementa manualmente la versión PATCH del Frontend. |
| `npm run bump:backend` | Incrementa manualmente la versión PATCH del Backend. |
| `npm run bump:both` | Incrementa manualmente las versiones PATCH de ambas capas. |
| `npm run changelog` | Actualiza [`CHANGELOG.md`](CHANGELOG.md) y genera los extractos en `changelog/`. |

---

## 📁 Estructura del Repositorio

```text
tlamatqui/
├── .agents/                 # Reglas, directivas y 21 skills del sistema para IA
│   ├── rules/               # Reglas de arquitectura, calidad, commits y skills
│   └── skills/              # Matriz de skills especializadas (surgical-patch, lean-build, etc.)
├── .github/
│   └── workflows/
│       └── ci-cd.yml        # Workflow de CI/CD automatizado (Node 24, Lint, Build & Release Please)
├── api/                     # Punto de entrada Serverless para Vercel Functions (api/index.ts)
├── cli.ts                   # Herramienta CLI de administración de datos y reportes
├── data/                    # Almacenamiento local JSON con fallback híbrido para persistencia
│   ├── config.json
│   ├── logo_config.json
│   ├── partners.json
│   ├── reports.json
│   └── teams.json
├── openapi.json             # Especificación OpenAPI 3.0 de la API REST
├── prisma/                  # Esquema y migraciones de Prisma ORM 7
│   └── schema.prisma
├── prisma.config.ts         # Configuración oficial de Prisma ORM 7
├── scripts/                 # Scripts de auto-versionado y generación de changelogs
│   ├── auto-version.js
│   └── generate-changelog.js
├── server/                  # Módulos y servicios del Backend Express
│   ├── authMiddleware.ts    # Validación de tokens Auth0 y roles (requireRole)
│   ├── dbBridge.ts          # Puente de datos híbrido (Prisma DB / JSON Fallback)
│   ├── dnsIntegrationService.ts # Aprovisionamiento de dominios VERCEL & DNS
│   ├── emailService.ts      # Envíos de reportes por correo vía SMTP (Nodemailer)
│   ├── encryptionService.ts # Cifrado criptográfico de datos sensibles (AES-256-GCM)
│   ├── scrapper.ts          # Extracción nativa de métricas de tiendas Shopify
│   └── version.ts           # Metadatos de versión autogenerados del Backend
├── server.ts                # Punto de entrada principal de la API REST Express
├── src/                     # Código fuente de la aplicación SPA React 19
│   ├── components/          # Componentes UI (Dashboards, Modales, ReportView, etc.)
│   ├── hooks/               # Custom React Hooks
│   ├── lib/                 # Clientes API, Auth0 Lock, PDF Generator, Telemetría
│   ├── stores/              # Estados globales Zustand (useReportStore, useTeamStore, etc.)
│   ├── types.ts             # Definición estricta de tipos TypeScript del sistema
│   ├── utils/               # Calculadoras financieras, formateadores y auxiliares
│   ├── version.ts           # Metadatos de versión autogenerados del Frontend
│   ├── App.tsx              # Componente raíz y enrutador principal
│   ├── main.tsx             # Punto de montaje React DOM y Auth0Provider
│   └── index.css            # Estilos globales con Tailwind CSS v4
├── index.html               # Plantilla HTML5 principal
├── vite.config.ts           # Configuración de compilación Vite 6 y servidor dev
└── version.json             # Registro global de hashes y números de versión
```

---

## 🌐 Variables de Entorno (.env)

Consulte el archivo [`.env.example`](.env.example) para ver la lista completa. Las variables principales son:

### Frontend (Prefijo `VITE_`)
- `VITE_API_URL`: URL base de la API REST Backend (`http://localhost:4000` en local).
- `VITE_AUTH0_DOMAIN`: Dominio del tenant de Auth0.
- `VITE_AUTH0_CLIENT_ID`: ID del cliente SPA registrado en Auth0.

### Backend (Node.js / Express)
- `PORT`: Puerto de escucha del servidor Express (por defecto `4000`).
- `FRONTEND_URL`: URL pública de la aplicación cliente (`http://localhost:3000`).
- `CORS_ORIGIN`: Orígenes permitidos para peticiones CORS.
- `DATABASE_URL`: URI de conexión a PostgreSQL (Prisma ORM 7).
- `ENCRYPTION_KEY`: Clave secreta para cifrado criptográfico AES-256-GCM.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: Credenciales de correo SMTP.

---

## 📡 API REST & Módulo de Administración

La API REST del sistema proporciona endpoints documentados bajo la especificación **OpenAPI 3.0** ([`openapi.json`](openapi.json)):

### Endpoints Clave:
- `GET /api/health`: Estado de salud de la API REST y versión actual.
- `GET /api/reports`: Lista todos los reportes de diagnóstico.
- `POST /api/reports`: Guarda o actualiza un reporte financiero.
- `DELETE /api/reports/:id`: Elimina un reporte por ID.
- `GET /api/teams`: Lista los equipos o consultores registrados.
- `POST /api/scrape`: Extrae automáticamente métricas operativas de tiendas Shopify.
- `POST /api/send-report-email`: Envía reportes ejecutivos en PDF por correo electrónico.
- `GET /api/logo-config` & `POST /api/logo-config`: Configuración de branding visual.

### Panel de Administración (**Tlachiālōyan**)
El área ejecutiva de administración se encuentra disponible en la ruta client-side:
👉 **`/tlachialoyan`** (ej. `http://localhost:3000/tlachialoyan`)

---

## ⚙️ Integración Continua (CI/CD con Node.js 24)

El pipeline de integración continua está configurado mediante **GitHub Actions** ([`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml)):

1. **Etapa 1 - CI Build & Lint (`Node.js 24`):**
   - Ejecuta `actions/checkout@v7` y `actions/setup-node@v5` especificando **Node.js 24**.
   - Genera el cliente Prisma con `npx prisma generate`.
   - Verifica los tipos estáticos con `npm run lint` (`tsc --noEmit`).
   - Compila la aplicación completa con `npm run build`.
2. **Etapa 2 - Release Please:**
   - Ejecuta `googleapis/release-please-action@v5` en pushes a `main` para automatizar versiones semánticas y actualizar [`CHANGELOG.md`](CHANGELOG.md).

---

## 📦 Protocolo de Versionado y Conventional Commits

El repositorio cuenta con un sistema de **Auto-Versionado Desacoplado Independiente**:

1. **Auto-Versionado:** Al ejecutar `npm run auto-version`, el script [`scripts/auto-version.js`](scripts/auto-version.js) calcula los hashes MD5 de los ámbitos de Frontend (`src/`, `index.html`) y Backend (`server.ts`, `server/`, `prisma/`) e incrementa de forma independiente la versión correspondiente.
2. **Conventional Commits:** Todo commit debe utilizar el formato estructurado (`feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `chore`):
   ```text
   feat(auth): integrar servicio de login modal Auth0 Lock
   fix(api): corregir validacion de esquemas Zod en endpoint de envio de correos
   ```
3. **Pull Request & Approvals:** No se realizan `push` directos a `main`. Todos los cambios deben enviarse mediante una Pull Request (PR) y contar con aprobación previa.

---

## 🧠 Cerebros e Inteligencia de IA del Sistema

El repositorio cuenta con un sistema de contexto e inteligencia para agentes de IA (Antigravity, Gemini, Claude):

- **[`AGENTS.md`](AGENTS.md):** Manual principal de reglas, arquitectura y matriz de 21 skills instaladas.
- **[`GEMINI.md`](GEMINI.md):** Guía de compatibilidad de IA y flujos de trabajo.
- **[`.agents/rules/`](.agents/rules/):** Reglas específicas para arquitectura (`architecture-rules.md`), commits (`commit-rules.md`), verificación (`quality-verification.md`) y skills (`skills-guidelines.md`).

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia **GNU Affero General Public License v3.0 (AGPL-3.0)**. Consulta el archivo [`LICENSE`](LICENSE) para obtener más información.
