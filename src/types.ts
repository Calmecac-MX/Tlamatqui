/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Definición centralizada de tipos e interfaces TypeScript de Tlamatqui.
 * Modelado fuertemente tipado correspondiente al esquema de Prisma y objetos de dominio.
 */

/**
 * Representa una aplicación o herramienta de terceros auditada dentro de una tienda Shopify.
 */
export interface Tool {
  /** Identificador único de la herramienta */
  id: string;
  /** Nombre de la aplicación (ej. Klaviyo, Loox, Bold) */
  name: string;
  /** Categoría funcional (ej. Marketing, Reviews, Suscripciones) */
  category: string;
  /** Tipo de costo: monto exacto o rango min-max */
  costType: "exact" | "range";
  /** Costo exacto mensual si costType es 'exact' */
  costExact: number;
  /** Límite inferior del rango de costo mensual si costType es 'range' */
  costMin: number;
  /** Límite superior del rango de costo mensual si costType es 'range' */
  costMax: number;
  /** Divisa de facturación (MXN o USD) */
  currency: "MXN" | "USD";
  /** Semáforo de riesgo / reemplazo (green = reemplazable gratis, yellow = costo menor, red = alto costo extra) */
  semaphore: "green" | "yellow" | "red";
  /** Enlace a la tienda de aplicaciones o web oficial */
  url?: string;
  /** Explicación detallada del impacto financiero y alternativa en Tiendanube */
  description?: string;
  /** URL del logotipo de la aplicación */
  logo?: string;
}

/**
 * Representa una fila individual en la matriz comparativa de ventajas Shopify vs Tiendanube.
 */
export interface ComparisonRow {
  /** Identificador único de la fila */
  id: string;
  /** Variable o característica a comparar (ej. Facturación, Soporte, MSI) */
  variable: string;
  /** Condición o cobro en Shopify */
  shopify: string;
  /** Condición ventajosa en Tiendanube */
  tiendanube: string;
  /** Etiqueta destacada (ej. '0% Comisión', 'Ahorro Fiscal') */
  pillText: string;
}

/**
 * Plantilla estandarizada de comparación reutilizable en nuevos reportes.
 */
export interface ComparisonTemplate {
  /** Identificador único de la plantilla */
  id: string;
  /** Nombre de la plantilla (ej. 'Comparativo Shopify vs Tiendanube Estándar') */
  name: string;
  /** Filas comparativas configuradas en la plantilla */
  rows: ComparisonRow[];
}

/**
 * Registro completo de un reporte de diagnóstico financiero para un comercio de e-commerce.
 */
export interface Report {
  /** Identificador único del reporte */
  id: string;
  /** Nombre del comercio o marca auditada */
  name: string;
  /** URL del logotipo del comercio */
  logo?: string;
  /** Eslogan o mensaje persuasivo del diagnóstico */
  tagline?: string;
  /** Cantidad de fugas de dinero detectadas */
  fugasCantidad?: number;
  /** Límite inferior del rango de ahorro estimado ($ MXN) */
  fugasRangoMin?: number;
  /** Límite superior del rango de ahorro estimado ($ MXN) */
  fugasRangoMax?: number;
  /** Tráfico mensual aproximado en visitas */
  visitasMensuales: number;
  /** Volumen General de Ventas (GMV) mensual estimado ($ MXN) */
  gmv: number;
  /** Tarifa de comisiones en Shopify estimada ($ MXN) */
  shopifyFee?: number;
  /** Meses sin intereses configurados (ej. '3, 6, 9 meses') */
  msi?: string;
  /** URL del sitio web oficial del comercio */
  businessUrl?: string;
  /** Plan actual contratado en Shopify */
  shopifyPlan: "basic" | "grow" | "advanced" | "plus" | "custom";
  /** Tarifa de comisión personalizada en Shopify (%) si plan es 'custom' */
  shopifyPlanCustomFee?: number;
  /** Precio mensual fijo personalizado en Shopify ($ USD) si plan es 'custom' */
  shopifyPlanCustomPrice?: number;
  /** Gasto total mensual en herramientas de terceros en USD */
  shopifyAppsCostUSD?: number;
  /** Gasto total mensual en herramientas de terceros convertido a MXN */
  shopifyAppsCostMXN?: number;
  /** Plan objetivo seleccionado para migrar a Tiendanube */
  tiendanubePlan: "basic" | "tiendanube" | "advanced" | "evolution";
  /** Arreglo de aplicaciones de terceros auditadas */
  tools: Tool[];
  /** Matriz de características comparativas activas en este reporte */
  comparisonRows: ComparisonRow[];
  /** Correo de contacto del consultor comercial */
  contactEmail: string;
  /** Número de WhatsApp de contacto del consultor comercial */
  contactWhatsapp: string;
  /** Arreglo de URLs de logotipos de administradores/agencia */
  adminLogos: string[];
  /** Título de la tarjeta del socio consultor 1 */
  brandCard1Title?: string;
  /** Descripción de la tarjeta del socio consultor 1 */
  brandCard1Desc?: string;
  /** Logo del socio consultor 1 */
  brandCard1Logo?: string;
  /** Enlace de contacto del socio consultor 1 */
  brandCard1Link?: string;
  /** Título de la tarjeta del socio consultor 2 */
  brandCard2Title?: string;
  /** Descripción de la tarjeta del socio consultor 2 */
  brandCard2Desc?: string;
  /** Logo del socio consultor 2 */
  brandCard2Logo?: string;
  /** Enlace de contacto del socio consultor 2 */
  brandCard2Link?: string;
  /** Logo principal mostrado en la diapositiva final */
  finalSlideMainLogo?: string;
  /** Logo adicional 1 mostrado en la diapositiva final */
  finalSlideLogo2?: string;
  /** Logo adicional 2 mostrado en la diapositiva final */
  finalSlideLogo3?: string;
  /** Fecha ISO de creación del reporte */
  createdAt?: string;
  /** Conteo total de impresiones de la presentación */
  viewCount?: number;
  /** Conteo total de aperturas únicas */
  openCount?: number;
  /** Cantidad de visitantes únicos detectados */
  uniqueVisitors?: number;
  /** Arreglo de IDs anónimos de visitantes únicos */
  uniqueVisitorIds?: string[];
  /** ID del equipo asignado a este reporte */
  teamId?: string;
  /** Datos del equipo de trabajo asignado al reporte */
  team?: Team;
  /** Correo electrónico del creador o agente asignado */
  createdBy?: string;
  /** Registro detallado de interacciones y analíticas en tiempo real */

  interactions?: {
    /** Diccionario con el número de vistas por nombre de diapositiva */
    slideViews: Record<string, number>;
    /** Número de clics en el botón directo de WhatsApp */
    whatsappClicks: number;
    /** Número de clics en enlaces de herramientas */
    toolClicks: number;
    /** Número de manipulaciones de la calculadora interactiva */
    calculatorInteractions: number;
    /** Tiempo acumulado de permanencia en segundos */
    timeSpentSeconds: number;
  };
}

/**
 * Parámetros de configuración global del panel de administración.
 */
export interface Config {
  /** ID único de configuración */
  id: string;
  /** URL del logotipo principal del panel */
  adminLogoUrl: string;
  /** URL del segundo logotipo opcional del panel o propuesta */
  adminLogo2Url?: string;
  /** URL del tercer logotipo opcional del panel o propuesta */
  adminLogo3Url?: string;
  /** Texto del encabezado si no hay imagen de logo */
  adminTextUrl: string;
  /** URL base donde está alojada la aplicación */
  appUrl: string;
  /** Correo de contacto predeterminado */
  defaultContactEmail: string;
  /** WhatsApp de contacto predeterminado */
  defaultContactWhatsapp: string;
  /** Tipo de cambio personalizado USD/MXN */
  customExchangeRate: number;
  /** Nombre del usuario administrador principal */
  userName: string;
  /** Correo del usuario administrador principal */
  userEmail: string;
  /** Rol del usuario administrador */
  userRole: "Superusuario" | "Administrador" | "Agente" | "Visor";
  /** Avatar del usuario administrador */
  userAvatar: string;
  /** Intervalo en milisegundos para refrescar métricas en vivo */
  metricsUpdateInterval: number;
  /** Título de la tarjeta del socio consultor secundario */
  brandCard2Title?: string;
  /** Descripción del socio consultor secundario */
  brandCard2Desc?: string;
  /** Logo del socio consultor secundario */
  brandCard2Logo?: string;
  /** Enlace del socio consultor secundario */
  brandCard2Link?: string;
  /** Indica si la integración de dominio personalizado está activa */
  customDomainEnabled?: boolean;
  /** Dominio personalizado configurado para compartir reportes (ej. https://reportes.miagencia.com) */
  customDomain?: string;
  /** Token de verificación para registro TXT DNS */
  domainVerificationToken?: string;
  /** Indica si el dominio ha sido verificado mediante TXT DNS */
  domainVerified?: boolean;
  /** Fecha ISO de verificación de la propiedad del dominio */
  domainVerifiedAt?: string;
}


export type UserRole = "Superusuario" | "Administrador" | "Agente" | "Visor";

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  sub?: string;
  accessToken?: string;
  idToken?: string;
  tokenExpiresAt?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Integrante individual de una marca de socio/partner consultor.
 */
export interface PartnerMember {
  id: string;
  name: string;
  email: string;
  role: string; // "Lector" | "Lector y Comentarista"
  partnerId: string;
}

/**
 * Configuración de la marca del socio consultor estratégico.
 */
export interface Partner {
  id: string;
  name: string;
  logo: string;
  description: string;
  link?: string;
  members: PartnerMember[];
}

/**
 * Miembro individual asignado a un equipo de trabajo.
 */
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Superusuario" | "Administrador" | "Agente" | "Visor";
  avatar?: string;
}

/**
 * Organización o empresa aliada vinculada a un equipo.
 */
export interface Ally {
  id: string;
  name: string;
  logo: string;
  url: string;
  teamId?: string;
}

/**
 * Espacio de trabajo o equipo de consultoría.
 */
export interface Team {
  id: string;
  name: string;
  image?: string;
  ownerName: string;
  ownerEmail: string;
  members: TeamMember[];
  /** Token secreto único para el enlace de invitación al equipo */
  inviteToken?: string;
  /** Rol asignado por defecto a los miembros que se unan vía enlace */
  inviteRole?: "Superusuario" | "Administrador" | "Agente" | "Visor";
  /** Nombre de marca configurado para el reporte */
  teamBrandName?: string;
  /** URL del logotipo de marca del reporte */
  teamBrandLogo?: string;
  /** Sitio web oficial de la marca del reporte */
  teamBrandWebsite?: string;
  /** Relación de empresas o socios aliados del equipo */
  allies?: Ally[];
  createdAt: string;
}



/**
 * Tipo de logo configurado: 'text' para solo texto o 'logo' para archivo/imagen de logo.
 */
export type LogoType = "text" | "logo";

/**
 * Modelo de configuración de marca y correo global (LogoConfig).
 */
export interface LogoConfig {
  /** Identificador único de la configuración */
  id: string;
  /** Tipo de logo ('text' o 'logo') */
  logoType: LogoType;
  /** Texto del logo si logoType es 'text' */
  logoText?: string;
  /** Archivo o URL del logo si logoType es 'logo' */
  logoFile?: string;
  /** Correo global de contacto */
  globalEmail?: string;
  /** Fecha ISO de creación */
  createdAt?: string;
  /** Fecha ISO de actualización */
  updatedAt?: string;
}

/**
 * Representa una llave de API (API Key) para integraciones externas o programáticas.
 */
export interface ApiKeyItem {
  id: string;
  name: string;
  maskedKey: string;
  rawToken?: string;
  status: "active" | "revoked";
  createdByName?: string;
  lastUsedAt?: string;
  createdAt: string;
}

/**
 * Métricas de salud, monitoreo y estado de la base de datos para Superusuarios.
 */
export interface SystemHealthData {
  status: "healthy" | "warning" | "degraded";
  uptimeSeconds: number;
  memoryUsage: {
    rssMB: number;
    heapTotalMB: number;
    heapUsedMB: number;
    externalMB: number;
  };
  database: {
    status: "connected" | "disconnected" | "fallback_json";
    provider: string;
    latencyMs: number;
    counts: {
      reports: number;
      teams: number;
      users: number;
      templates: number;
    };
  };
  serverInfo: {
    nodeVersion: string;
    platform: string;
    environment: string;
    apiLocked: boolean;
    lockReason?: string;
  };
}
