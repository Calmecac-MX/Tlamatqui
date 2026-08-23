/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Vista / Página Dedicada de Invitación a Equipo con Registro Directo en Auth0.
 * Muestra los detalles del equipo, líder y rol asignado (ej. Agente),
 * permitiendo aceptar la invitación e iniciar el flujo de creación de cuenta en Auth0.
 */

import React, { useState, useEffect } from "react";
import { 
  Users, 
  UserPlus, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  Mail, 
  User, 
  Sparkles, 
  ArrowRight, 
  AlertCircle,
  RefreshCw,
  Crown,
  Lock,
  LogOut
} from "lucide-react";
import { useAuth } from "../lib/authContext";
import { Team } from "../types";

interface JoinTeamModalProps {
  /** Token de invitación presente en la URL (?inviteTeam=token) */
  inviteToken: string;
  /** Callback al unirse exitosamente al equipo */
  onJoined: (joinedTeam: Team) => void;
  /** Callback para cerrar/cancelar la invitación */
  onClose: () => void;
}

export const JoinTeamModal: React.FC<JoinTeamModalProps> = ({
  inviteToken,
  onJoined,
  onClose
}) => {
  const { user, isAuthenticated, loginWithRedirect, logout } = useAuth();
  
  const [teamInfo, setTeamInfo] = useState<{
    id: string;
    name: string;
    image?: string;
    ownerName: string;
    inviteRole: string;
    memberCount: number;
  } | null>(null);

  const [loadingInfo, setLoadingInfo] = useState<boolean>(true);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  const [joining, setJoining] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | null; msg: string }>({
    type: null,
    msg: ""
  });

  // Guardar token pendiente en localStorage para persistencia tras Auth0 redirect
  useEffect(() => {
    if (inviteToken) {
      localStorage.setItem("tlamatqui_pending_invite_token", inviteToken);
    }
  }, [inviteToken]);

  // Cargar datos de vista previa pública del equipo
  useEffect(() => {
    if (!inviteToken) return;
    setLoadingInfo(true);
    setErrorInfo(null);

    fetch(`/api/teams/invite/${encodeURIComponent(inviteToken)}`)
      .then((res) => {
        if (!res.ok) throw new Error("El enlace de invitación no es válido o ha expirado.");
        return res.json();
      })
      .then((data) => {
        setTeamInfo(data);
      })
      .catch((err: any) => {
        setErrorInfo(err.message || "Error al cargar la información del equipo.");
      })
      .finally(() => {
        setLoadingInfo(false);
      });
  }, [inviteToken]);

  // Procesar solicitud de incorporación para usuarios ya autenticados
  const handleJoinAuthenticated = async () => {
    if (!user || !user.email) return;

    setJoining(true);
    setFeedback({ type: null, msg: "" });

    try {
      const res = await fetch("/api/teams/invite/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: inviteToken,
          name: user.name || user.email.split("@")[0],
          email: user.email.trim(),
          avatar: user.picture || undefined
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.removeItem("tlamatqui_pending_invite_token");
        setFeedback({ type: "success", msg: data.message || "¡Te has unido exitosamente al equipo!" });
        setTimeout(() => {
          if (data.team) {
            onJoined(data.team);
          }
          onClose();
        }, 1200);
      } else {
        setFeedback({ type: "error", msg: data.message || "No se pudo completar la unión al equipo." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", msg: "Error de conexión con el servidor." });
    } finally {
      setJoining(false);
    }
  };

  // Redirigir a crear cuenta nueva en Auth0
  const handleSignupAuth0 = async () => {
    localStorage.setItem("tlamatqui_pending_invite_token", inviteToken);
    await loginWithRedirect({
      authorizationParams: {
        screen_hint: "signup"
      }
    });
  };

  // Redirigir a iniciar sesión en Auth0 si ya tiene cuenta
  const handleLoginAuth0 = async () => {
    localStorage.setItem("tlamatqui_pending_invite_token", inviteToken);
    await loginWithRedirect();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        
        {/* Banner Superior con Destello */}
        <div className="relative p-6 bg-gradient-to-br from-emerald-900/40 via-slate-900 to-indigo-900/30 border-b border-slate-800 overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 block">
                  Invitación Oficial Tlamatqui
                </span>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Colaboración de Equipo
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cuerpo Principal */}
        <div className="p-6 md:p-8 space-y-6">
          {loadingInfo ? (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-9 h-9 text-emerald-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Verificando enlace de invitación y detalles del equipo...</p>
            </div>
          ) : errorInfo ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white mb-1">Enlace no Válido o Expirado</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">{errorInfo}</p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Cerrar Ventana
              </button>
            </div>
          ) : teamInfo ? (
            <>
              {/* Card de Detalles del Equipo */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-inner">
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 shrink-0 flex items-center justify-center">
                    {teamInfo.image ? (
                      <img src={teamInfo.image} alt={teamInfo.name} className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-7 h-7 text-emerald-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Te han invitado a unirte a:</span>
                    <h3 className="text-lg font-extrabold text-white truncate flex items-center gap-1.5 mt-0.5">
                      {teamInfo.name}
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    </h3>
                    <p className="text-xs text-slate-400 truncate mt-1 flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      Líder del Equipo: <strong className="text-slate-200 font-semibold">{teamInfo.ownerName}</strong>
                    </p>
                  </div>
                </div>

                {/* Badge de Rol y Conteo */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Rol Asignado</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                      teamInfo.inviteRole === "Administrador"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                        : teamInfo.inviteRole === "Agente"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30"
                    }`}>
                      <ShieldCheck className="w-3.5 h-3.5" /> {teamInfo.inviteRole}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Miembros del Equipo</span>
                    <span className="text-xs font-extrabold text-white flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> {teamInfo.memberCount} integrantes
                    </span>
                  </div>
                </div>

                {/* Descripción del Rol */}
                <p className="text-xs text-slate-400 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60 leading-relaxed">
                  {teamInfo.inviteRole === "Agente" && (
                    <>Como <strong>Agente comercial</strong>, podrás auditar tiendas de e-commerce, generar diagnósticos y gestionar tus métricas individuales dentro de este equipo.</>
                  )}
                  {teamInfo.inviteRole === "Administrador" && (
                    <>Como <strong>Administrador</strong>, tendrás acceso completo a la gestión de miembros, configuración del equipo y ranking comercial de agentes.</>
                  )}
                  {teamInfo.inviteRole === "Visor" && (
                    <>Como <strong>Visor</strong>, podrás consultar la información y presentaciones de diagnósticos en modo lectura.</>
                  )}
                  {teamInfo.inviteRole === "Superusuario" && (
                    <>Como <strong>Superusuario</strong>, tendrás acceso global e ilimitado a todas las herramientas del sistema.</>
                  )}
                </p>
              </div>

              {/* Mensajes de Feedback */}
              {feedback.msg && (
                <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                  feedback.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                    : "bg-rose-500/10 border-rose-500/40 text-rose-300"
                }`}>
                  {feedback.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span>{feedback.msg}</span>
                </div>
              )}

              {/* Opciones de Acción segun estado de Autenticación */}
              {isAuthenticated && user ? (
                /* CASO 1: USUARIO YA AUTENTICADO */
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img 
                        src={user.picture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"} 
                        alt={user.name} 
                        className="w-8 h-8 rounded-full border border-slate-700 object-cover shrink-0" 
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 block font-semibold">Sesión Activa</span>
                        <p className="text-xs font-bold text-white truncate">{user.name} ({user.email})</p>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => logout()}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Cambiar de cuenta"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={handleJoinAuthenticated}
                    disabled={joining}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl text-xs transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {joining ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Vinculando tu cuenta al equipo...
                      </>
                    ) : (
                      <>
                        Aceptar Invitación y Unirme con mi Cuenta
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* CASO 2: USUARIO NUEVO O NO AUTENTICADO -> REGISTRO AUTH0 */
                <div className="space-y-3 pt-1">
                  <button
                    type="button"
                    onClick={handleSignupAuth0}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl text-xs transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    Aceptar Invitación (Crear Cuenta en Auth0)
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleLoginAuth0}
                    className="w-full py-3 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    ¿Ya tienes una cuenta en Tlamatqui? Iniciar Sesión
                  </button>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
