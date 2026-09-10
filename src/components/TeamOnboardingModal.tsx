import React, { useState } from "react";
import { 
  Building2, Image as ImageIcon, Mail, Phone, Globe, Users, 
  UserPlus, Link as LinkIcon, Copy, Check, Sparkles, ChevronRight, 
  ChevronLeft, X, Shield, Plus, Trash2, AlertCircle, CheckCircle2,
  Briefcase, HeartHandshake, UploadCloud, Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Team, TeamMember, Ally } from "../types";

interface TeamOnboardingModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSaveTeam: (teamData: Partial<Team>) => Promise<void>;
  currentUserEmail: string;
  currentUserName?: string;
  isFirstTeam?: boolean;
}

const PRESET_LOGOS = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=150&q=80"
];

const PRESET_COLORS = [
  { name: "Índigo", value: "#6366f1" },
  { name: "Esmeralda", value: "#10b981" },
  { name: "Púrpura", value: "#8b5cf6" },
  { name: "Rosa", value: "#f43f5e" },
  { name: "Ámbar", value: "#f59e0b" },
  { name: "Cian", value: "#06b6d4" },
  { name: "Azul", value: "#3b82f6" }
];

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function TeamOnboardingModal({
  isOpen,
  onClose,
  onSaveTeam,
  currentUserEmail,
  currentUserName = "César Ayar",
  isFirstTeam = false
}: TeamOnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Step 1: Identidad y Marca
  const [teamName, setTeamName] = useState("");
  const [teamSlug, setTeamSlug] = useState("");
  const [isSlugTouched, setIsSlugTouched] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [teamLogo, setTeamLogo] = useState(PRESET_LOGOS[0]);
  const [brandColor, setBrandColor] = useState("#6366f1");

  // Step 2: Contacto
  const [contactEmail, setContactEmail] = useState(currentUserEmail || "");
  const [contactPhone, setContactPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [ownerName, setOwnerName] = useState(currentUserName || "César Ayar");

  // Step 3: Miembros del equipo
  const [inviteToken] = useState(() => `team-inv-sec_${Math.random().toString(36).substring(2, 11)}`);
  const [inviteRole, setInviteRole] = useState<"Visor" | "Agente">("Visor");
  const [copiedLink, setCopiedLink] = useState(false);
  
  const [invitedMembers, setInvitedMembers] = useState<Array<{ name: string; email: string; role: "Administrador" | "Agente" | "Visor" }>>([]);
  const [memberInputName, setMemberInputName] = useState("");
  const [memberInputEmail, setMemberInputEmail] = useState("");
  const [memberInputRole, setMemberInputRole] = useState<"Administrador" | "Agente" | "Visor">("Agente");

  // Step 4: Aliados estratégicos
  const [hasAllies, setHasAllies] = useState<boolean | null>(null);
  const [alliesList, setAlliesList] = useState<Ally[]>([]);
  const [currentAllyName, setCurrentAllyName] = useState("");
  const [currentAllyWebsite, setCurrentAllyWebsite] = useState("");
  const [currentAllyLogo, setCurrentAllyLogo] = useState("");
  const [currentAllyRepEmail, setCurrentAllyRepEmail] = useState("");

  if (!isOpen) return null;

  const appOrigin = typeof window !== "undefined" ? window.location.origin : "https://tlamatqui.app";
  const publicInviteUrl = `${appOrigin}/?inviteTeam=${encodeURIComponent(inviteToken)}`;

  // Validaciones por paso
  const handleNext = () => {
    setErrorMsg(null);
    if (currentStep === 1) {
      if (!teamName.trim()) {
        setErrorMsg("Por favor ingresa un nombre para tu equipo de trabajo.");
        return;
      }
      if (!brandName.trim()) {
        setBrandName(teamName);
      }
      if (!teamSlug.trim()) {
        setTeamSlug(slugify(teamName));
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (contactEmail && !contactEmail.includes("@")) {
        setErrorMsg("Ingresa un correo electrónico de contacto válido.");
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    }
  };

  const handlePrev = () => {
    setErrorMsg(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as any);
    }
  };

  // Agregar miembro pre-aprobado a la lista
  const handleAddMember = () => {
    if (!memberInputEmail.trim() || !memberInputEmail.includes("@")) {
      setErrorMsg("Ingresa un correo electrónico válido para el miembro.");
      return;
    }
    const cleanEmail = memberInputEmail.trim().toLowerCase();
    if (cleanEmail === currentUserEmail.toLowerCase()) {
      setErrorMsg("El propietario ya forma parte del equipo como Administrador principal.");
      return;
    }
    if (invitedMembers.some(m => m.email.toLowerCase() === cleanEmail)) {
      setErrorMsg("Este correo ya está en la lista de miembros invitados.");
      return;
    }

    setInvitedMembers([
      ...invitedMembers,
      {
        name: memberInputName.trim() || cleanEmail.split("@")[0],
        email: cleanEmail,
        role: memberInputRole
      }
    ]);

    setMemberInputName("");
    setMemberInputEmail("");
    setMemberInputRole("Agente");
    setErrorMsg(null);
  };

  const handleRemoveMember = (email: string) => {
    setInvitedMembers(invitedMembers.filter(m => m.email !== email));
  };

  // Copiar enlace de invitación
  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(publicInviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Agregar aliado a la lista
  const handleAddAlly = () => {
    if (!currentAllyName.trim()) {
      setErrorMsg("Ingresa el nombre del aliado o consultora estratégica.");
      return;
    }
    if (currentAllyRepEmail && !currentAllyRepEmail.includes("@")) {
      setErrorMsg("Ingresa un correo válido para el representante de la alianza.");
      return;
    }

    const newAlly: Ally = {
      id: `ally-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: currentAllyName.trim(),
      website: currentAllyWebsite.trim() || undefined,
      logo: currentAllyLogo.trim() || undefined,
      representativeEmail: currentAllyRepEmail.trim().toLowerCase() || undefined,
      members: currentAllyRepEmail.trim() ? [
        {
          id: `mem-ext-${Date.now()}`,
          name: currentAllyRepEmail.trim().split("@")[0],
          email: currentAllyRepEmail.trim().toLowerCase(),
          role: "Visor"
        }
      ] : []
    };

    setAlliesList([...alliesList, newAlly]);
    setCurrentAllyName("");
    setCurrentAllyWebsite("");
    setCurrentAllyLogo("");
    setCurrentAllyRepEmail("");
    setErrorMsg(null);
  };

  const handleRemoveAlly = (id: string) => {
    setAlliesList(alliesList.filter(a => a.id !== id));
  };

  // Helper para subir imagen
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("La imagen no debe superar los 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setter(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Finalizar y Guardar Equipo
  const handleFinish = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // Armar la lista de miembros iniciales pre-aprobados
      const initialMembers: TeamMember[] = [
        {
          id: `owner-${Date.now()}`,
          name: ownerName || currentUserName || "Propietario",
          email: currentUserEmail || contactEmail || "cesar.ayar19@gmail.com",
          role: "Administrador",
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80",
          status: "approved",
          isExternal: false
        },
        ...invitedMembers.map(m => ({
          id: `mem-${Math.random().toString(36).substring(2, 9)}`,
          name: m.name,
          email: m.email,
          role: m.role,
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80",
          status: "approved" as const,
          isExternal: false
        }))
      ];

      // Si se especificó un aliado en curso y no se ha presionado "Guardar Aliado", agregarlo
      let finalAllies = [...alliesList];
      if (hasAllies && currentAllyName.trim()) {
        finalAllies.push({
          id: `ally-${Date.now()}`,
          name: currentAllyName.trim(),
          website: currentAllyWebsite.trim() || undefined,
          logo: currentAllyLogo.trim() || undefined,
          representativeEmail: currentAllyRepEmail.trim().toLowerCase() || undefined,
          members: currentAllyRepEmail.trim() ? [
            {
              id: `mem-ext-${Date.now()}`,
              name: currentAllyRepEmail.trim().split("@")[0],
              email: currentAllyRepEmail.trim().toLowerCase(),
              role: "Visor"
            }
          ] : []
        });
      }

      // Si algún aliado tiene representante, agregar al representante como miembro externo
      finalAllies.forEach(ally => {
        if (ally.representativeEmail && !initialMembers.some(m => m.email.toLowerCase() === ally.representativeEmail?.toLowerCase())) {
          initialMembers.push({
            id: `mem-ext-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: ally.representativeEmail.split("@")[0],
            email: ally.representativeEmail.toLowerCase(),
            role: "Visor",
            avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80",
            status: "approved",
            isExternal: true,
            addedByAllyEmail: ally.representativeEmail
          });
        }
      });

      const parsedPhone = contactPhone.trim() ? parseFloat(contactPhone.replace(/\D/g, '')) || undefined : undefined;
      const finalSlug = teamSlug.trim() ? slugify(teamSlug) : slugify(teamName || "equipo");
      const teamPayload: Partial<Team> = {
        name: teamName.trim(),
        slug: finalSlug,
        brandName: (brandName.trim() || teamName.trim()),
        image: teamLogo,
        brandLogo: teamLogo,
        brandColor: brandColor,
        contactEmail: contactEmail.trim() || currentUserEmail,
        contactPhone: contactPhone.trim(),
        website: website.trim(),
        ownerName: ownerName.trim() || currentUserName,
        ownerEmail: currentUserEmail,
        members: initialMembers,
        allies: finalAllies,
        partners: finalAllies.map(a => ({
          id: a.id,
          name: a.name,
          logo: a.logo || "",
          link: a.url || a.website || "",
          description: (a as any).description || "",
          members: (a.members || []).map((m: any) => ({
            id: m.id,
            name: m.name || "",
            email: m.email,
            role: m.role || "Lector",
            partnerId: a.id
          }))
        })),
        config: {
          reportConfig: {
            emailReport: contactEmail.trim() || currentUserEmail,
            phoneReport: parsedPhone,
            reportLogos: finalAllies.map(a => a.id)
          }
        },
        inviteToken: inviteToken,
        inviteRole: inviteRole
      };

      await onSaveTeam(teamPayload);
      if (onClose) onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Ocurrió un error al guardar el equipo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-surface-theme border border-border-theme rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header con pasos */}
        <div className="px-6 py-5 border-b border-border-theme flex items-center justify-between bg-bg-theme/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-accent-theme/10 border border-accent-theme/20 text-accent-theme">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{isFirstTeam ? "Configura tu Primer Espacio de Trabajo" : "Crear Nuevo Espacio de Trabajo"}</span>
                <span className="text-[11px] font-semibold bg-accent-theme/20 text-accent-theme px-2 py-0.5 rounded-full border border-accent-theme/30">
                  Paso {currentStep} de 4
                </span>
              </h2>
              <p className="text-xs text-text-dim-theme">
                {currentStep === 1 && "Personaliza la identidad visual y slug de tu equipo"}
                {currentStep === 2 && "Establece los datos de contacto y representación"}
                {currentStep === 3 && "Invita a tu equipo de trabajo o colaboradores"}
                {currentStep === 4 && "Agrega aliados o socios estratégicos (opcional)"}
              </p>
            </div>
          </div>

          {!isFirstTeam && onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-text-dim-theme hover:text-white hover:bg-surface-theme/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-border-theme h-1.5 overflow-hidden">
          <div 
            className="bg-accent-theme h-full transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* ----------------- PASO 1: NOMBRE, SLUG Y LOGO ----------------- */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-dim-theme mb-2">
                    Nombre del Equipo / Organización *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Ej. Growth Ecommerce Hub"
                    value={teamName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTeamName(val);
                      if (!brandName) setBrandName(val);
                      if (!isSlugTouched) setTeamSlug(slugify(val));
                    }}
                    className="w-full text-sm px-4 py-3 rounded-xl border outline-none bg-bg-theme border-border-theme text-white focus:border-accent-theme focus:ring-1 focus:ring-accent-theme transition-all"
                  />
                </div>

                {/* Slug para URL del Equipo */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-dim-theme mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-accent-theme" />
                      Slug / URL del Equipo *
                    </span>
                    <span className="text-[10px] text-text-dim-theme font-normal lowercase">Solo minúsculas, números y guiones</span>
                  </label>
                  <div className="flex items-center rounded-xl border border-border-theme bg-bg-theme focus-within:border-accent-theme focus-within:ring-1 focus-within:ring-accent-theme transition-all overflow-hidden">
                    <span className="px-3.5 py-3 text-xs font-mono text-text-dim-theme bg-surface-theme/50 border-r border-border-theme select-none whitespace-nowrap">
                      {appOrigin}/team/
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="growth-ecommerce-hub"
                      value={teamSlug}
                      onChange={(e) => {
                        setIsSlugTouched(true);
                        setTeamSlug(slugify(e.target.value));
                      }}
                      className="w-full text-sm px-3.5 py-3 outline-none bg-transparent text-emerald-400 font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-text-dim-theme mt-1.5">
                    Este identificador se utilizará para la dirección web única y reportes vinculados a este equipo.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-dim-theme mb-2">
                      Nombre de Marca Comercial
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Tu Marca Labs"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className="w-full text-sm px-4 py-3 rounded-xl border outline-none bg-bg-theme border-border-theme text-white focus:border-accent-theme focus:ring-1 focus:ring-accent-theme transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-dim-theme mb-2">
                      Color de Acento de Marca
                    </label>
                    <div className="flex items-center gap-2">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setBrandColor(c.value)}
                          className={`w-8 h-8 rounded-full transition-transform cursor-pointer border ${
                            brandColor === c.value ? "scale-115 border-white ring-2 ring-accent-theme/40" : "border-transparent hover:scale-105"
                          }`}
                          style={{ backgroundColor: c.value }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Selector de Logotipo con Previews */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-dim-theme">
                    Logotipo o Avatar del Equipo
                  </label>
                  
                  <div className="flex items-center gap-4">
                    <img
                      src={teamLogo || PRESET_LOGOS[0]}
                      alt="Logo Preview"
                      className="w-16 h-16 rounded-2xl border-2 border-border-theme object-cover shadow-md shrink-0 bg-bg-theme"
                    />
                    
                    <div className="flex-1 space-y-2">
                      <input
                        type="url"
                        placeholder="https://ejemplo.com/logo.png"
                        value={teamLogo}
                        onChange={(e) => setTeamLogo(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border outline-none bg-bg-theme border-border-theme text-white focus:border-accent-theme"
                      />
                      
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] font-bold text-accent-theme hover:underline flex items-center gap-1 cursor-pointer">
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Subir desde mi computadora</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, setTeamLogo)}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-text-dim-theme block mb-2">O elige un preset visual predeterminado:</span>
                    <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                      {PRESET_LOGOS.map((logoUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setTeamLogo(logoUrl)}
                          className={`p-1 rounded-xl border transition-all cursor-pointer ${
                            teamLogo === logoUrl ? "border-accent-theme ring-2 ring-accent-theme/30 scale-105" : "border-border-theme hover:border-text-dim-theme"
                          }`}
                        >
                          <img src={logoUrl} alt="Preset" className="w-9 h-9 rounded-lg object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ----------------- PASO 2: DATOS GENERALES DE CONTACTO ----------------- */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-dim-theme mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-accent-theme" />
                    <span>Correo Electrónico de Contacto *</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="contacto@tuempresa.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full text-sm px-4 py-3 rounded-xl border outline-none bg-bg-theme border-border-theme text-white focus:border-accent-theme"
                  />
                  <p className="text-[11px] text-text-dim-theme mt-1">Este correo recibirá notificaciones operativas y reportes enviados.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-dim-theme mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-accent-theme" />
                      <span>Teléfono / WhatsApp Comercial</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="+52 55 1234 5678"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full text-sm px-4 py-3 rounded-xl border outline-none bg-bg-theme border-border-theme text-white focus:border-accent-theme"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-dim-theme mb-1.5 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-accent-theme" />
                      <span>Sitio Web Oficial</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://tuempresa.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full text-sm px-4 py-3 rounded-xl border outline-none bg-bg-theme border-border-theme text-white focus:border-accent-theme"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-dim-theme mb-1.5">
                    Nombre del Propietario / Administrador Principal
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full text-sm px-4 py-3 rounded-xl border outline-none bg-bg-theme border-border-theme text-white focus:border-accent-theme"
                  />
                </div>
              </motion.div>
            )}

            {/* ----------------- PASO 3: INVITAR MIEMBROS DEL EQUIPO ----------------- */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Formulario para agregar miembro pre-aprobado */}
                <div className="p-4 rounded-2xl border border-border-theme bg-bg-theme/50 space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-accent-theme" />
                    <span>Agregar Miembros Directos a la Lista</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-5">
                      <input
                        type="email"
                        placeholder="correo@colaborador.com"
                        value={memberInputEmail}
                        onChange={(e) => setMemberInputEmail(e.target.value)}
                        className="w-full text-xs px-3 py-2.5 rounded-xl border outline-none bg-surface-theme border-border-theme text-white focus:border-accent-theme"
                      />
                    </div>
                    <div className="md:col-span-4">
                      <input
                        type="text"
                        placeholder="Nombre (opcional)"
                        value={memberInputName}
                        onChange={(e) => setMemberInputName(e.target.value)}
                        className="w-full text-xs px-3 py-2.5 rounded-xl border outline-none bg-surface-theme border-border-theme text-white focus:border-accent-theme"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <select
                        value={memberInputRole}
                        onChange={(e) => setMemberInputRole(e.target.value as any)}
                        className="w-full text-xs px-3 py-2.5 rounded-xl border outline-none bg-surface-theme border-border-theme text-white cursor-pointer"
                      >
                        <option value="Administrador">Administrador</option>
                        <option value="Agente">Agente</option>
                        <option value="Visor">Visor</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddMember}
                      className="px-4 py-2 rounded-xl bg-accent-theme text-white text-xs font-bold hover:bg-accent-theme/90 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar a la lista</span>
                    </button>
                  </div>
                </div>

                {/* Listado de miembros agregados */}
                {invitedMembers.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-text-dim-theme">
                      Miembros en Lista Pre-aprobada ({invitedMembers.length})
                    </span>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                      {invitedMembers.map((m) => (
                        <div
                          key={m.email}
                          className="p-3 rounded-xl border border-border-theme bg-surface-theme flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate">{m.name}</p>
                            <p className="text-[11px] text-text-dim-theme truncate">{m.email}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-theme/10 text-accent-theme border border-accent-theme/20">
                              {m.role}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(m.email)}
                              className="p-1 rounded-lg text-text-dim-theme hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sección Enlace Público de Invitación */}
                <div className="p-4 rounded-2xl border border-border-theme bg-bg-theme/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">
                        Enlace de Invitación Compartible
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      Activo
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={publicInviteUrl}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border bg-surface-theme border-border-theme text-text-dim-theme outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleCopyInviteLink}
                      className="px-4 py-2.5 rounded-xl bg-surface-theme hover:bg-surface-theme/80 border border-border-theme text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-sm"
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedLink ? "¡Copiado!" : "Copiar"}</span>
                    </button>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    <span>
                      <strong>Regla de aprobación:</strong> Los usuarios que ingresen mediante este enlace sin haber sido pre-registrados en la lista previa entrarán en estado <em>"Pendiente de Aprobación"</em> y requerirán tu autorización en el panel para acceder.
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ----------------- PASO 4: ALIADOS ESTRATÉGICOS ----------------- */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Pregunta inicial si existen aliados */}
                <div className="p-4 rounded-2xl border border-border-theme bg-bg-theme/40 space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-accent-theme" />
                    <span>¿Trabajas con Consultoras o Aliados Estratégicos?</span>
                  </h4>
                  <p className="text-xs text-text-dim-theme">
                    Puedes integrar agencias, consultoras o socios comerciales para colaborar en auditorías y reportes.
                  </p>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setHasAllies(true)}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        hasAllies === true
                          ? "bg-accent-theme/20 border-accent-theme text-white ring-1 ring-accent-theme"
                          : "bg-surface-theme border-border-theme text-text-dim-theme hover:text-white"
                      }`}
                    >
                      Sí, agregar aliados
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHasAllies(false);
                        setAlliesList([]);
                      }}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        hasAllies === false
                          ? "bg-surface-theme border-white text-white"
                          : "bg-surface-theme border-border-theme text-text-dim-theme hover:text-white"
                      }`}
                    >
                      No por ahora
                    </button>
                  </div>
                </div>

                {/* Formulario de Aliado (si hasAllies es true) */}
                {hasAllies === true && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="p-5 rounded-2xl border border-border-theme bg-surface-theme space-y-4">
                      <h5 className="text-xs font-extrabold uppercase tracking-wider text-accent-theme flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4" />
                        <span>Datos del Aliado Estratégico</span>
                      </h5>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-text-dim-theme mb-1">
                            Nombre del Aliado *
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. Tiendanube Partners"
                            value={currentAllyName}
                            onChange={(e) => setCurrentAllyName(e.target.value)}
                            className="w-full text-xs px-3.5 py-2.5 rounded-xl border outline-none bg-bg-theme border-border-theme text-white focus:border-accent-theme"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-text-dim-theme mb-1">
                            Sitio Web Oficial
                          </label>
                          <input
                            type="url"
                            placeholder="https://tiendanube.com"
                            value={currentAllyWebsite}
                            onChange={(e) => setCurrentAllyWebsite(e.target.value)}
                            className="w-full text-xs px-3.5 py-2.5 rounded-xl border outline-none bg-bg-theme border-border-theme text-white focus:border-accent-theme"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-text-dim-theme mb-1">
                            URL del Logotipo
                          </label>
                          <input
                            type="url"
                            placeholder="https://ejemplo.com/logo-aliado.png"
                            value={currentAllyLogo}
                            onChange={(e) => setCurrentAllyLogo(e.target.value)}
                            className="w-full text-xs px-3.5 py-2.5 rounded-xl border outline-none bg-bg-theme border-border-theme text-white focus:border-accent-theme"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-text-dim-theme mb-1">
                            Correo del Representante de la Alianza
                          </label>
                          <input
                            type="email"
                            placeholder="representante@aliado.com"
                            value={currentAllyRepEmail}
                            onChange={(e) => setCurrentAllyRepEmail(e.target.value)}
                            className="w-full text-xs px-3.5 py-2.5 rounded-xl border outline-none bg-bg-theme border-border-theme text-white focus:border-accent-theme"
                          />
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-accent-theme/10 border border-accent-theme/20 text-[11px] text-accent-theme flex items-start gap-2">
                        <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>
                          <strong>Capacidad del Representante:</strong> Este usuario podrá invitar colaboradores externos con rol <em>Visor</em>. Dichos colaboradores se identificarán automáticamente en el equipo con la insignia <strong>"Externo"</strong>.
                        </span>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleAddAlly}
                          className="px-4 py-2 rounded-xl bg-surface-theme border border-border-theme hover:border-accent-theme text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-accent-theme" />
                          <span>Guardar Aliado en la Lista</span>
                        </button>
                      </div>
                    </div>

                    {/* Resumen de Aliados configurados */}
                    {alliesList.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-text-dim-theme">
                          Aliados Configurados ({alliesList.length})
                        </span>
                        <div className="space-y-2">
                          {alliesList.map((ally) => (
                            <div
                              key={ally.id}
                              className="p-3.5 rounded-xl border border-border-theme bg-surface-theme flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {ally.logo ? (
                                  <img
                                    src={ally.logo}
                                    alt={ally.name}
                                    className="w-8 h-8 rounded-lg object-cover border border-border-theme shrink-0"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-lg bg-accent-theme/15 flex items-center justify-center text-accent-theme font-bold shrink-0">
                                    {ally.name[0]}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="font-bold text-white truncate">{ally.name}</p>
                                  {ally.representativeEmail && (
                                    <p className="text-[11px] text-text-dim-theme truncate">
                                      Rep: {ally.representativeEmail}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveAlly(ally.id)}
                                className="p-1.5 rounded-lg text-text-dim-theme hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modal Footer / Navigation Controls */}
        <div className="px-6 py-4 border-t border-border-theme bg-bg-theme/50 flex items-center justify-between gap-3">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-border-theme text-xs font-bold text-text-dim-theme hover:text-white hover:bg-surface-theme flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-accent-theme hover:bg-accent-theme/90 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-950/40"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? "Creando Equipo..." : "Finalizar y Crear Equipo 🚀"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
