# Reglas y Contexto del Proyecto para Inteligencia Artificial (IA)
> **Proyecto:** Tlamatqui  
> **Versión:** v2.5.74 (Frontend) / v2.5.61 (Backend)  
> **Archivo de Configuración:** `AGENTS.md` / `GEMINI.md` / `.agents/rules/ai-rules.md`

Este documento establece las normas de desarrollo, la arquitectura del proyecto y las directrices obligatorias para la ejecución de las **Skills instaladas** en este repositorio. Todo agente de IA (Antigravity, Gemini, Claude, etc.) debe seguir estrictamente estas reglas.

---

## 1. 📐 Contexto del Proyecto y Arquitectura

### 1.1 Propósito del Sistema
Suite de diagnóstico financiero y auditoría de e-commerce que evalúa métricas operativas de tiendas (Shopify vs. Tiendanube), simula ahorros en tiempo real y ofrece analítica ejecutiva.

### 1.2 Arquitectura Unificada Fullstack (Client / Server Single App)
- **Backend (API REST Express + Prisma ORM):**
  - **Ubicación:** `server.ts`, `server/`, `prisma/`, `data/`.
  - **Tecnologías:** Express 4, TypeScript, Prisma ORM 7 (`prisma@7.9.1`, `@prisma/config`), Auth0, Zod, esbuild.
  - **Puerto Dev:** `http://localhost:4000` (API REST `/api/*`).
  - **Build Output:** `dist/server.cjs`.
- **Frontend (SPA React 19 + Vite 6):**
  - **Ubicación:** `src/`, `index.html`, `vite.config.ts`.
  - **Tecnologías:** React 19, Vite 6, Tailwind CSS v4, Zustand 5, Recharts 3, `@auth0/auth0-react`, Auth0 Lock, Lucide React, GSAP / Motion.
  - **Puerto Dev:** `http://localhost:3000`.
  - **Build Output:** `dist/`.

### 1.3 Comandos Principales de Desarrollo
- **Desarrollo Simultáneo (Backend + Frontend):** `npm run dev`
- **Desarrollo Backend:** `npm run dev:backend`
- **Desarrollo Frontend:** `npm run dev:frontend`
- **Verificación de Tipos (Linter):** `npm run lint` (`tsc --noEmit`)
- **Compilación de Producción:** `npm run build`
- **Herramienta CLI del Sistema:** `npm run cli`
- **Control de Versiones:** `npm run auto-version` | `npm run bump:frontend` | `npm run bump:backend`

---

## 2. 🛡️ Principios y Reglas Generales de Desarrollo

1. **Nunca Asumir ni Adivinar:** Consulta el código fuente existente antes de proponer cambios en rutas, tipos de datos o funciones.
2. **Cero Parches Superficiales:** No silencies excepciones ni uses fallbacks vacíos. Soluciona el problema de raíz según la evidencia.
3. **Tipado Estricto con TypeScript:** Mantén los tipos definidos en `src/types.ts` y las validaciones de Zod sincronizados entre Backend y Frontend.
4. **Verificación Obligatoria:** No des por terminada una tarea sin ejecutar la verificación (`npm run lint` / `npm run build`).
5. **Commit Obligatorio con Conventional Commits:** Tras realizar cualquier cambio funcional o corrección, se DEBE ejecutar la sincronización de versión (`npm run auto-version`) y realizar un `git commit` estructurado siguiendo Conventional Commits (`feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `chore`), incluyendo la versión y changelogs (`CHANGELOG.md` y `changelog/CHANGELOG-vx.x.md`), para nutrir continuamente el historial de cambios.
6. **Sincronización Obligatoria en Cerebros y Documentación IA:** Todo cambio, modificación de comportamiento, ajuste de configuración, variable de entorno o refactorización DEBE quedar registrado de forma explícita en los archivos de contexto e inteligencia del sistema (`AGENTS.md`, `GEMINI.md`, `.agents/rules/` y `changelog/`). Prohibido concluir una tarea sin reflejar las modificaciones en los cerebros de IA del repositorio.
7. **Política Estricta de Integración vía Pull Request y Aprobación:** Queda estrictamente prohibido realizar `push` directos de código a la rama principal (`main`). Todo cambio, corrección o nueva característica DEBE enviarse obligatoriamente mediante una **Pull Request (PR)** y contar con la revisión y aprobación explícita (*Required Pull Request Reviews*) antes de ser integrado y desencadenar el pipeline de CI/CD en producción.

---

## 3. 🧰 Matriz de Skills Instaladas y Directrices de Uso

El repositorio cuenta con 22 skills especializadas en `.agents/skills/`. A continuación se detalla su uso obligatorio según el flujo de trabajo:

| Categoría | Skill | Cuándo Invocar / Activar | Directiva de Ejecución |
| :--- | :--- | :--- | :--- |
| **Diagnóstico** | `investigate-first` | Diagnóstico de errores, fallos intermitentes o comportamiento inesperado. | Formular hipótesis basadas en logs y código ANTES de modificar archivos. No adivinar. |
| **Parches** | `surgical-patch` | Solución de bugs específicos o pequeños ajustes de comportamiento. | Modificar el código en la capa más estrecha posible sin alterar código no relacionado. |
| **Refactor** | `safe-refactor` | Reestructuración de módulos, extracción de componentes o refactorización. | Preservar el comportamiento funcional y validar con `npm run lint`. |
| **Nuevas Features** | `lean-build` | Desarrollo de nuevos endpoints, páginas o componentes. | Evitar sobre-ingeniería, reutilizar librerías existentes y establecer un límite de alcance claro. |
| **Migraciones / DB** | `migration` / `prisma` | Cambios en esquemas de Prisma DB, generación de clientes, `db push` o migraciones. | Usar `npx prisma validate/generate/db push/migrate dev` y mantener compatibilidad hacia atrás. |
| **Verificación** | `verify-and-stop` | Finalización de tareas, comprobación de builds o auditoría de entregables. | Probar que el código compila y funciona, reportar evidencias y detener la ejecución. |
| **Auth0** | `author-auth0-skill` | Creación o actualización de documentación/patrones Auth0 en React o Express. | Seguir la estructura estandarizada de rutas, componentes y validaciones Auth0. |
| **Eficiencia Tokens** | `caveman` | Reducción de consumo de tokens durante la interacción. | Hablar de forma concisa manteniendo 100% la precisión técnica. |
| **Subagentes** | `cavecrew` | Tareas complejas que requieran aislamiento de contexto. | Invocar subagentes `cavecrew-investigator`, `cavecrew-builder` o `cavecrew-reviewer`. |
| **Exploración** | `caveman-explore` | Búsqueda y localización de archivos en repositorios grandes. | Búsquedas de solo lectura sin saturar la ventana de contexto principal. |
| **Commits** | `commit-writer` / `caveman-commit` | Redacción y estructuración de mensajes de `git commit`. | Seguir la guía de Conventional Commits, Release Please y Auto-Versioner (`.agents/skills/commit-writer/`). |
| **Code Review** | `caveman-review` | Revisión de PRs o diferencias de código (diffs). | Comentarios de revisión ultracortos (1 línea por hallazgo: ubicación, problema, solución). |
| **Compresión** | `caveman-compress` | Compresión de archivos de memoria (CLAUDE.md, reglas, notas). | Compactar archivos manteniendo respaldo original (`.original.md`). |
| **Config Gateway** | `caveman-setup` | Configuración del gateway de monitoreo LLM en el repositorio. | Enlazar peticiones LLM a través de la pasarela de medición de costos. |
| **Descubrimiento** | `caveman-discover` | Etiquetado de flujos de trabajo con LLMs en la aplicación. | Identificar y agrupar llamadas a modelos por flujo de negocio. |
| **Evidencia Costs** | `caveman-evidence-review` | Análisis de consumo, latencia y costos reportados por Caveman Cloud. | Inspección de métricas de uso y ahorro de tokens. |
| **Optimización** | `caveman-learn` / `caveman-optimize` | Identificación y aplicación de mejoras para bajar costos de IA. | Trimear contextos pesados y aplicar sugerencias de ahorro validadas. |
| **Experimentos** | `caveman-manage` | Gestión del ciclo de vida de experimentos de optimización. | Bloquear ejecuciones no evaluadas o cambios no autorizados. |
| **Métricas** | `caveman-stats` | Consulta de uso real de tokens en la sesión actual. | Lectura directa de métricas del sistema. |
| **Ayuda** | `caveman-help` | Consulta rápida de modos y comandos de Caveman. | Mostrar la tarjeta de referencia rápida de comandos Caveman. |

---

## 4. 🔄 Flujos de Trabajo Recomendados para la IA

### Flujo A: Corrección de un Bug
1. Activar `investigate-first` para revisar los logs de error y aislar la causa raíz.
2. Usar `surgical-patch` para aplicar el arreglo mínimo requerido.
3. Ejecutar `verify-and-stop` corriendo `npm run lint` y verificar que el sistema funciona.

### Flujo B: Creación de una Nueva Funcionalidad
1. Activar `lean-build` para definir los límites de la funcionalidad sin sobre-ingeniería.
2. Si requiere Auth0, consultar `author-auth0-skill`.
3. Si incluye cambios en Base de Datos, aplicar la skill `migration` para la capa de Prisma.
4. Aplicar `verify-and-stop` con `npm run build`.

### Flujo C: Optimización de Tokens y Commits
1. Para búsquedas amplias de archivos, usar `caveman-explore`.
2. Al finalizar cambios y preparar el commit, aplicar `caveman-commit`.

---

## 5. 📦 Reglas y Configuración del Manejo de Versiones

El repositorio utiliza un sistema de **Auto-Versionado Desacoplado Independiente** gestionado por el script [`scripts/auto-version.js`](file:///Users/cesarayar/Documents/tlamatqui/scripts/auto-version.js).

### 5.1 Ámbitos de Componentes y Desacoplamiento
- **Frontend Scope (`src/`, `index.html`, `assets/`):** Genera `src/version.ts` y gestiona la versión independiente del Frontend (`FRONTEND_VERSION`).
- **Backend Scope (`server.ts`, `server/`, `prisma/`, `cli.ts`):** Genera `server/version.ts` y gestiona la versión de la API REST (`BACKEND_VERSION`), sincronizando también `openapi.json` y `package.json`.

### 5.2 Directivas Obligatorias de Versionado para la IA
1. **Prohibición de Edición Manual:** NUNCA edites manualmente los archivos autogenerados de versión (`version.json`, `src/version.ts`, `server/version.ts`, `openapi.json` o el campo `"version"` en `package.json`).
2. **Ejecución Automática al Finalizar Tareas:** Tras realizar cualquier modificación funcional en Backend o Frontend, ejecuta el script de sincronización de versión:
   ```bash
   npm run auto-version
   ```
3. **Comandos de Incremento de Versión (Bumps):**
   - **Auto-detección por hashes (PATCH):** `npm run auto-version`
   - **Forzar bump en Frontend:** `npm run bump:frontend`
   - **Forzar bump en Backend:** `npm run bump:backend`
   - **Forzar bump en ambos:** `npm run bump:both`
   - **Cambios Minor / Major:** `npm run auto-version -- --type=minor` | `npm run auto-version -- --type=major`
4. **Inclusión en Commits:** Al preparar commits (`git add`), siempre incluye los archivos de versión autogenerados modificados por el script.

---

## 6. 📝 Reglas de Conventional Commits y Automatización de Changelog (Google Release Please)

El repositorio cuenta con integración automatizada de [`CHANGELOG.md`](file:///Users/cesarayar/Documents/tlamatqui/CHANGELOG.md) guiada por **Google Release Please** y pipeline de CI/CD (con Node.js 24, Lint y Build) mediante [`.github/workflows/ci-cd.yml`](file:///Users/cesarayar/Documents/tlamatqui/.github/workflows/ci-cd.yml).

### 6.1 Estructura Obligatoria de Commits
Todo mensaje de commit redactado por desarrolladores o agentes de IA debe seguir strictly el estándar Conventional Commits:
```text
<tipo>(<ámbito>): <descripción concisa>

[cuerpo opcional detallando la motivación del cambio]

[PIE DE PÁGINA opcional: BREAKING CHANGE: <descripción del cambio incompatible>]
```

### 6.2 Mapeo de Tipos de Commit y Secciones del Changelog
| Tipo | Categoría de Cambio | Impacto en Changelog / Versión |
| :--- | :--- | :--- |
| `feat` | Nueva característica o endpoint | Se agrega a 🚀 Features & Nuevas Funcionalidades. Incrementa versión MINOR. |
| `fix` | Corrección de bug o fallo operativo | Se agrega a 🐛 Corregido & Bug Fixes. Incrementa versión PATCH. |
| `perf` | Optimización de rendimiento | Se agrega a ⚡ Optimización y Rendimiento. Incrementa versión PATCH. |
| `refactor` | Cambio de código sin alteración funcional | Se agrega a ♻️ Refactorización de Código. |
| `docs` | Actualización de documentación | Se agrega a 📚 Documentación. |
| `test` | Adición o corrección de pruebas | Se agrega a 🧪 Pruebas y Testing. |
| `chore` | Mantenimiento, dependencias o CI/CD | Se agrega a 🔧 Tareas Operativas y Mantenimiento. |
| `BREAKING CHANGE:` | Cambio Incompatible en API / DB | Se destaca en 🚨 Cambios Incompatibles. Incrementa versión MAJOR. |

### 6.3 Automatización del Changelog
1. **Generación Local:** Ejecuta `npm run changelog` o `npm run cli changelog` para actualizar [`CHANGELOG.md`](file:///Users/cesarayar/Documents/tlamatqui/CHANGELOG.md) antes de enviar PRs o finalizar entregables.
2. **Generación Automática en CI/CD:** El workflow de GitHub Actions [`.github/workflows/ci-cd.yml`](file:///Users/cesarayar/Documents/tlamatqui/.github/workflows/ci-cd.yml) ejecuta `googleapis/release-please-action@v5` en la rama `main` para crear PRs automáticas de versión y release notes.
3. **Integración con Auto-Versioner:** Al ejecutar `npm run changelog`, ejecuta siempre `npm run auto-version` para asegurar la sincronización de hashes de Backend y Frontend.
4. **Commit Obligatorio por Cambio:** En cada tarea o ajuste finalizado, la IA o el desarrollador DEBE realizar un `git commit` estructurado bajo Conventional Commits para que el historial alimente continuamente `CHANGELOG.md` y los archivos individuales en `changelog/CHANGELOG-vx.x.md`.



