/**
 * Runner principal de pruebas automatizadas para la suite de reportes de Tlamatqui.
 */

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "";

import "./calculations.test.ts";
import "./formatters.test.ts";
import "./reportSchema.test.ts";
import "./engagementWorkflow.test.ts";
import "./auditWorkflow.test.ts";
import "./gravatar.test.ts";
