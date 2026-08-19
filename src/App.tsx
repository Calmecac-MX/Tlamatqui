/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, lazy, Suspense } from "react";
import LoginPage from "./components/LoginPage";
import { Auth0ProviderWrapper, useAuth } from "./lib/authContext";

const AdminPanel = lazy(() => import("./components/AdminPanel"));
const ReportView = lazy(() => import("./components/ReportView"));

function MainAppRouter() {
  const [viewingReportId, setViewingReportId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return params.get("report");
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isSharedMode, setIsSharedMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return params.get("shared") === "true";
  });
  const { isAuthenticated, isLoading } = useAuth();

  // Sync default document title when not viewing a report
  useEffect(() => {
    if (!viewingReportId) {
      document.title = "Tlachiālōyan | Tlamatqui";
    }
  }, [viewingReportId]);

  // Sync mode with document body
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Sync state with browser navigation and query parameters for /tlachialoyan
  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const reportId = params.get("report");
      const sharedParam = params.get("shared") === "true";
      setViewingReportId(reportId);
      setIsSharedMode(sharedParam);

      // Sincronizar slug /tlachialoyan cuando se accede a la administración
      if (!reportId && window.location.pathname === "/") {
        window.history.replaceState({}, "", "/tlachialoyan");
      }
    };

    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  const handleOpenReport = (id: string) => {
    setViewingReportId(id);
    setIsSharedMode(false); // Direct click from admin is not shared mode
    const newUrl = `${window.location.origin}/tlachialoyan?report=${id}`;
    window.history.pushState({ path: newUrl }, "", newUrl);
  };

  const handleCloseReport = () => {
    setViewingReportId(null);
    setIsSharedMode(false);
    const newUrl = `${window.location.origin}/tlachialoyan`;
    window.history.pushState({ path: newUrl }, "", newUrl);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  // Pantalla de carga mientras Auth0 inicializa la sesión
  if (isLoading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isDarkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-400">Verificando sesión de Auth0...</p>
      </div>
    );
  }

  // Loading fallback spinner component for Suspense
  const LoadingFallback = (
    <div className={`min-h-screen flex flex-col items-center justify-center ${isDarkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-3" />
      <p className="text-xs font-medium text-slate-400">Cargando aplicación...</p>
    </div>
  );

  // 1. Si hay un reporte activo (especialmente en modo público compartido), mostrar ReportView sin forzar login
  if (viewingReportId) {
    return (
      <div className={`min-h-screen transition-colors duration-200 bg-bg-theme ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>
        <Suspense fallback={LoadingFallback}>
          <ReportView 
            reportId={viewingReportId} 
            onBackToAdmin={handleCloseReport} 
            isDarkMode={isDarkMode}
            isShared={isSharedMode}
          />
        </Suspense>
      </div>
    );
  }

  // 2. Si el usuario intenta acceder al AdminPanel y no está autenticado, mostrar pantalla de inicio de sesión Auth0
  if (!isAuthenticated) {
    return (
      <LoginPage 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode} 
      />
    );
  }

  // 3. Usuario autenticado: mostrar AdminPanel completo
  return (
    <div className={`min-h-screen transition-colors duration-200 bg-bg-theme ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>
      <Suspense fallback={LoadingFallback}>
        <AdminPanel 
          onViewReport={handleOpenReport}
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
        />
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <Auth0ProviderWrapper>
      <MainAppRouter />
    </Auth0ProviderWrapper>
  );
}
