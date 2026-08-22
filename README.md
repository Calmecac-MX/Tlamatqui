# Tlamatqui (Monorepo)

Suite de diagnóstico financiero de e-commerce, auditoría de tiendas Shopify, comparativas cuantitativas para Tiendanube, simulación de ahorro en vivo y analítica ejecutiva en tiempo real.

---

## 🏗️ Arquitectura Monorepo Desacoplada (NPM Workspaces)

El repositorio está estructurado como un **Monorepo** con aplicaciones totalmente desacopladas utilizando **NPM Workspaces** (`apps/*`):

- 🎨 **`apps/frontend` (`@tlamatqui/frontend`):**  
  Aplicación SPA independiente basada en **React 19 + Vite 6 + Tailwind CSS v4**. Escucha en el puerto `3000` (`http://localhost:3000`).

- ⚙️ **`apps/backend` (`@tlamatqui/backend`):**  
  Servidor API REST independiente basado en **Express 4 + TypeScript + Prisma ORM 7**. Escucha en el puerto `4000` (`http://localhost:4000`).

---

## 🚀 Inicio Rápido en Desarrollo

### 1. Requisitos Previos
- **Node.js:** `>=24.0.0`
- **npm:** `>=9.0.0`

### 2. Instalación de Dependencias del Monorepo
```bash
npm install
```

### 3. Configurar Variables de Entorno
Copia el archivo de ejemplo:
```bash
cp .env.example .env
```

### 4. Ejecutar Backend y Frontend Simultáneamente
```bash
npm run dev
```
Este comando ejecuta de forma paralela el servidor **Backend** (`http://localhost:4000`) y el cliente **Frontend** (`http://localhost:3000`).

---

## 🛠️ Comandos Principales

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Ejecuta **Backend** (puerto 4000) y **Frontend** (puerto 3000) en paralelo mediante `concurrently`. |
| `npm run dev:backend` | Inicia únicamente la API REST Backend (`apps/backend`) en `http://localhost:4000`. |
| `npm run dev:frontend` | Inicia únicamente el cliente web Frontend (`apps/frontend`) en `http://localhost:3000`. |
| `npm run build` | Compila el Frontend (`apps/frontend/dist`) y la API Backend (`apps/backend/dist/server.cjs`). |
| `npm run build:backend` | Compila únicamente la app Backend. |
| `npm run build:frontend` | Compila únicamente la app Frontend. |
| `npm run lint` | Ejecuta la comprobación estricta de tipos de TypeScript (`tsc --noEmit`) en ambos workspaces. |
| `npm run start:backend` | Ejecuta el servidor Backend compilado en producción. |
| `npm run cli` | Ejecuta la CLI de administración del Backend (`list`, `info`, `delete`, `seed`). |
| `npm run auto-version` | Analiza los hashes de código e incrementa las versiones del Frontend y Backend de forma independiente. |

---

## 📚 Documentación Detallada

Para consultar la arquitectura profunda, guías de desarrollo, variables de entorno y reglas del proyecto, consulta los siguientes documentos de inteligencia del sistema:
- **[AGENTS.md](AGENTS.md):** Reglas, directivas de skills y política de Pull Requests.
- **[README-detalles.md](README-detalles.md):** Manual técnico detallado de la aplicación.
- **[CHANGELOG.md](CHANGELOG.md):** Historial continuo de cambios y versiones del sistema.

---

## 📄 Licencia

Este proyecto está licenciado bajo la **Licencia Pública General GNU Affero v3.0 (AGPL-3.0)**. Consulta el archivo [`LICENSE`](LICENSE) para más información.
