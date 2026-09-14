/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Componente unificado y resiliente para visualización de logotipos de herramientas y tecnologías.
 * Gestiona múltiples capas de fallback reactivas para evitar cuadros negros o imágenes rotas.
 */

import React, { useState, useEffect } from "react";
import { resolveTechnologyLogo } from "../lib/scrapper";

export interface ToolLogoProps {
  name: string;
  logo?: string;
  url?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export const ToolLogo: React.FC<ToolLogoProps> = ({
  name,
  logo,
  url,
  size = "sm",
  className = ""
}) => {
  const [currentSrc, setCurrentSrc] = useState<string | null>(() => {
    if (logo && logo.trim().length > 0) return logo.trim();
    return resolveTechnologyLogo(name, url);
  });
  const [hasError, setHasError] = useState<boolean>(false);
  const [triedFallback, setTriedFallback] = useState<boolean>(false);

  useEffect(() => {
    setHasError(false);
    setTriedFallback(false);
    if (logo && logo.trim().length > 0) {
      setCurrentSrc(logo.trim());
    } else {
      setCurrentSrc(resolveTechnologyLogo(name, url));
    }
  }, [logo, name, url]);

  const sizeClasses = {
    xs: "w-5 h-5 text-[9px]",
    sm: "w-7 h-7 text-[11px]",
    md: "w-9 h-9 text-xs",
    lg: "w-10 h-10 text-sm"
  }[size];

  const initialLetter = (name || "T").trim().charAt(0).toUpperCase() || "T";

  const handleError = () => {
    if (!triedFallback) {
      setTriedFallback(true);
      const fallbackUrl = resolveTechnologyLogo(name, url);
      if (fallbackUrl && fallbackUrl !== currentSrc) {
        setCurrentSrc(fallbackUrl);
        return;
      }
    }
    setHasError(true);
  };

  if (hasError || !currentSrc) {
    return (
      <div 
        className={`${sizeClasses} rounded-lg bg-surface-theme border border-border-theme flex items-center justify-center font-bold text-accent-theme shrink-0 shadow-sm ${className}`}
        title={name}
      >
        {initialLetter}
      </div>
    );
  }

  return (
    <div className={`${sizeClasses} rounded-lg bg-surface-theme border border-border-theme flex items-center justify-center overflow-hidden p-0.5 shrink-0 shadow-sm ${className}`}>
      <img
        src={currentSrc}
        alt={name}
        className="w-full h-full object-contain"
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
};
