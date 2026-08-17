# Reglas de Calidad y Verificación - Tlamatqui

Este documento establece las normas obligatorias de control de calidad, diagnostico de errores y comandos de verificación para **Tlamatqui**.

---

## 1. 🛡️ Principios Generales de Calidad

1. **Nunca Asumir ni Adivinar:** Inspecciona la definición exacta de componentes, tipos y endpoints antes de modificar código.
2. **Cero Parches Superficiales:** Prohibido silenciar excepciones con `try/catch` vacíos, comentar test que fallan o retornar valores falsos en fallback sin resolver la causa raíz.
3. **Diagnóstico Basado en Logs:** Lee el stack trace completo y los logs empíricos antes de emitir cualquier hipótesis de fallo.

---

## 2. ✅ Comandos Obligatorios de Verificación

Antes de dar por concluida cualquier tarea, la IA DEBE ejecutar los siguientes comandos:

- **Verificación de Tipos TypeScript:**
  ```bash
  npm run lint
  ```
- **Compilación Completa (Frontend + Backend):**
  ```bash
  npm run build
  ```
- **Sincronización de Versión y Changelog:**
  ```bash
  npm run auto-version
  ```

---

## 3. 🎯 Criterios de Aceptación para Entregables

Toda entrega se considera completa ÚNICAMENTE cuando:
1. El código compila sin errores de TypeScript (`npm run lint`).
2. El build de producción se genera limpiamente (`npm run build`).
3. Se ejecuto `npm run auto-version` actualizando los metadatos de versión y changelog.
4. Se realizó el `git commit` correspondiente siguiendo Conventional Commits.
