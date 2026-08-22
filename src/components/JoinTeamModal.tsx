/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Componente Modal Interactivo para Unirse a un Equipo mediante Enlace de Invitación.
 * Despliega información del equipo de trabajo, rol asignado e incorpora al usuario al aceptar.
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
  RefreshCw
} from "lucide-react";
import { useAuth } from "../lib/authContext";
import { Team } from "../types";

interface JoinTeamModalProps {
  /** Token de invitación presente en la URL (?inviteTeam=token) */
  inviteToken: string;
  /** Callback al unirse exitosamente al equipo */
  onJoined: (joinedTeam: Team) => void;
  /** Callback para cerrar/cancelar el modal */
  onClose: () => void;
}

export const JoinTeamModal: React.FC<JoinTeamModalProps> = ({
  inviteToken,
  onJoined,
  onClose
}) => {
  const { user } = useAuth();
  
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

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [joining, setJoining] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | null; msg: string }>({
    type: null,
    msg: ""
  });

  // Pre-llenar nombre y email si el usuario ya inició sesión con Auth0
  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.email) setEmail(user.email);
    }
  }, [user]);

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

  // Procesar solicitud de incorporación
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setFeedback({ type: "error", msg: "Por favor ingresa un correo electrónico válido." });
      return;
    }

    setJoining(true);
    setFeedback({ type: null, msg: "" });

    try {
      const res = await fetch("/api/teams/invite/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: inviteToken,
          name: name.trim() || email.split("@")[0],
          email: email.trim(),
          avatar: user?.picture || undefined
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({ type: "success", msg: data.message });
        setTimeout(() => {
          if (data.team) {
            onJoined(data.team);
          }
          onClose();
        }, 1500);
      } else {
        setFeedback({ type: "error", msg: data.message || "No se pudo completar la unión al equipo." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", msg: "Error de conexión con el servidor." });
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Invitación a Equipo</h3>
              <p className="text-[11px] text-slate-400">Espacio de trabajo compartido en Tlamatqui</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {loadingInfo ? (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Validando enlace de invitación...</p>
            </div>
          ) : errorInfo ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Enlace no Válido</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">{errorInfo}</p>
              </div>
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cerrar Ventana
              </button>
            </div>
          ) : teamInfo ? (
            <>
              {/* Tarjeta de Resumen del Equipo */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5">
                <img
                  src={teamInfo.image || "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=150&q=80"}
                  alt={teamInfo.name}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                    {teamInfo.name}
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  </h4>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    Líder: <span className="text-slate-200 font-medium">{teamInfo.ownerName}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Rol: {teamInfo.inviteRole}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-500" /> {teamInfo.memberCount} miembros
                    </span>
                  </div>
                </div>
              </div>

              {/* Formulario de Confirmación */}
              <form onSubmit={handleJoin} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Tu Nombre Completo
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. Ana Martínez"
                      className="w-full text-xs pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Tu Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu.correo@empresa.com"
                      className="w-full text-xs pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {feedback.msg && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                      feedback.type === "success"
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                        : "bg-rose-500/10 border-rose-500/40 text-rose-300"
                    }`}
                  >
                    {feedback.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    )}
                    <span>{feedback.msg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={joining}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {joining ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Uniéndote al equipo...
                    </>
                  ) : (
                    <>
                      Aceptar Invitación y Unirse al Equipo
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : null}
        </div>

      </div>
    </div>
  );
};
