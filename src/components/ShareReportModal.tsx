/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Componente Modal Interactivo para Compartir Reportes en Dominio Personalizado.
 * Permite seleccionar el dominio base, generar enlaces compartibles con parámetros de cliente,
 * comprobar la propiedad del dominio mediante registros TXT DNS y enviar enlaces directo a clientes.
 */

import React, { useState } from "react";
import { 
  X, 
  Globe, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  Send, 
  Share2, 
  CheckCircle2, 
  Info,
  Sparkles,
  Link as LinkIcon
} from "lucide-react";
import { Config, Report } from "../types";

interface ShareReportModalProps {
  /** Reporte que se desea compartir */
  report: Report | null;
  /** Configuración global actual del sistema */
  config: Config | null;
  /** Callback para cerrar el modal */
  onClose: () => void;
  /** Callback opcional al actualizar la configuración (ej. dominio verificado) */
  onConfigUpdated?: (updatedConfig: Config) => void;
}

export const ShareReportModal: React.FC<ShareReportModalProps> = ({
  report,
  config,
  onClose,
  onConfigUpdated
}) => {
  if (!report) return null;

  const defaultOrigin = typeof window !== "undefined" ? window.location.origin : "https://tlamatqui.app";
  const savedCustomDomain = config?.customDomain || "";
  const verificationToken = config?.domainVerificationToken || "tlamatqui-verify-sec_default";
  const isVerified = Boolean(config?.domainVerified);

  // Estados del modal
  const [selectedOption, setSelectedOption] = useState<"default" | "custom" | "adhoc">(
    savedCustomDomain && isVerified ? "custom" : "default"
  );
  const [adhocDomain, setAdhocDomain] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"link" | "dns">("link");
  const [verifyingDns, setVerifyingDns] = useState<boolean>(false);
  const [verificationFeedback, setVerificationFeedback] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });
  const [copiedToken, setCopiedToken] = useState<boolean>(false);

  // Normalizar la URL base según la opción seleccionada
  const getBaseDomain = (): string => {
    if (selectedOption === "default") {
      return defaultOrigin;
    }
    if (selectedOption === "custom") {
      if (!savedCustomDomain) return defaultOrigin;
      return savedCustomDomain.startsWith("http") ? savedCustomDomain : `https://${savedCustomDomain}`;
    }
    if (selectedOption === "adhoc") {
      if (!adhocDomain.trim()) return defaultOrigin;
      const clean = adhocDomain.trim().replace(/\/+$|^\/+/, "");
      return clean.startsWith("http") ? clean : `https://${clean}`;
    }
    return defaultOrigin;
  };

  const baseDomain = getBaseDomain();
  const fullShareUrl = `${baseDomain}/?report=${report.id}&shared=true`;

  // Copiar URL al portapapeles
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(fullShareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // Copiar token TXT
  const handleCopyToken = () => {
    navigator.clipboard.writeText(verificationToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2200);
  };

  // Estado del informe multinivel DNS
  const [dnsReport, setDnsReport] = useState<any>(null);
  const [provisioning, setProvisioning] = useState<boolean>(false);
  const [provisionMessage, setProvisionMessage] = useState<{ type: "success" | "error" | null; text: string }>({ type: null, text: "" });

  // Ejecutar comprobación DNS en 4 niveles desde el backend
  const handleVerifyDns = async () => {
    const domainToTest = selectedOption === "custom" ? savedCustomDomain : (adhocDomain || savedCustomDomain || baseDomain);
    if (!domainToTest) {
      setVerificationFeedback({
        type: "error",
        message: "Por favor ingresa un dominio para verificar."
      });
      return;
    }

    setVerifyingDns(true);
    setVerificationFeedback({ type: null, message: "" });

    try {
      const res = await fetch("/api/config/dns/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domainToTest })
      });
      const data = await res.json();

      if (res.ok) {
        setDnsReport(data);
        if (data.verified) {
          setVerificationFeedback({
            type: "success",
            message: data.message || "¡Dominio verificado con éxito!"
          });
        } else {
          setVerificationFeedback({
            type: "error",
            message: data.message || "Registros DNS incompletos o en proceso de propagación."
          });
        }
      } else {
        setVerificationFeedback({
          type: "error",
          message: data.error || "No se pudo consultar el diagnóstico DNS."
        });
      }
    } catch (e: any) {
      setVerificationFeedback({
        type: "error",
        message: "Error al conectar con el servidor para comprobar el DNS."
      });
    } finally {
      setVerifyingDns(false);
    }
  };

  // Auto-aprovisionar en la API de Vercel
  const handleProvisionVercel = async () => {
    const domainToTest = selectedOption === "custom" ? savedCustomDomain : (adhocDomain || savedCustomDomain || baseDomain);
    if (!domainToTest) return;

    setProvisioning(true);
    setProvisionMessage({ type: null, text: "" });

    try {
      const res = await fetch("/api/config/dns/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domainToTest })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setProvisionMessage({ type: "success", text: data.message });
        handleVerifyDns(); // Volver a consultar el informe
      } else {
        setProvisionMessage({ type: "error", text: data.message || "No se pudo registrar el dominio en la API del hosting." });
      }
    } catch (e: any) {
      setProvisionMessage({ type: "error", text: "Error de red al intentar registrar el dominio." });
    } finally {
      setProvisioning(false);
    }
  };

  // Enlaces de compartir directo
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `Hola, te comparto el informe de diagnóstico financiero de ${report.name}: ${fullShareUrl}`
  )}`;

  const mailShareUrl = `mailto:?subject=${encodeURIComponent(
    `Diagnóstico Financiero - ${report.name}`
  )}&body=${encodeURIComponent(
    `Hola,\n\nPuedes revisar el reporte completo de diagnóstico operacional y financiero para ${report.name} en la siguiente liga:\n${fullShareUrl}\n\nQuedamos a tus órdenes.`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Compartir Reporte Web
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                  {report.id}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Auditoría para <strong className="text-emerald-400 font-medium">{report.name}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2">
          <button
            onClick={() => setActiveTab("link")}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === "link"
                ? "border-emerald-500 text-emerald-400 bg-slate-900/80"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            Generador de Liga
          </button>
          <button
            onClick={() => setActiveTab("dns")}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === "dns"
                ? "border-emerald-500 text-emerald-400 bg-slate-900/80"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Verificación DNS TXT
            {isVerified ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">

          {activeTab === "link" ? (
            <>
              {/* Dominio Base Predeterminado */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Dominio Base para la Liga
                </label>

                <div className="p-3.5 rounded-xl border bg-emerald-500/10 border-emerald-500 text-white shadow-lg shadow-emerald-500/5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">Dominio Predeterminado</span>
                      <span className="text-[11px] text-slate-300 font-mono">{defaultOrigin}</span>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                </div>
              </div>

              {/* Vista Previa de la URL de Compartido */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-emerald-400" />
                    Enlace Generado para el Cliente
                  </span>
                  <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                    Modo Compartible (?shared=true)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={fullShareUrl}
                    className="w-full text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-slate-200 outline-none select-all"
                  />
                  <button
                    onClick={handleCopyUrl}
                    className={`px-4 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      copied
                        ? "bg-emerald-500 text-slate-950 font-bold"
                        : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        ¡Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar Enlace
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Botones de Compartido Directo */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Acciones de Envío Directo
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href={whatsappShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-3 bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 rounded-xl text-xs font-semibold text-emerald-300 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Enviar WhatsApp
                  </a>

                  <a
                    href={mailShareUrl}
                    className="flex items-center justify-center gap-2 p-3 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 rounded-xl text-xs font-semibold text-blue-300 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Enviar por Email
                  </a>
                </div>
              </div>
            </>
          ) : (
            /* Pestaña DNS & Registro TXT */
            <div className="space-y-5">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Instrucciones de Verificación DNS TXT
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Para validar que tienes la propiedad del dominio personalizado y habilitar el certificado SSL, agrega el siguiente registro TXT en el panel de control de tu proveedor de dominio (GoDaddy, Cloudflare, Namecheap, etc.):
                </p>
              </div>

              {/* Ficha de Configuración TXT */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80">
                <div className="p-3.5 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Tipo de Registro:</span>
                  <span className="font-mono bg-slate-800 text-emerald-400 px-2 py-0.5 rounded border border-slate-700 font-bold">
                    TXT
                  </span>
                </div>

                <div className="p-3.5 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Nombre / Host:</span>
                  <span className="font-mono text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    _tlamatqui-challenge <span className="text-slate-500">(o @)</span>
                  </span>
                </div>

                <div className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Valor del Token Secreto:</span>
                    <button
                      onClick={handleCopyToken}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium cursor-pointer"
                    >
                      {copiedToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedToken ? "¡Copiado!" : "Copiar Token"}
                    </button>
                  </div>
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-emerald-300 break-all select-all">
                    {verificationToken}
                  </div>
                </div>

                <div className="p-3.5 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Registro CNAME de Destino:</span>
                  <span className="font-mono text-blue-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    tlamatqui.vercel.app
                  </span>
                </div>
              </div>

              {/* Ficha Diagnóstica de 4 Checkpoints (TXT, CNAME, A, SSL) */}
              {dnsReport && dnsReport.checkpoints && (
                <div className="space-y-3 bg-slate-950/80 border border-slate-800 rounded-xl p-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Diagnóstico en Vivo de Red y SSL (4 Checkpoints)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {dnsReport.cleanDomain}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {dnsReport.checkpoints.map((cp: any) => (
                      <div
                        key={cp.key}
                        className={`p-3 rounded-lg border text-xs space-y-1 ${
                          cp.status === "success"
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                            : cp.status === "warning"
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                            : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span>{cp.label}</span>
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-black/40">
                            {cp.status}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono opacity-90 truncate">{cp.value || "-"}</p>
                        <p className="text-[10px] opacity-75 leading-tight">{cp.details}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mensaje de auto-aprovisionamiento */}
              {provisionMessage.text && (
                <div className={`p-3 rounded-xl border text-xs ${provisionMessage.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-rose-500/10 border-rose-500/30 text-rose-300"}`}>
                  {provisionMessage.text}
                </div>
              )}

              {/* Retroalimentación de Verificación */}
              {verificationFeedback.message && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                    verificationFeedback.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                      : "bg-rose-500/10 border-rose-500/40 text-rose-300"
                  }`}
                >
                  {verificationFeedback.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  )}
                  <div>{verificationFeedback.message}</div>
                </div>
              )}

              {/* Acciones Principales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleVerifyDns}
                  disabled={verifyingDns}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${verifyingDns ? "animate-spin" : ""}`} />
                  {verifyingDns ? "Verificando DNS..." : "Diagnóstico DNS (4 Checkpoints)"}
                </button>

                <button
                  onClick={handleProvisionVercel}
                  disabled={provisioning}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-emerald-400 border border-emerald-500/30 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className={`w-4 h-4 ${provisioning ? "animate-spin" : ""}`} />
                  {provisioning ? "Registrando en Vercel..." : "Auto-Registrar en Hosting (Vercel)"}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Modal */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Info className="w-3.5 h-3.5 text-emerald-400" />
            <span>Los enlaces compartidos no requieren login del usuario.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer font-medium"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
