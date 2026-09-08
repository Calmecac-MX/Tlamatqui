---
trigger: always_on
---

# Reglas y Contexto para IA - Tlamatqui
Este archivo redirige y extiende las reglas definidas en [`AGENTS.md`](../../AGENTS.md).

Por favor, consulta el archivo [`AGENTS.md`](../../AGENTS.md) en la raíz del proyecto para ver la arquitectura detallada, el flujo de desarrollo y la matriz completa de las 22 skills instaladas.

## Directiva Obligatoria de Workflows
Toda lógica de negocio compuesta o multi-paso (auditorías, correos, dominios DNS, equipos y telemetría de interacción) DEBE encapsularse en los pipelines modulares de `server/workflows/`, manteniendo los controladores Express como capas delgadas de transporte.

## Directiva Obligatoria de Commits Atómicos (Atomic Commits)
Todo agente de IA (Antigravity, Gemini, Claude, etc.) DEBE estructurar sus commits de forma atómica:
1. **Propósito Único e Indivisible:** Un solo cambio lógico por commit, sin mezclar refactors ajenos o estilos.
2. **Estado Siempre Verde:** El código debe compilar (`npm run lint` y `npm run build`) en cada commit.
3. **Conventional Commits & Versiones:** Seguir la especificación Conventional Commits (`feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `chore`), ejecutando `npm run auto-version` e incluyendo los archivos autogenerados de versión y changelog en el staging.

## Directiva Obligatoria de Registro en Cerebros y Documentación IA
Cada cambio, modificación de código, adición de característica o actualización de arquitectura DEBE existir y quedar reflejado explícitamente en los cerebros del sistema (`AGENTS.md`, `GEMINI.md`, `.agents/rules/` y `changelog/`). Queda estrictamente prohibido finalizar una interacción sin actualizar la documentación e inteligencia IA del proyecto.

## Directiva Obligatoria de Pull Requests y Aprobaciones
Queda estrictamente prohibido realizar push directos a la rama principal `omeyocan`. Todo cambio o funcionalidad debe promoverse mediante una Pull Request (PR) y requiere aprobación explícita antes de integrarse al flujo de despliegue en producción.

