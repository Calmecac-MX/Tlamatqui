/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, lazy, Suspense } from "react";
import RealTimeDashboard from "./RealTimeDashboard";
import GlobalDashboard from "./GlobalDashboard";

const TeamDashboard = lazy(() => import("./TeamDashboard"));
const SuperAdminDashboard = lazy(() => import("./SuperAdminDashboard"));

import { 
  Plus, Edit, Trash2, Eye, Copy, Save, Sparkles, AlertTriangle, 
  Settings, User, Phone, Mail, Link as LinkIcon, DollarSign, 
  Layers, Database, FileText, CheckCircle, RefreshCw, Moon, Sun, Laptop, ArrowRight,
  TrendingUp, Menu, ChevronLeft, ChevronRight, LayoutDashboard, Undo2,
  UploadCloud, Camera, Image as ImageIcon, X, Users, ChevronDown, Crown,
  Search, Filter, SlidersHorizontal, Calendar, Table, LayoutGrid, LogOut, ShieldCheck, Lock

} from "lucide-react";
import { Report, Tool, ComparisonRow, ComparisonTemplate, Team, TeamMember } from "../types";
import { scrapeShopifyStore, detectStoreWithChismografo, ChismografoAuditResult } from "../lib/scrapper";
import { useAuth } from "../lib/authContext";
import SendEmailModal from "./SendEmailModal";
import { ShareReportModal } from "./ShareReportModal";
import { CreateDiagnosticModal } from "./CreateDiagnosticModal";

/**
 * Propiedades del componente AdminPanel.
 */
interface AdminPanelProps {
  /** Función callback para navegar a la vista detallada de un reporte */
  onViewReport: (id: string) => void;
  /** Estado del tema de diseño activo (Dark/Light mode) */
  isDarkMode: boolean;
  /** Función alternadora del tema de diseño */
  toggleDarkMode: () => void;
}

/**
 * Panel Principal de Administración (Admin Panel Modular).
 * Integra las 7 pestañas principales de la plataforma:
 * 1. Diagnósticos y Creador de Reportes
 * 2. Dashboard Ejecutivo Global
 * 3. Analítica en Tiempo Real
 * 4. Gestión de Equipos y Espacios de Trabajo
 * 5. Plantillas Comparativas Reutilizables
 * 6. Socio / Partner Hub
 * 7. Configuración Global del Panel
 */
export default function AdminPanel({ onViewReport, isDarkMode, toggleDarkMode }: AdminPanelProps) {
  const { user: authUser, logout: authLogout, isAuth0Configured } = useAuth();
  const [adminLogo, setAdminLogo] = useState<string>("");
  const [adminLogo2, setAdminLogo2] = useState<string>("");
  const [adminLogo3, setAdminLogo3] = useState<string>("");
  const [adminFavicon, setAdminFavicon] = useState<string>("/favicon.ico");
  const [adminText, setAdminText] = useState<string>("");
  const [logoType, setLogoType] = useState<"text" | "logo">("text");
  const [logoText, setLogoText] = useState<string>("Tlachiālōyan");
  const [logoFile, setLogoFile] = useState<string>("");
  const [globalEmail, setGlobalEmail] = useState<string>("cesar.ayar19@gmail.com");
  const [defaultContactEmail, setDefaultContactEmail] = useState<string>("cesar.ayar19@gmail.com");
  const [defaultContactWhatsapp, setDefaultContactWhatsapp] = useState<string>("5512345678");
  const [customExchangeRate, setCustomExchangeRate] = useState<number>(18.50);
  const [metricsUpdateInterval, setMetricsUpdateInterval] = useState<number>(3000);
  const [customDomainEnabled, setCustomDomainEnabled] = useState<boolean>(false);
  const [customDomain, setCustomDomain] = useState<string>("");
  const [defaultTagline, setDefaultTagline] = useState<string>("Auditoría Financiera y Simulación de Ahorros");
  const [brandCard1Title, setBrandCard1Title] = useState<string>("");
  const [brandCard1Desc, setBrandCard1Desc] = useState<string>("");
  const [brandCard1Logo, setBrandCard1Logo] = useState<string>("");
  const [brandCard1Link, setBrandCard1Link] = useState<string>("");
  const [brandCard2Title, setBrandCard2Title] = useState<string>("");
  const [brandCard2Desc, setBrandCard2Desc] = useState<string>("");
  const [brandCard2Logo, setBrandCard2Logo] = useState<string>("");
  const [brandCard2Link, setBrandCard2Link] = useState<string>("");
  const [finalSlideMainLogo, setFinalSlideMainLogo] = useState<string>("");

  const [domainVerificationToken, setDomainVerificationToken] = useState<string>("");
  const [domainVerified, setDomainVerified] = useState<boolean>(false);
  const [domainVerifiedAt, setDomainVerifiedAt] = useState<string | undefined>(undefined);
  const [shareModalReport, setShareModalReport] = useState<Report | null>(null);
  const [globalConfig, setGlobalConfig] = useState<any>(null);
  const [verifyingDomainConfig, setVerifyingDomainConfig] = useState<boolean>(false);
  const [domainCheckMessage, setDomainCheckMessage] = useState<{ type: "success" | "error" | null; msg: string }>({ type: null, msg: "" });
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [templates, setTemplates] = useState<ComparisonTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [adminTab, setAdminTab] = useState<"reports" | "dashboard" | "config" | "profile" | "team" | "superadmin">("dashboard");
  const [teamSubTab, setTeamSubTab] = useState<"dashboard" | "members" | "settings" | "partners">("dashboard");
  const [selectedLiveMetricsReport, setSelectedLiveMetricsReport] = useState<Report | null>(null);

  // Teams States
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("team-default");
  const [isTeamSelectorOpen, setIsTeamSelectorOpen] = useState<boolean>(false);
  const [isCreatingNewTeam, setIsCreatingNewTeam] = useState<boolean>(false);
  const [newTeamName, setNewTeamName] = useState<string>("");

  // Search, Filter, Sort and View States
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterGmv, setFilterGmv] = useState<string>("all");
  const [filterVisits, setFilterVisits] = useState<string>("all");
  const [filterPeriod, setFilterPeriod] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name-asc");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isMobileSearchExpanded, setIsMobileSearchExpanded] = useState<boolean>(false);
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== "undefined" ? window.innerWidth : 1024);

  const [customGmvMin, setCustomGmvMin] = useState<string>("");
  const [customGmvMax, setCustomGmvMax] = useState<string>("");
  const [customVisitsMin, setCustomVisitsMin] = useState<string>("");
  const [customVisitsMax, setCustomVisitsMax] = useState<string>("");
  const [emailModalTarget, setEmailModalTarget] = useState<{ reportId: string; storeName: string; contactEmail: string } | null>(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/teams");
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
        if (data.length > 0 && !data.some((t: any) => t.id === selectedTeamId)) {
          setSelectedTeamId(data[0].id);
        }
      }
    } catch (e) {
      console.error("Error fetching teams", e);
    }
  };

  const handleUpdateTeam = async (updatedTeam: Team) => {
    try {
      const res = await fetch(`/api/teams/${updatedTeam.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTeam)
      });
      if (res.ok) {
        const data = await res.json();
        setTeams(prev => prev.map(t => t.id === data.id ? data : t));
      } else {
        alert("Error al actualizar el equipo");
      }
    } catch (e) {
      alert("Error de red al actualizar el equipo");
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setTeams(prev => prev.filter(t => t.id !== teamId));
        setSelectedTeamId("team-default");
        setAdminTab("dashboard");
      } else {
        alert("Error al eliminar el equipo");
      }
    } catch (e) {
      alert("Error de red al eliminar el equipo");
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTeamName })
      });
      if (res.ok) {
        const created = await res.json();
        setTeams(prev => [...prev, created]);
        setSelectedTeamId(created.id);
        setNewTeamName("");
        setIsCreatingNewTeam(false);
        setIsTeamSelectorOpen(false);
        alert(`Equipo "${created.name}" creado con éxito.`);
      } else {
        alert("Error al crear el equipo");
      }
    } catch (e) {
      alert("Error de red al crear el equipo");
    }
  };

  // Helper to calculate estimated monthly savings for the dashboard
  const calculateReportSavings = (report: Report, exchangeRate: number = 18.50): number => {
    let sumUSD = 0;
    let sumMXN = 0;
    report.tools?.forEach(t => {
      const cost = t.costType === "exact" ? t.costExact : t.costMax;
      if (t.currency === "USD") sumUSD += cost;
      else sumMXN += cost;
    });
    const convertedAppsCostMXN = sumUSD * exchangeRate + sumMXN;

    // Shopify Base Price
    let customShopifyPrice = 52;
    let customShopifyFee = 1.0;
    if (report.shopifyPlan === "basic") {
      customShopifyPrice = 19;
      customShopifyFee = 2.0;
    } else if (report.shopifyPlan === "grow") {
      customShopifyPrice = 52;
      customShopifyFee = 1.0;
    } else if (report.shopifyPlan === "advanced") {
      customShopifyPrice = 299;
      customShopifyFee = 0.6;
    } else if (report.shopifyPlan === "plus") {
      customShopifyPrice = 2000;
      customShopifyFee = 0.2;
    } else if (report.shopifyPlan === "custom") {
      customShopifyPrice = report.shopifyPlanCustomPrice || 52;
      customShopifyFee = report.shopifyPlanCustomFee !== undefined ? report.shopifyPlanCustomFee : 1.0;
    }

    const monthlyShopifyBaseMXN = customShopifyPrice * exchangeRate;
    const shopifyTransactionRate = customShopifyFee / 100;
    const shopifyTransactionFeeMXN = report.gmv * shopifyTransactionRate;

    const totalShopifyMonthlyCostMXN = monthlyShopifyBaseMXN + shopifyTransactionFeeMXN + convertedAppsCostMXN;

    // Tiendanube Base Price
    const planPrices: Record<string, number> = {
      basic: 149,
      tiendanube: 349,
      advanced: 999,
      evolution: 3999
    };
    const tiendanubeBaseMXN = planPrices[report.tiendanubePlan] || 349;

    return totalShopifyMonthlyCostMXN - tiendanubeBaseMXN;
  };

  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768;
    }
    return true;
  });

  // Branding Drag and Drop States
  const [isDraggingLogo, setIsDraggingLogo] = useState<boolean>(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [isDraggingFavicon, setIsDraggingFavicon] = useState<boolean>(false);
  const [faviconError, setFaviconError] = useState<string | null>(null);

  // User Profile States (Sincronizado dinámicamente con Auth0 / Modo Multi-usuario)
  const [userName, setUserName] = useState<string>(() => authUser?.name || "Usuario");
  const [userEmail, setUserEmail] = useState<string>(() => authUser?.email || "");
  const [userRole, setUserRole] = useState<string>(() => {
    const persisted = typeof window !== "undefined" ? localStorage.getItem("tlamatqui_persisted_role") : null;
    if (persisted === "Superusuario" || authUser?.role === "Superusuario") return "Superusuario";
    return authUser?.role || "Administrador";
  });
  const [userAvatar, setUserAvatar] = useState<string>(() => authUser?.picture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80");
  const [isDraggingAvatar, setIsDraggingAvatar] = useState<boolean>(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [savedProfile, setSavedProfile] = useState({
    name: authUser?.name || "Usuario",
    email: authUser?.email || "",
    role: (authUser?.role === "Superusuario" || (typeof window !== "undefined" && localStorage.getItem("tlamatqui_persisted_role") === "Superusuario")) ? "Superusuario" : (authUser?.role || "Administrador"),
    avatar: authUser?.picture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"
  });

  // Sincronizar dinámicamente los datos del perfil cuando el usuario autenticado en Auth0 cambie (PRESERVANDO ROL SUPERUSUARIO)
  useEffect(() => {
    if (authUser) {
      const activeName = authUser.name || (authUser.email ? authUser.email.split("@")[0] : "Usuario Auth0");
      const activeEmail = authUser.email || "";
      const persistedRole = typeof window !== "undefined" ? localStorage.getItem("tlamatqui_persisted_role") : null;
      const activeRole = (authUser.role === "Superusuario" || persistedRole === "Superusuario" || userRole === "Superusuario")
        ? "Superusuario"
        : (authUser.role || "Administrador");
      const activeAvatar = authUser.picture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80";

      setUserName(activeName);
      setUserEmail(activeEmail);
      setUserRole(activeRole);
      if (activeRole === "Superusuario" && typeof window !== "undefined") {
        localStorage.setItem("tlamatqui_persisted_role", "Superusuario");
      }
      setUserAvatar(activeAvatar);

      setSavedProfile({
        name: activeName,
        email: activeEmail,
        role: activeRole,
        avatar: activeAvatar
      });
    }
  }, [authUser]);

  const isProfileModified = 
    userName !== savedProfile.name ||
    userEmail !== savedProfile.email ||
    userRole !== savedProfile.role ||
    userAvatar !== savedProfile.avatar;

  const handleUndoProfile = () => {
    setUserName(savedProfile.name);
    setUserEmail(savedProfile.email);
    setUserRole(savedProfile.role);
    setUserAvatar(savedProfile.avatar);
    setAvatarError(null);
  };

  const processAvatarFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setAvatarError("Por favor selecciona un archivo de imagen válido (PNG, JPG, WEBP, GIF).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("La imagen es demasiado grande. El límite de tamaño es de 2 MB.");
      return;
    }

    setAvatarError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === "string") {
        setUserAvatar(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processAvatarFile(files[0]);
    }
  };

  const handleAvatarDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingAvatar(true);
  };

  const handleAvatarDragLeave = () => {
    setIsDraggingAvatar(false);
  };

  const handleAvatarDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingAvatar(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processAvatarFile(files[0]);
    }
  };

  const processLogoFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setLogoError("Por favor selecciona un archivo de imagen válido (PNG, JPG, WEBP, GIF).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError("La imagen es demasiado grande. El límite de tamaño es de 2 MB.");
      return;
    }

    setLogoError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === "string") {
        setAdminLogo(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processLogoFile(files[0]);
    }
  };

  const handleLogoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLogo(true);
  };

  const handleLogoDragLeave = () => {
    setIsDraggingLogo(false);
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLogo(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processLogoFile(files[0]);
    }
  };

  const processFaviconFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setFaviconError("Por favor selecciona un archivo de imagen válido (PNG, JPG, WEBP, GIF, ICO).");
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      setFaviconError("El favicon es demasiado grande. El límite de tamaño es de 1 MB.");
      return;
    }

    setFaviconError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === "string") {
        setAdminFavicon(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFaviconFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFaviconFile(files[0]);
    }
  };

  const handleFaviconDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFavicon(true);
  };

  const handleFaviconDragLeave = () => {
    setIsDraggingFavicon(false);
  };

  const handleFaviconDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFavicon(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFaviconFile(files[0]);
    }
  };

  // Form states
  const [editingReport, setEditingReport] = useState<Partial<Report> | null>(null);
  const [activeFormTab, setActiveFormTab] = useState<string>("metrics");
  const [isEditingComparison, setIsEditingComparison] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [scraperUrl, setScraperUrl] = useState<string>("");
  const [scraping, setScraping] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Template Form State
  const [saveTemplateName, setSaveTemplateName] = useState<string>("");

  // Tool Form State
  const [newTool, setNewTool] = useState<Partial<Tool>>({
    name: "",
    category: "Marketing & Automatización",
    costType: "exact",
    costExact: 0,
    costMin: 0,
    costMax: 0,
    currency: "USD",
    semaphore: "green",
    url: "",
    description: "",
    logo: ""
  });
  const [toolErrors, setToolErrors] = useState<Record<string, string>>({});
  const [isAddingToolOpen, setIsAddingToolOpen] = useState<boolean>(false);
  const [editingToolId, setEditingToolId] = useState<string | null>(null);

  // Fetch Reports and Templates
  useEffect(() => {
    fetchConfig();
    fetchReports();
    fetchTemplates();
    fetchTeams();
    
    // Auto-collapse sidebar on mobile screens
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsSidebarExpanded(false);
    }
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/config");
      const data = await res.json();
      setAdminLogo(data.adminLogoUrl || "");
      setAdminLogo2(data.adminLogo2Url || "");
      setAdminLogo3(data.adminLogo3Url || "");
      setAdminFavicon(data.adminFaviconUrl || "/favicon.ico");
      setAdminText(data.adminTextUrl || "Evolución Diagnostics");
      setDefaultContactEmail(data.defaultContactEmail || "cesar.ayar19@gmail.com");
      setDefaultContactWhatsapp(data.defaultContactWhatsapp || "5512345678");
      setCustomExchangeRate(Number(data.customExchangeRate) || 18.50);
      setMetricsUpdateInterval(data.metricsUpdateInterval !== undefined ? Number(data.metricsUpdateInterval) : 3000);
      setDefaultTagline(data.tagline || "Auditoría Financiera y Simulación de Ahorros");
      setBrandCard1Title(data.brandCard1Title || "");
      setBrandCard1Desc(data.brandCard1Desc || "");
      setBrandCard1Logo(data.brandCard1Logo || "");
      setBrandCard1Link(data.brandCard1Link || "");
      setBrandCard2Title(data.brandCard2Title || "");
      setBrandCard2Desc(data.brandCard2Desc || "");
      setBrandCard2Logo(data.brandCard2Logo || "");
      setBrandCard2Link(data.brandCard2Link || "");
      setFinalSlideMainLogo(data.finalSlideMainLogo || "");
      setGlobalConfig(data);
      setCustomDomainEnabled(Boolean(data.customDomainEnabled));
      setCustomDomain(data.customDomain || "");

      setDomainVerificationToken(data.domainVerificationToken || "");
      setDomainVerified(Boolean(data.domainVerified));
      setDomainVerifiedAt(data.domainVerifiedAt);
      
      const activeEmailKey = authUser?.email ? authUser.email.toLowerCase() : "";
      const perUserRole = (activeEmailKey && typeof window !== "undefined") ? localStorage.getItem(`tn_user_role_${activeEmailKey}`) : null;
      const globalPersistedRole = typeof window !== "undefined" ? localStorage.getItem("tlamatqui_persisted_role") : null;
      
      const loadedName = authUser?.name || "Usuario";
      const loadedEmail = authUser?.email || "";
      const loadedRole = authUser?.role || perUserRole || globalPersistedRole || "Administrador";
      const loadedAvatar = authUser?.picture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80";

      setUserName(loadedName);
      setUserEmail(loadedEmail);
      setUserRole(loadedRole);
      if (loadedRole === "Superusuario" && typeof window !== "undefined") {
        localStorage.setItem("tlamatqui_persisted_role", "Superusuario");
      }
      if (activeEmailKey && loadedRole && typeof window !== "undefined") {
        localStorage.setItem(`tn_user_role_${activeEmailKey}`, loadedRole);
      }
      setUserAvatar(loadedAvatar);
      
      setSavedProfile({
        name: loadedName,
        email: loadedEmail,
        role: loadedRole,
        avatar: loadedAvatar
      });

      // Fetch Prisma LogoConfig
      try {
        const logoRes = await fetch("/api/logo-config");
        if (logoRes.ok) {
          const logoData = await logoRes.json();
          setLogoType(logoData.logoType || "text");
          setLogoText(logoData.logoText || "Evolución Diagnostics");
          setLogoFile(logoData.logoFile || "");
          setGlobalEmail(logoData.globalEmail || authUser?.email || "");
        }
      } catch (err) {
        console.error("Error fetching logo-config", err);
      }
    } catch (e) {
      setAdminLogo("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80");
      setAdminLogo2("");
      setAdminLogo3("");
      setAdminFavicon("/favicon.ico");
      setAdminText("Evolución Diagnostics");
      setDefaultContactEmail(authUser?.email || "");
      setDefaultContactWhatsapp("5512345678");
      setCustomExchangeRate(18.50);
      setMetricsUpdateInterval(3000);
      setUserName(authUser?.name || "Usuario");
      setUserEmail(authUser?.email || "");
      const activeEmailKey = authUser?.email ? authUser.email.toLowerCase() : "";
      const perUserRole = (activeEmailKey && typeof window !== "undefined") ? localStorage.getItem(`tn_user_role_${activeEmailKey}`) : null;
      const globalPersistedRole = typeof window !== "undefined" ? localStorage.getItem("tlamatqui_persisted_role") : null;
      const fallbackRole = authUser?.role || perUserRole || globalPersistedRole || "Administrador";
      setUserRole(fallbackRole);
      setUserAvatar(authUser?.picture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80");
      
      setSavedProfile({
        name: authUser?.name || "Usuario",
        email: authUser?.email || "",
        role: fallbackRole,
        avatar: authUser?.picture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"
      });
    }
  };

  // Guardia de navegación: Redirigir a usuarios no-superusuario fuera del Centro Superusuario
  useEffect(() => {
    const isSuperUser = authUser?.role === "Superusuario" || userRole === "Superusuario";
    if (adminTab === "superadmin" && !isSuperUser) {
      setAdminTab("dashboard");
    }
    if (userRole === "Agente") {
      if (adminTab === "config") setAdminTab("dashboard");
      if (teamSubTab !== "dashboard") setTeamSubTab("dashboard");
    }
  }, [userRole, authUser, adminTab, teamSubTab]);



  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-User-Role": userRole || authUser?.role || "Administrador"
        },
        body: JSON.stringify({
          adminLogoUrl: adminLogo,
          adminLogo2Url: adminLogo2,
          adminLogo3Url: adminLogo3,
          adminFaviconUrl: adminFavicon,
          adminTextUrl: adminText,
          defaultContactEmail,
          defaultContactWhatsapp,
          customExchangeRate: Number(customExchangeRate) || 18.50,
          metricsUpdateInterval: Number(metricsUpdateInterval) || 3000,
          tagline: defaultTagline,
          brandCard1Title,
          brandCard1Desc,
          brandCard1Logo,
          brandCard1Link,
          brandCard2Title,
          brandCard2Desc,
          brandCard2Logo,
          brandCard2Link,
          finalSlideMainLogo,
          customDomainEnabled,
          customDomain
        })
      });

      // Save Prisma LogoConfig
      await fetch("/api/logo-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logoType,
          logoText,
          logoFile,
          globalEmail
        })
      });
      if (res.ok) {
        alert("¡Configuración guardada correctamente y dominio auto-registrado en Vercel!");
        fetchConfig();
      } else {
        alert("Error al guardar la configuración.");
      }
    } catch (e) {
      alert("Error al conectar con el servidor.");
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleVerifyDomainDNS = async () => {
    if (!customDomain) return;
    setVerifyingDomainConfig(true);
    setDomainCheckMessage({ type: null, msg: "" });
    try {
      const res = await fetch("/api/config/verify-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: customDomain })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDomainCheckMessage({ type: "success", msg: data.message });
        setDomainVerified(true);
        setDomainVerifiedAt(new Date().toISOString());
      } else {
        setDomainCheckMessage({ type: "error", msg: data.message || "No se pudo verificar el registro TXT." });
      }
    } catch (e: any) {
      setDomainCheckMessage({ type: "error", msg: "Error al verificar el dominio." });
    } finally {
      setVerifyingDomainConfig(false);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/reports");
      const data = await res.json();
      setReports(data);
    } catch (e) {
      setErrorMessage("No se pudieron cargar los reportes de diagnóstico.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/templates");
      const data = await res.json();
      setTemplates(data);
    } catch (e) {
      console.error("Error cargando plantillas comparativas", e);
    }
  };

  // Scraper Trigger
  const handleScrapeStore = async () => {
    if (!scraperUrl) return;
    setScraping(true);
    try {
      const result = await scrapeShopifyStore(scraperUrl);
      if (result.success && result.apps.length > 0) {
        // Map scraped apps to tools
        const scrapedTools: Tool[] = result.apps.map((app, index) => ({
          id: `scraped-${Date.now()}-${index}`,
          name: app.name,
          category: app.category,
          costType: app.costType,
          costExact: app.costEstimate || 0,
          costMin: app.costMin || 0,
          costMax: app.costMax || 0,
          currency: app.currency,
          semaphore: app.semaphore,
          url: app.url,
          description: app.description,
          logo: app.logo || ""
        }));

        setEditingReport(prev => ({
          ...prev,
          tools: [...(prev?.tools || []), ...scrapedTools]
        }));
        setScraperUrl("");
        alert(`¡Scrape completado! Se han detectado e importado ${scrapedTools.length} aplicaciones.`);
      } else {
        alert("El scrapper no pudo extraer aplicaciones válidas para este dominio.");
      }
    } catch (e) {
      alert("Error al ejecutar el scraper.");
    } finally {
      setScraping(false);
    }
  };

  // Start Editing Tool
  const handleStartEditTool = (tool: Tool) => {
    setEditingToolId(tool.id);
    setNewTool({
      name: tool.name,
      category: tool.category,
      costType: tool.costType,
      costExact: tool.costExact,
      costMin: tool.costMin,
      costMax: tool.costMax,
      currency: tool.currency,
      semaphore: tool.semaphore,
      url: tool.url || "",
      description: tool.description || "",
      logo: tool.logo || ""
    });
    setToolErrors({});
    setIsAddingToolOpen(true);
  };

  // Add or Update Manual Tool Validation & Insertion
  const handleAddManualTool = () => {
    const errors: Record<string, string> = {};
    if (!newTool.name?.trim()) errors.name = "El nombre es obligatorio";
    if (!newTool.category?.trim()) errors.category = "La categoría es obligatoria";
    
    if (newTool.costType === "exact") {
      if (Number(newTool.costExact) < 0) errors.costExact = "El costo no puede ser negativo";
    } else {
      if (Number(newTool.costMin) < 0) errors.costMin = "El costo mínimo no puede ser negativo";
      if (Number(newTool.costMax) < Number(newTool.costMin)) errors.costMax = "El costo máximo debe ser mayor al mínimo";
    }

    if (newTool.url && !newTool.url.match(/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/)) {
      errors.url = "URL inválida";
    }

    if (Object.keys(errors).length > 0) {
      setToolErrors(errors);
      return;
    }

    setToolErrors({});
    const originalTool = editingToolId ? (editingReport.tools || []).find(t => t.id === editingToolId) : null;

    const toolToInsert: Tool = {
      id: editingToolId || `manual-${Date.now()}`,
      name: originalTool ? originalTool.name : (newTool.name || ""),
      category: originalTool ? originalTool.category : (newTool.category || "Marketing"),
      costType: newTool.costType as "exact" | "range",
      costExact: Number(newTool.costExact) || 0,
      costMin: Number(newTool.costMin) || 0,
      costMax: Number(newTool.costMax) || 0,
      currency: newTool.currency as "USD" | "MXN",
      semaphore: originalTool ? originalTool.semaphore : (newTool.semaphore as "green" | "yellow" | "red"),
      url: originalTool ? originalTool.url : newTool.url,
      description: originalTool ? originalTool.description : newTool.description,
      logo: originalTool ? originalTool.logo : (newTool.logo || "")
    };

    setEditingReport(prev => ({
      ...prev,
      tools: editingToolId
        ? (prev?.tools || []).map(t => t.id === editingToolId ? toolToInsert : t)
        : [...(prev?.tools || []), toolToInsert]
    }));

    setEditingToolId(null);
    setIsAddingToolOpen(false);

    // Reset Tool form
    setNewTool({
      name: "",
      category: "Marketing & Automatización",
      costType: "exact",
      costExact: 0,
      costMin: 0,
      costMax: 0,
      currency: "USD",
      semaphore: "green",
      url: "",
      description: "",
      logo: ""
    });
  };

  // Remove Tool
  const handleRemoveTool = (toolId: string) => {
    setEditingReport(prev => ({
      ...prev,
      tools: (prev?.tools || []).filter(t => t.id !== toolId)
    }));
  };

  // Comparison row helpers
  const handleAddComparisonRow = () => {
    const newRow: ComparisonRow = {
      id: `row-${Date.now()}`,
      variable: "Nueva Variable",
      shopify: "Detalle Shopify",
      tiendanube: "Detalle Tiendanube",
      pillText: "Diferenciador"
    };
    setEditingReport(prev => ({
      ...prev,
      comparisonRows: [...(prev?.comparisonRows || []), newRow]
    }));
  };

  const handleUpdateComparisonRow = (id: string, field: keyof ComparisonRow, val: string) => {
    setEditingReport(prev => ({
      ...prev,
      comparisonRows: (prev?.comparisonRows || []).map(r => r.id === id ? { ...r, [field]: val } : r)
    }));
  };

  const handleRemoveComparisonRow = (id: string) => {
    setEditingReport(prev => ({
      ...prev,
      comparisonRows: (prev?.comparisonRows || []).filter(r => r.id !== id)
    }));
  };

  // Save Comparison Table as Template
  const handleSaveAsTemplate = async () => {
    if (!saveTemplateName.trim()) {
      alert("Por favor escribe un nombre para la plantilla.");
      return;
    }
    const rows = editingReport?.comparisonRows || [];
    if (rows.length === 0) {
      alert("No hay filas para guardar en la plantilla.");
      return;
    }

    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: saveTemplateName,
          rows: rows
        })
      });
      if (res.ok) {
        setSaveTemplateName("");
        alert("¡Plantilla comparativa guardada con éxito!");
        fetchTemplates();
      }
    } catch (e) {
      alert("Error al guardar la plantilla.");
    }
  };

  // Load Comparison Template
  const handleLoadTemplate = (template: ComparisonTemplate) => {
    setEditingReport(prev => ({
      ...prev,
      comparisonRows: template.rows.map((r, i) => ({
        ...r,
        id: `template-row-${Date.now()}-${i}`
      }))
    }));
    alert(`Plantilla "${template.name}" cargada correctamente.`);
  };

  // Initiate Create - Open Chismógrafo Audit Modal
  const handleStartCreate = () => {
    setIsCreateModalOpen(true);
  };

  // Create report manually (empty template)
  const handleCreateManual = () => {
    setIsCreateModalOpen(false);
    setAdminTab("reports");
    setSelectedLiveMetricsReport(null);
    setEditingReport({
      name: "",
      logo: "",
      teamId: selectedTeamId,
      tagline: "Hemos detectado fugas operativas que impactan tu margen neto.",
      fugasCantidad: 3,
      fugasRangoMin: 10000,
      fugasRangoMax: 35000,
      visitasMensuales: 20000,
      gmv: 150000,
      shopifyFee: 5000,
      msi: "3 y 6 meses sin intereses",
      shopifyPlan: "basic",
      shopifyPlanCustomFee: 2.0,
      shopifyPlanCustomPrice: 19,
      tiendanubePlan: "tiendanube",
      tools: [],
      comparisonRows: [
        { id: "row-1", variable: "Facturación", shopify: "Pesificada en USD + 16% IVA", tiendanube: "100% Pesificada en MXN Factura Local", pillText: "Ahorro Fiscal" },
        { id: "row-2", variable: "Soporte", shopify: "Bot automatizado en inglés", tiendanube: "Asesor humano vía WhatsApp local", pillText: "Soporte Humano" }
      ],
      contactEmail: defaultContactEmail || "comercial@tiendanube.mx",
      contactWhatsapp: defaultContactWhatsapp || "5512345678",
      adminLogos: [
        "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=100&q=80",
        "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=100&q=80",
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=100&q=80"
      ]
    });
    setIsEditingComparison(false);
    setActiveFormTab("general");
  };

  // Callback when Chismógrafo finishes auditing a store
  const handleAuditComplete = (auditResult: ChismografoAuditResult) => {
    setIsCreateModalOpen(false);
    setAdminTab("reports");
    setSelectedLiveMetricsReport(null);

    const tools: Tool[] = auditResult.apps.map((app, index) => ({
      id: `chismo-${Date.now()}-${index}`,
      name: app.name,
      category: app.category,
      costType: app.costType,
      costExact: app.costEstimate || 0,
      costMin: app.costMin || 0,
      costMax: app.costMax || 0,
      currency: app.currency || "USD",
      semaphore: app.semaphore || "yellow",
      url: app.url,
      description: app.description,
      logo: app.logo || ""
    }));

    const estimatedMonthlyCost = auditResult.estimatedMonthlyAppCostUSD || tools.reduce((acc, t) => acc + t.costExact, 0);

    setEditingReport({
      name: auditResult.storeName || "",
      businessUrl: auditResult.url || "",
      logo: auditResult.siteLogo || "",
      teamId: selectedTeamId,
      tagline: `Hemos detectado ${tools.length} aplicaciones operativas y oportunidades de ahorro en ${auditResult.storeName}.`,
      fugasCantidad: tools.length || 3,
      fugasRangoMin: Math.max(10000, Math.round(estimatedMonthlyCost * 15)),
      fugasRangoMax: Math.max(35000, Math.round(estimatedMonthlyCost * 35)),
      visitasMensuales: 25000,
      gmv: 250000,
      shopifyFee: 6500,
      msi: "3 y 6 meses sin intereses",
      shopifyPlan: auditResult.shopifyPlanEstimate || "basic",
      shopifyPlanCustomFee: 2.0,
      shopifyPlanCustomPrice: 19,
      shopifyAppsCostUSD: estimatedMonthlyCost,
      shopifyAppsCostMXN: Math.round(estimatedMonthlyCost * 18.5),
      tiendanubePlan: "tiendanube",
      tools,
      comparisonRows: [
        { id: "row-1", variable: "Facturación", shopify: "Pesificada en USD + 16% IVA", tiendanube: "100% Pesificada en MXN Factura Local", pillText: "Ahorro Fiscal" },
        { id: "row-2", variable: "Soporte", shopify: "Bot automatizado en inglés", tiendanube: "Asesor humano vía WhatsApp local", pillText: "Soporte Humano" },
        { id: "row-3", variable: "Pasarelas de Pago", shopify: auditResult.paymentGateways && auditResult.paymentGateways.length > 0 ? `Integradas: ${auditResult.paymentGateways.join(", ")} (Comisión adicional)` : "Comisión adicional por pasarela externa", tiendanube: "0% comisión por transacción con Pago Nube", pillText: "0% Comisiones" }
      ],
      contactEmail: defaultContactEmail || "comercial@tiendanube.mx",
      contactWhatsapp: defaultContactWhatsapp || "5512345678",
      adminLogos: [
        "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=100&q=80",
        "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=100&q=80",
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=100&q=80"
      ]
    });
    setIsEditingComparison(false);
    setActiveFormTab("general");
  };

  // Initiate Edit
  const handleStartEdit = (report: Report) => {
    setEditingReport({ ...report });
    setIsEditingComparison(false);
    setActiveFormTab("general");
  };

  // Save Report
  const handleSaveReport = async () => {
    if (!editingReport.name?.trim()) {
      alert("Por favor escribe el nombre del comercio.");
      return;
    }

    const isNew = !reports.some(r => r.id === editingReport.id);
    const url = isNew ? "/api/reports" : `/api/reports/${editingReport.id}`;
    const method = isNew ? "POST" : "PUT";

    const reportToSave: Report = {
      ...editingReport,
      id: editingReport.id || `rep_${Date.now()}`,
      createdBy: editingReport.createdBy || userEmail,
      contactEmail: editingReport.contactEmail || userEmail
    } as Report;


    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportToSave)
      });


      if (res.ok) {
        setEditingReport(null);
        fetchReports();
        alert(`Reporte de diagnóstico guardado con éxito.`);
      } else {
        alert("Ocurrió un error al guardar el diagnóstico.");
      }
    } catch (e) {
      alert("Error de red al guardar el reporte.");
    }
  };

  // Delete Report
  const handleDeleteReport = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este reporte de diagnóstico?")) return;
    try {
      const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchReports();
        alert("Reporte eliminado correctamente.");
      }
    } catch (e) {
      alert("No se pudo eliminar el reporte.");
    }
  };

  // Copy Link Helper / Share Modal Activator
  const handleCopyLink = (id: string) => {
    const targetReport = reports.find(r => r.id === id) || null;
    if (targetReport) {
      setShareModalReport(targetReport);
    } else {
      const reportLink = `${window.location.origin}/?report=${id}&shared=true`;
      navigator.clipboard.writeText(reportLink);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const activeTeam = teams.find(t => t.id === selectedTeamId) || teams[0] || null;
  const filteredReports = reports.filter(r => {
    // Si el usuario es Agente, restringir los reportes exclusivamente a los creados por él
    if (userRole === "Agente") {
      const isCreator = (r.createdBy && r.createdBy.toLowerCase() === userEmail.toLowerCase()) || 
                        (r.contactEmail && r.contactEmail.toLowerCase() === userEmail.toLowerCase());
      if (!isCreator) return false;
    }
    if (selectedTeamId === "team-default") {
      return !r.teamId || r.teamId === "team-default";
    }
    return r.teamId === selectedTeamId;
  });


  const processedReports = filteredReports.filter(report => {
    // 1. Search term match (comercio, ID, or tagline)
    const term = searchTerm.toLowerCase().trim();
    if (term) {
      const nameMatch = report.name?.toLowerCase().includes(term);
      const idMatch = report.id?.toLowerCase().includes(term);
      const taglineMatch = report.tagline?.toLowerCase().includes(term);
      if (!nameMatch && !idMatch && !taglineMatch) {
        return false;
      }
    }

    // 2. GMV range filter
    if (filterGmv === "low") {
      if (report.gmv >= 100000) return false;
    } else if (filterGmv === "medium") {
      if (report.gmv < 100000 || report.gmv > 500000) return false;
    } else if (filterGmv === "high") {
      if (report.gmv <= 500000) return false;
    } else if (filterGmv === "custom") {
      const min = Number(customGmvMin);
      const max = Number(customGmvMax);
      if (customGmvMin && report.gmv < min) return false;
      if (customGmvMax && report.gmv > max) return false;
    }

    // 3. Visits filter
    if (filterVisits === "small") {
      if (report.visitasMensuales >= 10000) return false;
    } else if (filterVisits === "medium") {
      if (report.visitasMensuales < 10000 || report.visitasMensuales > 50000) return false;
    } else if (filterVisits === "large") {
      if (report.visitasMensuales <= 50000) return false;
    } else if (filterVisits === "custom") {
      const min = Number(customVisitsMin);
      const max = Number(customVisitsMax);
      if (customVisitsMin && report.visitasMensuales < min) return false;
      if (customVisitsMax && report.visitasMensuales > max) return false;
    }

    // 4. Report creation time period filter
    if (filterPeriod !== "all") {
      const reportDate = report.createdAt ? new Date(report.createdAt) : new Date();
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - reportDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (filterPeriod === "today") {
        if (diffDays > 1 && reportDate.toDateString() !== now.toDateString()) return false;
      } else if (filterPeriod === "week") {
        if (diffDays > 7) return false;
      } else if (filterPeriod === "month") {
        if (diffDays > 30) return false;
      } else if (filterPeriod === "year") {
        if (diffDays > 365) return false;
      }
    }

    return true;
  }).sort((a, b) => {
    // 5. Sorting options
    if (sortBy === "name-asc") {
      return a.name.localeCompare(b.name);
    } else if (sortBy === "name-desc") {
      return b.name.localeCompare(a.name);
    } else if (sortBy === "gmv-desc") {
      return b.gmv - a.gmv;
    } else if (sortBy === "gmv-asc") {
      return a.gmv - b.gmv;
    } else if (sortBy === "visits-desc") {
      return b.visitasMensuales - a.visitasMensuales;
    } else if (sortBy === "visits-asc") {
      return a.visitasMensuales - b.visitasMensuales;
    }
    return 0;
  });

  return (
    <div className="min-h-screen transition-colors duration-200 bg-bg-theme text-white font-sans flex flex-col md:flex-row">
      
      {/* Sidebar navigation */}
      <aside className={`bg-surface-theme/95 backdrop-blur-md flex flex-col justify-between transition-all duration-300 ease-in-out z-50 shrink-0 ${isSidebarExpanded ? "fixed inset-0 w-full h-screen md:sticky md:top-0 md:h-screen md:w-64 border-b md:border-b-0 md:border-r border-border-theme" : "hidden md:flex md:sticky md:top-0 md:h-screen md:w-20 border-r border-border-theme"}`}>
        <div>
          {/* Sidebar Header */}
          {isSidebarExpanded ? (
            <div className="p-4 border-b border-border-theme flex items-center justify-between overflow-hidden">
              <div className="flex items-center gap-3">
                {adminLogo && adminLogo.toLowerCase() !== "none" ? (
                  <div className="flex items-center">
                    <img 
                      src={adminLogo} 
                      alt={adminText || "Logo"} 
                      className="h-8 max-w-[140px] object-contain rounded border border-border-theme bg-surface-theme/30 p-0.5"
                      onError={(e) => { 
                        (e.target as HTMLElement).style.display = "none";
                        const fallback = document.getElementById("sidebar-fallback-text");
                        if (fallback) fallback.style.display = "block";
                      }}
                    />
                    <div id="sidebar-fallback-text" className="hidden">
                      <h1 className="text-sm font-bold tracking-tight text-white truncate">
                        {adminText || "Tlachiālōyan"}
                      </h1>
                    </div>
                  </div>
                ) : (
                  <h1 className="text-sm font-bold tracking-tight text-white truncate">
                    {adminText || "Tlachiālōyan"}
                  </h1>
                )}
              </div>

              {/* Toggle Button for collapsing/expanding sidebar */}
              <button
                onClick={() => setIsSidebarExpanded(false)}
                className="p-1.5 rounded-lg border border-border-theme bg-bg-theme hover:bg-surface-hover-theme text-text-dim-theme hover:text-white transition-all cursor-pointer ml-auto"
                title="Colapsar menú"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-4 border-b border-border-theme flex flex-col items-center justify-center gap-4 overflow-hidden">
              <button
                onClick={() => setIsSidebarExpanded(true)}
                className="relative group cursor-pointer flex items-center justify-center"
                title="Expandir menú"
              >
                <img 
                  src={adminFavicon || "/favicon.ico"} 
                  alt="Favicon Logo" 
                  className="w-8 h-8 rounded-lg object-contain border border-border-theme bg-surface-theme/50 p-1 group-hover:scale-110 transition-transform"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                    const fallback = document.getElementById("collapsed-fallback-logo");
                    if (fallback) fallback.classList.remove("hidden");
                  }}
                />
                <div id="collapsed-fallback-logo" className="hidden w-8 h-8 rounded-lg bg-accent-theme/10 border border-accent-theme/35 flex items-center justify-center font-bold text-accent-theme text-[10px] select-none">
                  EV
                </div>
              </button>
            </div>
          )}

          {/* Team Selector in Sidebar */}
          {isSidebarExpanded ? (
            /* Team Selector in Expanded Sidebar */
            <div className="px-4 py-3.5 border-b border-border-theme/40 relative">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dim-theme mb-1.5 select-none">
                Equipo de Trabajo
              </label>
              <button
                onClick={() => setIsTeamSelectorOpen(!isTeamSelectorOpen)}
                className="w-full flex items-center justify-between gap-2.5 p-2 rounded-xl bg-bg-theme border border-border-theme/80 hover:border-text-dim-theme transition-all cursor-pointer text-left group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6.5 h-6.5 rounded-lg overflow-hidden border border-border-theme bg-surface-theme shrink-0 flex items-center justify-center">
                    {activeTeam?.image ? (
                      <img src={activeTeam.image} alt={activeTeam.name} className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-3.5 h-3.5 text-accent-theme" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-white truncate">{activeTeam?.name || "Cargando..."}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-text-dim-theme group-hover:text-white transition-transform shrink-0 ${isTeamSelectorOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Team Dropdown Menu */}
              {isTeamSelectorOpen && (
                <div className="absolute left-4 right-4 top-full mt-1 bg-surface-theme border border-border-theme/90 rounded-xl shadow-2xl p-1.5 z-50 space-y-1.5 max-h-64 overflow-y-auto">
                  <div className="space-y-1">
                    {teams.map(team => {
                      const isSelected = team.id === selectedTeamId;
                      return (
                        <button
                          key={team.id}
                          onClick={() => {
                            setSelectedTeamId(team.id);
                            setIsTeamSelectorOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                            isSelected 
                              ? "bg-accent-theme/15 text-accent-theme font-bold border border-accent-theme/25" 
                              : "text-text-dim-theme hover:text-white hover:bg-bg-theme border border-transparent"
                          }`}
                        >
                          <div className="w-5.5 h-5.5 rounded overflow-hidden border border-border-theme shrink-0 flex items-center justify-center">
                            {team.image ? (
                              <img src={team.image} alt={team.name} className="w-full h-full object-cover" />
                            ) : (
                              <Users className="w-3 text-accent-theme" />
                            )}
                          </div>
                          <span className="truncate flex-1">{team.name}</span>
                          {isSelected && <CheckCircle className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Create team container inside selector */}
                  <div className="border-t border-border-theme/40 pt-1.5 px-1 pb-1">
                    {isCreatingNewTeam ? (
                      <form onSubmit={handleCreateTeam} className="space-y-1.5">
                        <input
                          type="text"
                          required
                          placeholder="Nombre del nuevo equipo"
                          value={newTeamName}
                          onChange={e => setNewTeamName(e.target.value)}
                          className="w-full text-[11px] px-2 py-1.5 rounded bg-bg-theme border border-border-theme text-white outline-none focus:ring-1 focus:ring-accent-theme"
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <button
                            type="submit"
                            className="flex-1 text-[10px] font-bold py-1 bg-accent-theme hover:bg-accent-theme/90 text-white rounded cursor-pointer"
                          >
                            Crear
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsCreatingNewTeam(false)}
                            className="flex-1 text-[10px] font-bold py-1 bg-bg-theme border border-border-theme text-text-dim-theme hover:text-white rounded cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => setIsCreatingNewTeam(true)}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-border-theme hover:border-accent-theme bg-bg-theme/40 text-text-dim-theme hover:text-accent-theme text-[10px] font-bold transition-all cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Crear equipo</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Team Selector in Collapsed Sidebar */
            <div className="py-2.5 border-b border-border-theme/40 relative flex items-center justify-center">
              <button
                onClick={() => {
                  setIsSidebarExpanded(true);
                  setIsTeamSelectorOpen(true);
                }}
                className="w-10 h-10 rounded-xl overflow-hidden border border-border-theme hover:border-accent-theme bg-bg-theme shrink-0 flex items-center justify-center cursor-pointer transition-all relative group"
                title={`Equipo: ${activeTeam?.name}`}
              >
                {activeTeam?.image ? (
                  <img src={activeTeam.image} alt={activeTeam.name} className="w-full h-full object-cover" />
                ) : (
                  <Users className="w-5 h-5 text-accent-theme" />
                )}
                {/* Tooltip */}
                <div className="absolute left-14 px-2 py-1.5 rounded-lg bg-surface-theme border border-border-theme text-[10px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none shadow-xl z-50">
                  Equipo: {activeTeam?.name}
                </div>
              </button>
            </div>
          )}

          {/* Navigation Links */}
          {isSidebarExpanded ? (
            <div className="p-3 space-y-1">
              <button
                onClick={() => {
                  setAdminTab("dashboard");
                  if (editingReport) setEditingReport(null);
                  setSelectedLiveMetricsReport(null);
                  if (window.innerWidth < 768) setIsSidebarExpanded(false);
                }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  adminTab === "dashboard" && !editingReport
                    ? "bg-accent-theme text-white shadow-md shadow-accent-theme/10"
                    : "text-text-dim-theme hover:text-white hover:bg-surface-hover-theme"
                }`}
                title="Dashboard Global"
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => {
                  setAdminTab("reports");
                  if (editingReport) setEditingReport(null);
                  setSelectedLiveMetricsReport(null);
                  if (window.innerWidth < 768) setIsSidebarExpanded(false);
                }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  adminTab === "reports" && !editingReport
                    ? "bg-accent-theme text-white shadow-md shadow-accent-theme/10"
                    : "text-text-dim-theme hover:text-white hover:bg-surface-hover-theme"
                }`}
                title="Diagnósticos de Comercio"
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span>Diagnósticos</span>
              </button>

              <div className="space-y-1">
                <button
                  onClick={() => {
                    setAdminTab("team");
                    if (editingReport) setEditingReport(null);
                    setSelectedLiveMetricsReport(null);
                    if (window.innerWidth < 768) setIsSidebarExpanded(false);
                  }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    adminTab === "team" && !editingReport
                      ? "bg-accent-theme text-white shadow-md shadow-accent-theme/10"
                      : "text-text-dim-theme hover:text-white hover:bg-surface-hover-theme"
                  }`}
                  title="Mi Equipo"
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span>Mi Equipo</span>
                </button>

                {/* Submenu for Superusuario Central Console */}
                {(userRole === "Superusuario" || authUser?.role === "Superusuario") && (
                  <button
                    onClick={() => {
                      setAdminTab("superadmin");
                      setEditingReport(null);
                      setSelectedLiveMetricsReport(null);
                      if (window.innerWidth < 768) setIsSidebarExpanded(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      adminTab === "superadmin" && !editingReport
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md shadow-amber-500/10"
                        : "text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10"
                    }`}
                    title="Centro de Salud, Monitoreo y API Superusuario"
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Centro Superusuario</span>
                    <span className="ml-auto text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300 border border-amber-500/40">
                      SU
                    </span>
                  </button>
                )}

                {/* Submenu for team items inside AdminPanel sidebar */}
                {adminTab === "team" && !editingReport && userRole !== "Agente" && (
                  <div className="pl-6 pr-2 py-1 space-y-1 ml-4 border-l border-border-theme/40 animate-fade-in">
                    <button
                      onClick={() => {
                        setTeamSubTab("dashboard");
                        if (window.innerWidth < 768) setIsSidebarExpanded(false);
                      }}
                      className={`w-full flex items-center gap-2 py-1.5 px-2 rounded-md font-medium text-[11px] transition-all cursor-pointer ${
                        teamSubTab === "dashboard"
                          ? "bg-accent-theme/15 text-accent-theme font-bold"
                          : "text-text-dim-theme hover:text-white hover:bg-surface-hover-theme"
                      }`}
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 shrink-0 text-current" />
                      <span>Dashboard</span>
                    </button>
                    <button
                      onClick={() => {
                        setTeamSubTab("members");
                        if (window.innerWidth < 768) setIsSidebarExpanded(false);
                      }}
                      className={`w-full flex items-center gap-2 py-1.5 px-2 rounded-md font-medium text-[11px] transition-all cursor-pointer ${
                        teamSubTab === "members"
                          ? "bg-accent-theme/15 text-accent-theme font-bold"
                          : "text-text-dim-theme hover:text-white hover:bg-surface-hover-theme"
                      }`}
                    >
                      <Users className="w-3.5 h-3.5 shrink-0 text-current" />
                      <span>Miembros</span>
                    </button>
                    <button
                      onClick={() => {
                        setTeamSubTab("settings");
                        if (window.innerWidth < 768) setIsSidebarExpanded(false);
                      }}
                      className={`w-full flex items-center gap-2 py-1.5 px-2 rounded-md font-medium text-[11px] transition-all cursor-pointer ${
                        teamSubTab === "settings"
                          ? "bg-accent-theme/15 text-accent-theme font-bold"
                          : "text-text-dim-theme hover:text-white hover:bg-surface-hover-theme"
                      }`}
                    >
                      <Settings className="w-3.5 h-3.5 shrink-0 text-current" />
                      <span>Configuración del reporte</span>
                    </button>
                    <button
                      onClick={() => {
                        setTeamSubTab("partners");
                        if (window.innerWidth < 768) setIsSidebarExpanded(false);
                      }}
                      className={`w-full flex items-center gap-2 py-1.5 px-2 rounded-md font-medium text-[11px] transition-all cursor-pointer ${
                        teamSubTab === "partners"
                          ? "bg-accent-theme/15 text-accent-theme font-bold"
                          : "text-text-dim-theme hover:text-white hover:bg-surface-hover-theme"
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 shrink-0 text-current" />
                      <span>Socios / Branding</span>
                    </button>
                  </div>
                )}
              </div>

              {userRole !== "Agente" && (
                <button
                  onClick={() => {
                    setAdminTab("config");
                    if (editingReport) setEditingReport(null);
                    setSelectedLiveMetricsReport(null);
                    if (window.innerWidth < 768) setIsSidebarExpanded(false);
                  }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    adminTab === "config" && !editingReport
                      ? "bg-accent-theme text-white shadow-md shadow-accent-theme/10"
                      : "text-text-dim-theme hover:text-white hover:bg-surface-hover-theme"
                  }`}
                  title="Configuración de Sistema"
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  <span>Configuración</span>
                </button>
              )}

            </div>
          ) : (
            <div className="p-3 flex flex-col items-center gap-3 animate-fade-in">
              <button
                onClick={() => {
                  setAdminTab("dashboard");
                  if (editingReport) setEditingReport(null);
                  setSelectedLiveMetricsReport(null);
                }}
                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all cursor-pointer relative group ${
                  adminTab === "dashboard" && !editingReport
                    ? "bg-accent-theme text-white shadow-md shadow-accent-theme/20"
                    : "text-text-dim-theme hover:text-white hover:bg-surface-hover-theme border border-transparent hover:border-border-theme/40"
                }`}
                title="Dashboard Global"
              >
                <LayoutDashboard className="w-5 h-5 shrink-0" />
                
                {/* Tooltip */}
                <div className="absolute left-14 px-2 py-1.5 rounded-lg bg-surface-theme border border-border-theme text-[10px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none shadow-xl z-50">
                  Dashboard
                </div>
              </button>

              <button
                onClick={() => {
                  setAdminTab("reports");
                  if (editingReport) setEditingReport(null);
                  setSelectedLiveMetricsReport(null);
                }}
                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all cursor-pointer relative group ${
                  adminTab === "reports" && !editingReport
                    ? "bg-accent-theme text-white shadow-md shadow-accent-theme/20"
                    : "text-text-dim-theme hover:text-white hover:bg-surface-hover-theme border border-transparent hover:border-border-theme/40"
                }`}
                title="Diagnósticos de Comercio"
              >
                <FileText className="w-5 h-5 shrink-0" />
                
                {/* Tooltip */}
                <div className="absolute left-14 px-2 py-1.5 rounded-lg bg-surface-theme border border-border-theme text-[10px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none shadow-xl z-50">
                  Diagnósticos
                </div>
              </button>

              <button
                onClick={() => {
                  setAdminTab("team");
                  if (editingReport) setEditingReport(null);
                  setSelectedLiveMetricsReport(null);
                }}
                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all cursor-pointer relative group ${
                  adminTab === "team" && !editingReport
                    ? "bg-accent-theme text-white shadow-md shadow-accent-theme/20"
                    : "text-text-dim-theme hover:text-white hover:bg-surface-hover-theme border border-transparent hover:border-border-theme/40"
                }`}
                title="Mi Equipo"
              >
                <Users className="w-5 h-5 shrink-0" />
                
                {/* Tooltip */}
                <div className="absolute left-14 px-2 py-1.5 rounded-lg bg-surface-theme border border-border-theme text-[10px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none shadow-xl z-50">
                  Mi Equipo
                </div>
              </button>

              <button
                onClick={() => {
                  setAdminTab("config");
                  if (editingReport) setEditingReport(null);
                  setSelectedLiveMetricsReport(null);
                }}
                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all cursor-pointer relative group ${
                  adminTab === "config" && !editingReport
                    ? "bg-accent-theme text-white shadow-md shadow-accent-theme/20"
                    : "text-text-dim-theme hover:text-white hover:bg-surface-hover-theme border border-transparent hover:border-border-theme/40"
                }`}
                title="Configuración de Sistema"
              >
                <Settings className="w-5 h-5 shrink-0" />
                
                {/* Tooltip */}
                <div className="absolute left-14 px-2 py-1.5 rounded-lg bg-surface-theme border border-border-theme text-[10px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none shadow-xl z-50">
                  Configuración
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className={`p-3 border-border-theme flex flex-col gap-3 ${isSidebarExpanded ? "border-t" : "items-center justify-center mt-auto mb-6"}`}>
          {/* Profile Card */}
          {isSidebarExpanded ? (
            <div className={`w-full p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2.5 bg-bg-theme/60 border-border-theme/80 ${
              adminTab === "profile" && !editingReport ? "border-accent-theme/80 bg-accent-theme/10" : "hover:border-border-theme/90"
            }`}>
              <button 
                onClick={() => {
                  setAdminTab("profile");
                  if (editingReport) setEditingReport(null);
                  setSelectedLiveMetricsReport(null);
                  if (window.innerWidth < 768) setIsSidebarExpanded(false);
                }}
                className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer group"
                title="Configuración de Cuenta"
              >
                <div className="relative shrink-0">
                  <img 
                    src={userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"} 
                    alt={userName} 
                    className="w-9 h-9 rounded-full border border-border-theme/80 object-cover group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                      const fallback = document.getElementById("profile-fallback-ca");
                      if (fallback) fallback.classList.remove("hidden");
                    }}
                  />
                  <div id="profile-fallback-ca" className="hidden w-9 h-9 rounded-full bg-accent-theme/10 border border-accent-theme/35 flex items-center justify-center font-bold text-accent-theme text-xs select-none">
                    {userName ? userName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() : "CA"}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-theme rounded-full border-2 border-surface-theme shadow-sm" title="Online"></span>
                </div>
                
                <div className="min-w-0 flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-extrabold text-xs text-white truncate leading-snug group-hover:text-accent-theme transition-colors">
                      {userName}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border shrink-0 leading-none ${
                      userRole === "Superusuario"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
                    }`}>
                      {userRole || "Administrador"}
                    </span>
                  </div>
                  <span className="text-[11px] text-text-dim-theme truncate mt-0.5" title={userEmail}>
                    {userEmail}
                  </span>
                </div>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  authLogout();
                }}
                className="p-1.5 text-text-dim-theme hover:text-white hover:bg-surface-hover-theme rounded-xl transition-all cursor-pointer shrink-0 border border-transparent hover:border-border-theme/60"
                title="Cerrar sesión"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => {
                setAdminTab("profile");
                if (editingReport) setEditingReport(null);
                setSelectedLiveMetricsReport(null);
                if (window.innerWidth < 768) setIsSidebarExpanded(false);
              }}
              className={`w-12 h-12 rounded-full border transition-all flex items-center justify-center group cursor-pointer relative ${
                adminTab === "profile" && !editingReport
                  ? "bg-accent-theme/20 border-accent-theme shadow-md shadow-accent-theme/5"
                  : "bg-bg-theme/30 dark:bg-bg-theme/50 border-border-theme hover:border-accent-theme/40 hover:bg-surface-theme/40"
              }`}
              title={`${userName} (${userRole || "Administrador"})`}
            >
              <div className="relative shrink-0 flex items-center justify-center">
                <img 
                  src={userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"} 
                  alt={userName} 
                  className="w-9 h-9 rounded-full border border-border-theme object-cover group-hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                    const fallback = document.getElementById("profile-fallback-ca-collapsed");
                    if (fallback) fallback.classList.remove("hidden");
                  }}
                />
                <div id="profile-fallback-ca-collapsed" className="hidden w-9 h-9 rounded-full bg-accent-theme/10 border-accent-theme/35 flex items-center justify-center font-bold text-accent-theme text-xs select-none">
                  {userName ? userName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() : "CA"}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-theme rounded-full border-2 border-surface-theme shadow-sm" title="Online"></span>
              </div>
            </button>
          )}

          {/* Theme selector inside sidebar */}
          {isSidebarExpanded ? (
            <button 
              onClick={toggleDarkMode}
              className="flex items-center gap-3 p-2 rounded-lg text-xs font-semibold text-text-dim-theme hover:text-white transition-all cursor-pointer w-full"
              title="Cambiar Tema"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400 shrink-0" /> : <Moon className="w-4 h-4 text-slate-400 shrink-0" />}
              <span>Tema {isDarkMode ? "Claro" : "Oscuro"}</span>
            </button>
          ) : (
            <button 
              onClick={toggleDarkMode}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-text-dim-theme hover:text-white hover:bg-surface-hover-theme transition-all cursor-pointer relative group border border-transparent hover:border-border-theme/40"
              title="Cambiar Tema"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400 shrink-0" /> : <Moon className="w-4 h-4 text-slate-400 shrink-0" />}
              
              <div className="absolute left-14 px-2 py-1 rounded bg-surface-theme border border-border-theme text-[10px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none shadow-xl z-50">
                Tema {isDarkMode ? "Claro" : "Oscuro"}
              </div>
            </button>
          )}

          {isSidebarExpanded && (
            <div className="text-[9px] font-mono text-text-dim-theme opacity-60 text-center">
              v1.5.0 • Live Diagnostics
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        
        {/* Dynamic header inside main panel */}
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
                {/* LOGO / TITLE */}
                {adminLogo && adminLogo.toLowerCase() !== "none" ? (
                  <div className="flex items-center gap-3">
                    <img 
                      src={adminLogo} 
                      alt={adminText || "Logo de Administrador"} 
                      className="h-9 max-w-[240px] object-contain rounded border border-border-theme bg-surface-theme/30 p-1"
                      onError={(e) => { 
                        // If logo fails to load, fallback to text representation
                        (e.target as HTMLElement).style.display = "none";
                        const fallbackText = document.getElementById("admin-header-fallback-text");
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
                
                {/* Section Badge */}
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
              
              {/* Dynamic subtitle according to active state */}
              <p className="text-xs text-text-dim-theme hidden md:block">
                {editingReport ? (
                  "Formulario para configurar comparativas de pasarelas, cargos extras, y cálculo de ahorro para Tiendanube."
                ) : selectedLiveMetricsReport ? (
                  "Análisis de rendimiento en tiempo real simulado con intervalos configurables."
                ) : adminTab === "reports" ? (
                  "Gestión de reportes de diagnóstico y comparativas."
                ) : adminTab === "dashboard" ? (
                  "Resumen de diagnósticos creados, visitas, clics en enlaces y conversión de leads."
                ) : adminTab === "team" ? (
                  "Gestión, estadísticas, miembros y configuración de tu equipo de consultores."
                ) : adminTab === "profile" ? (
                  "Actualiza tu información personal, foto de perfil y rol de usuario en la plataforma."
                ) : (
                  "Administra las opciones generales del panel, marca blanca, y valores de conversión predeterminados."
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
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

        {/* Main Body content */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          
          {/* Error Notification */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-theme/10 border border-red-theme/20 text-red-theme rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium">{errorMessage}</span>
              <button onClick={() => setErrorMessage(null)} className="text-xs underline cursor-pointer">Ignorar</button>
            </div>
          )}

          {/* 1. List Mode */}
          {!editingReport ? (
            <div>
              {adminTab === "reports" ? (
                selectedLiveMetricsReport ? (
                  <div className="space-y-6 animate-fade-in relative pb-28">
                    {/* Header with Back button */}
                    <div className="flex items-center justify-between border-b border-border-theme/30 pb-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSelectedLiveMetricsReport(null)}
                          className="inline-flex items-center gap-2 font-bold text-xs px-3.5 py-2 rounded-xl border border-border-theme bg-surface-theme hover:bg-surface-hover-theme text-text-dim-theme hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Volver a Diagnósticos</span>
                        </button>
                        <div>
                          <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                            <span>Métricas en Vivo: {selectedLiveMetricsReport.name}</span>
                            <span className="w-2 h-2 bg-green-theme rounded-full animate-pulse"></span>
                          </h2>
                          <p className="text-xs text-text-dim-theme">Análisis de rendimiento en tiempo real simulado con intervalos configurables.</p>
                        </div>
                      </div>
                    </div>

                    <RealTimeDashboard 
                      report={selectedLiveMetricsReport} 
                      calculatedSavings={calculateReportSavings(selectedLiveMetricsReport, customExchangeRate)} 
                      updateInterval={metricsUpdateInterval} 
                      isDarkMode={isDarkMode} 
                    />

                    {/* BOTTOM FLOATING TOOLBAR */}
                    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-surface-theme/95 backdrop-blur-md border border-border-theme/80 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 z-50 animate-bounce-short">
                      <div className="flex items-center gap-2.5">
                        {/* View Report Button */}
                        <button
                          onClick={() => onViewReport(selectedLiveMetricsReport.id)}
                          className="inline-flex items-center gap-2 bg-accent-theme hover:bg-accent-theme/90 text-white font-extrabold px-4.5 py-2.5 rounded-xl text-xs shadow-md shadow-accent-theme/10 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Ver reporte</span>
                        </button>

                        {/* Copy Link Button */}
                        <button
                          onClick={() => handleCopyLink(selectedLiveMetricsReport.id)}
                          className={`inline-flex items-center gap-2 font-bold text-xs px-4.5 py-2.5 rounded-xl border transition-all hover:scale-105 active:scale-95 cursor-pointer ${copiedId === selectedLiveMetricsReport.id ? "bg-green-theme/10 border-green-theme/20 text-green-theme" : "bg-bg-theme hover:bg-surface-hover-theme border-border-theme text-slate-300"}`}
                        >
                          <Copy className="w-4 h-4" />
                          <span>{copiedId === selectedLiveMetricsReport.id ? "Copiado!" : "Copiar Link"}</span>
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => {
                            handleStartEdit(selectedLiveMetricsReport);
                            setSelectedLiveMetricsReport(null);
                          }}
                          className="inline-flex items-center gap-2 font-bold text-xs px-4.5 py-2.5 rounded-xl border border-border-theme bg-bg-theme hover:bg-surface-hover-theme text-slate-300 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Editar</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => {
                            if (confirm("¿Estás seguro de que deseas eliminar este reporte de diagnóstico?")) {
                              handleDeleteReport(selectedLiveMetricsReport.id);
                              setSelectedLiveMetricsReport(null);
                            }
                          }}
                          className="inline-flex items-center gap-2 font-bold text-xs px-4.5 py-2.5 rounded-xl border border-red-theme/20 bg-red-theme/10 hover:bg-red-theme/20 text-red-theme transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-4">
                      <h2 className="text-lg font-semibold mb-1 text-white">Diagnósticos de Comercio</h2>
                      <p className="text-sm text-text-dim-theme">Visualiza, edita o abre los diagnósticos elaborados para tus clientes potenciales de e-commerce.</p>
                    </div>

                    {/* Responsive Search & Filtering Bar */}
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 p-4 mb-6 rounded-2xl bg-surface-theme/40 border border-border-theme/60 backdrop-blur-md">
                      {/* Left Side: Search & Filter selections */}
                      <div className="flex flex-wrap items-end gap-3.5 flex-1">
                        {/* Search Input Box */}
                        <div className="flex flex-col gap-1 flex-1 min-w-[240px]">
                          <label className="text-[10px] font-bold text-text-dim-theme uppercase tracking-wider">Buscar Comercio</label>
                          {windowWidth < 768 || (windowWidth < 1024 && isSidebarExpanded) ? (
                            // Mobile or overlapping sidebar mode: Search Icon Button with Expandable input
                            <div className="relative">
                              {isMobileSearchExpanded ? (
                                <div className="flex items-center gap-1.5 animate-fade-in w-full">
                                  <div className="relative flex-1">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                      <Search className="w-3.5 h-3.5 text-text-dim-theme" />
                                    </span>
                                    <input
                                      type="text"
                                      value={searchTerm}
                                      onChange={(e) => setSearchTerm(e.target.value)}
                                      placeholder="Buscar..."
                                      className="w-full text-xs pl-8 pr-7 py-2 rounded-lg border outline-none bg-bg-theme border-border-theme focus:border-accent-theme/60 text-white"
                                      autoFocus
                                    />
                                    {searchTerm && (
                                      <button
                                        onClick={() => setSearchTerm("")}
                                        className="absolute inset-y-0 right-0 flex items-center pr-2 text-text-dim-theme hover:text-white"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => setIsMobileSearchExpanded(false)}
                                    className="p-1.5 text-xs rounded-lg border border-border-theme bg-surface-theme text-text-dim-theme hover:text-white cursor-pointer"
                                  >
                                    Cerrar
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setIsMobileSearchExpanded(true)}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-border-theme bg-surface-theme hover:bg-surface-hover-theme text-text-dim-theme hover:text-white transition-all cursor-pointer relative text-left text-xs"
                                  title="Buscar diagnóstico"
                                >
                                  <Search className="w-4 h-4 text-accent-theme" />
                                  <span>{searchTerm ? `Búsqueda: ${searchTerm}` : "Click para buscar..."}</span>
                                  {searchTerm && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-theme rounded-full"></span>
                                  )}
                                </button>
                              )}
                            </div>
                          ) : (
                            // Desktop or non-overlapping tablet mode: Full Search Input Bar
                            <div className="relative w-full">
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Search className="w-4 h-4 text-text-dim-theme" />
                              </span>
                              <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar por nombre, ID o eslogan..."
                                className="w-full text-xs pl-9 pr-8 py-2.5 rounded-xl border outline-none bg-bg-theme border-border-theme focus:border-accent-theme/60 focus:ring-1 focus:ring-accent-theme/35 text-white placeholder-text-dim-theme"
                              />
                              {searchTerm && (
                                <button
                                  onClick={() => setSearchTerm("")}
                                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-dim-theme hover:text-white cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* GMV Filter Selector */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-text-dim-theme uppercase tracking-wider">Rango de GMV</label>
                          <select
                            value={filterGmv}
                            onChange={(e) => setFilterGmv(e.target.value)}
                            className="text-xs px-3 py-2.5 rounded-xl bg-surface-theme border border-border-theme focus:border-accent-theme outline-none text-slate-200 cursor-pointer hover:bg-surface-hover-theme transition-all min-w-[130px]"
                          >
                            <option value="all">Todos los GMV</option>
                            <option value="low">Bajo (&lt; $100k)</option>
                            <option value="medium">Medio ($100k-$500k)</option>
                            <option value="high">Alto (&gt; $500k)</option>
                            <option value="custom">Personalizado...</option>
                          </select>
                        </div>

                        {filterGmv === "custom" && (
                          <div className="flex items-center gap-1.5 animate-fade-in bg-surface-theme/20 border border-border-theme/40 p-1.5 rounded-xl">
                            <input
                              type="number"
                              placeholder="Mín"
                              value={customGmvMin}
                              onChange={(e) => setCustomGmvMin(e.target.value)}
                              className="w-16 text-[11px] px-2 py-1.5 rounded-lg bg-bg-theme border border-border-theme focus:border-accent-theme outline-none text-white placeholder-text-dim-theme"
                            />
                            <span className="text-text-dim-theme text-xs">-</span>
                            <input
                              type="number"
                              placeholder="Máx"
                              value={customGmvMax}
                              onChange={(e) => setCustomGmvMax(e.target.value)}
                              className="w-16 text-[11px] px-2 py-1.5 rounded-lg bg-bg-theme border border-border-theme focus:border-accent-theme outline-none text-white placeholder-text-dim-theme"
                            />
                          </div>
                        )}

                        {/* Visits Filter Selector */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-text-dim-theme uppercase tracking-wider">Visitas</label>
                          <select
                            value={filterVisits}
                            onChange={(e) => setFilterVisits(e.target.value)}
                            className="text-xs px-3 py-2.5 rounded-xl bg-surface-theme border border-border-theme focus:border-accent-theme outline-none text-slate-200 cursor-pointer hover:bg-surface-hover-theme transition-all min-w-[130px]"
                          >
                            <option value="all">Todas las visitas</option>
                            <option value="small">Bajo (&lt; 10k)</option>
                            <option value="medium">Medio (10k-50k)</option>
                            <option value="large">Alto (&gt; 50k)</option>
                            <option value="custom">Personalizado...</option>
                          </select>
                        </div>

                        {filterVisits === "custom" && (
                          <div className="flex items-center gap-1.5 animate-fade-in bg-surface-theme/20 border border-border-theme/40 p-1.5 rounded-xl">
                            <input
                              type="number"
                              placeholder="Mín"
                              value={customVisitsMin}
                              onChange={(e) => setCustomVisitsMin(e.target.value)}
                              className="w-16 text-[11px] px-2 py-1.5 rounded-lg bg-bg-theme border border-border-theme focus:border-accent-theme outline-none text-white placeholder-text-dim-theme"
                            />
                            <span className="text-text-dim-theme text-xs">-</span>
                            <input
                              type="number"
                              placeholder="Máx"
                              value={customVisitsMax}
                              onChange={(e) => setCustomVisitsMax(e.target.value)}
                              className="w-16 text-[11px] px-2 py-1.5 rounded-lg bg-bg-theme border border-border-theme focus:border-accent-theme outline-none text-white placeholder-text-dim-theme"
                            />
                          </div>
                        )}

                        {/* Creation Date Filter Selector */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-text-dim-theme uppercase tracking-wider">Período</label>
                          <select
                            value={filterPeriod}
                            onChange={(e) => setFilterPeriod(e.target.value)}
                            className="text-xs px-3 py-2.5 rounded-xl bg-surface-theme border border-border-theme focus:border-accent-theme outline-none text-slate-200 cursor-pointer hover:bg-surface-hover-theme transition-all min-w-[130px]"
                          >
                            <option value="all">Cualquier fecha</option>
                            <option value="today">Hoy</option>
                            <option value="week">Esta semana</option>
                            <option value="month">Este mes</option>
                            <option value="year">Este año</option>
                          </select>
                        </div>
                      </div>

                      {/* Right Side: Sorting Options & View Selection */}
                      <div className="flex items-end gap-3 justify-between sm:justify-start">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-text-dim-theme uppercase tracking-wider">Ordenar por</label>
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="text-xs px-3 py-2.5 rounded-xl bg-surface-theme border border-border-theme focus:border-accent-theme outline-none text-slate-200 cursor-pointer hover:bg-surface-hover-theme transition-all min-w-[150px]"
                          >
                            <option value="name-asc">Nombre (A-Z)</option>
                            <option value="name-desc">Nombre (Z-A)</option>
                            <option value="gmv-desc">GMV (Mayor a menor)</option>
                            <option value="gmv-asc">GMV (Menor a mayor)</option>
                            <option value="visits-desc">Visitas (Mayor a menor)</option>
                            <option value="visits-asc">Visitas (Menor a mayor)</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-text-dim-theme uppercase tracking-wider text-right">Vista</label>
                          <div className="flex items-center bg-surface-theme border border-border-theme rounded-xl p-1 gap-0.5 h-[38px]">
                            <button
                              onClick={() => setViewMode("grid")}
                              className={`p-2 rounded-lg transition-all cursor-pointer ${viewMode === "grid" ? "bg-accent-theme text-white font-bold" : "text-text-dim-theme hover:text-white"}`}
                              title="Vista Cuadrícula"
                            >
                              <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setViewMode("table")}
                              className={`p-2 rounded-lg transition-all cursor-pointer ${viewMode === "table" ? "bg-accent-theme text-white font-bold" : "text-text-dim-theme hover:text-white"}`}
                              title="Vista Tabla"
                            >
                              <Table className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {loading ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <RefreshCw className="w-4 h-4 text-accent-theme animate-spin" />
                          <span className="text-xs font-semibold text-text-dim-theme uppercase tracking-wider animate-pulse">Cargando base de datos...</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {Array.from({ length: 6 }).map((_, idx) => (
                            <div 
                              key={idx}
                              className="p-5 rounded-xl border border-border-theme/60 bg-surface-theme/30 animate-pulse flex flex-col justify-between h-[230px]"
                            >
                              <div>
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="w-10 h-10 rounded-lg bg-border-theme/45" />
                                  <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-border-theme/50 rounded w-2/3" />
                                    <div className="h-3 bg-border-theme/35 rounded w-1/3" />
                                  </div>
                                </div>

                                <div className="space-y-3 mb-5">
                                  <div className="flex justify-between items-center">
                                    <div className="h-3 bg-border-theme/35 rounded w-1/4" />
                                    <div className="h-3 bg-border-theme/45 rounded w-1/3" />
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <div className="h-3 bg-border-theme/35 rounded w-1/5" />
                                    <div className="h-3 bg-border-theme/45 rounded w-1/4" />
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <div className="h-3 bg-border-theme/35 rounded w-1/3" />
                                    <div className="flex gap-1.5">
                                      <div className="w-5 h-5 rounded-full bg-border-theme/40" />
                                      <div className="w-5 h-5 rounded-full bg-border-theme/40" />
                                      <div className="w-5 h-5 rounded-full bg-border-theme/40" />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="border-t border-border-theme/30 pt-4 flex items-center justify-between gap-1">
                                <div className="h-7 bg-border-theme/40 rounded w-1/4" />
                                <div className="flex gap-1.5 w-1/2 justify-end">
                                  <div className="h-7 bg-border-theme/35 rounded w-1/3" />
                                  <div className="h-7 bg-border-theme/35 rounded w-1/4" />
                                  <div className="h-7 bg-border-theme/35 rounded w-1/4" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : filteredReports.length === 0 ? (
                      <div className="p-12 text-center rounded-xl border border-dashed border-border-theme bg-surface-theme/50 flex flex-col items-center justify-center gap-4">
                        <Database className="w-12 h-12 text-text-dim-theme" />
                        <div>
                          <h3 className="font-semibold text-lg text-white">No hay reportes elaborados</h3>
                          <p className="text-sm text-text-dim-theme max-w-sm mx-auto mt-1">Crea tu primer análisis financiero comparativo de Shopify para mostrar fugas y ahorros.</p>
                        </div>
                        <button 
                          onClick={handleStartCreate}
                          className="bg-accent-theme hover:bg-accent-theme/90 text-white font-medium px-5 py-2 rounded-lg transition-all text-sm cursor-pointer"
                        >
                          Generar Primer Diagnóstico
                        </button>
                      </div>
                    ) : processedReports.length === 0 ? (
                      <div className="p-12 text-center rounded-xl border border-dashed border-border-theme bg-surface-theme/30 flex flex-col items-center justify-center gap-4 animate-fade-in">
                        <Search className="w-10 h-10 text-text-dim-theme animate-pulse" />
                        <div>
                          <h3 className="font-semibold text-lg text-white">No se encontraron diagnósticos</h3>
                          <p className="text-sm text-text-dim-theme max-w-sm mx-auto mt-1">Ningún reporte de diagnóstico coincide con los criterios de búsqueda o filtros seleccionados.</p>
                        </div>
                        <button 
                          onClick={() => {
                            setSearchTerm("");
                            setFilterGmv("all");
                            setFilterVisits("all");
                            setFilterPeriod("all");
                            setSortBy("name-asc");
                            setCustomGmvMin("");
                            setCustomGmvMax("");
                            setCustomVisitsMin("");
                            setCustomVisitsMax("");
                          }}
                          className="bg-accent-theme/15 hover:bg-accent-theme/25 text-accent-theme border border-accent-theme/20 font-bold px-4 py-2 rounded-lg transition-all text-xs cursor-pointer"
                        >
                          Restablecer Filtros
                        </button>
                      </div>
                    ) : viewMode === "grid" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                        {processedReports.map((report) => {
                          const numGreen = report.tools?.filter(t => t.semaphore === "green").length || 0;
                          const numYellow = report.tools?.filter(t => t.semaphore === "yellow").length || 0;
                          const numRed = report.tools?.filter(t => t.semaphore === "red").length || 0;

                          return (
                            <div 
                              key={report.id}
                              onClick={() => setSelectedLiveMetricsReport(report)}
                              className="p-5 rounded-xl border border-border-theme bg-surface-theme hover:bg-surface-hover-theme shadow-sm flex flex-col justify-between transition-all hover:scale-[1.01] hover:shadow-md cursor-pointer group/card"
                            >
                              <div>
                                <div className="flex items-center gap-3 mb-4">
                                  {report.logo ? (
                                    <img src={report.logo} alt={report.name} className="w-10 h-10 object-cover rounded-lg border border-border-theme bg-bg-theme" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-lg bg-accent-theme/10 border border-accent-theme/30 flex items-center justify-center font-bold text-accent-theme text-sm">
                                      {report.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <h3 className="font-bold text-base tracking-tight text-white group-hover/card:text-accent-theme transition-colors flex items-center gap-1.5">
                                      <span>{report.name}</span>
                                      <span className="opacity-0 group-hover/card:opacity-100 transition-opacity text-[10px] bg-accent-theme/20 text-accent-theme px-1.5 py-0.5 rounded-md font-normal font-sans">Métricas</span>
                                    </h3>
                                    <span className="text-xs text-text-dim-theme">ID: {report.id}</span>
                                  </div>
                                </div>

                                <div className="space-y-2 mb-5">
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-text-dim-theme">GMV Mensual:</span>
                                    <span className="font-semibold text-slate-200">${report.gmv.toLocaleString()} MXN</span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-text-dim-theme">Visitas:</span>
                                    <span className="font-semibold text-slate-200">{report.visitasMensuales.toLocaleString()} /mes</span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-text-dim-theme">Ecosistema Shopify:</span>
                                    <span className="font-semibold flex items-center gap-1.5">
                                      <span 
                                        className="w-5 h-5 bg-green-theme rounded-full flex items-center justify-center text-[10px] font-extrabold text-white shadow-sm cursor-help select-none transition-transform hover:scale-110" 
                                        title={`Verde: Aplicaciones reemplazables nativamente en Tiendanube (${numGreen} detectadas)`}
                                      >
                                        {numGreen}
                                      </span>
                                      <span 
                                        className="w-5 h-5 bg-yellow-theme rounded-full flex items-center justify-center text-[10px] font-extrabold text-slate-950 shadow-sm cursor-help select-none transition-transform hover:scale-110" 
                                        title={`Amarillo: Aplicaciones con estado neutral o costo moderado (${numYellow} detectadas)`}
                                      >
                                        {numYellow}
                                      </span>
                                      <span 
                                        className="w-5 h-5 bg-red-theme rounded-full flex items-center justify-center text-[10px] font-extrabold text-white shadow-sm cursor-help select-none transition-transform hover:scale-110" 
                                        title={`Rojo: Fuga de capital, costo oculto o app de cobro excesivo (${numRed} detectadas)`}
                                      >
                                        {numRed}
                                      </span>
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center text-[11px] border-t border-border-theme/30 pt-2 mt-1">
                                    <span className="text-text-dim-theme flex items-center gap-1">Visto / Abierto:</span>
                                    <span className="font-mono text-accent-theme font-bold flex items-center gap-1">
                                      <span className="text-white">{report.viewCount || 0}</span> vistas • <span className="text-white">{report.openCount || 0}</span> clics
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="border-t border-border-theme pt-4 flex items-center justify-between gap-1" onClick={(e) => e.stopPropagation()}>
                                <button 
                                  onClick={() => onViewReport(report.id)}
                                  className="flex items-center gap-1 text-xs text-accent-theme hover:text-accent-theme/80 font-semibold px-2 py-1 bg-accent-theme/10 hover:bg-accent-theme/20 rounded-md transition-all cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Reporte
                                </button>
                                <div className="flex items-center gap-1">
                                  <button 
                                    onClick={() => handleCopyLink(report.id)}
                                    className={`p-1.5 rounded-md border transition-all text-xs flex items-center gap-1 cursor-pointer ${copiedId === report.id ? "bg-green-theme/10 border-green-theme/20 text-green-theme" : "bg-bg-theme hover:bg-surface-hover-theme border-border-theme text-slate-300"}`}
                                    title="Copiar link del reporte"
                                  >
                                    <Copy className="w-3.5 h-3.5" /> {copiedId === report.id ? "Copiado" : "Link"}
                                  </button>
                                  <button 
                                    onClick={() => setEmailModalTarget({ reportId: report.id, storeName: report.name, contactEmail: report.contactEmail })}
                                    className="p-1.5 rounded-md border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all cursor-pointer"
                                    title="Enviar reporte por Correo (SMTP)"
                                  >
                                    <Mail className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => handleStartEdit(report)}
                                    className="p-1.5 rounded-md border border-border-theme bg-bg-theme hover:bg-surface-hover-theme text-slate-300 transition-all cursor-pointer"
                                    title="Editar diagnóstico"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteReport(report.id)}
                                    className="p-1.5 rounded-md border border-red-theme/20 bg-red-theme/10 hover:bg-red-theme/20 text-red-theme transition-all cursor-pointer"
                                    title="Eliminar diagnóstico"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Table View Mode */
                      <div className="overflow-x-auto rounded-xl border border-border-theme bg-surface-theme/20 backdrop-blur-sm animate-fade-in">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-surface-theme/70 border-b border-border-theme text-[10px] font-extrabold uppercase tracking-wider text-text-dim-theme select-none">
                              <th className="py-3.5 px-4">Comercio</th>
                              <th className="py-3.5 px-4">GMV Mensual</th>
                              <th className="py-3.5 px-4">Visitas</th>
                              <th className="py-3.5 px-4 text-center">Fugas (App Eco)</th>
                              <th className="py-3.5 px-4">Interacción</th>
                              <th className="py-3.5 px-4 text-right pr-6">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-theme/40">
                            {processedReports.map((report) => {
                              const numGreen = report.tools?.filter(t => t.semaphore === "green").length || 0;
                              const numYellow = report.tools?.filter(t => t.semaphore === "yellow").length || 0;
                              const numRed = report.tools?.filter(t => t.semaphore === "red").length || 0;

                              return (
                                <tr 
                                  key={report.id}
                                  onClick={() => setSelectedLiveMetricsReport(report)}
                                  className="group/row hover:bg-surface-hover-theme/30 transition-colors cursor-pointer text-xs"
                                >
                                  {/* Commerce Detail Column */}
                                  <td className="py-4 px-4">
                                    <div className="flex items-center gap-3">
                                      {report.logo ? (
                                        <img src={report.logo} alt={report.name} className="w-9 h-9 object-cover rounded-lg border border-border-theme bg-bg-theme shrink-0" />
                                      ) : (
                                        <div className="w-9 h-9 rounded-lg bg-accent-theme/10 border border-accent-theme/30 flex items-center justify-center font-bold text-accent-theme text-sm shrink-0">
                                          {report.name.charAt(0).toUpperCase()}
                                        </div>
                                      )}
                                      <div className="min-w-0">
                                        <div className="font-bold text-slate-100 group-hover/row:text-accent-theme transition-colors flex items-center gap-1.5">
                                          <span className="truncate">{report.name}</span>
                                        </div>
                                        <div className="text-[10px] text-text-dim-theme flex items-center gap-1 truncate max-w-xs md:max-w-md mt-0.5">
                                          <span className="font-mono bg-bg-theme border border-border-theme/50 px-1 py-0.5 rounded text-[9px]">ID: {report.id}</span>
                                          <span className="truncate">• {report.tagline}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* GMV Column */}
                                  <td className="py-4 px-4 font-semibold text-slate-200">
                                    ${report.gmv.toLocaleString()} MXN
                                  </td>

                                  {/* Visits Column */}
                                  <td className="py-4 px-4 text-text-dim-theme">
                                    <span className="font-medium text-slate-200">{report.visitasMensuales.toLocaleString()}</span> /mes
                                  </td>

                                  {/* Fugas semaphore indicators Column */}
                                  <td className="py-4 px-4">
                                    <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                      <span 
                                        className="w-5 h-5 bg-green-theme rounded-full flex items-center justify-center text-[10px] font-extrabold text-white shadow-sm cursor-help select-none transition-transform hover:scale-110" 
                                        title={`Verde: Aplicaciones reemplazables nativamente en Tiendanube (${numGreen} detectadas)`}
                                      >
                                        {numGreen}
                                      </span>
                                      <span 
                                        className="w-5 h-5 bg-yellow-theme rounded-full flex items-center justify-center text-[10px] font-extrabold text-slate-950 shadow-sm cursor-help select-none transition-transform hover:scale-110" 
                                        title={`Amarillo: Aplicaciones con estado neutral o costo moderado (${numYellow} detectadas)`}
                                      >
                                        {numYellow}
                                      </span>
                                      <span 
                                        className="w-5 h-5 bg-red-theme rounded-full flex items-center justify-center text-[10px] font-extrabold text-white shadow-sm cursor-help select-none transition-transform hover:scale-110" 
                                        title={`Rojo: Fuga de capital, costo oculto o app de cobro excesivo (${numRed} detectadas)`}
                                      >
                                        {numRed}
                                      </span>
                                    </div>
                                  </td>

                                  {/* Views and Clicks Column */}
                                  <td className="py-4 px-4 font-mono text-text-dim-theme text-[11px]">
                                    <span className="text-white font-bold">{report.viewCount || 0}</span> v • <span className="text-white font-bold">{report.openCount || 0}</span> c
                                  </td>

                                  {/* Row Actions Column */}
                                  <td className="py-4 px-4 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button 
                                        onClick={() => onViewReport(report.id)}
                                        className="p-1.5 rounded-lg border border-accent-theme/20 bg-accent-theme/10 hover:bg-accent-theme/20 text-accent-theme transition-all cursor-pointer"
                                        title="Abrir Reporte de Cliente"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>
                                      <button 
                                        onClick={() => handleCopyLink(report.id)}
                                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${copiedId === report.id ? "bg-green-theme/10 border-green-theme/20 text-green-theme" : "bg-bg-theme hover:bg-surface-hover-theme border-border-theme text-slate-300"}`}
                                        title="Copiar link"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                      <button 
                                        onClick={() => setEmailModalTarget({ reportId: report.id, storeName: report.name, contactEmail: report.contactEmail })}
                                        className="p-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all cursor-pointer"
                                        title="Enviar por Correo (SMTP)"
                                      >
                                        <Mail className="w-3.5 h-3.5" />
                                      </button>
                                      <button 
                                        onClick={() => handleStartEdit(report)}
                                        className="p-1.5 rounded-lg border border-border-theme bg-bg-theme hover:bg-surface-hover-theme text-slate-300 transition-all cursor-pointer"
                                        title="Editar"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteReport(report.id)}
                                        className="p-1.5 rounded-lg border border-red-theme/20 bg-red-theme/10 hover:bg-red-theme/20 text-red-theme transition-all cursor-pointer"
                                        title="Eliminar"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )
              ) : adminTab === "dashboard" ? (
                <GlobalDashboard 
                  reports={filteredReports}
                  customExchangeRate={customExchangeRate}
                  calculateReportSavings={calculateReportSavings}
                  onViewReport={onViewReport}
                  isDarkMode={isDarkMode}
                />
              ) : adminTab === "team" ? (
                <Suspense fallback={
                  <div className="p-12 text-center text-text-dim-theme text-xs flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-accent-theme" />
                    <span>Cargando gestión de equipo...</span>
                  </div>
                }>
                  <TeamDashboard 
                    activeTeam={activeTeam}
                    onUpdateTeam={handleUpdateTeam}
                    onDeleteTeam={handleDeleteTeam}
                    reports={reports}
                    isDarkMode={isDarkMode}
                    currentUserEmail={userEmail}
                    currentUserRole={userRole}
                    subTab={teamSubTab}
                    onSubTabChange={setTeamSubTab}
                  />
                </Suspense>
              ) : adminTab === "superadmin" && (userRole === "Superusuario" || authUser?.role === "Superusuario") ? (

                <Suspense fallback={
                  <div className="p-12 text-center text-text-dim-theme text-xs flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-accent-theme" />
                    <span>Cargando panel de superusuario...</span>
                  </div>
                }>
                  <SuperAdminDashboard
                    isDarkMode={isDarkMode}
                    userRole={userRole || authUser?.role}
                    userEmail={userEmail}
                    adminText={adminText}
                    setAdminText={setAdminText}
                    adminLogo={adminLogo}
                    setAdminLogo={setAdminLogo}
                    adminLogo2={adminLogo2}
                    setAdminLogo2={setAdminLogo2}
                    adminLogo3={adminLogo3}
                    setAdminLogo3={setAdminLogo3}
                    logoType={logoType}
                    setLogoType={setLogoType}
                    logoText={logoText}
                    setLogoText={setLogoText}
                    globalEmail={globalEmail}
                    setGlobalEmail={setGlobalEmail}
                    customDomain={customDomain}
                    setCustomDomain={setCustomDomain}
                    domainVerified={domainVerified}
                    domainVerificationToken={domainVerificationToken}
                    onSaveConfig={handleSaveConfig}
                    isSavingConfig={isSavingConfig}
                    onVerifyDomainDNS={handleVerifyDomainDNS}
                    verifyingDomainConfig={verifyingDomainConfig}
                  />
                </Suspense>
              ) : adminTab === "profile" ? (

              <div className="space-y-8 animate-fade-in relative">
                <div className="flex flex-col gap-6 max-w-3xl">
                  {/* Edit Fields Form */}
                  <div className="w-full p-6 rounded-xl border border-border-theme bg-surface-theme/50 backdrop-blur-md space-y-6">
                    <div className="flex items-center gap-2 mb-2 border-b border-border-theme/30 pb-2">
                      <Settings className="w-4 h-4 text-accent-theme" />
                      <h3 className="font-bold text-sm text-white uppercase tracking-wider">Datos de Usuario</h3>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-text-dim-theme mb-1.5">Nombre Completo</label>
                        <input 
                          type="text" 
                          value={userName} 
                          onChange={e => setUserName(e.target.value)}
                          placeholder="César Ayar"
                          className="w-full text-sm px-3.5 py-2.5 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme focus:border-text-dim-theme text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-text-dim-theme mb-1.5">Correo Electrónico</label>
                        <input 
                          type="email" 
                          value={userEmail} 
                          onChange={e => setUserEmail(e.target.value)}
                          placeholder="cesar.ayar19@gmail.com"
                          className="w-full text-sm px-3.5 py-2.5 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme focus:border-text-dim-theme text-white"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-semibold uppercase tracking-wider text-text-dim-theme">Rol / Permisos en la Plataforma</label>
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 font-semibold">
                            <Lock className="w-3 h-3" /> Solo Lectura en Perfil
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg border bg-bg-theme/80 border-border-theme text-white">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-accent-theme/10 border border-accent-theme/30 flex items-center justify-center shrink-0">
                              <ShieldCheck className="w-4 h-4 text-accent-theme" />
                            </div>
                            <div>
                              <span className="block text-sm font-bold text-white leading-tight">
                                {userRole || authUser?.role || "Administrador"}
                              </span>
                              <span className="block text-[11px] text-text-dim-theme">
                                {userRole === "Superusuario" ? "Acceso total a todos los módulos y gestión global" :
                                 userRole === "Administrador" ? "Acceso ejecutivo y administración de equipo" :
                                 userRole === "Agente" ? "Gestión y creación de reportes propios" :
                                 "Visor de reportes de la organización"}
                              </span>
                            </div>
                          </div>

                        </div>
                      </div>



                      <div className="col-span-1 lg:col-span-2 space-y-3">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-text-dim-theme">Foto de Perfil</label>
                        
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                          {/* Circular Dynamic Preview */}
                          <div className="md:col-span-3 flex flex-col items-center justify-center gap-2">
                            <div className="relative group w-24 h-24 rounded-full overflow-hidden border-2 border-accent-theme/60 bg-surface-theme shadow-md flex items-center justify-center">
                              {userAvatar ? (
                                <img 
                                  src={userAvatar} 
                                  alt="Avatar Preview" 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = "none";
                                    const fb = document.getElementById("avatar-form-fallback");
                                    if (fb) fb.classList.remove("hidden");
                                  }}
                                />
                              ) : null}
                              
                              <div id="avatar-form-fallback" className={`${userAvatar ? "hidden" : ""} absolute inset-0 bg-accent-theme/10 flex items-center justify-center font-bold text-accent-theme text-2xl select-none`}>
                                {userName ? userName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() : "CA"}
                              </div>

                              {/* Hover overlay for clicking */}
                              <button
                                type="button"
                                id="avatar-circle-click-btn"
                                onClick={() => document.getElementById("avatar-file-input")?.click()}
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1 text-white text-[10px] font-semibold cursor-pointer"
                              >
                                <Camera className="w-5 h-5 text-accent-theme" />
                                <span>Cambiar</span>
                              </button>
                            </div>
                            <span className="text-[10px] text-text-dim-theme font-mono">Vista Previa</span>
                          </div>

                          {/* Interactive Drop Zone & Selection Area */}
                          <div className="md:col-span-9">
                            <div 
                              id="avatar-drop-zone"
                              onDragOver={handleAvatarDragOver}
                              onDragLeave={handleAvatarDragLeave}
                              onDrop={handleAvatarDrop}
                              onClick={() => document.getElementById("avatar-file-input")?.click()}
                              className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2.5 transition-all cursor-pointer bg-bg-theme/30 hover:bg-bg-theme/50 ${
                                isDraggingAvatar 
                                  ? "border-accent-theme bg-accent-theme/5 scale-[0.99] shadow-inner shadow-accent-theme/10" 
                                  : "border-border-theme hover:border-accent-theme/50"
                              }`}
                            >
                              <input 
                                type="file" 
                                id="avatar-file-input" 
                                accept="image/*"
                                onChange={handleAvatarFileChange}
                                className="hidden" 
                              />
                              
                              <div className="p-2 bg-accent-theme/10 rounded-full text-accent-theme">
                                <UploadCloud className="w-5 h-5" />
                              </div>
                              
                              <div className="text-center">
                                <p className="text-xs font-bold text-white">
                                  {isDraggingAvatar ? "¡Suelta la foto aquí!" : "Arrastra y suelta tu foto aquí, o haz clic para buscar"}
                                </p>
                                <p className="text-[10px] text-text-dim-theme mt-1">
                                  Formatos soportados: JPG, PNG, GIF, WEBP (Máx. 2MB)
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {avatarError && (
                          <p id="avatar-error-msg" className="text-xs text-rose-400 font-medium flex items-center gap-1 mt-1 animate-fade-in">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {avatarError}
                          </p>
                        )}

                        {/* Expandable alternative URL input */}
                        <div className="pt-2">
                          <details className="group border border-border-theme/40 rounded-lg bg-bg-theme/20 overflow-hidden">
                            <summary id="avatar-url-summary" className="text-[11px] font-semibold text-text-dim-theme hover:text-white cursor-pointer px-3 py-2 select-none flex items-center justify-between transition-colors">
                              <span>O usar una dirección URL de internet (Avanzado)</span>
                              <span className="text-[9px] font-mono group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="p-3 border-t border-border-theme/30 space-y-2 bg-bg-theme/40">
                              <input 
                                type="text" 
                                id="avatar-url-input"
                                value={userAvatar.startsWith("data:") ? "" : userAvatar} 
                                onChange={e => {
                                  if (e.target.value) {
                                    setUserAvatar(e.target.value);
                                    setAvatarError(null);
                                  }
                                }}
                                placeholder="https://images.unsplash.com/..."
                                className="w-full text-xs px-3 py-2 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme focus:border-text-dim-theme text-white"
                              />
                              <p className="text-[9px] text-text-dim-theme">
                                Si cargaste una foto local, se muestra como "Imagen en Base64". Pegar un enlace aquí la reemplazará.
                              </p>
                              {userAvatar.startsWith("data:") && (
                                <div className="flex items-center justify-between text-[10px] text-green-theme bg-green-theme/5 border border-green-theme/15 rounded p-1.5 px-2.5">
                                  <span>✓ Foto cargada localmente desde tu dispositivo</span>
                                  <button 
                                    type="button"
                                    id="reset-avatar-btn"
                                    onClick={() => {
                                      setUserAvatar("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80");
                                      setAvatarError(null);
                                    }}
                                    className="text-rose-400 hover:text-rose-300 font-bold transition-colors"
                                  >
                                    Restaurar original
                                  </button>
                                </div>
                              )}
                            </div>
                          </details>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border-theme/30 flex justify-end gap-3">
                      {isProfileModified && (
                        <button 
                          onClick={handleUndoProfile}
                          className="text-xs text-rose-400 hover:text-rose-300 border border-rose-500/20 hover:border-rose-500/40 bg-rose-500/5 hover:bg-rose-500/10 px-4 py-2 rounded-lg cursor-pointer transition-all flex items-center gap-1"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                          Deshacer
                        </button>
                      )}
                      <button 
                        onClick={() => setAdminTab("reports")}
                        className="text-xs text-text-dim-theme hover:text-white border border-border-theme bg-bg-theme hover:bg-surface-theme px-4 py-2 rounded-lg cursor-pointer transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={handleSaveConfig}
                        disabled={isSavingConfig}
                        className="bg-accent-theme hover:bg-accent-theme/90 disabled:bg-accent-theme/50 text-white font-bold px-5 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
                      >
                        {isSavingConfig ? "Guardando..." : "Guardar Cambios"}
                      </button>
                    </div>
                  </div>

                  {/* Mobile & Tablet Preview Container - Shown only when modified */}
                  {isProfileModified && (
                    <div className="lg:hidden block w-full max-w-sm space-y-4 animate-fade-in mt-2">
                      <div className="p-6 rounded-xl border border-border-theme bg-surface-theme/50 backdrop-blur-md flex flex-col items-start text-left gap-4">
                        <div className="flex items-center justify-between w-full border-b border-border-theme/30 pb-2 mb-2">
                          <span className="block text-xs font-mono text-accent-theme uppercase tracking-wider font-semibold">Vista Previa (Cambios sin guardar)</span>
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        </div>
                        
                        <div className="space-y-1 w-full min-w-0">
                          <h3 className="font-bold text-base text-white truncate">{userName || "Usuario"}</h3>
                          <p className="text-xs text-text-dim-theme truncate">{userEmail}</p>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent-theme/10 text-accent-theme text-xs font-semibold mt-2 border border-accent-theme/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-theme animate-pulse"></span>
                            {userRole || "Administrador"}
                          </span>
                        </div>

                        <div className="pt-4 border-t border-border-theme/30 flex justify-center gap-3 w-full">
                          <button 
                            onClick={handleUndoProfile}
                            className="text-xs text-rose-400 hover:text-rose-300 border border-rose-500/30 hover:border-rose-500/50 bg-rose-500/5 hover:bg-rose-500/10 px-4 py-2 rounded-lg cursor-pointer transition-all flex items-center gap-1 flex-1 justify-center"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                            Deshacer
                          </button>
                          <button 
                            onClick={handleSaveConfig}
                            disabled={isSavingConfig}
                            className="bg-accent-theme hover:bg-accent-theme/90 disabled:bg-accent-theme/50 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md flex-1 justify-center"
                          >
                            {isSavingConfig ? "Guardando..." : "Guardar"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Desktop Floating Preview Window - Shown only when modified */}
                {isProfileModified && (
                  <div className="lg:flex hidden fixed bottom-6 right-6 z-50 w-80 p-6 rounded-xl border border-border-theme/80 bg-surface-theme/95 backdrop-blur-md shadow-2xl flex-col items-start text-left gap-4 animate-fade-in">
                    <div className="flex items-center justify-between w-full border-b border-border-theme/30 pb-2 mb-1">
                      <span className="block text-xs font-mono text-accent-theme uppercase tracking-wider font-semibold">Vista Previa de Tarjeta</span>
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-medium font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        Sin Guardar
                      </span>
                    </div>
                    
                    <div className="space-y-1 w-full min-w-0">
                      <h3 className="font-bold text-base text-white truncate">{userName || "Usuario"}</h3>
                      <p className="text-xs text-text-dim-theme truncate">{userEmail}</p>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent-theme/10 text-accent-theme text-xs font-semibold mt-2 border border-accent-theme/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-theme animate-pulse"></span>
                        {userRole || "Administrador"}
                      </span>
                    </div>

                    <div className="pt-4 border-t border-border-theme/30 flex justify-center gap-3 w-full mt-2">
                      <button 
                        onClick={handleUndoProfile}
                        className="text-xs text-rose-400 hover:text-rose-300 border border-rose-500/30 hover:border-rose-500/50 bg-rose-500/5 hover:bg-rose-500/10 px-4 py-2.5 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1 flex-1 font-semibold"
                      >
                        <Undo2 className="w-3.5 h-3.5 shrink-0" />
                        Deshacer
                      </button>
                      <button 
                        onClick={handleSaveConfig}
                        disabled={isSavingConfig}
                        className="bg-accent-theme hover:bg-accent-theme/90 disabled:bg-accent-theme/50 text-white font-bold px-4 py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md flex-1"
                      >
                        {isSavingConfig ? "Guardando..." : "Guardar"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-8 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Branding Panel */}
                  <div className="p-6 rounded-xl border border-border-theme bg-surface-theme/50 backdrop-blur-md flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-border-theme/30 pb-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-accent-theme" />
                          <h3 className="font-bold text-sm text-white uppercase tracking-wider">Marca Blanca (Branding)</h3>
                        </div>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                          Reservado Superusuario
                        </span>
                      </div>

                      {/* Brand Name */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-text-dim-theme mb-1.5">Nombre de la Marca de Administrador</label>
                        <input 
                          type="text" 
                          value={adminText} 
                          onChange={e => setAdminText(e.target.value)}
                          placeholder="Ej. Evolución Diagnostics"
                          className="w-full text-sm px-3.5 py-2 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme focus:border-text-dim-theme text-white"
                        />
                      </div>

                      {/* Prisma LogoConfig Section */}
                      <div className="pt-4 border-t border-border-theme/30 space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold uppercase tracking-wider text-accent-theme">Configuración de Branding</label>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-accent-theme/20 text-accent-theme font-mono">Branding Global</span>
                        </div>

                        {/* Selector de Tipo de Logo */}
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-text-dim-theme mb-1.5">Tipo de Logo</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setLogoType("text")}
                              className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                logoType === "text"
                                  ? "bg-accent-theme/20 border-accent-theme text-white shadow-sm"
                                  : "bg-bg-theme border-border-theme text-text-dim-theme hover:text-white"
                              }`}
                            >
                              <FileText className="w-3.5 h-3.5" />
                              Texto
                            </button>
                            <button
                              type="button"
                              onClick={() => setLogoType("logo")}
                              className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                logoType === "logo"
                                  ? "bg-accent-theme/20 border-accent-theme text-white shadow-sm"
                                  : "bg-bg-theme border-border-theme text-text-dim-theme hover:text-white"
                              }`}
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              Logo / Imagen
                            </button>
                          </div>
                        </div>

                        {/* Campo de Texto del Logo */}
                        {logoType === "text" && (
                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-text-dim-theme mb-1.5">Texto del Logo</label>
                            <input 
                              type="text" 
                              value={logoText} 
                              onChange={e => setLogoText(e.target.value)}
                              placeholder="Escribe el texto del logo..."
                              className="w-full text-sm px-3.5 py-2 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme text-white"
                            />
                          </div>
                        )}

                        {/* Correo Global */}
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-text-dim-theme mb-1.5">Correo Global</label>
                          <div className="relative">
                            <input 
                              type="email" 
                              value={globalEmail} 
                              onChange={e => setGlobalEmail(e.target.value)}
                              placeholder="correo.global@empresa.com"
                              className="w-full text-sm pl-9 pr-3.5 py-2 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme text-white"
                            />
                            <Mail className="w-4 h-4 text-text-dim-theme absolute left-3 top-2.5" />
                          </div>
                        </div>
                      </div>

                      {/* Brand Logo Upload / Config */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-text-dim-theme mb-1.5">Logo de Administrador (Recomendado: 150x80px)</label>
                        
                        <div className="space-y-3">
                          {/* Dropzone & file selector */}
                          <div 
                            onDragOver={handleLogoDragOver}
                            onDragLeave={handleLogoDragLeave}
                            onDrop={handleLogoDrop}
                            onClick={() => document.getElementById("logo-file-input")?.click()}
                            className={`border border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer bg-bg-theme/30 hover:bg-bg-theme/50 ${
                              isDraggingLogo 
                                ? "border-accent-theme bg-accent-theme/5 scale-[0.99] shadow-inner shadow-accent-theme/10" 
                                : "border-border-theme hover:border-accent-theme/50"
                            }`}
                          >
                            <input 
                              type="file" 
                              id="logo-file-input" 
                              accept="image/*"
                              onChange={handleLogoFileChange}
                              className="hidden" 
                            />
                            
                            {adminLogo && adminLogo.toLowerCase() !== "none" ? (
                              <div className="flex items-center gap-3 w-full justify-center">
                                <img src={adminLogo} alt="Logo" className="h-10 max-w-[120px] object-contain rounded border border-border-theme bg-surface-theme/30 p-1" />
                                <div className="text-left">
                                  <p className="text-[11px] font-bold text-white">Logo cargado correctamente</p>
                                  <p className="text-[9px] text-text-dim-theme">Haz clic o arrastra para reemplazar</p>
                                </div>
                              </div>
                            ) : (
                              <>
                                <UploadCloud className="w-5 h-5 text-accent-theme" />
                                <div className="text-center">
                                  <p className="text-[11px] font-bold text-white">Sube o arrastra el logo aquí</p>
                                  <p className="text-[9px] text-text-dim-theme">PNG, JPG, WEBP o GIF (Máx. 2MB)</p>
                                </div>
                              </>
                            )}
                          </div>

                          {logoError && (
                            <p className="text-[10px] text-rose-400 font-semibold">{logoError}</p>
                          )}

                          {/* Alternative text/url input or clear */}
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={adminLogo} 
                              onChange={e => setAdminLogo(e.target.value)}
                              placeholder="O pega una URL de imagen aquí..."
                              className="flex-1 text-xs px-3 py-1.5 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme text-white"
                            />
                            {adminLogo && (
                              <button
                                type="button"
                                onClick={() => setAdminLogo("")}
                                className="px-2.5 py-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:text-white hover:bg-rose-500/10 text-xs transition-colors cursor-pointer"
                              >
                                Quitar
                              </button>
                            )}
                          </div>

                          {/* Additional Global Logos for Final Slide Fallback */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border-theme/40 mt-3">
                            <div>
                              <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-dim-theme mb-1">
                                Logo Adicional 2 Global (Diapositiva Final)
                              </label>
                              <div className="flex gap-2">
                                <input 
                                  type="text" 
                                  value={adminLogo2} 
                                  onChange={e => setAdminLogo2(e.target.value)}
                                  placeholder="URL del Logo 2 (opcional)"
                                  className="flex-1 text-xs px-3 py-1.5 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme text-white"
                                />
                                {adminLogo2 && (
                                  <button
                                    type="button"
                                    onClick={() => setAdminLogo2("")}
                                    className="px-2 py-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:text-white hover:bg-rose-500/10 text-xs transition-colors cursor-pointer"
                                  >
                                    Quitar
                                  </button>
                                )}
                              </div>
                              {adminLogo2 && (
                                <div className="mt-1.5 flex items-center gap-2">
                                  <img src={adminLogo2} alt="Logo 2 Preview" className="h-6 max-w-[100px] object-contain rounded border border-border-theme bg-surface-theme/30 p-0.5" />
                                  <span className="text-[10px] text-emerald-400 font-semibold">Vista previa</span>
                                </div>
                              )}
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-dim-theme mb-1">
                                Logo Adicional 3 Global (Diapositiva Final)
                              </label>
                              <div className="flex gap-2">
                                <input 
                                  type="text" 
                                  value={adminLogo3} 
                                  onChange={e => setAdminLogo3(e.target.value)}
                                  placeholder="URL del Logo 3 (opcional)"
                                  className="flex-1 text-xs px-3 py-1.5 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme text-white"
                                />
                                {adminLogo3 && (
                                  <button
                                    type="button"
                                    onClick={() => setAdminLogo3("")}
                                    className="px-2 py-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:text-white hover:bg-rose-500/10 text-xs transition-colors cursor-pointer"
                                  >
                                    Quitar
                                  </button>
                                )}
                              </div>
                              {adminLogo3 && (
                                <div className="mt-1.5 flex items-center gap-2">
                                  <img src={adminLogo3} alt="Logo 3 Preview" className="h-6 max-w-[100px] object-contain rounded border border-border-theme bg-surface-theme/30 p-0.5" />
                                  <span className="text-[10px] text-emerald-400 font-semibold">Vista previa</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Brand Favicon Upload / Config */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-text-dim-theme mb-1.5">Favicon de Administrador (Recomendado: Cuadrado 32x32px)</label>
                        
                        <div className="space-y-3">
                          {/* Dropzone & file selector */}
                          <div 
                            onDragOver={handleFaviconDragOver}
                            onDragLeave={handleFaviconDragLeave}
                            onDrop={handleFaviconDrop}
                            onClick={() => document.getElementById("favicon-file-input")?.click()}
                            className={`border border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer bg-bg-theme/30 hover:bg-bg-theme/50 ${
                              isDraggingFavicon 
                                ? "border-accent-theme bg-accent-theme/5 scale-[0.99] shadow-inner shadow-accent-theme/10" 
                                : "border-border-theme hover:border-accent-theme/50"
                            }`}
                          >
                            <input 
                              type="file" 
                              id="favicon-file-input" 
                              accept="image/*"
                              onChange={handleFaviconFileChange}
                              className="hidden" 
                            />
                            
                            {adminFavicon ? (
                              <div className="flex items-center gap-3 w-full justify-center">
                                <img src={adminFavicon} alt="Favicon" className="w-8 h-8 object-contain rounded border border-border-theme bg-surface-theme/30 p-1" />
                                <div className="text-left">
                                  <p className="text-[11px] font-bold text-white">Favicon cargado correctamente</p>
                                  <p className="text-[9px] text-text-dim-theme">Haz clic o arrastra para reemplazar</p>
                                </div>
                              </div>
                            ) : (
                              <>
                                <UploadCloud className="w-5 h-5 text-accent-theme" />
                                <div className="text-center">
                                  <p className="text-[11px] font-bold text-white">Sube o arrastra el favicon aquí</p>
                                  <p className="text-[9px] text-text-dim-theme">PNG, JPG, WEBP, GIF o ICO (Máx. 1MB)</p>
                                </div>
                              </>
                            )}
                          </div>

                          {faviconError && (
                            <p className="text-[10px] text-rose-400 font-semibold">{faviconError}</p>
                          )}

                          {/* Alternative text/url input or clear */}
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={adminFavicon} 
                              onChange={e => setAdminFavicon(e.target.value)}
                              placeholder="O pega una URL de imagen aquí..."
                              className="flex-1 text-xs px-3 py-1.5 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme text-white"
                            />
                            {adminFavicon && adminFavicon !== "/favicon.ico" && (
                              <button
                                type="button"
                                onClick={() => setAdminFavicon("/favicon.ico")}
                                className="px-2.5 py-1.5 rounded-lg border border-border-theme text-text-dim-theme hover:text-white hover:bg-surface-hover-theme text-xs transition-colors cursor-pointer"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Branding Live Preview */}
                    <div className="mt-6 p-4 rounded-lg bg-bg-theme border border-border-theme/40 space-y-3">
                      <span className="block text-[10px] font-mono text-text-dim-theme uppercase tracking-wider">Vista Previa en Tiempo Real</span>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-surface-theme/40 rounded border border-border-theme/30 space-y-1">
                          <span className="block text-[8px] font-mono text-text-dim-theme uppercase tracking-wider">Menú Expandido</span>
                          <div className="flex items-center gap-2">
                            {adminLogo && adminLogo.toLowerCase() !== "none" ? (
                              <img src={adminLogo} alt="Logo" className="h-6 max-w-[90px] object-contain rounded border border-border-theme bg-surface-theme/30 p-0.5" />
                            ) : null}
                            <span className="font-bold text-xs text-white truncate">{adminText || "Sin Marca"}</span>
                          </div>
                        </div>

                        <div className="p-3 bg-surface-theme/40 rounded border border-border-theme/30 space-y-1">
                          <span className="block text-[8px] font-mono text-text-dim-theme uppercase tracking-wider">Menú Colapsado</span>
                          <div className="flex items-center justify-start gap-2">
                            <img src={adminFavicon || "/favicon.ico"} alt="Favicon" className="w-6 h-6 object-contain rounded border border-border-theme bg-surface-theme/50 p-0.5" />
                            <span className="text-[10px] text-text-dim-theme italic font-medium">Favicon</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Defaults Panel */}
                  <div className="p-6 rounded-xl border border-border-theme bg-surface-theme/50 backdrop-blur-md flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2 border-b border-border-theme/30 pb-2">
                        <Database className="w-4 h-4 text-accent-theme" />
                        <h3 className="font-bold text-sm text-white uppercase tracking-wider">Parámetros de Diagnósticos</h3>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-text-dim-theme mb-1.5">Email de Contacto Predeterminado</label>
                        <input 
                          type="email" 
                          value={defaultContactEmail} 
                          onChange={e => setDefaultContactEmail(e.target.value)}
                          placeholder="comercial@tiendanube.mx"
                          className="w-full text-sm px-3.5 py-2 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme focus:border-text-dim-theme text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-text-dim-theme mb-1.5">WhatsApp de Contacto Predeterminado</label>
                        <input 
                          type="text" 
                          value={defaultContactWhatsapp} 
                          onChange={e => setDefaultContactWhatsapp(e.target.value)}
                          placeholder="5512345678"
                          className="w-full text-sm px-3.5 py-2 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme focus:border-text-dim-theme text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-text-dim-theme mb-1.5">Tipo de Cambio Fijo Fallback (USD/MXN)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={customExchangeRate} 
                          onChange={e => setCustomExchangeRate(Number(e.target.value) || 18.50)}
                          placeholder="18.50"
                          className="w-full text-sm px-3.5 py-2 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme focus:border-text-dim-theme text-white"
                        />
                        <p className="text-[10px] text-text-dim-theme mt-1">
                          Este valor se utilizará cuando las consultas automáticas de la API financiera se encuentren offline.
                        </p>
                      </div>

                      <div className="pt-4 border-t border-border-theme/20">
                        <label className="block text-xs font-bold uppercase tracking-wider text-accent-theme mb-1.5">Tiempo de transmisión de métricas (ms)</label>
                        <input 
                          type="number" 
                          step="500"
                          min="1000"
                          value={metricsUpdateInterval} 
                          onChange={e => setMetricsUpdateInterval(Number(e.target.value) || 3000)}
                          placeholder="3000"
                          className="w-full text-sm px-3.5 py-2 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme focus:border-text-dim-theme text-white font-mono"
                        />
                        <p className="text-[10px] text-text-dim-theme mt-1 leading-normal">
                          Configura el intervalo en milisegundos (ej. 3000 = 3 segundos) para actualizar la simulación de ventas y visitas en tiempo real en los paneles de Métricas en Vivo de cada reporte.
                        </p>
                      </div>

                      {/* Tarjeta de Dominio Personalizado y Verificación TXT DNS */}
                      {(() => {
                        const canManageDomain = userRole === "Superusuario" || userRole === "Administrador" || authUser?.role === "Superusuario" || authUser?.role === "Administrador";
                        if (!canManageDomain) return null;
                        return (
                          <div className="pt-4 border-t border-border-theme/20 space-y-3">
                            
                            {/* Interruptor de Activación de Dominio Personalizado */}
                            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                              <div className="space-y-0.5 pr-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-white">Integración de Dominio Personalizado</span>
                                  {customDomainEnabled ? (
                                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">Activo</span>
                                  ) : (
                                    <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-bold">Desactivado (Ahorro de Recursos)</span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                  Al estar desactivado, se evitan solicitudes de aprovisionamiento en la API de Vercel para optimizar recursos del servidor.
                                </p>
                              </div>

                              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                <input 
                                  type="checkbox" 
                                  checked={customDomainEnabled} 
                                  onChange={(e) => setCustomDomainEnabled(e.target.checked)} 
                                  className="sr-only peer" 
                                />
                                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                              </label>
                            </div>

                            <div className={`space-y-3 transition-opacity ${customDomainEnabled ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
                              <div className="flex items-center justify-between">
                                <label className="block text-xs font-bold uppercase tracking-wider text-accent-theme">
                                  Dominio Personalizado de Marca (Custom Domain)
                                </label>
                                {domainVerified ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                                    <ShieldCheck className="w-3.5 h-3.5" /> Verificado {domainVerifiedAt ? `(${new Date(domainVerifiedAt).toLocaleDateString()})` : ""}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                                    <AlertTriangle className="w-3.5 h-3.5" /> Pendiente TXT
                                  </span>
                                )}
                              </div>

                              <div className="flex gap-2">
                                <input 
                                  type="text" 
                                  disabled={!customDomainEnabled}
                                  value={customDomain} 
                                  onChange={e => setCustomDomain(e.target.value)}
                                  placeholder="https://reportes.miagencia.com"
                                  className="w-full text-sm px-3.5 py-2 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme focus:border-text-dim-theme text-white font-mono disabled:opacity-60"
                                />
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!customDomain || !customDomainEnabled) return;
                                    setVerifyingDomainConfig(true);
                                    setDomainCheckMessage({ type: null, msg: "" });
                                    try {
                                      const res = await fetch("/api/config/verify-domain", {
                                        method: "POST",
                                        headers: { 
                                          "Content-Type": "application/json",
                                          "X-User-Role": userRole || authUser?.role || "Administrador"
                                        },
                                        body: JSON.stringify({ domain: customDomain })
                                      });
                                      const data = await res.json();
                                      if (res.ok && data.success) {
                                        setDomainCheckMessage({ type: "success", msg: data.message });
                                        setDomainVerified(true);
                                        setDomainVerifiedAt(new Date().toISOString());
                                      } else {
                                        setDomainCheckMessage({ type: "error", msg: data.message || "No se pudo verificar el registro TXT." });
                                      }
                                    } catch (e: any) {
                                      setDomainCheckMessage({ type: "error", msg: "Error al verificar el dominio." });
                                    } finally {
                                      setVerifyingDomainConfig(false);
                                    }
                                  }}
                                  disabled={verifyingDomainConfig || !customDomain || !customDomainEnabled}
                                  className="px-3.5 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                                >
                                  <RefreshCw className={`w-3.5 h-3.5 ${verifyingDomainConfig ? "animate-spin" : ""}`} />
                                  Verificar TXT
                                </button>
                              </div>

                              {domainCheckMessage.msg && (
                                <div className={`p-2.5 rounded-lg text-xs border ${domainCheckMessage.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-rose-500/10 border-rose-500/30 text-rose-300"}`}>
                                  {domainCheckMessage.msg}
                                </div>
                              )}

                              <div className="p-3 bg-bg-theme border border-border-theme rounded-lg space-y-1.5 text-xs text-text-dim-theme">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-white">Registro TXT Requerido:</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(domainVerificationToken);
                                      alert("Token de verificación copiado al portapapeles.");
                                    }}
                                    className="text-[11px] text-accent-theme hover:underline flex items-center gap-1 cursor-pointer font-medium"
                                  >
                                    <Copy className="w-3 h-3" /> Copiar Token
                                  </button>
                                </div>
                                <p className="font-mono text-[11px] text-emerald-400 bg-surface-theme p-2 rounded border border-border-theme break-all select-all">
                                  {domainVerificationToken || "Generando token..."}
                                </p>
                                <p className="text-[10px] leading-normal text-text-dim-theme">
                                  Crea un registro TXT en tu proveedor DNS con Nombre <code className="text-white">_tlamatqui-challenge</code> y el Valor anterior. Apunta un registro CNAME a <code className="text-white">tlamatqui.vercel.app</code>.
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Report Branding Settings Section */}
                  <div className="mt-6 p-6 rounded-xl border border-border-theme bg-surface-theme/50 backdrop-blur-md space-y-6">
                    <div className="flex items-center justify-between border-b border-border-theme/30 pb-3">
                      <div className="flex items-center gap-2.5">
                        <Sparkles className="w-5 h-5 text-accent-theme" />
                        <div>
                          <h3 className="font-bold text-sm text-white uppercase tracking-wider">Configuración de Branding del Reporte</h3>
                          <p className="text-xs text-text-dim-theme">Eslogan, Tarjetas de Socios Consultores y Logotipo de Cierre en Diapositivas</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-accent-theme/10 border border-accent-theme/30 text-accent-theme font-bold">Report Branding Centralizado</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Eslogan Global y Logo Diapositiva Final */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-text-dim-theme mb-1.5">Eslogan Predeterminado del Reporte</label>
                          <input 
                            type="text" 
                            value={defaultTagline} 
                            onChange={e => setDefaultTagline(e.target.value)}
                            placeholder="Ej. Auditoría Financiera y Simulación de Ahorros"
                            className="w-full text-sm px-3.5 py-2.5 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme text-white font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-text-dim-theme mb-1.5">Logo Principal Diapositiva Final</label>
                          <input 
                            type="text" 
                            value={finalSlideMainLogo} 
                            onChange={e => setFinalSlideMainLogo(e.target.value)}
                            placeholder="URL del Logo Principal en la diapositiva final"
                            className="w-full text-sm px-3.5 py-2.5 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme text-white"
                          />
                        </div>
                      </div>

                      {/* Tarjeta de Marca Socio Consultor 1 */}
                      <div className="p-4 rounded-xl border border-border-theme bg-bg-theme/60 space-y-3">
                        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                          <Crown className="w-4 h-4 text-amber-400" /> Tarjeta de Marca: Socio Consultor 1
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] text-text-dim-theme uppercase font-bold mb-1">Título Socio 1</label>
                            <input 
                              type="text"
                              value={brandCard1Title}
                              onChange={e => setBrandCard1Title(e.target.value)}
                              placeholder="Ej. Agencia Partner Premium"
                              className="w-full text-xs px-3 py-1.5 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-surface-theme border-border-theme text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-text-dim-theme uppercase font-bold mb-1">Logo URL Socio 1</label>
                            <input 
                              type="text"
                              value={brandCard1Logo}
                              onChange={e => setBrandCard1Logo(e.target.value)}
                              placeholder="https://..."
                              className="w-full text-xs px-3 py-1.5 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-surface-theme border-border-theme text-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] text-text-dim-theme uppercase font-bold mb-1">Descripción Breve</label>
                          <input 
                            type="text"
                            value={brandCard1Desc}
                            onChange={e => setBrandCard1Desc(e.target.value)}
                            placeholder="Ej. Especialistas en migración e-commerce"
                            className="w-full text-xs px-3 py-1.5 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-surface-theme border-border-theme text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-text-dim-theme uppercase font-bold mb-1">Enlace de Contacto (URL)</label>
                          <input 
                            type="text"
                            value={brandCard1Link}
                            onChange={e => setBrandCard1Link(e.target.value)}
                            placeholder="https://partner.com"
                            className="w-full text-xs px-3 py-1.5 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-surface-theme border-border-theme text-white"
                          />
                        </div>
                      </div>

                      {/* Tarjeta de Marca Socio Consultor 2 */}
                      <div className="p-4 rounded-xl border border-border-theme bg-bg-theme/60 space-y-3 col-span-1 md:col-span-2">
                        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                          <Crown className="w-4 h-4 text-emerald-400" /> Tarjeta de Marca: Socio Consultor 2
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[10px] text-text-dim-theme uppercase font-bold mb-1">Título Socio 2</label>
                            <input 
                              type="text"
                              value={brandCard2Title}
                              onChange={e => setBrandCard2Title(e.target.value)}
                              placeholder="Ej. Aliado Logístico"
                              className="w-full text-xs px-3 py-1.5 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-surface-theme border-border-theme text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-text-dim-theme uppercase font-bold mb-1">Logo URL Socio 2</label>
                            <input 
                              type="text"
                              value={brandCard2Logo}
                              onChange={e => setBrandCard2Logo(e.target.value)}
                              placeholder="https://..."
                              className="w-full text-xs px-3 py-1.5 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-surface-theme border-border-theme text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-text-dim-theme uppercase font-bold mb-1">Descripción</label>
                            <input 
                              type="text"
                              value={brandCard2Desc}
                              onChange={e => setBrandCard2Desc(e.target.value)}
                              placeholder="Ej. Soluciones de envíos"
                              className="w-full text-xs px-3 py-1.5 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-surface-theme border-border-theme text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-text-dim-theme uppercase font-bold mb-1">Enlace</label>
                            <input 
                              type="text"
                              value={brandCard2Link}
                              onChange={e => setBrandCard2Link(e.target.value)}
                              placeholder="https://..."
                              className="w-full text-xs px-3 py-1.5 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-surface-theme border-border-theme text-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>


















                {/* Actions Bar */}
                <div className="flex items-center justify-end gap-3 border-t border-border-theme pt-5">
                  <button 
                    onClick={() => setAdminTab("reports")}
                    className="px-4 py-2 rounded-lg text-sm transition-all border border-border-theme bg-surface-theme hover:bg-surface-hover-theme text-slate-300 cursor-pointer"
                  >
                    Descartar Cambios
                  </button>
                  <button 
                    onClick={handleSaveConfig}
                    disabled={isSavingConfig}
                    className="flex items-center gap-2 bg-accent-theme hover:bg-accent-theme/90 text-white font-semibold px-6 py-2 rounded-lg transition-all shadow-md hover:shadow-lg text-sm cursor-pointer disabled:opacity-50"
                  >
                    {isSavingConfig ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Guardar Configuración
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* 2. Create / Edit Form Wizard */
          <div className="p-6 rounded-xl border border-border-theme bg-surface-theme/55 backdrop-blur-md">
            
            {/* Form Title & Back Button */}
            <div className="flex items-center justify-between border-b border-border-theme pb-4 mb-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-accent-theme">Formulario Diagnóstico</span>
                <h2 className="text-xl font-bold mt-0.5 text-white">
                  {editingReport.id ? `Editar Reporte: ${editingReport.name || "Nuevo"}` : "Nuevo Diagnóstico de Fugas"}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setEditingReport(null)}
                  className="px-4 py-2 rounded-lg text-sm transition-all border border-border-theme bg-surface-theme hover:bg-surface-hover-theme text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveReport}
                  className="flex items-center gap-2 bg-accent-theme hover:bg-accent-theme/90 text-white font-medium px-5 py-2 rounded-lg transition-all shadow-md hover:shadow-lg text-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Guardar Todo
                </button>
              </div>
            </div>

            {/* Form Wizard Tabs Navigation (Subtablas Modulares) */}
            <div className="flex flex-wrap gap-2 border-b border-border-theme pb-3 mb-6">
              {[
                { id: "metrics", label: "1. Datos del Comercio & Métricas", icon: TrendingUp },
                { id: "plan", label: "2. Configuración Plataformas", icon: Settings },
                { id: "tools", label: "3. Aplicaciones Auditadas", icon: Layers },
                { id: "comparison", label: "4. Matriz Comparativa", icon: Database },
                { id: "analytics", label: "5. Analítica & Clics", icon: Eye }
              ].map(tab => {
                const Icon = tab.icon;
                const isSelected = activeFormTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFormTab(tab.id)}
                    className={`flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-lg border transition-all cursor-pointer ${isSelected ? "bg-accent-theme border-accent-theme text-white shadow-sm" : "bg-bg-theme hover:bg-surface-hover-theme border-border-theme text-text-dim-theme"}`}
                  >
                    <Icon className="w-3.5 h-3.5" /> {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Form Wizard Body */}
            <div className="space-y-6">

              {/* TAB 1: SUBTABLA DE DATOS DEL COMERCIO & MÉTRICAS (ReportMetrics) */}
              {activeFormTab === "metrics" && (
                <div className="p-6 rounded-xl border border-border-theme bg-surface-theme/50 space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-border-theme/30 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent-theme/10 border border-accent-theme/30 flex items-center justify-center text-accent-theme font-bold">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white uppercase tracking-wider">Subtabla: Datos del Comercio & Métricas Operativas (ReportMetrics)</h3>
                        <p className="text-xs text-text-dim-theme">Identificación del negocio, tráfico, ventas y rangos de ahorro calculados</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-bg-theme border border-border-theme text-accent-theme">Model: Report & ReportMetrics</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Columna Izquierda: Identificación del Negocio */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-text-dim-theme mb-1.5">Nombre del Comercio *</label>
                        <input 
                          type="text" 
                          value={editingReport.name || ""} 
                          onChange={e => setEditingReport(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Ej. Ginebra"
                          className="w-full text-sm px-3.5 py-2.5 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme focus:border-text-dim-theme text-white font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-text-dim-theme mb-1.5">URL del Negocio (Migración) *</label>
                        <input 
                          type="text" 
                          value={editingReport.businessUrl || ""} 
                          onChange={e => setEditingReport(prev => ({ ...prev, businessUrl: e.target.value }))}
                          placeholder="Ej. https://ginebra.com"
                          className="w-full text-sm px-3.5 py-2.5 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme focus:border-text-dim-theme text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-text-dim-theme mb-1.5">URL Logo Comercio</label>
                        <input 
                          type="text" 
                          value={editingReport.logo || ""} 
                          onChange={e => setEditingReport(prev => ({ ...prev, logo: e.target.value }))}
                          placeholder="https://... o vacío"
                          className="w-full text-sm px-3.5 py-2.5 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-text-dim-theme mb-1.5">Equipo Asignado</label>
                        <select
                          value={editingReport.teamId || "team-default"}
                          onChange={e => setEditingReport(prev => ({ ...prev, teamId: e.target.value }))}
                          className="w-full text-sm px-3.5 py-2.5 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme text-white"
                        >
                          {teams.map(team => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Columna Derecha: Métricas y Ahorros */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-text-dim-theme mb-1.5">Visitas Mensuales Estimadas *</label>
                          <input 
                            type="number" 
                            value={editingReport.visitasMensuales || 0} 
                            onChange={e => setEditingReport(prev => ({ ...prev, visitasMensuales: Number(e.target.value) }))}
                            className="w-full text-sm px-3.5 py-2.5 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme focus:border-text-dim-theme text-white font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-text-dim-theme mb-1.5">GMV Mensual Estimado ($ MXN) *</label>
                          <input 
                            type="number" 
                            value={editingReport.gmv || 0} 
                            onChange={e => setEditingReport(prev => ({ ...prev, gmv: Number(e.target.value) }))}
                            className="w-full text-sm px-3.5 py-2.5 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme focus:border-text-dim-theme text-white font-medium"
                          />
                        </div>
                      </div>

                      <div className="pt-1 flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id="msi-checkbox-metrics"
                          checked={editingReport.msi === "Sí" || editingReport.msi === "true" || !!editingReport.msi} 
                          onChange={e => setEditingReport(prev => ({ ...prev, msi: e.target.checked ? "Sí" : "" }))}
                          className="w-4 h-4 rounded text-accent-theme border-border-theme focus:ring-accent-theme bg-bg-theme cursor-pointer"
                        />
                        <label htmlFor="msi-checkbox-metrics" className="text-xs font-bold uppercase tracking-wider text-slate-200 cursor-pointer select-none">
                          Ofrece Meses Sin Intereses (MSI)
                        </label>
                      </div>

                      <div className="p-4 rounded-xl border border-border-theme bg-bg-theme/60 space-y-3 mt-2">
                        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-accent-theme" /> Rango de Ahorros Estimado
                        </h4>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] text-text-dim-theme uppercase font-bold mb-1">Rango Mínimo ($ MXN)</label>
                            <input 
                              type="number"
                              value={editingReport.fugasRangoMin || 0}
                              onChange={e => setEditingReport(prev => ({ ...prev, fugasRangoMin: Number(e.target.value) }))}
                              className="w-full text-sm px-3 py-1.5 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-surface-theme border-border-theme text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-text-dim-theme uppercase font-bold mb-1">Rango Máximo ($ MXN)</label>
                            <input 
                              type="number"
                              value={editingReport.fugasRangoMax || 0}
                              onChange={e => setEditingReport(prev => ({ ...prev, fugasRangoMax: Number(e.target.value) }))}
                              className="w-full text-sm px-3 py-1.5 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-surface-theme border-border-theme text-white font-mono"
                            />
                          </div>
                        </div>

                        <div className="text-[11px] text-text-dim-theme bg-surface-theme/40 p-2.5 rounded-lg border border-border-theme/40">
                          <span>Herramientas en stack: </span>
                          <strong className="text-white">{(editingReport.tools || []).length} auditadas</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PLANES Y ECONOMÍA */}
              {activeFormTab === "plan" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Shopify Plan Column */}
                  <div className="p-6 rounded-xl border border-border-theme bg-surface-theme/50 space-y-4">
                    <div className="flex items-center gap-2.5 border-b border-border-theme/20 pb-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <Settings className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xs text-white uppercase tracking-wider">Plan Origen: Shopify</h3>
                        <p className="text-[10px] text-text-dim-theme">Suscripción actual del comercio</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] text-text-dim-theme uppercase tracking-wider font-bold mb-1.5">Suscripción de Referencia</label>
                        <select
                          value={editingReport.shopifyPlan}
                          onChange={e => setEditingReport(prev => ({ ...prev, shopifyPlan: e.target.value as any }))}
                          className="w-full text-sm px-3.5 py-2.5 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme text-slate-200 font-medium"
                        >
                          <option value="basic">Basic Shopify ($19 USD + 2% Comis.)</option>
                          <option value="grow">Shopify / Grow ($52 USD + 1% Comis.)</option>
                          <option value="advanced">Advanced Shopify ($399 USD + 0.6% Comis.)</option>
                          <option value="plus">Shopify Plus ($2,300 USD + 0.2% Comis.)</option>
                          <option value="custom">Plan Personalizado (Tarifas Manuales)</option>
                        </select>
                      </div>

                      {editingReport.shopifyPlan === "custom" && (
                        <div className="grid grid-cols-2 gap-3 p-4 rounded-lg bg-yellow-theme/5 border border-yellow-theme/10 animate-fade-in">
                          <div>
                            <label className="block text-[10px] text-text-dim-theme font-semibold mb-1">Costo Fijo (USD)</label>
                            <input 
                              type="number"
                              value={editingReport.shopifyPlanCustomPrice || 0}
                              onChange={e => setEditingReport(prev => ({ ...prev, shopifyPlanCustomPrice: Number(e.target.value) }))}
                              className="w-full text-sm px-3 py-1.5 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-text-dim-theme font-semibold mb-1">Costo Transacción (%)</label>
                            <input 
                              type="number"
                              step="0.01"
                              value={editingReport.shopifyPlanCustomFee || 0}
                              onChange={e => setEditingReport(prev => ({ ...prev, shopifyPlanCustomFee: Number(e.target.value) }))}
                              className="w-full text-sm px-3 py-1.5 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme text-white"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tiendanube Plan Column */}
                  <div className="p-6 rounded-xl border border-border-theme bg-surface-theme/50 space-y-4">
                    <div className="flex items-center gap-2.5 border-b border-border-theme/20 pb-3">
                      <div className="w-8 h-8 rounded-lg bg-accent-theme/10 flex items-center justify-center text-accent-theme">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xs text-white uppercase tracking-wider">Plan Destino: Tiendanube</h3>
                        <p className="text-[10px] text-text-dim-theme">Alternativa recomendada con 0% comisión</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] text-text-dim-theme uppercase tracking-wider font-bold mb-1.5">Plan Recomendado</label>
                        <select
                          value={editingReport.tiendanubePlan}
                          onChange={e => setEditingReport(prev => ({ ...prev, tiendanubePlan: e.target.value as any }))}
                          className="w-full text-sm px-3.5 py-2.5 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme text-slate-200 font-medium"
                        >
                          <option value="basic">Básico ($149 MXN/mes)</option>
                          <option value="tiendanube">Tiendanube ($349 MXN/mes)</option>
                          <option value="advanced">Avanzado ($999 MXN/mes)</option>
                          <option value="evolution">Evolución ($3,999 MXN/mes)</option>
                        </select>
                      </div>

                      <div className="p-3.5 rounded-lg bg-accent-theme/5 border border-accent-theme/10 text-xs text-text-dim-theme">
                        <strong>Estrategia Plan {editingReport.tiendanubePlan?.toUpperCase()}</strong>
                        <p className="mt-1 leading-normal">Tiendanube no cobra comisión por venta (0% por transacción) y proporciona soporte local directo con integraciones pre-negociadas de cobro y envíos.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: STACK TECNOLÓGICO Y SCRAPER */}
              {activeFormTab === "tools" && (
                <div className="space-y-6">
                  
                  {/* SCRAPER CARD MODULE */}
                  <div className="p-5 rounded-xl border border-dashed border-border-theme bg-surface-theme/40">
                    <h3 className="text-sm font-bold text-accent-theme uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Sparkles className="w-4.5 h-4.5" /> Scrapper Inteligente (Chismógrafo API)
                    </h3>
                    <p className="text-xs text-text-dim-theme mb-4">
                      Ingresa el dominio de la tienda Shopify para consultar la infraestructura activa. El sistema analizará las aplicaciones instaladas y su semáforo de costos.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input 
                        type="text" 
                        value={scraperUrl}
                        onChange={e => setScraperUrl(e.target.value)}
                        placeholder="Ej. mishopiapp.com o https://tienda-ejemplo.myshopify.com"
                        className="flex-1 text-sm px-4 py-2 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme text-white"
                      />
                      <div className="flex gap-2">
                        {editingReport.businessUrl && scraperUrl !== editingReport.businessUrl && (
                          <button
                            type="button"
                            onClick={() => setScraperUrl(editingReport.businessUrl || "")}
                            className="px-3.5 py-2 text-xs font-semibold border border-border-theme hover:bg-surface-theme text-slate-300 rounded-lg transition-all cursor-pointer whitespace-nowrap"
                          >
                            Usar URL Negocio
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleScrapeStore}
                          disabled={scraping || !scraperUrl}
                          className={`px-5 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${scraping ? "bg-accent-theme/50 text-slate-300" : "bg-accent-theme hover:bg-accent-theme/90 text-white shadow"}`}
                        >
                          {scraping ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analizando...
                            </>
                          ) : (
                            <>
                              Escanear Tienda
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* TOOLS LIST TABLE */}
                  <div>
                    <h3 className="text-sm font-bold mb-3 flex items-center justify-between text-white">
                      <span>Aplicaciones Detectadas en Shopify ({editingReport.tools?.length || 0})</span>
                    </h3>

                    {(editingReport.tools || []).length === 0 ? (
                      <div className="p-8 text-center border border-border-theme rounded-xl text-text-dim-theme text-xs bg-bg-theme">
                        No hay aplicaciones vinculadas. Agrégalas manualmente abajo o utiliza el escáner de arriba.
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-border-theme rounded-xl bg-bg-theme">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b font-semibold bg-surface-theme text-text-dim-theme border-border-theme">
                              <th className="p-3">Aplicación</th>
                              <th className="p-3">Categoría</th>
                              <th className="p-3">Semáforo</th>
                              <th className="p-3">Gasto Estimado</th>
                              <th className="p-3">Moneda</th>
                              <th className="p-3 text-center">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-theme">
                            {(editingReport.tools || []).map((t, index) => (
                              <tr key={t.id || index} className="hover:bg-surface-hover-theme/40">
                                <td className="p-3 font-semibold text-slate-200">
                                  <div className="flex items-center gap-2.5">
                                    {t.logo ? (
                                      <img 
                                        src={t.logo} 
                                        alt={t.name} 
                                        className="w-7 h-7 rounded object-cover bg-surface-theme border border-border-theme shrink-0" 
                                        onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                                      />
                                    ) : (
                                      <div className="w-7 h-7 rounded bg-surface-theme border border-border-theme flex items-center justify-center font-bold text-[10px] text-text-dim-theme shrink-0">
                                        {t.name.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    <div>
                                      <div>{t.name}</div>
                                      {t.url && <a href={t.url} target="_blank" rel="noreferrer" className="text-[10px] text-accent-theme hover:underline inline-flex items-center gap-1"><LinkIcon className="w-2.5 h-2.5" /> Web</a>}
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3 text-slate-300">{t.category}</td>
                                <td className="p-3">
                                  {t.semaphore === "green" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-theme/10 text-green-theme border border-green-theme/20">🟢 Verde: Reemplazable Nativamente</span>}
                                  {t.semaphore === "yellow" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-theme/10 text-yellow-theme border border-yellow-theme/20">🟡 Amarillo: Neutral</span>}
                                  {t.semaphore === "red" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-theme/10 text-red-theme border border-red-theme/20">🔴 Rojo: Costo Oculto</span>}
                                </td>
                                <td className="p-3 text-slate-300">
                                  {t.costType === "exact" ? (
                                    <span>${t.costExact.toLocaleString()}</span>
                                  ) : (
                                    <span>Rango: ${t.costMin.toLocaleString()} - ${t.costMax.toLocaleString()}</span>
                                  )}
                                </td>
                                <td className="p-3 text-slate-300">{t.currency}</td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleStartEditTool(t)}
                                      className="p-1.5 rounded bg-accent-theme/10 text-accent-theme hover:bg-accent-theme/20 border border-accent-theme/20 transition-all cursor-pointer"
                                      title="Editar aplicación"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveTool(t.id)}
                                      className="p-1.5 rounded bg-red-theme/10 text-red-theme hover:bg-red-theme/20 border border-red-theme/20 transition-all cursor-pointer"
                                      title="Eliminar aplicación"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* TOGGLEABLE MANUAL TOOL FORM */}
                  {!isAddingToolOpen ? (
                    <div className="flex justify-center py-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingToolOpen(true)}
                        className="bg-accent-theme/15 hover:bg-accent-theme/25 border border-accent-theme/30 text-accent-theme text-xs font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm shadow-accent-theme/5"
                      >
                        <Plus className="w-4 h-4" /> Agregar herramienta al stack
                      </button>
                    </div>
                  ) : (
                    <div className="p-5 rounded-xl border border-border-theme bg-surface-theme relative animate-fade-in space-y-4">
                      <div className="flex items-center justify-between border-b border-border-theme/30 pb-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                          {editingToolId ? `Modificar Precio de ${newTool.name || "Aplicación"}` : "Agregar Herramienta Manualmente"}
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingToolOpen(false);
                            setEditingToolId(null);
                          }}
                          className="text-text-dim-theme hover:text-white transition-colors cursor-pointer"
                          title="Cerrar Formulario"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dim-theme mb-1.5">
                            Nombre App {editingToolId && "(Solo Lectura)"} *
                          </label>
                          <input 
                            type="text" 
                            disabled={Boolean(editingToolId)}
                            value={newTool.name || ""} 
                            onChange={e => setNewTool(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Ej. Klaviyo"
                            className={`w-full text-xs px-3 py-2 rounded-lg border outline-none ${editingToolId ? "bg-bg-theme/50 text-text-dim-theme border-border-theme/50 cursor-not-allowed" : "bg-bg-theme border-border-theme text-white focus:ring-1 focus:ring-accent-theme"}`}
                          />
                          {toolErrors.name && <p className="text-[10px] text-red-theme mt-0.5">{toolErrors.name}</p>}
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dim-theme mb-1.5">
                            Categoría {editingToolId && "(Solo Lectura)"} *
                          </label>
                          <input 
                            type="text" 
                            disabled={Boolean(editingToolId)}
                            value={newTool.category || ""} 
                            onChange={e => setNewTool(prev => ({ ...prev, category: e.target.value }))}
                            placeholder="Ej. Marketing, Reviews, Envíos"
                            className={`w-full text-xs px-3 py-2 rounded-lg border outline-none ${editingToolId ? "bg-bg-theme/50 text-text-dim-theme border-border-theme/50 cursor-not-allowed" : "bg-bg-theme border-border-theme text-white focus:ring-1 focus:ring-accent-theme"}`}
                          />
                          {toolErrors.category && <p className="text-[10px] text-red-theme mt-0.5">{toolErrors.category}</p>}
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dim-theme mb-1.5">
                            Semáforo {editingToolId && "(Solo Lectura)"}
                          </label>
                          <select 
                            disabled={Boolean(editingToolId)}
                            value={newTool.semaphore || "green"} 
                            onChange={e => setNewTool(prev => ({ ...prev, semaphore: e.target.value as any }))}
                            className={`w-full text-xs px-3 py-2 rounded-lg border outline-none ${editingToolId ? "bg-bg-theme/50 text-text-dim-theme border-border-theme/50 cursor-not-allowed" : "bg-bg-theme border-border-theme text-slate-200"}`}
                          >
                            <option value="green">Verde: Reemplazable Natively</option>
                            <option value="yellow">Amarillo: Neutral / Se mantiene</option>
                            <option value="red">Rojo: Costo Oculto</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dim-theme mb-1.5">Estructura del Costo</label>
                          <select 
                            value={newTool.costType || "exact"} 
                            onChange={e => setNewTool(prev => ({ ...prev, costType: e.target.value as any }))}
                            className="w-full text-xs px-3 py-2 rounded-lg border outline-none bg-bg-theme border-border-theme text-slate-200"
                          >
                            <option value="exact">Monto Exacto</option>
                            <option value="range">Rango de Costo (Min-Max)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {newTool.costType === "exact" ? (
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dim-theme mb-1.5">Precio Exacto Mensual</label>
                            <input 
                              type="number" 
                              value={newTool.costExact || 0} 
                              onChange={e => setNewTool(prev => ({ ...prev, costExact: Number(e.target.value) }))}
                              className={`w-full text-xs px-3 py-2 rounded-lg border outline-none bg-bg-theme ${toolErrors.costExact ? "border-red-theme" : "border-border-theme focus:ring-1 focus:ring-accent-theme text-white"}`}
                            />
                          </div>
                        ) : (
                          <>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dim-theme mb-1.5">Precio Mínimo ($)</label>
                              <input 
                                type="number" 
                                value={newTool.costMin || 0} 
                                onChange={e => setNewTool(prev => ({ ...prev, costMin: Number(e.target.value) }))}
                                className={`w-full text-xs px-3 py-2 rounded-lg border outline-none bg-bg-theme ${toolErrors.costMin ? "border-red-theme" : "border-border-theme focus:ring-1 focus:ring-accent-theme text-white"}`}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dim-theme mb-1.5">Precio Máximo ($)</label>
                              <input 
                                type="number" 
                                value={newTool.costMax || 0} 
                                onChange={e => setNewTool(prev => ({ ...prev, costMax: Number(e.target.value) }))}
                                className={`w-full text-xs px-3 py-2 rounded-lg border outline-none bg-bg-theme ${toolErrors.costMax ? "border-red-theme" : "border-border-theme focus:ring-1 focus:ring-accent-theme text-white"}`}
                              />
                              {toolErrors.costMax && <p className="text-[10px] text-red-theme mt-0.5">{toolErrors.costMax}</p>}
                            </div>
                          </>
                        )}

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dim-theme mb-1.5">Moneda</label>
                          <select 
                            value={newTool.currency || "USD"} 
                            onChange={e => setNewTool(prev => ({ ...prev, currency: e.target.value as any }))}
                            className="w-full text-xs px-3 py-2 rounded-lg border outline-none bg-bg-theme border-border-theme text-slate-200"
                          >
                            <option value="USD">Dólares Americanos (USD)</option>
                            <option value="MXN">Pesos Mexicanos (MXN)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dim-theme mb-1.5">
                            URL App {editingToolId && "(Solo Lectura)"}
                          </label>
                          <input 
                            type="text" 
                            disabled={Boolean(editingToolId)}
                            value={newTool.url || ""} 
                            onChange={e => setNewTool(prev => ({ ...prev, url: e.target.value }))}
                            placeholder="https://apps.shopify.com/..."
                            className={`w-full text-xs px-3 py-2 rounded-lg border outline-none ${editingToolId ? "bg-bg-theme/50 text-text-dim-theme border-border-theme/50 cursor-not-allowed" : "bg-bg-theme border-border-theme text-white focus:ring-1 focus:ring-accent-theme"}`}
                          />
                          {toolErrors.url && <p className="text-[10px] text-red-theme mt-0.5">{toolErrors.url}</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dim-theme mb-1.5">
                            Descripción {editingToolId && "(Solo Lectura)"}
                          </label>
                          <input 
                            type="text" 
                            disabled={Boolean(editingToolId)}
                            value={newTool.description || ""} 
                            onChange={e => setNewTool(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Explica qué es y por qué en Tiendanube es gratuito o diferente"
                            className={`w-full text-xs px-3 py-2 rounded-lg border outline-none ${editingToolId ? "bg-bg-theme/50 text-text-dim-theme border-border-theme/50 cursor-not-allowed" : "bg-bg-theme border-border-theme text-white focus:ring-1 focus:ring-accent-theme"}`}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dim-theme mb-1.5">
                            URL de Logo {editingToolId && "(Solo Lectura)"}
                          </label>
                          <input 
                            type="text" 
                            disabled={Boolean(editingToolId)}
                            value={newTool.logo || ""} 
                            onChange={e => setNewTool(prev => ({ ...prev, logo: e.target.value }))}
                            placeholder="https://logo.clearbit.com/klaviyo.com o similar"
                            className={`w-full text-xs px-3 py-2 rounded-lg border outline-none ${editingToolId ? "bg-bg-theme/50 text-text-dim-theme border-border-theme/50 cursor-not-allowed" : "bg-bg-theme border-border-theme text-white focus:ring-1 focus:ring-accent-theme"}`}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingToolOpen(false)}
                          className="bg-bg-theme border border-border-theme hover:bg-surface-hover-theme text-slate-300 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleAddManualTool();
                            setIsAddingToolOpen(false);
                          }}
                          className="bg-accent-theme hover:bg-accent-theme/90 text-white px-5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-md"
                        >
                          Agregar al Stack
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: TABLA COMPARATIVA DIRECTA */}
              {activeFormTab === "comparison" && (
                <div className="space-y-6">
                  {!isEditingComparison ? (
                    <div className="p-8 rounded-2xl border border-border-theme bg-surface-theme/40 text-center max-w-lg mx-auto my-6 space-y-6 shadow-xl backdrop-blur-md">
                      <div className="w-12 h-12 rounded-full bg-accent-theme/10 text-accent-theme flex items-center justify-center mx-auto border border-accent-theme/20">
                        <Database className="w-6 h-6" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-base font-bold text-white">¿Deseas editar la tabla comparativa?</h3>
                        <p className="text-xs text-text-dim-theme leading-relaxed">
                          Por defecto, se utilizará la configuración estándar establecida. Si decides editarla, podrás añadir variables de comparación personalizadas, modificar los costos y textos que se visualizan en el reporte.
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingComparison(true)}
                          className="bg-accent-theme hover:bg-accent-theme/90 text-white text-xs font-bold px-6 py-2.5 rounded-xl cursor-pointer transition-all shadow-md active:scale-95"
                        >
                          Sí, editar tabla comparativa
                        </button>
                        <div className="text-xs text-text-dim-theme flex items-center justify-center py-2 px-4 rounded-xl border border-border-theme/60 bg-bg-theme/40">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mr-1.5 shrink-0" />
                          <span>Usar valores por defecto (Recomendado)</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Editor Active Header */}
                      <div className="flex flex-wrap items-center justify-between gap-4 bg-accent-theme/5 border border-accent-theme/10 p-4 rounded-xl">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2 h-2 rounded-full bg-accent-theme animate-ping" />
                          <div>
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Modo Edición Manual Activo</h4>
                            <p className="text-[10px] text-text-dim-theme">Estás modificando los datos comparativos directamente para este reporte.</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsEditingComparison(false)}
                          className="text-xs font-semibold px-3.5 py-1.5 rounded-lg border border-border-theme bg-surface-theme hover:bg-surface-hover-theme text-slate-300 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                          Volver al modo por defecto
                        </button>
                      </div>

                      {/* Header with Title and Add Row Button */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                        <div>
                          <h3 className="text-sm font-bold text-white">Configuración Tabla Comparativa Directa</h3>
                          <p className="text-xs text-text-dim-theme">Personaliza las filas, agrega píldoras de Tiendanube y gestiona plantillas reutilizables.</p>
                        </div>

                        <button
                          type="button"
                          onClick={handleAddComparisonRow}
                          className="bg-accent-theme hover:bg-accent-theme/90 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Agregar Fila Personalizada
                        </button>
                      </div>

                      {/* TEMPLATE MANAGER ROW */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-dashed border-border-theme bg-surface-theme/50">
                        <div>
                          <h4 className="text-xs font-bold uppercase text-text-dim-theme tracking-wider mb-2">Guardar Tabla Actual como Plantilla</h4>
                          <div className="flex gap-2">
                            <input 
                              type="text"
                              value={saveTemplateName}
                              onChange={e => setSaveTemplateName(e.target.value)}
                              placeholder="Nombre de la nueva plantilla..."
                              className="flex-1 text-xs px-3 py-1.5 rounded-lg border outline-none bg-bg-theme border-border-theme focus:border-text-dim-theme text-white"
                            />
                            <button
                              type="button"
                              onClick={handleSaveAsTemplate}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-all cursor-pointer"
                            >
                              Guardar
                            </button>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold uppercase text-text-dim-theme tracking-wider mb-2">Cargar Plantilla Comparativa Guardada</h4>
                          {templates.length === 0 ? (
                            <p className="text-[10px] text-text-dim-theme italic">No hay plantillas guardadas.</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {templates.map(t => (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => handleLoadTemplate(t)}
                                  className="text-[10px] font-semibold px-3 py-1.5 rounded-lg border bg-bg-theme hover:bg-surface-hover-theme border-border-theme text-slate-300 transition-all cursor-pointer"
                                >
                                  {t.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* EDITABLE COMPARISON ROWS */}
                      <div className="space-y-4">
                        {(editingReport.comparisonRows || []).map((row, idx) => (
                          <div key={row.id || idx} className="p-5 rounded-xl border border-border-theme bg-surface-theme/50 hover:bg-surface-theme/80 transition-all relative group">
                            <div className="absolute top-4 right-4 flex items-center gap-2">
                              <span className="text-[10px] bg-accent-theme/10 text-accent-theme font-mono px-2 py-0.5 rounded font-bold">Fila #{idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveComparisonRow(row.id)}
                                className="p-1.5 rounded bg-red-theme/10 text-red-theme hover:bg-red-theme/20 border border-red-theme/20 transition-all cursor-pointer"
                                title="Eliminar fila"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                              <div className="md:col-span-3 space-y-1.5">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dim-theme">Característica / Variable</label>
                                <input 
                                  type="text"
                                  value={row.variable}
                                  onChange={e => handleUpdateComparisonRow(row.id, "variable", e.target.value)}
                                  placeholder="Ej. Hosting o Dominio"
                                  className="w-full font-semibold px-3 py-2 text-xs border rounded-lg bg-bg-theme border-border-theme text-white focus:ring-1 focus:ring-accent-theme outline-none"
                                />
                              </div>

                              <div className="md:col-span-3 space-y-1.5">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-400">Shopify</label>
                                <textarea 
                                  value={row.shopify}
                                  onChange={e => handleUpdateComparisonRow(row.id, "shopify", e.target.value)}
                                  placeholder="Ej. Desde $19 USD/mes + 2%"
                                  rows={2}
                                  className="w-full px-3 py-1.5 text-xs border rounded-lg bg-bg-theme border-border-theme text-slate-200 focus:ring-1 focus:ring-accent-theme outline-none resize-none"
                                />
                              </div>

                              <div className="md:col-span-3 space-y-1.5">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-accent-theme">Tiendanube</label>
                                <textarea 
                                  value={row.tiendanube}
                                  onChange={e => handleUpdateComparisonRow(row.id, "tiendanube", e.target.value)}
                                  placeholder="Ej. $149 MXN/mes sin comisión"
                                  rows={2}
                                  className="w-full px-3 py-1.5 text-xs border rounded-lg bg-bg-theme border-border-theme text-slate-200 focus:ring-1 focus:ring-accent-theme outline-none resize-none"
                                />
                              </div>

                              <div className="md:col-span-3 space-y-1.5">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dim-theme">Texto Píldora (Ej. "0% Comis.")</label>
                                <input 
                                  type="text"
                                  value={row.pillText || ""}
                                  onChange={e => handleUpdateComparisonRow(row.id, "pillText", e.target.value)}
                                  placeholder="Ej. 0% Comisión"
                                  className="w-full px-3 py-2 text-xs border rounded-lg bg-bg-theme border-border-theme text-white focus:ring-1 focus:ring-accent-theme outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB 6: SUBTABLA DE ANALÍTICA E INTERACCIÓN (ReportAnalytics & ReportInteraction) */}
              {activeFormTab === "analytics" && (
                <div className="p-6 rounded-xl border border-border-theme bg-surface-theme/50 space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-border-theme/30 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent-theme/10 border border-accent-theme/30 flex items-center justify-center text-accent-theme font-bold">
                        <Eye className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white uppercase tracking-wider">Subtabla: Métricas de Tráfico & Clics (ReportAnalytics)</h3>
                        <p className="text-xs text-text-dim-theme">Historial de aperturas, vistas de diapositivas y comportamiento del usuario</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-bg-theme border border-border-theme text-accent-theme">Model: ReportAnalytics</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl border border-border-theme bg-bg-theme text-center">
                      <div className="text-xs text-text-dim-theme uppercase font-bold">Total Impresiones</div>
                      <div className="text-2xl font-black text-white mt-1">{editingReport.viewCount || 0}</div>
                    </div>
                    <div className="p-4 rounded-xl border border-border-theme bg-bg-theme text-center">
                      <div className="text-xs text-text-dim-theme uppercase font-bold">Aperturas Únicas</div>
                      <div className="text-2xl font-black text-emerald-400 mt-1">{editingReport.openCount || 0}</div>
                    </div>
                    <div className="p-4 rounded-xl border border-border-theme bg-bg-theme text-center">
                      <div className="text-xs text-text-dim-theme uppercase font-bold">Visitantes Únicos</div>
                      <div className="text-2xl font-black text-accent-theme mt-1">{editingReport.uniqueVisitors || 0}</div>
                    </div>
                    <div className="p-4 rounded-xl border border-border-theme bg-bg-theme text-center">
                      <div className="text-xs text-text-dim-theme uppercase font-bold">Tiempo en Reporte</div>
                      <div className="text-2xl font-black text-amber-400 mt-1">
                        {editingReport.interactions?.timeSpentSeconds ? `${Math.round(editingReport.interactions.timeSpentSeconds / 60)} min` : "0 min"}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl border border-border-theme bg-bg-theme/60 space-y-3">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Métricas de Interacción en Tiempo Real</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-surface-theme border border-border-theme flex justify-between items-center">
                        <span className="text-text-dim-theme">Clics WhatsApp:</span>
                        <strong className="text-white font-bold">{editingReport.interactions?.whatsappClicks || 0}</strong>
                      </div>
                      <div className="p-3 rounded-lg bg-surface-theme border border-border-theme flex justify-between items-center">
                        <span className="text-text-dim-theme">Clics Herramientas:</span>
                        <strong className="text-white font-bold">{editingReport.interactions?.toolClicks || 0}</strong>
                      </div>
                      <div className="p-3 rounded-lg bg-surface-theme border border-border-theme flex justify-between items-center">
                        <span className="text-text-dim-theme">Uso Calculadora:</span>
                        <strong className="text-white font-bold">{editingReport.interactions?.calculatorInteractions || 0}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Form Footer */}
            <div className="border-t border-border-theme mt-8 pt-5 flex items-center justify-between">
              <p className="text-[10px] text-text-dim-theme italic">Recuerda pulsar "Guardar Todo" al finalizar para persistir los cambios.</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setEditingReport(null)}
                  className="px-4 py-2 rounded-lg text-sm transition-all border border-border-theme bg-surface-theme hover:bg-surface-hover-theme text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveReport}
                  className="bg-accent-theme hover:bg-accent-theme/90 text-white font-semibold px-5 py-2 rounded-lg transition-all text-sm cursor-pointer"
                >
                  Guardar Todo
                </button>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Modal de Envío por Correo SMTP */}
      {emailModalTarget && (
        <SendEmailModal
          isOpen={Boolean(emailModalTarget)}
          onClose={() => setEmailModalTarget(null)}
          reportId={emailModalTarget.reportId}
          storeName={emailModalTarget.storeName}
          defaultEmail={emailModalTarget.contactEmail}
        />
      )}

      {/* Modal de Compartido en Dominio Personalizado */}
      {shareModalReport && (
        <ShareReportModal
          report={shareModalReport}
          config={globalConfig}
          onClose={() => setShareModalReport(null)}
          onConfigUpdated={(updated) => {
            setGlobalConfig(updated);
            setCustomDomain(updated.customDomain || "");
            setDomainVerified(Boolean(updated.domainVerified));
            setDomainVerifiedAt(updated.domainVerifiedAt);
          }}
        />
      )}

      {/* Modal de Creación y Auditoría Automática con Chismógrafo */}
      <CreateDiagnosticModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAuditComplete={handleAuditComplete}
        onCreateManual={handleCreateManual}
        isDarkMode={isDarkMode}
      />

      </div>
    </div>
  );
}
