/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Componente de Inicio de Sesión basado en el Inicio de Sesión Alojado (Universal Login) de Auth0
 * con despliegue dinámico del logo de la instancia y estética Ultra-Premium.
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/authContext";
import { getApiUrl } from "../lib/api";
import { 
  ShieldCheck, 
  Lock, 
  Sun, 
  Moon, 
  ArrowRight,
  CheckCircle2,
  Globe,
  KeyRound,
  ExternalLink,
  Building2,
  Sparkles
} from "lucide-react";

interface LoginPageProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

interface LogoConfig {
  logoType?: "text" | "logo";
  logoText?: string;
  logoFile?: string;
  globalEmail?: string;
}

export default function LoginPage({ isDarkMode, toggleDarkMode }: LoginPageProps) {
  const { loginWithRedirect, isAuth0Configured, isLoading } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoConfig, setLogoConfig] = useState<LogoConfig | null>(null);
  const [imageError, setImageError] = useState(false);

  // Obtener la configuración del logo de la instancia
  useEffect(() => {
    let isMounted = true;
    async function fetchLogoConfig() {
      try {
        const res = await fetch(getApiUrl("/api/logo-config"));
        if (res.ok && isMounted) {
          const data = await res.json();
          setLogoConfig(data);
        }
      } catch (err) {
        console.error("Error al obtener la configuración del logo de la instancia:", err);
      }
    }
    fetchLogoConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAuth0Login = async () => {
    try {
      setIsSubmitting(true);
      await loginWithRedirect();
    } catch (error) {
      console.error("Error al redirigir al inicio de sesión alojado de Auth0:", error);
      setIsSubmitting(false);
    }
  };

  const hasCustomLogo = Boolean(
    logoConfig?.logoType === "logo" && 
    logoConfig?.logoFile && 
    !imageError
  );

  const instanceName = logoConfig?.logoText || "Tlamatqui";

  return (
    <div className={`min-h-screen flex flex-col justify-between transition-colors duration-300 ${
      isDarkMode 
        ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100" 
        : "bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/60 text-slate-800"
    }`}>
      {/* Top Navigation Header */}
      <header className={`px-6 py-4 border-b flex justify-between items-center backdrop-blur-md sticky top-0 z-50 ${
        isDarkMode ? "border-slate-800/80 bg-slate-950/70" : "border-slate-200/80 bg-white/70"
      }`}>
        <div className="flex items-center gap-3">
          {hasCustomLogo ? (
            <img 
              src={logoConfig!.logoFile} 
              alt={instanceName}
              onError={() => setImageError(true)}
              className="h-9 w-auto max-w-[160px] object-contain drop-shadow-sm rounded"
            />
          ) : (
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold text-xl">
                  {instanceName.charAt(0).toUpperCase()}
                </div>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950 animate-pulse" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight tracking-tight">
                  {instanceName}
                </h1>
                <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Diagnostic & Auditor Suite
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Dark / Light Toggle */}
          <button
            onClick={toggleDarkMode}
            className={`p-2.5 rounded-xl border transition-all duration-200 flex items-center gap-2 text-xs font-medium ${
              isDarkMode 
                ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white" 
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-sm"
            }`}
            title="Cambiar tema de color"
          >
            {isDarkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Modo Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Modo Oscuro</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
        {/* Background Decorative Ambient Lights */}
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full relative z-10">
          
          {/* Centered Auth0 Login Card */}
          <div className={`p-8 md:p-10 rounded-3xl border shadow-2xl relative transition-all duration-300 text-center ${
            isDarkMode 
              ? "bg-slate-900/90 border-slate-800/90 shadow-blue-950/20 backdrop-blur-xl" 
              : "bg-white/95 border-slate-200 shadow-xl backdrop-blur-xl"
          }`}>
            
            {/* Instance Logo / Branding Display Header */}
            <div className="flex flex-col items-center justify-center mb-6">
              {hasCustomLogo ? (
                <div className="mb-4 p-3 rounded-2xl bg-white/5 border border-slate-700/20 shadow-inner flex items-center justify-center">
                  <img 
                    src={logoConfig!.logoFile} 
                    alt={instanceName}
                    onError={() => setImageError(true)}
                    className="h-16 w-auto max-w-[220px] max-h-20 object-contain drop-shadow-md"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-xl shadow-blue-500/20 mb-4">
                  <Lock className="w-8 h-8 text-blue-100" />
                </div>
              )}

              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-1">
                {instanceName}
              </h2>
              <p className={`text-xs md:text-sm font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Plataforma de Auditoría Financiera E-Commerce
              </p>
            </div>

            {/* Auth0 Badge Status */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Autenticación Segura mediante Auth0</span>
            </div>

            <p className={`text-xs md:text-sm leading-relaxed mb-8 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
              Haz clic a continuación para ser redirigido al inicio de sesión seguro alojado de Auth0 e ingresar con tus credenciales corporativas.
            </p>

            {/* Main Auth0 Universal Login Button */}
            <button
              onClick={handleAuth0Login}
              disabled={isLoading || isSubmitting}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className={`w-full py-4 px-6 rounded-2xl font-semibold text-sm md:text-base text-white transition-all duration-300 flex items-center justify-center gap-3 shadow-xl ${
                isLoading || isSubmitting
                  ? "bg-slate-700 cursor-not-allowed opacity-75"
                  : "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Redirigiendo a Auth0...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-5 h-5 text-blue-200" />
                  <span>Iniciar Sesión con Auth0</span>
                  <ArrowRight className={`w-5 h-5 transition-transform duration-200 ${isHovered ? "translate-x-1" : ""}`} />
                </>
              )}
            </button>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-2 mt-8 pt-6 border-t text-[11px] font-medium text-slate-400 border-slate-800/60">
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>SSL / TLS 1.3</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>OAuth 2.0 / OIDC</span>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className={`px-6 py-4 border-t text-center text-xs flex flex-col sm:flex-row justify-between items-center gap-2 ${
        isDarkMode ? "border-slate-800/80 text-slate-500 bg-slate-950/50" : "border-slate-200/80 text-slate-400 bg-white/50"
      }`}>
        <div>
          © {new Date().getFullYear()} {instanceName}. Todos los derechos reservados.
        </div>
        <div className="flex items-center gap-4">
          <span className="hover:underline cursor-pointer flex items-center gap-1">
            Políticas de Privacidad <ExternalLink className="w-3 h-3" />
          </span>
          <span>•</span>
          <span className="hover:underline cursor-pointer flex items-center gap-1">
            Soporte Técnico <Globe className="w-3 h-3" />
          </span>
        </div>
      </footer>
    </div>
  );
}
