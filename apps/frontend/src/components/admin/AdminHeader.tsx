import React from "react";
import { Menu, LogOut, Plus } from "lucide-react";
import { AuthUser } from "../../lib/authContext";

interface AdminHeaderProps {
  adminLogo?: string;
  adminText?: string;
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: (expanded: boolean) => void;
  adminTab: string;
  editingReport: any;
  selectedLiveMetricsReport: any;
  setEditingReport: (report: any) => void;
  handleStartCreate: () => void;
  authUser: AuthUser | null;
  authLogout: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  adminLogo,
  adminText,
  isSidebarExpanded,
  setIsSidebarExpanded,
  adminTab,
  editingReport,
  selectedLiveMetricsReport,
  setEditingReport,
  handleStartCreate,
  authUser,
  authLogout,
}) => {
  return (
    <header className="border-b border-border-theme px-6 py-4 flex items-center justify-between bg-surface-theme/40 backdrop-blur-md sticky top-0 z-10 gap-4">
      <div className="flex items-center gap-3">
        {!isSidebarExpanded && (
          <button
            onClick={() => setIsSidebarExpanded(true)}
            className="p-1.5 rounded-lg border border-border-theme bg-surface-theme hover:bg-surface-hover-theme text-white transition-all cursor-pointer"
            title="Mostrar menú de navegación"
          >
            <Menu className="w-5 h-5 text-accent-theme" />
          </button>
        )}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            {adminLogo && adminLogo.toLowerCase() !== "none" ? (
              <div className="flex items-center gap-3">
                <img
                  src={adminLogo}
                  alt={adminText || "Logo de Administrador"}
                  className="h-9 max-w-[240px] object-contain rounded border border-border-theme bg-surface-theme/30 p-1"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                    const fallbackText = document.getElementById(
                      "admin-header-fallback-text"
                    );
                    if (fallbackText) fallbackText.style.display = "block";
                  }}
                />
                <div id="admin-header-fallback-text" className="hidden">
                  <h2 className="text-lg font-bold tracking-tight text-white">
                    {adminText || "Evolución Diagnostics"}
                  </h2>
                </div>
              </div>
            ) : (
              <h2 className="text-lg font-bold tracking-tight text-white">
                {adminText || "Evolución Diagnostics"}
              </h2>
            )}

            <span className="inline-flex px-2 py-0.5 text-[10px] font-bold bg-accent-theme/10 text-accent-theme border border-accent-theme/20 rounded-md uppercase tracking-wider">
              {editingReport
                ? "Formulario"
                : selectedLiveMetricsReport
                ? "Métricas en Vivo"
                : adminTab === "reports"
                ? "Diagnósticos"
                : adminTab === "dashboard"
                ? "Dashboard"
                : adminTab === "team"
                ? "Mi Equipo"
                : adminTab === "profile"
                ? "Mi Cuenta"
                : "Configuración"}
            </span>
          </div>

          <p className="text-xs text-text-dim-theme hidden md:block">
            {editingReport
              ? "Formulario para configurar comparativas de pasarelas, cargos extras, y cálculo de ahorro para Tiendanube."
              : selectedLiveMetricsReport
              ? "Análisis de rendimiento en tiempo real simulado con intervalos configurables."
              : adminTab === "reports"
              ? "Gestión de reportes de diagnóstico y comparativas."
              : adminTab === "dashboard"
              ? "Resumen de diagnósticos creados, visitas, clics en enlaces y conversión de leads."
              : adminTab === "team"
              ? "Gestión, estadísticas, miembros y configuración de tu equipo de consultores."
              : adminTab === "profile"
              ? "Actualiza tu información personal, foto de perfil y rol de usuario en la plataforma."
              : "Administra las opciones generales del panel, marca blanca, y valores de conversión predeterminados."}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {authUser && (
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-border-theme bg-surface-theme/80 backdrop-blur-sm">
            <img
              src={
                authUser.picture ||
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"
              }
              alt={authUser.name}
              className="w-7 h-7 rounded-full object-cover border border-accent-theme/40"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-white leading-tight flex items-center gap-1">
                {authUser.name}
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-accent-theme/20 text-accent-theme border border-accent-theme/30 font-semibold">
                  {authUser.role || "Admin"}
                </span>
              </span>
              <span className="text-[10px] text-text-dim-theme truncate max-w-[140px]">
                {authUser.email}
              </span>
            </div>

            <button
              onClick={authLogout}
              className="p-1.5 text-text-dim-theme hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer ml-1"
              title="Cerrar Sesión (Auth0 Logout)"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        {editingReport && (
          <button
            onClick={() => setEditingReport(null)}
            className="text-xs text-text-dim-theme hover:text-white border border-border-theme bg-surface-theme hover:bg-surface-hover-theme transition-all px-3 py-1.5 rounded-lg cursor-pointer font-bold mr-1"
          >
            Volver a la Lista
          </button>
        )}

        <button
          onClick={handleStartCreate}
          className="bg-accent-theme hover:bg-accent-theme/90 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" /> Nuevo Diagnóstico
        </button>
      </div>
    </header>
  );
};
