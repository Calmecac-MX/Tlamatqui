import React, { useState, useEffect } from "react";
import { 
  Activity, Shield, ShieldAlert, Key, Database, Server, Cpu, HardDrive, 
  Lock, Unlock, RefreshCw, Plus, Trash2, Copy, Check, AlertTriangle, 
  Clock, Zap, CheckCircle2, XCircle, ChevronRight, Terminal, Info, AlertCircle, 
  Eye, EyeOff, Crown, Users, UserCheck, Search, Mail, Calendar, FileText, Sparkles, ExternalLink, User
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SystemHealthData, ApiKeyItem, UserAccount, Team, Report } from "../types";

interface SuperAdminDashboardProps {
  isDarkMode: boolean;
  userRole?: string;
  userEmail: string;
}

export default function SuperAdminDashboard({
  isDarkMode,
  userRole,
  userEmail
}: SuperAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"health" | "database" | "users" | "teams" | "apikeys" | "apilock">("health");
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  const [isLoadingHealth, setIsLoadingHealth] = useState<boolean>(true);
  const [isLoadingKeys, setIsLoadingKeys] = useState<boolean>(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);
  const [isLoadingTeams, setIsLoadingTeams] = useState<boolean>(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>(new Date().toLocaleTimeString());

  // Search & Filters
  const [userSearchTerm, setUserSearchTerm] = useState<string>("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [teamSearchTerm, setTeamSearchTerm] = useState<string>("");

  // User Details Modal state
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserAccount | null>(null);
  const [isUpdatingUserRole, setIsUpdatingUserRole] = useState<boolean>(false);
  const [userRoleSuccessMsg, setUserRoleSuccessMsg] = useState<string | null>(null);

  // API Key creation modal state
  const [isCreateKeyOpen, setIsCreateKeyOpen] = useState<boolean>(false);
  const [newKeyName, setNewKeyName] = useState<string>("");
  const [createdRawToken, setCreatedRawToken] = useState<string | null>(null);
  const [isCreatingKey, setIsCreatingKey] = useState<boolean>(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // API Lock master switch state
  const [isApiLocked, setIsApiLocked] = useState<boolean>(false);
  const [lockReason, setLockReason] = useState<string>("Mantenimiento programado de la API REST");
  const [isTogglingLock, setIsTogglingLock] = useState<boolean>(false);
  const [lockSuccessMsg, setLockSuccessMsg] = useState<string | null>(null);

  // Simulated live server logs
  const [logs, setLogs] = useState<Array<{ id: string; time: string; type: "info" | "warn" | "error" | "success"; text: string }>>([
    { id: "1", time: new Date().toLocaleTimeString(), type: "info", text: "Superusuario inició sesión e inspeccionó la consola de salud." },
    { id: "2", time: new Date().toLocaleTimeString(), type: "success", text: "Base de datos respondiendo con latencia óptima (<10ms)." },
    { id: "3", time: new Date().toLocaleTimeString(), type: "info", text: "Motor de auditoría financiera operando sin degradación." }
  ]);

  // Fetch Health metrics
  const fetchHealth = async () => {
    setIsLoadingHealth(true);
    try {
      const res = await fetch("/api/superadmin/health", {
        headers: { "x-user-role": userRole || "Superusuario" }
      });
      if (res.ok) {
        const data: SystemHealthData = await res.json();
        setHealthData(data);
        setIsApiLocked(data.serverInfo.apiLocked);
        if (data.serverInfo.lockReason) {
          setLockReason(data.serverInfo.lockReason);
        }
        setErrorMsg(null);
      } else {
        const err = await res.json();
        setErrorMsg(err.message || "Error al obtener diagnóstico de salud.");
      }
    } catch (e) {
      setErrorMsg("No se pudo conectar con el servidor de salud.");
    } finally {
      setIsLoadingHealth(false);
      setLastRefreshedAt(new Date().toLocaleTimeString());
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch("/api/users", {
        headers: { "x-user-role": userRole || "Superusuario" }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error("Error al obtener usuarios del sistema:", e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Fetch Teams
  const fetchTeams = async () => {
    setIsLoadingTeams(true);
    try {
      const res = await fetch("/api/teams");
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
      }
    } catch (e) {
      console.error("Error al obtener equipos:", e);
    } finally {
      setIsLoadingTeams(false);
    }
  };

  // Fetch Reports
  const fetchReports = async () => {
    try {
      const res = await fetch("/api/reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (e) {
      console.error("Error al obtener reportes:", e);
    }
  };

  // Fetch API Keys
  const fetchApiKeys = async () => {
    setIsLoadingKeys(true);
    try {
      const res = await fetch("/api/superadmin/api-keys", {
        headers: { "x-user-role": userRole || "Superusuario" }
      });
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data);
      }
    } catch (e) {
      console.error("Error al obtener API Keys:", e);
    } finally {
      setIsLoadingKeys(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchUsers();
    fetchTeams();
    fetchReports();
    fetchApiKeys();
  }, []);

  // Auto-refresh interval (every 10s if active)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchHealth();
      fetchUsers();
      fetchTeams();
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Handle Update User Role
  const handleUpdateUserRole = async (targetUserId: string, newRole: "Superusuario" | "Administrador" | "Editor" | "Visor") => {
    setIsUpdatingUserRole(true);
    try {
      const res = await fetch(`/api/users/${targetUserId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": userRole || "Superusuario"
        },
        body: JSON.stringify({ role: newRole })
      });

      if (res.ok) {
        const data = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === targetUserId ? { ...u, role: newRole } : u)));
        if (selectedUserDetail && selectedUserDetail.id === targetUserId) {
          setSelectedUserDetail({ ...selectedUserDetail, role: newRole });
        }
        setUserRoleSuccessMsg(`¡Rol actualizado a '${newRole}' con éxito!`);
        setTimeout(() => setUserRoleSuccessMsg(null), 4000);

        setLogs((prev) => [
          { id: Date.now().toString(), time: new Date().toLocaleTimeString(), type: "success", text: `Rol de usuario ${targetUserId} cambiado a '${newRole}'` },
          ...prev.slice(0, 15)
        ]);
      } else {
        const err = await res.json();
        alert(err.message || "Error al actualizar el rol del usuario.");
      }
    } catch (e) {
      alert("No se pudo conectar con el servidor.");
    } finally {
      setIsUpdatingUserRole(false);
    }
  };

  // Handle Create API Key
  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setIsCreatingKey(true);

    try {
      const res = await fetch("/api/superadmin/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": userRole || "Superusuario"
        },
        body: JSON.stringify({
          name: newKeyName,
          createdByName: userEmail
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCreatedRawToken(data.rawToken);
        setApiKeys((prev) => [data.apiKey, ...prev]);
        setNewKeyName("");
        
        setLogs((prev) => [
          { id: Date.now().toString(), time: new Date().toLocaleTimeString(), type: "success", text: `Nueva API Key creada: '${data.apiKey.name}'` },
          ...prev.slice(0, 15)
        ]);
      } else {
        alert("Error al generar la API Key.");
      }
    } catch (e) {
      alert("No se pudo conectar con el servidor.");
    } finally {
      setIsCreatingKey(false);
    }
  };

  // Handle Revoke API Key
  const handleDeleteKey = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de revocar la API Key '${name}'?`)) return;

    try {
      const res = await fetch(`/api/superadmin/api-keys/${id}`, {
        method: "DELETE",
        headers: { "x-user-role": userRole || "Superusuario" }
      });
      if (res.ok) {
        setApiKeys((prev) => prev.filter((k) => k.id !== id));
        setLogs((prev) => [
          { id: Date.now().toString(), time: new Date().toLocaleTimeString(), type: "warn", text: `API Key revocada: '${name}'` },
          ...prev.slice(0, 15)
        ]);
      }
    } catch (e) {
      alert("Error al revocar la API Key.");
    }
  };

  // Handle Toggle Master API Lock
  const handleToggleApiLock = async (newLockState: boolean) => {
    setIsTogglingLock(true);
    try {
      const res = await fetch("/api/superadmin/toggle-api-lock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": userRole || "Superusuario"
        },
        body: JSON.stringify({
          apiLocked: newLockState,
          lockReason
        })
      });

      if (res.ok) {
        const data = await res.json();
        setIsApiLocked(data.apiLocked);
        setLockSuccessMsg(newLockState ? "🔒 API bloqueada exitosamente. Las llamadas no autorizadas devolverán HTTP 503." : "🟢 API desbloqueada. Acceso normal restablecido.");
        setTimeout(() => setLockSuccessMsg(null), 5000);

        setLogs((prev) => [
          { 
            id: Date.now().toString(), 
            time: new Date().toLocaleTimeString(), 
            type: newLockState ? "error" : "success", 
            text: newLockState ? `ACCESO A API BLOQUEADO: ${lockReason}` : "ACCESO A API DESBLOQUEADO Y ABIERTO" 
          },
          ...prev.slice(0, 15)
        ]);
      } else {
        alert("Error al modificar el estado de bloqueo de la API.");
      }
    } catch (e) {
      alert("No se pudo conectar con el servidor.");
    } finally {
      setIsTogglingLock(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 3000);
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${days > 0 ? `${days}d ` : ""}${hours}h ${mins}m ${secs}s`;
  };

  // Filtered lists
  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || u.email.toLowerCase().includes(userSearchTerm.toLowerCase());
    const matchesRole = userRoleFilter === "all" || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredTeams = teams.filter((t) => {
    return t.name.toLowerCase().includes(teamSearchTerm.toLowerCase()) || t.ownerEmail.toLowerCase().includes(teamSearchTerm.toLowerCase());
  });

  return (
    <div className="space-y-8 animate-fade-in relative pb-12">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-surface-theme backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-sm">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                Panel Exclusivo de Superusuario
              </span>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5 ${
                isApiLocked
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                  : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
              }`}>
                <span className={`w-2 h-2 rounded-full ${isApiLocked ? "bg-rose-400" : "bg-emerald-400"}`}></span>
                {isApiLocked ? "API REST Bloqueada" : "API Activa y Saludable"}
              </span>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              Centro de Control Global Superusuario
            </h2>
            <p className="text-xs md:text-sm text-text-dim-theme max-w-2xl">
              Inspecciona todos los usuarios registrados, consulta sus detalles completos, administra equipos de trabajo, evalúa la infraestructura en tiempo real y controla el acceso a la API REST.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                fetchHealth();
                fetchUsers();
                fetchTeams();
              }}
              disabled={isLoadingHealth}
              className="px-4 py-2.5 rounded-xl border border-border-theme bg-surface-theme/80 hover:bg-surface-hover-theme text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-amber-400 ${isLoadingHealth ? "animate-spin" : ""}`} />
              Refrescar ({lastRefreshedAt})
            </button>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                autoRefresh
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-surface-theme text-text-dim-theme border-border-theme"
              }`}
              title="Auto-refresco cada 10s"
            >
              <Zap className="w-3.5 h-3.5" />
              {autoRefresh ? "Auto" : "Pausado"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border-theme/40">
        <button
          onClick={() => setActiveTab("health")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "health"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/10"
              : "text-text-dim-theme hover:text-white hover:bg-surface-hover-theme"
          }`}
        >
          <Activity className="w-4 h-4 text-amber-400" />
          <span>Salud y Servidor</span>
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "users"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/10"
              : "text-text-dim-theme hover:text-white hover:bg-surface-hover-theme"
          }`}
        >
          <UserCheck className="w-4 h-4 text-emerald-400" />
          <span>Usuarios del Sistema ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("teams")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "teams"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/10"
              : "text-text-dim-theme hover:text-white hover:bg-surface-hover-theme"
          }`}
        >
          <Users className="w-4 h-4 text-cyan-400" />
          <span>Equipos ({teams.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("database")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "database"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/10"
              : "text-text-dim-theme hover:text-white hover:bg-surface-hover-theme"
          }`}
        >
          <Database className="w-4 h-4 text-purple-400" />
          <span>Base de Datos</span>
        </button>

        <button
          onClick={() => setActiveTab("apikeys")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "apikeys"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-lg shadow-amber-500/10"
              : "text-text-dim-theme hover:text-white hover:bg-surface-hover-theme"
          }`}
        >
          <Key className="w-4 h-4 text-amber-400" />
          <span>API Keys ({apiKeys.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("apilock")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "apilock"
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-lg shadow-rose-500/10"
              : "text-text-dim-theme hover:text-white hover:bg-surface-hover-theme"
          }`}
        >
          <Lock className="w-4 h-4 text-rose-400" />
          <span>Bloqueo Maestro de API</span>
        </button>
      </div>

      {/* Alert Notifications */}
      {lockSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{lockSuccessMsg}</span>
          </div>
          <button onClick={() => setLockSuccessMsg(null)} className="text-emerald-400 hover:text-white text-xs cursor-pointer">✕</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ================= TAB 1: SALUD Y SERVIDOR ================= */}
      {activeTab === "health" && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl border border-border-theme bg-surface-theme/60 backdrop-blur-md space-y-3 shadow-lg">
              <div className="flex items-center justify-between text-text-dim-theme">
                <span className="text-xs font-bold uppercase tracking-wider">Estado Global</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white uppercase">
                  {healthData?.status || "HEALTHY"}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  100% OK
                </span>
              </div>
              <p className="text-[11px] text-text-dim-theme">Infraestructura operando sin latencia anómala.</p>
            </div>

            <div className="p-5 rounded-2xl border border-border-theme bg-surface-theme/60 backdrop-blur-md space-y-3 shadow-lg">
              <div className="flex items-center justify-between text-text-dim-theme">
                <span className="text-xs font-bold uppercase tracking-wider">Tiempo de Actividad (Uptime)</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {healthData ? formatUptime(healthData.uptimeSeconds) : "0h 0m 0s"}
              </div>
              <p className="text-[11px] text-text-dim-theme">Tiempo activo desde la última inicialización.</p>
            </div>

            <div className="p-5 rounded-2xl border border-border-theme bg-surface-theme/60 backdrop-blur-md space-y-3 shadow-lg">
              <div className="flex items-center justify-between text-text-dim-theme">
                <span className="text-xs font-bold uppercase tracking-wider">Memoria Usada (RSS)</span>
                <HardDrive className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white font-mono">
                  {healthData?.memoryUsage.rssMB || 0} MB
                </span>
                <span className="text-xs text-text-dim-theme">/ Heap {healthData?.memoryUsage.heapUsedMB || 0} MB</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-cyan-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, ((healthData?.memoryUsage.rssMB || 10) / 512) * 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-border-theme bg-surface-theme/60 backdrop-blur-md space-y-3 shadow-lg">
              <div className="flex items-center justify-between text-text-dim-theme">
                <span className="text-xs font-bold uppercase tracking-wider">Entorno Servidor</span>
                <Server className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-xl font-bold text-white truncate">
                Node {healthData?.serverInfo.nodeVersion || "v24.x"}
              </div>
              <p className="text-[11px] text-text-dim-theme capitalize">
                Plataforma: {healthData?.serverInfo.platform || "Darwin / Linux"}
              </p>
            </div>
          </div>

          {/* Console Stream Logs */}
          <div className="p-6 rounded-2xl border border-border-theme bg-slate-950/90 backdrop-blur-md space-y-4 shadow-2xl font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Consola de Eventos y Monitoreo del Servidor</h3>
              </div>
              <span className="text-[10px] text-slate-400">Stream de Auditoría en Vivo</span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto text-xs pr-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 py-1 border-b border-slate-900/60 last:border-0">
                  <span className="text-slate-500 font-semibold shrink-0">[{log.time}]</span>
                  <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] uppercase shrink-0 ${
                    log.type === "success" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                    log.type === "warn" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                    log.type === "error" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" :
                    "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  }`}>
                    {log.type}
                  </span>
                  <span className="text-slate-300 font-medium break-all">{log.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: USUARIOS DEL SISTEMA Y DETALLES ================= */}
      {activeTab === "users" && (
        <div className="space-y-6 animate-fade-in">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-border-theme bg-surface-theme/60 backdrop-blur-md shadow-xl">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-dim-theme" />
                <input
                  type="text"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  placeholder="Buscar usuario por nombre o correo..."
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border outline-none focus:ring-1 focus:ring-amber-400 bg-bg-theme border-border-theme text-white"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl bg-bg-theme border border-border-theme text-white outline-none cursor-pointer"
              >
                <option value="all">Todos los Roles</option>
                <option value="Superusuario">Superusuario</option>
                <option value="Administrador">Administrador</option>
                <option value="Editor">Editor</option>
                <option value="Visor">Visor</option>
              </select>
            </div>

            <span className="text-xs text-text-dim-theme font-semibold">
              Mostrando <span className="text-white font-bold">{filteredUsers.length}</span> de <span className="text-white font-bold">{users.length}</span> usuarios
            </span>
          </div>

          {/* Users Table */}
          <div className="rounded-2xl border border-border-theme bg-surface-theme/40 overflow-hidden shadow-xl">
            {isLoadingUsers ? (
              <div className="p-12 text-center text-xs text-text-dim-theme">Cargando usuarios...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-xs text-text-dim-theme">No se encontraron usuarios con el filtro especificado.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-bg-theme/80 border-b border-border-theme/40 text-text-dim-theme uppercase tracking-wider text-[10px] font-bold">
                    <tr>
                      <th className="px-5 py-3.5">Usuario</th>
                      <th className="px-5 py-3.5">Correo Electrónico</th>
                      <th className="px-5 py-3.5">Rol de Permisos</th>
                      <th className="px-5 py-3.5">Proveedor Auth</th>
                      <th className="px-5 py-3.5">Fecha Registro</th>
                      <th className="px-5 py-3.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-theme/20">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-surface-hover-theme transition-colors">
                        <td className="px-5 py-4 font-bold text-white">
                          <div className="flex items-center gap-3">
                            <img
                              src={user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"}
                              alt={user.name}
                              className="w-8 h-8 rounded-full border border-border-theme object-cover shrink-0"
                            />
                            <span>{user.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-text-dim-theme font-medium">{user.email}</td>
                        <td className="px-5 py-4">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border leading-none ${
                            user.role === "Superusuario"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              : user.role === "Administrador"
                              ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                              : user.role === "Editor"
                              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                              : "bg-slate-500/20 text-slate-300 border-slate-500/40"
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-text-dim-theme font-mono text-[11px]">
                          {user.sub ? (user.sub.includes("google") ? "Google Auth0" : "Auth0 DB") : "Local Bridge"}
                        </td>
                        <td className="px-5 py-4 text-text-dim-theme">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setSelectedUserDetail(user)}
                            className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-[11px] cursor-pointer transition-all flex items-center gap-1.5 ml-auto"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Ver Detalles
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 3: EQUIPOS DEL SISTEMA ================= */}
      {activeTab === "teams" && (
        <div className="space-y-6 animate-fade-in">
          {/* Search Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-border-theme bg-surface-theme/60 backdrop-blur-md shadow-xl">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-dim-theme" />
              <input
                type="text"
                value={teamSearchTerm}
                onChange={(e) => setTeamSearchTerm(e.target.value)}
                placeholder="Buscar equipo por nombre o correo del líder..."
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border outline-none focus:ring-1 focus:ring-amber-400 bg-bg-theme border-border-theme text-white"
              />
            </div>

            <span className="text-xs text-text-dim-theme font-semibold">
              Total de Equipos: <span className="text-white font-bold">{filteredTeams.length}</span>
            </span>
          </div>

          {/* Teams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map((team) => {
              const teamReportsCount = reports.filter((r) => r.teamId === team.id).length;
              return (
                <div key={team.id} className="p-6 rounded-2xl border border-border-theme bg-surface-theme/40 relative flex flex-col justify-between gap-5 shadow-xl hover:border-amber-500/40 transition-all">
                  <div className="flex items-start gap-4">
                    <img
                      src={team.image || "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=150&q=80"}
                      alt={team.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-border-theme shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-black text-white truncate">{team.name}</h4>
                      <p className="text-xs text-text-dim-theme truncate mt-0.5">
                        Líder: <span className="text-white font-semibold">{team.ownerName}</span>
                      </p>
                      <p className="text-[11px] text-text-dim-theme truncate">{team.ownerEmail}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-theme/30 text-center">
                    <div className="p-2 rounded-xl bg-bg-theme/60 border border-border-theme/40">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-dim-theme block">Miembros</span>
                      <span className="text-base font-black text-amber-300">{team.members.length}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-bg-theme/60 border border-border-theme/40">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-dim-theme block">Reportes</span>
                      <span className="text-base font-black text-cyan-300">{teamReportsCount}</span>
                    </div>
                  </div>

                  {/* Members badges */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-dim-theme block">Integrantes:</span>
                    <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                      {team.members.map((m) => (
                        <span key={m.id} className="text-[10px] font-medium px-2 py-0.5 rounded bg-surface-hover-theme text-slate-300 border border-border-theme/40" title={`${m.email} (${m.role})`}>
                          {m.name} ({m.role})
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Copy Invite Token */}
                  {team.inviteToken && (
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/?inviteTeam=${team.inviteToken}`;
                        copyToClipboard(url, `team_${team.id}`);
                      }}
                      className="w-full py-2 rounded-xl bg-bg-theme hover:bg-surface-hover-theme text-text-dim-theme hover:text-white text-xs font-bold border border-border-theme transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {copiedKeyId === `team_${team.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                      {copiedKeyId === `team_${team.id}` ? "¡Enlace Copiado!" : "Copiar Enlace Invitación"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 4: BASE DE DATOS ================= */}
      {activeTab === "database" && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 md:p-8 rounded-2xl border border-border-theme bg-surface-theme/60 backdrop-blur-md space-y-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-theme/40 pb-5">
              <div className="flex items-center gap-3.5">
                <div className={`p-3 rounded-2xl border ${
                  healthData?.database.status === "connected"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                }`}>
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    Motor de Almacenamiento: {healthData?.database.provider}
                  </h3>
                  <p className="text-xs text-text-dim-theme">
                    {healthData?.database.status === "connected"
                      ? "Conexión a PostgreSQL (Prisma ORM 7) verificada y respondiendo adecuadamente."
                      : "Almacenamiento en puente JSON con cifrado transparente en reposo."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-semibold text-text-dim-theme">Ping Latencia:</span>
                <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
                  {healthData?.database.latencyMs} ms
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-border-theme/50 bg-bg-theme/60 text-center space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-dim-theme">Reportes Auditados</span>
                <div className="text-3xl font-black text-amber-400 font-mono">
                  {healthData?.database.counts.reports || 0}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border-theme/50 bg-bg-theme/60 text-center space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-dim-theme">Equipos Registrados</span>
                <div className="text-3xl font-black text-cyan-400 font-mono">
                  {healthData?.database.counts.teams || 0}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border-theme/50 bg-bg-theme/60 text-center space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-dim-theme">Usuarios Totales</span>
                <div className="text-3xl font-black text-emerald-400 font-mono">
                  {healthData?.database.counts.users || 0}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border-theme/50 bg-bg-theme/60 text-center space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-dim-theme">Plantillas</span>
                <div className="text-3xl font-black text-purple-400 font-mono">
                  {healthData?.database.counts.templates || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 5: GESTIÓN DE API KEYS ================= */}
      {activeTab === "apikeys" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border border-border-theme bg-surface-theme/60 backdrop-blur-md shadow-xl">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                Llaves de API Programáticas (API Keys)
              </h3>
              <p className="text-xs text-text-dim-theme mt-1">
                Genera tokens autenticados para integraciones externas, scripts automatizados o aplicaciones cliente de terceros.
              </p>
            </div>

            <button
              onClick={() => {
                setIsCreateKeyOpen(true);
                setCreatedRawToken(null);
              }}
              className="px-4 py-2.5 rounded-xl bg-accent-theme hover:bg-accent-theme/90 text-white text-xs font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              Generar Nueva API Key
            </button>
          </div>

          <div className="rounded-2xl border border-border-theme bg-surface-theme/40 overflow-hidden shadow-xl">
            {isLoadingKeys ? (
              <div className="p-12 text-center text-xs text-text-dim-theme">Cargando API Keys...</div>
            ) : apiKeys.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Key className="w-8 h-8 text-amber-400/50 mx-auto" />
                <p className="text-xs text-text-dim-theme font-medium">No se han generado llaves de API aún.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-bg-theme/80 border-b border-border-theme/40 text-text-dim-theme uppercase tracking-wider text-[10px] font-bold">
                    <tr>
                      <th className="px-5 py-3.5">Nombre / Aplicación</th>
                      <th className="px-5 py-3.5">Token Enmascarado</th>
                      <th className="px-5 py-3.5">Creador</th>
                      <th className="px-5 py-3.5">Fecha Creación</th>
                      <th className="px-5 py-3.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-theme/20">
                    {apiKeys.map((key) => (
                      <tr key={key.id} className="hover:bg-surface-hover-theme transition-colors">
                        <td className="px-5 py-4 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            {key.name}
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono text-amber-300">{key.maskedKey}</td>
                        <td className="px-5 py-4 text-text-dim-theme">{key.createdByName || "Superusuario"}</td>
                        <td className="px-5 py-4 text-text-dim-theme">
                          {new Date(key.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleDeleteKey(key.id, key.name)}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1.5 ml-auto"
                            title="Revocar API Key"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Revocar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 6: BLOQUEO MAESTRO DE API ================= */}
      {activeTab === "apilock" && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 md:p-8 rounded-3xl border border-rose-500/30 bg-gradient-to-br from-rose-950/30 via-slate-900/90 to-surface-theme backdrop-blur-xl space-y-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-rose-500/20 pb-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-rose-400" />
                  <h3 className="text-xl font-black text-white">Control Maestro de Acceso a la API REST</h3>
                </div>
                <p className="text-xs text-text-dim-theme max-w-xl">
                  Permite bloquear o liberar de inmediato el tráfico de solicitudes dirigidas a la API REST. Al activar el bloqueo, únicamente las solicitudes enviadas por cuentas de <span className="text-amber-300 font-bold">Superusuario</span> seguirán respondiendo.
                </p>
              </div>

              <div className="shrink-0">
                <span className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border flex items-center gap-2 ${
                  isApiLocked
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                }`}>
                  {isApiLocked ? <Lock className="w-4 h-4 text-rose-400" /> : <Unlock className="w-4 h-4 text-emerald-400" />}
                  {isApiLocked ? "BLOQUEADO (MANTENIMIENTO)" : "DESBLOQUEADO (OPERATIVO)"}
                </span>
              </div>
            </div>

            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-dim-theme mb-2">
                  Motivo de Mantenimiento / Mensaje de Bloqueo
                </label>
                <input
                  type="text"
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  placeholder="Ej. Mantenimiento programado de la API REST..."
                  className="w-full text-xs px-4 py-3 rounded-xl border outline-none focus:ring-1 focus:ring-rose-500 bg-bg-theme border-border-theme text-white"
                />
              </div>

              <div className="pt-2 flex items-center gap-4">
                {isApiLocked ? (
                  <button
                    onClick={() => handleToggleApiLock(false)}
                    disabled={isTogglingLock}
                    className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Unlock className="w-4 h-4" />
                    {isTogglingLock ? "Procesando..." : "Desbloquear Acceso a la API"}
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleApiLock(true)}
                    disabled={isTogglingLock}
                    className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
                    {isTogglingLock ? "Procesando..." : "Activar Bloqueo de API"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DETALLES DEL USUARIO ================= */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-theme border border-border-theme rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl animate-fade-in relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-theme/40 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-400" />
                Detalles del Usuario
              </h3>
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="text-text-dim-theme hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {userRoleSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{userRoleSuccessMsg}</span>
              </div>
            )}

            {/* Profile Avatar Header */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-bg-theme/60 border border-border-theme/40">
              <img
                src={selectedUserDetail.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"}
                alt={selectedUserDetail.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-amber-400 shrink-0"
              />
              <div className="space-y-1 min-w-0 flex-1">
                <h4 className="text-base font-black text-white truncate">{selectedUserDetail.name}</h4>
                <p className="text-xs text-text-dim-theme truncate">{selectedUserDetail.email}</p>
                <div className="flex items-center gap-2 pt-1">
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border leading-none ${
                    selectedUserDetail.role === "Superusuario"
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                  }`}>
                    {selectedUserDetail.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Change Role Section */}
            <div className="space-y-2 p-4 rounded-xl bg-surface-hover-theme/40 border border-border-theme/30">
              <label className="block text-xs font-bold text-white uppercase tracking-wider">
                Cambiar Rol de Usuario (Gestión Superusuario)
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedUserDetail.role}
                  onChange={(e) => handleUpdateUserRole(selectedUserDetail.id, e.target.value as any)}
                  disabled={isUpdatingUserRole}
                  className="flex-1 text-xs px-3 py-2 rounded-xl bg-bg-theme border border-border-theme text-white outline-none cursor-pointer"
                >
                  <option value="Superusuario">Superusuario (Acceso Total)</option>
                  <option value="Administrador">Administrador</option>
                  <option value="Editor">Editor</option>
                  <option value="Visor">Visor</option>
                </select>
              </div>
            </div>

            {/* User Metadata Fields */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-bg-theme/40 border border-border-theme/30 space-y-0.5">
                <span className="text-[10px] font-bold text-text-dim-theme uppercase block">ID de Usuario</span>
                <span className="font-mono text-white text-[11px] break-all">{selectedUserDetail.id}</span>
              </div>

              <div className="p-3 rounded-xl bg-bg-theme/40 border border-border-theme/30 space-y-0.5">
                <span className="text-[10px] font-bold text-text-dim-theme uppercase block">Proveedor Auth0</span>
                <span className="font-mono text-amber-300 text-[11px] break-all">
                  {selectedUserDetail.sub || "Sin Sub ID (Local)"}
                </span>
              </div>
            </div>

            {/* Equipos Pertenecientes */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                Equipos Asociados
              </h5>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {teams.filter(t => t.ownerEmail === selectedUserDetail.email || t.members.some(m => m.email === selectedUserDetail.email)).length === 0 ? (
                  <p className="text-xs text-text-dim-theme italic">No pertenece a ningún equipo aún.</p>
                ) : (
                  teams
                    .filter(t => t.ownerEmail === selectedUserDetail.email || t.members.some(m => m.email === selectedUserDetail.email))
                    .map(t => (
                      <div key={t.id} className="p-2.5 rounded-lg bg-bg-theme/60 border border-border-theme/40 flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{t.name}</span>
                        <span className="text-[10px] text-text-dim-theme">
                          {t.ownerEmail === selectedUserDetail.email ? "Propietario" : "Miembro"}
                        </span>
                      </div>
                    ))
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedUserDetail(null)}
              className="w-full py-2.5 rounded-xl bg-surface-hover-theme text-white text-xs font-bold cursor-pointer"
            >
              Cerrar Detalles
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL CREACIÓN API KEY ================= */}
      {isCreateKeyOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-theme border border-border-theme rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-fade-in relative">
            <div className="flex items-center justify-between border-b border-border-theme/40 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                {createdRawToken ? "API Key Creada Exitosamente" : "Generar Nueva API Key"}
              </h3>
              <button
                onClick={() => {
                  setIsCreateKeyOpen(false);
                  setCreatedRawToken(null);
                }}
                className="text-text-dim-theme hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {createdRawToken ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    ¡Copia esta clave de API ahora! Por motivos de seguridad, no volverá a mostrarse completa.
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dim-theme">Token Secreto de API</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={createdRawToken}
                      className="w-full text-xs px-3 py-2 rounded-lg bg-bg-theme border border-border-theme text-amber-300 font-mono select-all outline-none"
                    />
                    <button
                      onClick={() => copyToClipboard(createdRawToken, "modal_key")}
                      className="px-3 py-2 rounded-lg bg-accent-theme hover:bg-accent-theme/90 text-white text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1.5"
                    >
                      {copiedKeyId === "modal_key" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKeyId === "modal_key" ? "Copiado" : "Copiar"}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsCreateKeyOpen(false);
                    setCreatedRawToken(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-surface-hover-theme text-white text-xs font-bold cursor-pointer"
                >
                  Entendido y Entregado
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateApiKey} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-dim-theme mb-1.5">
                    Nombre o Nombre del Cliente / Aplicación *
                  </label>
                  <input
                    type="text"
                    required
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Ej. Integración Shopify Webhook / App Externa"
                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border outline-none focus:ring-1 focus:ring-amber-400 bg-bg-theme border-border-theme text-white"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateKeyOpen(false)}
                    className="px-4 py-2 rounded-lg border border-border-theme text-xs font-bold text-text-dim-theme hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingKey}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg cursor-pointer disabled:opacity-50"
                  >
                    {isCreatingKey ? "Generando..." : "Generar Token"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
