/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Modal interactivo para enviar diagnósticos financieros por correo electrónico vía SMTP.
 */

import React, { useState, useEffect } from "react";
import { Mail, Send, X, CheckCircle, AlertTriangle, Loader2, Server, FileText } from "lucide-react";
import { apiFetch } from "../lib/api";

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  storeName: string;
  defaultEmail?: string;
  pdfBase64?: string;
}

export default function SendEmailModal({
  isOpen,
  onClose,
  reportId,
  storeName,
  defaultEmail = "",
  pdfBase64
}: SendEmailModalProps) {
  const [toEmail, setToEmail] = useState<string>(defaultEmail);
  const [customSubject, setCustomSubject] = useState<string>(`Diagnóstico Financiero de Comercio: ${storeName}`);
  const [note, setNote] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [smtpStatus, setSmtpStatus] = useState<{ configured: boolean; host: string; from: string } | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);

  useEffect(() => {
    if (defaultEmail) {
      setToEmail(defaultEmail);
    }
  }, [defaultEmail]);

  useEffect(() => {
    if (storeName) {
      setCustomSubject(`Diagnóstico Financiero de Comercio: ${storeName}`);
    }
  }, [storeName]);

  useEffect(() => {
    if (!isOpen) {
      setSuccessMessage(null);
      setErrorMessage(null);
      return;
    }

    // Comprobar si el servidor backend tiene SMTP configurado
    async function checkSmtp() {
      setLoadingStatus(true);
      try {
        const data = await apiFetch<{ configured: boolean; host: string; from: string }>("/api/smtp-status");
        setSmtpStatus(data);
      } catch (_) {
        setSmtpStatus({ configured: false, host: "", from: "" });
      } finally {
        setLoadingStatus(false);
      }
    }

    checkSmtp();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail || !toEmail.includes("@")) {
      setErrorMessage("Por favor ingresa un correo electrónico válido.");
      return;
    }

    setIsSending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await apiFetch<{ success: boolean; message: string }>("/api/send-report-email", {
        method: "POST",
        body: JSON.stringify({
          toEmail: toEmail.trim(),
          reportId,
          customSubject: customSubject.trim(),
          note: note.trim(),
          pdfBase64
        })
      });

      if (response && response.success) {
        setSuccessMessage(`¡Reporte enviado exitosamente a ${toEmail}!`);
        setTimeout(() => {
          onClose();
        }, 2200);
      } else {
        setErrorMessage("No se pudo completar el envío del correo.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error al enviar el correo vía SMTP.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl">
        
        {/* Encabezado del Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Enviar Reporte por Correo (SMTP)</h3>
              <p className="text-xs text-slate-400">Comercio: <span className="text-blue-400 font-medium">{storeName}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Indicador de Estado cuando NO existen credenciales */}
          {!loadingStatus && smtpStatus && !smtpStatus.configured && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold mb-0.5">Credenciales de Correo no Configuradas</strong>
                No se detectaron credenciales activas de Brevo API ni servidor SMTP. Las opciones de envío han sido desactivadas. Contacta al administrador para configurarlas en el archivo <code className="font-mono text-amber-200">.env</code>.
              </div>
            </div>
          )}

          {/* Mensaje de Error */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Mensaje de Éxito */}
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-sm font-medium flex items-center gap-3 animate-fade-in">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Destinatario */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Correo Electrónico Destinatario <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                required
                disabled={!smtpStatus?.configured || isSending || loadingStatus}
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="cliente@comercio.com"
                className={`w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-800/90 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-500 ${
                  !smtpStatus?.configured ? "opacity-50 cursor-not-allowed bg-slate-800/50" : ""
                }`}
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Asunto */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Asunto del Mensaje
            </label>
            <input
              type="text"
              disabled={!smtpStatus?.configured || isSending || loadingStatus}
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              placeholder="Asunto personalizado..."
              className={`w-full px-3.5 py-2.5 text-sm bg-slate-800/90 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-500 ${
                !smtpStatus?.configured ? "opacity-50 cursor-not-allowed bg-slate-800/50" : ""
              }`}
            />
          </div>

          {/* Nota personalizada */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Nota Personalizada para el Cliente (Opcional)
            </label>
            <textarea
              rows={3}
              disabled={!smtpStatus?.configured || isSending || loadingStatus}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Escribe comentarios ejecutivos o instrucciones para el cliente..."
              className={`w-full px-3.5 py-2.5 text-sm bg-slate-800/90 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-500 resize-none ${
                !smtpStatus?.configured ? "opacity-50 cursor-not-allowed bg-slate-800/50" : ""
              }`}
            />
          </div>

          {/* Archivo adjunto PDF (si está presente) */}
          {pdfBase64 && (
            <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-between text-xs text-blue-300">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Adjunto: Diagnostico-{storeName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 font-mono">PDF Generado</span>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSending || loadingStatus || !smtpStatus?.configured}
              className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer ${
                isSending || loadingStatus || !smtpStatus?.configured
                  ? "bg-slate-700 text-slate-400 cursor-not-allowed shadow-none opacity-60"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/20 active:scale-95"
              }`}
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Enviando reporte...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Enviar Reporte</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
