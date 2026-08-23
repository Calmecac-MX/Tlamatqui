import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Copy,
  CheckSquare,
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  ChevronDown,
} from "lucide-react";
import {
  exportReportToCSV,
  exportReportToExcel,
  exportReportToMarkdown,
  exportReportToPrintPDF,
} from "../../lib/exporter";

interface ReportHeaderProps {
  report: any;
  currentSlide: number;
  totalSlides: number;
  isShared?: boolean;
  copied: boolean;
  onBackToAdmin: () => void;
  onCopyLink: () => void;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  report,
  currentSlide,
  totalSlides,
  isShared,
  copied,
  onBackToAdmin,
  onCopyLink,
}) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const progressPercent = ((currentSlide + 1) / totalSlides) * 100;

  // Cerrar menú al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExportPDF = async () => {
    setIsGeneratingPDF(true);
    setIsMenuOpen(false);
    try {
      await exportReportToPrintPDF(report);
    } catch (err) {
      console.error("Error al generar PDF:", err);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleExportExcel = async () => {
    setIsGeneratingExcel(true);
    setIsMenuOpen(false);
    try {
      await exportReportToExcel(report);
    } catch (err) {
      console.error("Error al generar Excel:", err);
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  const handleExportCSV = () => {
    setIsMenuOpen(false);
    exportReportToCSV(report);
  };

  const handleExportMarkdown = () => {
    setIsMenuOpen(false);
    exportReportToMarkdown(report);
  };

  return (
    <header className="border-b border-border-theme/40 bg-surface-theme/40 backdrop-blur-md px-6 py-3 sticky top-0 z-20 flex items-center justify-between no-print">
      <div className="flex items-center gap-4">
        {!isShared && (
          <button
            onClick={onBackToAdmin}
            className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg border border-border-theme bg-surface-theme hover:bg-surface-hover-theme text-text-dim-theme hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Panel</span>
          </button>
        )}
        <div className="flex items-center gap-3">
          {report.logo && (
            <img
              src={report.logo}
              alt={report.name}
              className="h-7 max-w-[120px] object-contain rounded bg-white/5 p-0.5 border border-border-theme"
            />
          )}
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{report.name}</span>
              <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-accent-theme/10 text-accent-theme border border-accent-theme/20">
                Auditoría Financiera
              </span>
            </h1>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Slide Progress Indicator */}
        <div className="hidden sm:flex items-center gap-2 mr-2">
          <div className="w-28 h-1.5 bg-bg-theme rounded-full overflow-hidden border border-border-theme">
            <div
              className="h-full bg-accent-theme transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[11px] font-bold text-text-dim-theme">
            {currentSlide + 1}/{totalSlides}
          </span>
        </div>

        {/* Dropdown Menu para Exportar Reporte */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            disabled={isGeneratingPDF || isGeneratingExcel}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-border-theme bg-surface-theme hover:bg-surface-hover-theme text-text-dim-theme hover:text-white transition-all cursor-pointer disabled:opacity-50"
            title="Exportar datos del reporte en múltiples formatos"
          >
            {isGeneratingPDF || isGeneratingExcel ? (
              <span className="w-3.5 h-3.5 border-2 border-accent-theme border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-green-theme" />
            )}
            <span>Exportar</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border-theme bg-surface-theme backdrop-blur-xl shadow-2xl z-50 p-1.5 flex flex-col gap-1 text-xs">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-text-dim-theme/70 border-b border-border-theme/40 mb-1">
                Formatos Disponibles
              </div>

              {/* Opción Excel (.xlsx) */}
              <button
                onClick={handleExportExcel}
                className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-left hover:bg-surface-hover-theme text-white font-medium transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>Hoja de Cálculo Excel</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  .xlsx
                </span>
              </button>

              {/* Opción CSV Estilizado (.csv) */}
              <button
                onClick={handleExportCSV}
                className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-left hover:bg-surface-hover-theme text-white font-medium transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-green-400 group-hover:scale-110 transition-transform" />
                  <span>Datos CSV Estilizado</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                  .csv
                </span>
              </button>

              {/* Opción Markdown (.md) */}
              <button
                onClick={handleExportMarkdown}
                className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-left hover:bg-surface-hover-theme text-white font-medium transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                  <span>Documento Markdown</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  .md
                </span>
              </button>

              <div className="my-1 border-t border-border-theme/40" />

              {/* Opción PDF Horizontal */}
              <button
                onClick={handleExportPDF}
                className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-left hover:bg-surface-hover-theme text-white font-medium transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-accent-theme group-hover:scale-110 transition-transform" />
                  <span>Presentación PDF</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent-theme/10 text-accent-theme border border-accent-theme/20">
                  .pdf
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Share Button */}
        <button
          onClick={onCopyLink}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
            copied
              ? "bg-green-theme/10 border-green-theme/30 text-green-theme"
              : "bg-surface-theme hover:bg-surface-hover-theme border-border-theme text-text-dim-theme hover:text-white"
          }`}
        >
          {copied ? <CheckSquare className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "Link Copiado" : "Compartir"}</span>
        </button>
      </div>
    </header>
  );
};
