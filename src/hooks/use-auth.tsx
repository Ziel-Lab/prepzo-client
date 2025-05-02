"use client";

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { SupabaseClient, Session } from '@supabase/supabase-js';
import { fetchWithCredentials } from '@/utils/fetchWithCredentials'; // Assuming this utility exists

// Define backend URL (make sure NEXT_PUBLIC_BACKEND_URL is set in your .env.local)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// Define the shape of the context data
interface AuthContextType {
  supabase: SupabaseClient;
  session: Session | null; // Still store Supabase session if available
  isAuthenticated: boolean; // Now based *only* on Flask check
  authMethod: 'password' | null; // Only 'password' or null, as it's the gatekeeper
  logout: () => Promise<void>;
  isLoading: boolean;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const supabase = createClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Primary auth state (Flask driven)
  const [authMethod, setAuthMethod] = useState<'password' | null>(null); // Only password matters for gating
  const [isLoading, setIsLoading] = useState(true);

  // This function now primarily checks Flask, but also stores Supabase session if found
  const updateAuthState = useCallback(async (currentSupabaseSession: Session | null) => {
    setIsLoading(true);
    console.log('useAuth: Updating auth state (Flask check priority)...');

    // Store Supabase session regardless of its impact on primary authentication
    setSession(currentSupabaseSession);
    if (currentSupabaseSession) {
      console.log('useAuth: Supabase session detected (but not used for primary auth): ', currentSupabaseSession.user.id);
    } else {
      console.log('useAuth: No Supabase session detected.');
    }

    // --- Always check Flask backend --- 
    console.log('useAuth: Checking Flask backend /api/check-auth...');
    let flaskAuthSuccess = false;
    try {
      const response = await fetchWithCredentials(`${BACKEND_URL}/api/check-auth`);
      if (response.ok) {
        const data = await response.json();
        console.log('useAuth: Flask check-auth response:', data);
        // Set primary authentication based ONLY on Flask response
        if (data.authenticated && data.password_recently_verified) {
          console.log('useAuth: Flask password session is valid. User IS authenticated.');
          flaskAuthSuccess = true;
        } else {
          console.log('useAuth: Flask password session is invalid or expired. User is NOT authenticated.');
        }
      } else {
        console.warn('useAuth: Flask check-auth request failed with status:', response.status, '. User is NOT authenticated.');
      }
    } catch (error) {
      console.error('useAuth: Error calling Flask check-auth:', error, '. User is NOT authenticated.');
    }

    // Update final state based on Flask check result
    setIsAuthenticated(flaskAuthSuccess);
    setAuthMethod(flaskAuthSuccess ? 'password' : null);
    setIsLoading(false);
    console.log(`useAuth: Final state -> isAuthenticated: ${flaskAuthSuccess}`);

  }, []); // No dependencies needed for this logic structure

  // Check initial state and subscribe to Supabase changes
  useEffect(() => {
    console.log('useAuth: Initializing auth state check.');
    // Get initial Supabase session, but updateAuthState decides primary auth
    supabase.auth.getSession().then(({ data: { session: initialSupabaseSession } }) => {
      updateAuthState(initialSupabaseSession); 
    });

    // Listen for Supabase changes to update the stored session, but primary auth still relies on Flask check rerun via updateAuthState
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSupabaseSession) => {
      console.log('useAuth: Supabase auth state changed, event:', _event);
      // Store the new Supabase session, but don't re-run the Flask check immediately unless needed.
      // The Flask check will run on next page load/refresh naturally.
      // Or, uncomment the line below if you WANT to re-validate Flask immediately on Supabase change:
      // updateAuthState(newSupabaseSession); 
      setSession(newSupabaseSession); // Just update the stored session
      console.log('useAuth: Updated stored Supabase session.');
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]); // updateAuthState is stable due to useCallback([])

  // Logout function
  const logout = useCallback(async () => {
    setIsLoading(true);
    console.log('useAuth: Logging out...');
    const { error: signOutError } = await supabase.auth.signOut(); 
    if (signOutError) {
        console.error("useAuth: Error logging out from Supabase:", signOutError);
    }
    try {
        console.log('useAuth: Attempting to clear Flask session via /api/logout');
        await fetchWithCredentials(`${BACKEND_URL}/api/logout`, { method: 'POST' });
    } catch (logoutError) {
        console.warn('useAuth: Failed to call Flask logout endpoint (might not exist):', logoutError);
    }
    // Explicitly update state to logged out immediately
    setIsAuthenticated(false);
    setAuthMethod(null);
    setSession(null); // Clear stored Supabase session
    setIsLoading(false); 
    console.log('useAuth: Logout complete, state reset.');
  }, [supabase]);

  const value = {
    supabase,
    session, // Supabase session is still available if needed
    isAuthenticated, // Based on Flask check
    authMethod, // Based on Flask check
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 