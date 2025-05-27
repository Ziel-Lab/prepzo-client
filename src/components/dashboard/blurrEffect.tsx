"use client";

import React from 'react';
import { Lock } from 'lucide-react';

interface BlurOverlayProps {
  message?: string;
  ctaText?: string;
  onCtaClick?: () => void;
}

const BlurOverlay: React.FC<BlurOverlayProps> = ({ 
  message = "We are building this feature for you. Please check back soon!",
  ctaText = "Thank you for your patience!",
  onCtaClick 
}) => {
  return (
    <div 
      className="absolute top-16 left-0 right-0 bottom-0 z-40 flex flex-col items-center justify-center bg-background/20 backdrop-blur-sm p-8 text-center"
      aria-hidden="true" 
    >
      <Lock className="h-16 w-16 text-primary mb-6 opacity-80" />
      
      <h3 className="text-2xl font-semibold text-foreground mb-3">
        Content Locked
      </h3>
      
      <p className="text-lg text-muted-foreground max-w-md mb-6">
        {message}
      </p>
      
      {onCtaClick && ctaText && (
        <button 
          onClick={onCtaClick}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold shadow-lg hover:bg-primary/90 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          {ctaText}
        </button>
      )}
    </div>
  );
};

export default BlurOverlay;
