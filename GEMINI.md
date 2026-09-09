# Reglas y Contexto del Proyecto para Inteligencia Artificial (IA)
> **Proyecto:** Tlamatqui  
> **Versión:** v2.5.95 (Frontend) / v2.5.91 (Backend)  
> **Archivo de Configuración Principal:** [`AGENTS.md`](file:///Users/cesarayar/Documents/tlamatqui/AGENTS.md)

Este documento complementa a [`AGENTS.md`](file:///Users/cesarayar/Documents/tlamatqui/AGENTS.md) para garantizar la compatibilidad completa con Antigravity, Gemini y otros agentes de IA.

---

## 1. Contexto Rápido del Repositorio
- **Nombre:** Tlamatqui
- **Arquitectura:** Desacoplada (Backend API REST en Express/TypeScript en puerto `4000`, Frontend React 19/Vite 6/Tailwind CSS v4 en puerto `3000`).
- **Servicio Gravatar:** Resolución automática y en tiempo real de fotos de perfil (`server/gravatarService.ts`, `src/lib/gravatar.ts`) en Auth Context, Registro/Sincronización de Usuarios, Panel de Administración e Invitación de Miembros del Equipo.
- **Sistema Global de Popups & Avisos:** `AlertPopupProvider`, `AlertPopupModal` y `AlertToastContainer` para unificar avisos, errores, confirmaciones y toasts en popups modales reactivos.
- **Arquitectura de Workflows (`server/workflows/`):** Patrón *Thin Controller* con pipelines modulares para `auditWorkflow`, `emailWorkflow`, `domainWorkflow`, `teamWorkflow` y `engagementWorkflow`.
- **Base de Datos:** Prisma ORM 8 (`prisma@8.0.0-rc.13`, `@prisma/client`, `@prisma/config`).
- **Autenticación:** Auth0 (`@auth0/auth0-react` en Frontend y validación JWT en Backend).

---

## 2. Uso Obligatorio de Skills Instaladas
Consulta [`AGENTS.md`](file:///Users/cesarayar/Documents/tlamatqui/AGENTS.md) para ver las 22 skills y sus directivas de ejecución:
- `investigate-first`: Diagnóstico con evidencia previa.
- `surgical-patch`: Correcciones quirúrgicas de bugs.
- `safe-refactor`: Refactorización con garantía de comportamiento.
- `lean-build`: Construcción delgada de nuevas características y orquestación en workflows.
- `migration` / `prisma`: Migraciones seguras, esquemas de Prisma ORM 8 y despliegue de DB.
- `verify-and-stop`: Verificación con linters y pruebas antes de concluir.
- `author-auth0-skill`: Patrones y guías de Auth0.
- `commit-writer`: Guía para redacción de commits estructurados bajo Conventional Commits, Atomic Commits y Release Please.
- Ecosistema `caveman` & `cavecrew`: Optimización de tokens, subagentes y monitoreo de gateway LLM.

---

## 3. Manejo de Versiones (Auto-Versioning)
- **Script:** [`scripts/auto-version.js`](file:///Users/cesarayar/Documents/tlamatqui/scripts/auto-version.js)
- **Comandos:** `npm run auto-version` | `npm run bump:frontend` | `npm run bump:backend` | `npm run bump:both`
- **Regla Obligatoria:** Ejecutar siempre `npm run auto-version` al finalizar cambios funcionales. Prohibido editar manualmente `version.json`, `src/version.ts`, `server/version.ts`, `openapi.json` o `package.json`.

---

## 4. Conventional Commits, Atomic Commits, Ramas & Google Release Please
- **Estrategia de Ramas:**
  - `calpilli` (Desarrollo): [`.github/workflows/calpilli.yml`](.github/workflows/calpilli.yml)
  - `tlamatini` (Preview / Staging): [`.github/workflows/tlamatini.yml`](.github/workflows/tlamatini.yml)
  - `omeyocan` (Producción & Releases): [`.github/workflows/omeyocan.yml`](.github/workflows/omeyocan.yml)
- **Acción Centralizada:** [`.github/actions/setup-tlamatqui/action.yml`](.github/actions/setup-tlamatqui/action.yml)
- **Configuración Release Please:** [`release-please-config.json`](file:///Users/cesarayar/Documents/tlamatqui/release-please-config.json) | [`.release-please-manifest.json`](file:///Users/cesarayar/Documents/tlamatqui/.release-please-manifest.json)
- **Script Local & CLI:** `npm run changelog` | `npm run cli changelog`
- **Política Obligatoria de Commits Atómicos (Atomic Commits):**
  - Todo commit debe ser indivisible, auto-contenido y reversible, solucionando un único objetivo lógico.
  - El repositorio DEBE compilar limpiamente (`npm run lint` / `npm run build`) en cada commit individual.
  - Todo cambio o entregable DEBE culminar con un `git commit` siguiendo la estructura Conventional Commits `<tipo>(<ámbito>): <descripción>` (`feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `chore`, `BREAKING CHANGE`) incluyendo versiones y changelogs para nutrir el historial continuo del proyecto.
- **Política de Pull Requests y Aprobaciones:** Prohibido realizar `push` directos a `omeyocan`. Todo cambio debe enviarse vía Pull Request y contar con aprobación previa para integrarse.

---

## 5. Sincronización Obligatoria en Cerebros y Documentación de IA
- **Regla Estricta:** Todo ajuste, adición o modificación realizada por cualquier agente de IA DEBE ser documentada y reflejada de inmediato en los cerebros del sistema (`AGENTS.md`, `GEMINI.md`, `.agents/rules/` y `changelog/`). No se dará por concluida ninguna tarea sin antes sincronizar el contexto operativo en la documentación para IA del proyecto.



