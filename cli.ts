/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Herramienta de Línea de Comandos (CLI) para administración rápida de diagnósticos.
 * Permite listar, inspeccionar, eliminar y sembrar reportes directamente desde la terminal.
 */

import fs from "fs";
import path from "path";
import { updateChangelogFile } from "./scripts/generate-changelog.js";

const DATA_DIR = path.join(process.cwd(), "data");
const REPORTS_FILE = path.join(DATA_DIR, "reports.json");

/**
 * Lee y deserializa el arreglo de reportes desde el almacenamiento local JSON.
 * @returns {any[]} Arreglo de reportes de diagnóstico.
 */
function getReports(): any[] {
  if (!fs.existsSync(REPORTS_FILE)) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(REPORTS_FILE, "utf-8"));
  } catch (error) {
    console.error("\x1b[31mError al leer el archivo de reportes:\x1b[0m", error);
    return [];
  }
}

/**
 * Serializa y guarda la lista de reportes en el archivo JSON local.
 * @param {any[]} reports - Arreglo de reportes a persitir.
 */
function saveReports(reports: any[]): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2), "utf-8");
}

/**
 * Muestra el menú de ayuda y ejemplos de comandos disponibles en la CLI.
 */
function printHelp(): void {
  console.log(`
\x1b[1m\x1b[36mTlamatqui CLI\x1b[0m
====================================
Comandos disponibles:
  \x1b[32mlist\x1b[0m                 Muestra todos los reportes de diagnóstico.
  \x1b[32minfo <id>\x1b[0m            Muestra el detalle financiero de un reporte.
  \x1b[32mdelete <id>\x1b[0m          Elimina un reporte de diagnóstico.
  \x1b[32mseed\x1b[0m                 Restaura el reporte por defecto "Ginebra".
  \x1b[32mchangelog\x1b[0m            Genera/actualiza CHANGELOG.md mediante Conventional Commits.
  \x1b[32mhelp\x1b[0m                 Muestra esta ayuda.

Ejemplo de uso:
  \x1b[33mnpm run cli list\x1b[0m
  \x1b[33mnpm run cli changelog\x1b[0m
`);
}

// Procesar argumentos recibidos desde la consola
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case "list": {
    const reports = getReports();
    console.log(`\n\x1b[1m\x1b[36mReportes Registrados (${reports.length}):\x1b[0m`);
    console.log("----------------------------------------");
    reports.forEach((r: any) => {
      console.log(`- \x1b[1mID:\x1b[0m ${r.id} | \x1b[1mComercio:\x1b[0m ${r.name} | \x1b[1mGMV:\x1b[0m $${r.gmv?.toLocaleString()} MXN | \x1b[1mHerramientas:\x1b[0m ${r.tools?.length || 0}`);
    });
    console.log("");
    break;
  }

  case "info": {
    const id = args[1];
    if (!id) {
      console.log("\x1b[31mError: Por favor especifica el ID del reporte.\x1b[0m");
      break;
    }
    const reports = getReports();
    const report = reports.find((r: any) => r.id === id);
    if (!report) {
      console.log(`\x1b[31mError: Reporte con ID '${id}' no encontrado.\x1b[0m`);
      break;
    }
    console.log(`
\x1b[1m\x1b[36mDetalle del Reporte: ${report.name}\x1b[0m (ID: ${report.id})
----------------------------------------
Tagline: ${report.tagline}
Fugas detectadas: ${report.fugasCantidad} (Rango: $${report.fugasRangoMin?.toLocaleString()} - $${report.fugasRangoMax?.toLocaleString()} MXN)
Visitas mensuales: ${report.visitasMensuales?.toLocaleString()}
GMV aproximado: $${report.gmv?.toLocaleString()} MXN
Shopify Fee aproximado: $${report.shopifyFee?.toLocaleString()} MXN
MSI configurados: ${report.msi}
Plan Shopify: ${report.shopifyPlan?.toUpperCase()}
Plan Tiendanube Objetivo: ${report.tiendanubePlan?.toUpperCase()}
Email de contacto: ${report.contactEmail}
Teléfono Whatsapp: ${report.contactWhatsapp}

\x1b[1mHerramientas Detectadas (${report.tools?.length || 0}):\x1b[0m`);
    report.tools?.forEach((t: any) => {
      const costStr = t.costType === "exact" 
        ? `$${t.costExact} ${t.currency}` 
        : `$${t.costMin} - $${t.costMax} ${t.currency}`;
      const semStr = t.semaphore === "green" ? "🟢 Verde" : t.semaphore === "yellow" ? "🟡 Amarillo" : "🔴 Rojo";
      console.log(`  * [${semStr}] ${t.name} (${t.category}) - Gasto: ${costStr}`);
    });
    console.log("");
    break;
  }

  case "delete": {
    const id = args[1];
    if (!id) {
      console.log("\x1b[31mError: Por favor especifica el ID del reporte a eliminar.\x1b[0m");
      break;
    }
    const reports = getReports();
    const filtered = reports.filter((r: any) => r.id !== id);
    if (reports.length === filtered.length) {
      console.log(`\x1b[31mError: Reporte con ID '${id}' no encontrado.\x1b[0m`);
    } else {
      saveReports(filtered);
      console.log(`\x1b[32mÉxito: Reporte '${id}' eliminado correctamente.\x1b[0m`);
    }
    break;
  }

  case "seed": {
    const defaultReports = [
      {
        id: "ginebra-evolucion",
        name: "Ginebra",
        logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
        tagline: "Hemos detectado que estás perdiendo margen operativo en comisiones ocultas y aplicaciones redundantes.",
        fugasCantidad: 4,
        fugasRangoMin: 12000,
        fugasRangoMax: 45000,
        visitasMensuales: 45000,
        gmv: 450000,
        shopifyFee: 14900,
        msi: "3, 6, 9 meses sin intereses",
        shopifyPlan: "grow",
        shopifyPlanCustomFee: 1,
        shopifyPlanCustomPrice: 52,
        tiendanubePlan: "evolution",
        tools: [
          {
            id: "tool-1",
            name: "Klaviyo",
            category: "Marketing & Automatización",
            costType: "exact",
            costExact: 120,
            costMin: 0,
            costMax: 0,
            currency: "USD",
            semaphore: "yellow",
            url: "https://www.klaviyo.com",
            description: "Automatización de emails, flujos de carritos abandonados y segmentación."
          },
          {
            id: "tool-2",
            name: "Loox",
            category: "Reviews & Social Proof",
            costType: "range",
            costExact: 0,
            costMin: 29.99,
            costMax: 99.99,
            currency: "USD",
            semaphore: "green",
            url: "https://loox.io",
            description: "Prueba social interactiva con fotos de clientes comprando."
          },
          {
            id: "tool-3",
            name: "Infinite Options",
            category: "Conversión & Checkout",
            costType: "exact",
            costExact: 14.99,
            costMin: 0,
            costMax: 0,
            currency: "USD",
            semaphore: "green",
            url: "https://apps.shopify.com/infinite-options",
            description: "Personalización avanzada de variantes."
          },
          {
            id: "tool-4",
            name: "Bold Subscriptions",
            category: "Suscripciones",
            costType: "range",
            costExact: 0,
            costMin: 49.99,
            costMax: 199.99,
            currency: "USD",
            semaphore: "red",
            url: "https://boldcommerce.com",
            description: "Módulo de compras recurrentes."
          }
        ],
        comparisonRows: [
          { id: "row-1", variable: "Facturación", shopify: "Pesificada en USD + 16% IVA", tiendanube: "100% Pesificada en MXN Factura Local", pillText: "Ahorro Fiscal" },
          { id: "row-2", variable: "Soporte", shopify: "Ticket / Chat por bot (inglés)", tiendanube: "Soporte 1-1 en español vía WhatsApp local", pillText: "Soporte Humano" },
          { id: "row-3", variable: "Servidor", shopify: "Estabilidad global estándar", tiendanube: "Infraestructura en la nube optimizada para LatAm", pillText: "AWS Infra" },
          { id: "row-4", variable: "Punto de Venta", shopify: "POS Pro con cobro extra por sucursal", tiendanube: "Integraciones locales nativas sin costo extra", pillText: "Integración POS" },
          { id: "row-5", variable: "Comisión de transacción", shopify: "Cobro de 1.0% por transacción", tiendanube: "0% comisión por transacción en todos los planes", pillText: "0% Comisión" },
          { id: "row-6", variable: "MSI", shopify: "Configuración a través de apps y comisiones extra", tiendanube: "Configuración nativa directa en pasarela local", pillText: "MSI Nativos" }
        ],
        contactEmail: "cesar.ayar19@gmail.com",
        contactWhatsapp: "5512345678",
        adminLogos: [
          "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=100&q=80",
          "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=100&q=80",
          "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=100&q=80"
        ],
        createdAt: new Date().toISOString()
      }
    ];
    saveReports(defaultReports);
    console.log("\x1b[32mÉxito: Datos iniciales del reporte 'Ginebra' restaurados.\x1b[0m");
    break;
  }

  case "changelog": {
    updateChangelogFile();
    break;
  }

  case "help":
  default:
    printHelp();
    break;
}
