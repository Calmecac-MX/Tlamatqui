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

function normalizeLogoUrl(name: string, logo?: string, url?: string): string {
  if (logo && logo.trim().length > 0) {
    let trimmed = logo.trim();
    if (trimmed.includes("chismografo.rifatela.lol/api/icon")) {
      trimmed = trimmed.replace("https://chismografo.rifatela.lol/api/icon", "/api/icon");
      if (!trimmed.includes("provider=")) {
        trimmed += "&provider=local";
      }
    }
    return trimmed;
  }
  return resolveTechnologyLogo(name, url);
}

export const ToolLogo: React.FC<ToolLogoProps> = ({
  name,
  logo,
  url,
  size = "sm",
  className = ""
}) => {
  const [currentSrc, setCurrentSrc] = useState<string | null>(() => {
    return normalizeLogoUrl(name, logo, url);
  });
  const [hasError, setHasError] = useState<boolean>(false);
  const [step, setStep] = useState<number>(0);

  useEffect(() => {
    setHasError(false);
    setStep(0);
    setCurrentSrc(normalizeLogoUrl(name, logo, url));
  }, [logo, name, url]);

  const sizeClasses = {
    xs: "w-5 h-5 text-[9px]",
    sm: "w-7 h-7 text-[11px]",
    md: "w-9 h-9 text-xs",
    lg: "w-10 h-10 text-sm"
  }[size];

  const initialLetter = (name || "T").trim().charAt(0).toUpperCase() || "T";

  const handleError = () => {
    const cleanName = (name || "").toLowerCase().trim();
    const domainMatch = cleanName.includes(".") ? cleanName.split("/")[0].split(" ")[0] : undefined;
    const urlDomain = url ? url.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0].split("?")[0] : undefined;
    const bestDomain = domainMatch || urlDomain || cleanName;

    if (step === 0) {
      setStep(1);
      // Intentar proxy local con provider=local
      const proxyUrl = `/api/icon?id=${encodeURIComponent(bestDomain)}&provider=local&collection=apps`;
      if (proxyUrl !== currentSrc) {
        setCurrentSrc(proxyUrl);
        return;
      }
    }
    
    if (step <= 1 && bestDomain && bestDomain.includes(".")) {
      setStep(2);
      // Intentar icon.horse directo
      const horseUrl = `https://icon.horse/icon/${encodeURIComponent(bestDomain)}`;
      if (horseUrl !== currentSrc) {
        setCurrentSrc(horseUrl);
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
