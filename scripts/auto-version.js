/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Script de Autoversionado Independiente para Frontend y Backend.
 * Detecta automáticamente cambios en los ámbitos de frontend (src/, index.html, assets/)
 * y backend (server.ts, server/, prisma/, cli.ts) para incrementar versiones de forma desacoplada.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { updateChangelogFile } from "./generate-changelog.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const VERSION_FILE = path.join(rootDir, "version.json");
const PACKAGE_JSON_FILE = path.join(rootDir, "package.json");
const OPENAPI_FILE = path.join(rootDir, "openapi.json");
const FRONTEND_VERSION_FILE = path.join(rootDir, "apps", "frontend", "src", "version.ts");
const BACKEND_VERSION_FILE = path.join(rootDir, "apps", "backend", "server", "version.ts");
const FRONTEND_PACKAGE_JSON = path.join(rootDir, "apps", "frontend", "package.json");
const BACKEND_PACKAGE_JSON = path.join(rootDir, "apps", "backend", "package.json");

// Definición de ámbitos de archivos para cada capa
const BACKEND_PATHS = [
  "apps/backend/server.ts",
  "apps/backend/server",
  "apps/backend/prisma",
  "apps/backend/cli.ts"
];

const FRONTEND_PATHS = [
  "apps/frontend/src",
  "apps/frontend/index.html"
];

/**
 * Calcula un hash MD5 acumulado de los archivos contenidos en las rutas especificadas.
 */
function computeHashForPaths(paths) {
  const hash = crypto.createHash("md5");
  
  function scan(targetPath) {
    const absPath = path.join(rootDir, targetPath);
    if (!fs.existsSync(absPath)) return;
    
    const stat = fs.statSync(absPath);
    if (stat.isDirectory()) {
      const files = fs.readdirSync(absPath).sort();
      for (const file of files) {
        // Ignorar version.ts para evitar bucles infintos
        if (file === "version.ts" || file === "version.js" || file === ".DS_Store") continue;
        scan(path.join(targetPath, file));
      }
    } else if (stat.isFile()) {
      const content = fs.readFileSync(absPath);
      hash.update(targetPath);
      hash.update(content);
    }
  }

  for (const p of paths) {
    scan(p);
  }

  return hash.digest("hex");
}

/**
 * Incrementa una versión SemVer según el tipo (patch, minor, major).
 */
function bumpSemVer(versionStr, type = "patch") {
  const parts = versionStr.split(".").map(Number);
  let [major = 1, minor = 0, patch = 0] = parts;

  if (type === "major") {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (type === "minor") {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }

  return `${major}.${minor}.${patch}`;
}

// Cargar o inicializar estado de versión
let versionData = {
  frontend: "2.5.0",
  backend: "2.5.0",
  lastHashes: { frontend: "", backend: "" }
};

if (fs.existsSync(VERSION_FILE)) {
  try {
    versionData = JSON.parse(fs.readFileSync(VERSION_FILE, "utf-8"));
  } catch (_) {}
}

const args = process.argv.slice(2);
const forceBumpFrontend = args.includes("--bump-frontend");
const forceBumpBackend = args.includes("--bump-backend");
const forceBumpBoth = args.includes("--bump-both");

let bumpType = "patch";
const typeArg = args.find(a => a.startsWith("--type="));
if (typeArg) {
  bumpType = typeArg.split("=")[1] || "patch";
}

// Calcular hashes actuales de archivos
const currentBackendHash = computeHashForPaths(BACKEND_PATHS);
const currentFrontendHash = computeHashForPaths(FRONTEND_PATHS);

let backendChanged = false;
let frontendChanged = false;

// 1. Evaluar cambios de Backend
if (forceBumpBackend || forceBumpBoth) {
  backendChanged = true;
} else if (versionData.lastHashes.backend && versionData.lastHashes.backend !== currentBackendHash) {
  backendChanged = true;
}

// 2. Evaluar cambios de Frontend
if (forceBumpFrontend || forceBumpBoth) {
  frontendChanged = true;
} else if (versionData.lastHashes.frontend && versionData.lastHashes.frontend !== currentFrontendHash) {
  frontendChanged = true;
}

console.log(`\x1b[36m[Auto-Versioner]\x1b[0m Analizando cambios de componentes...`);

if (backendChanged) {
  const oldVer = versionData.backend;
  versionData.backend = bumpSemVer(oldVer, bumpType);
  console.log(`  \x1b[33m[Backend Shift]\x1b[0m Cambios detectados en Backend: \x1b[31m${oldVer}\x1b[0m ➔ \x1b[32m${versionData.backend}\x1b[0m`);
} else {
  console.log(`  \x1b[34m[Backend Status]\x1b[0m Sin cambios detectados. Versión actual: v${versionData.backend}`);
}

if (frontendChanged) {
  const oldVer = versionData.frontend;
  versionData.frontend = bumpSemVer(oldVer, bumpType);
  console.log(`  \x1b[33m[Frontend Shift]\x1b[0m Cambios detectados en Frontend: \x1b[31m${oldVer}\x1b[0m ➔ \x1b[32m${versionData.frontend}\x1b[0m`);
} else {
  console.log(`  \x1b[34m[Frontend Status]\x1b[0m Sin cambios detectados. Versión actual: v${versionData.frontend}`);
}

// Actualizar hashes de seguimiento
versionData.lastHashes.backend = currentBackendHash;
versionData.lastHashes.frontend = currentFrontendHash;

// Guardar version.json
fs.writeFileSync(VERSION_FILE, JSON.stringify(versionData, null, 2) + "\n", "utf-8");

// 3. Generar src/version.ts (para el Frontend)
const frontendTsContent = `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Versiones globales independientes de Frontend y Backend.
 * Generado automáticamente por scripts/auto-version.js
 */

export const FRONTEND_VERSION = "${versionData.frontend}";
export const BACKEND_VERSION = "${versionData.backend}";
export const APP_VERSION = "${versionData.frontend}";

export default FRONTEND_VERSION;
`;
fs.mkdirSync(path.dirname(FRONTEND_VERSION_FILE), { recursive: true });
fs.writeFileSync(FRONTEND_VERSION_FILE, frontendTsContent, "utf-8");

// 4. Generar server/version.ts (para el Backend)
const backendTsContent = `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Versión independiente de la API REST Backend.
 * Generado automáticamente por scripts/auto-version.js
 */

export const BACKEND_VERSION = "${versionData.backend}";
export const FRONTEND_VERSION = "${versionData.frontend}";

export default BACKEND_VERSION;
`;
fs.mkdirSync(path.dirname(BACKEND_VERSION_FILE), { recursive: true });
fs.writeFileSync(BACKEND_VERSION_FILE, backendTsContent, "utf-8");

// 5. Sincronizar openapi.json
if (fs.existsSync(OPENAPI_FILE)) {
  const openapiData = JSON.parse(fs.readFileSync(OPENAPI_FILE, "utf-8"));
  if (openapiData.info) {
    openapiData.info.version = versionData.backend;
    fs.writeFileSync(OPENAPI_FILE, JSON.stringify(openapiData, null, 2) + "\n", "utf-8");
  }
}

// 6. Sincronizar package.json
if (fs.existsSync(PACKAGE_JSON_FILE)) {
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_FILE, "utf-8"));
  packageJson.version = versionData.backend;
  fs.writeFileSync(PACKAGE_JSON_FILE, JSON.stringify(packageJson, null, 2) + "\n", "utf-8");
}
if (fs.existsSync(FRONTEND_PACKAGE_JSON)) {
  const feJson = JSON.parse(fs.readFileSync(FRONTEND_PACKAGE_JSON, "utf-8"));
  feJson.version = versionData.frontend;
  fs.writeFileSync(FRONTEND_PACKAGE_JSON, JSON.stringify(feJson, null, 2) + "\n", "utf-8");
}
if (fs.existsSync(BACKEND_PACKAGE_JSON)) {
  const beJson = JSON.parse(fs.readFileSync(BACKEND_PACKAGE_JSON, "utf-8"));
  beJson.version = versionData.backend;
  fs.writeFileSync(BACKEND_PACKAGE_JSON, JSON.stringify(beJson, null, 2) + "\n", "utf-8");
}

// 7. Generar y actualizar CHANGELOG.md y carpeta changelog/
updateChangelogFile();

console.log(`\x1b[32m[Auto-Versioner Complete]\x1b[0m Versiones sincronizadas: Frontend v${versionData.frontend} | Backend v${versionData.backend}`);

