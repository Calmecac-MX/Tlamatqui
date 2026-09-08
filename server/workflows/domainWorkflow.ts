import {
  sanitizeDomain,
  getFullDNSDiagnostics,
  provisionDomainOnVercel,
  FullDNSReport
} from "../dnsIntegrationService.js";
import { saveDbConfig, getDbConfig } from "../dbBridge.js";

export interface DomainOnboardingInput {
  domain: string;
  expectedToken?: string;
  autoProvisionVercel?: boolean;
}

export interface DomainOnboardingResult {
  success: boolean;
  cleanDomain: string;
  verified: boolean;
  dnsReport: FullDNSReport;
  config: any;
  message: string;
}

/**
 * Workflow de Aprovisionamiento DNS y Marca Blanca (DomainOnboardingWorkflow).
 * Orquesta la normalización del dominio, challenge TXT de verificación,
 * diagnóstico multinivel de registros (A, CNAME, TXT, SSL) y aprovisionamiento en Vercel.
 */
export async function runDomainOnboardingWorkflow(input: DomainOnboardingInput): Promise<DomainOnboardingResult> {
  const cleanDomain = sanitizeDomain(input.domain);
  if (!cleanDomain || cleanDomain.length < 3 || !cleanDomain.includes(".")) {
    throw new Error("El dominio proporcionado no es válido. Ingresa un FQDN como 'portal.midominio.com'.");
  }

  const currentConfig = await getDbConfig().catch(() => ({}));
  const expectedToken = input.expectedToken || currentConfig.domainVerificationToken || "tlamatqui-verify-sec_default_token";

  // 1. Diagnóstico integral de registros DNS
  const dnsReport = await getFullDNSDiagnostics(cleanDomain, expectedToken);

  // 2. Aprovisionamiento opcional en Vercel Project Domains API
  if (input.autoProvisionVercel) {
    try {
      const vercelResult = await provisionDomainOnVercel(cleanDomain);
      dnsReport.vercelStatus = vercelResult;
    } catch (vErr: any) {
      console.warn(`[DomainWorkflow] Aviso de aprovisionamiento en Vercel para ${cleanDomain}:`, vErr?.message || vErr);
    }
  }

  // 3. Sincronización en la base de datos PostgreSQL
  const isVerified = dnsReport.verified;
  const updatedConfig = await saveDbConfig({
    customDomain: cleanDomain,
    domainVerified: isVerified
  });

  return {
    success: true,
    cleanDomain,
    verified: isVerified,
    dnsReport,
    config: updatedConfig,
    message: isVerified
      ? `Dominio '${cleanDomain}' verificado y configurado exitosamente.`
      : `Diagnóstico completado para '${cleanDomain}'. Pendiente de propagación DNS.`
  };
}
