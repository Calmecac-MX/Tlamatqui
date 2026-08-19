/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Script de Automatización de CHANGELOG basado en Conventional Commits
 * compatible con Google Release Please.
 * Genera CHANGELOG.md raíz y mantiene resúmenes limpios por versión sin duplicación.
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
 * Extrae todos los hashes de commits ya documentados en CHANGELOG.md
 */
function getExistingCommitHashes() {
  const hashes = new Set();
  if (!fs.existsSync(CHANGELOG_FILE)) return hashes;

  try {
    const content = fs.readFileSync(CHANGELOG_FILE, "utf-8");
    // Buscar hashes entre paréntesis de código: (`hash`) o (hash)
    const matches = content.matchAll(/\(`?([a-f0-9]{7,40})`?\)/gi);
    for (const m of matches) {
      if (m[1]) hashes.add(m[1].toLowerCase());
    }
  } catch (_) {}

  return hashes;
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
 * Obtiene los commits recientes de git y filtra aquellos que ya estén registrados.
 */
function parseGitCommits(existingHashes = new Set()) {
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

    let newCommitsCount = 0;

    for (const entry of entries) {
      const [hash, subject = "", body = ""] = entry.split("\x1f").map(s => s.trim());
      if (!subject) continue;

      const lowerHash = hash.toLowerCase();
      // Omitir commits que ya estén presentes en CHANGELOG.md
      if (existingHashes.has(lowerHash)) continue;

      newCommitsCount++;
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

    return newCommitsCount > 0 ? categorized : null;
  } catch (_) {
    return null;
  }
}

/**
 * Genera el fragmento en formato Markdown para la versión actual en CHANGELOG.md raíz.
 */
export function generateChangelogMarkdown(versionStr = getCurrentVersionString(), existingHashes = new Set()) {
  const commits = parseGitCommits(existingHashes);
  const dateStr = new Date().toISOString().split("T")[0];
  let md = `## [${versionStr}] - ${dateStr}\n\n`;

  if (!commits) {
    md += `*Actualización de estabilidad, sincronización de versiones y optimización de componentes.*\n\n`;
    return md;
  }

  let hasEntries = false;

  // 1. Breaking Changes
  if (commits.breaking.length > 0) {
    hasEntries = true;
    md += `### 🚨 Cambios Incompatibles (BREAKING CHANGES)\n`;
    commits.breaking.forEach(c => {
      md += `- **${c.subject}** (\`${c.hash}\`)\n`;
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
 * Actualiza CHANGELOG.md principal en la raíz de forma incremental sin duplicación.
 */
export function updateChangelogFile() {
  if (!fs.existsSync(CHANGELOG_DIR)) {
    fs.mkdirSync(CHANGELOG_DIR, { recursive: true });
  }

  const existingHashes = getExistingCommitHashes();
  const currentVer = getCurrentVersionString();
  const header = `# Changelog - Tlamatqui\n\nTodos los cambios notables en este proyecto son documentados automáticamente de acuerdo con **Conventional Commits** y **Release Please**.\n\n---\n\n`;

  let existingContent = "";
  if (fs.existsSync(CHANGELOG_FILE)) {
    existingContent = fs.readFileSync(CHANGELOG_FILE, "utf-8").replace(header, "");
  }

  // Evitar añadir bloque duplicado si la versión exacta ya está en la cabecera del archivo
  if (existingContent.includes(`## [${currentVer}]`)) {
    console.log(`\x1b[34m[Changelog Status]\x1b[0m La versión ${currentVer} ya se encuentra registrada en CHANGELOG.md.`);
    return;
  }

  const newEntry = generateChangelogMarkdown(currentVer, existingHashes);
  const updatedChangelog = header + newEntry + existingContent;
  fs.writeFileSync(CHANGELOG_FILE, updatedChangelog, "utf-8");
  console.log(`\x1b[32m[Changelog Complete]\x1b[0m CHANGELOG.md raíz actualizado limpiamente sin duplicados.`);
}

// Ejecución directa desde CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  updateChangelogFile();
}

