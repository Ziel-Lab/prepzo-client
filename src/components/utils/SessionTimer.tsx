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
  initialMinutes = 20, 
  onTimeUp,
  className 
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(initialMinutes * 60);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeUpCalledRef = useRef(false); // Prevent multiple calls

  useEffect(() => {
    if (secondsRemaining <= 0 && !timeUpCalledRef.current) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (onTimeUp) {
        console.log("Timer reached zero, calling onTimeUp.");
        onTimeUp();
        timeUpCalledRef.current = true; // Mark as called
      }
      return; // Stop further processing
    }

    // Start interval only if secondsRemaining > 0
    if (secondsRemaining > 0 && !intervalRef.current) {
       timeUpCalledRef.current = false; // Reset if timer restarts
       intervalRef.current = setInterval(() => {
         setSecondsRemaining(prev => prev - 1);
       }, 1000);
    }
    

    // Cleanup function to clear interval on unmount or dependency change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null; // Clear ref on cleanup
      }
    };
  }, [secondsRemaining, onTimeUp]); // Re-run effect if secondsRemaining or onTimeUp changes

  // Reset timer if initialMinutes changes (e.g., props update)
  useEffect(() => {
    setSecondsRemaining(initialMinutes * 60);
    timeUpCalledRef.current = false; // Reset time up flag on reset
     // Clear existing interval before potentially starting a new one
     if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
     }
     // Restart interval logic is handled by the main useEffect based on new secondsRemaining
  }, [initialMinutes]);


  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Determine text color based on time remaining
  const timeTextColor = secondsRemaining <= 60 ? 'text-red-500 animate-pulse' : 'text-foreground';

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-md shadow-sm",
      "bg-background/80 backdrop-blur-sm border border-border", // Semi-transparent background with blur
      className // Allow overriding styles
    )}>
      <TimerIcon className={cn("h-4 w-4", timeTextColor)} />
      <span className={cn("font-mono text-sm font-medium", timeTextColor)}>
        {formatTime(secondsRemaining)}
      </span>
    </div>
  );
};

export default SessionTimer; 