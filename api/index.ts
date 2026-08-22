/**
 * @file api/index.ts
 * @description Punto de entrada Serverless para Vercel Functions.
 * Exporta la aplicación Express configurada en server.ts para atender peticiones /api/*.
 */

import app from "../apps/backend/server.ts";

export default app;
