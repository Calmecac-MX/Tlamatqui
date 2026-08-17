# Reglas y Contexto del Proyecto para Inteligencia Artificial (IA)
> **Proyecto:** Tlamatqui  
> **Versión:** 2.5.0  
> **Archivo de Configuración Principal:** [`AGENTS.md`](file:///Users/cesarayar/Documents/tlamatqui/AGENTS.md)

Este documento complementa a [`AGENTS.md`](file:///Users/cesarayar/Documents/tlamatqui/AGENTS.md) para garantizar la compatibilidad completa con Antigravity, Gemini y otros agentes de IA.

---

## 1. Contexto Rápido del Repositorio
- **Nombre:** Tlamatqui
- **Arquitectura:** Desacoplada (Backend API REST en Express/TypeScript en puerto `4000`, Frontend React 19/Vite 6/Tailwind CSS v4 en puerto `3000`).
- **Base de Datos:** Prisma ORM 6.
- **Autenticación:** Auth0 (`@auth0/auth0-react` en Frontend y validación JWT en Backend).

---

## 2. Uso Obligatorio de Skills Instaladas
Consulta [`AGENTS.md`](file:///Users/cesarayar/Documents/tlamatqui/AGENTS.md) para ver las 21 skills y sus directivas de ejecución:
- `investigate-first`: Diagnóstico con evidencia previa.
- `surgical-patch`: Correcciones quirúrgicas de bugs.
- `safe-refactor`: Refactorización con garantía de comportamiento.
- `lean-build`: Construcción delgada de nuevas características.
- `migration`: Migraciones seguras y reversibles.
- `verify-and-stop`: Verificación con linters y pruebas antes de concluir.
- `author-auth0-skill`: Patrones y guías de Auth0.
- `commit-writer`: Guía para redacción de commits estructurados bajo Conventional Commits y Release Please.
- Ecosistema `caveman` & `cavecrew`: Optimización de tokens, subagentes y monitoreo de gateway LLM.

---

## 3. Manejo de Versiones (Auto-Versioning)
- **Script:** [`scripts/auto-version.js`](file:///Users/cesarayar/Documents/tlamatqui/scripts/auto-version.js)
- **Comandos:** `npm run auto-version` | `npm run bump:frontend` | `npm run bump:backend` | `npm run bump:both`
- **Regla Obligatoria:** Ejecutar siempre `npm run auto-version` al finalizar cambios funcionales. Prohibido editar manualmente `version.json`, `src/version.ts`, `server/version.ts`, `openapi.json` o `package.json`.

---

## 4. Conventional Commits & Google Release Please
- **Configuración:** [`release-please-config.json`](file:///Users/cesarayar/Documents/tlamatqui/release-please-config.json) | [`.release-please-manifest.json`](file:///Users/cesarayar/Documents/tlamatqui/.release-please-manifest.json)
- **CI/CD Workflow:** [`.github/workflows/release-please.yml`](file:///Users/cesarayar/Documents/tlamatqui/.github/workflows/release-please.yml)
- **Script Local & CLI:** `npm run changelog` | `npm run cli changelog`
- **Regla Obligatoria:** Todo cambio o entregable DEBE culminar con un `git commit` siguiendo la estructura Conventional Commits `<tipo>(<ámbito>): <descripción>` (`feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `chore`, `BREAKING CHANGE`) incluyendo versiones y changelogs para nutrir el historial continuo del proyecto.



