/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Servicio de Integración Real DNS y Aprovisionamiento de Dominios Personalizados.
 * Ofrece diagnósticos cruzados multinivel (TXT, CNAME, A, SSL) y comunicación
 * con la API de Vercel (o plataformas compatibles) para dar de alta dominios en producción.
 */

import dns from "node:dns/promises";

export interface DNSCheckpoint {
  key: "txt" | "cname" | "a" | "ssl";
  label: string;
  status: "success" | "warning" | "error" | "pending";
  value?: string;
  details: string;
}

export interface FullDNSReport {
  domain: string;
  cleanDomain: string;
  verified: boolean;
  provider: "vercel" | "custom_hosting" | "manual";
  checkpoints: DNSCheckpoint[];
  message: string;
  vercelStatus?: any;
}

/**
 * Limpia y normaliza una URL o nombre de dominio.
 */
export function sanitizeDomain(rawDomain: string): string {
  if (!rawDomain || typeof rawDomain !== "string") return "";
  return rawDomain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");
}

/**
 * Ejecuta la verificación nativa DNS en el sistema mediante node:dns/promises.
 */
export async function checkNativeDNSDiagnostics(
  rawDomain: string,
  expectedToken: string
): Promise<{
  txtVerified: boolean;
  txtValue: string;
  cnameVerified: boolean;
  cnameValue: string;
  aVerified: boolean;
  aValue: string;
}> {
  const cleanDomain = sanitizeDomain(rawDomain);
  if (!cleanDomain) {
    return {
      txtVerified: false,
      txtValue: "Sin dominio",
      cnameVerified: false,
      cnameValue: "Sin dominio",
      aVerified: false,
      aValue: "Sin dominio"
    };
  }

  // 1. Registro TXT
  let txtVerified = false;
  let txtValue = "No encontrado";
  const hostsToQuery = [`_tlamatqui-challenge.${cleanDomain}`, cleanDomain];

  for (const host of hostsToQuery) {
    try {
      const txtRecords = await dns.resolveTxt(host);
      const flatRecords = txtRecords.map((r) => r.join(""));
      for (const rec of flatRecords) {
        if (expectedToken && (rec.includes(expectedToken) || rec.includes(expectedToken.replace("tlamatqui-verify-sec_", "")))) {
          txtVerified = true;
          txtValue = `Coincide en '${host}' (${rec})`;
          break;
        }
      }
      if (txtVerified) break;
      if (flatRecords.length > 0 && txtValue === "No encontrado") {
        txtValue = `Encontrado '${flatRecords[0]}' (Token no coincide)`;
      }
    } catch (e) {
      // Ignorar error de resolución
    }
  }

  // 2. Registro CNAME
  let cnameVerified = false;
  let cnameValue = "No encontrado";
  try {
    const cnames = await dns.resolveCname(cleanDomain);
    if (cnames && cnames.length > 0) {
      cnameValue = cnames.join(", ");
      if (cnames.some((c) => c.includes("vercel.app") || c.includes("tlamatqui") || c.includes("vercel"))) {
        cnameVerified = true;
      }
    }
  } catch (e) {
    // Si es un apex domain o no tiene CNAME
  }

  // 3. Registro A
  let aVerified = false;
  let aValue = "No encontrado";
  try {
    const aRecords = await dns.resolve4(cleanDomain);
    if (aRecords && aRecords.length > 0) {
      aValue = aRecords.join(", ");
      // IPs típicas de Vercel (76.76.21.21) u otros CDN principales
      if (aRecords.some((ip) => ip === "76.76.21.21" || ip.startsWith("76.76."))) {
        aVerified = true;
      }
    }
  } catch (e) {
    // Error al consultar registros A
  }

  return {
    txtVerified,
    txtValue,
    cnameVerified,
    cnameValue,
    aVerified,
    aValue
  };
}

/**
 * Consulta la API de Vercel si las variables VERCEL_AUTH_TOKEN y VERCEL_PROJECT_ID están presentes.
 */
export async function getVercelDomainInfo(domain: string): Promise<any | null> {
  const token = process.env.VERCEL_AUTH_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!token || !projectId) {
    return null;
  }

  const clean = sanitizeDomain(domain);
  if (!clean) return null;

  try {
    const queryTeam = teamId ? `?teamId=${teamId}` : "";
    const res = await fetch(
      `https://api.vercel.com/v9/projects/${projectId}/domains/${clean}/config${queryTeam}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error("Error al consultar la API de Vercel para el dominio:", e);
  }
  return null;
}

/**
 * Registra o da de alta un dominio personalizado en el proyecto de Vercel vía API REST.
 */
export async function provisionDomainOnVercel(
  rawDomain: string
): Promise<{ success: boolean; message: string; data?: any }> {
  const token = process.env.VERCEL_AUTH_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!token || !projectId) {
    return {
      success: false,
      message: "Las variables de entorno VERCEL_AUTH_TOKEN y VERCEL_PROJECT_ID no están configuradas en el servidor. El dominio debe asociarse manualmente en el panel de Vercel."
    };
  }

  const clean = sanitizeDomain(rawDomain);
  if (!clean) {
    return { success: false, message: "Nombre de dominio no válido." };
  }

  try {
    const queryTeam = teamId ? `?teamId=${teamId}` : "";
    const res = await fetch(
      `https://api.vercel.com/v10/projects/${projectId}/domains${queryTeam}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: clean })
      }
    );

    const data = await res.json();

    if (res.ok) {
      // Intentar forzar la verificación tras agregar
      await fetch(
        `https://api.vercel.com/v9/projects/${projectId}/domains/${clean}/verify${queryTeam}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        }
      ).catch(() => {});

      return {
        success: true,
        message: `¡Dominio '${clean}' registrado exitosamente en el proyecto Vercel!`,
        data
      };
    } else {
      return {
        success: false,
        message: data.error?.message || `Error al dar de alta el dominio en Vercel (${res.status}).`,
        data
      };
    }
  } catch (e: any) {
    return {
      success: false,
      message: `Error de red al conectar con Vercel API: ${e.message}`
    };
  }
}

/**
 * Genera el informe completo de diagnóstico en 4 checkpoints (TXT, CNAME, A, SSL).
 */
export async function getFullDNSDiagnostics(
  rawDomain: string,
  expectedToken: string
): Promise<FullDNSReport> {
  const cleanDomain = sanitizeDomain(rawDomain);
  const native = await checkNativeDNSDiagnostics(cleanDomain, expectedToken);
  const vercelInfo = await getVercelDomainInfo(cleanDomain);

  const checkpoints: DNSCheckpoint[] = [];

  // Checkpoint 1: TXT
  checkpoints.push({
    key: "txt",
    label: "Propiedad TXT (_tlamatqui-challenge)",
    status: native.txtVerified ? "success" : "error",
    value: native.txtValue,
    details: native.txtVerified
      ? "Token de verificación validado correctamente en la red DNS."
      : "Se requiere un registro TXT con el token asignado para autenticar la propiedad."
  });

  // Checkpoint 2: CNAME
  checkpoints.push({
    key: "cname",
    label: "Alias CNAME / Enrutamiento",
    status: native.cnameVerified ? "success" : native.cnameValue !== "No encontrado" ? "warning" : "error",
    value: native.cnameValue,
    details: native.cnameVerified
      ? "Registro CNAME configurado correctamente apuntando al hosting."
      : "Apunta el subdominio CNAME a 'tlamatqui.vercel.app' para direccionar el tráfico."
  });

  // Checkpoint 3: Registro A
  checkpoints.push({
    key: "a",
    label: "Dirección IP de Red (Registro A)",
    status: native.aVerified ? "success" : native.aValue !== "No encontrado" ? "warning" : "pending",
    value: native.aValue,
    details: native.aVerified
      ? "Dirección IP conectada a la infraestructura de entrega."
      : "Si usas un dominio raíz (apex), apunta el registro A a '76.76.21.21'."
  });

  // Checkpoint 4: SSL / Vercel Status
  const isVercelConfigured = Boolean(process.env.VERCEL_AUTH_TOKEN && process.env.VERCEL_PROJECT_ID);
  let sslStatus: "success" | "warning" | "error" | "pending" = "pending";
  let sslDetails = "Verificación SSL estándar HTTP/HTTPS.";

  if (vercelInfo) {
    if (vercelInfo.misconfigured === false) {
      sslStatus = "success";
      sslDetails = "Certificado SSL emitido y activo en Vercel.";
    } else {
      sslStatus = "warning";
      sslDetails = "Vercel detectó DNS pendiente antes de activar el certificado SSL.";
    }
  } else if (native.txtVerified && (native.cnameVerified || native.aVerified)) {
    sslStatus = "success";
    sslDetails = "Registros DNS activos y listos para emisión de SSL.";
  } else if (isVercelConfigured) {
    sslStatus = "warning";
    sslDetails = "Dominio no registrado en Vercel API. Haz clic en 'Auto-Registrar en Hosting'.";
  }

  checkpoints.push({
    key: "ssl",
    label: "Certificado SSL / HTTPS",
    status: sslStatus,
    value: vercelInfo ? (vercelInfo.misconfigured ? "Pendiente DNS" : "Activo Let's Encrypt") : (sslStatus === "success" ? "Listo" : "Esperando DNS"),
    details: sslDetails
  });

  const verified = native.txtVerified;

  return {
    domain: rawDomain,
    cleanDomain,
    verified,
    provider: isVercelConfigured ? "vercel" : "custom_hosting",
    checkpoints,
    message: verified
      ? "¡Dominio e integraciones DNS verificadas con éxito!"
      : "Registros DNS incompletos o en proceso de propagación.",
    vercelStatus: vercelInfo
  };
}
