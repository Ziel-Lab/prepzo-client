/**
 * Production-ready auth fetch utility with automatic JWT refresh and 401 handling
 */
import { createClient } from '@/utils/supabase/client';

interface AuthFetchOptions extends RequestInit {
  skipAuth?: boolean;
  maxRetries?: number;
}

export class AuthError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Fetch with automatic JWT refresh and retry logic
 */
export async function authFetch(
  url: string, 
  options: AuthFetchOptions = {}
): Promise<Response> {
  const { skipAuth = false, maxRetries = 1, ...fetchOptions } = options;
  const supabase = createClient();

  async function makeRequest(attemptNumber: number): Promise<Response> {
    let headers = { ...fetchOptions.headers } as Record<string, string>;

    if (!skipAuth) {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new AuthError('Authentication session error', 401);
      }

      if (!session?.access_token) {
        throw new AuthError('No valid session found', 401);
      }

      // Check if token is about to expire (refresh if less than 5 minutes remaining)
      const expiresAt = session.expires_at || 0;
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = expiresAt - now;

      if (expiresAt > 0 && timeUntilExpiry < 300) {
        const { data: { session: refreshedSession }, error: refreshError } = 
          await supabase.auth.refreshSession();
        
        if (refreshError || !refreshedSession) {
          throw new AuthError('Token refresh failed', 401);
        }

        headers['Authorization'] = `Bearer ${refreshedSession.access_token}`;
      } else {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers
    });

    // Handle 401 errors with retry logic
    if (response.status === 401 && !skipAuth && attemptNumber < maxRetries) {
      // Force refresh the session
      const { data: { session: refreshedSession }, error: refreshError } = 
        await supabase.auth.refreshSession();
      
      if (refreshError || !refreshedSession) {
        throw new AuthError('Authentication failed after retry', 401);
      }

      // Retry with new token
      return makeRequest(attemptNumber + 1);
    }

    return response;
  }

  return makeRequest(0);
}

/**
 * Enhanced fetchWithCredentials that includes auth refresh
 */
export async function fetchWithCredentialsAndAuth(
  input: RequestInfo | URL,
  init?: AuthFetchOptions
): Promise<Response> {
  let url: string;
  let options: AuthFetchOptions;
  
  if (typeof input === 'string') {
    url = input;
    options = init || {};
  } else if (input instanceof URL) {
    url = input.toString();
    options = init || {};
  } else {
    // input is Request object
    url = input.url;
    options = { ...init, ...input };
  }
  
  return authFetch(url, {
    ...options,
    credentials: 'include' as RequestCredentials,
  });
}