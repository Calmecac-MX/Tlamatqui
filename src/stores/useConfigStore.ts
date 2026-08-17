/**
 * @file useConfigStore.ts
 * @description Store de Zustand para la gestión reactiva de la configuración global de la aplicación.
 */

import { create } from "zustand";
import { Config, LogoConfig, Partner } from "../types";

/**
 * Interfaz para el estado de configuración de la plataforma, logos y perfil de socio.
 */
export interface ConfigState {
  /** Configuración general del panel de administración */
  config: Partial<Config>;
  /** Configuración del logotipo institucional */
  logoConfig: Partial<LogoConfig>;
  /** Información del socio/partner asignado */
  partner: Partial<Partner>;
  /** Estado de guardado en servidor */
  isSavingConfig: boolean;

  /** Actualiza la configuración global */
  setConfig: (config: Partial<Config>) => void;
  /** Actualiza la configuración de marcas y logos */
  setLogoConfig: (logoConfig: Partial<LogoConfig>) => void;
  /** Define la información del socio */
  setPartner: (partner: Partial<Partner>) => void;
  /** Cambia el estado de guardado */
  setIsSavingConfig: (saving: boolean) => void;
}

/**
 * Hook de Zustand para acceder y modificar la configuración global.
 */
export const useConfigStore = create<ConfigState>((set) => ({
  config: {
    adminLogoUrl: "",
    adminTextUrl: "Evolución Diagnostics",
    defaultContactEmail: "cesar.ayar19@gmail.com",
    defaultContactWhatsapp: "5512345678",
    customExchangeRate: 18.50,
    metricsUpdateInterval: 3000,
  },
  logoConfig: {
    logoType: "text",
    logoText: "Evolución Diagnostics",
    logoFile: "",
    globalEmail: "cesar.ayar19@gmail.com",
  },
  partner: {},
  isSavingConfig: false,

  setConfig: (config) =>
    set((state) => ({ config: { ...state.config, ...config } })),
  setLogoConfig: (logoConfig) =>
    set((state) => ({ logoConfig: { ...state.logoConfig, ...logoConfig } })),
  setPartner: (partner) => set({ partner }),
  setIsSavingConfig: (isSavingConfig) => set({ isSavingConfig }),
}));
