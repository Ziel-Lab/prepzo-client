"use client";

import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { clearAuthCache } from '@/utils/clearAuthCache';

/**
 * Force auth refresh component - add this to immediately fix stale token issues
 * This component automatically refreshes auth on mount and clears stale cache
 */
export const ForceAuthRefresh: React.FC = () => {
  useEffect(() => {
    const forceRefresh = async () => {
      try {
        console.log('🔄 Forcing auth refresh...');
        
        // Clear any cached stale tokens
        clearAuthCache();
        
        const supabase = createClient();
        
        // Force refresh session
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
          console.error('Force refresh failed:', error);
          // If refresh fails, sign out and force re-login
          await supabase.auth.signOut();
          window.location.href = '/auth/login';
        } else {
          console.log('✅ Auth refreshed successfully');
          
          // Reload page to apply new session
          window.location.reload();
        }
      } catch (error) {
        console.error('Force refresh error:', error);
      }
    };

    forceRefresh();
  }, []);

  return null; // This component doesn't render anything
};

// Auto-execute version for immediate use
export const executeForceAuthRefresh = async () => {
  console.log('🚨 Emergency auth refresh...');
  
  clearAuthCache();
  
  const supabase = createClient();
  const { data, error } = await supabase.auth.refreshSession();
  
  if (error) {
    console.error('Emergency refresh failed:', error);
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  } else {
    console.log('✅ Emergency refresh successful');
    window.location.reload();
  }
};

// Global function for browser console
if (typeof window !== 'undefined') {
  (window as any).fixAuth = executeForceAuthRefresh;
  console.log('🚨 Use fixAuth() in console to immediately fix auth issues');
}