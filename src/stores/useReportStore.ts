/**
 * @file useReportStore.ts
 * @description Store de Zustand para la gestión reactiva del estado global de reportes y filtros.
 */

import { create } from "zustand";
import { Report } from "../types";

/**
 * Interfaz de estado global para la lista de reportes, búsquedas, filtros y ordenamiento.
 */
export interface ReportState {
  /** Lista completa de reportes de diagnóstico */
  reports: Report[];
  /** Reporte seleccionado o activo actualmente */
  activeReport: Report | null;
  /** Estado de carga asíncrona */
  loading: boolean;
  /** Mensaje de error global si aplica */
  error: string | null;
  /** Término de búsqueda textual introducido por el usuario */
  searchTerm: string;
  /** Filtro de rango de facturación (GMV) */
  filterGmv: string;
  /** Filtro de rango de visitas mensuales */
  filterVisits: string;
  /** Filtro de periodo de creación */
  filterPeriod: string;
  /** Criterio de ordenamiento (ej. 'name-asc', 'gmv-desc') */
  sortBy: string;
  /** Modo de visualización en panel ('grid' | 'table') */
  viewMode: "grid" | "table";
  /** Valor mínimo personalizado para filtro GMV */
  customGmvMin: string;
  /** Valor máximo personalizado para filtro GMV */
  customGmvMax: string;
  /** Valor mínimo personalizado para filtro de visitas */
  customVisitsMin: string;
  /** Valor máximo personalizado para filtro de visitas */
  customVisitsMax: string;

  /** Establece la lista completa de reportes */
  setReports: (reports: Report[]) => void;
  /** Define el reporte activo actualmente */
  setActiveReport: (report: Report | null) => void;
  /** Cambia el estado de carga */
  setLoading: (loading: boolean) => void;
  /** Establece o borra el mensaje de error */
  setError: (error: string | null) => void;
  /** Actualiza el término de búsqueda */
  setSearchTerm: (term: string) => void;
  /** Define el filtro de GMV */
  setFilterGmv: (gmv: string) => void;
  /** Define el filtro de visitas */
  setFilterVisits: (visits: string) => void;
  /** Define el filtro por periodo */
  setFilterPeriod: (period: string) => void;
  /** Establece el criterio de ordenamiento */
  setSortBy: (sort: string) => void;
  /** Establece el modo de vista (cuadrícula o tabla) */
  setViewMode: (mode: "grid" | "table") => void;
  /** Establece el mínimo personalizado de GMV */
  setCustomGmvMin: (val: string) => void;
  /** Establece el máximo personalizado de GMV */
  setCustomGmvMax: (val: string) => void;
  /** Establece el mínimo personalizado de visitas */
  setCustomVisitsMin: (val: string) => void;
  /** Establece el máximo personalizado de visitas */
  setCustomVisitsMax: (val: string) => void;
  
  /** Agrega un nuevo reporte al estado local */
  addReport: (report: Report) => void;
  /** Actualiza un reporte existente en la lista local */
  updateReportInStore: (report: Report) => void;
  /** Remueve un reporte de la lista por su ID */
  removeReportFromStore: (id: string) => void;
}

/**
 * Hook de Zustand para consumir y modificar el estado global de reportes.
 */
export const useReportStore = create<ReportState>((set) => ({
  reports: [],
  activeReport: null,
  loading: false,
  error: null,
  searchTerm: "",
  filterGmv: "all",
  filterVisits: "all",
  filterPeriod: "all",
  sortBy: "name-asc",
  viewMode: "grid",
  customGmvMin: "",
  customGmvMax: "",
  customVisitsMin: "",
  customVisitsMax: "",

  setReports: (reports) => set({ reports }),
  setActiveReport: (activeReport) => set({ activeReport }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setFilterGmv: (filterGmv) => set({ filterGmv }),
  setFilterVisits: (filterVisits) => set({ filterVisits }),
  setFilterPeriod: (filterPeriod) => set({ filterPeriod }),
  setSortBy: (sortBy) => set({ sortBy }),
  setViewMode: (viewMode) => set({ viewMode }),
  setCustomGmvMin: (customGmvMin) => set({ customGmvMin }),
  setCustomGmvMax: (customGmvMax) => set({ customGmvMax }),
  setCustomVisitsMin: (customVisitsMin) => set({ customVisitsMin }),
  setCustomVisitsMax: (customVisitsMax) => set({ customVisitsMax }),

  addReport: (report) =>
    set((state) => ({ reports: [report, ...state.reports] })),
  updateReportInStore: (report) =>
    set((state) => ({
      reports: state.reports.map((r) => (r.id === report.id ? report : r)),
      activeReport: state.activeReport?.id === report.id ? report : state.activeReport,
    })),
  removeReportFromStore: (id) =>
    set((state) => ({
      reports: state.reports.filter((r) => r.id !== id),
      activeReport: state.activeReport?.id === id ? null : state.activeReport,
    })),
}));
