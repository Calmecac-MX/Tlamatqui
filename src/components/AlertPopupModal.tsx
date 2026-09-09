/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Componentes Visuales del Sistema de Popups:
 * - AlertPopupModal: Modal interactivo para alertas, avisos de error/éxito y confirmaciones.
 * - AlertToastContainer: Contenedor de avisos flotantes (toasts) con auto-descarte.
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  X, 
  HelpCircle,
  Sparkles
} from "lucide-react";
import { useAlertPopup, AlertType } from "../context/AlertPopupContext";

/** Retorna icono y estilos según el tipo de aviso */
const getAlertStyle = (type?: AlertType) => {
  switch (type) {
    case "success":
      return {
        icon: <CheckCircle2 className="w-7 h-7 text-emerald-400" />,
        bgIcon: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
        border: "border-emerald-500/30",
        btnConfirm: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20",
        titleColor: "text-emerald-400",
      };
    case "error":
    case "danger":
      return {
        icon: <AlertCircle className="w-7 h-7 text-rose-400" />,
        bgIcon: "bg-rose-500/10 border-rose-500/30 text-rose-400",
        border: "border-rose-500/30",
        btnConfirm: "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/20",
        titleColor: "text-rose-400",
      };
    case "warning":
      return {
        icon: <AlertTriangle className="w-7 h-7 text-amber-400" />,
        bgIcon: "bg-amber-500/10 border-amber-500/30 text-amber-400",
        border: "border-amber-500/30",
        btnConfirm: "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/20",
        titleColor: "text-amber-400",
      };
    case "info":
    default:
      return {
        icon: <Info className="w-7 h-7 text-indigo-400" />,
        bgIcon: "bg-indigo-500/10 border-indigo-500/30 text-indigo-400",
        border: "border-indigo-500/30",
        btnConfirm: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20",
        titleColor: "text-indigo-400",
      };
  }
};

/** Popup Modal Principal */
export const AlertPopupModal: React.FC = () => {
  const { activeModal, closeModal } = useAlertPopup();
  const [inputValue, setInputValue] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeModal) {
      setInputValue(activeModal.inputPrompt?.defaultValue || "");
      if (activeModal.inputPrompt) {
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }
  }, [activeModal]);

  if (!activeModal || !activeModal.isOpen) return null;

  const style = getAlertStyle(activeModal.type);

  const handleConfirm = () => {
    if (activeModal.inputPrompt) {
      closeModal(inputValue);
    } else {
      closeModal(true);
    }
  };

  const handleCancel = () => {
    closeModal(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirm();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div 
        className={`relative w-full max-w-md bg-slate-900/95 border ${style.border} rounded-2xl shadow-2xl shadow-black/80 overflow-hidden text-slate-100 transform transition-all animate-in zoom-in-95 duration-200`}
      >
        {/* Glow de fondo temático */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="p-6 space-y-5 relative">
          {/* Header con Icono y Botón de Cierre */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 shadow-inner ${style.bgIcon}`}>
                {style.icon}
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {activeModal.title}
                </h3>
                <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mt-0.5">
                  <Sparkles className="w-3 h-3 text-indigo-400" /> Tlamatqui Suite
                </span>
              </div>
            </div>

            <button
              onClick={handleCancel}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mensaje */}
          <div className="text-xs md:text-sm text-slate-300 leading-relaxed font-normal bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60 whitespace-pre-line">
            {activeModal.message}
          </div>

          {/* Campo de Entrada si es tipo Prompt */}
          {activeModal.inputPrompt && (
            <div className="space-y-1.5">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={activeModal.inputPrompt.placeholder}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
              />
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            {activeModal.showCancel && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl transition-all cursor-pointer active:scale-95"
              >
                {activeModal.cancelText || "Cancelar"}
              </button>
            )}

            <button
              type="button"
              onClick={handleConfirm}
              className={`px-5 py-2 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer active:scale-95 ${style.btnConfirm}`}
            >
              {activeModal.confirmText || "Aceptar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/** Contenedor de Toasts Flotantes */
export const AlertToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAlertPopup();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9998] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((t) => {
        const style = getAlertStyle(t.type);
        return (
          <div
            key={t.id}
            className={`pointer-events-auto w-full p-4 rounded-2xl bg-slate-900/95 border ${style.border} shadow-xl shadow-black/60 text-slate-100 flex items-start gap-3 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-200`}
          >
            <div className={`p-2 rounded-lg border shrink-0 ${style.bgIcon}`}>
              {t.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {t.type === "error" && <AlertCircle className="w-4 h-4 text-rose-400" />}
              {t.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-400" />}
              {t.type === "info" && <Info className="w-4 h-4 text-indigo-400" />}
            </div>

            <div className="flex-1 min-w-0">
              {t.title && (
                <h4 className="text-xs font-bold text-white mb-0.5 tracking-tight">
                  {t.title}
                </h4>
              )}
              <p className="text-xs text-slate-300 leading-snug whitespace-pre-line">
                {t.message}
              </p>
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer shrink-0"
              title="Cerrar notificación"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
