"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { WhiteLabelConfig, getWhiteLabelConfig } from '@/config/white-label';

interface WhiteLabelContextType {
  config: WhiteLabelConfig;
  isWhiteLabel: boolean;
  updateConfig: (newConfig: Partial<WhiteLabelConfig>) => void;
}

const WhiteLabelContext = createContext<WhiteLabelContextType | undefined>(undefined);

export function WhiteLabelProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<WhiteLabelConfig>(getWhiteLabelConfig());
  const [isWhiteLabel, setIsWhiteLabel] = useState(false);

  useEffect(() => {
    const currentConfig = getWhiteLabelConfig();
    setConfig(currentConfig);
    setIsWhiteLabel(currentConfig.partnerId !== 'prepzo');
    
    // Apply dynamic CSS variables for theming
    applyTheme(currentConfig);
  }, []);

  const applyTheme = (config: WhiteLabelConfig) => {
    const root = document.documentElement;
    
    // Convert hex colors to HSL for CSS variables
    const primaryHsl = hexToHsl(config.primaryColor);
    const secondaryHsl = hexToHsl(config.secondaryColor);
    
    root.style.setProperty('--primary', `${primaryHsl.h} ${primaryHsl.s}% ${primaryHsl.l}%`);
    root.style.setProperty('--primary-foreground', '0 0% 98%');
    root.style.setProperty('--secondary', `${secondaryHsl.h} ${secondaryHsl.s}% ${secondaryHsl.l}%`);
    root.style.setProperty('--secondary-foreground', '0 0% 98%');
    
    // Update favicon
    if (config.brandFavicon) {
      updateFavicon(config.brandFavicon);
    }
  };

  const updateFavicon = (faviconUrl: string) => {
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (link) {
      link.href = faviconUrl;
    } else {
      const newLink = document.createElement('link');
      newLink.rel = 'icon';
      newLink.href = faviconUrl;
      document.head.appendChild(newLink);
    }
  };

  const updateConfig = (newConfig: Partial<WhiteLabelConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    applyTheme(updatedConfig);
  };

  return (
    <WhiteLabelContext.Provider value={{ config, isWhiteLabel, updateConfig }}>
      {children}
    </WhiteLabelContext.Provider>
  );
}

export function useWhiteLabel() {
  const context = useContext(WhiteLabelContext);
  if (context === undefined) {
    throw new Error('useWhiteLabel must be used within a WhiteLabelProvider');
  }
  return context;
}

// Helper function to convert hex to HSL
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse hex values
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}
