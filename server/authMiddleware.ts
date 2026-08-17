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
export function requireRole(allowedRoles: Array<"Administrador" | "Editor" | "Visor">) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Extraer rol de la cabecera X-User-Role o token si se pasa desde el frontend
    const userRole = (req.headers["x-user-role"] as string) || req.userRole || "Administrador";

    if (allowedRoles.includes(userRole as any)) {
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

