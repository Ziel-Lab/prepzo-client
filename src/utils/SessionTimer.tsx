"use client";

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { TimerIcon } from 'lucide-react';

interface SessionTimerProps {
  initialMinutes?: number;
  onTimeUp?: () => void;
  className?: string;
}

const SessionTimer: React.FC<SessionTimerProps> = ({ 
  initialMinutes = 15, 
  onTimeUp,
  className 
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(initialMinutes * 60);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeUpCalledRef = useRef(false);

  // Start timer immediately when component mounts
  useEffect(() => {
    console.log("SessionTimer mounted, starting countdown");
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Start new interval
    intervalRef.current = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          if (onTimeUp && !timeUpCalledRef.current) {
            console.log("Timer reached zero, calling onTimeUp");
            onTimeUp();
            timeUpCalledRef.current = true;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [onTimeUp]); // Only re-run if onTimeUp changes

  // Reset timer if initialMinutes changes
  useEffect(() => {
    setSecondsRemaining(initialMinutes * 60);
    timeUpCalledRef.current = false;
  }, [initialMinutes]);

  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const timeTextColor = secondsRemaining <= 60 ? 'text-red-500 animate-pulse' : 'text-foreground';

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-md shadow-sm",
      "bg-background/80 backdrop-blur-sm border border-border",
      className
    )}>
      <TimerIcon className={cn("h-4 w-4", timeTextColor)} />
      <span className={cn("font-mono text-sm font-medium", timeTextColor)}>
        {formatTime(secondsRemaining)}
      </span>
    </div>
  );
};

export default SessionTimer; 