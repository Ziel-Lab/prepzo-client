"use client";

import React, { useEffect, useRef } from 'react';

interface AnimatedOrbProps {
  isSpeaking: boolean;
  size?: 'small' | 'medium' | 'large';
}

const AnimatedOrb: React.FC<AnimatedOrbProps> = ({ isSpeaking, size = 'medium' }) => {
  const orbRef = useRef<HTMLDivElement>(null);
  
  // Size configurations
  const sizeConfig = {
    small: { container: 'w-24 h-24', orb: 'w-20 h-20' },
    medium: { container: 'w-40 h-40', orb: 'w-36 h-36' },
    large: { container: 'w-80 h-80', orb: 'w-80 h-80' }
  };

  useEffect(() => {
    const orb = orbRef.current;
    if (!orb) return;

    let animationId: number;
    let startTime = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      
      // Create smooth green color transitions
      const hue1 = (120 + Math.sin(elapsed * 0.3) * 30) % 360; // Green to teal range
      const hue2 = (160 + Math.cos(elapsed * 0.4) * 40) % 360; // Teal to cyan range  
      const hue3 = (80 + Math.sin(elapsed * 0.5) * 20) % 360;  // Lime range
      
      // Voice-reactive intensity
      const voiceIntensity = isSpeaking ? 0.7 + Math.sin(elapsed * 8) * 0.3 : 0.5;
      const scale = isSpeaking ? 1 + Math.sin(elapsed * 6) * 0.05 : 1;
      
      // Apply gradient and transform
      orb.style.background = `
        radial-gradient(circle at 30% 20%, hsla(${hue1}, 70%, 85%, ${voiceIntensity}) 0%, transparent 60%),
        radial-gradient(circle at 70% 80%, hsla(${hue2}, 60%, 80%, ${voiceIntensity * 0.8}) 0%, transparent 60%),
        radial-gradient(circle at 50% 50%, hsla(${hue3}, 80%, 90%, ${voiceIntensity * 0.6}) 0%, transparent 70%),
        linear-gradient(135deg, 
          hsla(${hue1}, 50%, 88%, 0.8) 0%, 
          hsla(${hue2}, 45%, 85%, 0.7) 50%, 
          hsla(${hue3}, 60%, 92%, 0.6) 100%
        )
      `;
      
      orb.style.transform = `scale(${scale})`;
      
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isSpeaking]);

  return (
    <div 
      className={`relative ${sizeConfig[size].container}`}
      style={{ 
        transform: 'translateZ(0)', // Force hardware acceleration
        willChange: 'transform' // Optimize for animations
      }}
    >
      {/* Main Orb */}
      <div
        ref={orbRef}
        className={`${sizeConfig[size].orb} rounded-full shadow-2xl shadow-green-200/50 transition-all duration-300 ease-out relative overflow-hidden`}
        style={{
          background: `
            radial-gradient(circle at 30% 20%, hsla(120, 70%, 85%, 0.7) 0%, transparent 60%),
            radial-gradient(circle at 70% 80%, hsla(160, 60%, 80%, 0.6) 0%, transparent 60%),
            radial-gradient(circle at 50% 50%, hsla(80, 80%, 90%, 0.5) 0%, transparent 70%),
            linear-gradient(135deg, 
              hsla(120, 50%, 88%, 0.8) 0%, 
              hsla(160, 45%, 85%, 0.7) 50%, 
              hsla(80, 60%, 92%, 0.6) 100%
            )
          `,
          transform: 'translateZ(0)', // Force hardware acceleration for smooth animations
          willChange: 'transform' // Optimize for transform changes
        }}
      >
        {/* Animated ripples for voice response */}
        {isSpeaking && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping" 
                 style={{ animationDuration: '2s' }} />
            <div className="absolute inset-4 rounded-full border border-white/20 animate-ping" 
                 style={{ animationDuration: '1.5s', animationDelay: '0.5s' }} />
            <div className="absolute inset-8 rounded-full border border-white/10 animate-ping" 
                 style={{ animationDuration: '1s', animationDelay: '1s' }} />
          </>
        )}
        
        {/* Inner glow effect */}
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-white/20 via-transparent to-transparent" />
        
        {/* Highlight spot */}
        <div className="absolute top-16 left-20 w-24 h-24 bg-white/30 rounded-full blur-2xl" />
      </div>
      
      {/* Outer glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-200/20 via-emerald-200/15 to-lime-200/10 blur-3xl -z-10 scale-110" />
    </div>
  );
};

export default AnimatedOrb;