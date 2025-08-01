"use client";

import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

/**
 * Automatically fixes auth issues by forcing token refresh
 * Add this component to your main layout to fix 401 errors
 */
export const AutoAuthFix: React.FC = () => {
  useEffect(() => {
    const fixAuth = async () => {
      try {
        const supabase = createClient();
        
        // Force refresh session immediately
        console.log('🔄 Auto-fixing auth...');
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
          console.error('Auto refresh failed:', error);
        } else {
          console.log('✅ Auto refresh successful');
        }
        
        // Set up aggressive auto-refresh
        const refreshInterval = setInterval(async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session && session.expires_at) {
              const expiresAt = session.expires_at * 1000;
              const timeLeft = expiresAt - Date.now();
              
              // Refresh if less than 30 minutes left
              if (timeLeft < 30 * 60 * 1000 && timeLeft > 0) {
                console.log('🔄 Aggressive auto-refresh triggered');
                await supabase.auth.refreshSession();
              }
            }
          } catch (error) {
            console.error('Aggressive refresh failed:', error);
          }
        }, 30 * 1000); // Check every 30 seconds
        
        return () => clearInterval(refreshInterval);
      } catch (error) {
        console.error('Auto-fix failed:', error);
      }
    };
    
    fixAuth();
  }, []);

  return null;
};

export default AutoAuthFix;