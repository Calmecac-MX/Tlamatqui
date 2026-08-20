---
trigger: always_on
---

# Reglas y Contexto para IA - Tlamatqui
Este archivo redirige y extiende las reglas definidas en [`AGENTS.md`](../../AGENTS.md).

Por favor, consulta el archivo [`AGENTS.md`](../../AGENTS.md) en la raíz del proyecto para ver la arquitectura detallada, el flujo de desarrollo y la matriz completa de las 21 skills instaladas.

## Directiva Obligatoria de Commits
Todo agente de IA (Antigravity, Gemini, Claude, etc.) DEBE realizar un `git commit` siguiendo la especificación Conventional Commits (`feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `chore`) inmediatamente después de cada modificación o entregable finalizado, incluyendo los archivos autogenerados de versión y la carpeta `changelog/`, con el objetivo de mantener alimentado de forma continua el sistema de changelogs por versión.

## Directiva Obligatoria de Registro en Cerebros y Documentación IA
Cada cambio, modificación de código, adición de característica o actualización de arquitectura DEBE existir y quedar reflejado explícitamente en los cerebros del sistema (`AGENTS.md`, `GEMINI.md`, `.agents/rules/` y `changelog/`). Queda strictly prohibido finalizar una interacción sin actualizar la documentación e inteligencia IA del proyecto.

## Directiva Obligatoria de Pull Requests y Aprobaciones
Queda estrictamente prohibido realizar push directos a la rama `main`. Todo cambio o funcionalidad debe enviarse mediante una Pull Request (PR) y requiere aprobación explícita antes de integrarse al flujo de despliegue.

