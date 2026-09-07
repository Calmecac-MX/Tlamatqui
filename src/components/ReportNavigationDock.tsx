import React, { useState } from "react";
import { 
  ChevronUp, ChevronDown, ArrowUp, ArrowDown, 
  Layers, Compass, Check, HelpCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ReportNavigationDockProps {
  activeSlide: number;
  totalSlides: number;
  slides: string[];
  onSlideChange: (targetSlide: number | ((prev: number) => number)) => void;
  isShared?: boolean;
}

export default function ReportNavigationDock({
  activeSlide,
  totalSlides,
  slides,
  onSlideChange,
  isShared = false
}: ReportNavigationDockProps) {
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showKeyHelp, setShowKeyHelp] = useState(false);

  const canGoUp = activeSlide > 0;
  const canGoDown = activeSlide < totalSlides - 1;

  return (
    <>
      {/* Floating Vertical Navigation Dock (Right Edge) */}
      <div className="fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-2 pointer-events-auto">
        <div className="bg-surface-theme/90 backdrop-blur-md border border-border-theme/80 p-1.5 rounded-2xl shadow-2xl flex flex-col items-center gap-1.5 transition-all">
          {/* Up Navigation Button */}
          <button
            type="button"
            disabled={!canGoUp}
            onClick={() => onSlideChange(prev => Math.max(0, prev - 1))}
            title="Slide Anterior (Flecha Arriba ↑ / PageUp)"
            aria-label="Slide anterior"
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              canGoUp
                ? "bg-bg-theme/80 text-text-dim-theme hover:text-white hover:bg-accent-theme hover:shadow-lg hover:shadow-accent-theme/30 active:scale-95 border border-border-theme/60"
                : "text-text-dim-theme/20 bg-transparent cursor-not-allowed border border-transparent"
            }`}
          >
            <ChevronUp className="w-5 h-5" />
          </button>

          {/* Current Slide Indicator / Quick Navigator Trigger */}
          <button
            type="button"
            onClick={() => setShowQuickMenu(!showQuickMenu)}
            title="Ver índice de diapositivas"
            className="px-2 py-1.5 rounded-xl bg-accent-theme/10 hover:bg-accent-theme/20 border border-accent-theme/30 text-accent-theme font-black text-[10px] sm:text-xs tracking-wider flex flex-col items-center justify-center transition-all cursor-pointer select-none"
          >
            <span className="leading-none">{activeSlide + 1}</span>
            <span className="text-[8px] opacity-60 leading-none mt-0.5">/{totalSlides}</span>
          </button>

          {/* Down Navigation Button */}
          <button
            type="button"
            disabled={!canGoDown}
            onClick={() => onSlideChange(prev => Math.min(totalSlides - 1, prev + 1))}
            title="Siguiente Slide (Flecha Abajo ↓ / PageDown / Espacio)"
            aria-label="Siguiente slide"
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              canGoDown
                ? "bg-accent-theme text-white hover:bg-accent-theme/90 hover:shadow-lg hover:shadow-accent-theme/40 active:scale-95 border border-accent-theme/60 animate-pulse"
                : "text-text-dim-theme/20 bg-transparent cursor-not-allowed border border-transparent"
            }`}
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Floating Keyboard Hint Badge */}
        <div 
          onMouseEnter={() => setShowKeyHelp(true)}
          onMouseLeave={() => setShowKeyHelp(false)}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-theme/80 backdrop-blur-md border border-border-theme/60 text-[10px] text-text-dim-theme shadow-md select-none transition-all hover:border-accent-theme/50"
        >
          <div className="flex items-center gap-0.5 font-mono font-extrabold text-[9px] text-accent-theme">
            <kbd className="px-1 py-0.2 rounded bg-bg-theme border border-border-theme">↑</kbd>
            <kbd className="px-1 py-0.2 rounded bg-bg-theme border border-border-theme">↓</kbd>
          </div>
          <span className="text-[9px]">Navegar</span>
        </div>
      </div>

      {/* Quick Jump Slide Drawer / Modal Overlay */}
      <AnimatePresence>
        {showQuickMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: 20 }}
            className="fixed right-16 sm:right-20 top-1/2 -translate-y-1/2 z-50 w-72 bg-surface-theme/95 backdrop-blur-md border border-border-theme rounded-2xl shadow-2xl p-3.5 space-y-2"
          >
            <div className="flex items-center justify-between border-b border-border-theme/40 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Compass className="w-4 h-4 text-accent-theme" />
                <span>Índice del Reporte</span>
              </div>
              <span className="text-[10px] text-text-dim-theme font-semibold">
                {activeSlide + 1} de {totalSlides}
              </span>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-1 pr-1">
              {slides.map((title, idx) => {
                const isActive = activeSlide === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      onSlideChange(idx);
                      setShowQuickMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                      isActive
                        ? "bg-accent-theme text-white font-bold shadow-sm"
                        : "text-text-dim-theme hover:text-white hover:bg-bg-theme"
                    }`}
                  >
                    <span className="truncate pr-2">
                      <strong className="text-[10px] opacity-60 mr-1.5">{idx + 1}.</strong>
                      {title}
                    </span>
                    {isActive && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
