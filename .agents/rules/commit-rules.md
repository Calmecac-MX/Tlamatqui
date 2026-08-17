# Reglas de Versionado, Commits y Changelog - Tlamatqui

Este documento define el protocolo obligatorio para el control de versiones, la redacción de mensajes de commit y la generación de changelogs en **Tlamatqui**.

---

## 1. 🔄 Auto-Versionado Desacoplado Independiente

El proyecto utiliza [`scripts/auto-version.js`](file:///Users/cesarayar/Documents/tlamatqui/scripts/auto-version.js) para rastrear cambios en Frontend y Backend:

- **Frontend Scope (`src/`, `index.html`, `assets/`):** Genera `src/version.ts` (`FRONTEND_VERSION`).
- **Backend Scope (`server.ts`, `server/`, `prisma/`, `cli.ts`):** Genera `server/version.ts` (`BACKEND_VERSION`), sincronizando también `package.json` y `openapi.json`.

### 🚨 Directivas Obligatorias de Versionado
1. **Prohibición de Edición Manual:** NUNCA edites manualmente `version.json`, `src/version.ts`, `server/version.ts`, `openapi.json` o `package.json`.
2. **Ejecución Obligatoria:** Tras realizar cualquier modificación funcional en Backend o Frontend, ejecuta:
   ```bash
   npm run auto-version
   ```

---

## 2. 📝 Mensajes de Commit (Conventional Commits)

Todo commit realizado por desarrolladores o agentes de IA DEBE seguir la especificación **Conventional Commits**:

```text
<tipo>(<ámbito>): <descripción concisa>

[cuerpo opcional detallando la motivación del cambio]

[PIE DE PÁGINA opcional: BREAKING CHANGE: <descripción>]
```

### Tipos de Commit Permitidos
| Tipo | Uso / Categoría | Impacto en Versionado |
| :--- | :--- | :--- |
| `feat` | Nuevas características o endpoints | Minor (`x.Y.0`) |
| `fix` | Corrección de bugs u errores | Patch (`x.x.Y`) |
| `perf` | Optimización de rendimiento | Patch (`x.x.Y`) |
| `refactor` | Reestructuración de código | Mantiene versión |
| `docs` | Actualización de documentación | Mantiene versión |
| `test` | Adición o ajuste de pruebas | Mantiene versión |
| `chore` | Tareas de mantenimiento y CI/CD | Mantiene versión |
| `BREAKING CHANGE:` | Cambio Incompatible en API / DB | Major (`Y.0.0`) |

---

## 3. 📂 Generación Automática de Changelog por Versión

Cada ejecución de `npm run auto-version` o `npm run changelog` invoca [`scripts/generate-changelog.js`](file:///Users/cesarayar/Documents/tlamatqui/scripts/generate-changelog.js) para:
1. Actualizar el changelog principal [`CHANGELOG.md`](file:///Users/cesarayar/Documents/tlamatqui/CHANGELOG.md) en la raíz.
2. Garantizar la existencia de la carpeta [`changelog/`](file:///Users/cesarayar/Documents/tlamatqui/changelog).
3. Generar un extracto detallado de cambios por versión con el nombre `changelog/CHANGELOG-vx.x.md` (por ejemplo, `CHANGELOG-v2.5.5.md`).

### 🚨 Directiva de Ejecución al Finalizar Tareas
Al concluir cualquier tarea funcional o corrección, la IA **DEBE**:
1. Ejecutar `npm run auto-version`.
2. Preparar los archivos con `git add .`.
3. Crear el commit descriptivo: `git commit -m "<tipo>(<ámbito>): <descripción>"`.
