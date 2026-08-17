/**
 * @file telemetry.ts
 * @description Utilidad de envío de datos de telemetría y eventos de comportamiento mediante navigator.sendBeacon.
 */

import { getApiUrl } from "./api";

/**
 * Estructura del evento de telemetría enviado al servidor.
 */
export interface TelemetryPayload {
  /** Identificador anónimo del visitante */
  visitorId?: string;
  /** Tipo de interacción efectuada */
  type: "slide_view" | "whatsapp_click" | "tool_click" | "calculator_change" | "heartbeat";
  /** Metadatos o información complementaria de la interacción */
  details?: Record<string, any>;
}

/**
 * Envía eventos de telemetría al backend utilizando navigator.sendBeacon cuando el usuario oculta o cierra la pestaña,
 * con fallback a fetch síncrono/keepalive.
 *
 * @param {string} reportId - ID del reporte observado.
 * @param {TelemetryPayload} payload - Carga útil del evento de interacción.
 * @returns {boolean} Verdadero al transmitir la telemetría.
 */
export function sendTelemetryBeacon(reportId: string, payload: TelemetryPayload): boolean {
  const url = getApiUrl(`/api/reports/${reportId}/interaction`);
  const bodyString = JSON.stringify(payload);

  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    const blob = new Blob([bodyString], { type: "application/json" });
    const success = navigator.sendBeacon(url, blob);
    if (success) return true;
  }

  // Fallback si sendBeacon no está disponible o falla
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: bodyString,
    keepalive: true,
  }).catch((err) => console.warn("[Telemetry] Error en envio de fallback:", err));

  return true;
}
