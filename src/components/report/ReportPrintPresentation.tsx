import React from "react";
import { Report } from "../../types";
import { formatReportDate } from "../../utils/formatters";
import { DonutRingChart, DonutSegment } from "./DonutRingChart";
import SavingsProjectionChart from "../SavingsProjectionChart";
import {
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Mail,
  Phone,
  Building2,
  Clock,
  DollarSign,
  Layers,
  ArrowRight,
  Sparkles
} from "lucide-react";

interface ReportPrintPresentationProps {
  report: Report;
}

export const ReportPrintPresentation: React.FC<ReportPrintPresentationProps> = ({ report }) => {
  const shopifyPlanUpper = (report.shopifyPlan || "grow").toUpperCase();
  const tiendanubePlanUpper = (report.tiendanubePlan || "evolution").toUpperCase();
  
  const minSavings = report.fugasRangoMin || 0;
  const maxSavings = report.fugasRangoMax || 0;
  const avgMonthlySavings = Math.round((minSavings + maxSavings) / 2);
  const annualSavings = avgMonthlySavings * 12;
  const threeYearSavings = annualSavings * 3;

  const totalAppCost = report.shopifyAppsCostMXN || (report.tools || []).reduce((acc, t) => {
    if (t.costType === "exact") return acc + (t.costExact || 0);
    return acc + ((t.costMin || 0) + (t.costMax || 0)) / 2;
  }, 0);

  const shopifyFeeMXN = (report.shopifyFee || 79) * 18.5;
  const shopifyCommissionMXN = report.gmv * 0.01; // ~1% est
  const totalShopifyMonthlyCostMXN = shopifyFeeMXN + shopifyCommissionMXN + totalAppCost;
  const projectedTiendanubeCostMXN = Math.max(0, totalShopifyMonthlyCostMXN - avgMonthlySavings);

  const donutSegments: DonutSegment[] = [
    { value: Math.round(totalAppCost), color: "#F59E0B", label: "Apps Terceros" },
    { value: Math.round(shopifyCommissionMXN), color: "#EF4444", label: "Comisiones Shopify" },
    { value: Math.round(shopifyFeeMXN), color: "#6366F1", label: "Suscripción Shopify" },
  ];

  return (
    <div className="print-presentation bg-[#0A0A0B] text-white selection:bg-indigo-500 selection:text-white">
      {/* ------------------------------------------------------------- */}
      {/* SLIDE 1: PORTADA */}
      {/* ------------------------------------------------------------- */}
      <div className="print-slide">
        <header className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            {report.logo && (
              <img
                src={report.logo}
                alt={report.name}
                className="h-10 max-w-[160px] object-contain rounded bg-white/5 p-1 border border-white/10"
              />
            )}
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-400">
                Diagnóstico Ejecutivo de Comercio Electrónico
              </span>
              <h1 className="text-xl font-black text-white leading-none mt-0.5">{report.name}</h1>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Fecha de Auditoría</span>
            <span className="text-xs font-semibold text-slate-200">{formatReportDate(report.createdAt)}</span>
          </div>
        </header>

        <main className="my-auto py-8 text-center space-y-6">
          <div className="flex justify-center">
            {report.logo ? (
              <div className="relative group">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 opacity-40 blur"></div>
                <img
                  src={report.logo}
                  alt={report.name}
                  className="relative w-28 h-28 rounded-full object-cover border-2 border-white/20 shadow-2xl bg-[#161618]"
                />
              </div>
            ) : (
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-5xl text-indigo-400 shadow-xl">
                {report.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="space-y-3 max-w-3xl mx-auto">
            <span className="text-indigo-400 text-xs font-extrabold uppercase tracking-widest block">
              "Tu tienda crece, ¿y tú?"
            </span>

            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
              Diagnóstico de{" "}
              {report.businessUrl || report.team?.teamBrandWebsite ? (
                <a
                  href={report.businessUrl || report.team?.teamBrandWebsite}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline cursor-pointer text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400"
                >
                  {report.name}
                </a>
              ) : (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400">
                  {report.name}
                </span>
              )}
            </h2>

            <p className="text-slate-300 text-sm max-w-2xl mx-auto leading-relaxed">
              {report.tagline || "Análisis estratégico de la eficiencia de tu pasarela de pagos, comisiones transaccionales y costos fijos de aplicaciones en tu tienda en línea."}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto pt-2">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Plan Actual</span>
              <span className="text-lg font-black text-amber-400">Shopify {shopifyPlanUpper}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Plan Propuesto</span>
              <span className="text-lg font-black text-emerald-400">Tiendanube {tiendanubePlanUpper}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Ahorro Anual Est.</span>
              <span className="text-lg font-black text-indigo-400">${annualSavings.toLocaleString("es-MX")} MXN</span>
            </div>
          </div>
        </main>

        <footer className="flex items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            {(report.team?.teamBrandLogo || report.team?.image) && (
              <img
                src={report.team?.teamBrandLogo || report.team?.image}
                alt={report.team?.name || "Logo Equipo"}
                className="h-6 w-auto object-contain rounded bg-white/5 p-0.5"
              />
            )}
            <span>Tlamatqui &bull; Documento Confidencial</span>
          </div>
          <span className="font-bold text-slate-300">Diapositiva 1 de 10</span>
        </footer>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SLIDE 2: RESUMEN EJECUTIVO */}
      {/* ------------------------------------------------------------- */}
      <div className="print-slide">
        <header className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Diapositiva 02</span>
            <h2 className="text-xl font-black text-white">Introducción al Diagnóstico Financiero</h2>
          </div>
          <span className="text-xs font-bold text-slate-400">{report.name}</span>
        </header>

        <main className="my-auto grid grid-cols-12 gap-6 py-4">
          <div className="col-span-7 space-y-4">
            <span className="text-rose-400 text-xs font-black uppercase tracking-widest block">
              Fugas de Margen Operativo Detectadas
            </span>
            <h3 className="text-2xl font-bold text-white leading-snug">
              Hemos detectado <span className="text-rose-400 font-extrabold">{report.fugasCantidad || (report.tools || []).length} fugas mayores</span> de capital
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Tras auditar la operativa actual de <strong>{report.name}</strong>, identificamos un impacto de{" "}
              <strong className="text-rose-400 font-bold">${minSavings.toLocaleString()} a ${maxSavings.toLocaleString()} MXN</strong>{" "}
              mensuales en comisiones por transacción y licenciamientos duplicados en Shopify.
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-300">Eliminación del 100% de Comisiones por Transacción</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Con Tiendanube {tiendanubePlanUpper}, tu tienda opera con <strong>0% de comisión por venta</strong>, recuperando margen neto inmediato.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-indigo-300">Consolidación Ecosistema de Apps</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Sustitución de complementos externos por funcionalidades nativas integradas sin cargo recurrente.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-5 flex flex-col justify-center items-center p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center">Desglose de Costos Actuales</h4>
            <DonutRingChart
              segments={donutSegments}
              centerText={`$${Math.round(totalShopifyMonthlyCostMXN).toLocaleString()} MXN`}
              centerSubtext="Gasto Mensual Estimado"
              size={170}
              strokeWidth={18}
            />
          </div>
        </main>

        <footer className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-400">
          <span>Resumen Ejecutivo</span>
          <span className="font-bold text-slate-300">Diapositiva 2 de 10</span>
        </footer>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SLIDE 3: STACK TECNOLÓGICO */}
      {/* ------------------------------------------------------------- */}
      <div className="print-slide">
        <header className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Diapositiva 03</span>
            <h2 className="text-xl font-black text-white">Auditoría de Herramientas & Aplicaciones</h2>
          </div>
          <span className="text-xs font-bold text-slate-400">Análisis de Terceros</span>
        </header>

        <main className="my-auto py-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-300">
              Evaluación del impacto financiero y nivel de riesgo de la suite de aplicaciones instaladas:
            </p>
            <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              Total Gasto Apps: ${totalAppCost.toLocaleString("es-MX")} MXN/mes
            </span>
          </div>

          <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/10 text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-2.5">Aplicación Auditada</th>
                  <th className="p-2.5">Categoría</th>
                  <th className="p-2.5 text-right">Costo Mensual</th>
                  <th className="p-2.5 text-center">Nivel de Riesgo</th>
                  <th className="p-2.5">Alternativa Tiendanube / Solución</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {(report.tools && report.tools.length > 0 ? report.tools.slice(0, 6) : [
                  { name: "App Genérica 1", category: "Checkout / Upsell", costExact: 1200, currency: "MXN", semaphore: "red", description: "Incluido nativamente en Tiendanube sin costo adicional." },
                  { name: "App Genérica 2", category: "Fidelización", costExact: 800, currency: "MXN", semaphore: "yellow", description: "Integración directa con app store de Tiendanube." }
                ]).map((tool, idx) => {
                  const costDisp = tool.costType === "exact"
                    ? `$${(tool.costExact || 0).toLocaleString("es-MX")} ${tool.currency || "USD"}`
                    : `$${(tool.costMin || 0)} - $${(tool.costMax || 0)} ${tool.currency || "USD"}`;
                  
                  let badgeColor = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
                  if (tool.semaphore === "red") badgeColor = "bg-rose-500/20 text-rose-300 border-rose-500/30";
                  if (tool.semaphore === "yellow") badgeColor = "bg-amber-500/20 text-amber-300 border-amber-500/30";

                  return (
                    <tr key={idx} className="hover:bg-white/5">
                      <td className="p-2.5 font-bold text-white">{tool.name}</td>
                      <td className="p-2.5 text-slate-400">{tool.category}</td>
                      <td className="p-2.5 text-right font-mono font-semibold text-slate-200">{costDisp}</td>
                      <td className="p-2.5 text-center">
                        <span className={`inline-block px-2 py-0.5 text-[9px] uppercase font-bold rounded border ${badgeColor}`}>
                          {tool.semaphore}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-300">{tool.description || "Solución nativa sin costo"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </main>

        <footer className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-400">
          <span>Auditoría de Herramientas</span>
          <span className="font-bold text-slate-300">Diapositiva 3 de 10</span>
        </footer>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SLIDE 4: COSTOS OCULTOS */}
      {/* ------------------------------------------------------------- */}
      <div className="print-slide">
        <header className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Diapositiva 04</span>
            <h2 className="text-xl font-black text-white">Desglose de Costos Ocultos & Comisiones</h2>
          </div>
          <span className="text-xs font-bold text-slate-400">Estructura Financiera</span>
        </header>

        <main className="my-auto grid grid-cols-2 gap-6 py-4">
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <span>Estructura de Costos en Shopify</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex justify-between items-center">
                <div>
                  <span className="font-bold text-white block">Suscripción Fija Mensual</span>
                  <span className="text-[10px] text-slate-400">Plan Shopify {shopifyPlanUpper}</span>
                </div>
                <span className="font-mono text-sm font-bold text-amber-300">
                  ${(report.shopifyFee || 79).toLocaleString("es-MX")} USD/mes
                </span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex justify-between items-center">
                <div>
                  <span className="font-bold text-white block">Comisión Por Transacción</span>
                  <span className="text-[10px] text-slate-400">Cobro sobre ventas procesadas</span>
                </div>
                <span className="font-mono text-sm font-bold text-rose-400">0.5% - 2.0% por venta</span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex justify-between items-center">
                <div>
                  <span className="font-bold text-white block">Gasto en Aplicaciones Terceras</span>
                  <span className="text-[10px] text-slate-400">Complementos y add-ons externos</span>
                </div>
                <span className="font-mono text-sm font-bold text-amber-400">
                  ${totalAppCost.toLocaleString("es-MX")} MXN/mes
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-4">
            <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Modelo Transparente en Tiendanube</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/20 flex justify-between items-center">
                <div>
                  <span className="font-bold text-white block">Suscripción Plan Tiendanube</span>
                  <span className="text-[10px] text-slate-400">Plan {tiendanubePlanUpper}</span>
                </div>
                <span className="font-mono text-sm font-bold text-emerald-300">Tarifa Fija Transparente</span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/20 flex justify-between items-center">
                <div>
                  <span className="font-bold text-white block">Comisión Por Transacción</span>
                  <span className="text-[10px] text-slate-400">Sin penalización por uso de pasarelas</span>
                </div>
                <span className="font-mono text-sm font-black text-emerald-400">0% SIEMPRE</span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/20 flex justify-between items-center">
                <div>
                  <span className="font-bold text-white block">Funcionalidades Nativas Integradas</span>
                  <span className="text-[10px] text-slate-400">Checkout personalizado & cupones</span>
                </div>
                <span className="font-mono text-sm font-bold text-indigo-300">Incluido en la plataforma</span>
              </div>
            </div>
          </div>
        </main>

        <footer className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-400">
          <span>Costos Ocultos</span>
          <span className="font-bold text-slate-300">Diapositiva 4 de 10</span>
        </footer>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SLIDE 5: COMPARATIVO DIRECTO */}
      {/* ------------------------------------------------------------- */}
      <div className="print-slide">
        <header className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Diapositiva 05</span>
            <h2 className="text-xl font-black text-white">Matriz Comparativa Directa</h2>
          </div>
          <span className="text-xs font-bold text-slate-400">Shopify vs. Tiendanube</span>
        </header>

        <main className="my-auto py-3">
          <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/10 text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-2.5 w-1/4">Variable Auditada</th>
                  <th className="p-2.5 w-1/3">Condición en Shopify</th>
                  <th className="p-2.5 w-1/3 text-emerald-300">Ventaja Competitiva Tiendanube</th>
                  <th className="p-2.5 text-center">Destacado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {(report.comparisonRows && report.comparisonRows.length > 0 ? report.comparisonRows.slice(0, 5) : [
                  { variable: "Comisiones por Transacción", shopify: "Cobro adicional por cada venta efectuada.", tiendanube: "0% de comisión por venta en todos los planes.", pillText: "Ahorro Directo" },
                  { variable: "Pasarelas de Pago Locales", shopify: "Restricciones y sobrecostos en pasarelas MX/LATAM.", tiendanube: "Integración nativa con PagoNube, Mercado Pago, Stripe.", pillText: "Mayor Conversión" },
                  { variable: "Soporte Técnico en Español", shopify: "Soporte genérico por tickets o bot en inglés.", tiendanube: "Atención personalizada 1 a 1 y equipo dedicado.", pillText: "Atención Local" }
                ]).map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/5">
                    <td className="p-2.5 font-bold text-white">{row.variable}</td>
                    <td className="p-2.5 text-slate-400">{row.shopify}</td>
                    <td className="p-2.5 text-emerald-300 font-semibold">{row.tiendanube}</td>
                    <td className="p-2.5 text-center">
                      <span className="inline-block px-2.5 py-0.5 text-[9px] font-extrabold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {row.pillText}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>

        <footer className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-400">
          <span>Matriz Comparativa</span>
          <span className="font-bold text-slate-300">Diapositiva 5 de 10</span>
        </footer>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SLIDE 6: CALCULADORA DE AHORRO */}
      {/* ------------------------------------------------------------- */}
      <div className="print-slide">
        <header className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Diapositiva 06</span>
            <h2 className="text-xl font-black text-white">Calculadora Financiera de Ahorro Real</h2>
          </div>
          <span className="text-xs font-bold text-slate-400">Simulación Proyectada</span>
        </header>

        <main className="my-auto grid grid-cols-3 gap-6 py-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Volumen Ventas (GMV Mensual)</span>
            <div className="text-2xl font-black text-white">${report.gmv.toLocaleString("es-MX")} MXN</div>
            <span className="text-[10px] text-slate-400 block">Base de cálculo del diagnóstico</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2 text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-400">Ahorro Mensual Estimado</span>
            <div className="text-2xl font-black text-emerald-400">
              ${avgMonthlySavings.toLocaleString("es-MX")} MXN
            </div>
            <span className="text-[10px] text-emerald-300/80 block">Retorno directo a margen operativo</span>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-2 text-center">
            <span className="text-[10px] uppercase font-bold text-indigo-400">Ahorro Anual Acumulado</span>
            <div className="text-2xl font-black text-indigo-300">
              ${annualSavings.toLocaleString("es-MX")} MXN
            </div>
            <span className="text-[10px] text-indigo-300/80 block">Impacto en flujo de caja a 12 meses</span>
          </div>

          <div className="col-span-3 p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Composición del Ahorro Estimado
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex justify-between">
                <span className="text-slate-400">Ahorro por Comisiones (0% Tiendanube):</span>
                <span className="font-bold text-emerald-400">~${Math.round(avgMonthlySavings * 0.65).toLocaleString("es-MX")} MXN/mes</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex justify-between">
                <span className="text-slate-400">Ahorro por Reemplazo de Apps:</span>
                <span className="font-bold text-indigo-400">~${Math.round(avgMonthlySavings * 0.35).toLocaleString("es-MX")} MXN/mes</span>
              </div>
            </div>
          </div>
        </main>

        <footer className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-400">
          <span>Calculadora de Ahorro</span>
          <span className="font-bold text-slate-300">Diapositiva 6 de 10</span>
        </footer>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SLIDE 7: RENTABILIDAD CON GRÁFICO RECHARTS */}
      {/* ------------------------------------------------------------- */}
      <div className="print-slide">
        <header className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Diapositiva 07</span>
            <h2 className="text-xl font-black text-white">Proyección de Rentabilidad & Gráfico ROI</h2>
          </div>
          <span className="text-xs font-bold text-slate-400">Impacto Financiero Proyectado</span>
        </header>

        <main className="my-auto py-2 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-center space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Año 1</span>
              <div className="text-2xl font-black text-emerald-400">${annualSavings.toLocaleString("es-MX")} MXN</div>
              <span className="text-[9px] text-slate-400">12 meses acumulados</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-center space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Año 2</span>
              <div className="text-2xl font-black text-emerald-300">${(annualSavings * 2).toLocaleString("es-MX")} MXN</div>
              <span className="text-[9px] text-slate-400">24 meses acumulados</span>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-center space-y-0.5">
              <span className="text-[10px] font-bold text-indigo-400 uppercase">Año 3</span>
              <div className="text-2xl font-black text-indigo-300">${threeYearSavings.toLocaleString("es-MX")} MXN</div>
              <span className="text-[9px] text-indigo-300">36 meses acumulados</span>
            </div>
          </div>

          {/* Gráfico Recharts exactamente igual al sitio web */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Curva de Ahorro Acumulado Proyectado a 12 Meses
            </h4>
            <div className="h-44 w-full">
              <SavingsProjectionChart
                monthlyShopifyCost={Math.round(totalShopifyMonthlyCostMXN)}
                monthlyTiendanubeCost={Math.round(projectedTiendanubeCostMXN)}
                monthlySavings={avgMonthlySavings}
                isDarkMode={true}
              />
            </div>
          </div>
        </main>

        <footer className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-400">
          <span>Proyección de Rentabilidad</span>
          <span className="font-bold text-slate-300">Diapositiva 7 de 10</span>
        </footer>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SLIDE 8: RESUMEN DE VENTAJAS */}
      {/* ------------------------------------------------------------- */}
      <div className="print-slide">
        <header className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Diapositiva 08</span>
            <h2 className="text-xl font-black text-white">Resumen de Ventajas Competitivas Tiendanube</h2>
          </div>
          <span className="text-xs font-bold text-slate-400">Valor Estratégico</span>
        </header>

        <main className="my-auto grid grid-cols-2 gap-4 py-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-1" />
            <div>
              <h3 className="text-sm font-bold text-white">0% Comisiones por Transacción</h3>
              <p className="text-xs text-slate-300 mt-1">
                Maximiza el margen neto de cada orden procesada en la tienda sin cargos sorpresa al final del mes.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
            <Zap className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
            <div>
              <h3 className="text-sm font-bold text-white">Checkout Optimizado para Convertir</h3>
              <p className="text-xs text-slate-300 mt-1">
                Experiencia fluida y rápida adaptable a hábitos de compra locales con auto-completado de dirección.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
            <Building2 className="w-6 h-6 text-amber-400 shrink-0 mt-1" />
            <div>
              <h3 className="text-sm font-bold text-white">Ecosistema Local de Pasarelas y Envíos</h3>
              <p className="text-xs text-slate-300 mt-1">
                Conexión transparente con Mercado Pago, PagoNube, Skydropx, 99minutos y paqueterías líderes en la región.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-purple-400 shrink-0 mt-1" />
            <div>
              <h3 className="text-sm font-bold text-white">Soporte Técnico Especializado en Español</h3>
              <p className="text-xs text-slate-300 mt-1">
                Acompañamiento humano 1 a 1 de un equipo de ingenieros y especialistas en e-commerce.
              </p>
            </div>
          </div>
        </main>

        <footer className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-400">
          <span>Ventajas Competitivas</span>
          <span className="font-bold text-slate-300">Diapositiva 8 de 10</span>
        </footer>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SLIDE 9: PLAN DE MIGRACIÓN */}
      {/* ------------------------------------------------------------- */}
      <div className="print-slide">
        <header className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Diapositiva 09</span>
            <h2 className="text-xl font-black text-white">Plan de Migración en 4 Fases</h2>
          </div>
          <span className="text-xs font-bold text-slate-400">Roadmap Operativo</span>
        </header>

        <main className="my-auto py-4 space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-extrabold border border-indigo-500/30">1</span>
              <h3 className="text-xs font-bold text-white">Extracción & Datos</h3>
              <p className="text-[11px] text-slate-300 leading-normal">
                Exportación segura de catálogo de productos, clientes e inventario desde Shopify.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-extrabold border border-indigo-500/30">2</span>
              <h3 className="text-xs font-bold text-white">Diseño & Setup</h3>
              <p className="text-[11px] text-slate-300 leading-normal">
                Configuración del diseño, arquitectura de navegación y experiencia móvil en Tiendanube.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-extrabold border border-indigo-500/30">3</span>
              <h3 className="text-xs font-bold text-white">Integraciones & Pagos</h3>
              <p className="text-[11px] text-slate-300 leading-normal">
                Activación de pasarelas de pago, logística de envíos y píxeles de medición.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs font-extrabold border border-emerald-500/30">4</span>
              <h3 className="text-xs font-bold text-emerald-300">Dominio & Go-Live</h3>
              <p className="text-[11px] text-slate-300 leading-normal">
                Redirección de dominio oficial y lanzamiento sin interrupción de ventas (cero downtime).
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
            <span className="text-xs font-semibold text-slate-300">
              Garantía de Migración Limpia: Mantenimiento del posicionamiento SEO existente e historial comercial.
            </span>
          </div>
        </main>

        <footer className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-400">
          <span>Plan de Migración</span>
          <span className="font-bold text-slate-300">Diapositiva 9 de 10</span>
        </footer>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SLIDE 10: CONTACTO & CIERRE */}
      {/* ------------------------------------------------------------- */}
      <div className="print-slide">
        <header className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Diapositiva 10</span>
            <h2 className="text-xl font-black text-white">Próximos Pasos & Contacto Comercial</h2>
          </div>
          <span className="text-xs font-bold text-slate-400">Inicio de Proyecto</span>
        </header>

        <main className="my-auto text-center space-y-6 py-4">
          <div className="max-w-2xl mx-auto space-y-3">
            <h3 className="text-3xl font-black text-white">
              ¿Listo para potenciar la rentabilidad de {report.name}?
            </h3>
            <p className="text-sm text-slate-300">
              Agenda una sesión ejecutiva para coordinar la migración y activar tus beneficios exclusivos en Tiendanube.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto pt-2">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Correo de Contacto</span>
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{report.contactEmail || "contacto@tiendanube.com"}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">WhatsApp Asignado</span>
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{report.contactWhatsapp || "+52 55 0000 0000"}</span>
              </div>
            </div>
          </div>

          {/* Logos de Equipo y Aliados (Mismo Tamaño) */}
          {(() => {
            const teamLogo = report.team?.teamBrandLogo || report.team?.image;
            const allies = report.team?.allies || [];
            const hasLogos = Boolean(teamLogo || allies.length > 0);

            if (!hasLogos) return null;

            return (
              <div className="pt-4 border-t border-white/10 max-w-3xl mx-auto">
                <div className="flex items-center justify-center gap-6 flex-wrap">
                  {teamLogo && (
                    <div className="h-12 w-32 flex items-center justify-center p-2 rounded-xl bg-white/5 border border-white/10">
                      <img src={teamLogo} alt={report.team?.name || "Logo Equipo"} className="max-h-full max-w-full object-contain" />
                    </div>
                  )}
                  {allies.map((ally) => (
                    <a key={ally.id} href={ally.url} target="_blank" rel="noreferrer" title={ally.name} className="h-12 w-32 flex items-center justify-center p-2 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-all cursor-pointer">
                      <img src={ally.logo} alt={ally.name} className="max-h-full max-w-full object-contain" />
                    </a>
                  ))}
                </div>
              </div>
            );
          })()}
        </main>

        <footer className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-400">
          <span>Tlamatqui &bull; Documento Generado</span>
          <span className="font-bold text-slate-300">Diapositiva 10 de 10</span>
        </footer>
      </div>
    </div>
  );
};
