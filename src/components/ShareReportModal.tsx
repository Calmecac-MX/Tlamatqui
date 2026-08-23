/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Componente Modal Interactivo para Compartir Reportes Web.
 * Genera enlaces compartibles predeterminados y permite enviarlos por WhatsApp o Email.
 */

import React, { useState } from "react";
import { 
  X, 
  Copy, 
  Check, 
  Send, 
  Share2, 
  Info,
  Link as LinkIcon
} from "lucide-react";
import { Config, Report } from "../types";

interface ShareReportModalProps {
  /** Reporte que se desea compartir */
  report: Report | null;
  /** Configuración global actual del sistema */
  config?: Config | null;
  /** Callback para cerrar el modal */
  onClose: () => void;
  /** Callback opcional al actualizar la configuración */
  onConfigUpdated?: (updatedConfig: Config) => void;
}

export const ShareReportModal: React.FC<ShareReportModalProps> = ({
  report,
  onClose,
}) => {
  if (!report) return null;

  const defaultOrigin = typeof window !== "undefined" ? window.location.origin : "https://tlamatqui.app";
  const fullShareUrl = `${defaultOrigin}/?report=${report.id}&shared=true`;

  const [copied, setCopied] = useState<boolean>(false);

  // Copiar URL al portapapeles
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(fullShareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
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
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        
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

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">

          {/* URL de Compartido */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-emerald-400" />
                Enlace Generado para el Cliente
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
