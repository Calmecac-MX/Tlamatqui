# Reglas de Arquitectura y Estructura del Código - Tlamatqui

Este documento establece los principios de diseño arquitectónico y normas tecnológicas para el proyecto **Tlamatqui**.

---

## 1. 🏗️ Arquitectura Desacoplada Client / Server

El sistema está dividido en dos capas independientes:

### Backend (API REST Node.js + Express + Prisma)
- **Ubicación principal:** [`server.ts`](file:///Users/cesarayar/Documents/tlamatqui/server.ts), directorio [`server/`](file:///Users/cesarayar/Documents/tlamatqui/server), esquema [`prisma/schema.prisma`](file:///Users/cesarayar/Documents/tlamatqui/prisma/schema.prisma).
- **Puerto de desarrollo:** `http://localhost:4000` (`/api/*`).
- **Compilación de producción:** `esbuild` genera `dist/server.cjs`.
- **Persistencia:** Prisma ORM 6.19 con fallback híbrido local JSON en [`server/dbBridge.ts`](file:///Users/cesarayar/Documents/tlamatqui/server/dbBridge.ts).

### Frontend (SPA React 19 + Vite 6)
- **Ubicación principal:** [`src/`](file:///Users/cesarayar/Documents/tlamatqui/src), [`index.html`](file:///Users/cesarayar/Documents/tlamatqui/index.html), [`vite.config.ts`](file:///Users/cesarayar/Documents/tlamatqui/vite.config.ts).
- **Puerto de desarrollo:** `http://localhost:3000`.
- **Tecnologías UI:** React 19, Tailwind CSS v4, Zustand 5, Recharts 3, Auth0 (`@auth0/auth0-react`), Lucide React, GSAP / Motion.

---

## 2. 📐 Principios de Tipado y Contratos de Datos

1. **Tipado Estricto:** Todos los tipos compartidos residen en [`src/types.ts`](file:///Users/cesarayar/Documents/tlamatqui/src/types.ts). No uses `any` implícito.
2. **Validación de Datos en API:** Usa esquemas Zod en Backend ([`server/schemas.ts`](file:///Users/cesarayar/Documents/tlamatqui/server/schemas.ts)) para validar payloads de entrada.
3. **Especificación OpenAPI:** Mantén sincronizada la documentación OpenAPI en [`openapi.json`](file:///Users/cesarayar/Documents/tlamatqui/openapi.json).

---

## 3. 🔐 Autenticación y Seguridad

- **Integración Auth0:** Autenticación JWT en backend vía [`server/authMiddleware.ts`](file:///Users/cesarayar/Documents/tlamatqui/server/authMiddleware.ts) y proveedor `@auth0/auth0-react` en frontend.
- **Rutas Públicas vs Protegidas:** Los reportes compartidos (`?shared=true`) tienen acceso público de lectura sin requerir sesión iniciada.
