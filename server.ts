/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Servidor Backend Principal API REST para Tlamatqui.
 * Arquitectura desacoplada basada en Express, CORS y persistencia híbrida (PostgreSQL / JSON).
 */

import express, { Request, Response } from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import {
  initializeDatabase,
  getDbConfig,
  saveDbConfig,
  getDbTeams,
  saveDbTeam,
  deleteDbTeam,
  getDbReports,
  getDbReportById,
  saveDbReport,
  deleteDbReport,
  getDbTemplates,
  saveDbTemplate,
  deleteDbTemplate,
  getDbPartner,
  saveDbPartner,
  getDbLogoConfig,
  saveDbLogoConfig
} from "./server/dbBridge.js";
import { requireRole, verifyAuth0Token } from "./server/authMiddleware.js";
import { ReportSchema, TeamSchema, ScrapeRequestSchema } from "./server/schemas.js";
import { scrapeShopifyStoreNative } from "./server/scrapper.js";
import { BACKEND_VERSION, FRONTEND_VERSION } from "./server/version.js";

// Cargar variables de entorno desde archivo .env
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// Configuración avanzada de Middleware CORS para comunicación cliente-servidor desacoplada
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : true;

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Permitir peticiones sin origen (como Postman, CLI, cURL o Server-to-Server)
    if (!origin) return callback(null, true);

    if (allowedOrigins === true) {
      return callback(null, true);
    }

    if (Array.isArray(allowedOrigins)) {
      if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        return callback(null, true);
      }
      return callback(new Error(`Origen ${origin} no permitido por política CORS`));
    }

    callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "X-User-Role",
    "Access-Control-Allow-Origin",
    "Access-Control-Allow-Headers",
    "Access-Control-Allow-Methods"
  ],
  exposedHeaders: ["Content-Range", "X-Total-Count"],
  maxAge: 86400
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Habilitar parser JSON con límite extendido para capturar datos de reportes
app.use(express.json({ limit: "50mb" }));

// Middleware para decodificación y verificación de tokens Bearer Auth0
app.use(verifyAuth0Token);


/**
 * Inicializador asíncrono del puente de base de datos.
 * Intenta conectar con PostgreSQL vía Prisma ORM o conmuta a almacenamiento local JSON.
 */
initializeDatabase().then(() => {
  console.log("\x1b[32m[DB Bridge]\x1b[0m Inicializado correctamente.");
}).catch((err) => {
  console.error("\x1b[31m[DB Bridge Error]\x1b[0m Error crítico al inicializar base de datos:", err);
});

// ============================================================================
// RUTAS DE LA API REST (ENDPOINTS)
// ============================================================================

/**
 * @route GET /api/health
 * @description Endpoint de salud para monitorear la disponibilidad de la API REST.
 */
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "online",
    service: "Tiendanube Diagnostic Analyzer Backend REST API",
    version: BACKEND_VERSION,
    frontendVersion: FRONTEND_VERSION,
    timestamp: new Date().toISOString()
  });
});

/**
 * @route POST /api/scrape
 * @description Auditoría nativa de tiendas Shopify en el backend sin dependencias externas.
 */
app.post("/api/scrape", async (req: Request, res: Response) => {
  try {
    const parseResult = ScrapeRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Solicitud inválida",
        details: parseResult.error.flatten(),
      });
    }

    const result = await scrapeShopifyStoreNative(parseResult.data.url);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Error al auditar tienda" });
  }
});

// ----------------------------------------------------------------------------
// MÓDULO DE EQUIPOS (TEAMS)
// ----------------------------------------------------------------------------

/**
 * @route GET /api/teams
 * @description Obtiene el listado de todos los equipos de trabajo registrados.
 */
app.get("/api/teams", async (req: Request, res: Response) => {
  try {
    const teams = await getDbTeams();
    res.json(teams);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/teams
 * @description Crea un nuevo equipo de trabajo con su miembro propietario por defecto.
 */
app.post("/api/teams", async (req: Request, res: Response) => {
  try {
    const newTeam = {
      id: "team-" + Math.random().toString(36).substring(2, 11),
      name: req.body.name || "Nuevo Equipo",
      image: req.body.image || "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=150&q=80",
      ownerName: req.body.ownerName || "César Ayar",
      ownerEmail: req.body.ownerEmail || "cesar.ayar19@gmail.com",
      members: req.body.members || [
        {
          id: "member-" + Math.random().toString(36).substring(2, 11),
          name: req.body.ownerName || "César Ayar",
          email: req.body.ownerEmail || "cesar.ayar19@gmail.com",
          role: "Administrador" as const,
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"
        }
      ],
      createdAt: new Date().toISOString()
    };
    const saved = await saveDbTeam(newTeam);
    res.status(201).json(saved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route PUT /api/teams/:id
 * @description Actualiza la información de un equipo existente.
 */
app.put("/api/teams/:id", async (req: Request, res: Response) => {
  try {
    const teams = await getDbTeams();
    const index = teams.findIndex((t: any) => t.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Equipo no encontrado" });
    }
    const updatedTeam = { ...teams[index], ...req.body, id: req.params.id };
    const saved = await saveDbTeam(updatedTeam);
    res.json(saved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route DELETE /api/teams/:id
 * @description Elimina un equipo de trabajo por su ID.
 */
app.delete("/api/teams/:id", async (req: Request, res: Response) => {
  try {
    const success = await deleteDbTeam(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Equipo no encontrado" });
    }
    res.json({ message: "Equipo eliminado con éxito" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------------------------------
// MÓDULO DE REPORTES Y DIAGNÓSTICOS (REPORTS)
// ----------------------------------------------------------------------------

/**
 * @route GET /api/reports
 * @description Obtiene todos los reportes de diagnóstico financiero creados.
 */
app.get("/api/reports", async (req: Request, res: Response) => {
  try {
    const reports = await getDbReports();
    res.json(reports);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/reports/:id
 * @description Obtiene el detalle completo de un reporte de diagnóstico por su ID.
 */
app.get("/api/reports/:id", async (req: Request, res: Response) => {
  try {
    const report = await getDbReportById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: "Reporte no encontrado" });
    }
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/reports
 * @description Crea un nuevo reporte de diagnóstico.
 */
app.post("/api/reports", async (req: Request, res: Response) => {
  try {
    const newReport = {
      ...req.body,
      id: req.body.id || Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString()
    };
    const saved = await saveDbReport(newReport);
    res.status(201).json(saved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route PUT /api/reports/:id
 * @description Actualiza los datos de un reporte existente.
 */
app.put("/api/reports/:id", async (req: Request, res: Response) => {
  try {
    const report = await getDbReportById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: "Reporte no encontrado" });
    }
    const updatedReport = { ...report, ...req.body, id: req.params.id };
    const saved = await saveDbReport(updatedReport);
    res.json(saved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route DELETE /api/reports/:id
 * @description Elimina un reporte de diagnóstico por su ID.
 */
app.delete("/api/reports/:id", async (req: Request, res: Response) => {
  try {
    const success = await deleteDbReport(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Reporte no encontrado" });
    }
    res.json({ message: "Reporte eliminado con éxito" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/reports/:id/view
 * @description Incrementa el contador global de impresiones/vistas del reporte.
 */
app.post("/api/reports/:id/view", async (req: Request, res: Response) => {
  try {
    const report = await getDbReportById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: "Reporte no encontrado" });
    }
    report.viewCount = (report.viewCount || 0) + 1;
    const saved = await saveDbReport(report);
    res.json({ success: true, viewCount: saved.viewCount });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/reports/:id/open
 * @description Incrementa el contador de aperturas únicas de la presentación.
 */
app.post("/api/reports/:id/open", async (req: Request, res: Response) => {
  try {
    const report = await getDbReportById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: "Reporte no encontrado" });
    }
    report.openCount = (report.openCount || 0) + 1;
    const saved = await saveDbReport(report);
    res.json({ success: true, openCount: saved.openCount });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/reports/:id/interaction
 * @description Registra métricas en tiempo real: visitantes únicos, vistas por slide, clics en WhatsApp/calculadoras y heartbeat de lectura.
 */
app.post("/api/reports/:id/interaction", async (req: Request, res: Response) => {
  try {
    const report = await getDbReportById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: "Reporte no encontrado" });
    }

    const { visitorId, type, details } = req.body;

    // 1. Rastreo de usuario único
    if (visitorId) {
      if (!report.uniqueVisitorIds) {
        report.uniqueVisitorIds = [];
      }
      if (!report.uniqueVisitorIds.includes(visitorId)) {
        report.uniqueVisitorIds.push(visitorId);
      }
      report.uniqueVisitors = report.uniqueVisitorIds.length;
    }

    // Inicializar estructura de interacciones
    if (!report.interactions) {
      report.interactions = {
        slideViews: {},
        whatsappClicks: 0,
        toolClicks: 0,
        calculatorInteractions: 0,
        timeSpentSeconds: 0,
      };
    }

    if (!report.interactions.slideViews) {
      report.interactions.slideViews = {};
    }

    // 2. Procesar tipo específico de evento
    if (type === "slide_view") {
      const slide = details?.slideName || "unknown";
      report.interactions.slideViews[slide] = (report.interactions.slideViews[slide] || 0) + 1;
    } else if (type === "whatsapp_click") {
      report.interactions.whatsappClicks = (report.interactions.whatsappClicks || 0) + 1;
    } else if (type === "tool_click") {
      report.interactions.toolClicks = (report.interactions.toolClicks || 0) + 1;
    } else if (type === "calculator_change") {
      report.interactions.calculatorInteractions = (report.interactions.calculatorInteractions || 0) + 1;
      if (details) {
        if (typeof details.gmv === "number") {
          report.gmv = details.gmv;
        }
        if (typeof details.shopifyPlan === "string") {
          report.shopifyPlan = details.shopifyPlan as any;
        }
        if (typeof details.appsCostUSD === "number") {
          (report as any).shopifyAppsCostUSD = details.appsCostUSD;
        }
        if (typeof details.appsCostMXN === "number") {
          (report as any).shopifyAppsCostMXN = details.appsCostMXN;
        }
      }
    } else if (type === "heartbeat") {
      const seconds = details?.seconds || 5;
      report.interactions.timeSpentSeconds = (report.interactions.timeSpentSeconds || 0) + seconds;
    }

    const saved = await saveDbReport(report);
    res.json({ 
      success: true, 
      uniqueVisitors: saved.uniqueVisitors || 0, 
      interactions: saved.interactions 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------------------------------
// MÓDULO DE PLANTILLAS COMPARATIVAS (TEMPLATES)
// ----------------------------------------------------------------------------

/**
 * @route GET /api/templates
 * @description Obtiene el catálogo de plantillas comparativas predefinidas.
 */
app.get("/api/templates", async (req: Request, res: Response) => {
  try {
    const templates = await getDbTemplates();
    res.json(templates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/templates
 * @description Crea una nueva plantilla comparativa reutilizable.
 */
app.post("/api/templates", async (req: Request, res: Response) => {
  try {
    const newTemplate = {
      ...req.body,
      id: Math.random().toString(36).substring(2, 11)
    };
    const saved = await saveDbTemplate(newTemplate);
    res.status(201).json(saved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route DELETE /api/templates/:id
 * @description Elimina una plantilla comparativa por su ID.
 */
app.delete("/api/templates/:id", async (req: Request, res: Response) => {
  try {
    const success = await deleteDbTemplate(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Plantilla no encontrada" });
    }
    res.json({ message: "Plantilla eliminada con éxito" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------------------------------
// MÓDULO DE SERVICIOS FINANCIEROS Y CONFIGURACIÓN
// ----------------------------------------------------------------------------

/**
 * @route GET /api/exchange-rate
 * @description Consulta el tipo de cambio USD/MXN en tiempo real con fallback a la configuración del panel.
 */
app.get("/api/exchange-rate", async (req: Request, res: Response) => {
  try {
    const config = await getDbConfig();
    const fallbackRate = Number(config.customExchangeRate) || 18.50;
    try {
      const response = await fetch("https://open.er-api.com/v6/latest/USD");
      if (!response.ok) throw new Error("API financiera externa no disponible");
      const data = await response.json();
      const rate = data.rates?.MXN || fallbackRate;
      res.json({ rate, provider: "open.er-api.com", status: "fresh" });
    } catch (error) {
      res.json({ rate: fallbackRate, provider: "offline-fallback", status: "fallback" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/config
 * @description Obtiene los parámetros globales del panel de administración.
 */
app.get("/api/config", async (req: Request, res: Response) => {
  try {
    const config = await getDbConfig();
    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/config
 * @description Actualiza los parámetros globales del panel de administración.
 */
app.post("/api/config", async (req: Request, res: Response) => {
  try {
    const config = await getDbConfig();
    const newConfig = { ...config, ...req.body };
    const saved = await saveDbConfig(newConfig);
    res.json(saved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/partner
 * @description Obtiene la información de la marca del socio consultor autorizado.
 */
app.get("/api/partner", async (req: Request, res: Response) => {
  try {
    const partner = await getDbPartner();
    res.json(partner);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/partner
 * @description Actualiza la información de la marca del socio consultor.
 */
app.post("/api/partner", async (req: Request, res: Response) => {
  try {
    const saved = await saveDbPartner(req.body);
    res.json(saved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/logo-config
 * @description Obtiene la configuración del tipo de logo (texto o logo), texto/archivo del logo y correo global.
 */
app.get("/api/logo-config", async (req: Request, res: Response) => {
  try {
    const config = await getDbLogoConfig();
    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/logo-config
 * @description Guarda o actualiza la configuración del logo (tipo de logo: texto o logo, texto/archivo) y correo global.
 */
app.post("/api/logo-config", async (req: Request, res: Response) => {
  try {
    const saved = await saveDbLogoConfig(req.body);
    res.json(saved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Fallback de archivos estáticos para modo de despliegue monolítico
if (process.env.NODE_ENV === "production" && process.env.SERVE_STATIC === "true") {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req: Request, res: Response) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Iniciar servidor REST API independiente (solo si no se ejecuta en Vercel Serverless)
if (process.env.VERCEL !== "1" && process.env.NODE_ENV !== "test") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\x1b[36m[Backend REST API]\x1b[0m Escuchando en http://localhost:${PORT}`);
    console.log(`\x1b[32m[Health Check]\x1b[0m Endpoint de salud disponible en http://localhost:${PORT}/api/health`);
  });
}

export default app;

