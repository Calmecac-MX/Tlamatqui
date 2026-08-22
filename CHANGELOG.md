# Changelog - Tlamatqui

Todos los cambios notables en este proyecto son documentados automáticamente de acuerdo con **Conventional Commits** y **Release Please**.

---

## [v2.5.40 (Frontend) / v2.5.31 (Backend)] - 2026-08-22

### 🚀 Features & Nuevas Funcionalidades
- **superadmin:** añadir consola exclusiva de salud, monitoreo, BD, API keys y bloqueo maestro de API (v2.5.39/v2.5.31) (`c1eafeb`)

## [v2.5.39 (Frontend) / v2.5.31 (Backend)] - 2026-08-22

### 🚀 Features & Nuevas Funcionalidades
- **auth:** permitir selección de rol en invitaciones con restricción exclusiva para Superusuario (v2.5.38/v2.5.30) (`aa840a1`)

## [v2.5.38 (Frontend) / v2.5.30 (Backend)] - 2026-08-22

### 🚀 Features & Nuevas Funcionalidades
- **auth:** asignación automática del rol de Superusuario al primer usuario creado (v2.5.37/v2.5.29) (`37da546`)

## [v2.5.37 (Frontend) / v2.5.29 (Backend)] - 2026-08-22

### 🚀 Features & Nuevas Funcionalidades
- **auth:** habilitar sincronización dinámica de perfiles multi-usuario Auth0 (v2.5.36/v2.5.28) (`47d1cf2`)

## [v2.5.36 (Frontend) / v2.5.28 (Backend)] - 2026-08-22

### 🚀 Features & Nuevas Funcionalidades
- **config:** habilitar arquitectura de dominio único Same-Origin para API REST y Frontend (v2.5.35/v2.5.28) (`f6224e9`)
- **auth:** agregar endpoint GET /api/auth/callback y soporte de rutas de callback (v2.5.35/v2.5.28) (`cad72fa`)

## [v2.5.35 (Frontend) / v2.5.28 (Backend)] - 2026-08-22

### 🐛 Corregido & Bug Fixes
- **auth:** prevenir bucle de redirección en Auth0 y desplegar alertas de error (v2.5.34) (`7e46676`)

## [v2.5.34 (Frontend) / v2.5.27 (Backend)] - 2026-08-22

### 🐛 Corregido & Bug Fixes
- **cors:** resolver conflicto de cabeceras CORS en produccion y vercel (`fc9a791`)

### ♻️ Refactorización de Código
- **env:** depurar variables obsoletas u opcionales de .env.example (`0c6618f`)

### 📚 Documentación
- **env:** actualizar campo SMTP_FROM a Reportes Tlamatqui <no-respondas@calmecac.lat> (`b42736e`)
- **env:** agregar .env.vercel con variables de produccion listas para vercel (`73d9ef3`)
- **env:** consolidar plantilla .env.example alineada a la arquitectura desacoplada (`61bc622`)
- **env:** actualizar .env.example para entornos de desarrollo y produccion (`b36c7a8`)

### 🔧 Tareas Operativas y Mantenimiento
- **git:** actualizar regla de ignorado para .env.vercel en .gitignore (`45466de`)

## [v2.5.33 (Frontend) / v2.5.27 (Backend)] - 2026-08-22

### 🐛 Corregido & Bug Fixes
- **auth:** preservar parametros de autenticacion auth0 en redireccion de produccion (`c3d89a2`)

## [v2.5.33 (Frontend) / v2.5.26 (Backend)] - 2026-08-22

### 🐛 Corregido & Bug Fixes
- **vercel:** eliminar el bloque de funciones redundante para resolver el error de coincidencia de patrones en vercel CLI (`349f3eb`)

### ⚡ Optimización y Rendimiento
- **build:** fijar version de Node a 24.x y optimizar fragmentacion de chunks en Vite para Vercel (`1a3b6eb`)

### ♻️ Refactorización de Código
- **env:** conservar la variable CORS_ORIGIN para configuracion explicita de origenes (`31cc261`)

## [v2.5.32 (Frontend) / v2.5.26 (Backend)] - 2026-08-22

### ♻️ Refactorización de Código
- **env:** depurar CORS_ORIGIN redundante y consolidar plantilla .env.example (`38198b4`)

## [v2.5.32 (Frontend) / v2.5.25 (Backend)] - 2026-08-22

### ♻️ Refactorización de Código
- **env:** eliminar variable redundante BACKEND_URL (`0c2b20d`)

## [v2.5.32 (Frontend) / v2.5.24 (Backend)] - 2026-08-22

### ♻️ Refactorización de Código
- **env:** depurar variables de entorno redundantes y ajustar codigo a la estructura unificada fullstack (`031a570`)

## [v2.5.32 (Frontend) / v2.5.23 (Backend)] - 2026-08-22

### ♻️ Refactorización de Código
- **architecture:** reunificar la aplicacion en una sola estructura unificada fullstack que se despliega junta (`de708a8`)

### 📚 Documentación
- **readme:** redactar README.md completo y actualizar arquitectura docker y reglas de IA para la estructura unificada fullstack (`6765cb5`)
- **ai:** actualizar documentacion de la arquitectura unificada fullstack (`ee2cc57`)

### 🔧 Tareas Operativas y Mantenimiento
- **clean:** eliminar directorio .claude no utilizado (`7d2276b`)

## [v2.5.31 (Frontend) / v2.5.22 (Backend)] - 2026-08-22

### ♻️ Refactorización de Código
- **env:** unificar variables FRONTEND_URL, APP_URL y APP_BASE_URL en la variable unica FRONTEND_URL (`839cd5e`)

### 📚 Documentación
- **ai:** actualizar versiones en AGENTS.md y GEMINI.md (`6e7bafb`)

## [v2.5.30 (Frontend) / v2.5.21 (Backend)] - 2026-08-22

### ♻️ Refactorización de Código
- **architecture:** migrar repositorio a arquitectura monorepo desacoplada con NPM Workspaces (apps/frontend y apps/backend) (`b31f584`)

### 📚 Documentación
- **ai:** actualizar arquitectura monorepo en AGENTS.md (`5fc4f5c`)

### 🔧 Tareas Operativas y Mantenimiento
- **clean:** eliminar archivos obsoletos de la raiz y ordenar la estructura del monorepo (`6bad3b4`)

## [v2.5.30 (Frontend) / v2.5.20 (Backend)] - 2026-08-22

### 🚀 Features & Nuevas Funcionalidades
- **auth:** integrar servicio y widget modal de Auth0 Lock (`a6dace1`)

### 📚 Documentación
- **auth:** actualizar documentacion e instalacion de paquetes de auth0-lock (`1332813`)

## [v2.5.29 (Frontend) / v2.5.19 (Backend)] - 2026-08-22

### 🚀 Features & Nuevas Funcionalidades
- **docker:** agregar docker-compose.backend.yml exclusivo para el servicio de backend y postgres (`cb1d3ad`)

### 🐛 Corregido & Bug Fixes
- **build:** reemplazar enlaces simbolicos rotos de skills por directorios reales para vercel build (`3ec6ff8`)
- **ci:** añadir token configurable para release-please action (`b171884`)

### 📚 Documentación
- **release:** actualizar cabeceras de version de cerebros a v2.5.28 / v2.5.19 (`858df79`)

### 🔧 Tareas Operativas y Mantenimiento
- **release:** v2.5.28 (Frontend) / v2.5.19 (Backend) (`6d02bfd`)

## [v2.5.28 (Frontend) / v2.5.19 (Backend)] - 2026-08-20

### 🚀 Features & Nuevas Funcionalidades
- **prisma:** actualizar paquete y cliente a Prisma 7.9.1 con soporte para prisma.config.ts (v2.5.27 / v2.5.18) (`5a43e5e`)

### 🐛 Corregido & Bug Fixes
- **ci:** corregir sintaxis YAML de comillas en titulo de docker-publish workflow (`bd08b33`)

### 📚 Documentación
- **rules:** añadir regla obligatoria de envio de cambios via PR con aprobacion explicita (`1a35785`)
- **ci:** actualizar documentacion de cerebros con permisos de docker-publish workflow (`34aaf4b`)

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
