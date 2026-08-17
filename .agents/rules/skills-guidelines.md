# Directivas de Uso de Skills Instaladas - Tlamatqui

El repositorio cuenta con 21 skills especializadas en `.agents/skills/`. Todo agente de IA debe aplicar la skill adecuada según la naturaleza de la tarea:

---

## 🧰 Matriz de Skills por Categoría

| Categoría | Skill | Cuándo Activar / Usar | Directiva de Ejecución |
| :--- | :--- | :--- | :--- |
| **Diagnóstico** | `investigate-first` | Errores desconocidos o fallos intermitentes. | Formular hipótesis basadas en evidencias y logs ANTES de editar código. |
| **Parches** | `surgical-patch` | Corrección de bugs puntuales. | Aplicar el arreglo mínimo responsable sin alterar código no relacionado. |
| **Refactor** | `safe-refactor` | Reestructuración de módulos. | Preservar el comportamiento funcional y validar con `npm run lint`. |
| **Nuevas Features** | `lean-build` | Desarrollo de nuevos endpoints o pantallas. | Evitar sobre-ingeniería, reutilizar librerías y definir límite de alcance. |
| **Migraciones** | `migration` | Cambios en DB Prisma, API o configs. | Diseñar migraciones reversibles con compatibilidad hacia atrás. |
| **Verificación** | `verify-and-stop` | Finalizar tareas o auditoría. | Verificar compilación (`npm run lint` / `npm run build`), reportar y detener. |
| **Auth0** | `author-auth0-skill` | Cambios en autenticación o flujos Auth0. | Seguir la estructura estandarizada de rutas y validaciones Auth0. |
| **Commits** | `commit-writer` / `caveman-commit` | Redactar mensajes de commit. | Aplicar Conventional Commits y auto-versionado (`.agents/skills/commit-writer/`). |
| **Subagentes** | `cavecrew` | Tareas aisladas de exploración/edición. | Invocar `cavecrew-investigator`, `cavecrew-builder` o `cavecrew-reviewer`. |
| **Exploración** | `caveman-explore` | Búsqueda amplia en repositorios grandes. | Búsquedas de solo lectura en subcontextos. |
| **Monitoreo & Token Cost** | Ecosistema `caveman` | Monitoreo, compresión y optimización. | Reducir consumo de tokens preservando la precisión técnica. |
