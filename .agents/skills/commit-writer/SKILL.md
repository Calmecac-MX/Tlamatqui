---
name: commit-writer
description: >-
  Especialista en la redacción de mensajes de commit estructurados bajo el estándar
  Conventional Commits y totalmente compatibles con Google Release Please y el sistema de
  Auto-Versionado del repositorio. Usar cuando el usuario pida "redactar commit", "mensaje de commit",
  "generar commit", "/commit", o antes de realizar un 'git commit'.
---

# Commit Writer Skill (Conventional Commits & Release Please)

Esta skill instructa al Agente de IA para la generación y redacción de mensajes de `git commit` estructurados de forma profesional, alineados con el estándar **Conventional Commits v1.0.0** y compatibles con **Google Release Please** y el script de auto-versionado del proyecto.

---

## 1. 📐 Estructura Obligatoria del Mensaje

```text
<tipo>(<ámbito>): <resumen en imperativo>

[cuerpo opcional: explicación del 'por qué' del cambio y decisiones técnicas]

[PIE DE PÁGINA opcional: BREAKING CHANGE: <descripción del cambio incompatible>]
```

---

## 2. 🏷️ Tipos de Commit y su Impacto en Release Please

| Tipo | Descripción | Sección en CHANGELOG | Bump de Versión |
| :--- | :--- | :--- | :--- |
| `feat` | Nueva característica o endpoint | 🚀 Features & Nuevas Funcionalidades | MINOR |
| `fix` | Corrección de bug o fallo | 🐛 Corregido & Bug Fixes | PATCH |
| `perf` | Optimización de rendimiento | ⚡ Optimización y Rendimiento | PATCH |
| `refactor` | Cambio de código sin alterar lógica externa | ♻️ Refactorización de Código | Ninguno |
| `docs` | Cambios en documentación (`AGENTS.md`, `README.md`) | 📚 Documentación | Ninguno |
| `test` | Pruebas unitarias o de integración | 🧪 Pruebas y Testing | Ninguno |
| `chore` | Tareas de mantenimiento, dependencias o CI/CD | 🔧 Tareas Operativas y Mantenimiento | Ninguno |
| `feat!` / `BREAKING CHANGE:` | Cambio Incompatible en API o Base de Datos | 🚨 Cambios Incompatibles | MAJOR |

---

## 3. 🎯 Ámbitos Válidos del Repositorio (`<ámbito>`)

Usa siempre el ámbito que identifique con precisión el componente modificado:

- `frontend`: Cambios en la app React 19 (`src/`, UI, componentes, Zustand, Tailwind).
- `backend`: Cambios en la API Express/TypeScript (`server.ts`, `server/`, endpoints REST).
- `prisma` o `db`: Cambios en esquemas de base de datos o migraciones de Prisma.
- `cli`: Modificaciones en la herramienta CLI (`cli.ts`).
- `scripts`: Scripts de automatización (`auto-version.js`, `generate-changelog.js`).
- `auth`: Integración o configuraciones de Auth0.
- `config`: Variables de entorno, `vite.config.ts`, `tsconfig.json`, `package.json`.
- `docs`: Archivos `.md` de reglas o documentación.

---

## 4. 📝 Reglas de Formato y Estilo

1. **Primera Línea (Subject):**
   - Usar modo imperativo (ej. `add`, `fix`, `update` o en español `añadir`, `corregir`, `actualizar`).
   - Máximo 50 caracteres (límite duro de 72).
   - En minúsculas después de los dos puntos `:`.
   - Sin punto final.
2. **Cuerpo del Commit (Body):**
   - Omitir si la primera línea es auto-explicativa.
   - Incluir cuando el "por qué" o la motivación técnica no sean evidentes en el diff.
   - Envolver líneas a máximo 72 caracteres.
3. **Pies de Página (Trailers):**
   - Para cambios que rompen retrocompatibilidad: `BREAKING CHANGE: <descripción del impacto y migración>`.
   - Para vincular issues/PRs: `Closes #123`, `Refs #45`.

---

## 5. 🔄 Protocolo de Integración con Auto-Versioner

Antes de generar o confirmar el commit:
1. Asegúrate de ejecutar `npm run auto-version` si hubo cambios funcionales.
2. Ejecuta `npm run changelog` si se requiere actualizar el `CHANGELOG.md` local.
3. Incluye los archivos autogenerados (`version.json`, `src/version.ts`, `server/version.ts`, `openapi.json`, `package.json`, `CHANGELOG.md`) en la lista de staging de Git (`git add`).

---

## 💡 Ejemplos de Mensajes de Commit Correctos

### Ejemplo 1: Nueva funcionalidad en Frontend
```text
feat(frontend): añadir comparador cuantitativo de tarifas Shopify vs Tiendanube

Permite a los usuarios visualizar en tiempo real el porcentaje de ahorro
estimado según su GMV mensual.
```

### Ejemplo 2: Corrección de bug en Backend
```text
fix(backend): corregir validación JWT de Auth0 en rutas protegidas

Resuelve el error 401 intermitente al renovar tokens expirados.
```

### Ejemplo 3: Cambio Breaking en la API
```text
feat(backend)!: migrar respuesta de /api/reports a formato paginado Zod

BREAKING CHANGE: el endpoint /api/reports ahora retorna un objeto con { data, page, total }
en lugar de un arreglo directo.
```
