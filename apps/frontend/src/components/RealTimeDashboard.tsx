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
  type: "audit" | "view" | "leak_found" | "contact";
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
  const [diagnosticsCount, setDiagnosticsCount] = useState<number>(0);
  const [auditedVisits, setAuditedVisits] = useState<number>(0);
  const [detectedLeaks, setDetectedLeaks] = useState<number>(0);
  const [projectedSavings, setProjectedSavings] = useState<number>(0);

  // Sparkline-like historical points
  const [history, setHistory] = useState<HistoricalPoint[]>([]);
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [highlightedCard, setHighlightedCard] = useState<string | null>(null);

  // Initialize metrics based on the current report's data
  useEffect(() => {
    const baseDiagnostics = report.viewCount || 1;
    const baseVisits = report.uniqueVisitors || 1;
    const baseLeaks = report.fugasCantidad || 3;
    const baseSavings = calculatedSavings || 4500;

    setDiagnosticsCount(baseDiagnostics);
    setAuditedVisits(baseVisits);
    setDetectedLeaks(baseLeaks);
    setProjectedSavings(baseSavings);

    // Generate last 12 historical points
    const initialHistory: HistoricalPoint[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const timeStr = new Date(now.getTime() - i * 60000 * 5)
        .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      
      const variance = 1 + (Math.random() * 0.12 - 0.06); // slight noise
      
      initialHistory.push({
        time: timeStr,
        diagnostics: Math.max(1, Math.round(baseDiagnostics - (i * 0.1))),
        visits: Math.round(baseVisits * variance),
        leaks: Math.max(1, Math.round(baseLeaks - (i * 0.2))),
        savings: Math.round(baseSavings * variance)
      });
    }

    setHistory(initialHistory);

    // Initial diagnostics feed logs for this specific report
    const activeStoreName = report.name;
    const initialFeed: FeedEvent[] = [
      {
        id: `init-1`,
        timestamp: new Date(now.getTime() - 25000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        type: "view",
        message: "Cliente potencial abrió el diagnóstico detallado",
        storeName: activeStoreName
      },
      {
        id: `init-2`,
        timestamp: new Date(now.getTime() - 15000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        type: "leak_found",
        message: "Se detectó fuga crítica de comisión en pasarela",
        value: "Fuga: 2.0% Shopify Fee",
        storeName: activeStoreName
      },
      {
        id: `init-3`,
        timestamp: new Date(now.getTime() - 5000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        type: "contact",
        message: "¡Clic en 'Contactar por WhatsApp' registrado!",
        value: "Lead Calificado 🔥",
        storeName: activeStoreName
      }
    ];
    setFeed(initialFeed);
  }, [report, calculatedSavings]);

  // Real-time ticking interval
  useEffect(() => {
    if (!isPlaying) return;

    const tick = () => {
      const storeName = report.name;

      // Roll a die for diagnostics-related events:
      // 40% View, 35% Leak found, 15% Contact initiated, 10% New Diagnostic Audit completed
      const roll = Math.random();
      const now = new Date();
      const timeLabel = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const preciseTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

      let newEvent: FeedEvent | null = null;

      let nextDiag = diagnosticsCount;
      let nextVisits = auditedVisits;
      let nextLeaks = detectedLeaks;
      let nextSavings = projectedSavings;

      if (roll < 0.40) {
        // View Diagnostic
        const extraTraffic = 1;
        nextVisits += extraTraffic;

        const pages = ["Slide 1: Comparativa General", "Slide 2: Costos Ocultos", "Slide 3: Plan de Acción", "Ficha Técnica"];
        const randomPage = pages[Math.floor(Math.random() * pages.length)];

        newEvent = {
          id: `feed-${Date.now()}`,
          timestamp: preciseTime,
          type: "view",
          message: `Nuevo visitante único en: ${randomPage}`,
          value: `+${extraTraffic} visitante`,
          storeName: storeName
        };
        triggerCardHighlight("visits");
      } else if (roll < 0.75) {
        // Leak Found or Analyzed
        const extraLeakValue = Math.floor(Math.random() * 1800) + 400;
        nextLeaks += 1;
        nextSavings += extraLeakValue;

        const leakTypes = [
          "Fuga por Shopify Fee del 2.0%",
          "Costo duplicado en pasarela local",
          "Herramienta de MSI ineficiente",
          "Suscripción de App obsoleta detectada"
        ];
        const randomLeak = leakTypes[Math.floor(Math.random() * leakTypes.length)];

        newEvent = {
          id: `feed-${Date.now()}`,
          timestamp: preciseTime,
          type: "leak_found",
          message: `Identificado: ${randomLeak}`,
          value: `Ahorro mensual: +$${extraLeakValue} MXN`,
          storeName: storeName
        };
        triggerCardHighlight("leaks");
        triggerCardHighlight("savings");
      } else if (roll < 0.90) {
        // Contact click
        newEvent = {
          id: `feed-${Date.now()}`,
          timestamp: preciseTime,
          type: "contact",
          message: `Presionó botón de WhatsApp para agendar mentoría`,
          value: "Lead Calificado 🔥",
          storeName: storeName
        };
        triggerCardHighlight("savings");
      } else {
        // Entirely new section diagnostic generated/simulated
        nextDiag += 1;
        const extraVisits = Math.floor(Math.random() * 12000) + 3000;
        const extraLeaks = Math.floor(Math.random() * 3) + 2;
        const extraSavings = Math.floor(Math.random() * 5500) + 1500;

        nextVisits += extraVisits;
        nextLeaks += extraLeaks;
        nextSavings += extraSavings;

        newEvent = {
          id: `feed-${Date.now()}`,
          timestamp: preciseTime,
          type: "audit",
          message: `¡Nueva sección auditada y generada con éxito!`,
          value: `+$${extraSavings.toLocaleString()} MXN ahorro/mes`,
          storeName: storeName
        };

        triggerCardHighlight("diagnostics");
        triggerCardHighlight("visits");
        triggerCardHighlight("leaks");
        triggerCardHighlight("savings");
      }

      setDiagnosticsCount(nextDiag);
      setAuditedVisits(nextVisits);
      setDetectedLeaks(nextLeaks);
      setProjectedSavings(nextSavings);

      setHistory(prev => {
        const nextHist = [...prev];
        if (nextHist.length >= 12) nextHist.shift();
        nextHist.push({
          time: timeLabel,
          diagnostics: nextDiag,
          visits: nextVisits,
          leaks: nextLeaks,
          savings: nextSavings
        });
        return nextHist;
      });

      if (newEvent) {
        setFeed(prev => [newEvent!, ...prev.slice(0, 30)]);
      }
    };

    const timer = setInterval(tick, updateInterval);
    return () => clearInterval(timer);
  }, [isPlaying, updateInterval, report, diagnosticsCount, auditedVisits, detectedLeaks, projectedSavings]);

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
      type: "audit",
      message: "👉 Auditoría manual completada por Administrador",
      value: `+$${extraSavings.toLocaleString()} MXN`,
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
                {report.viewCount || 1} vistas base
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
              {report.uniqueVisitors || 1}
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
            <p className="text-xs text-text-dim-theme">Clicks, descargas y consultas de clientes potenciales para {report.name}.</p>
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
                      ev.type === "audit" ? colors.green :
                      ev.type === "contact" ? colors.red :
                      ev.type === "leak_found" ? colors.yellow :
                      colors.accent
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
                        ev.type === "audit" ? "bg-green-theme/10 text-green-theme" :
                        ev.type === "contact" ? "bg-red-theme/10 text-red-theme" :
                        ev.type === "leak_found" ? "bg-yellow-theme/10 text-yellow-theme" :
                        "bg-accent-theme/10 text-accent-theme"
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
            <span className="text-lg font-bold font-mono text-white block">{report.uniqueVisitors || 1}</span>
            <span className="text-[9px] text-text-dim-theme block">IPs / Dispositivos únicos</span>
          </div>
          <div className="p-3.5 rounded-lg bg-bg-theme/40 border border-border-theme/60 space-y-1">
            <span className="text-[10px] uppercase font-bold text-text-dim-theme tracking-wide block">Vistas de Diapositiva</span>
            <span className="text-lg font-bold font-mono text-white block">
              {report.interactions?.slideViews ? Object.values(report.interactions.slideViews).reduce((a: any, b: any) => a + b, 0) : report.viewCount || 1}
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
