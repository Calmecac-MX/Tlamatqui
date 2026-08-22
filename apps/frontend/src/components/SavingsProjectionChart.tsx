/**
 * @file SavingsProjectionChart.tsx
 * @description Componente de visualización interactiva para la proyección de ahorro acumulado a 12 meses.
 */

import { useState } from "react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ReferenceLine
} from "recharts";
import { TrendingUp, Coins, Calendar, ArrowUpRight, BarChart3, LineChart } from "lucide-react";

/**
 * Propiedades del componente de gráfico de proyección de ahorro.
 */
interface SavingsProjectionChartProps {
  /** Costo mensual acumulado actual en la plataforma Shopify (MXN) */
  monthlyShopifyCost: number;
  /** Costo mensual proyectado en la plataforma Tiendanube (MXN) */
  monthlyTiendanubeCost: number;
  /** Ahorro neto estimado mensualmente (MXN) */
  monthlySavings: number;
  /** Tema activo (Dark/Light mode) */
  isDarkMode: boolean;
}

/**
 * Gráfico interactivo de proyección financiera a 12 meses con Recharts.
 * Permite conmutar entre gráfico de área/líneas acumuladas y comparativa en barras mensuales.
 */

export default function SavingsProjectionChart({
  monthlyShopifyCost,
  monthlyTiendanubeCost,
  monthlySavings,
  isDarkMode
}: SavingsProjectionChartProps) {
  const [activeTab, setActiveTab] = useState<"savings" | "comparison">("savings");
  const [chartType, setChartType] = useState<"area" | "bar">("area");

  /**
   * Genera el arreglo de datos acumulados mes a mes para la serie de tiempo (1 a 12 meses).
   * Calcula el gasto acumulado en Shopify vs Tiendanube y el ahorro neto proyectado.
   */
  const chartData = Array.from({ length: 12 }, (_, index) => {
    const monthNum = index + 1;
    const shopifyCumulative = Math.round(monthlyShopifyCost * monthNum);
    const tiendanubeCumulative = Math.round(monthlyTiendanubeCost * monthNum);
    const savingsCumulative = Math.round(monthlySavings * monthNum);
    
    return {
      name: `Mes ${monthNum}`,
      shortName: `M${monthNum}`,
      "Costo Shopify": shopifyCumulative,
      "Costo Tiendanube": tiendanubeCumulative,
      "Ahorro Neto": savingsCumulative,
      shopifyMonthly: Math.round(monthlyShopifyCost),
      tiendanubeMonthly: Math.round(monthlyTiendanubeCost),
      savingsMonthly: Math.round(monthlySavings),
    };
  });

  // Variables de color adaptativas según el tema de diseño (Dark/Light mode)
  const colors = {
    accent: isDarkMode ? "#6366F1" : "#4F46E5", // Indigo
    green: "#10B981",                           // Emerald
    lime: "#A3E635",                            // Lime accent
    red: isDarkMode ? "#F87171" : "#DC2626",    // Rose
    grid: isDarkMode ? "rgba(255, 255, 255, 0.06)" : "rgba(9, 9, 11, 0.06)",
    text: isDarkMode ? "#94A3B8" : "#64748B",
    tooltipBg: isDarkMode ? "rgba(18, 18, 20, 0.95)" : "rgba(255, 255, 255, 0.95)",
    tooltipBorder: isDarkMode ? "rgba(163, 230, 53, 0.25)" : "rgba(79, 70, 229, 0.2)",
  };

  /**
   * Formatea un valor numérico a moneda mexicana ($ MXN) sin decimales.
   */
  const formatCurrency = (value: number): string => {
    return `$${value.toLocaleString("es-MX", { maximumFractionDigits: 0 })} MXN`;
  };

  const halfYearSavings = Math.round(monthlySavings * 6);
  const fullYearSavings = Math.round(monthlySavings * 12);

  // Custom tooltips for a highly polished appearance
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="p-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl"
        style={{ 
          backgroundColor: colors.tooltipBg, 
          borderColor: colors.tooltipBorder,
          color: isDarkMode ? "#F8FAFC" : "#0F172A" 
        }}
      >
        <div className="flex items-center justify-between gap-3 border-b pb-2 mb-2 border-white/10">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#a3e635]" />
            <span className="text-xs font-bold font-display uppercase tracking-wider">{label}</span>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#a3e635]/15 text-[#a3e635] border border-[#a3e635]/30">
            Proyección
          </span>
        </div>
        <div className="space-y-2 font-sans text-xs">
          {payload.map((entry: any, index: number) => {
            const isSavings = entry.name === "Ahorro Neto";
            const color = entry.color || entry.fill;
            return (
              <div key={index} className="flex justify-between items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                  <span className={isSavings ? "font-bold text-white" : "text-text-dim-theme"}>{entry.name}:</span>
                </div>
                <span className={`font-mono ${isSavings ? "font-black text-[#a3e635] text-sm" : "font-semibold"}`}>
                  {formatCurrency(entry.value)}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-2.5 pt-2 border-t border-white/10 text-[10px] text-text-dim-theme flex justify-between items-center gap-2">
          <span>Ahorro mensual libre:</span>
          <strong className="text-emerald-400 font-mono font-bold">{formatCurrency(Math.round(monthlySavings))}</strong>
        </div>
      </div>
    );
  };

  return (
    <div id="savings-projection-chart-container" className="card-theme relative overflow-hidden flex flex-col h-full space-y-4 border border-border-theme/60 bg-gradient-to-b from-surface-theme/90 via-surface-theme to-card-theme p-4 sm:p-5 rounded-2xl shadow-xl">
      {/* Decorative ambient glowing lights */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#a3e635]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border-theme/40 pb-3.5 relative z-10">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#a3e635] flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[#a3e635] animate-pulse" />
            Impacto Financiero Proyectado
          </span>
          <h3 className="text-base sm:text-lg font-black text-white mt-0.5 flex items-center gap-2">
            Proyección Acumulada a 12 Meses
          </h3>
        </div>

        {/* View Toggle Switch Tabs */}
        <div className="flex bg-surface-theme/80 p-1 rounded-xl border border-border-theme/60 backdrop-blur-md self-start sm:self-auto shadow-inner">
          <button
            onClick={() => setActiveTab("savings")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "savings"
                ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-500/20"
                : "text-text-dim-theme hover:text-white hover:bg-surface-hover-theme/50"
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Ahorro Neto</span>
          </button>
          <button
            onClick={() => setActiveTab("comparison")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "comparison"
                ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/20"
                : "text-text-dim-theme hover:text-white hover:bg-surface-hover-theme/50"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Comparar Costos</span>
          </button>
        </div>
      </div>

      {/* Quick Milestone Summary Chips */}
      <div className="grid grid-cols-2 gap-2 text-xs relative z-10">
        <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] uppercase font-bold text-emerald-300">Mes 6 (Semestral)</span>
          </div>
          <strong className="font-mono text-emerald-400 font-bold">${halfYearSavings.toLocaleString("es-MX")} MXN</strong>
        </div>
        <div className="bg-[#a3e635]/10 border border-[#a3e635]/30 rounded-xl p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#a3e635]" />
            <span className="text-[10px] uppercase font-bold text-[#a3e635]">Mes 12 (Anual)</span>
          </div>
          <strong className="font-mono text-[#a3e635] font-black">${fullYearSavings.toLocaleString("es-MX")} MXN</strong>
        </div>
      </div>

      {/* Main Graphic Chart Container */}
      <div className="h-[250px] w-full relative z-10 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === "savings" ? (
            chartType === "area" ? (
              <AreaChart data={chartData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.lime} stopOpacity={0.35}/>
                    <stop offset="50%" stopColor={colors.green} stopOpacity={0.15}/>
                    <stop offset="95%" stopColor={colors.green} stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.grid} />
                <XAxis 
                  dataKey="name" 
                  tickLine={false} 
                  axisLine={false} 
                  stroke={colors.text} 
                  style={{ fontSize: 10, fontFamily: "var(--font-sans)", fontWeight: 600 }}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  stroke={colors.text}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  style={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: colors.lime, strokeWidth: 1.5, strokeDasharray: "3 3" }} />
                <Area 
                  type="monotone" 
                  dataKey="Ahorro Neto" 
                  stroke={colors.lime} 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSavings)" 
                />
                <ReferenceLine 
                  y={monthlySavings * 12} 
                  stroke="#a3e635" 
                  strokeDasharray="4 4" 
                  strokeWidth={1.5}
                  label={{ 
                    value: `Meta Anual: $${(monthlySavings * 12).toLocaleString("es-MX", { maximumFractionDigits: 0 })}`, 
                    fill: "#a3e635", 
                    position: "top", 
                    fontSize: 10,
                    fontWeight: 800,
                    fontFamily: "var(--font-display)"
                  }} 
                />
              </AreaChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.grid} />
                <XAxis 
                  dataKey="name" 
                  tickLine={false} 
                  axisLine={false} 
                  stroke={colors.text} 
                  style={{ fontSize: 10, fontFamily: "var(--font-sans)", fontWeight: 600 }}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  stroke={colors.text}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  style={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(163, 230, 53, 0.05)" }} />
                <Bar 
                  dataKey="Ahorro Neto" 
                  fill={colors.green} 
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            )
          ) : (
            chartType === "area" ? (
              <AreaChart data={chartData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorShopify" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.red} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={colors.red} stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorTiendanube" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.accent} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={colors.accent} stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.grid} />
                <XAxis 
                  dataKey="name" 
                  tickLine={false} 
                  axisLine={false} 
                  stroke={colors.text} 
                  style={{ fontSize: 10, fontFamily: "var(--font-sans)", fontWeight: 600 }}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  stroke={colors.text}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  style={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: colors.grid, strokeWidth: 1.5 }} />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ 
                    fontSize: 11, 
                    fontFamily: "var(--font-display)", 
                    fontWeight: 700,
                    top: -10,
                    right: 0
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="Costo Shopify" 
                  stroke={colors.red} 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorShopify)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="Costo Tiendanube" 
                  stroke={colors.accent} 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorTiendanube)" 
                />
              </AreaChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.grid} />
                <XAxis 
                  dataKey="name" 
                  tickLine={false} 
                  axisLine={false} 
                  stroke={colors.text} 
                  style={{ fontSize: 10, fontFamily: "var(--font-sans)", fontWeight: 600 }}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  stroke={colors.text}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  style={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255, 255, 255, 0.03)" }} />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ 
                    fontSize: 11, 
                    fontFamily: "var(--font-display)", 
                    fontWeight: 700,
                    top: -10,
                    right: 0
                  }}
                />
                <Bar 
                  dataKey="Costo Shopify" 
                  fill={colors.red} 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={16}
                />
                <Bar 
                  dataKey="Costo Tiendanube" 
                  fill={colors.accent} 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={16}
                />
              </BarChart>
            )
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer Key stats and toggle type of visualization */}
      <div className="flex items-center justify-between pt-2.5 border-t border-border-theme/40 text-xs relative z-10">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-slate-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#a3e635] inline-block animate-pulse"></span>
            Ahorro Anual Proyectado:
          </span>
          <strong className="text-[#a3e635] font-black font-mono text-sm">
            {formatCurrency(monthlySavings * 12)}
          </strong>
        </div>

        {/* Chart View Mode Selector */}
        <div className="flex bg-surface-theme/60 p-0.5 rounded-lg border border-border-theme/50">
          <button
            onClick={() => setChartType("area")}
            title="Gráfico de área"
            className={`p-1.5 rounded cursor-pointer transition-colors ${
              chartType === "area"
                ? "bg-surface-hover-theme text-white border border-border-theme/30 shadow-sm"
                : "text-text-dim-theme hover:text-white"
            }`}
          >
            <LineChart className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setChartType("bar")}
            title="Gráfico de barras"
            className={`p-1.5 rounded cursor-pointer transition-colors ${
              chartType === "bar"
                ? "bg-surface-hover-theme text-white border border-border-theme/30 shadow-sm"
                : "text-text-dim-theme hover:text-white"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

