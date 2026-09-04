/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Modal interactivo para crear nuevos diagnósticos mediante auditoría automática con Chismógrafo API.
 */

import React, { useState, useEffect } from "react";
import { Search, Sparkles, X, Globe, AlertCircle, ArrowRight, FileText, CheckCircle2 } from "lucide-react";
import { detectStoreWithChismografo, ChismografoAuditResult } from "../lib/scrapper";

interface CreateDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuditComplete: (result: ChismografoAuditResult) => void;
  onCreateManual: () => void;
  isDarkMode?: boolean;
}

export const CreateDiagnosticModal: React.FC<CreateDiagnosticModalProps> = ({
  isOpen,
  onClose,
  onAuditComplete,
  onCreateManual,
  isDarkMode = true,
}) => {
  const [storeUrl, setStoreUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStoreUrl("");
      setIsLoading(false);
      setStatusMessage("");
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAudit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = storeUrl.trim();
    if (!clean) {
      setErrorMessage("Por favor ingresa la URL o dominio de la tienda a auditar.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage("Sacando el chisme del sitio con Chismógrafo API...");

    try {
      // Pequeñas actualizaciones de estado para feedback visual fluido
      const t1 = setTimeout(() => setStatusMessage("Analizando CMS, plugins, infraestructura y pasarelas de pago..."), 1200);
      const t2 = setTimeout(() => setStatusMessage("Extrayendo logotipos, estimando costos y calculando fugas..."), 2600);

      const auditResult = await detectStoreWithChismografo(clean);
      clearTimeout(t1);
      clearTimeout(t2);

      setStatusMessage("¡Expediente completado con éxito!");
      setTimeout(() => {
        onAuditComplete(auditResult);
      }, 400);
    } catch (err: any) {
      console.error("Error al auditar tienda:", err);
      setErrorMessage(err.message || "No se pudo completar la auditoría con el Chismógrafo.");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className={`relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden transition-all ${
          isDarkMode 
            ? "bg-slate-900/95 border-slate-700/80 text-white" 
            : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        {/* Cabecera con degradado y acento temático */}
        <div className="relative p-6 pb-4 border-b border-border-theme/40 bg-gradient-to-r from-accent-theme/10 via-transparent to-purple-500/10">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute top-4 right-4 p-2 rounded-lg text-text-dim-theme hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-theme/20 border border-accent-theme/40 flex items-center justify-center text-accent-theme shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                Nuevo Diagnóstico
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-theme/20 text-accent-theme border border-accent-theme/30 font-mono font-bold uppercase tracking-wider">
                  Chismógrafo API
                </span>
              </h3>
              <p className="text-xs text-text-dim-theme mt-0.5">
                Audita cualquier tienda al instante usando el motor de detección de Rífatela.
              </p>
            </div>
          </div>
        </div>

        {/* Contenido / Formulario */}
        <div className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="flex-1">
                <span className="font-bold block">Error al auditar</span>
                {errorMessage}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-accent-theme/20 border-t-accent-theme animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Search className="w-6 h-6 text-accent-theme animate-bounce" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white tracking-wide">
                  {statusMessage || "Analizando sitio web..."}
                </p>
                <p className="text-xs text-text-dim-theme font-mono">
                  Consultando https://chismografo.rifatela.lol/api/detect
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAudit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-text-dim-theme flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-accent-theme" />
                  URL o Dominio de la Tienda
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={storeUrl}
                    onChange={(e) => setStoreUrl(e.target.value)}
                    placeholder="ej. mimarca.com o https://tienda.myshopify.com"
                    autoFocus
                    className={`w-full px-4 py-3 pl-11 rounded-xl text-sm transition-all outline-none border font-medium ${
                      isDarkMode
                        ? "bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-accent-theme focus:ring-2 focus:ring-accent-theme/20"
                        : "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-accent-theme focus:ring-2 focus:ring-accent-theme/20"
                    }`}
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[11px] text-text-dim-theme">
                  Tip: Puedes pegar el enlace completo o solo el dominio (ej. <span className="text-slate-300 font-mono">colourpop.com</span>).
                </p>
              </div>

              {/* Botón principal de auditoría */}
              <button
                type="submit"
                disabled={!storeUrl.trim() || isLoading}
                className="w-full py-3 px-4 rounded-xl bg-accent-theme hover:bg-accent-theme/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-accent-theme/20 transition-all active:scale-[0.99] cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Auditar con Chismógrafo
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </form>
          )}

          {/* Separador */}
          {!isLoading && (
            <div className="relative flex items-center justify-center my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-theme/40" />
              </div>
              <span className={`relative px-3 text-[10px] uppercase font-bold tracking-wider ${
                isDarkMode ? "bg-slate-900 text-slate-400" : "bg-white text-slate-500"
              }`}>
                o crea manualmente
              </span>
            </div>
          )}

          {/* Opción para crear en blanco */}
          {!isLoading && (
            <button
              type="button"
              onClick={onCreateManual}
              className={`w-full py-2.5 px-4 rounded-xl border transition-all text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer ${
                isDarkMode
                  ? "border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white"
                  : "border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-text-dim-theme" />
              Crear Diagnóstico en Blanco (Manual)
            </button>
          )}
        </div>

        {/* Pie con distintivo de Chismógrafo */}
        <div className={`p-4 text-[11px] border-t flex items-center justify-between ${
          isDarkMode ? "bg-slate-950/60 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"
        }`}>
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-accent-theme" />
            Detección de CMS, Plugins, Pasarelas y Logos
          </span>
          <span className="font-mono text-[10px] text-text-dim-theme">
            v1.12 Chismógrafo
          </span>
        </div>
      </div>
    </div>
  );
};

export default CreateDiagnosticModal;
