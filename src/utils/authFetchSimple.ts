/**
 * Simple auth fetch utility - IMMEDIATE 401 FIX
 * Replace your existing fetch calls with this to stop 401 errors
 */
import { createClient } from '@/utils/supabase/client';

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const supabase = createClient();
  
  // Get fresh session (Supabase will auto-refresh if needed)
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session?.access_token) {
    throw new Error('Authentication required');
  }

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Enhanced auth fetch with retry logic
 */
export async function authFetchWithRetry(url: string, options: RequestInit = {}): Promise<Response> {
  const supabase = createClient();
  
  try {
    return await authFetch(url, options);
  } catch (error) {
    // If first attempt fails, try to refresh and retry once
    console.log('Auth fetch failed, attempting refresh and retry...');
    
    const { data, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !data.session?.access_token) {
      throw new Error('Authentication refresh failed');
    }
    
    // Retry with fresh token
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${data.session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
  }
}