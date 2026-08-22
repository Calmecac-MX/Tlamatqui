import React, { useState, useEffect } from "react";
import { 
  Users, Settings, Shield, Plus, Trash2, Edit, UploadCloud, 
  Mail, Clock, FileText, DollarSign, Crown, CheckCircle, X, ChevronRight, User, AlertTriangle, Copy, Link as LinkIcon, RefreshCw, Check, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Team, TeamMember, Report } from "../types";

/**
 * Propiedades del componente TeamDashboard.
 */
interface TeamDashboardProps {
  /** Equipo de trabajo activo a administrar */
  activeTeam: Team | null;
  /** Función para guardar cambios en el equipo */
  onUpdateTeam: (updatedTeam: Team) => Promise<void>;
  /** Función para eliminar un equipo */
  onDeleteTeam: (teamId: string) => Promise<void>;
  /** Arreglo global de reportes de diagnóstico */
  reports: Report[];
  /** Estado del tema activo (Dark/Light mode) */
  isDarkMode: boolean;
  /** Correo del usuario autenticado actual */
  currentUserEmail: string;
  /** Rol del usuario autenticado actual (Superusuario, Administrador, etc.) */
  currentUserRole?: string;
  /** Subpestaña activa controlada desde el componente padre */
  subTab?: "dashboard" | "members" | "settings" | "partners";
  /** Función para notificar el cambio de subpestaña */
  onSubTabChange?: (tab: "dashboard" | "members" | "settings" | "partners") => void;
}

/**
 * Módulo de Gestión de Espacios de Trabajo y Equipos.
 * Permite administrar miembros de la agencia, asignar roles (Administrador, Editor, Visor),
 * consultar estadísticas por equipo y gestionar la marca del socio consultor estratégico.
 */
export default function TeamDashboard({
  activeTeam,
  onUpdateTeam,
  onDeleteTeam,
  reports,
  isDarkMode,
  currentUserEmail,
  currentUserRole,
  subTab: controlledSubTab,
  onSubTabChange
}: TeamDashboardProps) {
  const [localSubTab, setLocalSubTab] = useState<"dashboard" | "members" | "settings" | "partners">("dashboard");
  const subTab = controlledSubTab !== undefined ? controlledSubTab : localSubTab;
  const setSubTab = (tab: "dashboard" | "members" | "settings" | "partners") => {
    if (onSubTabChange) {
      onSubTabChange(tab);
    } else {
      setLocalSubTab(tab);
    }
  };
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isEditingMember, setIsEditingMember] = useState<TeamMember | null>(null);

  // New Member Form State
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"Administrador" | "Editor" | "Visor">("Visor");
  const [newMemberAvatar, setNewMemberAvatar] = useState("");
  const [memberError, setMemberError] = useState<string | null>(null);

  // Config Form State
  const [teamName, setTeamName] = useState("");
  const [teamImage, setTeamImage] = useState("");
  const [teamOwnerName, setTeamOwnerName] = useState("");
  const [teamOwnerEmail, setTeamOwnerEmail] = useState("");
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  // Partner / Socio State
  const [partnerData, setPartnerData] = useState<any>(null);
  const [loadingPartner, setLoadingPartner] = useState(false);
  const [isSavingPartner, setIsSavingPartner] = useState(false);
  const [partnerMessage, setPartnerMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Partner fields
  const [partnerName, setPartnerName] = useState("");
  const [partnerLogo, setPartnerLogo] = useState("");
  const [partnerDesc, setPartnerDesc] = useState("");
  const [partnerLink, setPartnerLink] = useState("");

  // Partner member inputs
  const [newPartnerMemberName, setNewPartnerMemberName] = useState("");
  const [newPartnerMemberEmail, setNewPartnerMemberEmail] = useState("");
  const [newPartnerMemberRole, setNewPartnerMemberRole] = useState<"Lector" | "Lector y Comentarista">("Lector");

  // Invite by Email Modal State
  const [isInviteEmailModalOpen, setIsInviteEmailModalOpen] = useState(false);
  const [sendInviteEmail, setSendInviteEmail] = useState("");
  const [sendInviteName, setSendInviteName] = useState("");
  const [sendInviteRole, setSendInviteRole] = useState<"Superusuario" | "Administrador" | "Editor" | "Visor">("Visor");
  const [sendInviteNote, setSendInviteNote] = useState("");
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [sendEmailOnAddMember, setSendEmailOnAddMember] = useState(true);


  useEffect(() => {
    if (subTab === "partners") {
      setLoadingPartner(true);
      setPartnerMessage(null);
      fetch("/api/partner")
        .then(res => res.json())
        .then(data => {
          setPartnerData(data);
          setPartnerName(data.name || "");
          setPartnerLogo(data.logo || "");
          setPartnerDesc(data.description || "");
          setPartnerLink(data.link || "");
          setLoadingPartner(false);
        })
        .catch(err => {
          console.error("Error fetching partner details:", err);
          setLoadingPartner(false);
        });
    }
  }, [subTab]);

  const handleSavePartner = async (updatedMembers?: any[]) => {
    setIsSavingPartner(true);
    setPartnerMessage(null);

    const payload = {
      name: partnerName,
      logo: partnerLogo,
      description: partnerDesc,
      link: partnerLink,
      members: updatedMembers || (partnerData?.members || [])
    };

    try {
      const res = await fetch("/api/partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("No se pudo guardar la configuración");
      const data = await res.json();
      setPartnerData(data);
      setPartnerMessage({ type: "success", text: "¡Branding y socios actualizados con éxito!" });
    } catch (err: any) {
      setPartnerMessage({ type: "error", text: err.message || "Error al guardar socio" });
    } finally {
      setIsSavingPartner(false);
    }
  };

  const handleAddPartnerMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerMemberName.trim() || !newPartnerMemberEmail.trim()) {
      setPartnerMessage({ type: "error", text: "El nombre y correo son obligatorios" });
      return;
    }

    const currentMembers = partnerData?.members || [];
    if (currentMembers.some((m: any) => m.email.toLowerCase() === newPartnerMemberEmail.trim().toLowerCase())) {
      setPartnerMessage({ type: "error", text: "Este miembro ya existe en el equipo de socios" });
      return;
    }

    const newMember = {
      id: "part-memb-" + Math.random().toString(36).substring(2, 11),
      name: newPartnerMemberName.trim(),
      email: newPartnerMemberEmail.trim().toLowerCase(),
      role: newPartnerMemberRole
    };

    const nextMembers = [...currentMembers, newMember];
    setNewPartnerMemberName("");
    setNewPartnerMemberEmail("");
    setNewPartnerMemberRole("Lector");
    
    // Save directly
    handleSavePartner(nextMembers);
  };

  const handleDeletePartnerMember = (memberId: string) => {
    if (!confirm("¿Deseas eliminar este miembro del equipo de socios?")) return;
    const currentMembers = partnerData?.members || [];
    const nextMembers = currentMembers.filter((m: any) => m.id !== memberId);
    handleSavePartner(nextMembers);
  };

  // Sync config inputs when active team changes
  useEffect(() => {
    if (activeTeam) {
      setTeamName(activeTeam.name);
      setTeamImage(activeTeam.image || "");
      setTeamOwnerName(activeTeam.ownerName || "");
      setTeamOwnerEmail(activeTeam.ownerEmail || "");
    }
  }, [activeTeam]);

  if (!activeTeam) {
    return (
      <div className="p-8 text-center rounded-xl border border-dashed border-border-theme bg-surface-theme/50 flex flex-col items-center justify-center gap-4">
        <Users className="w-12 h-12 text-text-dim-theme" />
        <div>
          <h3 className="font-semibold text-lg text-white">Ningún equipo seleccionado</h3>
          <p className="text-sm text-text-dim-theme max-w-sm mx-auto mt-1">
            Por favor selecciona o crea un equipo desde la barra lateral para ver sus detalles.
          </p>
        </div>
      </div>
    );
  }

  // Filter reports belonging to this team
  const teamReports = reports.filter(r => r.teamId === activeTeam.id);

  // Calculate annual savings for team reports
  // Standard average helper for savings based on typical calculations in the app
  const calculateTotalSavings = () => {
    let totalSavings = 0;
    teamReports.forEach(report => {
      // In AdminPanel, savings are computed using the report tools and plan structures.
      // We'll estimate or compute savings based on general report stats.
      // E.g., visitors * GMV * 0.015 as a generic proxy, or we can use the same logic if we want.
      // But we can also look at its properties or default to a reasonable simulated mock if not available.
      const appsCostUSD = report.tools?.reduce((acc, t) => acc + (t.costType === "exact" ? t.costExact : t.costMax), 0) || 0;
      const appsCostMXN = appsCostUSD * 18.50; // default exchange rate
      
      let shopifyPlanCost = 52 * 18.50; // basic standard
      if (report.shopifyPlan === "basic") shopifyPlanCost = 19 * 18.50;
      else if (report.shopifyPlan === "grow") shopifyPlanCost = 52 * 18.50;
      else if (report.shopifyPlan === "advanced") shopifyPlanCost = 299 * 18.50;
      else if (report.shopifyPlan === "plus") shopifyPlanCost = 2000 * 18.50;

      const shopifyTransactionFee = report.gmv * 0.01; // standard average
      const totalShopifyCost = shopifyPlanCost + shopifyTransactionFee + appsCostMXN;

      const tnPlanCost = 349; // standard average plan
      const currentSavings = totalShopifyCost - tnPlanCost;
      totalSavings += currentSavings > 0 ? currentSavings : 0;
    });
    return totalSavings;
  };

  const annualSavings = calculateTotalSavings() * 12;

  // Handle Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) {
      setMemberError("Todos los campos son obligatorios");
      return;
    }

    if (activeTeam.members.some(m => m.email.toLowerCase() === newMemberEmail.toLowerCase())) {
      setMemberError("Este miembro ya se encuentra en el equipo");
      return;
    }

    const newMember: TeamMember = {
      id: "member-" + Math.random().toString(36).substring(2, 11),
      name: newMemberName,
      email: newMemberEmail,
      role: newMemberRole,
      avatar: newMemberAvatar || `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 900000)}?auto=format&fit=crop&w=80&q=80`
    };

    const updatedTeam = {
      ...activeTeam,
      members: [...activeTeam.members, newMember]
    };

    try {
      await onUpdateTeam(updatedTeam);

      // Enviar correo electrónico de invitación si la opción está seleccionada
      if (sendEmailOnAddMember) {
        try {
          await fetch(`/api/teams/${activeTeam.id}/send-invite-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              toEmail: newMemberEmail.trim(),
              recipientName: newMemberName.trim(),
              role: newMemberRole
            })
          });
        } catch (e) {
          console.error("Error enviando correo de invitación:", e);
        }
      }

      setNewMemberName("");
      setNewMemberEmail("");
      setNewMemberRole("Visor");
      setNewMemberAvatar("");
      setIsAddingMember(false);
      setMemberError(null);
    } catch (err) {
      setMemberError("No se pudo agregar al miembro");
    }
  };

  // Handle Send Direct Email Invitation Modal
  const handleSendInviteEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendInviteEmail.trim()) {
      setInviteStatus({ type: "error", message: "El correo electrónico es obligatorio" });
      return;
    }

    setIsSendingInvite(true);
    setInviteStatus(null);

    try {
      const res = await fetch(`/api/teams/${activeTeam.id}/send-invite-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: sendInviteEmail.trim(),
          recipientName: sendInviteName.trim() || undefined,
          role: sendInviteRole,
          customNote: sendInviteNote.trim() || undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo enviar el correo de invitación");
      }

      setInviteStatus({
        type: "success",
        message: `¡Correo de invitación enviado exitosamente a ${sendInviteEmail.trim()}!`
      });

      setSendInviteEmail("");
      setSendInviteName("");
      setSendInviteNote("");
    } catch (err: any) {
      setInviteStatus({
        type: "error",
        message: err.message || "Error al enviar la invitación por correo electrónico."
      });
    } finally {
      setIsSendingInvite(false);
    }
  };


  // Handle Delete Member
  const handleDeleteMember = async (memberId: string) => {
    if (activeTeam.members.length <= 1) {
      alert("El equipo debe tener al menos un miembro.");
      return;
    }
    if (!confirm("¿Estás seguro de que deseas eliminar este miembro de tu equipo?")) return;

    const updatedTeam = {
      ...activeTeam,
      members: activeTeam.members.filter(m => m.id !== memberId)
    };

    try {
      await onUpdateTeam(updatedTeam);
    } catch (err) {
      alert("No se pudo eliminar al miembro.");
    }
  };

  // Handle Edit Member Role
  const handleSaveMemberRole = async (memberId: string, role: "Superusuario" | "Administrador" | "Editor" | "Visor") => {
    const updatedTeam = {
      ...activeTeam,
      members: activeTeam.members.map(m => m.id === memberId ? { ...m, role } : m)
    };

    try {
      await onUpdateTeam(updatedTeam);
      setIsEditingMember(null);
    } catch (err) {
      alert("No se pudo actualizar el rol del miembro.");
    }
  };

  // Handle Save Team Configuration
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !teamOwnerName.trim() || !teamOwnerEmail.trim()) {
      setConfigError("El nombre, propietario y correo de propietario son obligatorios");
      return;
    }

    setIsSavingConfig(true);
    setConfigError(null);

    const updatedTeam: Team = {
      ...activeTeam,
      name: teamName,
      image: teamImage || undefined,
      ownerName: teamOwnerName,
      ownerEmail: teamOwnerEmail
    };

    try {
      await onUpdateTeam(updatedTeam);
      alert("¡Configuración del equipo guardada con éxito!");
    } catch (err) {
      setConfigError("Error al guardar la configuración del equipo.");
    } finally {
      setIsSavingConfig(false);
    }
  };

  // File Upload Helper for Team Image
  const handleTeamImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setConfigError("Por favor selecciona un archivo de imagen válido");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setConfigError("La imagen supera el límite de 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === "string") {
        setTeamImage(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Team Header Summary Card */}
      <div className="relative p-6 rounded-2xl border border-border-theme bg-gradient-to-r from-surface-theme to-surface-theme/40 backdrop-blur-md overflow-hidden flex flex-col md:flex-row items-center gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-theme/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        {/* Team Logo */}
        <div className="relative w-20 h-20 shrink-0 rounded-2xl overflow-hidden border border-border-theme/80 bg-bg-theme flex items-center justify-center">
          {activeTeam.image ? (
            <img src={activeTeam.image} alt={activeTeam.name} className="w-full h-full object-cover" />
          ) : (
            <Users className="w-10 h-10 text-accent-theme" />
          )}
        </div>

        {/* Team Meta Details */}
        <div className="flex-1 text-center md:text-left min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight truncate">
            {activeTeam.name}
          </h1>
          <p className="text-xs text-text-dim-theme mt-1 flex flex-wrap justify-center md:justify-start items-center gap-x-2 gap-y-1">
            <span className="flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              Propietario: <strong className="text-white font-medium">{activeTeam.ownerName}</strong>
            </span>
            <span className="text-border-theme">•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              Creado el: {new Date(activeTeam.createdAt).toLocaleDateString()}
            </span>
          </p>
        </div>
      </div>

      {/* Subpage Contents */}
      <AnimatePresence mode="wait">
        {subTab === "dashboard" && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.18 }}
            className="space-y-6"
          >
            {/* Bento Grid Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Stat 1: Members */}
              <div className="p-6 rounded-2xl border border-border-theme bg-surface-theme/50 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-text-dim-theme">Miembros del Equipo</span>
                  <span className="block text-3xl font-extrabold text-white">{activeTeam.members.length}</span>
                  <span className="block text-[11px] text-accent-theme flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    {activeTeam.members.filter(m => m.role === "Administrador").length} Administradores
                  </span>
                </div>
                <div className="p-3 bg-accent-theme/10 text-accent-theme rounded-2xl">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              {/* Stat 2: Reports */}
              <div className="p-6 rounded-2xl border border-border-theme bg-surface-theme/50 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-text-dim-theme">Diagnósticos de Comercio</span>
                  <span className="block text-3xl font-extrabold text-white">{teamReports.length}</span>
                  <span className="block text-[11px] text-green-theme flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Asociados a este equipo
                  </span>
                </div>
                <div className="p-3 bg-green-theme/10 text-green-theme rounded-2xl">
                  <FileText className="w-6 h-6" />
                </div>
              </div>

              {/* Stat 3: Ahorros */}
              <div className="p-6 rounded-2xl border border-border-theme bg-surface-theme/50 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-text-dim-theme">Ahorro Anual Identificado</span>
                  <span className="block text-2xl font-extrabold text-white">
                    ${annualSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })} MXN
                  </span>
                  <span className="block text-[11px] text-amber-400">
                    Calculado sobre fugas de capital
                  </span>
                </div>
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Dashboard main split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Recent Team Reports */}
              <div className="lg:col-span-7 space-y-4">
                <div className="p-6 rounded-2xl border border-border-theme bg-surface-theme/30 space-y-4">
                  <div className="flex items-center justify-between border-b border-border-theme/30 pb-3">
                    <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-accent-theme" />
                      Diagnósticos del Equipo
                    </h3>
                    <span className="text-xs text-text-dim-theme">{teamReports.length} total</span>
                  </div>

                  {teamReports.length === 0 ? (
                    <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
                      <FileText className="w-8 h-8 text-text-dim-theme opacity-50" />
                      <p className="text-xs text-text-dim-theme">Este equipo no cuenta con diagnósticos asignados.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border-theme/30 space-y-3 pt-1">
                      {teamReports.map(report => (
                        <div key={report.id} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            {report.logo ? (
                              <img src={report.logo} alt={report.name} className="w-9 h-9 rounded-lg object-cover border border-border-theme" />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-accent-theme/10 flex items-center justify-center font-bold text-accent-theme text-xs border border-accent-theme/20">
                                {report.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm text-white truncate">{report.name}</h4>
                              <p className="text-[10px] text-text-dim-theme truncate">GMV: ${report.gmv.toLocaleString()} MXN</p>
                            </div>
                          </div>
                          
                          <div className="text-right shrink-0">
                            <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-green-theme/15 text-green-theme border border-green-theme/25">
                              {report.viewCount || 0} visitas
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Brief Members List preview */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-6 rounded-2xl border border-border-theme bg-surface-theme/30 space-y-4">
                  <div className="flex items-center justify-between border-b border-border-theme/30 pb-3">
                    <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4 text-accent-theme" />
                      Miembros Recientes
                    </h3>
                    <button 
                      onClick={() => setSubTab("members")}
                      className="text-xs text-accent-theme hover:underline flex items-center gap-1 font-bold"
                    >
                      Gestionar <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3.5">
                    {activeTeam.members.map(member => (
                      <div key={member.id} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <img 
                            src={member.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"} 
                            alt={member.name} 
                            className="w-8 h-8 rounded-full border border-border-theme object-cover shrink-0" 
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-white truncate">{member.name}</h4>
                            <p className="text-[10px] text-text-dim-theme truncate">{member.email}</p>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                          member.role === "Administrador" 
                            ? "bg-red-theme/10 border-red-theme/25 text-red-theme" 
                            : member.role === "Editor"
                              ? "bg-accent-theme/10 border-accent-theme/25 text-accent-theme"
                              : "bg-surface-theme border-border-theme text-text-dim-theme"
                        }`}>
                          {member.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {subTab === "members" && (
          <motion.div
            key="members"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.18 }}
            className="space-y-6"
          >
            {/* Members Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-theme pb-3.5">
              <div>
                <h3 className="font-bold text-base text-white">Administración de Miembros y Roles</h3>
                <p className="text-xs text-text-dim-theme">Agrega colaboradores, asigna roles de permisos y gestiona accesos.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setInviteStatus(null);
                    setSendInviteRole(activeTeam.inviteRole || "Visor");
                    setIsInviteEmailModalOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Mail className="w-4 h-4" />
                  <span>Invitar por Correo</span>
                </button>
                <button
                  onClick={() => setIsAddingMember(!isAddingMember)}
                  className="bg-accent-theme hover:bg-accent-theme/90 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {isAddingMember ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{isAddingMember ? "Cancelar" : "Nuevo Miembro"}</span>
                </button>
              </div>
            </div>

            {/* Add Member Form Expandable */}
            {isAddingMember && (
              <form onSubmit={handleAddMember} className="p-5 rounded-2xl border border-border-theme bg-surface-theme/40 backdrop-blur-sm space-y-4 animate-fade-in">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-accent-theme" />
                  Agregar Nuevo Miembro al Equipo
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dim-theme mb-1">Nombre Completo</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ej. Sofía Ruiz"
                      value={newMemberName}
                      onChange={e => setNewMemberName(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme focus:border-text-dim-theme text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dim-theme mb-1">Correo Electrónico</label>
                    <input 
                      type="email"
                      required
                      placeholder="sofia@tucomercio.mx"
                      value={newMemberEmail}
                      onChange={e => setNewMemberEmail(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme focus:border-text-dim-theme text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dim-theme mb-1">Rol de Permiso</label>
                    <select
                      value={newMemberRole}
                      onChange={e => setNewMemberRole(e.target.value as any)}
                      className="w-full text-xs px-3 py-2 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme text-white cursor-pointer"
                    >
                      {currentUserRole === "Superusuario" && (
                        <option value="Superusuario">Superusuario (Control Total del Sistema)</option>
                      )}
                      <option value="Administrador">Administrador (Control total del equipo)</option>
                      <option value="Editor">Editor (Modifica diagnósticos)</option>
                      <option value="Visor">Visor (Sólo lectura)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <label className="flex items-center gap-2 text-xs text-text-dim-theme cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sendEmailOnAddMember}
                      onChange={e => setSendEmailOnAddMember(e.target.checked)}
                      className="rounded border-border-theme text-accent-theme focus:ring-accent-theme cursor-pointer"
                    />
                    <span>Enviar correo electrónico de invitación con el enlace de acceso al equipo</span>
                  </label>
                </div>

                {memberError && (
                  <p className="text-xs text-rose-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {memberError}
                  </p>
                )}

                <div className="flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAddingMember(false)}
                    className="px-3.5 py-1.5 rounded-lg border border-border-theme text-xs font-bold text-text-dim-theme hover:text-white bg-bg-theme cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-accent-theme text-xs font-bold text-white hover:bg-accent-theme/90 cursor-pointer"
                  >
                    Agregar Miembro
                  </button>
                </div>
              </form>
            )}


            {/* Members List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTeam.members.map(member => (
                <div key={member.id} className="p-5 rounded-2xl border border-border-theme bg-surface-theme/40 relative flex flex-col justify-between gap-4">
                  
                  {/* Top card metadata */}
                  <div className="flex items-start gap-3.5">
                    <img 
                      src={member.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"} 
                      alt={member.name} 
                      className="w-11 h-11 rounded-full border border-border-theme object-cover shrink-0" 
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-white truncate">{member.name}</h4>
                      <p className="text-[11px] text-text-dim-theme truncate flex items-center gap-1">
                        <Mail className="w-3 h-3 text-text-dim-theme" />
                        {member.email}
                      </p>
                    </div>
                  </div>

                  {/* Role Selector & Actions */}
                  <div className="border-t border-border-theme/30 pt-3.5 flex items-center justify-between">
                    <div>
                      {isEditingMember?.id === member.id ? (
                        <div className="flex items-center gap-1.5">
                          <select
                            value={isEditingMember.role}
                            onChange={e => setIsEditingMember({ ...isEditingMember, role: e.target.value as any })}
                            className="text-xs px-2 py-1 rounded bg-bg-theme border border-border-theme text-white outline-none cursor-pointer"
                          >
                            {currentUserRole === "Superusuario" && (
                              <option value="Superusuario">Superusuario</option>
                            )}
                            <option value="Administrador">Administrador</option>
                            <option value="Editor">Editor</option>
                            <option value="Visor">Visor</option>
                          </select>
                          <button 
                            onClick={() => handleSaveMemberRole(member.id, isEditingMember.role)}
                            className="p-1 rounded bg-green-theme/10 hover:bg-green-theme/20 text-green-theme"
                            title="Confirmar"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setIsEditingMember(null)}
                            className="p-1 rounded bg-red-theme/10 hover:bg-red-theme/20 text-red-theme"
                            title="Cancelar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          member.role === "Administrador" 
                            ? "bg-red-theme/10 border-red-theme/25 text-red-theme" 
                            : member.role === "Editor"
                              ? "bg-accent-theme/10 border-accent-theme/25 text-accent-theme"
                              : "bg-surface-theme border-border-theme text-text-dim-theme"
                        }`}>
                          {member.role}
                        </span>
                      )}
                    </div>

                    {/* Actions if we are not editing role */}
                    {isEditingMember?.id !== member.id && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setIsEditingMember(member)}
                          className="p-1.5 rounded border border-border-theme hover:border-accent-theme bg-bg-theme text-text-dim-theme hover:text-white transition-all cursor-pointer"
                          title="Cambiar rol"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          className="p-1.5 rounded border border-red-theme/15 bg-red-theme/10 hover:bg-red-theme/20 text-red-theme transition-all cursor-pointer"
                          title="Eliminar miembro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {subTab === "settings" && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.18 }}
            className="space-y-6"
          >
            {/* Settings Subpage Container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Config Form */}
              <div className="lg:col-span-8 space-y-6">
                <form onSubmit={handleSaveConfig} className="p-6 rounded-2xl border border-border-theme bg-surface-theme/50 backdrop-blur-md space-y-5">
                  <div className="flex items-center gap-2 mb-2 border-b border-border-theme/30 pb-2">
                    <Settings className="w-4 h-4 text-accent-theme" />
                    <h3 className="font-bold text-sm text-white uppercase tracking-wider">Detalles de Configuración</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-text-dim-theme mb-1.5">Nombre del Equipo *</label>
                      <input 
                        type="text" 
                        required
                        value={teamName} 
                        onChange={e => setTeamName(e.target.value)}
                        placeholder="Ej. Equipo Evolución"
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme focus:border-text-dim-theme text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-text-dim-theme mb-1.5">Logo/Imagen del Equipo (URL)</label>
                      <input 
                        type="text" 
                        value={teamImage} 
                        onChange={e => setTeamImage(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme focus:border-text-dim-theme text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-text-dim-theme mb-1.5">Nombre del Propietario *</label>
                      <input 
                        type="text" 
                        required
                        value={teamOwnerName} 
                        onChange={e => setTeamOwnerName(e.target.value)}
                        placeholder="César Ayar"
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme focus:border-text-dim-theme text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-text-dim-theme mb-1.5">Correo del Propietario *</label>
                      <input 
                        type="email" 
                        required
                        value={teamOwnerEmail} 
                        onChange={e => setTeamOwnerEmail(e.target.value)}
                        placeholder="cesar@tiendanube.mx"
                        className="w-full text-sm px-3.5 py-2.5 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme focus:border-text-dim-theme text-white"
                      />
                    </div>
                  </div>

                  {/* Tarjeta de Enlace de Invitación al Equipo */}
                  {activeTeam && (
                    <div className="pt-4 border-t border-border-theme/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold uppercase tracking-wider text-accent-theme flex items-center gap-1.5">
                          <LinkIcon className="w-3.5 h-3.5" />
                          Enlace de Invitación Directa al Equipo
                        </label>
                        <span className="text-[10px] text-text-dim-theme bg-bg-theme px-2 py-0.5 rounded border border-border-theme font-mono">
                          Token: {activeTeam.inviteToken || "Generando..."}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          readOnly
                          value={`${typeof window !== "undefined" ? window.location.origin : "https://tlamatqui.app"}/?inviteTeam=${activeTeam.inviteToken || ""}`}
                          className="w-full text-xs font-mono px-3.5 py-2.5 rounded-lg border outline-none bg-bg-theme border-border-theme text-emerald-400 select-all"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const url = `${window.location.origin}/?inviteTeam=${activeTeam.inviteToken || ""}`;
                            navigator.clipboard.writeText(url);
                            alert("¡Enlace de invitación copiado al portapapeles!");
                          }}
                          className="px-4 py-2.5 bg-accent-theme hover:bg-accent-theme/90 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shrink-0"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copiar Enlace
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setInviteStatus(null);
                            setSendInviteRole(activeTeam.inviteRole || "Visor");
                            setIsInviteEmailModalOpen(true);
                          }}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shrink-0 transition-all shadow-sm"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          Enviar por Correo
                        </button>

                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-text-dim-theme font-medium">Rol Asignado por Defecto:</span>
                          <select
                            value={activeTeam.inviteRole || "Visor"}
                            onChange={async (e) => {
                              const updated = { ...activeTeam, inviteRole: e.target.value as any };
                              await onUpdateTeam(updated);
                            }}
                            className="text-xs px-2.5 py-1 rounded bg-bg-theme border border-border-theme text-white outline-none cursor-pointer"
                          >
                            {currentUserRole === "Superusuario" && (
                              <option value="Superusuario">Superusuario</option>
                            )}
                            <option value="Administrador">Administrador</option>
                            <option value="Editor">Editor</option>
                            <option value="Visor">Visor</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm("¿Estás seguro de regenerar el enlace? El enlace previo dejará de funcionar.")) {
                              try {
                                const res = await fetch(`/api/teams/${activeTeam.id}/reset-invite`, { method: "POST" });
                                const data = await res.json();
                                if (res.ok) {
                                  await onUpdateTeam(data);
                                  alert("¡Nuevo enlace de invitación generado exitosamente!");
                                }
                              } catch (e) {
                                alert("Error al regenerar enlace.");
                              }
                            }
                          }}
                          className="text-[11px] text-text-dim-theme hover:text-red-theme underline cursor-pointer font-medium flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" /> Regenerar Enlace
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Drag-and-drop team logo */}
                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-dim-theme">Sube un logo local de equipo</label>
                    <div 
                      onClick={() => document.getElementById("team-image-file")?.click()}
                      className="border border-dashed border-border-theme rounded-lg p-5 flex flex-col items-center justify-center gap-2.5 transition-all cursor-pointer bg-bg-theme/30 hover:bg-bg-theme/50 hover:border-accent-theme/50"
                    >
                      <input 
                        type="file" 
                        id="team-image-file" 
                        accept="image/*"
                        onChange={e => {
                          const files = e.target.files;
                          if (files && files.length > 0) handleTeamImageFile(files[0]);
                        }}
                        className="hidden" 
                      />
                      <UploadCloud className="w-5 h-5 text-accent-theme" />
                      <div className="text-center">
                        <p className="text-[11px] font-bold text-white">Haz clic o arrastra un logo aquí</p>
                        <p className="text-[9px] text-text-dim-theme">Soporta PNG, JPG o WEBP (Máx. 2MB)</p>
                      </div>
                    </div>
                  </div>

                  {configError && (
                    <p className="text-xs text-rose-400 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {configError}
                    </p>
                  )}

                  <div className="pt-3 border-t border-border-theme/30 flex justify-end gap-3">
                    <button 
                      type="submit"
                      disabled={isSavingConfig}
                      className="bg-accent-theme hover:bg-accent-theme/90 disabled:bg-accent-theme/50 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
                    >
                      {isSavingConfig ? "Guardando..." : "Guardar Cambios"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Danger Zone / Delete Team */}
              <div className="lg:col-span-4 space-y-6">
                <div className="p-6 rounded-2xl border border-rose-500/15 bg-rose-500/5 backdrop-blur-md space-y-4">
                  <div className="flex items-center gap-2 mb-2 border-b border-rose-500/10 pb-2">
                    <AlertTriangle className="w-4 h-4 text-red-theme" />
                    <h3 className="font-bold text-sm text-red-theme uppercase tracking-wider">Zona de Peligro</h3>
                  </div>

                  <p className="text-xs text-text-dim-theme leading-relaxed">
                    Eliminar este equipo borrará permanentemente toda su configuración, miembros, roles asignados y la relación con sus diagnósticos. Esta acción no se puede deshacer.
                  </p>

                  <button
                    onClick={async () => {
                      if (activeTeam.id === "team-default") {
                        alert("No es posible eliminar el equipo predeterminado por motivos de integridad.");
                        return;
                      }
                      if (confirm(`¿Estás seguro de que deseas ELIMINAR permanentemente el equipo "${activeTeam.name}"?`)) {
                        await onDeleteTeam(activeTeam.id);
                        alert("Equipo eliminado con éxito.");
                      }
                    }}
                    className="w-full bg-red-theme/15 border border-red-theme/25 hover:bg-red-theme/20 text-red-theme font-bold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Equipo</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {subTab === "partners" && (
          <motion.div
            key="partners"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.18 }}
            className="space-y-6"
          >
            {loadingPartner ? (
              <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-2 border-accent-theme border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-text-dim-theme">Cargando configuración de socio...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Branding Config Form */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="p-6 rounded-2xl border border-border-theme bg-surface-theme/50 backdrop-blur-md space-y-5">
                    <div className="flex items-center justify-between border-b border-border-theme/30 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-accent-theme" />
                        <h3 className="font-bold text-sm text-white uppercase tracking-wider">Identidad Corporativa de Socio (Branding)</h3>
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-accent-theme bg-accent-theme/10 px-2 py-0.5 rounded">Global</span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-text-dim-theme mb-1.5">Nombre de Marca o Consultora *</label>
                        <input 
                          type="text" 
                          required
                          value={partnerName} 
                          onChange={e => setPartnerName(e.target.value)}
                          placeholder="Ej. Tiendanube Partners"
                          className="w-full text-sm px-3.5 py-2.5 rounded-lg border outline-none bg-bg-theme border-border-theme text-white focus:border-text-dim-theme focus:ring-1 focus:ring-accent-theme"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-text-dim-theme mb-1.5">URL de Logotipo (Imagen)</label>
                          <input 
                            type="text" 
                            value={partnerLogo} 
                            onChange={e => setPartnerLogo(e.target.value)}
                            placeholder="https://logo.clearbit.com/tiendanube.com"
                            className="w-full text-sm px-3.5 py-2.5 rounded-lg border outline-none bg-bg-theme border-border-theme text-white focus:border-text-dim-theme focus:ring-1 focus:ring-accent-theme"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-text-dim-theme mb-1.5">Enlace Oficial de Socio (Link)</label>
                          <input 
                            type="text" 
                            value={partnerLink} 
                            onChange={e => setPartnerLink(e.target.value)}
                            placeholder="https://www.tiendanube.com"
                            className="w-full text-sm px-3.5 py-2.5 rounded-lg border outline-none bg-bg-theme border-border-theme text-white focus:border-text-dim-theme focus:ring-1 focus:ring-accent-theme"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-text-dim-theme mb-1.5">Descripción de la Consultora o Alianza</label>
                        <textarea 
                          value={partnerDesc} 
                          onChange={e => setPartnerDesc(e.target.value)}
                          placeholder="Escribe una breve presentación que aparecerá por defecto en el slide corporativo..."
                          rows={3}
                          className="w-full text-sm px-3.5 py-2.5 rounded-lg border outline-none bg-bg-theme border-border-theme text-white focus:border-text-dim-theme focus:ring-1 focus:ring-accent-theme"
                        />
                      </div>
                    </div>

                    {partnerMessage && (
                      <div className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${partnerMessage.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" : "bg-rose-500/10 text-rose-400 border border-rose-500/15"}`}>
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>{partnerMessage.text}</span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-border-theme/30 flex justify-end">
                      <button 
                        type="button"
                        onClick={() => handleSavePartner()}
                        disabled={isSavingPartner}
                        className="bg-accent-theme hover:bg-accent-theme/90 disabled:bg-accent-theme/50 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
                      >
                        {isSavingPartner ? "Guardando..." : "Guardar Identidad Global"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Partner Members (Read/Comment access) */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Form to Add Partner Member */}
                  <div className="p-6 rounded-2xl border border-border-theme bg-surface-theme/50 backdrop-blur-md space-y-4">
                    <div className="border-b border-border-theme/30 pb-2.5">
                      <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-4 h-4 text-accent-theme" />
                        Agregar Socio / Miembro
                      </h3>
                      <p className="text-[10px] text-text-dim-theme mt-1">Otorga accesos de lectura o comentarios a consultores externos.</p>
                    </div>

                    <form onSubmit={handleAddPartnerMember} className="space-y-3.5">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dim-theme mb-1">Nombre Completo</label>
                        <input 
                          type="text" 
                          required
                          value={newPartnerMemberName}
                          onChange={e => setNewPartnerMemberName(e.target.value)}
                          placeholder="Ej. Juan Pérez"
                          className="w-full text-xs px-3 py-2 rounded-lg border bg-bg-theme border-border-theme text-white outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dim-theme mb-1">Correo Electrónico</label>
                        <input 
                          type="email" 
                          required
                          value={newPartnerMemberEmail}
                          onChange={e => setNewPartnerMemberEmail(e.target.value)}
                          placeholder="juan.perez@consultor.com"
                          className="w-full text-xs px-3 py-2 rounded-lg border bg-bg-theme border-border-theme text-white outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dim-theme mb-1">Nivel de Acceso</label>
                        <select 
                          value={newPartnerMemberRole}
                          onChange={e => setNewPartnerMemberRole(e.target.value as any)}
                          className="w-full text-xs px-3 py-2 rounded-lg border bg-bg-theme border-border-theme text-white outline-none"
                        >
                          <option value="Lector">Lector (Solo Ver)</option>
                          <option value="Lector y Comentarista">Lector y Comentarista (Ver y Añadir notas)</option>
                        </select>
                      </div>

                      <button 
                        type="submit"
                        className="w-full bg-accent-theme hover:bg-accent-theme/90 text-white font-bold py-2 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar Socio</span>
                      </button>
                    </form>
                  </div>

                  {/* List of Current Partner Members */}
                  <div className="p-5 rounded-2xl border border-border-theme bg-surface-theme/30 space-y-4">
                    <h3 className="font-bold text-xs text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                      Miembros con Acceso ({ (partnerData?.members || []).length })
                    </h3>

                    {(!partnerData?.members || partnerData.members.length === 0) ? (
                      <p className="text-xs text-text-dim-theme italic">No hay socios configurados actualmente.</p>
                    ) : (
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {partnerData.members.map((m: any) => (
                          <div key={m.id} className="flex items-center justify-between p-2.5 rounded-lg bg-bg-theme/40 border border-border-theme/40 text-xs">
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate">{m.name}</p>
                              <p className="text-[10px] text-text-dim-theme truncate font-mono">{m.email}</p>
                              <span className="inline-block mt-1 text-[9px] font-semibold bg-accent-theme/10 text-accent-theme px-1.5 py-0.5 rounded">
                                {m.role}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeletePartnerMember(m.id)}
                              className="p-1 rounded bg-red-theme/10 text-red-theme hover:bg-red-theme/20 border border-red-theme/15 shrink-0 ml-2 cursor-pointer"
                              title="Eliminar socio"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Invitación a Miembros por Correo Electrónico */}
      <AnimatePresence>
        {isInviteEmailModalOpen && activeTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg bg-surface-theme border border-border-theme rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5 relative"
            >
              <div className="flex items-center justify-between border-b border-border-theme/40 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">Enviar Invitación por Correo</h3>
                    <p className="text-xs text-text-dim-theme">Invita a colaboradores al equipo "{activeTeam.name}"</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsInviteEmailModalOpen(false)}
                  className="p-1.5 rounded-lg text-text-dim-theme hover:text-white hover:bg-bg-theme/60 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSendInviteEmail} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-dim-theme mb-1.5">
                    Correo Electrónico del Destinatario *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="colaborador@empresa.com"
                    value={sendInviteEmail}
                    onChange={e => setSendInviteEmail(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border outline-none focus:ring-1 focus:ring-emerald-500 bg-bg-theme border-border-theme text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-dim-theme mb-1.5">
                      Nombre del Destinatario (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Ana Gómez"
                      value={sendInviteName}
                      onChange={e => setSendInviteName(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border outline-none focus:ring-1 focus:ring-emerald-500 bg-bg-theme border-border-theme text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text-dim-theme mb-1.5">
                      Rol Asignado
                    </label>
                    <select
                      value={sendInviteRole}
                      onChange={e => setSendInviteRole(e.target.value as any)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border outline-none focus:ring-1 focus:ring-emerald-500 bg-bg-theme border-border-theme text-white cursor-pointer"
                    >
                      {currentUserRole === "Superusuario" && (
                        <option value="Superusuario">Superusuario</option>
                      )}
                      <option value="Administrador">Administrador</option>
                      <option value="Editor">Editor</option>
                      <option value="Visor">Visor</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-text-dim-theme mb-1.5">
                    Nota o Mensaje Personalizado (Opcional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ej. Hola Ana, te comparto la invitación para que colabores en nuestros diagnósticos financieros."
                    value={sendInviteNote}
                    onChange={e => setSendInviteNote(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border outline-none focus:ring-1 focus:ring-emerald-500 bg-bg-theme border-border-theme text-white resize-none"
                  />
                </div>

                {inviteStatus && (
                  <div className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                    inviteStatus.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                      : "bg-rose-500/10 border-rose-500/25 text-rose-400"
                  }`}>
                    {inviteStatus.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                    <span>{inviteStatus.message}</span>
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-3 border-t border-border-theme/30">
                  <button
                    type="button"
                    onClick={() => setIsInviteEmailModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-border-theme text-xs font-bold text-text-dim-theme hover:text-white bg-bg-theme cursor-pointer"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingInvite}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    {isSendingInvite ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5" />
                        <span>Enviar Invitación</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

