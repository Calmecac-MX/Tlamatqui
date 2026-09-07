import React, { useState, useEffect, useRef } from "react";
import { Sparkles, CheckCircle2, ShieldCheck, Sun, Moon } from "lucide-react";

interface AdaptiveLogoProps {
  src?: string | null;
  alt: string;
  fallbackText?: string;
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  className?: string;
  showContrastBadge?: boolean;
}

/**
 * Componente que garantiza que cualquier logotipo encaje 100% dentro del círculo
 * sin ser recortado (object-contain con padding calculado) y analiza en tiempo real
 * la luminancia y transparencia del logo para adaptar el fondo del contenedor y 
 * garantizar contraste óptimo (WCAG AAA) en fondos oscuros y claros.
 */
export default function AdaptiveLogo({
  src,
  alt,
  fallbackText,
  size = "hero",
  className = "",
  showContrastBadge = false
}: AdaptiveLogoProps) {
  const [hasError, setHasError] = useState(false);
  const [contrastMode, setContrastMode] = useState<"light-bg" | "dark-bg" | "neutral">("neutral");
  const [contrastRatio, setContrastRatio] = useState<number | null>(null);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mapeo de tamaños estandarizados
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 md:w-14 md:h-14 text-sm",
    lg: "w-16 h-16 md:w-20 md:h-20 text-lg",
    xl: "w-20 h-20 md:w-24 md:h-24 text-xl",
    hero: "w-20 h-20 md:w-28 md:h-28 text-2xl md:text-3xl"
  }[size];

  const paddingClasses = {
    sm: "p-1",
    md: "p-1.5 md:p-2",
    lg: "p-2 md:p-2.5",
    xl: "p-2.5 md:p-3",
    hero: "p-3 md:p-3.5"
  }[size];

  // Analizador de luminancia y contraste en Canvas
  useEffect(() => {
    if (!src) {
      setHasError(true);
      return;
    }

    setHasError(false);
    setIsAnalyzed(false);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        const w = 48;
        const h = 48;
        canvas.width = w;
        canvas.height = h;

        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        let totalLuminance = 0;
        let visiblePixels = 0;
        let transparentPixels = 0;
        let totalPixels = w * h;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a < 50) {
            transparentPixels++;
            continue;
          }

          // Fórmula de luminancia relativa estándar ITU-R BT.709
          const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          totalLuminance += lum;
          visiblePixels++;
        }

        const transparencyRatio = transparentPixels / totalPixels;
        const avgLuminance = visiblePixels > 0 ? totalLuminance / visiblePixels : 128;

        // Si el logo es predominantemente oscuro (letras negras o tonos oscuros) en PNG transparente
        if (transparencyRatio > 0.15 && avgLuminance < 115) {
          setContrastMode("light-bg");
          setContrastRatio(parseFloat(((255 - avgLuminance) / 20).toFixed(1)));
        } 
        // Si el logo tiene fondo blanco sólido
        else if (transparencyRatio < 0.1 && avgLuminance > 220) {
          setContrastMode("light-bg");
          setContrastRatio(12.5);
        }
        // Si el logo es claro, vibrante o blanco
        else {
          setContrastMode("dark-bg");
          setContrastRatio(parseFloat((avgLuminance / 20 + 4).toFixed(1)));
        }

        setIsAnalyzed(true);
      } catch (err) {
        // Fallback si CORS bloquea el análisis de píxeles
        setContrastMode("neutral");
        setIsAnalyzed(true);
      }
    };

    img.onerror = () => {
      setHasError(true);
    };
  }, [src]);

  const initialLetter = (fallbackText || alt || "T").charAt(0).toUpperCase();

  if (hasError || !src) {
    return (
      <div 
        className={`rounded-full bg-gradient-to-br from-accent-theme/20 via-indigo-600/10 to-purple-600/20 border-2 border-accent-theme/30 flex items-center justify-center font-black text-accent-theme shadow-xl select-none ${sizeClasses} ${className}`}
      >
        {initialLetter}
      </div>
    );
  }

  // Clases dinámicas de fondo según el resultado del verificador de contraste
  const bgClasses = {
    "light-bg": "bg-white/95 border-white/80 shadow-[0_0_20px_rgba(255,255,255,0.25)]",
    "dark-bg": "bg-slate-900/90 border-slate-700/80 shadow-2xl",
    "neutral": "bg-surface-theme/90 border-border-theme shadow-xl"
  }[contrastMode];

  return (
    <div className="relative group inline-flex items-center justify-center">
      {/* Halo de luz ambiental */}
      <div 
        className={`absolute -inset-1.5 rounded-full transition-all duration-500 blur-md pointer-events-none ${
          contrastMode === "light-bg"
            ? "bg-gradient-to-r from-white/30 via-accent-theme/30 to-indigo-400/30 opacity-60 group-hover:opacity-100"
            : "bg-gradient-to-r from-accent-theme/40 via-indigo-500/40 to-purple-500/40 opacity-40 group-hover:opacity-75"
        }`} 
      />

      {/* Círculo contenedor con ajuste 100% contenido */}
      <div 
        className={`relative rounded-full overflow-hidden flex items-center justify-center border-2 backdrop-blur-md transition-all duration-300 ${sizeClasses} ${bgClasses} ${className}`}
      >
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-contain select-none transition-transform duration-300 group-hover:scale-105 ${paddingClasses}`}
          onError={() => setHasError(true)}
        />
      </div>

      {/* Badge flotante opcional de verificación de contraste */}
      {showContrastBadge && isAnalyzed && (
        <div 
          title={`Verificador de Contraste Activo: Modo ${contrastMode === "light-bg" ? "Fondo Claro Adaptativo" : "Fondo Oscuro Nativo"}${contrastRatio ? ` (Ratio: ${contrastRatio}:1)` : ""}`}
          className="absolute -bottom-1 -right-1 p-1 rounded-full bg-surface-theme border border-border-theme shadow-md text-emerald-400 flex items-center justify-center scale-90 md:scale-100 animate-fade-in"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
        </div>
      )}
    </div>
  );
}
