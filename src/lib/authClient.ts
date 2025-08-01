/**
 * Production auth client for Supabase + Stateless Backend
 * Handles automatic token refresh and 401 retries
 */
import { createClient } from '@/utils/supabase/client';
import { authStateManager, withAuthOperationCheck, createSafeRefreshTimer } from '@/utils/authStateManager';

class AuthClient {
  private supabase = createClient();
  private refreshPromise: Promise<string> | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startBackgroundRefresh();
    this.setupVisibilityListener();
  }

  /**
   * Main API method - use this for all backend calls
   */
  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    return this.executeWithRetry(url, options, 0);
  }

  /**
   * Get valid token with automatic refresh
   */
  async getValidToken(): Promise<string> {
    if (authStateManager.shouldBlockAuthOperations()) {
      throw new AuthError('Auth operations blocked - logout in progress', 401);
    }
    
    const { data: { session } } = await this.supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new AuthError('No valid session found', 401);
    }

    // Check if token expires within 20 minutes
    if (session.expires_at) {
      const expiresAt = session.expires_at * 1000;
      const twentyMinutes = 20 * 60 * 1000;
      
      if (Date.now() > (expiresAt - twentyMinutes) && !authStateManager.shouldBlockAuthOperations()) {
        return this.refreshToken();
      }
    }

    return session.access_token;
  }

  /**
   * Execute request with automatic retry on 401
   */
  private async executeWithRetry(
    url: string, 
    options: RequestInit, 
    attempt: number
  ): Promise<Response> {
    const maxRetries = 1;

    try {
      const token = await this.getValidToken();
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Handle 401 with automatic retry
      if (response.status === 401 && attempt < maxRetries) {
        // Force refresh and retry
        await this.forceRefresh();
        return this.executeWithRetry(url, options, attempt + 1);
      }

      return response;
    } catch (error) {
      if (attempt < maxRetries) {
        return this.executeWithRetry(url, options, attempt + 1);
      }
      
      throw error;
    }
  }

  /**
   * Refresh token with deduplication
   */
  private async refreshToken(): Promise<string> {
    if (authStateManager.shouldBlockAuthOperations()) {
      throw new AuthError('Token refresh blocked - logout in progress', 401);
    }
    
    // Prevent multiple concurrent refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      const { data, error } = await this.supabase.auth.refreshSession();
      
      if (error || !data.session?.access_token) {
        throw new AuthError('Token refresh failed', 401);
      }
      
      // Wait 1 second for token to propagate to backend (only if not logging out)
      if (!authStateManager.shouldBlockAuthOperations()) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      return data.session.access_token;
    })();

    try {
      const token = await this.refreshPromise;
      return token;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Force refresh (used after 401 errors)
   */
  private async forceRefresh(): Promise<void> {
    this.refreshPromise = null; // Clear any pending refresh
    await this.refreshToken();
  }

  /**
   * Background refresh every 30 seconds
   */
  private startBackgroundRefresh() {
    const backgroundRefreshCallback = async () => {
      try {
        if (authStateManager.shouldBlockAuthOperations()) {
          return;
        }
        
        const { data: { session } } = await this.supabase.auth.getSession();
        
        if (session?.expires_at) {
          const expiresAt = session.expires_at * 1000;
          const now = Date.now();
          const timeLeft = expiresAt - now;
          
          // Refresh if less than 15 minutes left
          if (timeLeft < 15 * 60 * 1000 && timeLeft > 0) {
            await this.refreshToken();
          }
        }
      } catch (error) {
        // Silent fail for background refresh
      }
      
      // Schedule next refresh using safe timer
      this.refreshTimer = createSafeRefreshTimer(backgroundRefreshCallback, 30 * 1000);
    };
    
    this.refreshTimer = createSafeRefreshTimer(backgroundRefreshCallback, 30 * 1000);
  }

  /**
   * Refresh when tab becomes visible
   */
  private setupVisibilityListener() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', async () => {
        if (!document.hidden) {
          try {
            const { data: { session } } = await this.supabase.auth.getSession();
            if (session) {
              await this.getValidToken(); // This will refresh if needed
            }
          } catch (error) {
            // Silent fail for visibility refresh
          }
        }
      });
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}

class AuthError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = 'AuthError';
  }
}

// Global singleton instance
export const authClient = new AuthClient();

// Convenience export for direct use
export const authFetch = authClient.fetch.bind(authClient);

// React hook for auth client
export function useAuthClient() {
  return authClient;
}