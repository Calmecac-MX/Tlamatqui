/**
 * @file useReports.ts
 * @description Hook personalizado de React para consultar, crear, actualizar y eliminar reportes de diagnóstico.
 */

import { useEffect, useCallback } from "react";
import { useReportStore } from "../stores/useReportStore";
import { apiFetch } from "../lib/api";
import { Report } from "../types";

/**
 * Hook personalizado para la gestión de reportes de diagnóstico financiero.
 * Conecta el estado global de Zustand con la API REST del servidor backend.
 *
 * @returns {Object} Objeto con el estado de reportes y funciones CRUD.
 * @returns {Report[]} returns.reports - Lista de reportes disponibles.
 * @returns {Report | null} returns.activeReport - Reporte seleccionado actualmente.
 * @returns {boolean} returns.loading - Estado de carga de la petición HTTP.
 * @returns {string | null} returns.error - Mensaje de error si la petición falla.
 * @returns {Function} returns.fetchReports - Consulta la lista de reportes desde el servidor.
 * @returns {Function} returns.createReport - Crea un nuevo reporte en el servidor.
 * @returns {Function} returns.updateReport - Actualiza un reporte existente.
 * @returns {Function} returns.deleteReport - Elimina un reporte por su ID.
 * @returns {Function} returns.setActiveReport - Establece el reporte activo en pantalla.
 */
export function useReports() {
  const {
    reports,
    activeReport,
    loading,
    error,
    setReports,
    setActiveReport,
    setLoading,
    setError,
    addReport,
    updateReportInStore,
    removeReportFromStore,
  } = useReportStore();

  /**
   * Consulta la lista completa de reportes de diagnóstico desde el servidor.
   */
  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Report[]>("/api/reports");
      setReports(data);
    } catch (err: any) {
      console.error("Error al cargar reportes:", err);
      setError(err.message || "Error al cargar la lista de reportes");
    } finally {
      setLoading(false);
    }
  }, [setReports, setLoading, setError]);

  /**
   * Crea un nuevo reporte de diagnóstico enviando la información al backend.
   *
   * @param {Partial<Report>} reportData - Datos iniciales del reporte.
   * @returns {Promise<Report>} Reporte creado y retornado por el servidor.
   */
  const createReport = async (reportData: Partial<Report>): Promise<Report> => {
    try {
      const newReport = await apiFetch<Report>("/api/reports", {
        method: "POST",
        body: JSON.stringify(reportData),
      });
      addReport(newReport);
      return newReport;
    } catch (err: any) {
      console.error("Error al crear reporte:", err);
      throw err;
    }
  };

  /**
   * Actualiza la información de un reporte existente.
   *
   * @param {string} id - Identificador único del reporte.
   * @param {Partial<Report>} reportData - Propiedades a actualizar.
   * @returns {Promise<Report>} Reporte actualizado devuelto por el servidor.
   */
  const updateReport = async (id: string, reportData: Partial<Report>): Promise<Report> => {
    try {
      const updated = await apiFetch<Report>(`/api/reports/${id}`, {
        method: "PUT",
        body: JSON.stringify(reportData),
      });
      updateReportInStore(updated);
      return updated;
    } catch (err: any) {
      console.error("Error al actualizar reporte:", err);
      throw err;
    }
  };

  /**
   * Elimina un reporte de la base de datos por su ID.
   *
   * @param {string} id - Identificador del reporte a eliminar.
   * @returns {Promise<boolean>} Verdadero si la eliminación fue exitosa.
   */
  const deleteReport = async (id: string): Promise<boolean> => {
    try {
      await apiFetch(`/api/reports/${id}`, { method: "DELETE" });
      removeReportFromStore(id);
      return true;
    } catch (err: any) {
      console.error("Error al eliminar reporte:", err);
      throw err;
    }
  };

  useEffect(() => {
    if (reports.length === 0 && !loading) {
      fetchReports();
    }
  }, [fetchReports, reports.length, loading]);

  return {
    reports,
    activeReport,
    loading,
    error,
    fetchReports,
    createReport,
    updateReport,
    deleteReport,
    setActiveReport,
  };
}
