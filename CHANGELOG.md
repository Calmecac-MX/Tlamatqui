# Changelog - Tlamatqui

Todos los cambios notables en este proyecto son documentados automáticamente de acuerdo con **Conventional Commits** y **Release Please**.

---

## [2.6.0](https://github.com/Calmecac-MX/Tlamatqui/compare/tlamatqui-v2.5.0...tlamatqui-v2.6.0) (2026-09-05)


### 🚀 Features & Nuevas Funcionalidades

* **admin:** actualizar etiqueta a Configuración de Branding y remover campo de archivo/URL de logo ([5a77c92](https://github.com/Calmecac-MX/Tlamatqui/commit/5a77c924be692ac946c8caff65e800762391d5a2))
* **api:** habilitar endpoint dedicado POST /api/factory-reset para ejecuciones programáticas (v2.5.44/v2.5.39) ([6f8d811](https://github.com/Calmecac-MX/Tlamatqui/commit/6f8d8118f2e3448e963206fbd7cec9bb71d7e1ad))
* **api:** resolve technology icons and favicons automatically in report and scraping responses ([9d440fb](https://github.com/Calmecac-MX/Tlamatqui/commit/9d440fb1240ae971f596d794d1d81be6019f2b03))
* **auth0:** almacenar metadatos de tokens, expiración y último login en la tabla User (v2.5.43/v2.5.36) ([ee7d4be](https://github.com/Calmecac-MX/Tlamatqui/commit/ee7d4bea9e92f5bf72b662d98e4a78691ba801db))
* **auth:** agregar endpoint GET /api/auth/callback y soporte de rutas de callback (v2.5.35/v2.5.28) ([cad72fa](https://github.com/Calmecac-MX/Tlamatqui/commit/cad72fa3e50a3d88d95aad2f72ad4e9fe8f27445))
* **auth:** agregar soporte para la variable SUPERADMIN_EMAIL en .env para asignación automática de Superusuario (v2.5.41/v2.5.32) ([7c39ee9](https://github.com/Calmecac-MX/Tlamatqui/commit/7c39ee93ddb0a4e236cd001bedb77c23ad4653ef))
* **auth:** asignación automática del rol de Superusuario al primer usuario creado (v2.5.37/v2.5.29) ([37da546](https://github.com/Calmecac-MX/Tlamatqui/commit/37da54669ad71ca05d2a2a1327a8d8a5a4a6f2fd))
* **auth:** bloquear modificacion de roles en perfil de usuario y restringir edicion a administradores ([f29fd8f](https://github.com/Calmecac-MX/Tlamatqui/commit/f29fd8fe82a8b843fcf41258b204324ad25ddae7))
* **auth:** garantizar la permanencia perpetua del rol superusuario entre actualizaciones v2.5.60 ([127b9a0](https://github.com/Calmecac-MX/Tlamatqui/commit/127b9a07e216e4dd856505c3f6d525126a806ef0))
* **auth:** habilitar sincronización dinámica de perfiles multi-usuario Auth0 (v2.5.36/v2.5.28) ([47d1cf2](https://github.com/Calmecac-MX/Tlamatqui/commit/47d1cf2a82318a68f0f0a9c5cdeee2b532989c09))
* **auth:** integrar pagina dedicada de invitacion a equipo con registro Auth0 y auto-vinculacion ([37a0546](https://github.com/Calmecac-MX/Tlamatqui/commit/37a054643da4a72a87942f46cd905172b033d0b2))
* **auth:** integrar servicio y widget modal de Auth0 Lock ([a6dace1](https://github.com/Calmecac-MX/Tlamatqui/commit/a6dace1104f18939d3cd8788d23d99ec3e0f4980))
* **auth:** ocultar centro superusuario para administradores y restringirlo exclusivamente a superusuarios ([e85baf6](https://github.com/Calmecac-MX/Tlamatqui/commit/e85baf61d5f42d8136e8c5daf1c6cc7e8629f9cf))
* **auth:** ocultar tarjeta de configuración de dominios a usuarios no administradores v2.5.59 ([5cf6e9c](https://github.com/Calmecac-MX/Tlamatqui/commit/5cf6e9c1156d5e178249be34ee8bf6f2b28e5b51))
* **auth:** permitir selección de rol en invitaciones con restricción exclusiva para Superusuario (v2.5.38/v2.5.30) ([aa840a1](https://github.com/Calmecac-MX/Tlamatqui/commit/aa840a150d025d24e5332c2294967a38c4eeaa79))
* **auth:** rediseñar LoginPage para Auth0 Universal Login exclusivo con logo de instancia v2.5.25 ([535cebf](https://github.com/Calmecac-MX/Tlamatqui/commit/535cebf95d9528fea0fcd09a2acde37ce1eef8e4))
* **changelog:** agregar soporte de archivos por versión en changelog/ y regla obligatoria de commits ([9c1618d](https://github.com/Calmecac-MX/Tlamatqui/commit/9c1618df88dfe389fc75f6def1b25f4830f6844f))
* **config:** agregar campos para logos 2 y 3 en configuración global ([50d9942](https://github.com/Calmecac-MX/Tlamatqui/commit/50d9942ca5345a909293e0cb5a53372f5d4674d0))
* **config:** agregar compartir reportes en dominio personalizado con verificacion TXT (Frontend v2.5.20 / Backend v2.5.10) ([b59d9b4](https://github.com/Calmecac-MX/Tlamatqui/commit/b59d9b4ea65512d4409b0d98dda3ce3a026a002e))
* **config:** agregar opcion para activar o desactivar dominio personalizado y prevenir llamadas a Vercel ([23addcf](https://github.com/Calmecac-MX/Tlamatqui/commit/23addcf86e7e5ef9f2ffca8f16359dd6213c6d79))
* **config:** habilitar arquitectura de dominio único Same-Origin para API REST y Frontend (v2.5.35/v2.5.28) ([f6224e9](https://github.com/Calmecac-MX/Tlamatqui/commit/f6224e9e444f1ad951b1a09a368f97d73e27b0a2))
* **db:** sincronizar edicion de aplicaciones y funciones comparativas con la base de datos (Frontend v2.5.64) ([5d9e7b8](https://github.com/Calmecac-MX/Tlamatqui/commit/5d9e7b8e97818da0c8fdd1b194cf27b8c8d240f5))
* **diagnostics:** add automatic store audit modal powered by Chismografo API ([dd76a08](https://github.com/Calmecac-MX/Tlamatqui/commit/dd76a0869f697bf21a1c156544d3183fd259d969))
* **dns:** auto-registrar dominio automaticamente en Vercel API al guardar o consultar (Frontend v2.5.22 / Backend v2.5.12) ([b9d2695](https://github.com/Calmecac-MX/Tlamatqui/commit/b9d269535375b30d31f31b51b9c9894e9593048c))
* **dns:** integrar API de Vercel para auto-aprovisionamiento y diagnostico en vivo 4-checkpoints (Frontend v2.5.21 / Backend v2.5.11) ([4960fe7](https://github.com/Calmecac-MX/Tlamatqui/commit/4960fe72527330e8cda41f21b424f3bc11513b46))
* **docker:** agregar docker-compose.backend.yml exclusivo para el servicio de backend y postgres ([cb1d3ad](https://github.com/Calmecac-MX/Tlamatqui/commit/cb1d3adce4400aa52047dfc1b8d41c88cc641526))
* **email:** integrar servicio de envio de correos via brevo api v3 ([e2c2548](https://github.com/Calmecac-MX/Tlamatqui/commit/e2c2548904726fec93f308845e3ed4796085d570))
* **email:** rediseñar plantillas de correo con estilo Calmécac v2.5.54 ([61937e6](https://github.com/Calmecac-MX/Tlamatqui/commit/61937e6faa5d06667974bb7d5ad4c7b31b0af990))
* **env:** configurar variables de entorno y soporte CORS para ejecucion desacoplada ([7483b73](https://github.com/Calmecac-MX/Tlamatqui/commit/7483b730bbc7653b0ca2bcfa00fb774c50514769))
* **prisma:** actualizar paquete y cliente a Prisma 7.9.1 con soporte para prisma.config.ts (v2.5.27 / v2.5.18) ([5a43e5e](https://github.com/Calmecac-MX/Tlamatqui/commit/5a43e5eb6afac6382859e1f11556212c436ad310))
* **realtime:** filtrar bitacora de interacciones a aperturas, navegacion y descargas del reporte (Frontend v2.5.63) ([eb97779](https://github.com/Calmecac-MX/Tlamatqui/commit/eb97779c2c1c298a5df6083ca56e9d37cc4ea1b4))
* **report-cover:** vincular el nombre del comercio en el título de la portada con su sitio web ([bbf62d6](https://github.com/Calmecac-MX/Tlamatqui/commit/bbf62d660815e2d4b2c2a2f351f45eb78097937c))
* **report:** add cover screenshots, web speed simulator, and interactive pricing tier selection ([09ef603](https://github.com/Calmecac-MX/Tlamatqui/commit/09ef603073c040cc4282587559a827403df00ba3))
* **report:** añadir exportación a hoja de cálculo Excel (.xlsx), CSV estilizado y Markdown (.md) v2.5.55 ([cd0928b](https://github.com/Calmecac-MX/Tlamatqui/commit/cd0928b5b8f232ff4359c9113dd77f4c6b2bf7bb))
* **report:** integrar esquema extendido de chismografo con pagespeed y screenshots ([9957475](https://github.com/Calmecac-MX/Tlamatqui/commit/99574750fc70702f839314a5c84b017ba40040dc))
* **roles:** integrar rol Agente, visibilidad restringida por vendedor y ranking de rendimiento comercial ([a44e8ea](https://github.com/Calmecac-MX/Tlamatqui/commit/a44e8ea7e5ab8168c43ddef87890ba2961657f70))
* **rules:** crear regla dedicada para el ecosistema Caveman en .agents/rules/caveman-rules.md ([c411890](https://github.com/Calmecac-MX/Tlamatqui/commit/c411890ec346d3d23984fcf83e0df47c7917e618))
* **rules:** crear sistema modular de reglas de IA en .agents/rules/ ([1023197](https://github.com/Calmecac-MX/Tlamatqui/commit/1023197a230480a18ec66223f7ceb563cc864211))
* **security:** aplicar cifrado transparente de datos sensibles en reposo mediante ENCRYPTION_KEY en la capa de persistencia (v2.5.26 / v2.5.17) ([e0319fa](https://github.com/Calmecac-MX/Tlamatqui/commit/e0319fa78aaf8bd88274f62b1291fe3ca7e9abed))
* **security:** implementar token secreto x-api-secret para comunicacion cliente-servidor (v2.5.26 / v2.5.15) ([b55abeb](https://github.com/Calmecac-MX/Tlamatqui/commit/b55abeb91394a9e8238c1059ad0e9a72826af4b2))
* **security:** integrar servicio de encriptacion AES-256-GCM y firmas HMAC utilizando ENCRYPTION_KEY (v2.5.26 / v2.5.16) ([94151da](https://github.com/Calmecac-MX/Tlamatqui/commit/94151da430e87ac851663b3317a8576e88ce4041))
* **skills:** añadir la skill de prisma para antigravity ([e12c18d](https://github.com/Calmecac-MX/Tlamatqui/commit/e12c18da307d24e95df5d425568401527afa762b))
* **smtp:** implementar servicio de envio de reportes por correo electronico via SMTP ([d7b5ff8](https://github.com/Calmecac-MX/Tlamatqui/commit/d7b5ff87e399798308c8ceb44ee6c7d8b2bdbb5f))
* **superadmin:** agregar gestión de usuarios, vista de equipos y modal de detalles de usuario para Superusuario (v2.5.40/v2.5.31) ([2908175](https://github.com/Calmecac-MX/Tlamatqui/commit/2908175cab10e13b451b94dd7079650d279995d4))
* **superadmin:** añadir consola exclusiva de salud, monitoreo, BD, API keys y bloqueo maestro de API (v2.5.39/v2.5.31) ([c1eafeb](https://github.com/Calmecac-MX/Tlamatqui/commit/c1eafeb1e81b56f433a03b9a6163bd8c3e50d6e6))
* **superadmin:** implementar función y panel de Restablecimiento a Configuración de Fábrica (v2.5.42/v2.5.35) ([699b4d9](https://github.com/Calmecac-MX/Tlamatqui/commit/699b4d91c1f26032275ce5c05e54a0fc01377c9e))
* **superadmin:** trasladar la configuración de Marca Blanca y Dominio Personalizado a la consola de Superusuario (v2.5.41/v2.5.31) ([f8b877a](https://github.com/Calmecac-MX/Tlamatqui/commit/f8b877a4a68647e56159770787f4bf57ac946e03))
* **teams:** agregar envio de invitaciones a miembros por correo electronico ([14c7488](https://github.com/Calmecac-MX/Tlamatqui/commit/14c7488e12cadb852fda125fc3056f06b8c5a583))
* **teams:** añadir configuración del reporte con marca teamBrand* y gestión de aliados ([59358fa](https://github.com/Calmecac-MX/Tlamatqui/commit/59358face59b29de0e3c7de55a71a0f63f13310e))
* **teams:** permitir invitar miembros a un equipo a traves de un enlace corto (Frontend v2.5.23 / Backend v2.5.13) ([4cbf1e9](https://github.com/Calmecac-MX/Tlamatqui/commit/4cbf1e9af1eba5bfb5ffec5aae9e13bee6aa0130))
* **ui:** actualizar el titulo de la pestana a Tlamatqui ([c8b91a4](https://github.com/Calmecac-MX/Tlamatqui/commit/c8b91a4ad6091c0669bcc6f9de7e48a909a4069d))
* **ui:** establecer titulo dinamico del reporte web como Reporte de {{marca}} | Tlamatqui ([94939d0](https://github.com/Calmecac-MX/Tlamatqui/commit/94939d0758d569e0c44489ad502eaad780ed1af2))


### 🐛 Corregido & Bug Fixes

* **auth:** preservar los roles asignados por cuenta e impedir que la configuración global los sobrescriba v2.5.61 ([04f333b](https://github.com/Calmecac-MX/Tlamatqui/commit/04f333b1b321f3390b363abcb162cf2f19a87072))
* **auth:** preservar parametros de autenticacion auth0 en redireccion de produccion ([c3d89a2](https://github.com/Calmecac-MX/Tlamatqui/commit/c3d89a2abc37fd14ad977a38dbf511eb9313a2d5))
* **auth:** prevenir bucle de redirección en Auth0 y desplegar alertas de error (v2.5.34) ([7e46676](https://github.com/Calmecac-MX/Tlamatqui/commit/7e4667699fda7c8abd8fb35e6b135d04d7f6afcb))
* **auth:** restringir la adición y configuración de dominios a administradores y superusuarios v2.5.58 ([7c54a55](https://github.com/Calmecac-MX/Tlamatqui/commit/7c54a55429afd69e816d1358cdba3e6dde3947b8))
* **build:** reemplazar enlaces simbolicos rotos de skills por directorios reales para vercel build ([3ec6ff8](https://github.com/Calmecac-MX/Tlamatqui/commit/3ec6ff84cea5cc38bb2737f64d2a7ef46bdca2ed))
* **ci:** añadir token configurable para release-please action ([b171884](https://github.com/Calmecac-MX/Tlamatqui/commit/b1718848e0d46885574b47aca60f3f2d201b05ba))
* **ci:** corregir sintaxis YAML de comillas en titulo de docker-publish workflow ([bd08b33](https://github.com/Calmecac-MX/Tlamatqui/commit/bd08b332e5ca1e63374abbc8dd711488eee71644))
* **cors:** resolver conflicto de cabeceras CORS en produccion y vercel ([fc9a791](https://github.com/Calmecac-MX/Tlamatqui/commit/fc9a79142daf490e7609c7f4b378f40c8233d479))
* **prisma:** integrar driver adapter de pg en Prisma 7 y sincronizar esquema DB ([79964e8](https://github.com/Calmecac-MX/Tlamatqui/commit/79964e86c3b75e744ff344e7230e8cacc3f2895b))
* **reports:** corregir persistencia, invalidación de caché y sincronización en guardado de reportes ([6a2ab69](https://github.com/Calmecac-MX/Tlamatqui/commit/6a2ab69518109fc28164c4f90c95c26eff643521))
* **serverless:** asegurar fallback seguro en PrismaClient singleton e invocar restablecimiento (v2.5.44/v2.5.40) ([1b9b640](https://github.com/Calmecac-MX/Tlamatqui/commit/1b9b64084055a88d4937012cf8c6c914d9dbf4be))
* **share:** remover sección de verificación DNS, recuadro de dominio predeterminado y píldora de modo compartible v2.5.57 ([30606cf](https://github.com/Calmecac-MX/Tlamatqui/commit/30606cfbf8b36711977352cdcf3d3db05cfefae5))
* **share:** simplificar modal de compartir usando únicamente URL predeterminada y remover botón de vista previa v2.5.56 ([cfa6a4a](https://github.com/Calmecac-MX/Tlamatqui/commit/cfa6a4a001ce45951a9023516848cf0107f94a5f))
* **team-settings:** eliminar bloque general de equipo del formulario de configuración del reporte ([bd3f966](https://github.com/Calmecac-MX/Tlamatqui/commit/bd3f966cbf5689dad3b8e2a8221d9b224f2f51c2))
* **team:** incluir superusuario en contador de administradores (Frontend v2.5.62) ([da0dee2](https://github.com/Calmecac-MX/Tlamatqui/commit/da0dee235521a64266a07da8dded551b4b3929cf))
* **teams:** corregir rol residual Editor por Agente en datos por defecto de equipos ([82cc83c](https://github.com/Calmecac-MX/Tlamatqui/commit/82cc83c43f263829804af5b2f654982af575ceaf))
* **tools:** restringir edicion de aplicaciones existentes a solo precio y permitir agregar nuevas (Frontend v2.5.65) ([9707f7b](https://github.com/Calmecac-MX/Tlamatqui/commit/9707f7b8e4c8c505b173d7bb3de7ba863726d870))
* **vercel:** corregir especificador de importación en api/index.ts (../server.js) para evitar ERR_MODULE_NOT_FOUND en Serverless Functions ([a386cb6](https://github.com/Calmecac-MX/Tlamatqui/commit/a386cb629d32cfd562422614e5cf3ea6eae23dd4))
* **vercel:** eliminar el bloque de funciones redundante para resolver el error de coincidencia de patrones en vercel CLI ([349f3eb](https://github.com/Calmecac-MX/Tlamatqui/commit/349f3eb3009785cc269431e1b7f839b14f43a7ee))


### ⚡ Optimización y Rendimiento

* **api:** optimizar API REST con cache en RAM TTL de 3s e invalidacion automatica de consultas ([ea5d352](https://github.com/Calmecac-MX/Tlamatqui/commit/ea5d352de2ff55493c2aa1a25601b38d761b932e))
* **build:** fijar version de Node a 24.x y optimizar fragmentacion de chunks en Vite para Vercel ([1a3b6eb](https://github.com/Calmecac-MX/Tlamatqui/commit/1a3b6eb4d59bf2f355cd258dd6ec23e59f2ae875))
* **changelog:** optimizar generación de changelogs y reducir peso del repositorio v2.5.25 ([d930dc4](https://github.com/Calmecac-MX/Tlamatqui/commit/d930dc4724e94ccd0e272263d14d7ca32f3186e5))
* **config:** optimizar endpoint /api/config con cache de lectura en RAM y encabezados HTTP ([033ae52](https://github.com/Calmecac-MX/Tlamatqui/commit/033ae527b0d546a08339cbe6901b68597c4f6e83))
* **core:** implementar timeouts estrictos sub-5s en DB, Brevo y SMTP para garantizar respuestas ultra rapidas ([7d09c54](https://github.com/Calmecac-MX/Tlamatqui/commit/7d09c5419dcba635ea89c86b18ddcbe0c84608b1))
* **core:** optimizar rendimiento fullstack con memory cache json, gzip middleware y code-splitting frontend ([9232a20](https://github.com/Calmecac-MX/Tlamatqui/commit/9232a2092505b8cf6e4f779155fb5f1e45986648))
* **vercel:** ampliar maxDuration a 60s y optimizar inicializacion serverless ([84749b4](https://github.com/Calmecac-MX/Tlamatqui/commit/84749b4d0e021f45c29b990107a4109681c81f1d))


### ♻️ Refactorización de Código

* **admin:** mover edición de matriz comparativa a configuración y simplificar wizard de diagnóstico ([7961149](https://github.com/Calmecac-MX/Tlamatqui/commit/7961149546dc68778907bafd7449e6ee2f2561ec))
* **admin:** renombrar panel de administracion a Tlachiālōyan y establecer slug /tlachialoyan ([b8d3612](https://github.com/Calmecac-MX/Tlamatqui/commit/b8d3612a7c9f56d89d4f30693fd902ccbec76fc3))
* **architecture:** migrar repositorio a arquitectura monorepo desacoplada con NPM Workspaces (apps/frontend y apps/backend) ([b31f584](https://github.com/Calmecac-MX/Tlamatqui/commit/b31f58416a8bb52c31396ec14caf740ef943d510))
* **architecture:** reunificar la aplicacion en una sola estructura unificada fullstack que se despliega junta ([de708a8](https://github.com/Calmecac-MX/Tlamatqui/commit/de708a809d274bb66ab8dba3e2c2b750e6026886))
* **config:** migrar report branding a la configuración global (Config) y eliminar ReportBranding [v2.5.70/v2.5.57] ([f560b27](https://github.com/Calmecac-MX/Tlamatqui/commit/f560b27cdf7c5f3ea8fdb0ca885d130bef5754a4))
* **env:** conservar la variable CORS_ORIGIN para configuracion explicita de origenes ([31cc261](https://github.com/Calmecac-MX/Tlamatqui/commit/31cc2615be7219a93a9bba458d8f4a24c36d6b03))
* **env:** depurar CORS_ORIGIN redundante y consolidar plantilla .env.example ([38198b4](https://github.com/Calmecac-MX/Tlamatqui/commit/38198b4c806354f2374c4c0f9b310678fbec7e58))
* **env:** depurar variables de entorno redundantes y ajustar codigo a la estructura unificada fullstack ([031a570](https://github.com/Calmecac-MX/Tlamatqui/commit/031a570c7d40ad1e6b9317e60f5e6479a3c50e27))
* **env:** depurar variables obsoletas u opcionales de .env.example ([0c6618f](https://github.com/Calmecac-MX/Tlamatqui/commit/0c6618fc7f21f40d85e067ca044457266a51283e))
* **env:** eliminar variable redundante BACKEND_URL ([0c2b20d](https://github.com/Calmecac-MX/Tlamatqui/commit/0c2b20d0aeec8dc111f085b3c07005053d01943a))
* **env:** unificar variables FRONTEND_URL, APP_URL y APP_BASE_URL en la variable unica FRONTEND_URL ([839cd5e](https://github.com/Calmecac-MX/Tlamatqui/commit/839cd5e6fbb44a2f18ab9cdb5cab21be16854743))
* **report:** modularizar tabla de report en subtablas (ReportMetrics, ReportPlatformConfig, ReportBranding, ReportAnalytics) [v2.5.69/v2.5.56] ([bb39ca5](https://github.com/Calmecac-MX/Tlamatqui/commit/bb39ca572f461a09ada6df7c30ad96c9ef6e670f))
* **schema:** simplificar tablas de Prisma y añadir relaciones prudenciales User-Team-Report-ApiKey (v2.5.41/v2.5.34) ([608c689](https://github.com/Calmecac-MX/Tlamatqui/commit/608c689ff5a659010e0a68cf761d18eb7ab94ecd))


### 📚 Documentación

* **ai:** actualizar arquitectura monorepo en AGENTS.md ([5fc4f5c](https://github.com/Calmecac-MX/Tlamatqui/commit/5fc4f5c75a76430debf05d6ba779c6eeda4eda3c))
* **ai:** actualizar documentacion de la arquitectura unificada fullstack ([ee2cc57](https://github.com/Calmecac-MX/Tlamatqui/commit/ee2cc57b630cf792ec2101d4df78b5acc9f0765e))
* **ai:** actualizar versiones en AGENTS.md y GEMINI.md ([6e7bafb](https://github.com/Calmecac-MX/Tlamatqui/commit/6e7bafb1fefb02335e30c73b96473d9261a3b6d9))
* **auth:** actualizar documentacion e instalacion de paquetes de auth0-lock ([1332813](https://github.com/Calmecac-MX/Tlamatqui/commit/13328137abc20ba0b05367ca3b159245037b0087))
* **changelog:** actualizar changelog con cambios de Configuración de Branding ([ef436d7](https://github.com/Calmecac-MX/Tlamatqui/commit/ef436d795bcf408c5f9cccd1ef7c88819838b5d0))
* **changelog:** actualizar changelog con el titulo Tlamatqui ([6e03064](https://github.com/Calmecac-MX/Tlamatqui/commit/6e030643f316cec533eec4c856d6f7b375dbb9d6))
* **changelog:** actualizar changelog con la creación del sistema modular de reglas ([50d1ab7](https://github.com/Calmecac-MX/Tlamatqui/commit/50d1ab7a78939170c66fdcac6026e7a91fd3d5bd))
* **changelog:** actualizar changelog con la funcionalidad SMTP ([1b1490b](https://github.com/Calmecac-MX/Tlamatqui/commit/1b1490b2777175d0b2018f425054d002c7e0d338))
* **changelog:** actualizar changelog con registro de cerebros y datos ([7bbfff4](https://github.com/Calmecac-MX/Tlamatqui/commit/7bbfff4414a5e84aa4702db272b6f31cb754d5de))
* **changelog:** actualizar changelog con registro de Licencia AGPL-3.0 ([a8a6db3](https://github.com/Calmecac-MX/Tlamatqui/commit/a8a6db3c073b4f317f8afd045ac02c8de06f00d3))
* **changelog:** actualizar changelog con regla de Caveman Mode ([a0b0910](https://github.com/Calmecac-MX/Tlamatqui/commit/a0b091095dbb9155a591b515a342b949d976cf9c))
* **changelog:** actualizar changelog con renombrado Tlachiālōyan y slug /tlachialoyan ([14064e3](https://github.com/Calmecac-MX/Tlamatqui/commit/14064e3b5fe62e4a2af0bd5d9d45ac6fd624321c))
* **changelog:** actualizar changelog con titulo dinamico de reporte por marca ([4e990c3](https://github.com/Calmecac-MX/Tlamatqui/commit/4e990c31a2a74fe425e21e831d2a7dbd7ed89653))
* **changelog:** actualizar changelog raíz y archivos por versión con último commit ([50cc9ce](https://github.com/Calmecac-MX/Tlamatqui/commit/50cc9ce3143a5f9348bafd5fec7d27c6d3bb7b1f))
* **changelog:** actualizar changelog tras establecer directiva de cerebros ([d501d0f](https://github.com/Calmecac-MX/Tlamatqui/commit/d501d0f5bb4fcbf5c6a7c52cb59779d72dc6f618))
* **changelog:** actualizar changelog tras revision de .gitignore ([5aca9ed](https://github.com/Calmecac-MX/Tlamatqui/commit/5aca9edad39a4317674838e5b96a654b87ad1aa5))
* **changelog:** actualizar CHANGELOG.md y extractos por version ([367af3b](https://github.com/Calmecac-MX/Tlamatqui/commit/367af3b26d8c711d9303cb812c1eb26fa3989eb5))
* **changelog:** registrar cambios de versión v2.5.5 en changelogs ([ece4511](https://github.com/Calmecac-MX/Tlamatqui/commit/ece4511036bd033de2136a8d90124fba21018b4f))
* **changelog:** sincronizar registro de changelog con ultimo commit ([23b0d7c](https://github.com/Calmecac-MX/Tlamatqui/commit/23b0d7c45782db2bc6a29ad55a1b7cc0eeed15c8))
* **ci:** actualizar documentacion de cerebros con permisos de docker-publish workflow ([34aaf4b](https://github.com/Calmecac-MX/Tlamatqui/commit/34aaf4b45a40e81ccaafed5213e9163b321390a1))
* **context:** actualizar el contexto de los cerebros y datos del proyecto ([d720ce3](https://github.com/Calmecac-MX/Tlamatqui/commit/d720ce379912c1aaa5f3b9b4e38076ad1d6fa704))
* **env:** actualizar .env.example para entornos de desarrollo y produccion ([b36c7a8](https://github.com/Calmecac-MX/Tlamatqui/commit/b36c7a861bcb98f9d06f62116b0e484a03633f82))
* **env:** actualizar campo SMTP_FROM a Reportes Tlamatqui &lt;no-respondas@calmecac.lat&gt; ([b42736e](https://github.com/Calmecac-MX/Tlamatqui/commit/b42736ec417dfc196540bdc3e219f5d5f51014f0))
* **env:** agregar .env.vercel con variables de produccion listas para vercel ([73d9ef3](https://github.com/Calmecac-MX/Tlamatqui/commit/73d9ef3790bd8410b6f45ecf0d8d967c6d2327ea))
* **env:** consolidar plantilla .env.example alineada a la arquitectura desacoplada ([61bc622](https://github.com/Calmecac-MX/Tlamatqui/commit/61bc622d47bd12f94b92eaed7de886c7e582c419))
* **readme:** redactar README.md completo y actualizar arquitectura docker y reglas de IA para la estructura unificada fullstack ([6765cb5](https://github.com/Calmecac-MX/Tlamatqui/commit/6765cb558346d949fb6c01b97866d641daf3b6ab))
* **release:** actualizar cabeceras de version de cerebros a v2.5.28 / v2.5.19 ([858df79](https://github.com/Calmecac-MX/Tlamatqui/commit/858df7998c9dcb9ad87398f37b942f7674f6bc89))
* **rules:** actualizar nombre del proyecto a Tlamatqui en la ruta de la IA y documentación ([4248b88](https://github.com/Calmecac-MX/Tlamatqui/commit/4248b88c1f060ea06fa54e22d383f4bc7feef2f1))
* **rules:** añadir regla obligatoria de envio de cambios via PR con aprobacion explicita ([1a35785](https://github.com/Calmecac-MX/Tlamatqui/commit/1a357859b8ed0bb61b5a3fcdbb254403a5473058))
* **rules:** establecer directiva obligatoria de registro en cerebros y documentacion IA ([c3d1797](https://github.com/Calmecac-MX/Tlamatqui/commit/c3d1797100df2ffb4242e8962f228b5a96570ea5))


### 🔧 Tareas Operativas y Mantenimiento

* bump BACKEND_VERSION to 2.5.47 ([96771a0](https://github.com/Calmecac-MX/Tlamatqui/commit/96771a01bd416607defcf5a5666ff00ddd9c39c2))
* bump frontend version to 2.5.48 ([c7a8cc5](https://github.com/Calmecac-MX/Tlamatqui/commit/c7a8cc56f93e7ba13a99c35cc477c13dcc5b7319))
* **clean:** eliminar archivos obsoletos de la raiz y ordenar la estructura del monorepo ([6bad3b4](https://github.com/Calmecac-MX/Tlamatqui/commit/6bad3b4d324e7c2f3705c777543e3ef9144f007d))
* **clean:** eliminar directorio .claude no utilizado ([7d2276b](https://github.com/Calmecac-MX/Tlamatqui/commit/7d2276be6fd8deba108ff3995b2f7de864652e5d))
* **db:** migrar esquema inicial a Prisma Postgres e integrar clientes v7.9.1 (v2.5.41/v2.5.33) ([496f681](https://github.com/Calmecac-MX/Tlamatqui/commit/496f6810b3469171be09f9ee270530cd28ecc1e3))
* **git:** actualizar .gitignore con reglas de ignorado estructuradas ([dad0315](https://github.com/Calmecac-MX/Tlamatqui/commit/dad031549b12869a5d9f2107a3d80b47f5ce2c98))
* **git:** actualizar regla de ignorado para .env.vercel en .gitignore ([45466de](https://github.com/Calmecac-MX/Tlamatqui/commit/45466de10601025ba537a2efacd793e6f1389f56))
* increment BACKEND_VERSION to 2.5.50 ([5bb2ff9](https://github.com/Calmecac-MX/Tlamatqui/commit/5bb2ff9d851b433607b1d5514073a1ff429f1a68))
* **license:** añadir licencia GNU Affero General Public License v3.0 (AGPL-3.0) ([d216ee0](https://github.com/Calmecac-MX/Tlamatqui/commit/d216ee097c5bc39be706fd1cb537776fe229f61b))
* **prisma:** crear archivo de configuracion prisma.config.ts para soporte oficial de Prisma CLI y Language Server ([562e5f5](https://github.com/Calmecac-MX/Tlamatqui/commit/562e5f5a5604b86dfdfe48430cf2975b3ca91cab))
* **release:** v2.5.28 (Frontend) / v2.5.19 (Backend) ([6d02bfd](https://github.com/Calmecac-MX/Tlamatqui/commit/6d02bfd3804698a4220a324f4d8bd1556858b3bb))
* remove legacy project documentation and architecture proposal files ([3f5bc24](https://github.com/Calmecac-MX/Tlamatqui/commit/3f5bc241d1c94150424f42f9286b116628399e65))
* update BACKEND_VERSION to 2.5.49 to match frontend and app versions ([1cd261b](https://github.com/Calmecac-MX/Tlamatqui/commit/1cd261b970c9bc28bc101001f96143452ff3791a))

## [v2.5.76 (Frontend) / v2.5.62 (Backend)] - 2026-09-05

### ♻️ Refactorización de Código
- **admin:** mover edición de matriz comparativa a configuración y simplificar wizard de diagnóstico (`7961149`)

## [v2.5.75 (Frontend) / v2.5.61 (Backend)] - 2026-09-04

### 🚀 Features & Nuevas Funcionalidades
- **report:** add cover screenshots, web speed simulator, and interactive pricing tier selection (`09ef603`)

## [v2.5.74 (Frontend) / v2.5.61 (Backend)] - 2026-09-04

### 🚀 Features & Nuevas Funcionalidades
- **report:** integrar esquema extendido de chismografo con pagespeed y screenshots (`9957475`)

## [v2.5.73 (Frontend) / v2.5.60 (Backend)] - 2026-09-04

### 🚀 Features & Nuevas Funcionalidades
- **diagnostics:** add automatic store audit modal powered by Chismografo API (`dd76a08`)

## [v2.5.72 (Frontend) / v2.5.59 (Backend)] - 2026-09-04

### 🚀 Features & Nuevas Funcionalidades
- **api:** resolve technology icons and favicons automatically in report and scraping responses (`9d440fb`)

## [v2.5.71 (Frontend) / v2.5.58 (Backend)] - 2026-09-03

### ♻️ Refactorización de Código
- **config:** migrar report branding a la configuración global (Config) y eliminar ReportBranding [v2.5.70/v2.5.57] (`f560b27`)

## [v2.5.70 (Frontend) / v2.5.57 (Backend)] - 2026-08-23

### ♻️ Refactorización de Código
- **report:** modularizar tabla de report en subtablas (ReportMetrics, ReportPlatformConfig, ReportBranding, ReportAnalytics) [v2.5.69/v2.5.56] (`bb39ca5`)

## [v2.5.69 (Frontend) / v2.5.56 (Backend)] - 2026-08-23

### 🚀 Features & Nuevas Funcionalidades
- **report-cover:** vincular el nombre del comercio en el título de la portada con su sitio web (`bbf62d6`)

## [v2.5.68 (Frontend) / v2.5.55 (Backend)] - 2026-08-23

### 🐛 Corregido & Bug Fixes
- **team-settings:** eliminar bloque general de equipo del formulario de configuración del reporte (`bd3f966`)

## [v2.5.67 (Frontend) / v2.5.55 (Backend)] - 2026-08-23

### 🚀 Features & Nuevas Funcionalidades
- **teams:** añadir configuración del reporte con marca teamBrand* y gestión de aliados (`59358fa`)

## [v2.5.66 (Frontend) / v2.5.55 (Backend)] - 2026-08-23

### 🐛 Corregido & Bug Fixes
- **tools:** restringir edicion de aplicaciones existentes a solo precio y permitir agregar nuevas (Frontend v2.5.65) (`9707f7b`)

## [v2.5.65 (Frontend) / v2.5.54 (Backend)] - 2026-08-23

### 🚀 Features & Nuevas Funcionalidades
- **db:** sincronizar edicion de aplicaciones y funciones comparativas con la base de datos (Frontend v2.5.64) (`5d9e7b8`)

## [v2.5.64 (Frontend) / v2.5.54 (Backend)] - 2026-08-23

### 🚀 Features & Nuevas Funcionalidades
- **realtime:** filtrar bitacora de interacciones a aperturas, navegacion y descargas del reporte (Frontend v2.5.63) (`eb97779`)

## [v2.5.63 (Frontend) / v2.5.54 (Backend)] - 2026-08-23

### 🐛 Corregido & Bug Fixes
- **team:** incluir superusuario en contador de administradores (Frontend v2.5.62) (`da0dee2`)

## [v2.5.62 (Frontend) / v2.5.54 (Backend)] - 2026-08-23

### 🚀 Features & Nuevas Funcionalidades
- **email:** rediseñar plantillas de correo con estilo Calmécac v2.5.54 (`61937e6`)

## [v2.5.61 (Frontend) / v2.5.54 (Backend)] - 2026-08-23

### 🐛 Corregido & Bug Fixes
- **auth:** preservar los roles asignados por cuenta e impedir que la configuración global los sobrescriba v2.5.61 (`04f333b`)

## [v2.5.61 (Frontend) / v2.5.53 (Backend)] - 2026-08-23

### 🚀 Features & Nuevas Funcionalidades
- **auth:** garantizar la permanencia perpetua del rol superusuario entre actualizaciones v2.5.60 (`127b9a0`)

## [v2.5.60 (Frontend) / v2.5.53 (Backend)] - 2026-08-23

### 🚀 Features & Nuevas Funcionalidades
- **auth:** ocultar tarjeta de configuración de dominios a usuarios no administradores v2.5.59 (`5cf6e9c`)

## [v2.5.59 (Frontend) / v2.5.52 (Backend)] - 2026-08-23

### 🐛 Corregido & Bug Fixes
- **auth:** restringir la adición y configuración de dominios a administradores y superusuarios v2.5.58 (`7c54a55`)

## [v2.5.58 (Frontend) / v2.5.52 (Backend)] - 2026-08-23

### 🐛 Corregido & Bug Fixes
- **share:** remover sección de verificación DNS, recuadro de dominio predeterminado y píldora de modo compartible v2.5.57 (`30606cf`)

## [v2.5.57 (Frontend) / v2.5.51 (Backend)] - 2026-08-23

### 🐛 Corregido & Bug Fixes
- **share:** simplificar modal de compartir usando únicamente URL predeterminada y remover botón de vista previa v2.5.56 (`cfa6a4a`)

## [v2.5.56 (Frontend) / v2.5.51 (Backend)] - 2026-08-23

### 🚀 Features & Nuevas Funcionalidades
- **report:** añadir exportación a hoja de cálculo Excel (.xlsx), CSV estilizado y Markdown (.md) v2.5.55 (`cd0928b`)

## [v2.5.55 (Frontend) / v2.5.51 (Backend)] - 2026-08-23

### 📌 Otros Cambios
- ocultar banner de SMTP activo en modal de correo y deshabilitar opciones cuando no hay credenciales (`e3bfdb5`)

## [v2.5.54 (Frontend) / v2.5.51 (Backend)] - 2026-08-23

### 🚀 Features & Nuevas Funcionalidades
- **auth:** ocultar centro superusuario para administradores y restringirlo exclusivamente a superusuarios (`e85baf6`)

## [v2.5.53 (Frontend) / v2.5.51 (Backend)] - 2026-08-23

### 📌 Otros Cambios
- eliminar nota explicativa debajo de la tarjeta de rol en el perfil (`56a8fe4`)

## [v2.5.52 (Frontend) / v2.5.51 (Backend)] - 2026-08-23

### 🚀 Features & Nuevas Funcionalidades
- **auth:** bloquear modificacion de roles en perfil de usuario y restringir edicion a administradores (`f29fd8f`)

## [v2.5.51] - 2026-08-23

### 🚀 Features & Nuevas Funcionalidades
- **config:** agregar opcion para activar o desactivar dominio personalizado y prevenir llamadas a Vercel (`23addcf`)

## [v2.5.50 (Frontend) / v2.5.51 (Backend)] - 2026-08-23

### ⚡ Optimización y Rendimiento
- **config:** optimizar endpoint /api/config con cache de lectura en RAM y encabezados HTTP (`033ae52`)

### 🔧 Tareas Operativas y Mantenimiento
- increment BACKEND_VERSION to 2.5.50 (`5bb2ff9`)

## [v2.5.49 (Frontend) / v2.5.50 (Backend)] - 2026-08-23

### ⚡ Optimización y Rendimiento
- **api:** optimizar API REST con cache en RAM TTL de 3s e invalidacion automatica de consultas (`ea5d352`)

### 🔧 Tareas Operativas y Mantenimiento
- update BACKEND_VERSION to 2.5.49 to match frontend and app versions (`1cd261b`)

## [v2.5.49] - 2026-08-23

### ⚡ Optimización y Rendimiento
- **core:** implementar timeouts estrictos sub-5s en DB, Brevo y SMTP para garantizar respuestas ultra rapidas (`7d09c54`)

## [v2.5.49 (Frontend) / v2.5.48 (Backend)] - 2026-08-23

### ⚡ Optimización y Rendimiento
- **vercel:** ampliar maxDuration a 60s y optimizar inicializacion serverless (`84749b4`)

### 🔧 Tareas Operativas y Mantenimiento
- bump BACKEND_VERSION to 2.5.47 (`96771a0`)

## [v2.5.49 (Frontend) / v2.5.47 (Backend)] - 2026-08-23

### 🚀 Features & Nuevas Funcionalidades
- **auth:** integrar pagina dedicada de invitacion a equipo con registro Auth0 y auto-vinculacion (`37a0546`)

## [v2.5.49 (Frontend) / v2.5.46 (Backend)] - 2026-08-23

### 🐛 Corregido & Bug Fixes
- **teams:** corregir rol residual Editor por Agente en datos por defecto de equipos (`82cc83c`)

### 🔧 Tareas Operativas y Mantenimiento
- bump frontend version to 2.5.48 (`c7a8cc5`)

## [v2.5.48 (Frontend) / v2.5.45 (Backend)] - 2026-08-22

### 🚀 Features & Nuevas Funcionalidades
- **roles:** integrar rol Agente, visibilidad restringida por vendedor y ranking de rendimiento comercial (`a44e8ea`)

## [v2.5.47 (Frontend) / v2.5.45 (Backend)] - 2026-08-22

### ⚡ Optimización y Rendimiento
- **core:** optimizar rendimiento fullstack con memory cache json, gzip middleware y code-splitting frontend (`9232a20`)

## [v2.5.46 (Frontend) / v2.5.44 (Backend)] - 2026-08-22

### 🚀 Features & Nuevas Funcionalidades
- **email:** integrar servicio de envio de correos via brevo api v3 (`e2c2548`)

## [v2.5.45 (Frontend) / v2.5.43 (Backend)] - 2026-08-22

### 🚀 Features & Nuevas Funcionalidades
- **teams:** agregar envio de invitaciones a miembros por correo electronico (`14c7488`)

## [v2.5.45 (Frontend) / v2.5.42 (Backend)] - 2026-08-22

### 🐛 Corregido & Bug Fixes
- **prisma:** integrar driver adapter de pg en Prisma 7 y sincronizar esquema DB (`79964e8`)

## [v2.5.44 (Frontend) / v2.5.41 (Backend)] - 2026-08-22

### 🚀 Features & Nuevas Funcionalidades
- **skills:** añadir la skill de prisma para antigravity (`e12c18d`)

### 🐛 Corregido & Bug Fixes
- **vercel:** corregir especificador de importación en api/index.ts (../server.js) para evitar ERR_MODULE_NOT_FOUND en Serverless Functions (`a386cb6`)
- **serverless:** asegurar fallback seguro en PrismaClient singleton e invocar restablecimiento (v2.5.44/v2.5.40) (`1b9b640`)

## [v2.5.44 (Frontend) / v2.5.40 (Backend)] - 2026-08-22

### 🚀 Features & Nuevas Funcionalidades
- **api:** habilitar endpoint dedicado POST /api/factory-reset para ejecuciones programáticas (v2.5.44/v2.5.39) (`6f8d811`)

## [v2.5.44 (Frontend) / v2.5.39 (Backend)] - 2026-08-22

### 📌 Otros Cambios
- formatear representación de tokens de Auth0 como puntos tipo contraseña (••••••••••••••••) (v2.5.44/v2.5.38) (`8907a5b`)

## [v2.5.44 (Frontend) / v2.5.38 (Backend)] - 2026-08-22

### 📌 Otros Cambios
- aplicar cifrado transparente AES-256-GCM y enmascaramiento API para tokens Auth0 (v2.5.43/v2.5.37) (`f0eccc8`)
- agregar allowScripts en package.json para autorizar scripts de instalacion en npm 10+ (`59002b0`)
- agregar cabeceras de cortafuegos WAF y politicas avanzadas de CORS en vercel.json (`4ce3d29`)
- optimizar configuracion de vercel.json y tsconfig.json para despliegue serverless (`ea4792b`)
- actualizar workflow a las ultimas versiones estables de actions (v7 y v5) (`1a161b4`)
- eliminar docker y actualizar workflow CI/CD con Node.js 24 (`1ad8e86`)

## [v2.5.43 (Frontend) / v2.5.37 (Backend)] - 2026-08-22

### 🚀 Features & Nuevas Funcionalidades
- **auth0:** almacenar metadatos de tokens, expiración y último login en la tabla User (v2.5.43/v2.5.36) (`ee7d4be`)

## [v2.5.43 (Frontend) / v2.5.36 (Backend)] - 2026-08-22

### 🚀 Features & Nuevas Funcionalidades
- **superadmin:** implementar función y panel de Restablecimiento a Configuración de Fábrica (v2.5.42/v2.5.35) (`699b4d9`)

## [v2.5.42 (Frontend) / v2.5.35 (Backend)] - 2026-08-22

### ♻️ Refactorización de Código
- **schema:** simplificar tablas de Prisma y añadir relaciones prudenciales User-Team-Report-ApiKey (v2.5.41/v2.5.34) (`608c689`)

## [v2.5.41 (Frontend) / v2.5.34 (Backend)] - 2026-08-22

### 🔧 Tareas Operativas y Mantenimiento
- **db:** migrar esquema inicial a Prisma Postgres e integrar clientes v7.9.1 (v2.5.41/v2.5.33) (`496f681`)

## [v2.5.41 (Frontend) / v2.5.33 (Backend)] - 2026-08-22

### 🚀 Features & Nuevas Funcionalidades
- **auth:** agregar soporte para la variable SUPERADMIN_EMAIL en .env para asignación automática de Superusuario (v2.5.41/v2.5.32) (`7c39ee9`)

## [v2.5.41 (Frontend) / v2.5.32 (Backend)] - 2026-08-22

### 🚀 Features & Nuevas Funcionalidades
- **superadmin:** trasladar la configuración de Marca Blanca y Dominio Personalizado a la consola de Superusuario (v2.5.41/v2.5.31) (`f8b877a`)

## [v2.5.41 (Frontend) / v2.5.31 (Backend)] - 2026-08-22

### 🚀 Features & Nuevas Funcionalidades
- **superadmin:** agregar gestión de usuarios, vista de equipos y modal de detalles de usuario para Superusuario (v2.5.40/v2.5.31) (`2908175`)

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
