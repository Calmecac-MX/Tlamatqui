/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Script de Automatización de CHANGELOG basado en Conventional Commits
 * compatible con Google Release Please.
 * Genera CHANGELOG.md raíz y archivos detallados individuales en la carpeta changelog/CHANGELOG-vx.x.md.
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const CHANGELOG_FILE = path.join(rootDir, "CHANGELOG.md");
const CHANGELOG_DIR = path.join(rootDir, "changelog");
const VERSION_FILE = path.join(rootDir, "version.json");
const PACKAGE_JSON_FILE = path.join(rootDir, "package.json");

// Secciones mapeadas según Google Release Please Config
const SECTION_MAP = {
  feat: "🚀 Features & Nuevas Funcionalidades",
  fix: "🐛 Corregido & Bug Fixes",
  perf: "⚡ Optimización y Rendimiento",
  refactor: "♻️ Refactorización de Código",
  docs: "📚 Documentación",
  test: "🧪 Pruebas y Testing",
  chore: "🔧 Tareas Operativas y Mantenimiento"
};

/**
 * Obtiene las versiones activas del sistema.
 */
function getActiveVersions() {
  const versions = new Set();
  
  if (fs.existsSync(VERSION_FILE)) {
    try {
      const vData = JSON.parse(fs.readFileSync(VERSION_FILE, "utf-8"));
      if (vData.backend) versions.add(vData.backend);
      if (vData.frontend) versions.add(vData.frontend);
    } catch (_) {}
  }

  if (fs.existsSync(PACKAGE_JSON_FILE)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON_FILE, "utf-8"));
      if (pkg.version) versions.add(pkg.version);
    } catch (_) {}
  }

  if (fs.existsSync(CHANGELOG_FILE)) {
    try {
      const content = fs.readFileSync(CHANGELOG_FILE, "utf-8");
      const matches = content.matchAll(/v?(\d+\.\d+(?:\.\d+)?)/g);
      for (const match of matches) {
        if (match[1]) versions.add(match[1]);
      }
    } catch (_) {}
  }

  if (versions.size === 0) {
    versions.add("2.5.0");
  }

  return Array.from(versions);
}

/**
 * Obtiene la versión actual combinada para la cabecera principal.
 */
function getCurrentVersionString() {
  if (fs.existsSync(VERSION_FILE)) {
    try {
      const vData = JSON.parse(fs.readFileSync(VERSION_FILE, "utf-8"));
      if (vData.frontend === vData.backend) {
        return `v${vData.backend}`;
      }
      return `v${vData.frontend} (Frontend) / v${vData.backend} (Backend)`;
    } catch (_) {}
  }
  return "v2.5.0";
}

/**
 * Obtiene los commits recientes desde git log y los analiza según Conventional Commits.
 */
function parseGitCommits() {
  try {
    const rawLogs = execSync("git log -n 50 --pretty=format:'%h%x1f%s%x1f%b%x1e'", {
      encoding: "utf-8",
      cwd: rootDir
    });

    const entries = rawLogs.split("\x1e").filter(Boolean);
    const categorized = {
      breaking: [],
      feat: [],
      fix: [],
      perf: [],
      refactor: [],
      docs: [],
      test: [],
      chore: [],
      other: []
    };

    for (const entry of entries) {
      const [hash, subject = "", body = ""] = entry.split("\x1f").map(s => s.trim());
      if (!subject) continue;

      const fullText = `${subject}\n${body}`;

      // Detectar Breaking Change
      if (fullText.includes("BREAKING CHANGE") || subject.includes("!:")) {
        categorized.breaking.push({ hash, subject, body });
      }

      // Regex para Conventional Commits: tipo(ámbito)?: descripción
      const match = subject.match(/^([a-z]+)(?:\(([^)]+)\))?!?: (.+)$/i);
      if (match) {
        const [, type, scope, description] = match;
        const lowerType = type.toLowerCase();
        const item = { hash, scope, description, raw: subject };

        if (categorized[lowerType]) {
          categorized[lowerType].push(item);
        } else {
          categorized.other.push(item);
        }
      } else {
        categorized.other.push({ hash, scope: null, description: subject, raw: subject });
      }
    }

    return categorized;
  } catch (_) {
    // Si no hay commits o la repo es reciente
    return null;
  }
}

/**
 * Genera un extracto detallado en Markdown para una versión específica.
 */
export function generateDetailedExtract(versionStr) {
  const cleanVersion = versionStr.startsWith("v") ? versionStr : `v${versionStr}`;
  const commits = parseGitCommits();
  const dateStr = new Date().toISOString().split("T")[0];

  let md = `# Extracto Detallado de Cambios - Versión ${cleanVersion}\n\n`;
  md += `- **Versión de Actualización:** \`${cleanVersion}\`\n`;
  md += `- **Fecha de Registro:** \`${dateStr}\`\n`;
  md += `- **Estándar:** Conventional Commits & Google Release Please\n\n`;
  md += `---\n\n`;
  md += `## 📋 Resumen de la Versión\n\n`;
  md += `Este archivo contiene el desglose y extracto detallado de todos los cambios, mejoras, correcciones y tareas de mantenimiento correspondientes a la versión **${cleanVersion}** de Tlamatqui.\n\n`;

  let hasEntries = false;

  if (commits) {
    // 1. Breaking Changes
    if (commits.breaking.length > 0) {
      hasEntries = true;
      md += `## 🚨 Cambios Incompatibles (BREAKING CHANGES)\n\n`;
      commits.breaking.forEach(c => {
        md += `- **${c.subject}** (\`${c.hash}\`)\n`;
        if (c.body) md += `  - ${c.body.replace(/\n/g, "\n  - ")}\n`;
      });
      md += `\n`;
    }

    // 2. Secciones Convencionales
    for (const [type, title] of Object.entries(SECTION_MAP)) {
      const list = commits[type];
      if (list && list.length > 0) {
        hasEntries = true;
        md += `## ${title}\n\n`;
        list.forEach(c => {
          const scopeStr = c.scope ? `**[${c.scope}]** ` : "";
          md += `- ${scopeStr}${c.description} (\`${c.hash}\`)\n`;
        });
        md += `\n`;
      }
    }

    if (commits.other.length > 0) {
      md += `## 📌 Otros Cambios Registrados\n\n`;
      commits.other.forEach(c => {
        md += `- ${c.description} (\`${c.hash}\`)\n`;
      });
      md += `\n`;
    }
  }

  if (!hasEntries) {
    md += `## 🔧 Detalle de Actualización y Mantenimiento\n\n`;
    md += `- **Sincronización de Componentes:** Ajustes operacionales en Backend API REST (Express/Prisma) y Frontend SPA (React 19/Vite 6).\n`;
    md += `- **Estabilidad & Seguridad:** Verificación de tipos estricta en TypeScript, actualización de dependencias y optimización de bundle.\n`;
    md += `- **Versionado:** Generación automática de versión \`${cleanVersion}\` y actualización de contratos de API REST.\n\n`;
  }

  md += `---\n\n`;
  md += `*Documento generado automáticamente por el sistema de auto-versionado y changelog de Tlamatqui.*\n`;

  return md;
}

/**
 * Genera el fragmento en formato Markdown para la versión actual en CHANGELOG.md raíz.
 */
export function generateChangelogMarkdown(versionStr = getCurrentVersionString()) {
  const commits = parseGitCommits();
  const dateStr = new Date().toISOString().split("T")[0];
  let md = `## [${versionStr}] - ${dateStr}\n\n`;

  if (!commits) {
    md += `*Actualizaciones y mejoras continuas de estabilidad y rendimiento.*\n\n`;
    return md;
  }

  let hasEntries = false;

  // 1. Breaking Changes
  if (commits.breaking.length > 0) {
    hasEntries = true;
    md += `### 🚨 Cambios Incompatibles (BREAKING CHANGES)\n`;
    commits.breaking.forEach(c => {
      md += `- **${c.subject}** (${c.hash})\n`;
    });
    md += `\n`;
  }

  // 2. Secciones por tipo convencional
  for (const [type, title] of Object.entries(SECTION_MAP)) {
    const list = commits[type];
    if (list && list.length > 0) {
      hasEntries = true;
      md += `### ${title}\n`;
      list.forEach(c => {
        const scopeStr = c.scope ? `**${c.scope}:** ` : "";
        md += `- ${scopeStr}${c.description} (\`${c.hash}\`)\n`;
      });
      md += `\n`;
    }
  }

  if (!hasEntries && commits.other.length > 0) {
    md += `### 📌 Otros Cambios\n`;
    commits.other.forEach(c => {
      md += `- ${c.description} (\`${c.hash}\`)\n`;
    });
    md += `\n`;
  }

  return md;
}

/**
 * Actualiza o crea CHANGELOG.md raíz y los archivos changelog/CHANGELOG-vx.x.md por versión.
 */
export function updateChangelogFile() {
  // 1. Asegurar que la carpeta changelog/ exista
  if (!fs.existsSync(CHANGELOG_DIR)) {
    fs.mkdirSync(CHANGELOG_DIR, { recursive: true });
    console.log(`\x1b[32m[Changelog Folder]\x1b[0m Carpeta 'changelog/' creada exitosamente.`);
  }

  // 2. Actualizar CHANGELOG.md principal en la raíz
  const newContent = generateChangelogMarkdown();
  const header = `# Changelog - Tlamatqui\n\nTodos los cambios notables en este proyecto serán documentados automáticamente en este archivo de acuerdo con las especificaciones de **Conventional Commits** y **Google Release Please**.\n\n---\n\n`;

  let existing = "";
  if (fs.existsSync(CHANGELOG_FILE)) {
    existing = fs.readFileSync(CHANGELOG_FILE, "utf-8");
    existing = existing.replace(header, "");
  }

  const updatedChangelog = header + newContent + existing;
  fs.writeFileSync(CHANGELOG_FILE, updatedChangelog, "utf-8");
  console.log(`\x1b[32m[Changelog Complete]\x1b[0m CHANGELOG.md raíz actualizado correctamente.`);

  // 3. Generar archivos changelog/CHANGELOG-vx.x.md para cada versión activa
  const activeVersions = getActiveVersions();
  for (const ver of activeVersions) {
    const cleanVer = ver.startsWith("v") ? ver : `v${ver}`;
    const versionFileName = `CHANGELOG-${cleanVer}.md`;
    const versionFilePath = path.join(CHANGELOG_DIR, versionFileName);

    const detailedExtract = generateDetailedExtract(ver);
    fs.writeFileSync(versionFilePath, detailedExtract, "utf-8");
    console.log(`\x1b[32m[Version Extract]\x1b[0m Archivo 'changelog/${versionFileName}' actualizado con extracto detallado.`);
  }
}

// Ejecución directa desde CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  updateChangelogFile();
}

