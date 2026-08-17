/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Componente de Inicio de Sesión basado en Auth0 con estética Ultra-Premium.
 */

import React, { useState } from "react";
import { useAuth } from "../lib/authContext";
import { FRONTEND_VERSION, BACKEND_VERSION } from "../version";
import { 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  TrendingUp, 
  BarChart3, 
  Zap, 
  Sun, 
  Moon, 
  ArrowRight,
  CheckCircle2,
  Globe,
  Users,
  KeyRound,
  ExternalLink
} from "lucide-react";

interface LoginPageProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export default function LoginPage({ isDarkMode, toggleDarkMode }: LoginPageProps) {
  const { loginWithRedirect, demoLogin, isAuth0Configured, isLoading } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuth0Login = async () => {
    try {
      setIsSubmitting(true);
      await loginWithRedirect();
    } catch (error) {
      console.error("Error al iniciar sesión con Auth0:", error);
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      demoLogin();
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between transition-colors duration-300 ${
      isDarkMode 
        ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100" 
        : "bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 text-slate-800"
    }`}>
      {/* Top Navigation Header */}
      <header className={`px-6 py-4 border-b flex justify-between items-center backdrop-blur-md sticky top-0 z-50 ${
        isDarkMode ? "border-slate-800/80 bg-slate-950/70" : "border-slate-200/80 bg-white/70"
      }`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold text-xl">
              E
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950 animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight">
              Tlamatqui
            </h1>
            <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              Diagnostic & Auditor Suite
            </p>
          </div>
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
                <span>Modo Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                <span>Modo Oscuro</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
        {/* Background Decorative Ambient Lights */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          {/* Left Column: Product Value Highlights */}
          <div className="lg:col-span-7 space-y-8 pr-0 lg:pr-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 text-blue-400">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Autenticación Segura mediante Auth0 Enterprise</span>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
                Auditoría Financiera de E-Commerce <br />
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-300 bg-clip-text text-transparent">
                  Potenciada para Tiendanube
                </span>
              </h2>
              <p className={`text-base md:text-lg leading-relaxed ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                Accede al panel de control para auditar tiendas Shopify, detectar fugas por comisiones ocultas, generar simulaciones de ahorro en tiempo real y presentar propuestas ejecutivas de alto impacto.
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={`p-4 rounded-2xl border transition-all duration-200 ${
                isDarkMode ? "bg-slate-900/60 border-slate-800/80 hover:border-blue-500/40" : "bg-white/80 border-slate-200/80 shadow-sm"
              }`}>
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-3">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Cálculo de Ahorro Real</h3>
                <p className={`text-xs leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Compara 0% comisiones de Tiendanube vs el cobro del 0.2% al 2% por transacción en Shopify.
                </p>
              </div>

              <div className={`p-4 rounded-2xl border transition-all duration-200 ${
                isDarkMode ? "bg-slate-900/60 border-slate-800/80 hover:border-cyan-500/40" : "bg-white/80 border-slate-200/80 shadow-sm"
              }`}>
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-3">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Scraping Inteligente de Apps</h3>
                <p className={`text-xs leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Detecta automáticamente apps redundantes ingresando únicamente el URL de la tienda.
                </p>
              </div>

              <div className={`p-4 rounded-2xl border transition-all duration-200 ${
                isDarkMode ? "bg-slate-900/60 border-slate-800/80 hover:border-teal-500/40" : "bg-white/80 border-slate-200/80 shadow-sm"
              }`}>
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 mb-3">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Analítica en Tiempo Real</h3>
                <p className={`text-xs leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Monitorea aperturas de clientes, permanencia y clics hacia WhatsApp en vivo.
                </p>
              </div>

              <div className={`p-4 rounded-2xl border transition-all duration-200 ${
                isDarkMode ? "bg-slate-900/60 border-slate-800/80 hover:border-indigo-500/40" : "bg-white/80 border-slate-200/80 shadow-sm"
              }`}>
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-3">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Espacios de Trabajo</h3>
                <p className={`text-xs leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Organiza miembros, agencias y consultores autorizados en múltiples equipos.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2 text-xs font-medium text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Cifrado SSL / TLS 1.3
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> SSO & OAuth 2.0 / OIDC
              </span>
            </div>
          </div>

          {/* Right Column: Auth0 Login Form Card */}
          <div className="lg:col-span-5">
            <div className={`p-8 rounded-3xl border shadow-2xl relative transition-all duration-300 ${
              isDarkMode 
                ? "bg-slate-900/90 border-slate-800/90 shadow-blue-950/20 backdrop-blur-xl" 
                : "bg-white/95 border-slate-200 shadow-xl backdrop-blur-xl"
            }`}>
              
              {/* Badge for Auth0 Status */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    <Lock className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm">Auth0 Identity Platform</span>
                </div>

                <div className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 ${
                  isAuth0Configured
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isAuth0Configured ? "bg-emerald-400 animate-ping" : "bg-amber-400"}`} />
                  {isAuth0Configured ? "Auth0 Activo" : "Modo Demo Activo"}
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <h3 className="text-2xl font-bold tracking-tight">Iniciar Sesión</h3>
                <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Ingresa con tu cuenta corporativa o credenciales de Auth0 para acceder al panel de control.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                {/* Main Auth0 Login Button */}
                <button
                  onClick={handleAuth0Login}
                  disabled={isLoading || isSubmitting}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  className={`w-full py-3.5 px-5 rounded-2xl font-semibold text-sm text-white transition-all duration-300 flex items-center justify-center gap-3 shadow-lg ${
                    isLoading || isSubmitting
                      ? "bg-slate-700 cursor-not-allowed opacity-75"
                      : "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-[1.01]"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Conectando con Auth0...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-5 h-5 text-blue-200" />
                      <span>Continuar con Auth0</span>
                      <ArrowRight className={`w-4 h-4 transition-transform duration-200 ${isHovered ? "translate-x-1" : ""}`} />
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className={`w-full border-t ${isDarkMode ? "border-slate-800" : "border-slate-200"}`} />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className={`px-3 font-semibold ${isDarkMode ? "bg-slate-900 text-slate-500" : "bg-white text-slate-400"}`}>
                      o prueba la plataforma
                    </span>
                  </div>
                </div>

                {/* Quick Demo Access Button */}
                <button
                  onClick={handleDemoLogin}
                  disabled={isLoading || isSubmitting}
                  className={`w-full py-3 px-4 rounded-2xl font-medium text-xs transition-all duration-200 flex items-center justify-center gap-2 border ${
                    isDarkMode 
                      ? "bg-slate-800/80 border-slate-700/80 text-slate-200 hover:bg-slate-700/80 hover:text-white" 
                      : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Acceso Rápido Modo Demostración</span>
                </button>
              </div>

              {/* Informational Note */}
              <div className={`mt-6 pt-6 border-t text-[11px] leading-relaxed flex items-start gap-2.5 ${
                isDarkMode ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"
              }`}>
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p>
                  El inicio de sesión garantiza que solo administradores y consultores autorizados puedan modificar plantillas, sincronizar la base de datos de PostgreSQL y emitir reportes.
                </p>
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
          © {new Date().getFullYear()} Evolución Diagnostics. Todos los derechos reservados.
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
