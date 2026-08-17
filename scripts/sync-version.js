/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Script de sincronización de versión automática.
 * Lee la versión actual de package.json y actualiza openapi.json y src/version.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// 1. Leer versión desde package.json
const packageJsonPath = path.join(rootDir, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
const newVersion = packageJson.version;

console.log(`\x1b[36m[Version Sync]\x1b[0m Sincronizando versión \x1b[32mv${newVersion}\x1b[0m...`);

// 2. Actualizar openapi.json
const openapiPath = path.join(rootDir, "openapi.json");
if (fs.existsSync(openapiPath)) {
  const openapiData = JSON.parse(fs.readFileSync(openapiPath, "utf-8"));
  if (openapiData.info) {
    openapiData.info.version = newVersion;
    fs.writeFileSync(openapiPath, JSON.stringify(openapiData, null, 2) + "\n", "utf-8");
    console.log(`  \x1b[32m✓\x1b[0m openapi.json actualizado a v${newVersion}`);
  }
}

// 3. Actualizar src/version.ts
const versionTsPath = path.join(rootDir, "src", "version.ts");
const versionTsContent = `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Módulo de versión global del proyecto.
 * Generado y sincronizado automáticamente mediante scripts/sync-version.js
 */

export const APP_VERSION = "${newVersion}";
export default APP_VERSION;
`;

fs.writeFileSync(versionTsPath, versionTsContent, "utf-8");
console.log(`  \x1b[32m✓\x1b[0m src/version.ts actualizado a v${newVersion}`);

console.log(`\x1b[32m[Version Sync Successful]\x1b[0m Todas las referencias sincronizadas correctamente.`);
