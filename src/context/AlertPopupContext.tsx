/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Contexto y Gestor Global de Avisos, Popups y Diálogos de Confirmación.
 * Reemplaza diálogos nativos del navegador por popups modernos con diseño interactivo.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

export type AlertType = "info" | "success" | "warning" | "error" | "danger";

export interface ModalAlertOptions {
  title?: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  inputPrompt?: {
    placeholder?: string;
    defaultValue?: string;
  };
}

export interface ModalAlertState extends ModalAlertOptions {
  id: string;
  isOpen: boolean;
  message: string;
  resolve?: (value: boolean | string | null) => void;
}

export interface ToastPopup {
  id: string;
  message: string;
  title?: string;
  type: AlertType;
  duration: number;
}

export interface AlertPopupContextType {
  /** Muestra un popup modal informativo o de alerta */
  showAlert: (message: string, options?: ModalAlertOptions) => Promise<void>;
  /** Muestra un popup modal de confirmación con opciones Aceptar / Cancelar */
  showConfirm: (message: string, options?: ModalAlertOptions) => Promise<boolean>;
  /** Muestra un popup modal con campo de entrada (Prompt) */
  showPrompt: (message: string, options?: ModalAlertOptions) => Promise<string | null>;
  /** Muestra un toast popup flotante no intrusivo */
  showToast: (message: string, options?: { title?: string; type?: AlertType; duration?: number }) => void;
  /** Utilidades rápidas de toasts */
  toast: {
    success: (message: string, title?: string, duration?: number) => void;
    error: (message: string, title?: string, duration?: number) => void;
    warning: (message: string, title?: string, duration?: number) => void;
    info: (message: string, title?: string, duration?: number) => void;
  };
  /** Estado del modal activo */
  activeModal: ModalAlertState | null;
  /** Cierra el modal activo */
  closeModal: (result: boolean | string | null) => void;
  /** Lista de toasts activos */
  toasts: ToastPopup[];
  /** Elimina un toast por ID */
  removeToast: (id: string) => void;
}

const AlertPopupContext = createContext<AlertPopupContextType | undefined>(undefined);

export const AlertPopupProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeModal, setActiveModal] = useState<ModalAlertState | null>(null);
  const [toasts, setToasts] = useState<ToastPopup[]>([]);

  // Eliminar toast
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Mostrar toast emergente
  const showToast = useCallback((message: string, options?: { title?: string; type?: AlertType; duration?: number }) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const duration = options?.duration ?? 4000;
    const newToast: ToastPopup = {
      id,
      message,
      title: options?.title,
      type: options?.type || "info",
      duration,
    };

    setToasts(prev => [...prev.slice(-4), newToast]); // Mantener máximo 5 toasts concurrentes

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  // Toasts helpers
  const toast = {
    success: useCallback((msg: string, title?: string, duration?: number) => showToast(msg, { title, type: "success", duration }), [showToast]),
    error: useCallback((msg: string, title?: string, duration?: number) => showToast(msg, { title, type: "error", duration }), [showToast]),
    warning: useCallback((msg: string, title?: string, duration?: number) => showToast(msg, { title, type: "warning", duration }), [showToast]),
    info: useCallback((msg: string, title?: string, duration?: number) => showToast(msg, { title, type: "info", duration }), [showToast]),
  };

  // Mostrar modal alert
  const showAlert = useCallback((message: string, options?: ModalAlertOptions): Promise<void> => {
    return new Promise((resolve) => {
      setActiveModal({
        id: `modal-${Date.now()}`,
        isOpen: true,
        message,
        title: options?.title || (options?.type === "error" || options?.type === "danger" ? "Atención Requerida" : options?.type === "success" ? "Operación Exitosa" : "Aviso"),
        type: options?.type || "info",
        confirmText: options?.confirmText || "Entendido",
        showCancel: false,
        resolve: () => resolve(),
      });
    });
  }, []);

  // Mostrar modal confirm
  const showConfirm = useCallback((message: string, options?: ModalAlertOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setActiveModal({
        id: `modal-${Date.now()}`,
        isOpen: true,
        message,
        title: options?.title || "Confirmar Acción",
        type: options?.type || "warning",
        confirmText: options?.confirmText || "Aceptar",
        cancelText: options?.cancelText || "Cancelar",
        showCancel: true,
        resolve: (val) => resolve(Boolean(val)),
      });
    });
  }, []);

  // Mostrar modal prompt
  const showPrompt = useCallback((message: string, options?: ModalAlertOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      setActiveModal({
        id: `modal-${Date.now()}`,
        isOpen: true,
        message,
        title: options?.title || "Ingresar Información",
        type: options?.type || "info",
        confirmText: options?.confirmText || "Aceptar",
        cancelText: options?.cancelText || "Cancelar",
        showCancel: true,
        inputPrompt: options?.inputPrompt || { placeholder: "Escribe aquí..." },
        resolve: (val) => resolve(typeof val === "string" ? val : null),
      });
    });
  }, []);

  // Cerrar modal resolviendo la promesa
  const closeModal = useCallback((result: boolean | string | null) => {
    if (activeModal && activeModal.resolve) {
      activeModal.resolve(result);
    }
    setActiveModal(null);
  }, [activeModal]);

  // Interceptar window.alert nativo para que automáticamente use el popup modal si se ejecuta
  useEffect(() => {
    const originalAlert = window.alert;

    window.alert = (msg: any) => {
      const messageStr = typeof msg === "string" ? msg : JSON.stringify(msg);
      const isSuccess = /éxito|completado|guardad|copiad/i.test(messageStr);
      const isError = /error|fall|inválid|requerid|obligatori/i.test(messageStr);
      
      showAlert(messageStr, {
        type: isError ? "error" : isSuccess ? "success" : "info",
        title: isError ? "Error o Alerta" : isSuccess ? "Confirmación" : "Aviso de la Aplicación",
      });
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [showAlert]);

  return (
    <AlertPopupContext.Provider
      value={{
        showAlert,
        showConfirm,
        showPrompt,
        showToast,
        toast,
        activeModal,
        closeModal,
        toasts,
        removeToast,
      }}
    >
      {children}
    </AlertPopupContext.Provider>
  );
};

export const useAlertPopup = (): AlertPopupContextType => {
  const context = useContext(AlertPopupContext);
  if (!context) {
    throw new Error("useAlertPopup debe ser usado dentro de un AlertPopupProvider");
  }
  return context;
};
