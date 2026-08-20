# Changelog - Tlamatqui

Todos los cambios notables en este proyecto son documentados automáticamente de acuerdo con **Conventional Commits** y **Release Please**.

---

## [v2.5.27 (Frontend) / v2.5.18 (Backend)] - 2026-08-20

*Actualización de estabilidad, sincronización de versiones y optimización de componentes.*

## [v2.5.26 (Frontend) / v2.5.18 (Backend)] - 2026-08-20

### 🚀 Features & Nuevas Funcionalidades
- **security:** aplicar cifrado transparente de datos sensibles en reposo mediante ENCRYPTION_KEY en la capa de persistencia (v2.5.26 / v2.5.17) (`e0319fa`)

### 🔧 Tareas Operativas y Mantenimiento
- **prisma:** crear archivo de configuracion prisma.config.ts para soporte oficial de Prisma CLI y Language Server (`562e5f5`)

## [v2.5.26 (Frontend) / v2.5.17 (Backend)] - 2026-08-19

### 🚀 Features & Nuevas Funcionalidades
- **security:** integrar servicio de encriptacion AES-256-GCM y firmas HMAC utilizando ENCRYPTION_KEY (v2.5.26 / v2.5.16) (`94151da`)

## [v2.5.26 (Frontend) / v2.5.16 (Backend)] - 2026-08-19

### 🚀 Features & Nuevas Funcionalidades
- **security:** implementar token secreto x-api-secret para comunicacion cliente-servidor (v2.5.26 / v2.5.15) (`b55abeb`)

## [v2.5.26 (Frontend) / v2.5.15 (Backend)] - 2026-08-19

### 🚀 Features & Nuevas Funcionalidades
- **changelog:** agregar soporte de archivos por versión en changelog/ y regla obligatoria de commits (`9c1618d`)

### ⚡ Optimización y Rendimiento
- **changelog:** optimizar generación de changelogs y reducir peso del repositorio v2.5.25 (`d930dc4`)

### 📚 Documentación
- **changelog:** actualizar changelog con registro de Licencia AGPL-3.0 (`a8a6db3`)
- **changelog:** actualizar changelog con cambios de Configuración de Branding (`ef436d7`)
- **changelog:** actualizar changelog tras establecer directiva de cerebros (`d501d0f`)
- **changelog:** actualizar changelog con registro de cerebros y datos (`7bbfff4`)
- **changelog:** actualizar changelog con el titulo Tlamatqui (`6e03064`)
- **changelog:** actualizar changelog tras revision de .gitignore (`5aca9ed`)
- **changelog:** sincronizar registro de changelog con ultimo commit (`23b0d7c`)
- **changelog:** actualizar CHANGELOG.md y extractos por version (`367af3b`)
- **changelog:** actualizar changelog con regla de Caveman Mode (`a0b0910`)
- **changelog:** actualizar changelog con la creación del sistema modular de reglas (`50d1ab7`)
- **changelog:** registrar cambios de versión v2.5.5 en changelogs (`ece4511`)
- **rules:** actualizar nombre del proyecto a Tlamatqui en la ruta de la IA y documentación (`4248b88`)
- **changelog:** actualizar changelog raíz y archivos por versión con último commit (`50cc9ce`)

### 🔧 Tareas Operativas y Mantenimiento
- remove legacy project documentation and architecture proposal files (`3f5bc24`)

## [v2.5.25 (Frontend) / v2.5.14 (Backend)] - 2026-08-19

### 🚀 Features & Nuevas Funcionalidades
- **auth:** rediseñar LoginPage para Auth0 Universal Login exclusivo con logo de instancia (`535cebf`)
- **config:** agregar campos para logos 2 y 3 en configuración global (`50d9942`)
- **teams:** permitir invitar miembros a un equipo a traves de un enlace corto (`4cbf1e9`)
- **dns:** auto-registrar dominio automaticamente en Vercel API al guardar o consultar (`b9d2695`)
- **dns:** integrar API de Vercel para auto-aprovisionamiento y diagnostico en vivo 4-checkpoints (`4960fe7`)
- **config:** agregar compartir reportes en dominio personalizado con verificacion TXT (`b59d9b4`)
- **ui:** establecer titulo dinamico del reporte web como Reporte de {{marca}} | Tlamatqui (`94939d0`)
- **smtp:** implementar servicio de envio de reportes por correo electronico via SMTP (`d7b5ff8`)
- **admin:** actualizar etiqueta a Configuración de Branding y remover campo de archivo/URL de logo (`5a77c92`)
- **ui:** actualizar el titulo de la pestana a Tlamatqui (`c8b91a4`)
- **env:** configurar variables de entorno y soporte CORS para ejecucion desacoplada (`7483b73`)
- **rules:** crear regla dedicada para el ecosistema Caveman en .agents/rules/caveman-rules.md (`c411890`)
- **rules:** crear sistema modular de reglas de IA en .agents/rules/ (`1023197`)

### ♻️ Refactorización de Código
- **admin:** renombrar panel de administracion a Tlachiālōyan y establecer slug /tlachialoyan (`b8d3612`)

### 📚 Documentación & Reglas
- **changelog:** actualizar changelog con renombrado Tlachiālōyan y slug /tlachialoyan (`14064e3`)
- **changelog:** actualizar changelog con titulo dinamico de reporte por marca (`4e990c3`)
- **changelog:** actualizar changelog con la funcionalidad SMTP (`1b1490b`)
- **rules:** establecer directiva obligatoria de registro en cerebros y documentacion IA (`c3d1797`)
- **context:** actualizar el contexto de los cerebros y datos del proyecto (`d720ce3`)

### 🔧 Tareas Operativas y Mantenimiento
- **license:** añadir licencia GNU Affero General Public License v3.0 (AGPL-3.0) (`d216ee0`)
- **git:** actualizar .gitignore con reglas de ignorado estructuradas (`dad0315`)

## [v2.5.0 (Frontend) / v2.5.0 (Backend)] - 2026-08-16

*Versión inicial de la plataforma Tlamatqui con arquitectura desacoplada React 19/Vite 6 y Express/Prisma ORM.*
