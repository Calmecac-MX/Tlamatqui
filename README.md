# Tlamatqui

Suite de diagnóstico financiero de e-commerce, auditoría de tiendas Shopify, comparativas cuantitativas para Tiendanube, simulación de ahorro en vivo y analítica ejecutiva en tiempo real.

---

## 🏗️ Arquitectura Desacoplada (Client / Server)

El proyecto cuenta con una arquitectura desacoplada en la que el **Backend (API REST)** y el **Frontend (SPA)** se ejecutan de forma independiente:

- **Backend (API REST Express + Prisma ORM / DB Bridge):** Escucha en el puerto `4000` (`http://localhost:4000`), con soporte de CORS y endpoints `/api/*`.
- **Frontend (React 19 + Vite 6 + Tailwind CSS v4):** Servidor Web SPA independiente en el puerto `3000` (`http://localhost:3000`).

---

## 🚀 Inicio Rápido en Desarrollo

### 1. Requisitos Previos
- **Node.js:** v18.0.0 o superior.
- **npm:** v9.0.0 o superior.

### 2. Instalación de Dependencias
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
Este comando ejecuta de forma paralela el servidor **Backend** (`http://localhost:4000`) y el servidor **Frontend** (`http://localhost:3000`).

---

## 🛠️ Comandos Disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Ejecuta **Backend** (puerto 4000) y **Frontend** (puerto 3000) en paralelo mediante `concurrently`. |
| `npm run dev:backend` | Inicia únicamente la API REST Backend en `http://localhost:4000`. |
| `npm run dev:frontend` | Inicia únicamente el servidor de desarrollo Frontend en `http://localhost:3000`. |
| `npm run build` | Compila tanto la API Backend (`dist/server.cjs`) como la app Frontend (`dist/`). |
| `npm run build:backend` | Compila el bundle del Backend en Node.js. |
| `npm run build:frontend` | Compila el bundle optimizado de producción del Frontend. |
| `npm run start:backend` | Ejecuta el bundle compilado del Backend en producción. |
| `npm run cli` | Ejecuta la herramienta de línea de comandos (`list`, `info`, `delete`, `seed`). |
| `npm run auto-version` | Analiza hashes de archivos en Frontend y Backend e incrementa automáticamente la versión de la capa que sufrió cambios. |
| `npm run bump:frontend` | Fuerza un incremento de versión (PATCH) en la capa de Frontend. |
| `npm run bump:backend` | Fuerza un incremento de versión (PATCH) en la capa de Backend. |
| `npm run bump:both` | Fuerza un incremento de versión en ambas capas simultáneamente. |

---

## 📚 Manual Detallado

Para consultar la documentación exhaustiva sobre la base de datos, el diagrama ERD de Prisma, Auth0, los endpoints REST y los módulos del sistema, consulta el archivo **[README-detalles.md](README-detalles.md)**.

---

## 📄 Licencia

Este proyecto está licenciado bajo la **Licencia Pública General GNU Affero v3.0 (AGPL-3.0)**. Consulta el archivo [`LICENSE`](LICENSE) para más información.

