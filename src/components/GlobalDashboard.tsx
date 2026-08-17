import React, { useState } from "react";
import { 
  LayoutDashboard, TrendingUp, Users, Eye, EyeOff, MessageSquare, 
  Award, ArrowUpRight, Search, Copy, Check, FileText, Sparkles, 
  DollarSign, Percent
} from "lucide-react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, PieChart, Pie, Cell
} from "recharts";
import { Report } from "../types";

/**
 * Propiedades del componente GlobalDashboard.
 */
interface GlobalDashboardProps {
  /** Arreglo de reportes creados en la plataforma */
  reports: Report[];
  /** Tipo de cambio configurado USD/MXN */
  customExchangeRate: number;
  /** Función de cálculo de ahorro proyectado por reporte */
  calculateReportSavings: (report: Report, exchangeRate?: number) => number;
  /** Función de apertura de reporte por ID */
  onViewReport: (id: string) => void;
  /** Estado del tema activo (Dark/Light mode) */
  isDarkMode: boolean;
}

/**
 * Dashboard Ejecutivo Global.
 * Muestra el resumen analítico agregado de todos los comercios auditados, métricas acumuladas de GMV,
 * tasa de conversión de leads, distribución de fugas por categoría y clasificación de clientes.
 */
export default function GlobalDashboard({ 
  reports, 
  customExchangeRate, 
  calculateReportSavings, 
  onViewReport, 
  isDarkMode 
}: GlobalDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Colores adaptativos para gráficas Recharts según el tema activo
  const colors = {
    accent: isDarkMode ? "#6366F1" : "#4F46E5",
    green: isDarkMode ? "#10B981" : "#059669",
    yellow: isDarkMode ? "#F59E0B" : "#D97706",
    red: isDarkMode ? "#EF4444" : "#DC2626",
    cyan: isDarkMode ? "#06B6D4" : "#0891B2",
    purple: isDarkMode ? "#8B5CF6" : "#7C3AED",
    grid: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(9, 9, 11, 0.05)",
    text: isDarkMode ? "#8E8E93" : "#71717A",
    tooltipBg: isDarkMode ? "#161618" : "#FFFFFF",
    tooltipBorder: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(9, 9, 11, 0.08)",
  };

  // Cálculos estadísticos agregados
  const totalCreated = reports.length;
  const viewedCount = reports.filter(r => (r.viewCount || 0) > 0).length;
  const notViewedCount = totalCreated - viewedCount;
  
  // Conteo de Leads (diagnósticos con interacción en botón de WhatsApp)
  const leadsCount = reports.filter(r => (r.interactions?.whatsappClicks || 0) > 0).length;
  const notLeadsCount = totalCreated - leadsCount;

  // Totales acumulados
  const totalViews = reports.reduce((acc, r) => acc + (r.viewCount || 0), 0);
  const totalClicks = reports.reduce((acc, r) => acc + (r.openCount || 0), 0);
  const totalWhatsappClicks = reports.reduce((acc, r) => acc + (r.interactions?.whatsappClicks || 0), 0);
  const totalGmv = reports.reduce((acc, r) => acc + (r.gmv || 0), 0);
  
  // Promedio de GMV por tienda
  const averageGmv = totalCreated > 0 ? totalGmv / totalCreated : 0;

  // Tasas porcentuales
  const viewRate = totalCreated > 0 ? (viewedCount / totalCreated) * 100 : 0;
  const leadRateOfTotal = totalCreated > 0 ? (leadsCount / totalCreated) * 100 : 0;
  const conversionRate = viewedCount > 0 ? (leadsCount / viewedCount) * 100 : 0;

  /**
   * Copia la URL compartible del reporte al portapapeles del usuario.
   * @param {string} id - ID del reporte.
   * @param {React.MouseEvent} e - Evento de clic en el botón.
   */
  const handleCopyLink = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const reportLink = `${window.location.origin}/?report=${id}&shared=true`;
    navigator.clipboard.writeText(reportLink);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Pie Chart Data: Vistos vs No Vistos
  const viewPieData = [
    { name: "Vistos", value: viewedCount, color: colors.accent },
    { name: "No Vistos", value: notViewedCount, color: colors.red }
  ];

  // Pie Chart Data: Leads vs No Leads
  const leadPieData = [
    { name: "Leads (WhatsApp Click)", value: leadsCount, color: colors.green },
    { name: "Sin Contacto", value: notLeadsCount, color: colors.text }
  ];

  // Bar Chart Data: Diagnostics overview
  const diagnosticsOverviewData = reports.map(r => ({
    name: r.name,
    Vistas: r.viewCount || 0,
    Clics: r.openCount || 0,
    Contacto: r.interactions?.whatsappClicks || 0,
    GMVK: Math.round((r.gmv || 0) / 1000)
  }));

  // Filtered reports for list
  const filteredReports = reports.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Diagnostics */}
        <div className="p-5 rounded-xl border border-border-theme bg-surface-theme/60 backdrop-blur-sm flex flex-col justify-between h-36">
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold uppercase text-text-dim-theme tracking-wider">Diagnósticos</span>
            <div className="p-1.5 rounded-lg bg-accent-theme/10 text-accent-theme">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold font-mono text-white mt-1">{totalCreated}</h3>
            <p className="text-[10px] text-text-dim-theme mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-theme"></span>
              Comercios auditados en total
            </p>
          </div>
        </div>

        {/* KPI 2: Viewed vs Not Viewed */}
        <div className="p-5 rounded-xl border border-border-theme bg-surface-theme/60 backdrop-blur-sm flex flex-col justify-between h-36">
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold uppercase text-text-dim-theme tracking-wider">Estado de Lectura</span>
            <div className="p-1.5 rounded-lg bg-green-theme/10 text-green-theme flex gap-1 items-center">
              <Eye className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold font-mono text-white mt-1 flex items-baseline gap-2">
              <span>{viewedCount}</span>
              <span className="text-xs font-normal text-text-dim-theme font-sans">vistos</span>
              <span className="text-slate-400 font-normal">/</span>
              <span className="text-lg text-slate-300 font-semibold">{notViewedCount}</span>
              <span className="text-xs font-normal text-text-dim-theme font-sans">pendientes</span>
            </h3>
            <p className="text-[10px] text-text-dim-theme mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-theme"></span>
              Tasa de apertura: <strong className="text-green-theme">{viewRate.toFixed(1)}%</strong>
            </p>
          </div>
        </div>

        {/* KPI 3: Leads (WhatsApp click) */}
        <div className="p-5 rounded-xl border border-border-theme bg-surface-theme/60 backdrop-blur-sm flex flex-col justify-between h-36">
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold uppercase text-text-dim-theme tracking-wider">Prospectos Calificados</span>
            <div className="p-1.5 rounded-lg bg-cyan-theme/10 text-cyan-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-bold font-mono text-cyan-400 mt-1 flex items-baseline gap-2">
              <span>{leadsCount}</span>
              <span className="text-xs font-normal text-text-dim-theme font-sans">leads hot 🔥</span>
            </h3>
            <p className="text-[10px] text-text-dim-theme mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              Conversión de vistos: <strong className="text-cyan-400">{conversionRate.toFixed(1)}%</strong>
            </p>
          </div>
        </div>

        {/* KPI 4: Total GMV */}
        <div className="p-5 rounded-xl border border-border-theme bg-surface-theme/60 backdrop-blur-sm flex flex-col justify-between h-36">
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold uppercase text-text-dim-theme tracking-wider">GMV Mensual Total</span>
            <div className="p-1.5 rounded-lg bg-yellow-theme/10 text-yellow-theme">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold font-mono text-yellow-theme mt-1 truncate">
              ${totalGmv.toLocaleString()}
              <span className="text-xs font-sans text-text-dim-theme ml-1">MXN</span>
            </h3>
            <p className="text-[10px] text-text-dim-theme mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-theme"></span>
              Promedio: <strong className="text-white">${Math.round(averageGmv).toLocaleString()}</strong> por tienda
            </p>
          </div>
        </div>

      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Diagnostics Performance Metrics (Left 2 Columns) */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-border-theme bg-surface-theme/55 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between gap-4 border-b border-border-theme pb-4 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent-theme" />
                Interacciones y GMV por Comercio
              </h3>
              <p className="text-xs text-text-dim-theme">Comparativo global de vistas, clics y GMV en miles de pesos.</p>
            </div>
          </div>

          <div className="h-80 w-full mt-2">
            {reports.length === 0 ? (
              <div className="h-full flex items-center justify-center text-text-dim-theme text-xs">
                No hay datos disponibles para graficar
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={diagnosticsOverviewData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                  <XAxis dataKey="name" stroke={colors.text} fontSize={10} tickLine={false} />
                  <YAxis stroke={colors.text} fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: colors.tooltipBg, 
                      borderColor: colors.tooltipBorder, 
                      borderRadius: "8px", 
                      fontSize: "11px", 
                      color: isDarkMode ? "#fff" : "#000" 
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="Vistas" fill={colors.accent} name="Vistas Web" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Clics" fill={colors.purple} name="Clics Enlace" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Contacto" fill={colors.green} name="Leads (WhatsApp)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="GMVK" fill={colors.yellow} name="GMV Mensual (k$ MXN)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Distributive Pies (Right 1 Column) */}
        <div className="p-5 rounded-xl border border-border-theme bg-surface-theme/55 backdrop-blur-md flex flex-col justify-between h-[395px]">
          <div className="border-b border-border-theme pb-4 mb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Percent className="w-4 h-4 text-green-theme" />
              Tasas de Conversión
            </h3>
            <p className="text-xs text-text-dim-theme">Desglose de estados y conversión del embudo comercial.</p>
          </div>

          <div className="flex-1 grid grid-rows-2 gap-4 items-center">
            
            {/* Pie 1: Vistas */}
            <div className="flex items-center gap-4 bg-bg-theme/40 p-3 rounded-lg border border-border-theme/40">
              <div className="w-24 h-24 shrink-0 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={viewPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={22}
                      outerRadius={36}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {viewPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute text-[10px] font-bold font-mono text-white text-center">
                  {viewRate.toFixed(0)}%
                </div>
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block">Apertura de Diagnósticos</span>
                <span className="text-[10px] text-text-dim-theme block mb-1">¿Cuántos clientes abrieron el link?</span>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] font-mono">
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.accent }}></span>Vistos: {viewedCount}</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.red }}></span>Pendientes: {notViewedCount}</span>
                </div>
              </div>
            </div>

            {/* Pie 2: Leads */}
            <div className="flex items-center gap-4 bg-bg-theme/40 p-3 rounded-lg border border-border-theme/40">
              <div className="w-24 h-24 shrink-0 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={22}
                      outerRadius={36}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {leadPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute text-[10px] font-bold font-mono text-green-theme text-center">
                  {leadRateOfTotal.toFixed(0)}%
                </div>
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block">Conversión a Leads</span>
                <span className="text-[10px] text-text-dim-theme block mb-1">¿Cuántos hicieron clic en WhatsApp?</span>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] font-mono">
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.green }}></span>Leads: {leadsCount}</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.text }}></span>Sin interés: {notLeadsCount}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Detailed List with search filter */}
      <div className="p-6 rounded-xl border border-border-theme bg-surface-theme/55 backdrop-blur-md space-y-4">
        
        {/* Header table and search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-theme pb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 text-accent-theme" />
              Detalle y Trazabilidad de Diagnósticos
            </h3>
            <p className="text-xs text-text-dim-theme">Lista interactiva para monitorear el estado individual de conversión.</p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-dim-theme" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por comercio o ID..."
              className="w-full text-xs pl-9 pr-4 py-2 rounded-lg border outline-none focus:ring-1 focus:ring-accent-theme bg-bg-theme border-border-theme focus:border-text-dim-theme text-white"
            />
          </div>
        </div>

        {/* Actual Table */}
        <div className="overflow-x-auto">
          {filteredReports.length === 0 ? (
            <div className="p-8 text-center text-xs text-text-dim-theme">
              No se encontraron diagnósticos que coincidan con la búsqueda.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border-theme/40 text-text-dim-theme uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-3 px-4">Comercio</th>
                  <th className="py-3 px-4">GMV Mensual</th>
                  <th className="py-3 px-4 text-center">Vistas</th>
                  <th className="py-3 px-4 text-center">Clics Enlace</th>
                  <th className="py-3 px-4 text-center">Clics WhatsApp</th>
                  <th className="py-3 px-4">Estado / Conversión</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-theme/20">
                {filteredReports.map((report) => {
                  const hasViews = (report.viewCount || 0) > 0;
                  const whatsappClicks = report.interactions?.whatsappClicks || 0;
                  const isLead = whatsappClicks > 0;
                  const savings = calculateReportSavings(report, customExchangeRate);

                  // Status badge styling
                  let statusLabel = "No Visto 💤";
                  let statusClass = "bg-slate-500/10 text-slate-400 border-slate-500/20";
                  if (isLead) {
                    statusLabel = "Lead Calificado 🔥";
                    statusClass = "bg-green-theme/10 text-green-theme border-green-theme/20 font-bold";
                  } else if (hasViews) {
                    statusLabel = "Visto por Cliente 👀";
                    statusClass = "bg-accent-theme/10 text-accent-theme border-accent-theme/20";
                  }

                  return (
                    <tr 
                      key={report.id} 
                      className="hover:bg-surface-hover-theme/30 transition-colors group"
                    >
                      {/* Name / Logo */}
                      <td className="py-4 px-4 font-bold text-white flex items-center gap-2.5">
                        {report.logo ? (
                          <img src={report.logo} alt={report.name} className="w-6 h-6 object-cover rounded border border-border-theme bg-bg-theme shrink-0" />
                        ) : (
                          <div className="w-6 h-6 rounded bg-accent-theme/10 border border-accent-theme/30 flex items-center justify-center font-bold text-accent-theme text-[10px] shrink-0">
                            {report.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="truncate">
                          <span className="block truncate">{report.name}</span>
                          <span className="text-[10px] font-mono text-text-dim-theme font-normal block">ID: {report.id}</span>
                        </div>
                      </td>

                      {/* GMV */}
                      <td className="py-4 px-4 font-mono text-slate-300">
                        ${report.gmv.toLocaleString()} MXN
                      </td>

                      {/* View count */}
                      <td className="py-4 px-4 text-center font-mono font-semibold text-white">
                        {report.viewCount || 0}
                      </td>

                      {/* Clics */}
                      <td className="py-4 px-4 text-center font-mono text-slate-300">
                        {report.openCount || 0}
                      </td>

                      {/* WhatsApp clics */}
                      <td className="py-4 px-4 text-center font-mono text-slate-300">
                        {whatsappClicks}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] border ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => onViewReport(report.id)}
                            className="p-1 rounded-md border border-border-theme bg-bg-theme hover:bg-surface-hover-theme text-slate-300 transition-all cursor-pointer"
                            title="Ver reporte interactivo"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={(e) => handleCopyLink(report.id, e)}
                            className={`p-1 rounded-md border transition-all cursor-pointer ${copiedId === report.id ? "bg-green-theme/10 border-green-theme/20 text-green-theme" : "bg-bg-theme hover:bg-surface-hover-theme border-border-theme text-slate-300"}`}
                            title="Copiar link"
                          >
                            {copiedId === report.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Custom Pro Tip Card */}
      <div className="p-5 rounded-xl border border-border-theme bg-surface-theme/55 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1.5 text-center md:text-left">
          <h4 className="text-sm font-bold text-white flex items-center justify-center md:justify-start gap-1.5">
            <Sparkles className="w-4 h-4 text-accent-theme" />
            Estrategia de Generación de Demanda
          </h4>
          <p className="text-xs text-text-dim-theme max-w-2xl">
            Para convertir más diagnósticos en leads, asegúrate de compartir el link personalizado con tus prospectos. Cuando exploren su diagnóstico personalizado de comisiones y detecten fugas, se registrarán visitas en tiempo real. ¡El botón de WhatsApp es tu llamada a la acción principal!
          </p>
        </div>
        <button 
          onClick={() => {
            const firstWithLink = reports.find(r => r.id);
            if (firstWithLink) {
              const url = `${window.location.origin}/?report=${firstWithLink.id}&shared=true`;
              navigator.clipboard.writeText(url);
              alert("¡Se copió un link de ejemplo de diagnóstico compartido!");
            } else {
              alert("Por favor crea un diagnóstico primero.");
            }
          }}
          className="bg-accent-theme hover:bg-accent-theme/90 text-white font-semibold text-xs px-4.5 py-2.5 rounded-lg shrink-0 transition-all cursor-pointer shadow-md active:scale-95 flex items-center gap-1.5"
        >
          Copiar Link de Prueba
        </button>
      </div>

    </div>
  );
}
