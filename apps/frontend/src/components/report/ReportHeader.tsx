import React, { useState } from "react";
import { ArrowLeft, Copy, CheckSquare, Download, Printer } from "lucide-react";
import { exportReportToCSV, exportReportToPrintPDF } from "../../lib/exporter";

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
  const progressPercent = ((currentSlide + 1) / totalSlides) * 100;

  const handleExportPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await exportReportToPrintPDF(report);
    } catch (err) {
      console.error("Error al generar PDF:", err);
    } finally {
      setIsGeneratingPDF(false);
    }
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

        {/* CSV Export Button */}
        <button
          onClick={() => exportReportToCSV(report)}
          className="hidden md:flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-border-theme bg-surface-theme hover:bg-surface-hover-theme text-text-dim-theme hover:text-white transition-all cursor-pointer"
          title="Exportar datos a CSV / Excel"
        >
          <Download className="w-3.5 h-3.5 text-green-theme" />
          <span>CSV</span>
        </button>

        {/* Print / PDF Button */}
        <button
          onClick={handleExportPDF}
          disabled={isGeneratingPDF}
          className="hidden md:flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-border-theme bg-surface-theme hover:bg-surface-hover-theme text-text-dim-theme hover:text-white transition-all cursor-pointer disabled:opacity-50"
          title="Generar y Descargar Presentación PDF Horizontal (Landscape 16:9)"
        >
          {isGeneratingPDF ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-accent-theme border-t-transparent rounded-full animate-spin" />
              <span>Generando PDF...</span>
            </>
          ) : (
            <>
              <Printer className="w-3.5 h-3.5 text-accent-theme" />
              <span>PDF Horizontal</span>
            </>
          )}
        </button>

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
