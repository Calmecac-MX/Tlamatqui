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
import zlib from "node:zlib";

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
  saveDbLogoConfig,
  verifyCustomDomainDNS,
  getTeamByInviteToken,
  resetTeamInviteToken,
  joinTeamViaInviteToken,
  getDbUsers,
  registerOrSyncUser,
  updateUserRole,
  getSystemHealthStatus,
  getDbApiKeys,
  createDbApiKey,
  deleteDbApiKey,
  getApiLockStatus,
  toggleApiLock,
  resetInstanceToFactorySettings
} from "./server/dbBridge.js";
import { requireRole, verifyAuth0Token, verifyApiSecretToken, verifyApiLock } from "./server/authMiddleware.js";
import { ReportSchema, TeamSchema, ScrapeRequestSchema, SendEmailRequestSchema, SendTeamInviteEmailRequestSchema } from "./server/schemas.js";
import { scrapeShopifyStoreNative } from "./server/scrapper.js";
import { isSmtpConfigured, isBrevoConfigured, isEmailConfigured, sendReportEmail, sendTeamInviteEmail, verifySmtpConnection } from "./server/emailService.js";
import { getFullDNSDiagnostics, provisionDomainOnVercel, sanitizeDomain } from "./server/dnsIntegrationService.js";
import { isEncryptionConfigured } from "./server/encryptionService.js";
import { BACKEND_VERSION, FRONTEND_VERSION } from "./server/version.js";

// Cargar variables de entorno desde archivo .env
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// Configuración avanzada de Middleware CORS para comunicación cliente-servidor desacoplada
const envOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim().replace(/\/+$/, "")).filter(Boolean)
  : [];

const frontendOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((o) => o.trim().replace(/\/+$/, "")).filter(Boolean)
  : [];

const defaultProductionOrigins = [
  "https://tlamatqui.calmecac.lat",
  "https://api.tlamatqui.calmecac.lat",
  "http://localhost:3000",
  "http://localhost:4000",
  "http://localhost:5173"
];

const rawOrigins = [...envOrigins, ...frontendOrigins, ...defaultProductionOrigins];
const allowedOriginsList = Array.from(new Set(rawOrigins.map((o) => o.trim().replace(/\/+$/, "")).filter(Boolean)));

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Permitir peticiones sin origen (como Postman, CLI, cURL o Server-to-Server)
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.trim().replace(/\/+$/, "");

    if (allowedOriginsList.includes("*") || allowedOriginsList.includes(cleanOrigin)) {
      return callback(null, true);
    }

    // Permitir subdominios de calmecac.lat y vercel.app automáticamente
    if (cleanOrigin.endsWith(".calmecac.lat") || cleanOrigin.endsWith(".vercel.app")) {
      return callback(null, true);
    }

    callback(null, false);
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
    "X-API-Secret",
    "x-api-secret",
    "Access-Control-Allow-Origin",
    "Access-Control-Allow-Headers",
    "Access-Control-Allow-Methods"
  ],
  exposedHeaders: ["Content-Range", "X-Total-Count"],
  maxAge: 86400
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Middleware de compresión Gzip nativa para respuestas API superiores a 1KB
app.use((req: Request, res: Response, next) => {
  const acceptEncoding = req.headers["accept-encoding"] || "";
  if (!acceptEncoding.includes("gzip")) {
    return next();
  }

  const originalSend = res.send;
  res.send = function (body: any): Response {
    if (res.headersSent) {
      return originalSend.call(this, body);
    }
    if (typeof body === "string" || Buffer.isBuffer(body)) {
      const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body);
      if (buffer.length > 1024) {
        try {
          const compressed = zlib.gzipSync(buffer);
          res.setHeader("Content-Encoding", "gzip");
          res.setHeader("Content-Length", compressed.length);
          return originalSend.call(this, compressed);
        } catch (e) {
          console.error("Error al comprimir respuesta Gzip:", e);
        }
      }
    }
    return originalSend.call(this, body);
  };

  next();
});

// Habilitar parser JSON optimizado (límite 15MB suficiente para reportes con imágenes/PDFs)
app.use(express.json({ limit: "15mb" }));


// Middleware para validación de token secreto cliente-servidor
app.use(verifyApiSecretToken);

// Middleware para decodificación y verificación de tokens Bearer Auth0
app.use(verifyAuth0Token);

// Middleware para verificar bloqueo global de la API REST activado por el Superusuario
app.use(verifyApiLock);


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
    service: "Tlamatqui Backend REST API",
    version: BACKEND_VERSION,
    frontendVersion: FRONTEND_VERSION,
    emailConfigured: isEmailConfigured(),
    brevoConfigured: isBrevoConfigured(),
    smtpConfigured: isSmtpConfigured(),
    encryptionConfigured: isEncryptionConfigured(),
    timestamp: new Date().toISOString()
  });
});


/**
 * @route GET /api/auth/callback
 * @description Endpoint de callback para Auth0. Procesa la respuesta de redirección y redirige al usuario al Frontend.
 */
app.get("/api/auth/callback", (req: Request, res: Response) => {
  const { code, state, error, error_description } = req.query;
  const rawFrontend = process.env.FRONTEND_URL || "http://localhost:3000";
  const primaryFrontend = rawFrontend.split(",")[0].trim().replace(/\/+$/, "");

  try {
    const targetUrl = new URL("/tlachialoyan", primaryFrontend);

    if (error) {
      targetUrl.searchParams.set("error", String(error));
      if (error_description) {
        targetUrl.searchParams.set("error_description", String(error_description));
      }
    } else {
      if (code) targetUrl.searchParams.set("code", String(code));
      if (state) targetUrl.searchParams.set("state", String(state));
    }

    return res.redirect(targetUrl.toString());
  } catch (err) {
    console.error("[Auth0 Callback Endpoint Error]", err);
    return res.redirect(`${primaryFrontend}/tlachialoyan`);
  }
});

/**
 * @route POST /api/users/sync
 * @description Sincroniza o registra un usuario al iniciar sesión.
 * REGLA: Si la lista de usuarios está vacía, le otorga automáticamente el rol de Superusuario al primer usuario.
 */
app.post("/api/users/sync", async (req: Request, res: Response) => {
  try {
    const { email, name, avatar, sub, accessToken, idToken, tokenExpiresAt, lastLoginAt } = req.body;
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ error: "Email válido es requerido para la sincronización de usuario." });
    }

    const syncedUser = await registerOrSyncUser({
      email,
      name,
      avatar,
      sub,
      accessToken,
      idToken,
      tokenExpiresAt,
      lastLoginAt
    });

    res.json({
      success: true,
      user: syncedUser
    });
  } catch (err: any) {
    console.error("Error al sincronizar usuario:", err);
    res.status(500).json({ error: "Error interno al sincronizar el usuario." });
  }
});

/**
 * @route GET /api/users
 * @description Obtiene el listado completo de usuarios del sistema (Requiere rol Administrador o Superusuario).
 */
app.get("/api/users", requireRole(["Superusuario", "Administrador"]), async (req: Request, res: Response) => {
  try {
    const users = await getDbUsers();
    const sanitizedUsers = users.map((u) => ({
      ...u,
      accessToken: u.accessToken ? "••••••••••••••••" : undefined,
      idToken: u.idToken ? "••••••••••••••••" : undefined
    }));
    res.json(sanitizedUsers);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener usuarios del sistema." });
  }
});

/**
 * @route PATCH /api/users/:id/role
 * @description Actualiza el rol de un usuario existente (Requiere permisos de Superusuario o Administrador).
 */
app.patch("/api/users/:id/role", requireRole(["Superusuario", "Administrador"]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const requesterRole = (req.headers["x-user-role"] as string) || (req as any).userRole || "Administrador";

    if (!role || !["Superusuario", "Administrador", "Editor", "Visor"].includes(role)) {
      return res.status(400).json({ error: "Rol no válido. Opciones permitidas: Superusuario, Administrador, Editor, Visor." });
    }

    // REGLA DE SEGURIDAD: Únicamente un Superusuario puede asignar u otorgar el rol de Superusuario
    if (role === "Superusuario" && requesterRole !== "Superusuario") {
      return res.status(403).json({
        error: "Acceso denegado",
        message: "Únicamente un Superusuario puede asignar u otorgar el rol de Superusuario a otros usuarios."
      });
    }

    const updated = await updateUserRole(id, role as any);
    if (!updated) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar rol del usuario." });
  }
});

// ============================================================================
// RUTAS EXCLUSIVAS DE SUPERUSUARIO (SALUD, MONITOREO, BASE DE DATOS, API KEYS Y BLOQUEO)
// ============================================================================

/**
 * @route GET /api/superadmin/health
 * @description Obtiene el reporte en tiempo real de salud del sistema, servidor, RAM y base de datos.
 */
app.get("/api/superadmin/health", requireRole(["Superusuario"]), async (req: Request, res: Response) => {
  try {
    const health = await getSystemHealthStatus();
    res.json(health);
  } catch (err: any) {
    res.status(500).json({ error: "Error al obtener diagnóstico de salud del sistema." });
  }
});

/**
 * @route GET /api/superadmin/api-keys
 * @description Obtiene la lista de API Keys generadas.
 */
app.get("/api/superadmin/api-keys", requireRole(["Superusuario"]), async (req: Request, res: Response) => {
  try {
    const keys = await getDbApiKeys();
    res.json(keys);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener llaves de API." });
  }
});

/**
 * @route POST /api/superadmin/api-keys
 * @description Genera una nueva API Key de integración programática.
 */
app.post("/api/superadmin/api-keys", requireRole(["Superusuario"]), async (req: Request, res: Response) => {
  try {
    const { name, createdByName } = req.body;
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Nombre descriptivo de la API Key es requerido." });
    }

    const created = await createDbApiKey(name, createdByName);
    res.json({ success: true, ...created });
  } catch (err) {
    res.status(500).json({ error: "Error al generar la API Key." });
  }
});

/**
 * @route DELETE /api/superadmin/api-keys/:id
 * @description Revoca / elimina una API Key existente.
 */
app.delete("/api/superadmin/api-keys/:id", requireRole(["Superusuario"]), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteDbApiKey(id);
    res.json({ success: true, message: "API Key eliminada o revocada exitosamente." });
  } catch (err) {
    res.status(500).json({ error: "Error al revocar la API Key." });
  }
});

/**
 * @route GET /api/superadmin/api-lock
 * @description Obtiene el estado actual del bloqueo global de la API.
 */
app.get("/api/superadmin/api-lock", requireRole(["Superusuario"]), async (req: Request, res: Response) => {
  try {
    const status = await getApiLockStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: "Error al consultar estado de bloqueo de API." });
  }
});

/**
 * @route POST /api/superadmin/toggle-api-lock
 * @description Bloquea o desbloquea el acceso global a la API REST.
 */
app.post("/api/superadmin/toggle-api-lock", requireRole(["Superusuario"]), async (req: Request, res: Response) => {
  try {
    const { apiLocked, lockReason } = req.body;
    if (typeof apiLocked !== "boolean") {
      return res.status(400).json({ error: "Parámetro 'apiLocked' (booleano) es requerido." });
    }

    const result = await toggleApiLock(apiLocked, lockReason);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar el estado de bloqueo de la API." });
  }
});

/**
 * @route POST /api/factory-reset
 * @route POST /api/superadmin/factory-reset
 * @description Endpoint dedicado para restablecer la instancia completa a su configuración de fábrica.
 * @access Private (Superusuario / Requiere confirmCode: "RESTABLECER_FABRICA")
 */
const handleFactoryResetEndpoint = async (req: Request, res: Response) => {
  try {
    const { confirmCode } = req.body || {};
    if (confirmCode !== "RESTABLECER_FABRICA") {
      return res.status(400).json({
        success: false,
        message: 'Código de confirmación incorrecto. Envía { "confirmCode": "RESTABLECER_FABRICA" } en el cuerpo JSON para proceder.'
      });
    }

    const result = await resetInstanceToFactorySettings();
    if (result.success) {
      return res.json(result);
    } else {
      return res.status(500).json(result);
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: "Error del servidor al ejecutar el restablecimiento de fábrica."
    });
  }
};

app.post("/api/factory-reset", requireRole(["Superusuario"]), handleFactoryResetEndpoint);
app.post("/api/superadmin/factory-reset", requireRole(["Superusuario"]), handleFactoryResetEndpoint);

/**
 * @route GET /api/smtp-status
 * @description Verifica el estado de configuración del servidor SMTP.
 */
app.get("/api/smtp-status", (req: Request, res: Response) => {
  const brevoActive = isBrevoConfigured();
  res.json({
    configured: isEmailConfigured(),
    provider: brevoActive ? "Brevo API v3" : (isSmtpConfigured() ? "Nodemailer SMTP" : "Ninguno"),
    brevoConfigured: brevoActive,
    smtpConfigured: isSmtpConfigured(),
    host: brevoActive ? "https://api.brevo.com/v3/smtp/email" : (process.env.SMTP_HOST || ""),
    port: process.env.SMTP_PORT || "587",
    from: process.env.BREVO_SENDER_EMAIL || process.env.SMTP_FROM || ""
  });
});


/**
 * @route POST /api/verify-smtp
 * @description Comprueba la conectividad real con el servidor SMTP configurado.
 */
app.post("/api/verify-smtp", async (req: Request, res: Response) => {
  const result = await verifySmtpConnection();
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

/**
 * @route POST /api/send-report-email
 * @description Envía el reporte de diagnóstico por correo electrónico vía SMTP.
 */
app.post("/api/send-report-email", async (req: Request, res: Response) => {
  try {
    const parseResult = SendEmailRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Datos de correo inválidos",
        details: parseResult.error.flatten(),
      });
    }

    const { toEmail, reportId, customSubject, note, pdfBase64 } = parseResult.data;

    // Buscar reporte en la base de datos
    const report = await getDbReportById(reportId);
    if (!report) {
      return res.status(404).json({ error: "El reporte solicitado no existe." });
    }

    const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const cleanBaseUrl = frontendBaseUrl.endsWith("/") ? frontendBaseUrl.slice(0, -1) : frontendBaseUrl;
    const reportUrl = `${cleanBaseUrl}/?report=${report.id}&shared=true`;

    const gmvFormatted = new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0
    }).format(report.gmv || 0);

    const emailResult = await sendReportEmail({
      toEmail,
      reportId: report.id,
      storeName: report.name || "Comercio",
      reportUrl,
      gmvFormatted,
      customSubject,
      note,
      pdfBase64
    });

    res.json({
      success: true,
      message: `Reporte enviado exitosamente a ${toEmail}`,
      messageId: emailResult.messageId
    });
  } catch (error: any) {
    console.error("Error al enviar correo SMTP:", error);
    res.status(500).json({
      error: "Error al enviar el correo vía SMTP",
      details: error.message
    });
  }
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
    res.json({ message: "Equipo eliminado correctamente" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/teams/invite/:token
 * @description Obtiene los datos de vista previa pública de un equipo para la pantalla de invitación.
 */
app.get("/api/teams/invite/:token", async (req: Request, res: Response) => {
  try {
    const team = await getTeamByInviteToken(req.params.token);
    if (!team) {
      return res.status(404).json({ error: "El enlace de invitación no es válido o ha caducado" });
    }
    res.json({
      id: team.id,
      name: team.name,
      image: team.image,
      ownerName: team.ownerName,
      inviteRole: team.inviteRole || "Visor",
      memberCount: team.members.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/teams/invite/join
 * @description Une a un nuevo usuario como miembro del equipo mediante su token de invitación.
 */
app.post("/api/teams/invite/join", async (req: Request, res: Response) => {
  try {
    const { token, name, email, avatar } = req.body;
    const result = await joinTeamViaInviteToken(token, name, email, avatar);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route POST /api/teams/:id/reset-invite
 * @description Regenera un nuevo token de invitación para el equipo (invalida el enlace anterior).
 */
app.post("/api/teams/:id/reset-invite", async (req: Request, res: Response) => {
  try {
    const updatedTeam = await resetTeamInviteToken(req.params.id);
    if (!updatedTeam) {
      return res.status(404).json({ error: "Equipo no encontrado" });
    }
    res.json(updatedTeam);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/teams/:id/send-invite-email
 * @description Envía una invitación por correo electrónico a un nuevo miembro para unirse al equipo.
 */
app.post("/api/teams/:id/send-invite-email", async (req: Request, res: Response) => {
  try {
    if (!isEmailConfigured()) {
      return res.status(400).json({
        error: "El servicio de correo no está configurado. Por favor configura BREVO_API_KEY o las credenciales SMTP en el servidor."
      });
    }


    const parseResult = SendTeamInviteEmailRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Datos de invitación no válidos",
        details: parseResult.error.flatten()
      });
    }

    const teams = await getDbTeams();
    const team = teams.find(t => t.id === req.params.id);
    if (!team) {
      return res.status(404).json({ error: "Equipo no encontrado" });
    }

    const { toEmail, recipientName, role, customNote } = parseResult.data;

    // Generar enlace de invitación dinámico
    const origin = req.get("origin") || req.get("referer") || "https://tlamatqui.app";
    const cleanOrigin = origin.replace(/\/$/, "");
    const inviteToken = team.inviteToken || `team-inv-sec_${Math.random().toString(36).substring(2, 10)}`;
    const inviteUrl = `${cleanOrigin}/?inviteTeam=${encodeURIComponent(inviteToken)}`;

    const emailResult = await sendTeamInviteEmail({
      toEmail,
      recipientName,
      teamName: team.name,
      inviterName: team.ownerName,
      role: role || team.inviteRole || "Visor",
      inviteUrl,
      customNote
    });

    res.json({
      success: true,
      message: `Invitación enviada exitosamente a ${toEmail}`,
      messageId: emailResult.messageId
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Error al enviar correo de invitación" });
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

    // Auto-registrar automáticamente en la API de Vercel si se proporcionó un dominio personalizado
    if (newConfig.customDomain && process.env.VERCEL_AUTH_TOKEN && process.env.VERCEL_PROJECT_ID) {
      provisionDomainOnVercel(newConfig.customDomain).catch((e) =>
        console.error("Auto-registro en Vercel en segundo plano:", e)
      );
    }

    res.json(saved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/config/verify-domain
 * @description Verifica la propiedad del dominio personalizado mediante la consulta de registros TXT DNS.
 */
app.post("/api/config/verify-domain", async (req: Request, res: Response) => {
  try {
    const { domain } = req.body;
    const config = await getDbConfig();
    const token = config.domainVerificationToken || "";
    const targetDomain = domain || config.customDomain || "";
    const result = await verifyCustomDomainDNS(targetDomain, token);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route POST /api/config/dns/status
 * @description Genera el informe completo de diagnóstico DNS en 4 checkpoints (TXT, CNAME, A, SSL).
 */
app.post("/api/config/dns/status", async (req: Request, res: Response) => {
  try {
    const { domain } = req.body;
    const config = await getDbConfig();
    const targetDomain = sanitizeDomain(domain || config.customDomain || "");
    const token = config.domainVerificationToken || "";

    // Intentar auto-registrar automáticamente en Vercel si la API está configurada
    if (targetDomain && process.env.VERCEL_AUTH_TOKEN && process.env.VERCEL_PROJECT_ID) {
      await provisionDomainOnVercel(targetDomain).catch(() => {});
    }

    const report = await getFullDNSDiagnostics(targetDomain, token);
    
    // Si la verificación TXT fue exitosa, actualizar automáticamente el estado en la base de datos
    if (report.verified && targetDomain) {
      config.customDomain = `https://${targetDomain}`;
      config.domainVerified = true;
      config.domainVerifiedAt = new Date().toISOString();
      await saveDbConfig(config);
    }
    
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/config/dns/provision
 * @description Da de alta el dominio personalizado en el proyecto de Vercel (o proveedor de hosting) vía API.
 */
app.post("/api/config/dns/provision", async (req: Request, res: Response) => {
  try {
    const { domain } = req.body;
    const config = await getDbConfig();
    const targetDomain = sanitizeDomain(domain || config.customDomain || "");
    const result = await provisionDomainOnVercel(targetDomain);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
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
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    console.log(`\x1b[36m[Backend REST API]\x1b[0m Escuchando en puerto ${PORT}`);
    console.log(`\x1b[35m[Frontend Configured]\x1b[0m CORS permitiendo peticiones desde: ${frontendUrl}`);
    console.log(`\x1b[32m[Health Check]\x1b[0m Endpoint de salud disponible en http://localhost:${PORT}/api/health`);
  });
}

export default app;

