/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Componente UI de Tooltip con Renderizado mediante Portal React.
 * Muestra explicaciones emergentes al posar el cursor o enfocar elementos.
 */

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { HelpCircle } from "lucide-react";

/**
 * Propiedades del componente Tooltip.
 */
interface TooltipProps {
  /** Texto o contenido informativo a desplegar */
  content: string;
  /** Elemento hijo desencadenante del tooltip */
  children: React.ReactNode;
  /** Posición preferida del tooltip (top, bottom, left, right) */
  position?: "top" | "bottom" | "left" | "right";
  /** Si es verdadero, muestra un ícono de ayuda (?) junto al elemento */
  showIcon?: boolean;
}

/**
 * Componente flotante de tooltip con posicionamiento dinámico en viewport.
 */
export function Tooltip({ content, children, position = "top", showIcon = false }: TooltipProps) {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * Recalcula las coordenadas absolutas del tooltip respecto a la ventana y el elemento desencadenante.
   */
  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

      let top = 0;
      let left = 0;

      switch (position) {
        case "top":
          top = rect.top + scrollTop - 8;
          left = rect.left + scrollLeft + rect.width / 2;
          break;
        case "bottom":
          top = rect.bottom + scrollTop + 8;
          left = rect.left + scrollLeft + rect.width / 2;
          break;
        case "left":
          top = rect.top + scrollTop + rect.height / 2;
          left = rect.left + scrollLeft - 8;
          break;
        case "right":
          top = rect.top + scrollTop + rect.height / 2;
          left = rect.right + scrollLeft + 8;
          break;
      }

      setCoords({ top, left });
    }
  };

  useEffect(() => {
    if (show) {
      updateCoords();
      window.addEventListener("scroll", updateCoords, { passive: true });
      window.addEventListener("resize", updateCoords, { passive: true });
    }
    return () => {
      window.removeEventListener("scroll", updateCoords);
      window.removeEventListener("resize", updateCoords);
    };
  }, [show, position]);

  const positionClasses = {
    top: "-translate-x-1/2 -translate-y-full origin-bottom",
    bottom: "-translate-x-1/2 origin-top",
    left: "-translate-x-full -translate-y-1/2 origin-right",
    right: "-translate-y-1/2 origin-left",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-slate-950 border-x-transparent border-b-transparent mt-[-1px]",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-slate-950 border-x-transparent border-t-transparent mb-[-1px]",
    left: "left-full top-1/2 -translate-y-1/2 border-l-slate-950 border-y-transparent border-r-transparent ml-[-1px]",
    right: "right-full top-1/2 -translate-y-1/2 border-r-slate-950 border-y-transparent border-l-transparent mr-[-1px]",
  };

  return (
    <div
      ref={triggerRef}
      className="inline-flex items-center gap-1 cursor-help relative group"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      <span className="border-b border-dashed border-text-dim-theme/60 hover:border-accent-theme hover:text-accent-theme transition-colors">
        {children}
      </span>
      {showIcon && (
        <HelpCircle className="w-3.5 h-3.5 text-text-dim-theme/60 group-hover:text-accent-theme transition-colors shrink-0" />
      )}
      {mounted && show && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            style={{
              position: "absolute",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            }}
            className={`z-[99999] pointer-events-none w-64 p-3 text-xs bg-slate-950/98 backdrop-blur-md border border-border-theme/80 text-slate-200 rounded-xl shadow-2xl ${positionClasses[position]}`}
          >
            <div className="leading-relaxed font-sans">{content}</div>
            <div className={`absolute border-4 ${arrowClasses[position]}`} />
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
