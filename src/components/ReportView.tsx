/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { 
  ArrowLeft, ArrowRight, DollarSign, HelpCircle, Shield, 
  Percent, Smartphone, MessageSquare, AlertCircle, TrendingUp, 
  Clock, ExternalLink, Mail, Phone, Lock, Zap, Layers, ChevronLeft, ChevronRight, CheckSquare, X, Menu, Sliders,
  Eye, EyeOff, Download, Printer, Database, Palette, CreditCard, Truck, Rocket, CheckCircle2, Sparkles, ArrowDown, Calendar, Share2,
  FileSpreadsheet, FileText
} from "lucide-react";
import { Report, Tool, ComparisonRow } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Tooltip } from "./Tooltip";
import RealTimeDashboard from "./RealTimeDashboard";
import SavingsProjectionChart from "./SavingsProjectionChart";
import { exportReportToCSV, exportReportToExcel, exportReportToMarkdown, exportReportToPrintPDF } from "../lib/exporter";
import { formatReportDate, formatAbbreviatedAmount } from "../utils/formatters";
import { getVisitorId, sendReportInteraction } from "../utils/telemetryHelpers";
import { ReportPrintPresentation } from "./report/ReportPrintPresentation";
import SendEmailModal from "./SendEmailModal";
import { ShareReportModal } from "./ShareReportModal";

/**
 * Propiedades del componente ReportView.
 */
interface ReportViewProps {
  /** ID del reporte de diagnóstico a visualizar */
  reportId: string;
  /** Función para regresar al panel administrativo */
  onBackToAdmin: () => void;
  /** Tema activo (Dark/Light mode) */
  isDarkMode: boolean;
  /** Indica si la vista está en modo compartible para clientes (?shared=true) */
  isShared?: boolean;
}

interface DonutSegment {
  value: number;
  color: string;
  label: string;
}

/**
 * Componente gráfico SVG de dona animado para desglosar la estructura de costos y comisiones.
 */
function DonutRing({ segments, centerText, centerSubtext, size = 180, strokeWidth = 18, textClass = "" }: {
  segments: DonutSegment[];
  centerText: string;
  centerSubtext: string;
  size?: number;
  strokeWidth?: number;
  textClass?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Sum up positive values
  const totalVal = segments.reduce((acc, s) => acc + Math.max(0, s.value), 0);
  const normalizedSegments = segments.map(s => ({
    ...s,
    percent: totalVal > 0 ? (Math.max(0, s.value) / totalVal) * 100 : 0
  }));

  let accumulatedPercent = 0;

  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
        />
        {normalizedSegments.map((seg, idx) => {
          if (seg.percent <= 0) return null;
          
          const strokeLength = (seg.percent / 100) * circumference;
          const strokeOffset = -(accumulatedPercent / 100) * circumference;
          accumulatedPercent += seg.percent;

          return (
            <motion.circle
              key={idx}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${strokeLength} ${circumference}`}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: strokeOffset }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          );
        })}
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-1">
        <span className={`text-[15px] sm:text-2xl md:text-3xl font-black tracking-tight leading-none ${textClass}`}>{centerText}</span>
        <span className="text-[8px] sm:text-[10px] uppercase tracking-wider text-text-dim-theme font-bold mt-0.5 leading-none">{centerSubtext}</span>
      </div>
    </div>
  );
}

const slideVariants = {
  enter: (direction: "left" | "right") => ({
    x: direction === "right" ? 150 : -150,
    opacity: 0,
    scale: 0.98
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: [0.25, 1, 0.5, 1] as any
    }
  },
  exit: (direction: "left" | "right") => ({
    x: direction === "right" ? -150 : 150,
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: 0.25,
      ease: [0.25, 1, 0.5, 1] as any
    }
  })
};

const pageVariants = {
  initial: (dir: "up" | "down") => ({
    y: dir === "down" ? 120 : -120,
    opacity: 0,
    scale: 0.98
  }),
  animate: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: [0.25, 1, 0.5, 1] as any
    }
  },
  exit: (dir: "up" | "down") => ({
    y: dir === "down" ? -120 : 120,
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: 0.35,
      ease: [0.25, 1, 0.5, 1] as any
    }
  })
};


const SLIDES = [
  "Portada",
  "Introducción",
  "Stack Tecnológico",
  "Costos Ocultos",
  "Comparativo Directo",
  "Calculadora de Ahorro",
  "Rentabilidad",
  "Resumen",
  "Siguientes Pasos",
  "Contacto"
];

/**
 * Presentación Ejecutiva Interactiva para Clientes (Modo Slide Deck).
 * Muestra el diagnóstico financiero de e-commerce en formato de diapositivas interactivas,
 * con calculadora dinámica de ahorro en vivo, gráfico de dona de comisiones, comparativo de planes,
 * proyección de rentabilidad y rastreo analítico en tiempo real.
 */
export default function ReportView({ reportId, onBackToAdmin, isDarkMode, isShared = false }: ReportViewProps) {
  const [report, setReport] = useState<Report | null>(null);
  const [config, setConfig] = useState<any>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(18.50);
  const [metricsUpdateInterval, setMetricsUpdateInterval] = useState<number>(3000);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [slideDirection, setSlideDirection] = useState<"up" | "down">("down");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState<boolean>(false);
  const [isSendEmailModalOpen, setIsSendEmailModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [globalConfig, setGlobalConfig] = useState<any>(null);

  useEffect(() => {
    fetch("/api/config")
      .then(res => res.json())
      .then(data => setGlobalConfig(data))
      .catch(() => {});
  }, []);
  const lastScrollTime = useRef<number>(0);
  const scrollCooldown = 850; // ms
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const slides = SLIDES;

  const handleExportPDF = async () => {
    if (!report) return;
    setIsGeneratingPDF(true);
    try {
      await exportReportToPrintPDF(report);
    } catch (err) {
      console.error("Error al generar PDF:", err);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleExportExcel = async () => {
    if (!report) return;
    setIsGeneratingExcel(true);
    try {
      await exportReportToExcel(report);
    } catch (err) {
      console.error("Error al generar Excel:", err);
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  const handleExportMarkdown = () => {
    if (!report) return;
    exportReportToMarkdown(report);
  };

  // Dynamic tab title: "Reporte de {{marca}} | Tlamatqui"
  useEffect(() => {
    if (report && report.name) {
      document.title = `Reporte de ${report.name} | Tlamatqui`;
    }
  }, [report?.name]);

  const sendInteraction = async (type: string, details?: any) => {
    await sendReportInteraction(reportId, type, details);
  };

  const handleSlideChange = (targetSlide: number | ((prev: number) => number)) => {
    let nextSlide: number;
    if (typeof targetSlide === "function") {
      nextSlide = targetSlide(activeSlide);
    } else {
      nextSlide = targetSlide;
    }
    
    if (nextSlide === activeSlide) return;
    if (nextSlide < 0 || nextSlide >= slides.length) return;
    
    if (nextSlide > activeSlide) {
      setSlideDirection("down");
    } else {
      setSlideDirection("up");
    }
    setActiveSlide(nextSlide);
  };

  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(false);
  const [activeToolIdx, setActiveToolIdx] = useState<number>(0);
  const [toolSlideDirection, setToolSlideDirection] = useState<"left" | "right">("right");
  const [itemsPerPage, setItemsPerPage] = useState<number>(1);
  const [activeCostSlide, setActiveCostSlide] = useState<number>(0);
  const [activeCompareSlide, setActiveCompareSlide] = useState<number>(0);
  const [activeSummaryCard, setActiveSummaryCard] = useState<number>(0);
  const [summaryDirection, setSummaryDirection] = useState<"left" | "right">("right");
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [viewportHeight, setViewportHeight] = useState<number>(typeof window !== "undefined" ? window.innerHeight : 800);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setViewportHeight(window.innerHeight);
      if (window.innerWidth >= 768) {
        setItemsPerPage(2);
      } else {
        setItemsPerPage(1);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const chunkedTools = useMemo(() => {
    const toolsList = report?.tools || [];
    const chunks = [];
    for (let i = 0; i < toolsList.length; i += itemsPerPage) {
      chunks.push(toolsList.slice(i, i + itemsPerPage));
    }
    return chunks;
  }, [report?.tools, itemsPerPage]);

  useEffect(() => {
    if (activeToolIdx >= chunkedTools.length && chunkedTools.length > 0) {
      setActiveToolIdx(chunkedTools.length - 1);
    }
  }, [chunkedTools.length, activeToolIdx]);

  // Calculator custom overrides
  const [calcGmv, setCalcGmv] = useState<number>(450000);
  const [calcVisitas, setCalcVisitas] = useState<number>(20000);
  const [isEditingVisitas, setIsEditingVisitas] = useState<boolean>(false);
  const [tempVisitas, setTempVisitas] = useState<string>("");
  const [isEditingGmv, setIsEditingGmv] = useState<boolean>(false);
  const [tempGmv, setTempGmv] = useState<string>("");

  const handleCommitVisitas = () => {
    let num = parseInt(tempVisitas, 10);
    if (isNaN(num)) {
      setIsEditingVisitas(false);
      return;
    }
    if (num < 1000) {
      num = 1000;
    }
    setCalcVisitas(num);
    setIsEditingVisitas(false);
  };

  const handleCommitGmv = () => {
    let num = parseInt(tempGmv, 10);
    if (isNaN(num)) {
      setIsEditingGmv(false);
      return;
    }
    if (num < 90000) {
      num = 90000;
    }
    setCalcGmv(num);
    setIsEditingGmv(false);
  };

  const [calcAppsCostUSD, setCalcAppsCostUSD] = useState<number>(200);
  const [calcAppsCostMXN, setCalcAppsCostMXN] = useState<number>(0);
  const [calcShopifyPlan, setCalcShopifyPlan] = useState<string>("grow");
  const [isAnnualShopify, setIsAnnualShopify] = useState<boolean>(false);
  const [pagoNubeActive, setPagoNubeActive] = useState<boolean>(true);
  const [calcTab, setCalcTab] = useState<"ganancia" | "calculadora">("ganancia");
  const [showModifyCosts, setShowModifyCosts] = useState<boolean>(false);

  // Custom overrides for plan rates and prices
  const [customShopifyPrice, setCustomShopifyPrice] = useState<number>(52);
  const [customShopifyFee, setCustomShopifyFee] = useState<number>(1.0);
  const [customTiendanubePrice, setCustomTiendanubePrice] = useState<number | null>(null);

  // Inline editing state for individual cost items
  const [isEditingShopifyBase, setIsEditingShopifyBase] = useState<boolean>(false);
  const [tempShopifyBase, setTempShopifyBase] = useState<string>("");

  const [isEditingShopifyFee, setIsEditingShopifyFee] = useState<boolean>(false);
  const [tempShopifyFee, setTempShopifyFee] = useState<string>("");

  const [isEditingAppsCost, setIsEditingAppsCost] = useState<boolean>(false);
  const [tempAppsCost, setTempAppsCost] = useState<string>("");

  const [isEditingTiendanubeBase, setIsEditingTiendanubeBase] = useState<boolean>(false);
  const [tempTiendanubeBase, setTempTiendanubeBase] = useState<string>("");

  const [customTiendanubeAppsMXN, setCustomTiendanubeAppsMXN] = useState<number>(0);
  const [isEditingTiendanubeApps, setIsEditingTiendanubeApps] = useState<boolean>(false);
  const [tempTiendanubeApps, setTempTiendanubeApps] = useState<string>("");

  const handleCommitShopifyBase = () => {
    const num = parseFloat(tempShopifyBase);
    if (!isNaN(num) && num >= 0) {
      setCustomShopifyPrice(num / (exchangeRate || 18.5));
    }
    setIsEditingShopifyBase(false);
  };

  const handleCommitShopifyFee = () => {
    const num = parseFloat(tempShopifyFee);
    if (!isNaN(num) && num >= 0) {
      if (num >= 100) {
        // If user enters amount in MXN (e.g., 6000), calculate equivalent percentage fee from calcGmv
        const calculatedPercent = (num / Math.max(1, calcGmv)) * 100;
        setCustomShopifyFee(Number(calculatedPercent.toFixed(2)));
      } else {
        // Otherwise treat as percentage rate (e.g., 2.0 or 1.5)
        setCustomShopifyFee(num);
      }
    }
    setIsEditingShopifyFee(false);
  };

  const handleCommitAppsCost = () => {
    const num = parseFloat(tempAppsCost);
    if (!isNaN(num) && num >= 0) {
      setCalcAppsCostMXN(num);
      setCalcAppsCostUSD(0);
    }
    setIsEditingAppsCost(false);
  };

  const handleCommitTiendanubeBase = () => {
    const num = parseFloat(tempTiendanubeBase);
    if (!isNaN(num) && num >= 0) {
      setCustomTiendanubePrice(num);
    }
    setIsEditingTiendanubeBase(false);
  };

  const handleCommitTiendanubeApps = () => {
    const num = parseFloat(tempTiendanubeApps);
    if (!isNaN(num) && num >= 0) {
      setCustomTiendanubeAppsMXN(num);
    }
    setIsEditingTiendanubeApps(false);
  };

  const [rentabilidadBase, setRentabilidadBase] = useState<number>(100);
  const [showRentabilidadLegends, setShowRentabilidadLegends] = useState<boolean>(false);
  const [rentabilidadChipMode, setRentabilidadChipMode] = useState<"mes" | "compra" | "anio" | "3anios">("mes");

  // Dynamic comparison rows for Slide 4 (editable)
  const [comparisonRows, setComparisonRows] = useState<ComparisonRow[]>([]);
  const [newRowVar, setNewRowVar] = useState<string>("");
  const [newRowShopify, setNewRowShopify] = useState<string>("");
  const [newRowNube, setNewRowNube] = useState<string>("");
  const [newRowPill, setNewRowPill] = useState<string>("");

  // Slide element references for GSAP
  const slideContainerRef = useRef<HTMLDivElement>(null);

  // Real-time user interaction and unique user tracking
  useEffect(() => {
    if (reportId && activeSlide !== undefined) {
      const slideName = SLIDES[activeSlide] || `Slide ${activeSlide}`;
      sendInteraction("slide_view", { slideName });
    }
  }, [activeSlide, reportId]);

  useEffect(() => {
    if (reportId && activeToolIdx !== undefined && activeToolIdx !== 0) {
      sendInteraction("tool_click", { toolIndex: activeToolIdx });
    }
  }, [activeToolIdx, reportId]);

  useEffect(() => {
    if (!reportId) return;
    const delayDebounceFn = setTimeout(() => {
      if (
        calcGmv !== (report?.gmv || 450000) ||
        calcShopifyPlan !== (report?.shopifyPlan || "grow") ||
        calcAppsCostUSD !== 200 ||
        calcAppsCostMXN !== 0
      ) {
        sendInteraction("calculator_change", {
          gmv: calcGmv,
          shopifyPlan: calcShopifyPlan,
          appsCostUSD: calcAppsCostUSD,
          appsCostMXN: calcAppsCostMXN
        });
      }
    }, 1500);

    return () => clearTimeout(delayDebounceFn);
  }, [calcGmv, calcAppsCostUSD, calcAppsCostMXN, calcShopifyPlan, reportId]);

  useEffect(() => {
    if (!reportId) return;
    const interval = setInterval(() => {
      sendInteraction("heartbeat", { seconds: 10 });
    }, 10000);
    return () => clearInterval(interval);
  }, [reportId]);

  // Auto-save report edits (GMV, visitas, apps, funciones comparativas y planes) to database
  useEffect(() => {
    if (!reportId || !report) return;

    const hasGmvChanged = Number(calcGmv) !== Number(report.gmv);
    const hasVisitasChanged = Number(calcVisitas) !== Number(report.visitasMensuales);
    const hasAppsUSDChanged = Number(calcAppsCostUSD) !== Number((report as any).shopifyAppsCostUSD || 0);
    const hasAppsMXNChanged = Number(calcAppsCostMXN) !== Number((report as any).shopifyAppsCostMXN || 0);
    const hasShopifyFeeChanged = Number(customShopifyFee) !== Number(report.shopifyFee || 0);
    const hasShopifyPriceChanged = Number(customShopifyPrice) !== Number(report.shopifyPlanCustomPrice || 0);
    const hasShopifyPlanChanged = calcShopifyPlan !== report.shopifyPlan;
    const hasComparisonChanged = JSON.stringify(comparisonRows) !== JSON.stringify(report.comparisonRows || []);

    if (
      !hasGmvChanged && 
      !hasVisitasChanged && 
      !hasAppsUSDChanged && 
      !hasAppsMXNChanged && 
      !hasShopifyFeeChanged && 
      !hasShopifyPriceChanged && 
      !hasShopifyPlanChanged && 
      !hasComparisonChanged
    ) return;

    const saveTimeout = setTimeout(async () => {
      try {
        const payload: Record<string, any> = {
          gmv: calcGmv,
          visitasMensuales: calcVisitas,
          shopifyAppsCostUSD: calcAppsCostUSD,
          shopifyAppsCostMXN: calcAppsCostMXN,
          shopifyFee: customShopifyFee,
          shopifyPlanCustomPrice: customShopifyPrice,
          shopifyPlan: calcShopifyPlan,
          comparisonRows: comparisonRows,
          tools: report.tools || []
        };

        const res = await fetch(`/api/reports/${reportId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const updatedReport = await res.json();
          setReport(prev => prev ? { 
            ...prev, 
            ...payload
          } : null);
        }
      } catch (err) {
        console.error("Error auto-saving report data to database", err);
      }
    }, 1200);

    return () => clearTimeout(saveTimeout);
  }, [
    calcGmv, 
    calcVisitas, 
    calcAppsCostUSD, 
    calcAppsCostMXN, 
    customShopifyFee, 
    customShopifyPrice, 
    calcShopifyPlan, 
    comparisonRows, 
    reportId, 
    report
  ]);

  // Keyboard, wheel, and touch event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in form inputs
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "SELECT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (activeSlide > 0) {
          handleSlideChange(activeSlide - 1);
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (activeSlide < slides.length - 1) {
          handleSlideChange(activeSlide + 1);
        }
      } else if (e.key === "ArrowLeft") {
        // Left slider
        if (activeSlide === 2) {
          if (activeToolIdx > 0) {
            e.preventDefault();
            setActiveToolIdx(prev => prev - 1);
          }
        } else if (activeSlide === 4 && isMobile) {
          if (activeCompareSlide > 0) {
            e.preventDefault();
            setActiveCompareSlide(prev => prev - 1);
          }
        }
      } else if (e.key === "ArrowRight") {
        // Right slider
        if (activeSlide === 2) {
          if (activeToolIdx < chunkedTools.length - 1) {
            e.preventDefault();
            setActiveToolIdx(prev => prev + 1);
          }
        } else if (activeSlide === 4 && isMobile) {
          if (activeCompareSlide < comparisonRows.length - 1) {
            e.preventDefault();
            setActiveCompareSlide(prev => prev + 1);
          }
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now - lastScrollTime.current < scrollCooldown) {
        e.preventDefault();
        return;
      }

      const deltaX = e.deltaX;
      const deltaY = e.deltaY;

      // Decide if vertical or horizontal scroll is dominant
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        // Vertical scroll -> move slides
        if (Math.abs(deltaY) > 35) { // threshold
          e.preventDefault();
          if (deltaY > 0) {
            // scroll down -> next slide
            if (activeSlide < slides.length - 1) {
              handleSlideChange(activeSlide + 1);
              lastScrollTime.current = now;
            }
          } else {
            // scroll up -> prev slide
            if (activeSlide > 0) {
              handleSlideChange(activeSlide - 1);
              lastScrollTime.current = now;
            }
          }
        }
      } else {
        // Horizontal scroll -> move horizontal slider (where exists)
        if (Math.abs(deltaX) > 35) { // threshold
          if (activeSlide === 2) {
            e.preventDefault();
            if (deltaX > 0) {
              if (activeToolIdx < chunkedTools.length - 1) {
                setActiveToolIdx(prev => prev + 1);
                lastScrollTime.current = now;
              }
            } else {
              if (activeToolIdx > 0) {
                setActiveToolIdx(prev => prev - 1);
                lastScrollTime.current = now;
              }
            }
          } else if (activeSlide === 4 && isMobile) {
            e.preventDefault();
            if (deltaX > 0) {
              if (activeCompareSlide < comparisonRows.length - 1) {
                setActiveCompareSlide(prev => prev + 1);
                lastScrollTime.current = now;
              }
            } else {
              if (activeCompareSlide > 0) {
                setActiveCompareSlide(prev => prev - 1);
                lastScrollTime.current = now;
              }
            }
          }
        }
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;

      const diffX = touchStartRef.current.x - endX;
      const diffY = touchStartRef.current.y - endY;

      const threshold = 45; // min swipe distance in px

      if (Math.abs(diffY) > Math.abs(diffX)) {
        // Vertical swipe
        if (Math.abs(diffY) > threshold) {
          if (diffY > 0) {
            // Swiped up -> next slide
            if (activeSlide < slides.length - 1) {
              handleSlideChange(activeSlide + 1);
            }
          } else {
            // Swiped down -> prev slide
            if (activeSlide > 0) {
              handleSlideChange(activeSlide - 1);
            }
          }
        }
      } else {
        // Horizontal swipe
        if (Math.abs(diffX) > threshold) {
          if (diffX > 0) {
            // Swiped left -> next horizontal slide
            if (activeSlide === 2) {
              if (activeToolIdx < chunkedTools.length - 1) {
                setActiveToolIdx(prev => prev + 1);
              }
            } else if (activeSlide === 4 && isMobile) {
              if (activeCompareSlide < comparisonRows.length - 1) {
                setActiveCompareSlide(prev => prev + 1);
              }
            }
          } else {
            // Swiped right -> prev horizontal slide
            if (activeSlide === 2) {
              if (activeToolIdx > 0) {
                setActiveToolIdx(prev => prev - 1);
              }
            } else if (activeSlide === 4 && isMobile) {
              if (activeCompareSlide > 0) {
                setActiveCompareSlide(prev => prev - 1);
              }
            }
          }
        }
      }

      touchStartRef.current = null;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [activeSlide, activeToolIdx, activeCompareSlide, chunkedTools.length, comparisonRows.length, isMobile]);

  // Fetch Report Data and Exchange Rate
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load report
        const resReport = await fetch(`/api/reports/${reportId}`);
        if (!resReport.ok) throw new Error("Reporte no encontrado");
        const reportData: Report = await resReport.json();
        setReport(reportData);
        if (reportData.name) {
          document.title = `Reporte de ${reportData.name} | Tlamatqui`;
        }
        setComparisonRows(reportData.comparisonRows || []);
        
        // Seed calculator with report values
        setCalcGmv(reportData.gmv || 450000);
        setCalcVisitas(reportData.visitasMensuales || 20000);
        setCalcShopifyPlan(reportData.shopifyPlan || "grow");

        // Sum up existing app costs for calculator defaults
        let sumUSD = 0;
        let sumMXN = 0;
        reportData.tools?.forEach(t => {
          const cost = t.costType === "exact" ? t.costExact : t.costMax; // Take the conservative max
          if (t.currency === "USD") sumUSD += cost;
          else sumMXN += cost;
        });
        setCalcAppsCostUSD(Number(sumUSD.toFixed(2)));
        setCalcAppsCostMXN(Number(sumMXN.toFixed(2)));

        // Configure plan default values
        configurePlanDefaults(reportData.shopifyPlan, reportData);

        // Fetch currency conversion rate
        const resRate = await fetch("/api/exchange-rate");
        const rateData = await resRate.json();
        setExchangeRate(rateData.rate || 18.50);

        // Fetch config for metricsUpdateInterval
        try {
          const resConfig = await fetch("/api/config");
          if (resConfig.ok) {
            const configData = await resConfig.json();
            setConfig(configData);
            if (configData && typeof configData.metricsUpdateInterval === "number") {
              setMetricsUpdateInterval(configData.metricsUpdateInterval);
            }
          }
        } catch (err) {
          console.error("Error fetching config in ReportView", err);
        }

        // Track view/open event
        try {
          const trackType = isShared ? "view" : "open";
          await fetch(`/api/reports/${reportId}/${trackType}`, { method: "POST" });
        } catch (err) {
          console.warn("Error tracking report event", err);
        }
      } catch (e) {
        console.error("Error loading report", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [reportId, isShared]);

  // Handle Plan default settings helper
  const configurePlanDefaults = (plan: string, r: Report) => {
    if (plan === "custom") {
      setCustomShopifyPrice(r.shopifyPlanCustomPrice || 52);
      setCustomShopifyFee(r.shopifyPlanCustomFee || 1.0);
    } else if (plan === "basic") {
      setCustomShopifyPrice(19);
      setCustomShopifyFee(2.0);
    } else if (plan === "grow") {
      setCustomShopifyPrice(52);
      setCustomShopifyFee(1.0);
    } else if (plan === "advanced") {
      setCustomShopifyPrice(399);
      setCustomShopifyFee(0.6);
    } else if (plan === "plus") {
      setCustomShopifyPrice(2300);
      setCustomShopifyFee(0.2);
    }
  };

  // Adjust custom prices when user changes Shopify Plan in Calculator
  useEffect(() => {
    if (!report) return;
    if (calcShopifyPlan !== "custom") {
      configurePlanDefaults(calcShopifyPlan, report);
    }
  }, [calcShopifyPlan, report]);

  // Declarative slide transition handler managed via Motion (Framer Motion v12)

  if (loading) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-bg-theme text-slate-100 flex flex-col md:flex-row select-none">
        {/* MOBILE HEADER (Always visible on mobile, hidden on desktop) */}
        {!isShared && (
          <header className="md:hidden flex items-center justify-between p-4 bg-surface-theme/90 backdrop-blur-md border-b border-border-theme/40 sticky top-0 z-40 w-full shrink-0 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-border-theme/40 rounded" />
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-border-theme/50" />
                <div className="h-3 bg-border-theme/40 rounded w-16" />
              </div>
            </div>
            <div className="w-10 h-5 bg-border-theme/40 rounded" />
          </header>
        )}

        {/* 1. SIDEBAR NAVIGATION SKELETON */}
        <aside className="hidden" />

        {/* 2. MAIN SLIDE CONTENT AREA SKELETON */}
        <main className="flex-1 h-full overflow-y-auto px-4 py-6 md:p-12 flex flex-col justify-center min-h-0 relative">
          <div className="w-full max-w-3xl mx-auto text-center space-y-6 md:space-y-8 py-4 flex flex-col justify-center items-center animate-pulse">
            {/* Logo placeholder */}
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-border-theme/40" />

            {/* Title / Tagline block */}
            <div className="space-y-3.5 w-full max-w-xl mx-auto flex flex-col items-center">
              <div className="h-3 bg-border-theme/35 rounded w-1/4" />
              <div className="h-8 md:h-12 bg-border-theme/50 rounded w-4/5" />
              <div className="h-8 md:h-12 bg-border-theme/50 rounded w-2/3" />
            </div>

            {/* Description lines (No more than 3 lines) */}
            <div className="space-y-2 w-full max-w-lg mx-auto flex flex-col items-center pt-2">
              <div className="h-3 bg-border-theme/30 rounded w-full" />
              <div className="h-3 bg-border-theme/30 rounded w-5/6" />
              <div className="h-3 bg-border-theme/30 rounded w-2/3" />
            </div>

            {/* Interactive Badge / Button */}
            <div className="h-5 bg-border-theme/35 rounded-full w-48 mt-4" />
            <div className="h-10 bg-border-theme/50 rounded-xl w-36 mt-2" />
          </div>

          {/* Slide Progress Indicators */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5 px-4 animate-pulse">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={`h-1 bg-border-theme/35 rounded-full ${i === 0 ? "w-6 bg-accent-theme/60" : "w-1.5"}`} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-bg-theme text-white flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-red-theme" />
        <p className="text-sm font-semibold text-text-dim-theme">Reporte de diagnóstico no encontrado o ID inválido.</p>
        <button onClick={onBackToAdmin} className="bg-accent-theme hover:bg-accent-theme/90 px-4 py-2 rounded-lg text-xs font-semibold text-white">Regresar al Administrador</button>
      </div>
    );
  }

  // MATHEMATICAL CALCULATIONS (Slide 3 & 5)
  // Apps Costs
  const totalAppsCostUSD = calcAppsCostUSD;
  const totalAppsCostMXN = calcAppsCostMXN;
  const convertedAppsCostMXN = totalAppsCostUSD * exchangeRate + totalAppsCostMXN;

  // Shopify Costs
  // Base Price
  let baseShopifyUSD = customShopifyPrice;
  if (isAnnualShopify && calcShopifyPlan !== "plus") {
    if (calcShopifyPlan === "basic") baseShopifyUSD = 14;
    else if (calcShopifyPlan === "grow") baseShopifyUSD = 39;
    else if (calcShopifyPlan === "advanced") baseShopifyUSD = 299;
  }
  const monthlyShopifyBaseMXN = baseShopifyUSD * exchangeRate;
  const yearlyShopifyBaseMXN = monthlyShopifyBaseMXN * 12;

  // Transaction fee
  const shopifyTransactionRate = customShopifyFee / 100;
  const shopifyTransactionFeeMXN = calcGmv * shopifyTransactionRate;

  // Gateway fee (Ignored as requested, set to 0. Only transaction commission is preserved)
  const shopifyGatewayRate = 0;
  const shopifyGatewayFeeMXN = 0;

  // Sum Shopify
  const totalShopifyMonthlyCostMXN = monthlyShopifyBaseMXN + shopifyTransactionFeeMXN + convertedAppsCostMXN;

  // Tiendanube Costs
  // Plan prices
  const planPrices: Record<string, number> = {
    basic: 149,
    tiendanube: 349,
    advanced: 999,
    evolution: 3999
  };
  const tiendanubeBaseMXN = planPrices[report.tiendanubePlan] || 349;
  
  // Transaction commission (Tiendanube is always 0%)
  const tiendanubeTransactionFeeMXN = 0;

  // Gateway fee is 0% as requested by the user
  const tiendanubeGatewayRate = 0;
  const tiendanubeGatewayFeeMXN = 0;

  const tiendanubeActiveAppsCostMXN = customTiendanubeAppsMXN;

  const totalTiendanubeMonthlyCostMXN = tiendanubeBaseMXN + tiendanubeGatewayFeeMXN + tiendanubeActiveAppsCostMXN;

  // Savings
  const monthlySavingsMXN = (totalShopifyMonthlyCostMXN + shopifyGatewayFeeMXN) - totalTiendanubeMonthlyCostMXN;
  const yearlySavingsMXN = monthlySavingsMXN * 12;

  // Dynamic metrics based on current adjusted calculator inputs
  const dynamicFugasMonto = Math.max(0, totalShopifyMonthlyCostMXN - totalTiendanubeMonthlyCostMXN);
  const dynamicFugasRangoMin = Math.round(dynamicFugasMonto * 0.9);
  const dynamicFugasRangoMax = Math.round(dynamicFugasMonto * 1.15);

  let activeLeaksCount = 0;
  if (calcAppsCostUSD > 0 || calcAppsCostMXN > 0) {
    const semTools = report?.tools?.filter(t => t.semaphore === "red" || t.semaphore === "yellow") || [];
    activeLeaksCount += semTools.length || 1;
  }
  if (customShopifyFee > 0) {
    activeLeaksCount += 1;
  }
  const dynamicFugasCantidad = Math.max(1, activeLeaksCount);

  // Profit per $100
  // Shopify: remaining from 100 after Shopify monthly costs ratio
  const shopifyRatio = (totalShopifyMonthlyCostMXN / calcGmv) * 100;
  const shopifyProfitPer100 = Math.max(0, 100 - shopifyRatio);

  // Tiendanube: remaining after Tiendanube costs ratio (Gateway fee is 0%)
  const nubeRatio = (totalTiendanubeMonthlyCostMXN / calcGmv) * 100;
  const tiendanubeProfitPer100 = Math.max(0, 100 - nubeRatio);

  // Shared Rentabilidad/Rendimiento Calculations
  const shopifyPlanPerAmount = (monthlyShopifyBaseMXN / calcGmv) * rentabilidadBase;
  const shopifyAppsPerAmount = (convertedAppsCostMXN / calcGmv) * rentabilidadBase;
  const shopifyGatewayPerAmount = (0.036 * rentabilidadBase) + 3;
  const shopifyCommissionPerAmount = (customShopifyFee / 100) * rentabilidadBase;
  const shopifyNetPerAmount = Math.max(0, rentabilidadBase - (shopifyPlanPerAmount + shopifyAppsPerAmount + shopifyGatewayPerAmount + shopifyCommissionPerAmount));

  const nubePlanPerAmount = (tiendanubeBaseMXN / calcGmv) * rentabilidadBase;
  const nubeGatewayPerAmount = (0.0329 * rentabilidadBase) + 3;
  const nubeNetPerAmount = Math.max(0, rentabilidadBase - (nubePlanPerAmount + nubeGatewayPerAmount));

  // Slide 3: Overhead analysis of range tools
  const toolsWithRange = report.tools?.filter(t => t.costType === "range") || [];
  const minRangeOverheadUSD = toolsWithRange.reduce((acc, t) => acc + t.costMin, 0);
  const maxRangeOverheadUSD = toolsWithRange.reduce((acc, t) => acc + t.costMax, 0);

  // Total spend on tools for Shopify (using standard exact + max of range for conservative overhead)
  const totalSpendToolsUSD = report.tools?.reduce((acc, t) => {
    const cost = t.costType === "exact" ? t.costExact : t.costMax;
    return acc + (t.currency === "USD" ? cost : cost / exchangeRate);
  }, 0) || 0;

  // Comparison row actions
  const handleAddCustomRow = () => {
    if (!newRowVar.trim()) return;
    const newRow: ComparisonRow = {
      id: `custom-row-${Date.now()}`,
      variable: newRowVar,
      shopify: newRowShopify || "N/A",
      tiendanube: newRowNube || "N/A",
      pillText: newRowPill || "Beneficio"
    };
    setComparisonRows([...comparisonRows, newRow]);
    setNewRowVar("");
    setNewRowShopify("");
    setNewRowNube("");
    setNewRowPill("");
  };

  const handleRemoveCustomRow = (id: string) => {
    setComparisonRows(comparisonRows.filter(r => r.id !== id));
  };

  return (
    <>
      <div className="w-screen h-screen overflow-hidden bg-bg-theme text-slate-100 flex flex-col md:flex-row selection:bg-accent-theme selection:text-white no-print">
      
      {/* FLOATING HAMBURGER BUTTON (Mobile only) */}
      {!isSidebarExpanded && (
        <button
          onClick={() => setIsSidebarExpanded(true)}
          className="md:hidden fixed top-4 left-4 z-40 flex items-center justify-center p-3 rounded-full bg-surface-theme/80 backdrop-blur-md border border-border-theme/60 shadow-lg text-accent-theme hover:text-white hover:bg-accent-theme hover:border-accent-theme transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          aria-label="Abrir barra lateral"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* MOBILE HEADER (Always visible on mobile, hidden on desktop) */}
      {!isShared && (
        <header className="md:hidden flex items-center justify-between p-4 bg-surface-theme/90 backdrop-blur-md border-b border-border-theme/40 sticky top-0 z-40 w-full shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-1 shrink-0" /> {/* Spacer to avoid overlap with floating button */}
            <div className="flex items-center gap-2">
              {report.logo && (
                <img 
                  src={report.logo} 
                  alt={report.name} 
                  className="w-6 h-6 rounded-md object-cover border border-border-theme bg-bg-theme" 
                  onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                />
              )}
              <span className="text-xs font-bold tracking-tight text-white uppercase truncate max-w-[120px]">{report.name}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="bg-accent-theme/15 text-accent-theme font-bold px-2 py-0.5 rounded text-[10px] tracking-wider border border-accent-theme/20 uppercase">
              {activeSlide + 1} / {slides.length}
            </span>
            
            {isShared && (
              <a
                href={`https://wa.me/52${report.contactWhatsapp}?text=Hola,%20vi%20el%20reporte%20de%20diagnóstico%20de%20fugas%20de%20${encodeURIComponent(report.name)}%20y%20me%20gustaría%20agendar%20una%20reunión%20para%20hablar%20sobre%20Evolución%20Tiendanube.`}
                target="_blank" 
                rel="noreferrer"
                onClick={() => sendInteraction("whatsapp_click")}
                className="flex items-center justify-center bg-[#25D366] hover:bg-[#1ebd50] text-white font-bold p-1.5 rounded-lg text-xs transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </header>
      )}

      {/* SIDEBAR BACKDROP OVERLAY */}
      <AnimatePresence>
        {isSidebarExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarExpanded(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-45"
          />
        )}
      </AnimatePresence>

      {/* 1. SIDEBAR NAVIGATION */}
      <aside className={`
        fixed inset-y-0 left-0 h-screen bg-surface-theme/98 border-r border-border-theme p-6 z-50 shrink-0
        transition-all duration-300 ease-in-out backdrop-blur-md flex flex-col justify-between shadow-2xl
        ${isSidebarExpanded 
          ? "translate-x-0 w-full sm:w-80" 
          : "-translate-x-full w-full sm:w-80 pointer-events-none"
        }
      `}>
        {/* Toggle Button for Desktop/Tablet (attached to the sidebar edge) */}
        <button
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          className="hidden md:flex absolute top-4 left-full ml-4 z-50 items-center justify-center p-3 rounded-full bg-surface-theme/80 backdrop-blur-md border border-border-theme/60 shadow-lg text-accent-theme hover:text-white hover:bg-accent-theme hover:border-accent-theme transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer pointer-events-auto"
          aria-label={isSidebarExpanded ? "Cerrar barra lateral" : "Abrir barra lateral"}
        >
          {isSidebarExpanded ? (
            <ChevronLeft className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5 animate-pulse" />
          )}
        </button>

        <div className="flex flex-col h-full justify-between w-full">
          <div>
            {/* Sidebar Title / Logo */}
            <div className="flex items-center justify-between border-b border-border-theme pb-4">
              <div className="flex items-center gap-3">
                {report.logo ? (
                  <img 
                    src={report.logo} 
                    alt={report.name} 
                    className="w-8 h-8 rounded-lg object-cover border border-border-theme bg-bg-theme" 
                    onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-accent-theme/10 border border-accent-theme/20 flex items-center justify-center font-bold text-xs text-accent-theme">
                    {report.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="truncate">
                  <span className="text-[10px] text-text-dim-theme block font-semibold uppercase tracking-wider">Reporte</span>
                  <h1 className="text-sm font-black tracking-tight text-white truncate max-w-[140px]">{report.name}</h1>
                </div>
              </div>

              {/* Close Button on Mobile Overlay */}
              {isSidebarExpanded && (
                <button 
                  onClick={() => setIsSidebarExpanded(false)}
                  className="p-2 rounded-lg hover:bg-surface-hover-theme transition-all border border-border-theme/60"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              )}
            </div>

            {/* Back to Admin Action for Inside App */}
            {!isShared && (
              <div className="py-3 border-b border-border-theme/40">
                <button 
                  onClick={onBackToAdmin}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs text-text-dim-theme hover:text-white hover:bg-surface-hover-theme border border-border-theme/40 transition-all text-left cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-accent-theme" />
                  <span>Volver a Tlachiālōyan</span>
                </button>
              </div>
            )}

            {/* Slide Navigation List */}
            <div className="flex flex-col gap-1 py-4 overflow-y-auto max-h-[60vh]">
              {slides.map((slide, index) => {
                const isActive = activeSlide === index;
                return (
                  <button
                    key={slide}
                    onClick={() => {
                      handleSlideChange(index);
                      setIsSidebarExpanded(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all text-left cursor-pointer ${
                      isActive 
                        ? "bg-accent-theme text-white shadow-md shadow-accent-theme/20" 
                        : "text-text-dim-theme hover:text-white hover:bg-surface-hover-theme"
                    }`}
                  >
                    <span>{slide}</span>
                    <ChevronRight className={`w-3.5 h-3.5 opacity-60 transition-transform ${isActive ? "translate-x-0.5" : ""}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sidebar Footer with Progress & CTA */}
          <div className="border-t border-border-theme/40 pt-4 mt-auto flex flex-col gap-3">
            {report && (
              <div className="flex flex-col gap-1.5 pb-1">
                <span className="text-[10px] text-text-dim-theme font-bold uppercase tracking-wider">Exportar Diagnóstico</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleExportExcel}
                    disabled={isGeneratingExcel}
                    className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-bg-theme hover:bg-surface-hover-theme border border-border-theme text-text-dim-theme hover:text-white font-bold text-xs transition-all cursor-pointer group shadow-sm disabled:opacity-50"
                    title="Exportar Hoja de Cálculo Excel (.xlsx) con estilos"
                  >
                    {isGeneratingExcel ? (
                      <span className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                    )}
                    <span>Excel</span>
                  </button>

                  <button
                    onClick={() => exportReportToCSV(report)}
                    className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-bg-theme hover:bg-surface-hover-theme border border-border-theme text-text-dim-theme hover:text-white font-bold text-xs transition-all cursor-pointer group shadow-sm"
                    title="Exportar datos a CSV estilizado (.csv)"
                  >
                    <Download className="w-3.5 h-3.5 text-green-theme group-hover:scale-110 transition-transform" />
                    <span>CSV</span>
                  </button>

                  <button
                    onClick={handleExportMarkdown}
                    className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-bg-theme hover:bg-surface-hover-theme border border-border-theme text-text-dim-theme hover:text-white font-bold text-xs transition-all cursor-pointer group shadow-sm"
                    title="Exportar documento en formato Markdown (.md)"
                  >
                    <FileText className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
                    <span>Markdown</span>
                  </button>

                  <button
                    onClick={handleExportPDF}
                    disabled={isGeneratingPDF}
                    className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-bg-theme hover:bg-surface-hover-theme border border-border-theme text-text-dim-theme hover:text-white font-bold text-xs transition-all cursor-pointer group shadow-sm disabled:opacity-50"
                    title="Generar y Descargar Presentación PDF Horizontal"
                  >
                    {isGeneratingPDF ? (
                      <span className="w-3.5 h-3.5 border-2 border-accent-theme border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Printer className="w-3.5 h-3.5 text-accent-theme group-hover:scale-110 transition-transform" />
                    )}
                    <span>{isGeneratingPDF ? "..." : "PDF"}</span>
                  </button>

                  <button
                    onClick={() => setIsSendEmailModalOpen(true)}
                    className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-bg-theme hover:bg-surface-hover-theme border border-border-theme text-text-dim-theme hover:text-white font-bold text-xs transition-all cursor-pointer group shadow-sm"
                    title="Enviar Reporte por Correo Electrónico (SMTP)"
                  >
                    <Mail className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
                    <span>Correo</span>
                  </button>

                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-bg-theme hover:bg-surface-hover-theme border border-border-theme text-text-dim-theme hover:text-white font-bold text-xs transition-all cursor-pointer group shadow-sm"
                    title="Compartir en Dominio Personalizado"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span>Compartir</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-text-dim-theme font-semibold">
              <span>Progreso</span>
              <span>{activeSlide + 1} de {slides.length}</span>
            </div>
            <div className="w-full bg-border-theme/40 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-accent-theme h-full transition-all duration-300"
                style={{ width: `${((activeSlide + 1) / slides.length) * 100}%` }}
              />
            </div>
            {isShared && report && (
              <a
                href={`https://wa.me/52${report.contactWhatsapp}?text=Hola,%20vi%20el%20reporte%20de%20diagnóstico%20de%20fugas%20de%20${encodeURIComponent(report.name)}%20y%20me%20gustaría%20agendar%20una%20reunión%20para%20hablar%20sobre%20Evolución%20Tiendanube.`}
                target="_blank" 
                rel="noreferrer"
                onClick={() => sendInteraction("whatsapp_click")}
                className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebd50] text-white font-extrabold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Phone className="w-4 h-4" /> Agendar WhatsApp
              </a>
            )}
          </div>
        </div>
      </aside>

      {/* RIGHT SIDE MAIN PANEL */}
      <div className={`flex-1 min-w-0 flex flex-col relative overflow-hidden ${isShared ? "h-screen" : "h-[calc(100vh-57px)] md:h-screen"}`}>


      {/* 2. MAIN SLIDE CARDS */}
      <div 
        ref={slideContainerRef} 
        className="flex-1 min-h-0 w-full mx-auto p-4 md:p-6 flex items-start md:items-center justify-center overflow-hidden max-w-7xl py-4 md:py-6"
      >
        <AnimatePresence mode="wait" custom={slideDirection}>
          <motion.div
            key={activeSlide}
            custom={slideDirection}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full h-full overflow-y-auto flex items-start justify-center py-2 px-1"
          >
            {/* SLIDE 0: PORTADA (COVER) */}
            {activeSlide === 0 && (
              <div data-slide-index="0" className="w-full max-w-5xl mx-auto text-center space-y-4 md:space-y-6 py-4 flex flex-col justify-center items-center my-auto">
            {/* Merchant Logo Center */}
            <div className="flex justify-center">
              {report.logo ? (
                <div className="relative group">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-accent-theme to-indigo-500 opacity-30 blur group-hover:opacity-40 transition-all"></div>
                  <img 
                    src={report.logo} 
                    alt={report.name} 
                    className="relative w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-2 border-border-theme shadow-xl bg-surface-theme" 
                    onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                  />
                </div>
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-accent-theme/10 to-indigo-500/10 border border-accent-theme/20 flex items-center justify-center font-bold text-4xl md:text-5xl text-accent-theme shadow-lg">
                  {report.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Header Block */}
            <div className="space-y-3 max-w-3xl mx-auto">
              <span className="text-accent-theme text-xs md:text-sm font-black uppercase tracking-widest block animate-pulse">
                "Tu tienda crece, ¿y tú?"
              </span>

              <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                Diagnóstico de{" "}
                {report.team?.teamBrandWebsite || report.businessUrl ? (
                  <a
                    href={report.team?.teamBrandWebsite || report.businessUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline cursor-pointer text-transparent bg-clip-text bg-gradient-to-r from-accent-theme to-indigo-400"
                  >
                    {report.team?.teamBrandName || report.name}
                  </a>
                ) : (
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-theme to-indigo-400">
                    {report.team?.teamBrandName || report.name}
                  </span>
                )}
              </h1>

              <p className="text-text-dim-theme text-xs md:text-sm leading-relaxed max-w-2xl mx-auto line-clamp-3">
                Análisis estratégico de la eficiencia de tu pasarela de pagos, comisiones transaccionales y costos fijos de aplicaciones en tu tienda en línea.
              </p>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] md:text-xs font-semibold bg-surface-theme/80 border border-border-theme text-text-dim-theme shadow-sm">
              <Clock className="w-3.5 h-3.5 text-accent-theme" />
              <span>Fecha del reporte: {formatReportDate(report.createdAt)}</span>
            </span>

            {(report.team?.teamBrandLogo || report.team?.image) && (
              <div className="pt-2 flex items-center justify-center gap-2 text-xs text-text-dim-theme">
                <img
                  src={report.team?.teamBrandLogo || report.team?.image}
                  alt={report.team?.name || "Logo Equipo"}
                  className="h-8 w-auto object-contain rounded bg-white/5 p-1 border border-border-theme"
                />
              </div>
            )}

            <div className="pt-2">
              <button 
                onClick={() => handleSlideChange(1)}
                className="inline-flex items-center gap-2 bg-accent-theme hover:bg-accent-theme/90 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition-all text-xs md:text-sm group cursor-pointer"
              >
                Descubrir Ahora<ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* SLIDE 1: INTRODUCCIÓN */}
        {activeSlide === 1 && (
          <div data-slide-index="1" className="w-full max-w-5xl mx-auto text-center space-y-3 md:space-y-4 py-2 my-auto">
            {/* Merchant Logo */}
            <div className="flex justify-center mb-1">
              {report.logo ? (
                <div className="relative group">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-accent-theme to-indigo-500 opacity-25 blur group-hover:opacity-45 transition-all duration-300"></div>
                  <img 
                    src={report.logo} 
                    alt={report.name} 
                    className="relative w-12 h-12 md:w-16 md:h-16 rounded-full object-cover border border-border-theme shadow-md bg-surface-theme" 
                  />
                </div>
              ) : (
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-accent-theme/10 to-indigo-500/10 border border-accent-theme/20 flex items-center justify-center font-bold text-xl md:text-2xl text-accent-theme shadow-md">
                  {report.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="space-y-1.5 md:space-y-2.5 max-w-3xl mx-auto">
              <span className="text-red-theme text-[10px] md:text-xs font-black uppercase tracking-widest block animate-pulse">
                Fugas de Margen Operativo Detectadas
              </span>
              <h2 className="text-xl md:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
                Introducción al <span className="text-red-theme">Diagnóstico Financiero</span>
              </h2>
              <p className="text-text-dim-theme text-xs md:text-sm leading-relaxed max-w-2xl mx-auto line-clamp-3">
                Hemos detectado <strong className="text-red-theme font-semibold">{dynamicFugasCantidad} fugas mayores</strong> de capital con un impacto de <strong className="text-red-theme font-semibold">${dynamicFugasRangoMin.toLocaleString()} a ${dynamicFugasRangoMax.toLocaleString()} MXN</strong> mensuales en comisiones de Shopify y aplicaciones extras.
              </p>
            </div>

            {/* Portada Metrics Cards with enhanced colors and hover state */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2 md:pt-4 max-w-5xl mx-auto">
              {/* Card 1: Visitas Mensuales (Editable) */}
              <div 
                className="card-theme !p-3 md:!p-4 text-left border border-border-theme/60 bg-surface-theme/90 hover:scale-[1.03] transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg hover:border-cyan-500/40 hover:bg-cyan-950/10 hover:shadow-cyan-500/5 group"
                onClick={() => {
                  if (!isEditingVisitas) {
                    setTempVisitas(String(calcVisitas));
                    setIsEditingVisitas(true);
                  }
                }}
              >
                <span className="stat-label-theme block mb-0.5 md:mb-1 text-[9px] md:text-[10px] font-semibold tracking-wider uppercase text-text-dim-theme flex justify-between items-center">
                  <span>Visitas Mensuales</span>
                  <span className="text-[9px] text-cyan-400/80 font-normal group-hover:inline hidden">✎ Editar</span>
                </span>
                
                {isEditingVisitas ? (
                  <div className="mt-1" onClick={e => e.stopPropagation()}>
                    <input 
                      type="number" 
                      value={tempVisitas}
                      onChange={e => setTempVisitas(e.target.value)}
                      onBlur={handleCommitVisitas}
                      onKeyDown={e => {
                        if (e.key === "Enter") handleCommitVisitas();
                        if (e.key === "Escape") setIsEditingVisitas(false);
                      }}
                      autoFocus
                      min={1000}
                      className="bg-bg-theme text-white border border-cyan-500/50 rounded px-2 py-1 text-xs font-mono w-full focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                    <span className="text-[8px] text-cyan-400/80 block mt-0.5">Mínimo: 1,000 visitas</span>
                  </div>
                ) : (
                  <span className="stat-value-theme block font-black text-sm md:text-base transition-colors text-cyan-400">
                    <Tooltip content="Clic para editar el tráfico de visitas totales mensuales. Mínimo 1,000 visitas.">
                      {calcVisitas.toLocaleString()}
                    </Tooltip>
                  </span>
                )}
                
                <span className="text-[9px] md:text-[10px] text-text-dim-theme mt-1 block leading-tight">Tráfico Orgánico / Pago</span>
              </div>

              {/* Card 2: GMV Estimado (Editable) */}
              <div 
                className="card-theme !p-3 md:!p-4 text-left border border-border-theme/60 bg-surface-theme/90 hover:scale-[1.03] transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg hover:border-emerald-500/40 hover:bg-emerald-950/10 hover:shadow-emerald-500/5 group"
                onClick={() => {
                  if (!isEditingGmv) {
                    setTempGmv(String(calcGmv));
                    setIsEditingGmv(true);
                  }
                }}
              >
                <span className="stat-label-theme block mb-0.5 md:mb-1 text-[9px] md:text-[10px] font-semibold tracking-wider uppercase text-text-dim-theme flex justify-between items-center">
                  <span>GMV Estimado</span>
                  <span className="text-[9px] text-emerald-400/80 font-normal group-hover:inline hidden">✎ Editar</span>
                </span>
                
                {isEditingGmv ? (
                  <div className="mt-1" onClick={e => e.stopPropagation()}>
                    <input 
                      type="number" 
                      value={tempGmv}
                      onChange={e => setTempGmv(e.target.value)}
                      onBlur={handleCommitGmv}
                      onKeyDown={e => {
                        if (e.key === "Enter") handleCommitGmv();
                        if (e.key === "Escape") setIsEditingGmv(false);
                      }}
                      autoFocus
                      min={90000}
                      className="bg-bg-theme text-white border border-emerald-500/50 rounded px-2 py-1 text-xs font-mono w-full focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <span className="text-[8px] text-emerald-400/80 block mt-0.5">Mínimo: $90,000 MXN</span>
                  </div>
                ) : (
                  <span className="stat-value-theme block font-black text-sm md:text-base transition-colors text-emerald-400">
                    <Tooltip content="Clic para editar el volumen de venta mensual. Mínimo $90,000 MXN.">
                      ${calcGmv.toLocaleString()} MXN
                    </Tooltip>
                  </span>
                )}
                
                <span className="text-[9px] md:text-[10px] text-text-dim-theme mt-1 block leading-tight">Volumen de venta mensual</span>
              </div>

              {/* Card 3: Fee Shopify Estimado (Static) */}
              <div 
                className="card-theme !p-3 md:!p-4 text-left border border-border-theme/60 bg-surface-theme/90 hover:scale-[1.03] transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg hover:border-amber-500/40 hover:bg-amber-950/10 hover:shadow-amber-500/5"
              >
                <span className="stat-label-theme block mb-0.5 md:mb-1 text-[9px] md:text-[10px] font-semibold tracking-wider uppercase text-text-dim-theme">Fee Shopify Estimado</span>
                <span className="stat-value-theme block font-black text-sm md:text-base transition-colors text-amber-400">
                  <Tooltip content="Costo total que pagas actualmente en Shopify considerando tu plan mensual base más las comisiones por cada transacción realizada.">
                    ${Math.round(totalShopifyMonthlyCostMXN).toLocaleString()} MXN
                  </Tooltip>
                </span>
                <span className="text-[9px] md:text-[10px] text-text-dim-theme mt-1 block leading-tight">Suscripción + Transacción</span>
              </div>

              {/* Card 4: MSI Configurados */}
              <div 
                className="card-theme !p-3 md:!p-4 text-left border border-border-theme/60 bg-surface-theme/90 hover:scale-[1.03] transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg hover:border-indigo-500/40 hover:bg-indigo-950/10 hover:shadow-indigo-500/5"
              >
                <span className="stat-label-theme block mb-0.5 md:mb-1 text-[9px] md:text-[10px] font-semibold tracking-wider uppercase text-text-dim-theme">MSI Configurados</span>
                <span className="stat-value-theme block font-black text-sm md:text-base transition-colors text-indigo-400">
                  <Tooltip content="Meses Sin Intereses configurados en tu pasarela actual para facilitar las compras de alto valor.">
                    {report.msi || "Sin MSI"}
                  </Tooltip>
                </span>
                <span className="text-[9px] md:text-[10px] text-text-dim-theme mt-1 block leading-tight">Facilidades de pago</span>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 2: STACK TECNOLÓGICO */}
        {activeSlide === 2 && (
          <div data-slide-index="2" className="w-full max-w-7xl mx-auto space-y-2.5 md:space-y-3.5 py-1 text-center my-auto">
            <div className="border-b border-border-theme pb-2 md:pb-3 max-w-4xl mx-auto">
              <span className="text-accent-theme text-[10px] md:text-xs font-black uppercase tracking-widest block mb-1">
                Auditoría de Herramientas
              </span>
              <h2 className="text-lg md:text-2xl lg:text-3xl font-black text-white leading-tight">
                Ecosistema <span className="text-accent-theme">Shopify</span> de {report.name}
              </h2>
              <p className="text-text-dim-theme text-[11px] md:text-xs leading-relaxed max-w-2xl mx-auto mt-1.5 line-clamp-3">
                La siguiente sección detalla las herramientas encontradas en tu tienda. Clasificamos cada aplicación en un semáforo de viabilidad operativa para tu migración.
              </p>
            </div>

            {report.tools?.length === 0 ? (
              <div className="text-center py-12 p-8 border border-border-theme rounded-2xl bg-surface-theme/40 text-text-dim-theme text-sm">
                No hay herramientas detectadas para este reporte. Configúralas en el administrador.
              </div>
            ) : (
              <div className="space-y-3 max-w-4xl mx-auto">
                {/* Horizontal sliding tool viewport */}
                <div className="relative overflow-hidden w-full py-1">
                  <motion.div 
                    animate={{ x: `-${activeToolIdx * 100}%` }}
                    transition={{ type: "spring", stiffness: 260, damping: 28 }}
                    className="flex w-full animate-in"
                  >
                    {chunkedTools.map((page, pageIdx) => {
                      return (
                        <div
                          key={pageIdx}
                          className="w-full flex-shrink-0 px-1"
                        >
                          <div className={`grid gap-3 w-full justify-center items-center ${
                            itemsPerPage === 2 && page.length > 1
                              ? "grid-cols-1 md:grid-cols-2" 
                              : "grid-cols-1 max-w-md mx-auto"
                          }`}>
                            {page.map((tool, toolIdx) => {
                              return (
                                <div 
                                  key={tool.id || toolIdx}
                                  className={`p-4 rounded-xl border flex flex-col justify-between gap-4 transition-all duration-300 hover:scale-[1.02] ${
                                    tool.semaphore === "green" 
                                      ? "bg-green-theme/5 border-green-theme/20 shadow-md shadow-green-950/5 hover:border-green-theme/40 hover:bg-green-theme/10" 
                                      : tool.semaphore === "yellow" 
                                      ? "bg-yellow-theme/5 border-yellow-theme/20 shadow-md shadow-yellow-950/5 hover:border-yellow-theme/40 hover:bg-yellow-theme/10" 
                                      : "bg-red-theme/5 border-red-theme/20 shadow-md shadow-red-950/5 hover:border-red-theme/40 hover:bg-red-theme/10"
                                  }`}
                                >
                                  <div className="space-y-1 text-left">
                                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                      <span className="text-[9px] font-semibold text-text-dim-theme bg-surface-theme px-1.5 py-0.5 rounded border border-border-theme uppercase tracking-wider">{tool.category}</span>
                                      
                                      {tool.semaphore === "green" && (
                                        <span className="text-[9px] font-semibold text-green-theme bg-green-theme/10 px-1.5 py-0.5 rounded border border-green-theme/10 flex items-center gap-1">
                                          <span className="w-1 h-1 rounded-full bg-green-theme animate-pulse"></span> Reemplazable
                                        </span>
                                      )}
                                      {tool.semaphore === "yellow" && (
                                        <span className="text-[9px] font-semibold text-yellow-theme bg-yellow-theme/10 px-1.5 py-0.5 rounded border border-yellow-theme/10 flex items-center gap-1">
                                          <span className="w-1 h-1 rounded-full bg-yellow-theme animate-pulse"></span> Neutral
                                        </span>
                                      )}
                                      {tool.semaphore === "red" && (
                                        <span className="text-[9px] font-semibold text-red-theme bg-red-theme/10 px-1.5 py-0.5 rounded border border-red-theme/10 flex items-center gap-1">
                                          <span className="w-1 h-1 rounded-full bg-red-theme animate-pulse"></span> Costo Oculto
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2.5 my-2.5">
                                      {tool.logo ? (
                                        <img 
                                          src={tool.logo} 
                                          alt={tool.name} 
                                          className="w-10 h-10 rounded-lg object-contain border border-border-theme bg-surface-theme p-1 shadow-sm shrink-0" 
                                          onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                                        />
                                      ) : (
                                        <div className="w-10 h-10 rounded-lg bg-surface-theme border border-border-theme flex items-center justify-center font-bold text-xs text-text-dim-theme shrink-0">
                                          {tool.name.charAt(0).toUpperCase()}
                                        </div>
                                      )}
                                      <div className="truncate">
                                        <h3 className="font-bold text-sm md:text-base text-white truncate">{tool.name}</h3>
                                        {tool.url && (
                                          <a 
                                            href={tool.url} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="text-[9px] text-accent-theme hover:underline inline-flex items-center gap-0.5"
                                          >
                                            Sitio web <ExternalLink className="w-2 h-2" />
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-text-dim-theme text-[11px] leading-relaxed line-clamp-2 md:line-clamp-3" title={tool.description}>{tool.description}</p>
                                  </div>

                                  <div className="border-t border-border-theme/40 pt-2 flex justify-between items-center">
                                    <span className="text-[9px] font-bold text-text-dim-theme uppercase tracking-wider">Gasto Mensual</span>
                                    <span className="font-mono font-black text-xs md:text-sm text-white">
                                      {tool.costType === "exact" ? (
                                        `$${tool.costExact.toLocaleString()} ${tool.currency}`
                                      ) : (
                                        `$${tool.costMin.toLocaleString()} - $${tool.costMax.toLocaleString()} ${tool.currency}`
                                      )}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                </div>

                {/* Micro-navigation buttons & dot indicators */}
                <div className="flex items-center justify-between px-2 py-1.5 bg-surface-theme/30 rounded-xl border border-border-theme/40">
                  <button
                    disabled={activeToolIdx === 0}
                    onClick={() => {
                      setToolSlideDirection("left");
                      setActiveToolIdx(prev => prev - 1);
                    }}
                    className={`p-2 rounded-lg border border-border-theme/60 transition-all ${
                      activeToolIdx === 0 
                        ? "text-text-dim-theme/40 bg-surface-theme/20 cursor-not-allowed border-none" 
                        : "text-white bg-surface-theme hover:bg-surface-hover-theme hover:border-accent-theme/40 active:scale-95 cursor-pointer"
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Dots */}
                  <div className="flex items-center gap-1.5">
                    {chunkedTools.map((_, dotIdx) => (
                      <button
                        key={dotIdx}
                        onClick={() => {
                          setToolSlideDirection(dotIdx > activeToolIdx ? "right" : "left");
                          setActiveToolIdx(dotIdx);
                        }}
                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                          dotIdx === activeToolIdx 
                            ? "w-6 bg-accent-theme" 
                            : "w-2 bg-text-dim-theme/30 hover:bg-text-dim-theme/60"
                        }`}
                        title={`Ver página ${dotIdx + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    disabled={activeToolIdx === chunkedTools.length - 1}
                    onClick={() => {
                      setToolSlideDirection("right");
                      setActiveToolIdx(prev => prev + 1);
                    }}
                    className={`p-2 rounded-lg border border-border-theme/60 transition-all ${
                      activeToolIdx === chunkedTools.length - 1 
                        ? "text-text-dim-theme/40 bg-surface-theme/20 cursor-not-allowed border-none" 
                        : "text-white bg-surface-theme hover:bg-surface-hover-theme hover:border-accent-theme/40 active:scale-95 cursor-pointer"
                    }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SLIDE 3: COSTOS OCULTOS */}
        {activeSlide === 3 && (
          <div data-slide-index="3" className="w-full max-w-5xl mx-auto space-y-2.5 md:space-y-3.5 py-1 flex flex-col justify-center my-auto min-h-0">
            <div className="border-b border-border-theme pb-2 text-center">
              <span className="text-red-theme text-[10px] md:text-xs font-black uppercase tracking-widest block mb-1 animate-pulse">
                Análisis Operativo Financiero
              </span>
              <h2 className="text-lg md:text-2xl lg:text-3xl font-black text-white leading-tight">
                Análisis de <span className="text-red-theme">Costos Ocultos</span> de Shopify
              </h2>
              <p className="text-text-dim-theme text-[11px] md:text-xs leading-relaxed max-w-2xl mx-auto mt-1.5 line-clamp-3">
                Calculamos la proporción de gasto que representa cada herramienta adicional instalada y el impacto variable de holgura de riesgos que merman tu ganancia.
              </p>
            </div>

            {/* TAB SELECTOR FOR MOBILE ONLY */}
            <div className="md:hidden flex rounded-xl bg-surface-theme/60 p-1 border border-border-theme/40 max-w-sm mx-auto w-full mb-1.5">
              <button 
                onClick={() => setActiveCostSlide(0)}
                className={`flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeCostSlide === 0 
                    ? "bg-accent-theme text-white shadow-md" 
                    : "text-text-dim-theme hover:text-white"
                }`}
              >
                Consumo Acumulado
              </button>
              <button 
                onClick={() => setActiveCostSlide(1)}
                className={`flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeCostSlide === 1 
                    ? "bg-accent-theme text-white shadow-md" 
                    : "text-text-dim-theme hover:text-white"
                }`}
              >
                Overhead
              </button>
            </div>

            {/* DESKTOP VIEW: Side-by-side without scroll */}
            <div className="hidden md:grid md:grid-cols-2 gap-6 w-full items-stretch">
              
              {/* Consumption Ratio Chart Card */}
              <div className="card-theme space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-200">Consumo Acumulado de Apps Shopify</h3>
                  <p className="text-xs text-text-dim-theme leading-relaxed">Porcentaje que representa cada herramienta sobre el gasto total mensual estimado en el ecosistema.</p>
                  
                  <div className="space-y-3 pt-4">
                    {report.tools?.map((tool, idx) => {
                      const cost = tool.costType === "exact" ? tool.costExact : tool.costMax;
                      const toolUSD = tool.currency === "USD" ? cost : cost / exchangeRate;
                      const pct = totalSpendToolsUSD > 0 ? (toolUSD / totalSpendToolsUSD) * 100 : 0;
                      
                      return (
                        <div key={tool.id || idx} className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-300 font-semibold">{tool.name}</span>
                            <span className="font-mono text-text-dim-theme">{pct.toFixed(1)}% (${cost} {tool.currency})</span>
                          </div>
                          <div className="w-full h-1 bg-surface-hover-theme rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${tool.semaphore === "green" ? "bg-green-theme" : tool.semaphore === "yellow" ? "bg-yellow-theme" : "bg-red-theme"}`} 
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Range Limits Card */}
              <div className="card-theme flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 mb-2">Desglose de Holgura de Gastos (Overhead)</h3>
                  <p className="text-xs text-text-dim-theme leading-relaxed">
                    Dado que cuentas con herramientas con rangos variables (como Loox o Bold Subscriptions), hemos calculado el gasto acumulado en ambos límites para prever el margen operativo mensual.
                  </p>
                </div>

                <div className="space-y-4 my-6">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-text-dim-theme">Límite Mínimo Mensual (USD):</span>
                      <strong className="text-green-theme font-bold">
                        <Tooltip content="El costo base mínimo facturable por tus aplicaciones integradas con tarifas variables en Shopify.">
                          ${minRangeOverheadUSD.toFixed(2)} USD
                        </Tooltip>
                      </strong>
                    </div>
                    <div className="w-full h-1.5 bg-surface-hover-theme rounded-full overflow-hidden">
                      <div className="h-full bg-green-theme" style={{ width: "30%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-text-dim-theme">Límite Máximo Mensual (USD):</span>
                      <strong className="text-red-theme font-bold">
                        <Tooltip content="El costo máximo que podrías pagar según picos de tráfico, reseñas o facturación en Shopify.">
                          ${maxRangeOverheadUSD.toFixed(2)} USD
                        </Tooltip>
                      </strong>
                    </div>
                    <div className="w-full h-1.5 bg-surface-hover-theme rounded-full overflow-hidden">
                      <div className="h-full bg-red-theme" style={{ width: "100%" }}></div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-red-theme/10 border border-red-theme/15 rounded-xl text-[10px] leading-relaxed text-red-theme">
                  ⚠️ <strong>Margen variable de riesgo:</strong> La diferencia entre el costo mínimo y el máximo representa un overhead potencial de <strong>${(maxRangeOverheadUSD - minRangeOverheadUSD).toFixed(2)} USD</strong> (${((maxRangeOverheadUSD - minRangeOverheadUSD) * exchangeRate).toFixed(2)} MXN) mensuales extras según tu facturación y reseñas recolectadas.
                </div>
              </div>

            </div>

            {/* MOBILE VIEW: Horizontally slidable with Framer Motion */}
            <div className="block md:hidden relative overflow-hidden w-full py-0.5">
              <motion.div 
                animate={{ x: `-${activeCostSlide * 100}%` }}
                transition={{ type: "spring", stiffness: 260, damping: 28 }}
                className="flex w-full animate-in"
              >
                {/* Mobile Slide 0: Consumo Acumulado */}
                <div className="w-full flex-shrink-0 px-1">
                  <div className="card-theme space-y-2.5 min-h-0 !p-3.5 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-200 text-left">Consumo Acumulado de Apps Shopify</h3>
                      <p className="text-[11px] text-text-dim-theme leading-relaxed text-left">Porcentaje que representa cada herramienta sobre el gasto total mensual estimado en el ecosistema.</p>
                      
                      <div className="space-y-2 pt-2.5 text-left">
                        {report.tools?.map((tool, idx) => {
                          const cost = tool.costType === "exact" ? tool.costExact : tool.costMax;
                          const toolUSD = tool.currency === "USD" ? cost : cost / exchangeRate;
                          const pct = totalSpendToolsUSD > 0 ? (toolUSD / totalSpendToolsUSD) * 100 : 0;
                          
                          return (
                            <div key={tool.id || idx} className="space-y-1">
                              <div className="flex justify-between text-[11px]">
                                <span className="text-slate-300 font-semibold">{tool.name}</span>
                                <span className="font-mono text-text-dim-theme">{pct.toFixed(1)}% (${cost} {tool.currency})</span>
                              </div>
                              <div className="w-full h-1 bg-surface-hover-theme rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${tool.semaphore === "green" ? "bg-green-theme" : tool.semaphore === "yellow" ? "bg-yellow-theme" : "bg-red-theme"}`} 
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Slide 1: Overhead */}
                <div className="w-full flex-shrink-0 px-1">
                  <div className="card-theme flex flex-col justify-between min-h-0 !p-3.5">
                    <div>
                      <h3 className="text-sm font-bold text-slate-200 mb-1 text-left">Desglose de Holgura de Gastos (Overhead)</h3>
                      <p className="text-[11px] text-text-dim-theme leading-relaxed text-left">
                        Dado que cuentas con herramientas con rangos variables (como Loox o Bold Subscriptions), hemos calculado el gasto acumulado en ambos límites para prever el margen operativo mensual.
                      </p>
                    </div>

                    <div className="space-y-2.5 my-2.5 text-left">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-text-dim-theme">Límite Mínimo (USD):</span>
                          <strong className="text-green-theme font-bold">${minRangeOverheadUSD.toFixed(2)} USD</strong>
                        </div>
                        <div className="w-full h-1 bg-surface-hover-theme rounded-full overflow-hidden">
                          <div className="h-full bg-green-theme" style={{ width: "30%" }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-text-dim-theme">Límite Máximo (USD):</span>
                          <strong className="text-red-theme font-bold">${maxRangeOverheadUSD.toFixed(2)} USD</strong>
                        </div>
                        <div className="w-full h-1 bg-surface-hover-theme rounded-full overflow-hidden">
                          <div className="h-full bg-red-theme" style={{ width: "100%" }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-red-theme/10 border border-red-theme/15 rounded-xl text-[10px] leading-relaxed text-red-theme text-left">
                      ⚠️ <strong>Margen variable de riesgo:</strong> La diferencia entre el costo mínimo y el máximo representa un overhead potencial de <strong>${(maxRangeOverheadUSD - minRangeOverheadUSD).toFixed(2)} USD</strong> (${((maxRangeOverheadUSD - minRangeOverheadUSD) * exchangeRate).toFixed(2)} MXN) mensuales extras según tu facturación y reseñas recolectadas.
                    </div>
                  </div>
                </div>

              </motion.div>

              {/* DOTS INDICATORS ON MOBILE */}
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <button
                  onClick={() => setActiveCostSlide(0)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    activeCostSlide === 0 ? "w-6 bg-accent-theme" : "w-2 bg-text-dim-theme/30"
                  }`}
                  title="Consumo Acumulado"
                />
                <button
                  onClick={() => setActiveCostSlide(1)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    activeCostSlide === 1 ? "w-6 bg-accent-theme" : "w-2 bg-text-dim-theme/30"
                  }`}
                  title="Overhead"
                />
              </div>
            </div>

          </div>
        )}

        {/* SLIDE 4: COMPARATIVO DIRECTO */}
        {activeSlide === 4 && (
          <div data-slide-index="4" className="w-full max-w-5xl mx-auto space-y-3 md:space-y-4.5 py-2 my-auto">
            <div className="border-b border-border-theme pb-3 text-center">
              <span className="text-accent-theme text-[10px] md:text-xs font-black uppercase tracking-widest block mb-1">
                Mapeo de Variables Comerciales
              </span>
              <h2 className="text-lg md:text-2xl lg:text-3xl font-black text-white leading-tight">
                Comparativo <span className="text-accent-theme">Estructural Directo</span> de Plataforma
              </h2>
              <p className="text-text-dim-theme text-[11px] md:text-xs leading-relaxed max-w-2xl mx-auto mt-1.5 line-clamp-3">
                Evaluamos de manera directa y detallada las ventajas transaccionales, tarifas de conexión, estabilidad cambiaria y soporte entre ambas opciones.
              </p>
            </div>

            {/* COMPARATIVE GRID OR TABLE */}
            {/* DESKTOP TABLE */}
            <div className="hidden md:block border border-border-theme rounded-2xl overflow-x-auto bg-surface-theme/80 shadow-md">
              <table className="comparison-table-theme w-full">
                <thead>
                  <tr className="border-b border-border-theme bg-surface-hover-theme font-semibold text-slate-300">
                    <th className="p-4 w-1/4">Variable</th>
                    <th className="p-4 w-[37.5%]">Shopify</th>
                    <th className="p-4 w-[37.5%]">Tiendanube</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-theme text-slate-300">
                  {comparisonRows.map((row, idx) => {
                    return (
                      <tr key={row.id || idx} className="hover:bg-surface-hover-theme/55 transition-colors">
                        <td className="p-4 font-bold text-slate-200">{row.variable}</td>
                        <td className="p-4 text-text-dim-theme leading-relaxed">{row.shopify}</td>
                        <td className="p-4 leading-relaxed">
                          <div className="space-y-1.5">
                            <div>{row.tiendanube}</div>
                            {row.pillText && (
                              <span className="pill-tiendanube-theme inline-flex items-center gap-1">
                                ✨ {row.pillText}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE LIST (HORIZONTAL SLIDABLE CARDS) */}
            <div className="block md:hidden space-y-4 px-1">
              <div className="relative overflow-hidden w-full py-1">
                <motion.div 
                  animate={{ x: `-${activeCompareSlide * 100}%` }}
                  transition={{ type: "spring", stiffness: 260, damping: 28 }}
                  className="flex w-full animate-in"
                >
                  {comparisonRows.map((row, idx) => {
                    return (
                      <div 
                        key={row.id || idx} 
                        className="w-full flex-shrink-0 px-1"
                      >
                        <div className="card-theme !p-4 space-y-4 border border-border-theme/40 rounded-xl bg-surface-theme/50 text-left">
                          {/* Header: Variable Title */}
                          <div className="flex items-center gap-2 border-b border-border-theme/20 pb-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-theme shadow-sm" />
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">{row.variable}</h4>
                          </div>

                          {/* Comparison Body */}
                          <div className="space-y-3.5 text-left">
                            {/* Shopify */}
                            <div className="space-y-1 bg-surface-hover-theme/20 p-3 rounded-lg border border-border-theme/10">
                              <span className="text-[9px] font-black tracking-wider text-text-dim-theme uppercase block">Shopify</span>
                              <p className="text-[11px] text-text-dim-theme leading-normal">{row.shopify}</p>
                            </div>

                            {/* Tiendanube */}
                            <div className="space-y-1.5 bg-accent-theme/5 p-3 rounded-lg border border-accent-theme/10">
                              <span className="text-[9px] font-black tracking-wider text-accent-theme uppercase block">Tiendanube</span>
                              <p className="text-[11px] text-slate-100 leading-normal font-medium">{row.tiendanube}</p>
                              {row.pillText && (
                                <span className="pill-tiendanube-theme text-[9px] py-0.5 px-2 inline-flex items-center gap-0.5 font-bold rounded-full bg-accent-theme/10 text-accent-theme border border-accent-theme/20">
                                  ✨ {row.pillText}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              </div>

              {/* Navigation & Dot Indicators */}
              <div className="flex items-center justify-between px-2 py-1.5 bg-surface-theme/30 rounded-xl border border-border-theme/40">
                <button
                  disabled={activeCompareSlide === 0}
                  onClick={() => setActiveCompareSlide(prev => prev - 1)}
                  className={`p-2 rounded-lg border border-border-theme/60 transition-all ${
                    activeCompareSlide === 0 
                      ? "text-text-dim-theme/40 bg-surface-theme/20 cursor-not-allowed border-none" 
                      : "text-white bg-surface-theme hover:bg-surface-hover-theme hover:border-accent-theme/40 active:scale-95 cursor-pointer"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Dots */}
                <div className="flex items-center gap-1.5">
                  {comparisonRows.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      onClick={() => setActiveCompareSlide(dotIdx)}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        dotIdx === activeCompareSlide 
                          ? "w-6 bg-accent-theme" 
                          : "w-2 bg-text-dim-theme/30 hover:bg-text-dim-theme/60"
                      }`}
                      title={`Ver comparación ${dotIdx + 1}`}
                    />
                  ))}
                </div>

                <button
                  disabled={activeCompareSlide === comparisonRows.length - 1}
                  onClick={() => setActiveCompareSlide(prev => prev + 1)}
                  className={`p-2 rounded-lg border border-border-theme/60 transition-all ${
                    activeCompareSlide === comparisonRows.length - 1 
                      ? "text-text-dim-theme/40 bg-surface-theme/20 cursor-not-allowed border-none" 
                      : "text-white bg-surface-theme hover:bg-surface-hover-theme hover:border-accent-theme/40 active:scale-95 cursor-pointer"
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 5: CALCULADORA DE AHORRO */}
        {activeSlide === 5 && (
          <div data-slide-index="5" className="w-full max-w-5xl mx-auto space-y-3.5 py-1 my-auto">
            {/* Header Section */}
            <div className="border-b border-border-theme/40 pb-3 text-center flex flex-col items-center">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-white leading-tight">
                Calculadora Interactiva de{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a3e635] via-emerald-300 to-teal-300">
                  Ahorro y Retorno
                </span>
              </h2>
              <p className="text-text-dim-theme text-xs leading-relaxed max-w-2xl mx-auto mt-1.5 mb-1.5 line-clamp-3">
                Ajusta tu volumen de venta mensual y modifica los costos de tu e-commerce para visualizar el ahorro neto inmediato consolidado.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[9px] bg-[#a3e635]/15 border border-[#a3e635]/30 text-[#a3e635] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  🇲🇽 Precios en MXN
                </span>
              </div>
            </div>

            {/* DETAILED INTERACTIVE CALCULATOR GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              
              {/* Left Column: Savings Hero & Cost Breakdown Cards */}
              <div className="lg:col-span-5 space-y-3.5">
                {/* HERO SAVINGS DISPLAY CARD */}
                <div className="w-full p-4 sm:p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-surface-theme to-indigo-950/20 text-center space-y-2.5 relative overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                  {/* Decorative Radial Lighting */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#a3e635]/15 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                      <Tooltip content="Monto promedio total de capital mensual recuperado al eliminar comisiones de transacción de Shopify y optimizar aplicaciones extras." showIcon={true}>
                        Ahorro Neto Estimado
                      </Tooltip>
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#a3e635] via-emerald-300 to-teal-300 block tracking-tight">
                      <Tooltip content="Tu ahorro neto mensual calculado: (Suscripción Shopify + Comisión por Transacción + Apps) - Costo de Tiendanube.">
                        ${monthlySavingsMXN.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                      </Tooltip>
                    </span>
                    <span className="text-[11px] text-text-dim-theme font-semibold block mt-0.5">
                      al mes en promedio
                    </span>
                  </div>

                  {/* Percentage ROI Badge & Annualized Pill */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    {totalShopifyMonthlyCostMXN > 0 && (
                      <span className="text-[10px] font-bold text-emerald-300 bg-emerald-900/40 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                        ⚡ {Math.round((monthlySavingsMXN / Math.max(1, totalShopifyMonthlyCostMXN + shopifyGatewayFeeMXN)) * 100)}% de reducción en costos
                      </span>
                    )}
                    <div className="py-1 px-3 bg-[#a3e635]/10 border border-[#a3e635]/30 rounded-full inline-block">
                      <span className="text-[10px] font-bold text-white">
                        Anualizado:{" "}
                        <span className="text-[#a3e635] font-black font-mono">
                          <Tooltip content="Proyección estimada de ahorro a 12 meses, ideal para reinversión en inventario o campañas publicitarias.">
                            ${yearlySavingsMXN.toLocaleString("es-MX", { maximumFractionDigits: 0 })} MXN
                          </Tooltip>
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* SIDE-BY-SIDE VISUAL COMPARISON CARDS */}
                  <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-border-theme/40 text-[10px] text-left">
                    
                    {/* Shopify Card (Red Alert Style) */}
                    <div className="p-2.5 rounded-xl border border-red-500/25 bg-red-950/15 space-y-1.5 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 border-b border-red-500/20 pb-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                          <span className="font-bold text-red-400 uppercase text-[9px] tracking-wider">Costo Shopify</span>
                        </div>
                        
                        <div className="flex justify-between items-center text-slate-300 pt-0.5">
                          <span className="text-text-dim-theme">Plan Base:</span>
                          {isEditingShopifyBase ? (
                            <div className="flex items-center gap-1">
                              <input 
                                type="number" 
                                value={tempShopifyBase}
                                onChange={e => setTempShopifyBase(e.target.value)}
                                onBlur={handleCommitShopifyBase}
                                onKeyDown={e => {
                                  if (e.key === "Enter") handleCommitShopifyBase();
                                  if (e.key === "Escape") setIsEditingShopifyBase(false);
                                }}
                                autoFocus
                                className="bg-bg-theme text-red-300 border border-red-500/60 rounded px-1 py-0.5 text-xs font-mono w-24 text-right focus:outline-none focus:ring-1 focus:ring-red-500"
                              />
                            </div>
                          ) : (
                            <strong 
                              onClick={() => {
                                setTempShopifyBase(String(Math.round(monthlyShopifyBaseMXN)));
                                setIsEditingShopifyBase(true);
                              }}
                              className="font-mono font-medium cursor-pointer hover:text-red-300 hover:underline flex items-center gap-1 group/edit"
                              title="Haz clic para editar Plan Base de Shopify"
                            >
                              <span>${monthlyShopifyBaseMXN.toLocaleString("es-MX", { maximumFractionDigits: 0 })}</span>
                              <span className="text-[9px] text-text-dim-theme opacity-50 group-hover/edit:opacity-100 transition-opacity">✎</span>
                            </strong>
                          )}
                        </div>

                        <div className="flex justify-between items-center text-slate-300">
                          <span className="text-text-dim-theme">Transacción ({customShopifyFee}%):</span>
                          {isEditingShopifyFee ? (
                            <div className="flex items-center gap-1">
                              <input 
                                type="number" 
                                value={tempShopifyFee}
                                onChange={e => setTempShopifyFee(e.target.value)}
                                onBlur={handleCommitShopifyFee}
                                onKeyDown={e => {
                                  if (e.key === "Enter") handleCommitShopifyFee();
                                  if (e.key === "Escape") setIsEditingShopifyFee(false);
                                }}
                                autoFocus
                                placeholder="monto o %"
                                className="bg-bg-theme text-red-300 border border-red-500/60 rounded px-1 py-0.5 text-xs font-mono w-24 text-right focus:outline-none focus:ring-1 focus:ring-red-500"
                              />
                            </div>
                          ) : (
                            <strong 
                              onClick={() => {
                                setTempShopifyFee(String(Math.round(shopifyTransactionFeeMXN)));
                                setIsEditingShopifyFee(true);
                              }}
                              className="font-mono font-medium text-red-300 cursor-pointer hover:underline flex items-center gap-1 group/edit"
                              title="Haz clic para editar comisión (ingresa $ monto o % comisión)"
                            >
                              <span>${shopifyTransactionFeeMXN.toLocaleString("es-MX", { maximumFractionDigits: 0 })}</span>
                              <span className="text-[9px] text-text-dim-theme opacity-50 group-hover/edit:opacity-100 transition-opacity">✎</span>
                            </strong>
                          )}
                        </div>

                        <div className="flex justify-between items-center text-slate-300">
                          <span className="text-text-dim-theme">Apps Extra:</span>
                          {isEditingAppsCost ? (
                            <div className="flex items-center gap-1">
                              <input 
                                type="number" 
                                value={tempAppsCost}
                                onChange={e => setTempAppsCost(e.target.value)}
                                onBlur={handleCommitAppsCost}
                                onKeyDown={e => {
                                  if (e.key === "Enter") handleCommitAppsCost();
                                  if (e.key === "Escape") setIsEditingAppsCost(false);
                                }}
                                autoFocus
                                className="bg-bg-theme text-red-300 border border-red-500/60 rounded px-1 py-0.5 text-xs font-mono w-24 text-right focus:outline-none focus:ring-1 focus:ring-red-500"
                              />
                            </div>
                          ) : (
                            <strong 
                              onClick={() => {
                                setTempAppsCost(String(Math.round(convertedAppsCostMXN)));
                                setIsEditingAppsCost(true);
                              }}
                              className="font-mono font-medium cursor-pointer hover:text-red-300 hover:underline flex items-center gap-1 group/edit"
                              title="Haz clic para editar gasto en Apps Extra"
                            >
                              <span>${convertedAppsCostMXN.toLocaleString("es-MX", { maximumFractionDigits: 0 })}</span>
                              <span className="text-[9px] text-text-dim-theme opacity-50 group-hover/edit:opacity-100 transition-opacity">✎</span>
                            </strong>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center border-t border-red-500/20 pt-1.5 font-bold text-red-400">
                        <span>Total Shopify:</span>
                        <span className="font-mono text-xs font-black">${totalShopifyMonthlyCostMXN.toLocaleString("es-MX", { maximumFractionDigits: 0 })}</span>
                      </div>
                    </div>

                    {/* Tiendanube Card (Green Success Style) */}
                    <div className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-1.5 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 border-b border-emerald-500/20 pb-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#a3e635]" />
                          <span className="font-bold text-[#a3e635] uppercase text-[9px] tracking-wider">Tiendanube</span>
                        </div>
                        
                        <div className="flex justify-between items-center text-slate-300 pt-0.5">
                          <span className="text-text-dim-theme">Plan ({report.tiendanubePlan === "basic" ? "Básico" : report.tiendanubePlan === "tiendanube" ? "Tiendanube" : report.tiendanubePlan === "advanced" ? "Avanzado" : "Evolución"}):</span>
                          <span className="font-mono font-medium">${tiendanubeBaseMXN.toLocaleString("es-MX", { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Transacción (0%):</span>
                          <span className="font-mono font-bold text-emerald-400">$0</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-300">
                          <span className="text-text-dim-theme">Apps Extra:</span>
                          {isEditingTiendanubeApps ? (
                            <div className="flex items-center gap-1">
                              <input 
                                type="number" 
                                value={tempTiendanubeApps}
                                onChange={e => setTempTiendanubeApps(e.target.value)}
                                onBlur={handleCommitTiendanubeApps}
                                onKeyDown={e => {
                                  if (e.key === "Enter") handleCommitTiendanubeApps();
                                  if (e.key === "Escape") setIsEditingTiendanubeApps(false);
                                }}
                                autoFocus
                                className="bg-bg-theme text-emerald-400 border border-emerald-500/60 rounded px-1 py-0.5 text-xs font-mono w-24 text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>
                          ) : (
                            <strong 
                              onClick={() => {
                                setTempTiendanubeApps(String(Math.round(customTiendanubeAppsMXN)));
                                setIsEditingTiendanubeApps(true);
                              }}
                              className="font-mono font-bold text-emerald-400 cursor-pointer hover:underline flex items-center gap-1 group/edit"
                              title="Haz clic para editar gasto en Apps Extra para Tiendanube"
                            >
                              <span>${customTiendanubeAppsMXN.toLocaleString("es-MX", { maximumFractionDigits: 0 })}</span>
                              <span className="text-[9px] text-text-dim-theme opacity-50 group-hover/edit:opacity-100 transition-opacity">✎</span>
                            </strong>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center border-t border-emerald-500/20 pt-1.5 font-bold text-[#a3e635]">
                        <span>Total Tiendanube:</span>
                        <span className="font-mono text-xs font-black">${totalTiendanubeMonthlyCostMXN.toLocaleString()}</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* GMV SLIDER & PRESETS INTERACTIVE PANEL */}
                <div className="w-full bg-surface-theme/80 border border-border-theme/60 p-3.5 rounded-2xl space-y-3 shadow-md">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-text-dim-theme font-bold">Volumen de Venta Mensual (GMV):</span>
                    {isEditingGmv ? (
                      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <input 
                          type="number" 
                          value={tempGmv}
                          onChange={e => setTempGmv(e.target.value)}
                          onBlur={handleCommitGmv}
                          onKeyDown={e => {
                            if (e.key === "Enter") handleCommitGmv();
                            if (e.key === "Escape") setIsEditingGmv(false);
                          }}
                          autoFocus
                          min={90000}
                          className="bg-bg-theme text-emerald-400 border border-emerald-500/50 rounded px-1.5 py-0.5 text-xs font-mono w-28 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    ) : (
                      <strong 
                        className="text-[#a3e635] font-black text-sm cursor-pointer hover:underline flex items-center gap-1 font-mono bg-[#a3e635]/10 px-2 py-0.5 rounded-lg border border-[#a3e635]/20"
                        onClick={() => {
                          setTempGmv(String(calcGmv));
                          setIsEditingGmv(true);
                        }}
                      >
                        <span>${calcGmv.toLocaleString()} MXN</span>
                        <span className="text-[10px] text-text-dim-theme font-normal opacity-70">✎</span>
                      </strong>
                    )}
                  </div>

                  {/* QUICK GMV PRESETS BAR */}
                  <div className="flex items-center justify-between gap-1 text-[10px] bg-bg-theme/50 p-1.5 rounded-xl border border-border-theme/40">
                    <span className="text-text-dim-theme font-semibold px-1">Presets:</span>
                    {[150000, 300000, 500000, 750000, 1000000].map((presetVal) => (
                      <button
                        key={presetVal}
                        onClick={() => setCalcGmv(presetVal)}
                        className={`px-2 py-1 rounded-lg font-bold font-mono transition-all cursor-pointer ${
                          calcGmv === presetVal
                            ? "bg-gradient-to-r from-emerald-600 to-[#a3e635] text-black shadow-sm scale-105"
                            : "bg-surface-theme text-text-dim-theme hover:text-white hover:bg-surface-hover-theme"
                        }`}
                      >
                        ${presetVal >= 1000000 ? "1M" : `${presetVal / 1000}k`}
                      </button>
                    ))}
                  </div>

                  {/* SLIDER INPUT */}
                  <div className="space-y-1">
                    <input 
                      type="range" 
                      min={90000} 
                      max={1000000} 
                      step={10000}
                      value={calcGmv} 
                      onChange={e => setCalcGmv(Number(e.target.value))}
                      className="w-full h-2 bg-surface-hover-theme rounded-lg appearance-none cursor-pointer accent-[#a3e635]" 
                    />
                    <div className="flex justify-between text-[9px] text-text-dim-theme font-mono font-medium">
                      <span>Min: $90,000</span>
                      <span>Max: $1,000,000</span>
                    </div>
                  </div>
                </div>

                {/* MODIFY COSTS TOGGLE BUTTON */}
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowModifyCosts(!showModifyCosts)}
                    className="flex items-center gap-2 px-4 py-2 bg-surface-theme hover:bg-surface-hover-theme border border-border-theme/60 hover:border-accent-theme rounded-xl text-xs font-bold text-text-theme transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <Sliders className="w-3.5 h-3.5 text-[#a3e635]" />
                    <span>{showModifyCosts ? "Ocultar costos adicionales" : "Modificar costos"}</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Dynamic Data Visualization with Recharts */}
              <div className="lg:col-span-7 w-full lg:sticky lg:top-4">
                <SavingsProjectionChart 
                  monthlyShopifyCost={totalShopifyMonthlyCostMXN + shopifyGatewayFeeMXN}
                  monthlyTiendanubeCost={totalTiendanubeMonthlyCostMXN}
                  monthlySavings={monthlySavingsMXN}
                  isDarkMode={isDarkMode}
                />
              </div>

            </div>

            {/* EXPANDABLE SECTION FOR COSTS (Placed full width at the bottom of the grid) */}
            <AnimatePresence>
              {showModifyCosts && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 mt-4"
                >
                  {/* EXCEEDING APP COSTS */}
                  <div className="card-theme space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-dim-theme font-semibold">Gasto en Aplicaciones Extra:</span>
                      <strong className="text-indigo-400 font-bold">${convertedAppsCostMXN.toLocaleString("es-MX", { maximumFractionDigits: 0 })}/mes</strong>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] text-text-dim-theme uppercase font-bold mb-1">Monto USD</label>
                        <input 
                          type="number" 
                          value={calcAppsCostUSD}
                          onChange={e => setCalcAppsCostUSD(Number(e.target.value))}
                          className="w-full bg-surface-theme border border-border-theme px-3 py-1.5 rounded-lg text-xs outline-none text-white font-semibold focus:border-accent-theme"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-text-dim-theme uppercase font-bold mb-1">Monto MXN</label>
                        <input 
                          type="number" 
                          value={calcAppsCostMXN}
                          onChange={e => setCalcAppsCostMXN(Number(e.target.value))}
                          className="w-full bg-surface-theme border border-border-theme px-3 py-1.5 rounded-lg text-xs outline-none text-white font-semibold focus:border-accent-theme"
                        />
                      </div>
                    </div>
                    <span className="text-[10px] text-text-dim-theme block leading-tight">Gasto total recalculado usando el tipo de cambio de <strong>${exchangeRate.toFixed(2)} MXN/USD</strong>.</span>
                  </div>

                  {/* CONFIGURACIÓN PLAN SHOPIFY */}
                  <div className="card-theme space-y-3">
                    <span className="text-[10px] font-bold text-text-dim-theme uppercase">Configuración Plan Shopify</span>
                    
                    <select
                      value={calcShopifyPlan}
                      onChange={e => setCalcShopifyPlan(e.target.value)}
                      className="w-full bg-surface-theme border border-border-theme px-3 py-1.5 rounded-lg text-xs outline-none text-slate-200 cursor-pointer focus:border-accent-theme"
                    >
                      <option value="basic">Basic Shopify</option>
                      <option value="grow">Shopify Plan / Grow</option>
                      <option value="advanced">Advanced Shopify</option>
                      <option value="plus">Shopify Plus</option>
                      <option value="custom">Personalizado (Manual)</option>
                    </select>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="block text-[8px] text-text-dim-theme font-bold uppercase mb-0.5">Precio Base USD</label>
                        <input 
                          type="number" 
                          value={customShopifyPrice} 
                          onChange={e => setCustomShopifyPrice(Number(e.target.value))}
                          className="w-full bg-surface-theme border border-border-theme px-2 py-1 rounded text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] text-text-dim-theme font-bold uppercase mb-0.5">Comisión %</label>
                        <input 
                          type="number" 
                          step="0.1" 
                          value={customShopifyFee} 
                          onChange={e => setCustomShopifyFee(Number(e.target.value))}
                          className="w-full bg-surface-theme border border-border-theme px-2 py-1 rounded text-xs text-white"
                        />
                      </div>
                    </div>

                    {/* Annual Toggle (For Basic, Grow, Advanced) */}
                    {calcShopifyPlan !== "plus" && (
                      <div className="flex items-center gap-2 pt-2 border-t border-border-theme">
                        <input 
                          type="checkbox" 
                          id="annual-shopify"
                          checked={isAnnualShopify}
                          onChange={e => setIsAnnualShopify(e.target.checked)}
                          className="w-3.5 h-3.5 accent-accent-theme cursor-pointer"
                        />
                        <label htmlFor="annual-shopify" className="text-[10px] font-bold uppercase text-text-dim-theme cursor-pointer">Pago Anual Activado</label>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* SLIDE 6: RENTABILIDAD */}
        {activeSlide === 6 && (
          <div data-slide-index="6" className="w-full max-w-5xl mx-auto space-y-3 md:space-y-4.5 py-2 my-auto">
            <div className="border-b border-border-theme pb-2.5 text-center flex flex-col items-center">
              <span className="text-accent-theme text-[10px] md:text-xs font-black uppercase tracking-widest block mb-1">
                Eficiencia de Margen Neto
              </span>
              <h2 className="text-lg md:text-2xl lg:text-3xl font-black text-white leading-tight">
                Análisis Comparativo de <span className="text-accent-theme">Rentabilidad Neta</span>
              </h2>
              <p className="text-text-dim-theme text-[11px] md:text-xs leading-relaxed max-w-2xl mx-auto mt-1.5 mb-2 line-clamp-3">
                Calcula y descubre cuánto dinero retienes realmente tras deducir todas las comisiones fijas y variables de ambas plataformas de e-commerce.
              </p>
            </div>

            {/* GANANCIA REAL POR CADA $100 DE VENTA */}
            <div className="space-y-4">
              <div className="text-center space-y-1.5">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 text-xs sm:text-sm text-text-dim-theme max-w-xl mx-auto">
                  <span>Por cada compra de:</span>
                  <div className="flex items-center bg-surface-theme border border-border-theme px-2 py-0.5 rounded-md focus-within:border-accent-theme transition-colors">
                    <span className="text-white text-xs font-bold mr-0.5">$</span>
                    <input
                      type="number"
                      value={rentabilidadBase}
                      onChange={e => setRentabilidadBase(Math.max(1, Number(e.target.value)))}
                      className="bg-transparent border-none outline-none text-white text-xs font-bold w-16 text-center"
                    />
                  </div>
                  <span>MXN simulados, te quedan libres:</span>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center gap-6 py-6 sm:py-8 bg-surface-theme/40 rounded-2xl border border-border-theme/40 p-3 sm:p-6 max-w-4xl mx-auto relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 md:gap-14 w-full">
                  
                  {/* Left Circle: Shopify */}
                  <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4 w-full max-w-[280px] sm:w-auto">
                    <h4 className="text-[11px] sm:text-xs font-black tracking-wider text-text-dim-theme uppercase">Shopify hoy</h4>
                    
                    {/* Ring segment calculations */}
                    {(() => {
                      const shopifyPlanPerAmount = (monthlyShopifyBaseMXN / calcGmv) * rentabilidadBase;
                      const shopifyAppsPerAmount = (convertedAppsCostMXN / calcGmv) * rentabilidadBase;
                      const shopifyGatewayPerAmount = (0.036 * rentabilidadBase) + 3;
                      const shopifyCommissionPerAmount = (customShopifyFee / 100) * rentabilidadBase;
                      const shopifyNetPerAmount = Math.max(0, rentabilidadBase - (shopifyPlanPerAmount + shopifyAppsPerAmount + shopifyGatewayPerAmount + shopifyCommissionPerAmount));

                      const shopifySegments: DonutSegment[] = [
                        { value: shopifyNetPerAmount, color: "#334155", label: "Neto" },
                        { value: shopifyPlanPerAmount, color: "#fbbf24", label: "Pago del Plan" },
                        { value: shopifyAppsPerAmount, color: "#a78bfa", label: "Apps" },
                        { value: shopifyGatewayPerAmount, color: "#3b82f6", label: "Gateway de Pago" },
                        { value: shopifyCommissionPerAmount, color: "#f43f5e", label: "Comisión" },
                      ];

                      return (
                        <>
                          <Tooltip content="Esta métrica indica cuánta ganancia te queda libre de comisiones por cada compra en Shopify.">
                            <DonutRing
                              segments={shopifySegments}
                              centerText={`$${formatAbbreviatedAmount(shopifyNetPerAmount)}`}
                              centerSubtext="te quedan"
                              size={isMobile ? 120 : (viewportHeight < 800 ? 140 : 180)}
                              strokeWidth={isMobile ? 12 : (viewportHeight < 800 ? 14 : 18)}
                              textClass="text-slate-200 animate-fade-in"
                            />
                          </Tooltip>
                          {/* Legend for Shopify */}
                          <AnimatePresence>
                            {showRentabilidadLegends && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.25 }}
                                className="space-y-1.5 text-left text-xs pt-4 w-full max-w-[260px] border-t border-border-theme/40 overflow-hidden"
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#334155]" />
                                    <span className="text-text-dim-theme text-[11px]">Neto (Te queda):</span>
                                  </div>
                                  <strong className="text-slate-200 font-mono text-[11px]">${formatAbbreviatedAmount(shopifyNetPerAmount)}</strong>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]" />
                                    <span className="text-text-dim-theme text-[11px]">Pago del Plan:</span>
                                  </div>
                                  <strong className="text-slate-200 font-mono text-[11px]">${formatAbbreviatedAmount(shopifyPlanPerAmount)}</strong>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#a78bfa]" />
                                    <span className="text-text-dim-theme text-[11px]">Apps:</span>
                                  </div>
                                  <strong className="text-slate-200 font-mono text-[11px]">${formatAbbreviatedAmount(shopifyAppsPerAmount)}</strong>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
                                    <span className="text-text-dim-theme text-[11px]">Gateway (3.6%+$3):</span>
                                  </div>
                                  <strong className="text-slate-200 font-mono text-[11px]">${formatAbbreviatedAmount(shopifyGatewayPerAmount)}</strong>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]" />
                                    <span className="text-text-dim-theme text-[11px]">Comisión Transacción ({customShopifyFee}%):</span>
                                  </div>
                                  <strong className="text-slate-200 font-mono text-[11px]">${formatAbbreviatedAmount(shopifyCommissionPerAmount)}</strong>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      );
                    })()}
                  </div>

                  {/* Middle Separator with VS & Saving Pill */}
                  <div className="flex flex-col items-center justify-center gap-2 sm:gap-4 py-0">
                    <div className="hidden sm:block w-px h-10 md:h-16 bg-border-theme/40"></div>
                    <div className="bg-surface-theme/90 border border-border-theme/60 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[8px] sm:text-[10px] font-black text-text-dim-theme uppercase tracking-wider">
                      VS
                    </div>
                    <div className="hidden sm:block w-px h-10 md:h-16 bg-border-theme/40"></div>
                    
                    {/* Dynamic Variable Center Saving Chip */}
                    <div className="flex flex-col items-center gap-1.5 z-20">
                      <Tooltip content="Haz clic para cambiar el periodo (Mensual, Por Compra, Anual o 3 Años)">
                        <button
                          onClick={() => {
                            setRentabilidadChipMode(prev => {
                              if (prev === "mes") return "compra";
                              if (prev === "compra") return "anio";
                              if (prev === "anio") return "3anios";
                              return "mes";
                            });
                          }}
                          className="bg-[#a3e635] hover:bg-[#b5f846] text-slate-950 font-black px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[9px] sm:text-xs md:text-sm shadow-xl whitespace-nowrap transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 border border-[#84cc16]"
                        >
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                          {rentabilidadChipMode === "mes" && (
                            <span>+${Math.round(monthlySavingsMXN).toLocaleString("es-MX")}/mes</span>
                          )}
                          {rentabilidadChipMode === "compra" && (
                            <span>+${(Math.max(0, ((rentabilidadBase - ((tiendanubeBaseMXN / calcGmv) * rentabilidadBase + 0.0329 * rentabilidadBase + 3)) - (rentabilidadBase - ((monthlyShopifyBaseMXN / calcGmv) * rentabilidadBase + (convertedAppsCostMXN / calcGmv) * rentabilidadBase + 0.036 * rentabilidadBase + 3 + (customShopifyFee / 100) * rentabilidadBase))))).toFixed(2)} por compra</span>
                          )}
                          {rentabilidadChipMode === "anio" && (
                            <span>+${Math.round(monthlySavingsMXN * 12).toLocaleString("es-MX")}/año</span>
                          )}
                          {rentabilidadChipMode === "3anios" && (
                            <span>+${Math.round(monthlySavingsMXN * 36).toLocaleString("es-MX")} (3 años)</span>
                          )}
                        </button>
                      </Tooltip>

                      {/* Mode Selector Pills */}
                      <div className="flex items-center gap-1 bg-surface-theme/90 p-0.5 rounded-lg border border-border-theme/60 text-[8px] sm:text-[9px]">
                        {[
                          { key: "mes", label: "Mes" },
                          { key: "compra", label: "Por Compra" },
                          { key: "anio", label: "1 Año" },
                          { key: "3anios", label: "3 Años" },
                        ].map((m) => (
                          <button
                            key={m.key}
                            onClick={() => setRentabilidadChipMode(m.key as any)}
                            className={`px-1.5 py-0.5 rounded-md font-extrabold transition-all cursor-pointer ${
                              rentabilidadChipMode === m.key
                                ? "bg-[#a3e635] text-slate-950 shadow-xs"
                                : "text-text-dim-theme hover:text-white"
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Circle: Tiendanube */}
                  <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4 w-full max-w-[280px] sm:w-auto">
                    <h4 className="text-[11px] sm:text-xs font-black tracking-wider text-[#a3e635] uppercase">Tiendanube Evolución</h4>
                    
                    {/* Ring segment calculations */}
                    {(() => {
                      const nubePlanPerAmount = (tiendanubeBaseMXN / calcGmv) * rentabilidadBase;
                      const nubeGatewayPerAmount = (0.0329 * rentabilidadBase) + 3;
                      const nubeNetPerAmount = Math.max(0, rentabilidadBase - (nubePlanPerAmount + nubeGatewayPerAmount));

                      const nubeSegments: DonutSegment[] = [
                        { value: nubeNetPerAmount, color: "#84cc16", label: "Neto" },
                        { value: nubePlanPerAmount, color: "#475569", label: "Plan Tiendanube" },
                        { value: nubeGatewayPerAmount, color: "#3b82f6", label: "Gateway de Pago" },
                      ];

                      return (
                        <>
                          <Tooltip content="Esta métrica muestra que conservas un mayor porcentaje de cada venta al no pagar tarifas transaccionales en Tiendanube.">
                            <DonutRing
                              segments={nubeSegments}
                              centerText={`$${formatAbbreviatedAmount(nubeNetPerAmount)}`}
                              centerSubtext="te quedan"
                              size={isMobile ? 120 : (viewportHeight < 800 ? 140 : 180)}
                              strokeWidth={isMobile ? 12 : (viewportHeight < 800 ? 14 : 18)}
                              textClass="text-[#a3e635] animate-fade-in"
                            />
                          </Tooltip>
                          {/* Legend for Tiendanube */}
                          <AnimatePresence>
                            {showRentabilidadLegends && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.25 }}
                                className="space-y-1.5 text-left text-xs pt-4 w-full max-w-[260px] border-t border-border-theme/40 overflow-hidden"
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#84cc16]" />
                                    <span className="text-text-dim-theme text-[11px]">Neto (Te queda):</span>
                                  </div>
                                  <strong className="text-slate-200 font-mono text-[11px]">${formatAbbreviatedAmount(nubeNetPerAmount)}</strong>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#475569]" />
                                    <span className="text-text-dim-theme text-[11px]">Pago del Plan:</span>
                                  </div>
                                  <strong className="text-slate-200 font-mono text-[11px]">${formatAbbreviatedAmount(nubePlanPerAmount)}</strong>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
                                    <span className="text-text-dim-theme text-[11px]">Gateway (3.29%+$3):</span>
                                  </div>
                                  <strong className="text-slate-200 font-mono text-[11px]">${formatAbbreviatedAmount(nubeGatewayPerAmount)}</strong>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      );
                    })()}
                  </div>

                </div>

                {/* Toggle details button */}
                <div className="flex justify-center pt-2 w-full border-t border-border-theme/20">
                  <button
                    onClick={() => setShowRentabilidadLegends(prev => !prev)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-theme/60 hover:bg-surface-theme border border-border-theme/80 hover:border-accent-theme text-xs font-bold text-text-theme transition-all cursor-pointer shadow-md group"
                  >
                    {showRentabilidadLegends ? (
                      <>
                        <EyeOff className="w-4 h-4 text-accent-theme group-hover:scale-110 transition-transform" />
                        <span>Ocultar desglose de costos</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 text-accent-theme group-hover:scale-110 transition-transform" />
                        <span>Ver desglose de costos</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Legend callout bottom */}
              <div className="space-y-3 max-w-2xl mx-auto">
                <div className="p-4 bg-accent-theme/10 border border-accent-theme/15 rounded-xl text-center">
                  <span className="text-xs text-slate-300 font-semibold block">
                    💡 Para ajustar el volumen de venta mensual o configurar los costos específicos, regresa al slide anterior de la <button onClick={() => handleSlideChange(5)} className="text-accent-theme underline font-bold hover:text-accent-theme/80 cursor-pointer">Calculadora de Ahorro</button>.
                  </span>
                </div>
                <p className="text-[10px] text-text-dim-theme text-center italic leading-normal">
                  * Algunas tarifas pueden estar sujetas a cobro de impuestos según la plataforma o procesador de pago.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 7: RESUMEN */}
        {activeSlide === 7 && (
          <div data-slide-index="7" className="w-full max-w-5xl mx-auto space-y-3 md:space-y-4 py-2 my-auto">
            <div className="border-b border-border-theme pb-3 text-center">
              <span className="text-accent-theme text-[10px] md:text-xs font-black uppercase tracking-widest block mb-1">
                Panel Ejecutivo de Diagnóstico
              </span>
              <h2 className="text-lg md:text-2xl lg:text-3xl font-black text-white leading-tight">
                Consolidación de <span className="text-accent-theme">Resultados y Hallazgos</span>
              </h2>
              <p className="text-text-dim-theme text-[11px] md:text-xs leading-relaxed max-w-2xl mx-auto mt-1.5 line-clamp-3">
                Revisa de forma unificada el impacto total de las fugas identificadas, el retorno neto anualizado y la mejora en porcentaje de tu rendimiento comercial.
              </p>
            </div>

            {/* SLIDER CAROUSEL: COSTOS OCULTOS, AHORRO, RENDIMIENTO */}
            {(() => {
              const summaryCards = [
                {
                  id: 0,
                  title: "Costos Ocultos",
                  subtitle: "Pérdida identificada en Shopify",
                  icon: <AlertCircle className="w-4 h-4 text-red-theme animate-pulse" />,
                  iconBg: "bg-red-theme/10",
                  borderColor: "border-red-theme/20 hover:border-red-theme/40",
                  bgColor: "bg-red-theme/5 hover:bg-red-theme/10",
                  textColor: "text-red-theme",
                  badgeText: "⚠️ Fugas críticas: El cobro en dólares de las aplicaciones y la tasa forzada de transacción de Shopify merman directamente el margen comercial neto de cada venta.",
                  badgeColor: "bg-red-theme/10 text-red-theme border-red-theme/10",
                  content: (
                    <div className="space-y-2.5">
                      <p className="text-[11px] text-text-dim-theme leading-relaxed">
                        Estructura ineficiente de cobro recurrente en USD y comisiones transaccionales extras.
                      </p>

                      <div className="space-y-1.5 pt-1 border-t border-red-theme/10">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-text-dim-theme">Fugas Mayores:</span>
                          <strong className="text-slate-200">
                            <Tooltip content="Número de fugas críticas de dinero detectadas en la configuración y costos fijos/variables actuales de Shopify.">
                              {dynamicFugasCantidad} fugas
                            </Tooltip>
                          </strong>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-text-dim-theme">Impacto Mensual:</span>
                          <strong className="text-red-theme font-bold">
                            <Tooltip content="Impacto financiero de pérdida calculado en un rango mensual promedio según el uso de aplicaciones y ventas.">
                              ${dynamicFugasRangoMin.toLocaleString("es-MX", { maximumFractionDigits: 0 })} - ${dynamicFugasRangoMax.toLocaleString("es-MX", { maximumFractionDigits: 0 })} MXN
                            </Tooltip>
                          </strong>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-text-dim-theme">Aplicaciones Extra:</span>
                          <strong className="text-slate-200">
                            <Tooltip content="Cargos fijos mensuales de aplicaciones de Shopify, dolarizados y convertidos a tipo de cambio actual.">
                              ${convertedAppsCostMXN.toLocaleString("es-MX", { maximumFractionDigits: 0 })} MXN/mes
                            </Tooltip>
                          </strong>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-text-dim-theme">Comisión Transacción:</span>
                          <strong className="text-slate-200">
                            <Tooltip content="Comisión adicional (desde 0.5% hasta 2%) retenida por Shopify en transacciones que usen pasarelas externas.">
                              ${shopifyTransactionFeeMXN.toLocaleString("es-MX", { maximumFractionDigits: 0 })} MXN/mes
                            </Tooltip>
                          </strong>
                        </div>
                      </div>
                    </div>
                  )
                },
                {
                  id: 1,
                  title: "Ahorro Estimado",
                  subtitle: "Retorno neto con Tiendanube",
                  icon: <Zap className="w-4 h-4 text-green-theme" />,
                  iconBg: "bg-green-theme/10",
                  borderColor: "border-green-theme/20 hover:border-green-theme/40",
                  bgColor: "bg-green-theme/5 hover:bg-green-theme/10",
                  textColor: "text-green-theme",
                  badgeText: "📈 Deducción fiscal local: Al facturarse 100% de manera local y en pesos mexicanos, el costo del servicio es totalmente deducible de impuestos.",
                  badgeColor: "bg-green-theme/10 text-[#a3e635] border-green-theme/10",
                  content: (
                    <div className="space-y-2.5">
                      <p className="text-[11px] text-text-dim-theme leading-relaxed">
                        Eficiencia mediante tarifas locales en pesos mexicanos y el 0% de comisiones por transacciones.
                      </p>

                      <div className="space-y-1.5 pt-1 border-t border-green-theme/10">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-text-dim-theme">Ahorro Mensual:</span>
                          <strong className="text-green-theme font-bold">
                            <Tooltip content="Tu capital neto promedio recuperado mensualmente tras migrar de Shopify a Tiendanube.">
                              ${monthlySavingsMXN.toLocaleString("es-MX", { maximumFractionDigits: 0 })} MXN
                            </Tooltip>
                          </strong>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-text-dim-theme">Ahorro Anualizado:</span>
                          <strong className="text-[#a3e635] font-black">
                            <Tooltip content="Proyección de tu ahorro neto acumulado tras un año entero de operación optimizada en Tiendanube.">
                              ${yearlySavingsMXN.toLocaleString("es-MX", { maximumFractionDigits: 0 })} MXN
                            </Tooltip>
                          </strong>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-text-dim-theme">Costo Shopify:</span>
                          <strong className="text-slate-300 line-through">
                            <Tooltip content="Monto mensual consolidado que gastas actualmente operando en Shopify (Plan + Transacciones + Apps).">
                              ${totalShopifyMonthlyCostMXN.toLocaleString("es-MX", { maximumFractionDigits: 0 })} MXN/mes
                            </Tooltip>
                          </strong>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-text-dim-theme">Costo Tiendanube:</span>
                          <strong className="text-green-theme font-bold">
                            <Tooltip content="Monto total consolidado de tu costo mensual optimizado operando en Tiendanube (sin comisiones extras).">
                              ${totalTiendanubeMonthlyCostMXN.toLocaleString("es-MX", { maximumFractionDigits: 0 })} MXN/mes
                            </Tooltip>
                          </strong>
                        </div>
                      </div>
                    </div>
                  )
                },
                {
                  id: 2,
                  title: "Rendimiento",
                  subtitle: "Margen libre de comisiones",
                  icon: <TrendingUp className="w-4 h-4 text-indigo-400" />,
                  iconBg: "bg-indigo-500/10",
                  borderColor: "border-indigo-500/20 hover:border-indigo-500/40",
                  bgColor: "bg-indigo-500/5 hover:bg-indigo-500/10",
                  textColor: "text-indigo-400",
                  badgeText: "💡 Operación pesificada: Al no tener comisiones variables ni cobros sorpresa de aplicaciones, tu flujo de caja se estabiliza con un margen predecible.",
                  badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/10",
                  content: (
                    <div className="space-y-2.5">
                      <p className="text-[11px] text-text-dim-theme leading-relaxed">
                        Eficiencia neta por cada compra simulada de <strong className="text-indigo-400">${rentabilidadBase.toLocaleString()} MXN</strong> en tu tienda.
                      </p>

                      <div className="space-y-1.5 pt-1 border-t border-indigo-500/10">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-text-dim-theme">Retienes en Shopify:</span>
                          <strong className="text-slate-300">
                            <Tooltip content="La ganancia neta que conservas tras pagar las comisiones del plan, comisiones extras y cobros por app en Shopify.">
                              ${shopifyNetPerAmount.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                            </Tooltip>
                          </strong>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-text-dim-theme">Retienes en Tiendanube:</span>
                          <strong className="text-[#a3e635] font-bold">
                            <Tooltip content="La ganancia neta optimizada que conservas libre de comisiones variables y costos fijos sorpresa en Tiendanube.">
                              ${nubeNetPerAmount.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                            </Tooltip>
                          </strong>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-text-dim-theme">Margen Recuperado:</span>
                          <strong className="text-green-theme font-black">
                            <Tooltip content="Capital neto adicional rescatado de comisiones que regresa de forma directa a tu cuenta por cada compra.">
                              +${(nubeNetPerAmount - shopifyNetPerAmount).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                            </Tooltip>
                          </strong>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-text-dim-theme">Mejora de Eficiencia:</span>
                          <strong className="text-indigo-400 font-bold">
                            <Tooltip content="Porcentaje neto de incremento en tu rentabilidad operativa al procesar tus transacciones comerciales en Tiendanube.">
                              +{(((nubeNetPerAmount - shopifyNetPerAmount) / (shopifyNetPerAmount || 1)) * 100).toFixed(1)}%
                            </Tooltip>
                          </strong>
                        </div>
                      </div>
                    </div>
                  )
                }
              ];

              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 md:gap-4 w-full">
                  {summaryCards.map((card) => (
                    <div
                      key={card.id}
                      className={`p-3.5 md:p-4 rounded-xl border ${card.borderColor} ${card.bgColor} transition-all duration-300 flex flex-col justify-between space-y-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 ${card.iconBg} rounded-lg`}>
                              {card.icon}
                            </div>
                            <div>
                              <h3 className={`text-xs font-black ${card.textColor} uppercase tracking-wider`}>
                                {card.title}
                              </h3>
                              <p className="text-[9px] text-text-dim-theme">{card.subtitle}</p>
                            </div>
                          </div>
                        </div>

                        {card.content}
                      </div>

                      <div className={`p-2 bg-card-theme/50 rounded-lg text-[9px] leading-relaxed border ${card.badgeColor}`}>
                        {card.badgeText}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Quick Summary Insight Strip */}
            <div className="p-4 bg-accent-theme/10 border border-accent-theme/20 rounded-xl flex flex-col md:flex-row justify-between items-center gap-3">
              <div className="text-left">
                <span className="text-[10px] font-black uppercase text-accent-theme tracking-widest block">Veredicto Operativo</span>
                <p className="text-xs text-slate-200 mt-0.5">
                  La migración a <strong>Tiendanube Evolución</strong> optimiza tu rentabilidad al eliminar comisiones transaccionales de Shopify y centralizar la gestión de pagos nacionales sin costo de intermediación.
                </p>
              </div>
              <button 
                onClick={() => handleSlideChange(8)} 
                className="bg-accent-theme hover:bg-accent-theme/90 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm whitespace-nowrap cursor-pointer transition-all hover:scale-105 active:scale-95"
              >
                Ver Siguientes Pasos
              </button>
            </div>
          </div>
        )}

        {/* SLIDE 8: SIGUIENTES PASOS - FORMATO TIMELINE HORIZONTAL CON CALENDARIO A 15 DÍAS */}
        {activeSlide === 8 && (
          <div data-slide-index="8" className="w-full max-w-5xl mx-auto space-y-3 md:space-y-4 py-2 my-auto">
            <div className="border-b border-border-theme pb-2 text-center">
              <div className="inline-flex items-center gap-2 bg-accent-theme/10 border border-accent-theme/30 px-3 py-1 rounded-full mb-1.5 shadow-sm">
                <Calendar className="w-3.5 h-3.5 text-accent-theme animate-pulse" />
                <span className="text-accent-theme text-[10px] md:text-xs font-black uppercase tracking-widest">
                  Calendario de Ejecución a 15 Días
                </span>
              </div>
              <h2 className="text-lg md:text-2xl lg:text-3xl font-black text-white leading-tight">
                Ruta Crítica de <span className="text-accent-theme">Migración Controlada</span>
              </h2>
              <p className="text-text-dim-theme text-[11px] md:text-xs leading-relaxed max-w-2xl mx-auto mt-1 line-clamp-2">
                Plan de 15 días continuos por fases técnicas para migrar tu catálogo, clientes y diseño de forma segura sin interrumpir tus ventas activas.
              </p>
            </div>

            {/* 15-Day Visual Calendar Gantt Track */}
            <div className="hidden sm:block bg-card-theme/40 border border-border-theme/60 rounded-xl p-2.5 shadow-inner">
              <div className="flex items-center justify-between text-[10px] font-bold text-text-dim-theme mb-1.5 px-1">
                <span className="flex items-center gap-1 text-accent-theme font-black">
                  <Clock className="w-3 h-3" /> Cronograma de 15 Días (Día 1 ➔ Día 15)
                </span>
                <span className="text-[9px] text-slate-300">Total: 15 Días | 0% Downtime de Ventas</span>
              </div>

              {/* 15-Day Grid Bar */}
              <div className="grid grid-cols-15 gap-1 h-3.5 w-full bg-surface-theme/80 p-0.5 rounded-lg border border-border-theme/50">
                {/* Days 1-3: Fase 1 */}
                <div title="Fase 1: Respaldo (D1-D3)" className="col-span-3 bg-blue-500 rounded-sm flex items-center justify-center text-[8px] font-black text-white shadow-xs">
                  D1-D3
                </div>
                {/* Days 4-7: Fase 2 */}
                <div title="Fase 2: Rediseño (D4-D7)" className="col-span-4 bg-purple-500 rounded-sm flex items-center justify-center text-[8px] font-black text-white shadow-xs">
                  D4-D7
                </div>
                {/* Days 8-9: Fase 3 */}
                <div title="Fase 3: Pago Nube (D8-D9)" className="col-span-2 bg-emerald-500 rounded-sm flex items-center justify-center text-[8px] font-black text-white shadow-xs">
                  D8-D9
                </div>
                {/* Days 10-11: Fase 4 */}
                <div title="Fase 4: Logística (D10-D11)" className="col-span-2 bg-amber-500 rounded-sm flex items-center justify-center text-[8px] font-black text-white shadow-xs">
                  D10-D11
                </div>
                {/* Days 12-13: Fase 5 */}
                <div title="Fase 5: Go-Live (D12-D13)" className="col-span-2 bg-cyan-500 rounded-sm flex items-center justify-center text-[8px] font-black text-white shadow-xs">
                  D12-D13
                </div>
                {/* Days 14-15: Fase 6 */}
                <div title="Fase 6: Auditoría (D14-D15)" className="col-span-2 bg-indigo-500 rounded-sm flex items-center justify-center text-[8px] font-black text-white shadow-xs">
                  D14-D15
                </div>
              </div>
            </div>

            {/* Horizontal Timeline Container */}
            <div className="relative pt-1 pb-1">
              {/* Horizontal Connecting Line for Desktop */}
              <div className="hidden lg:block absolute top-[24px] left-[7%] right-[7%] h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 via-emerald-500 via-amber-500 via-cyan-500 to-indigo-500 rounded-full opacity-60 z-0"></div>

              {/* 6 Horizontal Timeline Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 md:gap-3 relative z-10">
                {[
                  {
                    step: "01",
                    badge: "Fase 1",
                    days: "Días 1 - 3",
                    duration: "3 Días",
                    title: "Respaldo Catálogo",
                    description: "Extracción estructurada de productos, clientes e historial.",
                    tag: "Productos & Clientes",
                    highlight: "Respaldo 100% Íntegro",
                    icon: Database,
                    color: "border-blue-500/40 bg-blue-500/10 text-blue-400",
                    nodeBg: "bg-blue-600 text-white ring-blue-400/40",
                  },
                  {
                    step: "02",
                    badge: "Fase 2",
                    days: "Días 4 - 7",
                    duration: "4 Días",
                    title: "Rediseño Visual",
                    description: "Adaptación de plantilla Tiendanube conservando marca.",
                    tag: "Plantilla & UX",
                    highlight: "Diseño Mobile-First",
                    icon: Palette,
                    color: "border-purple-500/40 bg-purple-500/10 text-purple-400",
                    nodeBg: "bg-purple-600 text-white ring-purple-400/40",
                  },
                  {
                    step: "03",
                    badge: "Fase 3",
                    days: "Días 8 - 9",
                    duration: "2 Días",
                    title: "Pago Nube & MSI",
                    description: "Pruebas de pasarela nativa con 0% comisiones y MSI.",
                    tag: "Pasarela 0%",
                    highlight: "0% Comisiones",
                    icon: CreditCard,
                    color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
                    nodeBg: "bg-emerald-600 text-white ring-emerald-400/40",
                  },
                  {
                    step: "04",
                    badge: "Fase 4",
                    days: "Días 10 - 11",
                    duration: "2 Días",
                    title: "Logística y Envíos",
                    description: "Pasarelas de envíos y operadores logísticos locales.",
                    tag: "Envíos Locales",
                    highlight: "Automatización",
                    icon: Truck,
                    color: "border-amber-500/40 bg-amber-500/10 text-amber-400",
                    nodeBg: "bg-amber-600 text-white ring-amber-400/40",
                  },
                  {
                    step: "05",
                    badge: "Fase 5",
                    days: "Días 12 - 13",
                    duration: "2 Días",
                    title: "Go-Live & SEO 301",
                    description: "Despliegue y redirecciones 301 para preservar SEO.",
                    tag: "SEO Orgánico",
                    highlight: "Redirecciones 301",
                    icon: Rocket,
                    color: "border-cyan-500/40 bg-cyan-500/10 text-cyan-400",
                    nodeBg: "bg-cyan-600 text-white ring-cyan-400/40",
                  },
                  {
                    step: "06",
                    badge: "Fase 6",
                    days: "Días 14 - 15",
                    duration: "2 Días",
                    title: "Auditoría Ahorros",
                    description: "Auditoría de ahorros en primer estado de cuenta.",
                    tag: "Auditoría ROI",
                    highlight: "Retorno Medible",
                    icon: CheckCircle2,
                    color: "border-indigo-500/40 bg-indigo-500/10 text-indigo-400",
                    nodeBg: "bg-indigo-600 text-white ring-indigo-400/40",
                  }
                ].map((item, idx) => {
                  const IconComponent = item.icon;

                  return (
                    <div 
                      key={idx} 
                      className="flex flex-col items-center text-center group relative"
                    >
                      {/* Timeline Node Badge on Top Horizontal Line */}
                      <div className="relative mb-2 flex items-center justify-center">
                        <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full ${item.nodeBg} flex items-center justify-center font-black text-xs shadow-lg ring-4 ring-background-theme transition-transform duration-300 group-hover:scale-110 z-10`}>
                          <IconComponent className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </div>
                        <span className="absolute -top-1 -right-1 bg-surface-theme text-white border border-border-theme font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow z-20">
                          {idx + 1}
                        </span>
                      </div>

                      {/* Horizontal Step Card */}
                      <div className="w-full p-2.5 md:p-3 rounded-xl border border-border-theme/70 bg-card-theme/40 hover:bg-card-theme/80 hover:border-accent-theme/60 transition-all duration-300 shadow-md hover:shadow-accent-theme/10 group-hover:-translate-y-1 flex flex-col justify-between h-full min-h-[185px]">
                        <div>
                          {/* Day Badge & Phase Badge */}
                          <div className="flex flex-col items-center gap-1 mb-1.5">
                            <span className="text-[9px] font-extrabold text-accent-theme bg-accent-theme/10 border border-accent-theme/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" /> {item.days}
                            </span>
                            <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${item.color}`}>
                              {item.badge} ({item.duration})
                            </span>
                          </div>

                          <h3 className="text-xs font-extrabold text-white group-hover:text-accent-theme transition-colors leading-tight mb-1">
                            {item.title}
                          </h3>

                          <p className="text-[10px] text-text-dim-theme leading-relaxed">
                            {item.description}
                          </p>
                        </div>

                        <div className="mt-2 pt-1.5 border-t border-border-theme/40 flex flex-col items-center gap-1">
                          <span className="text-[9px] font-bold text-slate-300 bg-surface-theme px-2 py-0.5 rounded-md border border-border-theme/50 w-full truncate text-center">
                            {item.tag}
                          </span>
                          <span className="text-[9px] font-bold text-accent-theme bg-accent-theme/10 px-2 py-0.5 rounded-md border border-accent-theme/20 w-full truncate text-center">
                            ✓ {item.highlight}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CTA Button to Contact Slide */}
            <div className="flex justify-center pt-1">
              <button
                onClick={() => handleSlideChange(9)}
                className="inline-flex items-center gap-2 bg-accent-theme hover:bg-accent-theme/90 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-lg shadow-accent-theme/20 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer text-xs md:text-sm group"
              >
                Quiero migrarme ya
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* SLIDE 9: CONTACTO */}
        {activeSlide === 9 && (
          <div data-slide-index="9" className="w-full max-w-5xl mx-auto text-center space-y-4 md:space-y-6 py-4 my-auto">
            <div className="space-y-2 max-w-2xl mx-auto border-b border-border-theme pb-3 text-center">
              <span className="text-accent-theme text-[10px] md:text-xs font-black uppercase tracking-widest block mb-1 animate-pulse">
                Listo para el Siguiente Nivel
              </span>
              <h2 className="text-lg md:text-2xl lg:text-4xl font-black tracking-tight text-white leading-tight">
                Coordinemos tu <span className="text-accent-theme">Migración Gratuita</span>
              </h2>
              <p className="text-text-dim-theme text-[11px] md:text-xs leading-relaxed max-w-2xl mx-auto mt-1.5 line-clamp-3">
                Ponte en contacto con nosotros para agendar una sesión de consultoría técnica sin costo. Planifica el cambio para {report.name} de forma segura y exitosa.
              </p>
            </div>

            {/* Contact Actions Row */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto pt-4">
              <a 
                href={`mailto:${report.contactEmail || config?.userEmail || config?.defaultContactEmail || "cesar.ayar19@gmail.com"}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-surface-theme hover:bg-surface-hover-theme border border-border-theme text-white font-bold px-6 py-3 rounded-xl shadow transition-all text-sm cursor-pointer"
              >
                <Mail className="w-4 h-4 text-accent-theme" /> Enviar Correo
              </a>

              <a 
                href={`https://wa.me/52${report.contactWhatsapp || config?.defaultContactWhatsapp || "5512345678"}?text=Hola,%20vi%20el%20reporte%20de%20diagnóstico%20de%20fugas%20de%20${encodeURIComponent(report.name)}%20y%20me%20gustaría%20agendar%20una%20reunión%20para%20hablar%20sobre%20Evolución%20Tiendanube.`}
                target="_blank" 
                rel="noreferrer"
                onClick={() => sendInteraction("whatsapp_click")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-black px-6 py-3 rounded-xl shadow-md transition-all text-sm cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" /> Contactar por WhatsApp
              </a>
            </div>

            {/* Apartado de Logo Section (Team Logo + Aliados con tamaño uniforme) */}
            {(() => {
              const teamLogo = report.team?.teamBrandLogo || report.team?.image;
              const allies = report.team?.allies || [];
              
              if (teamLogo || allies.length > 0) {
                return (
                  <div className="border-t border-border-theme/40 pt-8 max-w-3xl mx-auto">
                    <div className="flex justify-center items-center gap-6 flex-wrap">
                      {teamLogo && (
                        <div className="h-14 w-36 flex items-center justify-center p-2.5 rounded-xl border border-border-theme bg-surface-theme/90 shadow-md">
                          <img src={teamLogo} alt={report.team?.name || "Logo Equipo"} className="max-h-full max-w-full object-contain" />
                        </div>
                      )}
                      {allies.map(ally => (
                        <a key={ally.id} href={ally.url} target="_blank" rel="noreferrer" title={ally.name} className="h-14 w-36 flex items-center justify-center p-2.5 rounded-xl border border-border-theme bg-surface-theme/90 shadow-md hover:border-accent-theme/50 transition-all cursor-pointer">
                          <img src={ally.logo} alt={ally.name} className="max-h-full max-w-full object-contain" />
                        </a>
                      ))}
                    </div>
                  </div>
                );
              }

              const logos = [
                report.finalSlideMainLogo || report.adminLogos?.[0] || config?.adminLogoUrl,
                report.finalSlideLogo2 || report.adminLogos?.[1] || config?.adminLogo2Url,
                report.finalSlideLogo3 || report.adminLogos?.[2] || config?.adminLogo3Url,
              ].filter((l): l is string => Boolean(l && l.trim() !== "" && l.toLowerCase() !== "none"));

              if (logos.length > 0) {
                return (
                  <div className="border-t border-border-theme/40 pt-8 max-w-3xl mx-auto">
                    <div className="flex justify-center items-center gap-8 sm:gap-10 flex-wrap">
                      {logos.map((logoUrl, idx) => (
                        <div key={idx} className="relative group">
                          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-accent-theme to-indigo-500 opacity-25 blur-md group-hover:opacity-40 transition-all"></div>
                          <img 
                            src={logoUrl} 
                            alt={`Logo ${idx + 1}`} 
                            className="relative h-16 sm:h-20 md:h-24 max-w-[220px] sm:max-w-[260px] object-contain rounded-xl border border-border-theme bg-surface-theme/90 p-3 sm:p-4 shadow-lg transition-transform duration-200 hover:scale-105" 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <div className="border-t border-border-theme/40 pt-6 max-w-md mx-auto">
                  <div className="flex justify-center">
                    <span className="text-sm font-black uppercase tracking-wider text-slate-300">
                      {config?.adminTextUrl || "Evolución Diagnostics"}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* GLOBAL NAVIGATION FOOTER */}
      {!isShared && (
        <footer className="w-full shrink-0 border-t border-border-theme/40 bg-surface-theme/95 backdrop-blur-md py-4 px-6 md:px-8 flex items-center justify-between z-30 shadow-2xl">
          {/* Back Button */}
          <button
            disabled={activeSlide === 0}
            onClick={() => {
              if (activeSlide > 0) {
                handleSlideChange(prev => prev - 1);
              }
            }}
            className={`inline-flex items-center gap-2 font-bold text-xs px-4 py-2.5 rounded-xl border border-border-theme transition-all active:scale-95 cursor-pointer select-none ${
              activeSlide === 0
                ? "text-text-dim-theme/40 bg-surface-theme/20 border-border-theme/10 cursor-not-allowed"
                : "text-text-dim-theme hover:text-white bg-surface-theme hover:bg-surface-hover-theme hover:border-accent-theme/40"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Atrás</span>
          </button>

          {/* Center Section: Progress Dots and Keyboard Indicator */}
          <div className="hidden sm:flex flex-col lg:flex-row items-center gap-4">
            {/* Progress Dots */}
            <div className="flex items-center gap-2">
              {slides.map((slideName, index) => {
                const isActive = activeSlide === index;
                return (
                  <button
                    key={index}
                    onClick={() => handleSlideChange(index)}
                    title={slideName}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      isActive
                        ? "w-8 bg-accent-theme"
                        : "w-2.5 bg-text-dim-theme/30 hover:bg-text-dim-theme/60"
                    }`}
                  />
                );
              })}
            </div>
            
            {/* Keyboard Helper Indicator for Desktop */}
            <div className="hidden lg:flex items-center gap-2 bg-bg-theme/40 border border-border-theme/30 px-3 py-1 rounded-full text-[10px] text-text-dim-theme select-none transition-all duration-300 hover:border-accent-theme/30 animate-pulse">
              <div className="flex gap-0.5">
                <kbd className="flex items-center justify-center w-4 h-4 bg-surface-theme border border-border-theme rounded text-[8px] font-bold font-mono">▲</kbd>
                <kbd className="flex items-center justify-center w-4 h-4 bg-surface-theme border border-border-theme rounded text-[8px] font-bold font-mono">▼</kbd>
              </div>
              <span>Navegar secciones</span>
              <span className="opacity-30">|</span>
              <div className="flex gap-0.5">
                <kbd className="flex items-center justify-center w-4 h-4 bg-surface-theme border border-border-theme rounded text-[8px] font-bold font-mono">◀</kbd>
                <kbd className="flex items-center justify-center w-4 h-4 bg-surface-theme border border-border-theme rounded text-[8px] font-bold font-mono">▶</kbd>
              </div>
              <span>Mover sliders</span>
            </div>
          </div>

          {/* Compact Mobile Progress indicator */}
          <div className="sm:hidden text-xs font-bold text-text-dim-theme">
            {activeSlide + 1} / {slides.length}
          </div>

          {/* Next Button */}
          <button
            disabled={activeSlide === slides.length - 1}
            onClick={() => {
              if (activeSlide < slides.length - 1) {
                handleSlideChange(prev => prev + 1);
              }
            }}
            className={`inline-flex items-center gap-2 font-bold text-xs px-5 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer select-none ${
              activeSlide === slides.length - 1
                ? "text-text-dim-theme/40 bg-surface-theme/20 border-border-theme/10 cursor-not-allowed"
                : "bg-accent-theme hover:bg-accent-theme/90 text-white shadow-md shadow-accent-theme/20 hover:shadow-accent-theme/30"
            }`}
          >
            <span>Siguiente</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </footer>
      )}

      </div>
    </div>

    {/* 2. PRINT / PDF PRESENTATION (Landscape 10-slide deck output) */}
    {report && <ReportPrintPresentation report={report} />}

    {/* 3. MODAL DE ENVÍO DE CORREO SMTP */}
    {report && (
      <SendEmailModal
        isOpen={isSendEmailModalOpen}
        onClose={() => setIsSendEmailModalOpen(false)}
        reportId={report.id}
        storeName={report.name}
        defaultEmail={report.contactEmail}
      />
    )}

    {/* 4. MODAL DE COMPARTIDO EN DOMINIO PERSONALIZADO */}
    {report && isShareModalOpen && (
      <ShareReportModal
        report={report}
        config={globalConfig}
        onClose={() => setIsShareModalOpen(false)}
        onConfigUpdated={(updated) => setGlobalConfig(updated)}
      />
    )}
  </>
);
}
