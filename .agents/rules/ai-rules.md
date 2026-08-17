# Reglas Principales de Inteligencia Artificial (IA) - Tlamatqui

Este directorio (`.agents/rules/`) contiene el sistema modular de reglas del proyecto **Tlamatqui**. Todo agente de IA (Antigravity, Gemini, Claude, etc.) DEBE consultar y obedecer estrictamente estas reglas en cada iteración de desarrollo.

---

## 📚 Índice de Reglas del Proyecto

1. **[ai-rules.md](file:///Users/cesarayar/Documents/tlamatqui/.agents/rules/ai-rules.md):** Índice principal y directivas de interacción.
2. **[commit-rules.md](file:///Users/cesarayar/Documents/tlamatqui/.agents/rules/commit-rules.md):** Formato obligatorios de Commits Convencionales, Auto-Versionado (`npm run auto-version`) y gestión de `changelog/CHANGELOG-vx.x.md`.
3. **[architecture-rules.md](file:///Users/cesarayar/Documents/tlamatqui/.agents/rules/architecture-rules.md):** Arquitectura desacoplada (Frontend React 19 / Vite 6 en `:3000`, Backend Express / Prisma en `:4000`) y tipado TypeScript estricto.
4. **[skills-guidelines.md](file:///Users/cesarayar/Documents/tlamatqui/.agents/rules/skills-guidelines.md):** Guía de ejecución para las 21 skills especializadas instaladas en `.agents/skills/`.
5. **[quality-verification.md](file:///Users/cesarayar/Documents/tlamatqui/.agents/rules/quality-verification.md):** Protocolo obligatorio de verificación (`npm run lint`, `npm run build`), prohibición de parches superficiales y diagnóstico basado en evidencia de logs.

---

## ⚡ Directiva General de Desarrollo

- **Documento Fuente de Verdad:** [`AGENTS.md`](file:///Users/cesarayar/Documents/tlamatqui/AGENTS.md) y [`GEMINI.md`](file:///Users/cesarayar/Documents/tlamatqui/GEMINI.md).
- **Prohibición:** NUNCA asumir datos, omitir verificaciones o realizar cambios sin ejecutar la sincronización de versión y el `git commit` correspondiente.
