import { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  userRole?: string;
  userEmail?: string;
  userSub?: string;
}

/**
 * Middleware para validar y decodificar tokens Bearer de Auth0 o cabeceras de rol.
 */
export function verifyAuth0Token(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      // Extraer payload del token JWT de Auth0 (base64url)
      const parts = token.split(".");
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], "base64").toString("utf-8");
        const payload = JSON.parse(payloadJson);
        
        req.userSub = payload.sub;
        req.userEmail = payload.email || payload["https://evolucion.mx/email"];
        req.userRole = payload["https://evolucion.mx/role"] || "Administrador";
      }
    } catch (_) {
      // Si el token es opaco o erróneo en dev, continuar
    }
  }

  next();
}

/**
 * Middleware para validar el rol del usuario (RBAC).
 * En desarrollo/local sin Auth0 estricto, permite la operación de forma transparente.
 */
export function requireRole(allowedRoles: Array<"Superusuario" | "Administrador" | "Agente" | "Visor">) {

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Extraer rol de la cabecera X-User-Role o token si se pasa desde el frontend
    const userRole = (req.headers["x-user-role"] as string) || req.userRole || "Administrador";

    // El rol Superusuario tiene permisos universales implícitos en cualquier operación
    if (userRole === "Superusuario" || allowedRoles.includes(userRole as any)) {
      return next();
    }

    return res.status(403).json({
      error: "Acceso denegado",
      message: `Tu rol actual (${userRole}) no tiene permisos para realizar esta acción. Requieres rol: ${allowedRoles.join(" o ")}.`,
    });
  };
}

/**
 * Middleware opcional para verificar sesión de Auth0.
 */
export function verifySession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader && process.env.NODE_ENV === "production" && process.env.STRICT_AUTH === "true") {
    return res.status(401).json({ error: "No autorizado. Se requiere token de sesión Auth0." });
  }
  next();
}

/**
 * Middleware para validar el token secreto de comunicación entre Frontend y Backend.
 */
export function verifyApiSecretToken(req: Request, res: Response, next: NextFunction) {
  const expectedSecret = process.env.API_SECRET_TOKEN;

  // Si no está configurado un token secreto en .env, omitir la verificación (modo transparente)
  if (!expectedSecret || expectedSecret.trim() === "") {
    return next();
  }

  // Permitir la solicitud OPTIONS de pre-flight CORS sin exigir la cabecera en OPTIONS
  if (req.method === "OPTIONS") {
    return next();
  }

  // Rutas públicas exentas de verificación de token de API
  if (req.path === "/api/health" || req.path === "/api/auth/callback" || req.path === "/api/users/sync") {
    return next();
  }

  const clientSecret = req.headers["x-api-secret"] as string;

  if (!clientSecret || clientSecret !== expectedSecret) {
    return res.status(401).json({
      error: "Acceso no autorizado",
      message: "Token secreto de API ('x-api-secret') no válido o no proporcionado."
    });
  }

  next();
}

/**
 * Middleware para verificar el estado de bloqueo global de la API REST.
 * Si el Superusuario activa el bloqueo, impide el acceso a usuarios no-Superusuario.
 */
export async function verifyApiLock(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (
    req.path === "/api/health" ||
    req.path === "/api/auth/callback" ||
    req.path === "/api/users/sync" ||
    req.path === "/api/factory-reset" ||
    req.path.startsWith("/api/superadmin/")
  ) {
    return next();
  }

  const userRole = (req.headers["x-user-role"] as string) || req.userRole;
  if (userRole === "Superusuario") {
    return next();
  }

  try {
    const { getApiLockStatus } = await import("./dbBridge.js");
    const lockInfo = await getApiLockStatus();
    if (lockInfo && lockInfo.apiLocked) {
      return res.status(503).json({
        error: "API Bloqueada",
        message: lockInfo.lockReason || "La API REST se encuentra temporalmente en modo de mantenimiento por el Superusuario.",
        apiLocked: true
      });
    }
  } catch (err) {
    console.error("Error al verificar estado de bloqueo de API:", err);
  }

  next();
}


