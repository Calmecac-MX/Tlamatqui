import { useState, useEffect, useRef } from "react";
import { 
  TrendingUp, Users, Percent, ShoppingBag, Zap, Play, Pause, 
  RefreshCw, Plus, Store, CheckCircle, Info, Sparkles, AlertCircle,
  FileText, ShieldAlert, Award, ArrowUpRight, MessageSquare
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip 
} from "recharts";
import { Report } from "../types";

/**
 * Propiedades del componente RealTimeDashboard.
 */
interface RealTimeDashboardProps {
  /** Instancia del reporte activo a monitorear */
  report: Report;
  /** Ahorro financiero calculado para la tienda seleccionada */
  calculatedSavings: number;
  /** Frecuencia de actualización en milisegundos */
  updateInterval: number;
  /** Estado del tema de color activo */
  isDarkMode: boolean;
}

/** Punto de serie histórica para las gráficas en vivo */
interface HistoricalPoint {
  time: string;
  diagnostics: number;
  visits: number;
  leaks: number;
  savings: number;
}

/** Evento en tiempo real para la bitácora de actividad */
interface FeedEvent {
  id: string;
  timestamp: string;
  type: "open" | "navigate" | "download";
  message: string;
  value?: string;
  storeName: string;
}

/**
 * Monitor en Tiempo Real de Interacciones y Métricas en Vivo.
 * Permite visualizar el comportamiento del cliente, lecturas activas, permanencia y eventos recibidos.
 */
export default function RealTimeDashboard({ report, calculatedSavings, updateInterval, isDarkMode }: RealTimeDashboardProps) {
  // Theme-aware colors for Recharts
  const colors = {
    accent: isDarkMode ? "#6366F1" : "#4F46E5",
    green: isDarkMode ? "#10B981" : "#059669",
    yellow: isDarkMode ? "#F59E0B" : "#D97706",
    red: isDarkMode ? "#EF4444" : "#DC2626",
    grid: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(9, 9, 11, 0.05)",
    text: isDarkMode ? "#8E8E93" : "#71717A",
    tooltipBg: isDarkMode ? "#161618" : "#FFFFFF",
    tooltipBorder: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(9, 9, 11, 0.08)",
  };

  // Simulation controls (Pause/Play only, speed is configured in Admin config page)
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [metricView, setMetricView] = useState<"diagnostics" | "visits" | "leaks" | "savings">("diagnostics");
  const [chartType, setChartType] = useState<"area" | "line" | "bar">("area");

  // Real-time metrics
  const [diagnosticsCount, setDiagnosticsCount] = useState<number>(report.viewCount || 0);
  const [auditedVisits, setAuditedVisits] = useState<number>(report.uniqueVisitors || 0);
  const [detectedLeaks, setDetectedLeaks] = useState<number>(report.fugasCantidad || 0);
  const [projectedSavings, setProjectedSavings] = useState<number>(calculatedSavings || 0);

  // Sparkline-like historical points
  const [history, setHistory] = useState<HistoricalPoint[]>([]);
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [highlightedCard, setHighlightedCard] = useState<string | null>(null);

  // Initialize metrics based on the current report's real data
  useEffect(() => {
    const baseDiagnostics = report.viewCount || 0;
    const baseVisits = report.uniqueVisitors || 0;
    const baseLeaks = report.fugasCantidad || 0;
    const baseSavings = calculatedSavings || 0;

    setDiagnosticsCount(baseDiagnostics);
    setAuditedVisits(baseVisits);
    setDetectedLeaks(baseLeaks);
    setProjectedSavings(baseSavings);

    // Generate historical points reflecting actual recorded values
    const initialHistory: HistoricalPoint[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const timeStr = new Date(now.getTime() - i * 60000 * 5)
        .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      
      initialHistory.push({
        time: timeStr,
        diagnostics: baseDiagnostics,
        visits: baseVisits,
        leaks: baseLeaks,
        savings: baseSavings
      });
    }

    setHistory(initialHistory);

    // Initial real diagnostics feed logs (only if report has actual visits/interactions)
    const activeStoreName = report.name;
    const initialFeed: FeedEvent[] = [];

    if (report.interactions) {
      if (report.interactions.slideViews) {
        Object.entries(report.interactions.slideViews).forEach(([slide, count], idx) => {
          if (count > 0) {
            initialFeed.push({
              id: `init-slide-${idx}`,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              type: "navigate",
              message: `Navegó a: ${slide} (${count} ${count === 1 ? "vista" : "vistas"})`,
              value: "Navegación 🧭",
              storeName: activeStoreName
            });
          }
        });
      }
      if (report.interactions.whatsappClicks && report.interactions.whatsappClicks > 0) {
        initialFeed.push({
          id: `init-wa`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          type: "download",
          message: `Clic en botón de contacto / WhatsApp (${report.interactions.whatsappClicks})`,
          value: "Contacto 💬",
          storeName: activeStoreName
        });
      }
      if (report.interactions.toolClicks && report.interactions.toolClicks > 0) {
        initialFeed.push({
          id: `init-tool`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          type: "navigate",
          message: `Inspección de herramientas del stack (${report.interactions.toolClicks})`,
          value: "Herramientas 🛠️",
          storeName: activeStoreName
        });
      }
    }

    if (baseVisits > 0 && initialFeed.length === 0) {
      initialFeed.push({
        id: `init-open`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        type: "open",
        message: "Cliente potencial abrió el diagnóstico en línea",
        value: "Apertura 👁️",
        storeName: activeStoreName
      });
    }

    setFeed(initialFeed);
  }, [report, calculatedSavings]);

  // Real-time polling interval to fetch live metrics from API
  useEffect(() => {
    if (!isPlaying || !report.id) return;

    let isMounted = true;

    const pollReport = async () => {
      try {
        const res = await fetch(`/api/reports/${report.id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted || !data) return;

        const updatedReport: Report = data;
        const newVisits = updatedReport.uniqueVisitors || 0;
        const newViews = updatedReport.viewCount || 0;
        const newLeaks = updatedReport.fugasCantidad || 0;
        const now = new Date();
        const timeLabel = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const preciseTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

        // Detect real new visitor or view events
        if (newVisits > auditedVisits) {
          triggerCardHighlight("visits");
          const openEvent: FeedEvent = {
            id: `feed-visit-${Date.now()}`,
            timestamp: preciseTime,
            type: "open",
            message: `Nuevo visitante único accedió al diagnóstico`,
            value: `Apertura 👁️`,
            storeName: updatedReport.name
          };
          setFeed(prev => [openEvent, ...prev.slice(0, 29)]);
        }

        if (newViews > diagnosticsCount) {
          triggerCardHighlight("diagnostics");
          const viewEvent: FeedEvent = {
            id: `feed-view-${Date.now()}`,
            timestamp: preciseTime,
            type: "navigate",
            message: `Visualización del reporte registrada`,
            value: `Vistas 📊`,
            storeName: updatedReport.name
          };
          setFeed(prev => [viewEvent, ...prev.slice(0, 29)]);
        }

        setDiagnosticsCount(newViews);
        setAuditedVisits(newVisits);
        setDetectedLeaks(newLeaks);
        setProjectedSavings(calculatedSavings || 0);

        setHistory(prev => {
          const nextHist = [...prev];
          if (nextHist.length >= 12) nextHist.shift();
          nextHist.push({
            time: timeLabel,
            diagnostics: newViews,
            visits: newVisits,
            leaks: newLeaks,
            savings: calculatedSavings || 0
          });
          return nextHist;
        });
      } catch (err) {
        // Polling network fail silently handled
      }
    };

    const timer = setInterval(pollReport, Math.max(updateInterval, 3000));
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [isPlaying, updateInterval, report.id, diagnosticsCount, auditedVisits, calculatedSavings]);

  // Flash card helper
  const triggerCardHighlight = (cardId: string) => {
    setHighlightedCard(cardId);
    setTimeout(() => setHighlightedCard(null), 800);
  };

  // Force Manual Diagnostic Simulation
  const handleForceAudit = () => {
    const storeName = report.name;
    const extraSavings = Math.floor(Math.random() * 6000) + 2000;
    const now = new Date();
    const timeLabel = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const preciseTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    // Instantly update states
    setDiagnosticsCount(prev => prev + 1);
    setDetectedLeaks(prev => prev + 4);
    setProjectedSavings(prev => prev + extraSavings);

    const manualEvent: FeedEvent = {
      id: `manual-audit-${Date.now()}`,
      timestamp: preciseTime,
      type: "download",
      message: "Descarga manual de reporte ejecutada",
      value: "Descarga PDF 📄",
      storeName: storeName
    };

    setFeed(prev => [manualEvent, ...prev.slice(0, 30)]);
    triggerCardHighlight("diagnostics");
    triggerCardHighlight("leaks");
    triggerCardHighlight("savings");

    setHistory(prev => {
      const nextHist = [...prev];
      if (nextHist.length >= 12) nextHist.shift();
      nextHist.push({
        time: timeLabel,
        diagnostics: diagnosticsCount + 1,
        visits: auditedVisits,
        leaks: detectedLeaks + 4,
        savings: projectedSavings + extraSavings
      });
      return nextHist;
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Header & Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-border-theme bg-surface-theme/60 backdrop-blur-sm">
        
        {/* Left Side: Store Info (Integrated with Report View) */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent-theme/10 rounded-lg text-accent-theme">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dim-theme">Comercio Auditado</label>
            <span className="text-sm font-bold text-white block pr-6">
              {report.name}
            </span>
          </div>
        </div>

        {/* Middle: Live Simulation Indicator */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isPlaying ? "bg-green-theme" : "bg-yellow-theme"}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isPlaying ? "bg-green-theme" : "bg-yellow-theme"}`}></span>
          </span>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-dim-theme">
            {isPlaying ? "Transmisión de Interacción Activa" : "Actualización Pausada"}
          </span>
        </div>

        {/* Right Side: Simulation Toggle controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-bg-theme p-1 rounded-lg border border-border-theme text-xs">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${isPlaying ? "hover:bg-surface-hover-theme text-white" : "bg-yellow-theme/20 text-yellow-theme font-semibold"}`}
              title={isPlaying ? "Pausar simulación" : "Reanudar simulación"}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Reanudar</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Grid of 4 Interactive KPI Cards for Diagnostics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric Card 1: Total Diagnostics */}
        <button
          onClick={() => setMetricView("diagnostics")}
          className={`text-left p-5 rounded-xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-36 cursor-pointer outline-none ${
            metricView === "diagnostics" 
              ? "border-accent-theme bg-accent-theme/5 shadow-md shadow-accent-theme/5" 
              : "border-border-theme bg-surface-theme hover:border-text-dim-theme/40"
          } ${highlightedCard === "diagnostics" ? "ring-2 ring-accent-theme border-accent-theme scale-[1.01]" : ""}`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold uppercase text-text-dim-theme tracking-wider">Interacciones del Reporte</span>
            <div className={`p-1.5 rounded-lg ${metricView === "diagnostics" ? "bg-accent-theme/10 text-accent-theme" : "bg-bg-theme text-text-dim-theme"}`}>
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold font-mono text-white mt-1">
              {diagnosticsCount}
              <span className="text-xs font-sans text-text-dim-theme ml-1">vistas</span>
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] text-green-theme font-semibold flex items-center bg-green-theme/10 px-1.5 py-0.5 rounded">
                {report.viewCount || 0} vistas base
              </span>
              <span className="text-[10px] text-text-dim-theme font-mono">
                • {report.openCount || 0} clics
              </span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-accent-theme/20" style={{ width: metricView === "diagnostics" ? "100%" : "0%", transition: "width 0.4s" }}></div>
        </button>

        {/* Metric Card 2: Unique Visitors */}
        <button
          onClick={() => setMetricView("visits")}
          className={`text-left p-5 rounded-xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-36 cursor-pointer outline-none ${
            metricView === "visits" 
              ? "border-accent-theme bg-accent-theme/5 shadow-md shadow-accent-theme/5" 
              : "border-border-theme bg-surface-theme hover:border-text-dim-theme/40"
          } ${highlightedCard === "visits" ? "ring-2 ring-accent-theme border-accent-theme scale-[1.01]" : ""}`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold uppercase text-text-dim-theme tracking-wider">Usuarios Únicos</span>
            <div className={`p-1.5 rounded-lg ${metricView === "visits" ? "bg-accent-theme/10 text-accent-theme" : "bg-bg-theme text-text-dim-theme"}`}>
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold font-mono text-white mt-1">
              {auditedVisits}
              <span className="text-xs font-sans text-text-dim-theme ml-1">visitantes</span>
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] text-green-theme font-semibold flex items-center bg-green-theme/10 px-1.5 py-0.5 rounded">
                IPs / Dispositivos únicos
              </span>
              <span className="text-[10px] text-text-dim-theme font-mono">Pág. diagnóstico</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-accent-theme/20" style={{ width: metricView === "visits" ? "100%" : "0%", transition: "width 0.4s" }}></div>
        </button>

        {/* Metric Card 3: Detected Leaks */}
        <button
          onClick={() => setMetricView("leaks")}
          className={`text-left p-5 rounded-xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-36 cursor-pointer outline-none ${
            metricView === "leaks" 
              ? "border-accent-theme bg-accent-theme/5 shadow-md shadow-accent-theme/5" 
              : "border-border-theme bg-surface-theme hover:border-text-dim-theme/40"
          } ${highlightedCard === "leaks" ? "ring-2 ring-yellow-theme border-yellow-theme scale-[1.01]" : ""}`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold uppercase text-text-dim-theme tracking-wider">Fugas Identificadas</span>
            <div className={`p-1.5 rounded-lg ${metricView === "leaks" ? "bg-accent-theme/10 text-accent-theme" : "bg-bg-theme text-text-dim-theme"}`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold font-mono text-white mt-1">
              {detectedLeaks}
              <span className="text-xs font-sans text-text-dim-theme ml-1">fugas</span>
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] text-yellow-theme font-semibold flex items-center bg-yellow-theme/10 px-1.5 py-0.5 rounded">
                Tienda: {report.name}
              </span>
              <span className="text-[10px] text-text-dim-theme">Puntos críticos</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-accent-theme/20" style={{ width: metricView === "leaks" ? "100%" : "0%", transition: "width 0.4s" }}></div>
        </button>

        {/* Metric Card 4: Monthly Savings Detected */}
        <button
          onClick={() => setMetricView("savings")}
          className={`text-left p-5 rounded-xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-36 cursor-pointer outline-none ${
            metricView === "savings" 
              ? "border-accent-theme bg-accent-theme/5 shadow-md shadow-accent-theme/5" 
              : "border-border-theme bg-surface-theme hover:border-text-dim-theme/40"
          } ${highlightedCard === "savings" ? "ring-2 ring-green-theme border-green-theme scale-[1.01]" : ""}`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold uppercase text-text-dim-theme tracking-wider">Ahorro Mensual Descubierto</span>
            <div className={`p-1.5 rounded-lg ${metricView === "savings" ? "bg-accent-theme/10 text-accent-theme" : "bg-bg-theme text-text-dim-theme"}`}>
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold font-mono text-white mt-1 truncate">
              ${projectedSavings.toLocaleString()}
              <span className="text-xs font-sans text-text-dim-theme ml-1">MXN</span>
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] text-green-theme font-semibold flex items-center bg-green-theme/10 px-1.5 py-0.5 rounded">
                Ahorro potencial
              </span>
              <span className="text-[10px] text-text-dim-theme">Evitando comisiones Shopify</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-accent-theme/20" style={{ width: metricView === "savings" ? "100%" : "0%", transition: "width 0.4s" }}></div>
        </button>

      </div>

      {/* Main Interactive Chart & Event Logs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Large Chart Canvas Component (Left 2 Columns) */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-border-theme bg-surface-theme/55 backdrop-blur-md flex flex-col justify-between">
          
          {/* Chart Header controls */}
          <div className="flex items-center justify-between gap-4 border-b border-border-theme pb-4 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent-theme" />
                Auditoría del Dashboard: <span className="text-accent-theme capitalize font-semibold">{
                  metricView === "diagnostics" ? "Diagnósticos" : 
                  metricView === "visits" ? "Tráfico" : 
                  metricView === "leaks" ? "Fugas de Dinero" : 
                  "Ahorro MXN"
                }</span>
              </h3>
              <p className="text-xs text-text-dim-theme">Visualización de interacciones de {report.name} con los informes de ahorro.</p>
            </div>

            {/* Chart Type toggles */}
            <div className="flex items-center gap-1 bg-bg-theme p-1 rounded-lg border border-border-theme text-[10px] font-semibold">
              <button
                onClick={() => setChartType("area")}
                className={`px-2 py-1 rounded transition-all cursor-pointer ${chartType === "area" ? "bg-accent-theme text-white" : "text-text-dim-theme hover:text-white"}`}
              >
                Área
              </button>
              <button
                onClick={() => setChartType("line")}
                className={`px-2 py-1 rounded transition-all cursor-pointer ${chartType === "line" ? "bg-accent-theme text-white" : "text-text-dim-theme hover:text-white"}`}
              >
                Línea
              </button>
              <button
                onClick={() => setChartType("bar")}
                className={`px-2 py-1 rounded transition-all cursor-pointer ${chartType === "bar" ? "bg-accent-theme text-white" : "text-text-dim-theme hover:text-white"}`}
              >
                Barras
              </button>
            </div>
          </div>

          {/* Actual Recharts Element */}
          <div className="h-72 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "area" ? (
                <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.accent} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={colors.accent} stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                  <XAxis dataKey="time" stroke={colors.text} fontSize={10} tickLine={false} />
                  <YAxis 
                    stroke={colors.text} 
                    fontSize={10} 
                    tickLine={false} 
                    tickFormatter={(val) => {
                      if (metricView === "savings") return `$${(val/1000).toFixed(0)}k`;
                      if (metricView === "visits") return `${(val/1000).toFixed(0)}k`;
                      return val;
                    }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: colors.tooltipBg, borderColor: colors.tooltipBorder, borderRadius: "8px", fontSize: "11px", color: isDarkMode ? "#fff" : "#000" }}
                    formatter={(value: any) => [
                      metricView === "savings" ? `$${Number(value).toLocaleString()} MXN` : Number(value).toLocaleString(), 
                      metricView.toUpperCase()
                    ]}
                  />
                  <Area type="monotone" dataKey={metricView} stroke={colors.accent} strokeWidth={2} fillOpacity={1} fill="url(#colorMetric)" />
                </AreaChart>
              ) : chartType === "line" ? (
                <LineChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                  <XAxis dataKey="time" stroke={colors.text} fontSize={10} tickLine={false} />
                  <YAxis 
                    stroke={colors.text} 
                    fontSize={10} 
                    tickLine={false}
                    tickFormatter={(val) => {
                      if (metricView === "savings") return `$${(val/1000).toFixed(0)}k`;
                      if (metricView === "visits") return `${(val/1000).toFixed(0)}k`;
                      return val;
                    }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: colors.tooltipBg, borderColor: colors.tooltipBorder, borderRadius: "8px", fontSize: "11px", color: isDarkMode ? "#fff" : "#000" }}
                    formatter={(value: any) => [
                      metricView === "savings" ? `$${Number(value).toLocaleString()} MXN` : Number(value).toLocaleString(), 
                      metricView.toUpperCase()
                    ]}
                  />
                  <Line type="monotone" dataKey={metricView} stroke={colors.accent} strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              ) : (
                <BarChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                  <XAxis dataKey="time" stroke={colors.text} fontSize={10} tickLine={false} />
                  <YAxis 
                    stroke={colors.text} 
                    fontSize={10} 
                    tickLine={false}
                    tickFormatter={(val) => {
                      if (metricView === "savings") return `$${(val/1000).toFixed(0)}k`;
                      if (metricView === "visits") return `${(val/1000).toFixed(0)}k`;
                      return val;
                    }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: colors.tooltipBg, borderColor: colors.tooltipBorder, borderRadius: "8px", fontSize: "11px", color: isDarkMode ? "#fff" : "#000" }}
                    formatter={(value: any) => [
                      metricView === "savings" ? `$${Number(value).toLocaleString()} MXN` : Number(value).toLocaleString(), 
                      metricView.toUpperCase()
                    ]}
                  />
                  <Bar dataKey={metricView} fill={colors.accent} radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Footnotes / Extra Insights */}
          <div className="mt-4 pt-3 border-t border-border-theme flex flex-wrap items-center justify-between gap-2 text-xs text-text-dim-theme">
            <span className="flex items-center gap-1.5 font-medium">
              <Zap className="w-3.5 h-3.5 text-accent-theme animate-pulse" />
              Auditoría en vivo para {report.name} (Sincronizado con datos del reporte)
            </span>
            <span className="italic">Refleja la optimización acumulada mediante Tiendanube.</span>
          </div>

        </div>

        {/* Live Scrolling Event Feed (Right 1 Column) */}
        <div className="p-5 rounded-xl border border-border-theme bg-surface-theme/55 backdrop-blur-md flex flex-col justify-between h-[410px]">
          
          <div className="border-b border-border-theme pb-4 mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 text-green-theme ${isPlaying ? "animate-spin" : ""}`} />
              Interacciones de la Tienda
            </h3>
            <p className="text-xs text-text-dim-theme">Registro exclusivo de aperturas, navegación y descargas para {report.name}.</p>
          </div>

          {/* Events log box */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
            {feed.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-text-dim-theme py-20">
                <AlertCircle className="w-6 h-6 opacity-40" />
                <span>Esperando interacciones de diagnóstico...</span>
              </div>
            ) : (
              feed.map((ev) => (
                <div 
                  key={ev.id} 
                  className="p-2.5 rounded-lg border border-border-theme/60 bg-bg-theme/40 hover:bg-bg-theme/80 transition-all flex flex-col gap-1 border-l-2"
                  style={{
                    borderLeftColor: 
                      ev.type === "open" ? colors.accent :
                      ev.type === "navigate" ? colors.green :
                      colors.yellow
                  }}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-slate-300 truncate max-w-[120px]">{ev.storeName}</span>
                    <span className="font-mono text-text-dim-theme">{ev.timestamp}</span>
                  </div>
                  <p className="text-slate-200">{ev.message}</p>
                  {ev.value && (
                    <div className="mt-1 flex justify-end">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                        ev.type === "open" ? "bg-accent-theme/10 text-accent-theme" :
                        ev.type === "navigate" ? "bg-green-theme/10 text-green-theme" :
                        "bg-yellow-theme/10 text-yellow-theme"
                      }`}>
                        {ev.value}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="border-t border-border-theme pt-3 mt-4 text-center">
            <button 
              onClick={() => setFeed([])}
              className="text-[10px] font-semibold text-text-dim-theme hover:text-white transition-all cursor-pointer"
            >
              Limpiar Consola de Eventos
            </button>
          </div>

        </div>

      </div>

      {/* Captured Interaction Metrics Section */}
      <div className="p-5 rounded-xl border border-border-theme bg-surface-theme/55 backdrop-blur-md space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-accent-theme" />
          Métricas de Interacción del Reporte Web (Captura Real)
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-3.5 rounded-lg bg-bg-theme/40 border border-border-theme/60 space-y-1">
            <span className="text-[10px] uppercase font-bold text-text-dim-theme tracking-wide block">Usuarios Únicos</span>
            <span className="text-lg font-bold font-mono text-white block">{auditedVisits}</span>
            <span className="text-[9px] text-text-dim-theme block">IPs / Dispositivos únicos</span>
          </div>
          <div className="p-3.5 rounded-lg bg-bg-theme/40 border border-border-theme/60 space-y-1">
            <span className="text-[10px] uppercase font-bold text-text-dim-theme tracking-wide block">Vistas de Diapositiva</span>
            <span className="text-lg font-bold font-mono text-white block">
              {report.interactions?.slideViews ? Object.values(report.interactions.slideViews).reduce((a: any, b: any) => a + b, 0) : (report.viewCount || 0)}
            </span>
            <span className="text-[9px] text-text-dim-theme block">Cambios de pantalla</span>
          </div>
          <div className="p-3.5 rounded-lg bg-bg-theme/40 border border-border-theme/60 space-y-1">
            <span className="text-[10px] uppercase font-bold text-text-dim-theme tracking-wide block">Clics WhatsApp</span>
            <span className="text-lg font-bold font-mono text-green-theme block">{report.interactions?.whatsappClicks || 0}</span>
            <span className="text-[9px] text-text-dim-theme block">Agendas e interés</span>
          </div>
          <div className="p-3.5 rounded-lg bg-bg-theme/40 border border-border-theme/60 space-y-1">
            <span className="text-[10px] uppercase font-bold text-text-dim-theme tracking-wide block">Análisis de Herramientas</span>
            <span className="text-lg font-bold font-mono text-yellow-theme block">{report.interactions?.toolClicks || 0}</span>
            <span className="text-[9px] text-text-dim-theme block">Clics en apps/stacks</span>
          </div>
          <div className="p-3.5 rounded-lg bg-bg-theme/40 border border-border-theme/60 space-y-1">
            <span className="text-[10px] uppercase font-bold text-text-dim-theme tracking-wide block">Tiempo en Pantalla</span>
            <span className="text-lg font-bold font-mono text-cyan-400 block">
              {Math.round((report.interactions?.timeSpentSeconds || 0) / 60)}m {(report.interactions?.timeSpentSeconds || 0) % 60}s
            </span>
            <span className="text-[9px] text-text-dim-theme block">Engagement acumulado</span>
          </div>
        </div>
      </div>

      {/* Leads Conversion Optimizer insights */}
      <div className="p-5 rounded-xl border border-border-theme bg-surface-theme/55 backdrop-blur-md grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        
        <div className="md:col-span-2 space-y-2">
          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-accent-theme" />
            Optimización del Embudo de Ventas para Clientes de Shopify
          </h4>
          <p className="text-xs text-text-dim-theme leading-relaxed">
            El dashboard en tiempo real muestra cómo los prospectos interactúan con el diagnóstico de <strong className="text-white">{report.name}</strong>. Cuando un cliente calificado descubre el ahorro exacto proyectado de <strong className="text-white">Tiendanube</strong>, la conversión a lead caliente (clic en WhatsApp) se incrementa significativamente.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-bg-theme/40 border border-border-theme text-center space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-dim-theme">Ahorro Mensual Descubierto</span>
          <h3 className="text-2xl font-bold text-green-theme font-mono">
            ${projectedSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })} MXN
          </h3>
          <p className="text-[10px] text-text-dim-theme">Para {report.name}</p>
        </div>

      </div>

    </div>
  );
}
