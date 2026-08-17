# Tlamatqui (Evolución Diagnostics)
## Manual de Arquitectura, Funcionalidades y Detalles Técnicos

---

## 📋 Índice
1. [Visión General del Proyecto](#-visión-general-del-proyecto)
2. [Pila Tecnológica (Tech Stack)](#-pila-tecnológica-tech-stack)
3. [Estructura del Proyecto y Archivos](#-estructura-del-proyecto-y-archivos)
4. [Diagrama de Base de Datos y Modelo de Datos](#-diagrama-de-base-de-datos-y-modelo-de-datos)
5. [Mecanismo de Persistencia Híbrida (DB Bridge)](#-mecanismo-de-persistencia-híbrida-db-bridge)
6. [Módulos y Funcionalidades Detalladas](#-módulos-y-funcionalidades-detalladas)
   - [Panel de Administración (AdminPanel)](#1-panel-de-administración-adminpaneltsx)
   - [Presentación Ejecutiva para Clientes (ReportView)](#2-presentación-ejecutiva-para-clientes-reportviewtsx)
   - [Calculadora Dinámica de Ahorro Financiero](#3-calculadora-dinámica-de-ahorro-financiero)
   - [Dashboard Global y Analítica Ejecutiva](#4-dashboard-global-y-analítica-ejecutiva-globaldashboardtsx)
   - [Monitoreo en Tiempo Real](#5-monitoreo-en-tiempo-real-realtimedashboardtsx)
   - [Espacios de Trabajo y Equipos](#6-espacios-de-trabajo-y-equipos-teamdashboardtsx)
   - [Módulo de Socios Consultores (Partner Hub)](#7-módulo-de-socios-consultores-partner-hub)
   - [Scraping Inteligente de Apps](#8-scraping-inteligente-de-apps)
   - [Interfaz de Línea de Comandos (CLI)](#9-interfaz-de-línea-de-comandos-clits)
   - [API REST y Especificación OpenAPI](#10-api-rest-y-especificación-openapi)
7. [Diagramas de Flujo de Trabajo](#-diagramas-de-flujo-de-trabajo)
8. [Guía de Instalación, Configuración y Despliegue](#-guía-de-instalación-configuración-y-despliegue)

---

## 🎯 Visión General del Proyecto

**Tlamatqui (Evolución Diagnostics)** es una plataforma web integral y suite de herramientas CLI diseñada para agencias de comercio electrónico, consultores de migración y equipos comerciales.

Su objetivo principal es realizar **auditorías financieras cuantitativas y cualitativas** de tiendas en **Shopify** para identificar fugas de margen operativo producidas por:
1. **Comisiones por transacción ocultas o adicionales** (de 0.2% a 2.0% por cada venta según el plan de Shopify).
2. **Costos recurrentes de aplicaciones de terceros** (Klaviyo, Loox, Bold Subscriptions, Infinite Options, etc.) facturadas en USD con variación de tipo de cambio.
3. **Falta de Meses Sin Intereses (MSI) nativos** y costos indirectos de infraestructura.

A partir de estos datos, la plataforma genera una **presentación ejecutiva interactiva** en formato de diapositivas que permite a los clientes simular en tiempo real sus ahorros al migrar a **Tiendanube** (con 0% de comisión por transacción, facturación 100% pesificada en MXN, MSI nativos y soporte 1 a 1 por WhatsApp en español).

---

## 🛠️ Pila Tecnológica (Tech Stack)

### Frontend
- **Framework Principal:** [React 19](https://react.dev) (`react` ^19.0.1, `react-dom` ^19.0.1)
- **Lenguaje:** [TypeScript 5.8](https://www.typescriptlang.org) (`typescript` ~5.8.2)
- **Entorno de Construcción y Servidor Dev:** [Vite 6.2](https://vitejs.dev) (`vite` ^6.2.3, `@vitejs/plugin-react` ^5.0.4)
- **Diseño y Estilos:** [Tailwind CSS v4](https://tailwindcss.com) (`tailwindcss` ^4.1.14, `@tailwindcss/vite` ^4.1.14) con soporte nativo de **Dark Mode / Light Mode** y paleta personalizada de colores HSL.
- **Iconografía:** [Lucide React](https://lucide.dev) (`lucide-react` ^0.546.0)
- **Visualización de Datos:** [Recharts 3.9](https://recharts.org) (`recharts` ^3.9.2) para los gráficos dinámicos de proyección financiera acumulada a 12, 24 y 36 meses.
- **Animaciones y Transiciones:** [Motion (Framer Motion v12)](https://motion.dev) (`motion` ^12.23.24) y [GSAP 3.15](https://gsap.com) (`gsap` ^3.15.0) para micro-interacciones y transiciones de diapositivas.

### Backend
- **Entorno de Ejecución:** [Node.js](https://nodejs.org) con soporte de ES Modules (`"type": "module"`)
- **Servidor Web API REST:** [Express 4.21](https://expressjs.com) (`express` ^4.21.2) con middleware [CORS](https://github.com/expressjs/cors) (`cors` ^2.8.5) e independencia completa del servidor web frontend.
- **Puerto por Defecto Backend:** `PORT=4000` (escuchando en `http://localhost:4000`)
- **Ejecución TypeScript en Desarrollo:** [tsx](https://github.com/privatenumber/tsx) (`tsx` ^4.21.0)
- **Compilador / Bundler de Producción:** [esbuild 0.25](https://esbuild.github.io) (`esbuild` ^0.25.0) para empaquetar `server.ts` en un bundle CommonJS optimizado (`dist/server.cjs`).
- **Variables de Entorno:** [dotenv](https://github.com/motdotla/dotenv) (`dotenv` ^17.2.3)

### Base de Datos y Persistencia
- **ORM:** [Prisma ORM 6.19](https://www.prisma.io) (`@prisma/client` ^6.19.3, `prisma` ^6.19.3)
- **Motor de Base de Datos Principal:** [PostgreSQL](https://www.postgresql.org)
- **Puente Híbrido de Persistencia:** [server/dbBridge.ts](file:///Users/cesarayar/Documents/tlamatqui/server/dbBridge.ts) que proporciona un fallback automático y transparente a archivos JSON locales (`/data/*.json`) cuando no se dispone de una base de datos PostgreSQL activa.

### Web Scraping y Detección de Apps
- **Servicio de Scraping Externo:** Integración con la API Chismógrafo Scraper (`chismografo.rifatela.lol`) y motor de evaluación adaptativa para análisis de herramientas.

### Autenticación e Identidad
- **Proveedor de Identidad:** [Auth0 por Okta](https://auth0.com) (`@auth0/auth0-react` ^2.2.4)
- **Protocolos:** OAuth 2.0, OpenID Connect (OIDC) y Single Sign-On (SSO).
- **Protección de Rutas:** Acceso protegido para administradores y consultores al Panel Administrativo, con bypass público para clientes en enlaces de reportes compartidos (`?shared=true`).
- **Modo Demostración / Fallback:** Conmutación automática a modo local si no se configuran las variables de entorno de Auth0.

### Herramientas CLI y Especificaciones
- **Herramienta CLI:** [cli.ts](file:///Users/cesarayar/Documents/tlamatqui/cli.ts) ejecutada vía `npm run cli`.
- **Especificación de API:** Documentación OpenAPI 3.0.3 en [openapi.json](file:///Users/cesarayar/Documents/tlamatqui/openapi.json).

## 📁 Estructura del Proyecto y Archivos

```text
tlamatqui/
├── assets/                  # Logotipos, imágenes y recursos estáticos
├── data/                    # Almacenamiento JSON local (fallback del DB Bridge)
├── prisma/                  # Configuración de Prisma ORM
├── server/                  # Capa de integración Backend
├── src/                     # Código Fuente Frontend (React + TS)
├── cli.ts                   # Herramienta de Línea de Comandos (CLI)
├── index.html               # Estructura del documento HTML principal
├── metadata.json            # Metadatos del proyecto
├── openapi.json             # Especificación OpenAPI 3.0.3
├── package.json             # Dependencias y scripts de npm
├── server.ts                # Servidor Express REST API y middleware Vite
├── tsconfig.json            # Configuración de compilación de TypeScript
└── vite.config.ts           # Configuración del bundler Vite y Tailwind
```

---

## 🛢️ Diagrama de Base de Datos y Modelo de Datos

A continuación se presenta el diagrama entidad-relación de la base de datos definido en [schema.prisma](file:///Users/cesarayar/Documents/tlamatqui/prisma/schema.prisma):

```mermaid
erDiagram
    Team ||--o{ TeamMember : "tiene"
    Team ||--o{ Report : "posee"
    ComparisonTemplate ||--o{ ComparisonTemplateRow : "contiene"
    Report ||--o{ ReportTool : "evalúa"
    Report ||--o{ ReportComparisonRow : "compara"
    Report ||--|| ReportInteraction : "registra"
    Partner ||--o{ PartnerMember : "cuenta con"
```

### Enumeraciones (Enums)

| Enum | Valores Permitidos | Descripción |
| :--- | :--- | :--- |
| `Role` | `Administrador`, `Editor`, `Visor` | Niveles de permisos dentro de la plataforma y los equipos. |
| `ShopifyPlan` | `basic`, `grow`, `advanced`, `plus`, `custom` | Planes oficiales de Shopify que determinan el % de comisión por transacción. |
| `TiendanubePlan` | `basic`, `tiendanube`, `advanced`, `evolution` | Planes oficiales de Tiendanube (todos cuentan con 0% comisión por transacción). |
| `CostType` | `exact`, `range` | Modalidad de costo de una app de terceros (monto fijo o rango min-max). |
| `Currency` | `MXN`, `USD` | Divisa de cobro de las herramientas auditadas. |
| `Semaphore` | `green`, `yellow`, `red` | Semáforo de riesgo/oportunidad de reemplazo o eliminación de la app. |
| `LogoType` | `text`, `logo` | Tipo de visualización de marca en el encabezado (texto plano o imagen). |

---

### Modelos y Campos Detallados de la Base de Datos

#### 1. Modelo `Config` (Configuración Global del Panel)
*Almacena los parámetros de marca, URLs y ajustes globales del panel de administración.*

| Campo | Tipo | Requerido | Valor por Defecto | Descripción |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `String` | Sí | `"default"` | Identificador único del registro de configuración (Clave Primaria). |
| `adminLogoUrl` | `String` | Sí | N/A | URL o path de la imagen del logotipo mostrado en el panel. |
| `adminTextUrl` | `String` | Sí | N/A | Texto alternativo de marca cuando no hay imagen de logo. |
| `appUrl` | `String` | Sí | N/A | URL pública base de despliegue de la aplicación. |
| `defaultContactEmail` | `String` | Sí | N/A | Correo electrónico predeterminado para enlaces de contacto. |
| `defaultContactWhatsapp` | `String` | Sí | N/A | Número de WhatsApp predeterminado para recepción de leads. |
| `customExchangeRate` | `Float` | Sí | N/A | Tipo de cambio personalizado USD/MXN de respaldo. |
| `userName` | `String` | Sí | N/A | Nombre del usuario administrador por defecto. |
| `userEmail` | `String` | Sí | N/A | Correo electrónico del usuario administrador por defecto. |
| `userRole` | `Role` (Enum) | Sí | `Administrador` | Rol global del usuario (`Administrador`, `Editor`, `Visor`). |
| `userAvatar` | `String` | Sí | N/A | URL de la foto de perfil/avatar del administrador. |
| `metricsUpdateInterval` | `Int` | Sí | N/A | Intervalo de refresco en segundos para el monitoreo en tiempo real. |
| `brandCard2Title` | `String` | No | `null` | Título secundario para la tarjeta de marca global. |
| `brandCard2Desc` | `String` | No | `null` | Descripción secundaria para la tarjeta de marca global. |
| `brandCard2Logo` | `String` | No | `null` | URL del logo para la tarjeta de marca secundaria. |
| `brandCard2Link` | `String` | No | `null` | Enlace externo para la tarjeta de marca secundaria. |

#### 2. Modelo `Team` (Espacios de Trabajo / Equipos)
*Representa una agencia o equipo de trabajo en la plataforma.*

| Campo | Tipo | Requerido | Valor por Defecto | Descripción |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `String` | Sí | N/A | Identificador único del equipo (Clave Primaria). |
| `name` | `String` | Sí | N/A | Nombre del equipo de trabajo o agencia. |
| `image` | `String` | No | `null` | URL del logotipo o imagen distintiva del equipo. |
| `ownerName` | `String` | Sí | N/A | Nombre completo del propietario del equipo. |
| `ownerEmail` | `String` | Sí | N/A | Correo electrónico del propietario del equipo. |
| `createdAt` | `DateTime` | Sí | `now()` | Fecha y hora de creación del equipo. |

#### 3. Modelo `TeamMember` (Miembros de Equipo)
*Miembros asignados a un equipo de trabajo específico.*

| Campo | Tipo | Requerido | Valor por Defecto | Descripción |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `String` | Sí | N/A | Identificador único del miembro (Clave Primaria). |
| `name` | `String` | Sí | N/A | Nombre completo del miembro del equipo. |
| `email` | `String` | Sí | N/A | Correo electrónico del miembro del equipo. |
| `role` | `Role` (Enum) | Sí | `Visor` | Rol asignado dentro del equipo (`Administrador`, `Editor`, `Visor`). |
| `avatar` | `String` | No | `null` | URL del avatar o foto de perfil del miembro. |
| `teamId` | `String` | Sí | N/A | Clave foránea referenciando a `Team.id`. |

#### 4. Modelo `Report` (Reportes de Diagnóstico Financiero)
*Entidad principal que almacena las auditorías financieras de clientes e-commerce.*

| Campo | Tipo | Requerido | Valor por Defecto | Descripción |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `String` | Sí | N/A | Identificador único del reporte (Clave Primaria). |
| `name` | `String` | Sí | N/A | Nombre comercial de la tienda o cliente auditado. |
| `logo` | `String` | No | `null` | URL del logotipo de la tienda auditada. |
| `tagline` | `String` | No | `null` | Eslogan o subtítulo descriptivo de la propuesta. |
| `fugasCantidad` | `Int` | No | `null` | Número total de fugas u oportunidades detectadas. |
| `fugasRangoMin` | `Float` | No | `null` | Estimación de ahorro anual mínimo proyectado (MXN). |
| `fugasRangoMax` | `Float` | No | `null` | Estimación de ahorro anual máximo proyectado (MXN). |
| `visitasMensuales` | `Int` | Sí | N/A | Tráfico de visitas mensuales de la tienda auditada. |
| `gmv` | `Float` | Sí | N/A | Volumen de Ventas Brutas Mensuales (GMV en MXN). |
| `shopifyFee` | `Float` | No | `null` | Porcentaje de comisión por transacción en Shopify (0.2% - 2.0%). |
| `msi` | `String` | No | `null` | Descripción del estado o costo de Meses Sin Intereses. |
| `businessUrl` | `String` | No | `null` | URL de la tienda auditada (ej. `https://mitienda.com`). |
| `shopifyPlan` | `ShopifyPlan` | Sí | `grow` | Plan de Shopify activo (`basic`, `grow`, `advanced`, `plus`, `custom`). |
| `shopifyPlanCustomFee` | `Float` | No | `null` | Porcentaje de comisión personalizado para plan Shopify Custom. |
| `shopifyPlanCustomPrice` | `Float` | No | `null` | Costo mensual fijo personalizado del plan Shopify (USD). |
| `shopifyAppsCostUSD` | `Float` | No | `null` | Costo total mensual de aplicaciones en dólares (USD). |
| `shopifyAppsCostMXN` | `Float` | No | `null` | Costo total mensual de aplicaciones convertido a pesos (MXN). |
| `tiendanubePlan` | `TiendanubePlan` | Sí | `evolution` | Plan proyectado en Tiendanube (`basic`, `tiendanube`, `advanced`, `evolution`). |
| `contactEmail` | `String` | Sí | N/A | Correo de contacto del consultor para recibir respuestas. |
| `contactWhatsapp` | `String` | Sí | N/A | WhatsApp de contacto del consultor para atención inmediata. |
| `adminLogos` | `Json` | Sí | N/A | Arreglo JSON de URLs de logotipos administrativos (`string[]`). |
| `brandCard1Title` | `String` | No | `null` | Título para la Tarjeta de Marca 1 del informe. |
| `brandCard1Desc` | `String` | No | `null` | Descripción para la Tarjeta de Marca 1. |
| `brandCard1Logo` | `String` | No | `null` | URL del logo de la Tarjeta de Marca 1. |
| `brandCard1Link` | `String` | No | `null` | URL de enlace para la Tarjeta de Marca 1. |
| `brandCard2Title` | `String` | No | `null` | Título para la Tarjeta de Marca 2 del informe. |
| `brandCard2Desc` | `String` | No | `null` | Descripción para la Tarjeta de Marca 2. |
| `brandCard2Logo` | `String` | No | `null` | URL del logo de la Tarjeta de Marca 2. |
| `brandCard2Link` | `String` | No | `null` | URL de enlace para la Tarjeta de Marca 2. |
| `finalSlideMainLogo` | `String` | No | `null` | Logo principal personalizado para la diapositiva final de cierre. |
| `createdAt` | `DateTime` | Sí | `now()` | Fecha y hora de creación del reporte. |
| `viewCount` | `Int` | Sí | `0` | Número total de vistas/impresiones del reporte. |
| `openCount` | `Int` | Sí | `0` | Contador de aperturas únicas de la presentación. |
| `uniqueVisitors` | `Int` | Sí | `0` | Cantidad total de visitantes únicos registrados. |
| `uniqueVisitorIds` | `Json` | No | `null` | Arreglo JSON de identificadores de visitantes únicos (`string[]`). |
| `teamId` | `String` | No | `null` | Clave foránea referenciando al equipo propietario (`Team.id`). |

#### 5. Modelo `ReportTool` (Herramientas Auditadas)
*Aplicaciones y servicios de terceros analizados dentro de un reporte de diagnóstico.*

| Campo | Tipo | Requerido | Valor por Defecto | Descripción |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `String` | Sí | N/A | Identificador único de la herramienta (Clave Primaria). |
| `name` | `String` | Sí | N/A | Nombre comercial de la aplicación (ej. Klaviyo, Loox). |
| `category` | `String` | Sí | N/A | Categoría funcional (Marketing, Reseñas, Suscripciones, etc.). |
| `costType` | `CostType` (Enum) | Sí | `exact` | Modalidad de costo (`exact` para costo fijo, `range` para rango). |
| `costExact` | `Float` | Sí | `0` | Costo mensual exacto si `costType` es `exact`. |
| `costMin` | `Float` | Sí | `0` | Costo mensual mínimo estimado si `costType` es `range`. |
| `costMax` | `Float` | Sí | `0` | Costo mensual máximo estimado si `costType` es `range`. |
| `currency` | `Currency` (Enum) | Sí | `USD` | Divisa de cobro de la aplicación (`USD` o `MXN`). |
| `semaphore` | `Semaphore` (Enum) | Sí | `green` | Clasificación de reemplazo (`green` = Reemplazo Nativo, `yellow` = Optimizable, `red` = Mantener/Revisar). |
| `url` | `String` | No | `null` | Enlace oficial o documentación de la app. |
| `description` | `String` | No | `null` | Descripción del impacto de la app o solución alternativa en Tiendanube. |
| `logo` | `String` | No | `null` | URL del icono o logo de la aplicación auditada. |
| `reportId` | `String` | Sí | N/A | Clave foránea referenciando a `Report.id`. |

#### 6. Modelo `ComparisonTemplate` (Plantillas Comparativas)
*Catálogo de plantillas predefinidas reutilizables para tablas comparativas.*

| Campo | Tipo | Requerido | Valor por Defecto | Descripción |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `String` | Sí | N/A | Identificador único de la plantilla (Clave Primaria). |
| `name` | `String` | Sí | N/A | Nombre descriptivo de la plantilla comparativa. |

#### 7. Modelo `ComparisonTemplateRow` (Filas de Plantilla Comparativa)
*Filas individuales pertenecientes a una plantilla comparativa estándar.*

| Campo | Tipo | Requerido | Valor por Defecto | Descripción |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `String` | Sí | N/A | Identificador único de la fila de plantilla (Clave Primaria). |
| `variable` | `String` | Sí | N/A | Característica o funcionalidad a comparar (ej. Comisiones por Venta). |
| `shopify` | `String` | Sí | N/A | Descripción o costo en la plataforma Shopify. |
| `tiendanube` | `String` | Sí | N/A | Descripción o beneficio en Tiendanube. |
| `pillText` | `String` | Sí | N/A | Etiqueta destacada o beneficio clave (ej. "0% Comisión"). |
| `templateId` | `String` | Sí | N/A | Clave foránea referenciando a `ComparisonTemplate.id`. |

#### 8. Modelo `ReportComparisonRow` (Filas Comparativas de Reporte)
*Filas de la tabla comparativa activas configuradas para un reporte específico.*

| Campo | Tipo | Requerido | Valor por Defecto | Descripción |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `String` | Sí | N/A | Identificador único de la fila (Clave Primaria). |
| `variable` | `String` | Sí | N/A | Característica o aspecto evaluado. |
| `shopify` | `String` | Sí | N/A | Estado/Costo en Shopify. |
| `tiendanube` | `String` | Sí | N/A | Ventaja o costo en Tiendanube. |
| `pillText` | `String` | Sí | N/A | Texto destacado de la insignia explicativa. |
| `reportId` | `String` | Sí | N/A | Clave foránea referenciando a `Report.id`. |

#### 9. Modelo `ReportInteraction` (Métricas de Interacción en Tiempo Real)
*Rastreo en vivo de comportamientos y métricas de lectura de la presentación.*

| Campo | Tipo | Requerido | Valor por Defecto | Descripción |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `String` | Sí | `uuid()` | Identificador único del registro de interacciones (Clave Primaria). |
| `reportId` | `String` | Sí | N/A | Clave foránea única (1 a 1) referenciando a `Report.id`. |
| `slideViews` | `Json` | Sí | N/A | Objeto JSON con el contador de vistas por diapositiva (`Record<string, number>`). |
| `whatsappClicks` | `Int` | Sí | `0` | Contador de clics efectuados hacia el botón de WhatsApp. |
| `toolClicks` | `Int` | Sí | `0` | Clics registrados en detalles de herramientas auditadas. |
| `calculatorInteractions` | `Int` | Sí | `0` | Número de interacciones con las calculadoras y simuladores. |
| `timeSpentSeconds` | `Int` | Sí | `0` | Tiempo acumulado de lectura activa del reporte en segundos. |

#### 10. Modelo `Partner` (Marca del Socio Consultor)
*Configuración de la marca institucional del socio estratégico.*

| Campo | Tipo | Requerido | Valor por Defecto | Descripción |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `String` | Sí | `"default"` | Identificador único del registro de socio (Clave Primaria). |
| `name` | `String` | Sí | `"Socio Principal"` | Nombre oficial de la marca del socio consultor. |
| `logo` | `String` | Sí | `https://logo.clearbit.com/tiendanube.com` | URL del logotipo de la marca del socio. |
| `description` | `String` | Sí | `"Socio Estratégico en Migraciones y Optimización"` | Descripción del socio comercial. |
| `link` | `String` | No | `"https://www.tiendanube.com.mx"` | Enlace al sitio web oficial del socio. |

#### 11. Modelo `PartnerMember` (Miembros del Socio)
*Miembros asociados a la marca del socio estratégico.*

| Campo | Tipo | Requerido | Valor por Defecto | Descripción |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `String` | Sí | `uuid()` | Identificador único del miembro de socio (Clave Primaria). |
| `name` | `String` | Sí | N/A | Nombre completo del miembro. |
| `email` | `String` | Sí | N/A | Correo electrónico institucional. |
| `role` | `String` | Sí | `"Lector"` | Rol asignado (`Lector` o `Lector y Comentarista`). |
| `partnerId` | `String` | Sí | N/A | Clave foránea referenciando a `Partner.id`. |

#### 12. Modelo `LogoConfig` (Configuración de Tipo de Logo)
*Configuración global para personalizar la apariencia del logotipo o nombre en el encabezado.*

| Campo | Tipo | Requerido | Valor por Defecto | Descripción |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `String` | Sí | `"default"` | Identificador único (Clave Primaria). |
| `logoType` | `LogoType` (Enum) | Sí | `text` | Modalidad de logo (`text` para texto de marca, `logo` para imagen). |
| `logoText` | `String` | No | `null` | Texto de marca si `logoType` es `text`. |
| `logoFile` | `String` | No | `null` | URL o ruta de la imagen si `logoType` es `logo`. |
| `globalEmail` | `String` | No | `null` | Correo electrónico de contacto global. |
| `createdAt` | `DateTime` | Sí | `now()` | Fecha y hora de creación. |
| `updatedAt` | `DateTime` | Sí | `updatedAt` | Fecha y hora de última actualización automática. |

---

## 🌉 Mecanismo de Persistencia Híbrida (DB Bridge)

El archivo [server/dbBridge.ts](file:///Users/cesarayar/Documents/tlamatqui/server/dbBridge.ts) implementa un patrón de arquitectura denominado **Puente Híbrido de Persistencia**.

### Funcionamiento:
1. **Detección Dinámica:** Al arrancar el servidor `server.ts`, `initializeDatabase()` verifica la validez de la variable de entorno `DATABASE_URL` y prueba la conexión con el servidor de PostgreSQL mediante `@prisma/client`.
2. **PostgreSQL Activo:** Si Prisma se conecta correctamente, todas las operaciones de lectura, creación, actualización y eliminación de reportes, equipos, plantillas y configuraciones se realizan directamente en PostgreSQL.
3. **Fallback JSON Offline:** Si no hay base de datos PostgreSQL configurada o se produce un fallo de red, el sistema conmuta automáticamente a la carpeta `./data/` leyendo y guardando la información en archivos JSON estructurados.
4. **Ceros Tiempos de Inactividad:** Esto garantiza que la aplicación funcione de manera inmediata en entornos locales de demostración, pruebas offline o despliegues en contenedores sin requerir una base de datos externa obligatoria.

---

## 🚀 Módulos y Funcionalidades Detalladas

### 1. Panel de Administración ([AdminPanel.tsx](file:///Users/cesarayar/Documents/tlamatqui/src/components/AdminPanel.tsx))
Es el centro de control para agencias y administradores. Consta de **7 pestañas principales**:

- **Pestaña 1: Reportes (Lista y Creador)**
- **Pestaña 2: Dashboard Global** 
- **Pestaña 3: En Tiempo Real**
- **Pestaña 4: Equipos**
- **Pestaña 5: Plantillas Comparativas**
- **Pestaña 6: Socio / Partner Hub**
- **Pestaña 7: Configuración Global**

---

### 2. Presentación Ejecutiva para Clientes ([ReportView.tsx](file:///Users/cesarayar/Documents/tlamatqui/src/components/ReportView.tsx))
Ofrece una experiencia visual premium de 6 diapositivas interactivas diseñadas para presentaciones comerciales con clientes.

---

### 3. Calculadora Dinámica de Ahorro Financiero

Ubicada en el núcleo del sistema, realiza cálculos inmediatos basados en comisiones de transacción (Shopify vs Tiendanube), costos de apps en USD/MXN y proyecciones de ahorro a largo plazo.

---

### 4. Dashboard Global y Analítica Ejecutiva ([GlobalDashboard.tsx](file:///Users/cesarayar/Documents/tlamatqui/src/components/GlobalDashboard.tsx))
Ofrece métricas agregadas de todos los diagnósticos realizados en la plataforma: GMV total auditado, ahorro proyectado, total de fugas y ranking de interés.

---

### 5. Monitoreo en Tiempo Real ([RealTimeDashboard.tsx](file:///Users/cesarayar/Documents/tlamatqui/src/components/RealTimeDashboard.tsx))
Permite rastrear visitantes únicos, tiempo de permanencia, visualizaciones por diapositiva y conversiones (clics en WhatsApp).

---

### 6. Espacios de Trabajo y Equipos ([TeamDashboard.tsx](file:///Users/cesarayar/Documents/tlamatqui/src/components/TeamDashboard.tsx))
Permite organizar la agencia en múltiples equipos de trabajo:
- Creación de equipos de trabajo con logotipo e información del líder/owner.
- Invitación y gestión de miembros con roles diferenciados:
  - **Administrador:** Control total sobre reportes, plantillas, configuraciones y usuarios.
  - **Editor:** Capacidad para crear, editar y visualizar reportes asignados.
  - **Visor:** Permisos de solo lectura para revisar diagnósticos y métricas.

---

### 7. Módulo de Socios Consultores (Partner Hub)
Permite personalizar la identidad visual del socio estratégico que realiza la consultoría y configurar sus datos de contacto.

---

### 8. Scraping Inteligente de Apps
El módulo [scrapper.ts](file:///Users/cesarayar/Documents/tlamatqui/src/lib/scrapper.ts) permite auditar tiendas Shopify automáticamente:
1. **Entrada:** La agencia ingresa la URL del comercio (ej. `tienda-ejemplo.myshopify.com`).
2. **Extracción:** Se invoca la API externa del Chismógrafo Scraper para analizar las etiquetas HTML, scripts cargados y llamadas a APIs de la tienda objetivo.
3. **Detección de Apps:** Identifica aplicaciones activas como Klaviyo, Loox, Bold, Gorgias, Lucky Orange, Infinite Options, etc.
4. **Inferencia y Categorización de Costos:** Asigna el costo mensual estimado en USD, determina el nivel de riesgo (semáforo) y redacta la justificación técnica de reemplazo nativo para Tiendanube.
5. **Simulador de Respaldo:** En caso de no haber conexión con el scraper externo, incluye un motor adaptativo que genera auditorías de demostración basadas en el dominio ingresado.

---

### 9. Interfaz de Línea de Comandos ([cli.ts](file:///Users/cesarayar/Documents/tlamatqui/cli.ts))
Proporciona una interfaz de terminal rápida para sysadmins y desarrolladores:

```bash
# Ejecutar la herramienta CLI
npm run cli <comando> [opciones]
```

#### Comandos Disponibles:
- `npm run cli list` — Muestra la lista de reportes registrados con su ID, nombre del comercio, GMV y cantidad de herramientas.
- `npm run cli info <id>` — Muestra el detalle financiero completo, plan de Shopify, plan de Tiendanube y desglose de apps de un reporte específico.
- `npm run cli delete <id>` — Elimina un reporte del sistema por su ID.
- `npm run cli seed` — Restaura el reporte de demostración por defecto **"Ginebra"**.
- `npm run cli help` — Muestra el menú de ayuda con ejemplos.

---

### 10. API REST y Especificación OpenAPI
El backend Express ([server.ts](file:///Users/cesarayar/Documents/tlamatqui/server.ts)) expone los siguientes endpoints REST documentados en [openapi.json](file:///Users/cesarayar/Documents/tlamatqui/openapi.json):

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/teams` | Obtener todos los equipos de trabajo. |
| `POST` | `/api/teams` | Crear un nuevo equipo de trabajo. |
| `PUT` | `/api/teams/:id` | Actualizar un equipo existente. |
| `DELETE` | `/api/teams/:id` | Eliminar un equipo de trabajo. |
| `GET` | `/api/reports` | Obtener la lista completa de reportes de diagnóstico. |
| `GET` | `/api/reports/:id` | Obtener el detalle de un reporte por su ID. |
| `POST` | `/api/reports` | Crear un nuevo reporte de diagnóstico. |
| `PUT` | `/api/reports/:id` | Actualizar un reporte existente. |
| `DELETE` | `/api/reports/:id` | Eliminar un reporte. |
| `POST` | `/api/reports/:id/view` | Incrementar el contador de vistas de un reporte. |
| `POST` | `/api/reports/:id/open` | Incrementar el contador de aperturas únicas. |
| `POST` | `/api/reports/:id/interaction` | Registrar eventos en tiempo real (slide_view, whatsapp_click, calculator_change, heartbeat). |
| `GET` | `/api/templates` | Obtener plantillas comparativas. |
| `POST` | `/api/templates` | Crear una nueva plantilla comparativa. |
| `DELETE` | `/api/templates/:id` | Eliminar una plantilla comparativa. |
| `GET` | `/api/exchange-rate` | Obtener tipo de cambio USD/MXN actualizado (con fallback offline). |
| `GET` | `/api/config` | Obtener la configuración global del panel. |
| `POST` | `/api/config` | Actualizar la configuración global. |
| `GET` | `/api/partner` | Obtener la configuración del socio/partner. |
| `POST` | `/api/partner` | Actualizar la configuración del socio/partner. |

---

## 🔄 Diagramas de Flujo de Trabajo

### Flujo 1: Auditoría de Tienda Shopify y Generación de Reporte

```mermaid
sequenceDiagram
    autonumber
    actor Agencia as Consultor / Agencia
    participant Admin as AdminPanel (React)
    participant Scraper as Scrapper Lib
    participant Server as Express REST API
    participant DB as DB Bridge (Prisma / JSON)

    Agencia->>Admin: Ingresa URL de Tienda Shopify (ej. mi-tienda.com)
    Admin->>Scraper: scrapeShopifyStore(storeUrl)
    Scraper-->>Admin: Retorna Apps Detectadas, Semáforos y Costos Estimados en USD
    Agencia->>Admin: Revisa GMV, selecciona Plan Shopify y Plan Tiendanube
    Agencia->>Admin: Clic en "Guardar Reporte"
    Admin->>Server: POST /api/reports (Payload del reporte)
    Server->>DB: saveDbReport(newReport)
    DB-->>Server: Confirmación de almacenamiento
    Server-->>Admin: Reporte Creado Exitosamente (HTTP 201)
    Admin-->>Agencia: Muestra enlace compartible con el cliente (?report=ID&shared=true)
```

### Flujo 2: Lectura del Cliente y Analítica en Tiempo Real

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as Cliente (Comercio E-commerce)
    participant View as ReportView (React)
    participant Server as Express REST API
    participant DB as DB Bridge (Prisma / JSON)

    Cliente->>View: Abre enlace del diagnóstico (?report=ID&shared=true)
    View->>Server: POST /api/reports/:id/open
    Server->>DB: Incrementa openCount y registra visitorId único
    loop Cada cambio de Diapositiva
        View->>Server: POST /api/reports/:id/interaction (type: "slide_view")
        Server->>DB: Actualiza slideViews[slideName]
    end
    loop Cada 5 segundos (Heartbeat)
        View->>Server: POST /api/reports/:id/interaction (type: "heartbeat")
        Server->>DB: Suma 5 segundos a timeSpentSeconds
    end
    opt Clic en WhatsApp
        View->>Server: POST /api/reports/:id/interaction (type: "whatsapp_click")
        Server->>DB: Incrementa whatsappClicks
    end
```

---

## 💻 Guía de Instalación, Configuración y Despliegue

### Requisitos Previos
- **Node.js:** v18.0.0 o superior.
- **Gestor de Paquetes:** `npm` (incluido con Node.js).
- **Base de Datos (Opcional):** PostgreSQL (Si no se especifica `DATABASE_URL`, el sistema utilizará el fallback JSON en `/data/`).

---

### Pasos de Instalación Local

1. **Clonar o descargar el repositorio:**
   ```bash
   cd /Users/cesarayar/Documents/tlamatqui
   ```

2. **Instalar dependencias del proyecto:**
   ```bash
   npm install
   ```

3. **Configurar Variables de Entorno:**
   Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

   Edita la configuración del archivo `.env`:
   ```env
   # Puerto del servidor
   PORT=4000

   # URL de conexión PostgreSQL (Opcional: Omite o deja vacío para usar almacenamiento JSON local)
   DATABASE_URL="postgresql://usuario:password@localhost:5432/tiendanube_diagnostics?schema=public"
   ```

4. **Sincronizar Base de Datos Prisma (Opcional si usas PostgreSQL):**
   ```bash
   npx prisma db push
   ```

5. **Iniciar Servidor de Desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en: [http://localhost:3000](http://localhost:3000)

---

### Scripts Disponibles en `package.json`

| Comando | Acción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor Express en modo desarrollo con Vite HMR y soporte TypeScript vía `tsx`. |
| `npm run build` | Compila la aplicación frontend con Vite y empaqueta el backend `server.ts` con `esbuild` en `dist/server.cjs`. |
| `npm run start` | Arranca el servidor de producción usando Node.js (`node dist/server.cjs`). |
| `npm run cli` | Ejecuta la herramienta de línea de comandos (`tsx cli.ts`). |
| `npm run lint` | Valida los tipos de TypeScript en todo el proyecto sin generar archivos (`tsc --noEmit`). |
| `npm run clean` | Elimina las carpetas de compilación previo a un nuevo build (`rm -rf dist server.js`). |

---

### Despliegue en Producción

Para desplegar la aplicación en servicios en la nube como Vercel, Railway, Render o un servidor VPS con Node.js:

1. **Ejecutar la compilación de producción:**
   ```bash
   npm run build
   ```
2. **Iniciar el servidor compilado:**
   ```bash
   npm run start
   ```

El backend se encargará de servir automáticamente los archivos estáticos de la aplicación React ubicados en la carpeta `dist/` y responder a todas las peticiones a la API REST `/api/*`.

---
*Documentación generada automáticamente para Tlamatqui.*
