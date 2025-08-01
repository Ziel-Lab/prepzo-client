"use client";

import { createClient } from '@/utils/supabase/client';
import { clearAnalyticsUserId } from '@/utils/analytics';

/**
 * Comprehensive session cleanup utility
 * Handles all aspects of logout to prevent zombie sessions that cause re-signup issues
 */
export async function performCompleteLogout(): Promise<void> {
  try {
    // 1. Clear analytics first
    clearAnalyticsUserId();
    
    // 2. Clear all auth-related localStorage items
    const authKeys = [
      'sb-supabase-auth-token',
      'supabase.auth.token', 
      'signup_source',
      'is_new_user',
      'auth_attempts',
      'last_auth_check',
      'auth_refresh_token',
      'supabase_session'
    ];
    
    authKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // Silent fail for localStorage errors
      }
    });
    
    // 3. Clear sessionStorage
    try {
      const sessionKeys = Object.keys(sessionStorage).filter(key => 
        key.includes('supabase') || key.includes('auth') || key.includes('session')
      );
      sessionKeys.forEach(key => sessionStorage.removeItem(key));
    } catch (e) {
      // Silent fail for sessionStorage errors
    }
    
    // 4. Sign out from Supabase
    const supabase = createClient();
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    
    if (error) {
      throw error;
    }
    
    // 5. Clear any IndexedDB Supabase data
    try {
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        // Check if databases() method is available (not supported in all browsers)
        if (typeof indexedDB.databases === 'function') {
          const databases = await indexedDB.databases();
          const supabaseDbs = databases.filter(db => 
            db.name?.includes('supabase') || db.name?.includes('auth')
          );
          
          for (const db of supabaseDbs) {
            if (db.name) {
              try {
                const deleteRequest = indexedDB.deleteDatabase(db.name);
                await new Promise<void>((resolve, reject) => {
                  deleteRequest.onsuccess = () => resolve();
                  deleteRequest.onerror = () => reject(deleteRequest.error);
                  deleteRequest.onblocked = () => resolve(); // Continue even if blocked
                });
              } catch (dbError) {
                // Silent fail for IndexedDB errors
              }
            }
          }
        } else {
          // Fallback: try to delete common Supabase database names
          const commonDbNames = ['supabase-js', 'supabase-auth-token'];
          for (const dbName of commonDbNames) {
            try {
              const deleteRequest = indexedDB.deleteDatabase(dbName);
              await new Promise<void>((resolve) => {
                deleteRequest.onsuccess = () => resolve();
                deleteRequest.onerror = () => resolve(); // Continue even on error
                deleteRequest.onblocked = () => resolve();
                // Add timeout to prevent hanging
                setTimeout(() => resolve(), 1000);
              });
            } catch (e) {
              // Silently continue
            }
          }
        }
      }
    } catch (e) {
      // Silent fail for IndexedDB errors
    }
    
    // 6. Clear any cookies (client-side accessible ones)
    try {
      if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(';');
        cookies.forEach(cookie => {
          const [name] = cookie.split('=');
          if (name && name.trim() && (name.trim().includes('supabase') || name.trim().includes('auth'))) {
            const cookieName = name.trim();
            // Clear for current domain and path
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
            // Clear for current domain and all paths
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
            // Clear for parent domain (in case of subdomain)
            const hostParts = window.location.hostname.split('.');
            if (hostParts.length > 2) {
              const parentDomain = '.' + hostParts.slice(-2).join('.');
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${parentDomain}`;
            }
          }
        });
      }
    } catch (e) {
      // Silent fail for cookie clearing errors
    }
    
    // 7. Clear any global auth variables
    if (typeof window !== 'undefined') {
      (window as any).supabaseSession = null;
      (window as any).authToken = null;
    }
    
  } catch (error) {
    throw error;
  }
}

/**
 * Emergency session reset - more aggressive cleanup for stuck sessions
 */
export async function emergencySessionReset(): Promise<void> {
  try {
    // Perform complete logout first
    await performCompleteLogout();
    
    // Additional aggressive cleanup
    if (typeof window !== 'undefined') {
      // Clear ALL localStorage
      try {
        localStorage.clear();
      } catch (e) {
        // Silent fail
      }
      
      // Clear ALL sessionStorage
      try {
        sessionStorage.clear();
      } catch (e) {
        // Silent fail
      }
      
      // Force page reload to ensure clean state
      setTimeout(() => {
        window.location.href = '/auth/login?reset=true';
      }, 100);
    }
    
  } catch (error) {
    // As last resort, force redirect
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login?emergency=true';
    }
  }
}

/**
 * Check for zombie sessions that might cause re-signup issues
 */
export function detectZombieSession(): boolean {
  try {
    if (typeof window === 'undefined') {
      return false;
    }
    
    const hasLocalAuth = localStorage.getItem('sb-supabase-auth-token') !== null;
    const hasSessionAuth = sessionStorage.getItem('supabase.auth.token') !== null;
    const hasSignupSource = localStorage.getItem('signup_source') !== null;
    
    // If we have auth tokens but no clear session, it might be a zombie
    const isZombie = (hasLocalAuth || hasSessionAuth) && hasSignupSource;
    
    return isZombie;
    
  } catch (error) {
    return false;
  }
}