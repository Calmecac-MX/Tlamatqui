/**
 * @file telemetryHelpers.ts
 * @description Funciones para gestión de identificadores de visitante y envío de analíticas/interacciones en tiempo real.
 */

/**
 * Obtiene el ID único de visitante del almacenamiento local (localStorage) o genera uno nuevo si no existe.
 *
 * @returns {string} Identificador único de visitante.
 */
export const getVisitorId = (): string => {
  if (typeof window === "undefined") return "server-sim";
  let vid = localStorage.getItem("evolucion_visitor_id");
  if (!vid) {
    vid = "vstr_" + Math.random().toString(36).substring(2, 14);
    localStorage.setItem("evolucion_visitor_id", vid);
  }
  return vid;
};

/**
 * Transmite un evento de interacción o métrica de uso al endpoint de analíticas del reporte.
 *
 * @param {string} reportId - ID del reporte de diagnóstico activo.
 * @param {string} type - Tipo de interacción registrada (ej. "slide_view", "whatsapp_click", "calculator_change").
 * @param {any} [details] - Información adicional opcional sobre el evento.
 * @returns {Promise<void>} Promesa que se resuelve al completar la petición.
 */
export const sendReportInteraction = async (
  reportId: string,
  type: string,
  details?: any
): Promise<void> => {
  try {
    const vid = getVisitorId();
    await fetch(`/api/reports/${reportId}/interaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorId: vid,
        type,
        details
      })
    });
  } catch (err) {
    // Registro silencioso en consola para mantener limpios los logs en producción
    console.warn("Error enviando métrica de interacción:", err);
  }
};
