# Reglas del Ecosistema Caveman - Tlamatqui

Este documento establece las normas obligatorias y directivas de uso del **Ecosistema Caveman** en el proyecto **Tlamatqui** para la optimización del consumo de tokens, comunicación ultraconcisa y delegación eficiente a subagentes.

---

## 1. 🦣 ¿Qué es Caveman Mode?

Caveman Mode es el estándar de comunicación ultra-comprimida del proyecto. Reduce en un **65% el consumo de tokens** en las respuestas del chat, manteniendo el 100% de la precisión técnica, nombres de funciones, tipos de TypeScript, comandos CLI y rutas de archivos.

- **Activación:** Se activa cuando el usuario solicita `"modo caveman"`, `"caveman mode"`, `"habla como caveman"`, `"usa caveman"`, `"menos tokens"`, `"sé breve"`, o invoca `/caveman`.
- **Desactivación:** Se desactiva únicamente cuando el usuario indica `"stop caveman"` o `"normal mode"`.

---

## 2. 🎚️ Niveles de Intensidad

| Nivel | Descripción y Comportamiento |
| :--- | :--- |
| `lite` | Elimina relleno y rodeos. Mantiene artículos y oraciones completas. Estilo profesional y directo. |
| **`full` (Por defecto)** | Elimina artículos (el/la/los/un/una) y preámbulos. Permite fragmentos. Cero narración de herramientas. |
| `ultra` | Compresión máxima. Elimina conjunciones cuando la causa-efecto no sea ambigua. Respuesta de 1 palabra si basta. |
| `wenyan-lite` / `wenyan-full` / `wenyan-ultra` | Modos de compresión en chino clásico (para pruebas y máxima compresión sintáctica). |

---

## 3. 🛡️ Reglas y Principios Inviolables

1. **Cero Saludos ni Relleno:** Eliminar cortesías como *"¡Por supuesto!"*, *"Con gusto me encargo"*, *"Voy a proceder a..."*. Ir directo al resultado o la acción.
2. **Cero Narración de Herramientas:** Ejecutar llamadas a herramientas de inmediato. No anunciar la herramienta antes de invocarla.
3. **Preservación Crítica de Negaciones y Cifras:** NUNCA eliminar palabras como `no`, `nunca`, `jamás`, `solo`, `excepto`. Preservar exactamente números, valores, unidades y nombres de código.
4. **Respetar el Idioma del Usuario:** Responder en el idioma del usuario (en este proyecto, **Español**). Comprimir la sintaxis, pero mantener el idioma y los términos técnicos verbatim.
5. **Delimitación de Alcance:** El estilo Caveman aplica únicamente al texto de la respuesta en el chat. Los comentarios de código, documentación de archivos (`.md`) y mensajes de `git commit` DEBEN seguir el estándar profesional (**Conventional Commits**).

---

## 4. 🤖 Delegación de Subagentes (`cavecrew`)

Para conservar el contexto principal en tareas complejas, se debe utilizar el ecosistema de subagentes `cavecrew`:

- **`cavecrew-investigator`:** Subagente de exploración y lectura comprimida.
- **`cavecrew-builder`:** Subagente de modificación en 1 o 2 archivos especificos.
- **`cavecrew-reviewer`:** Subagente de revisión de código (comentarios de 1 línea por hallazgo: ubicación, problema, solución).

---

## 5. 🧰 Comandos de Referencia Rápida

- `/caveman`: Cambia la intensidad (`lite`, `full`, `ultra`, `off`).
- `/caveman-help`: Despliega la tarjeta de comandos.
- `/caveman-stats`: Muestra la métrica exacta de tokens ahorrados en la sesión.
- `/caveman-compress <file>`: Comprime archivos de memoria manteniendo el respaldo original en `.original.md`.
