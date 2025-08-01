import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

/**
 * Manual pagination hook for loading data with Load More button
 * 
 * Usage examples:
 * const { sessions, loading, hasMore, loadMore } = useInfiniteScroll('/mockInterview/sessions');
 * const { sessions, loading, hasMore, loadMore } = useInfiniteScroll('/mockInterview/sessions/mobile');
 * 
 * Backend API calls:
 * - Initial: ${BACKEND_URL}/mockInterview/sessions?limit=10
 * - Next page: ${BACKEND_URL}/mockInterview/sessions?limit=10&cursor=${pagination.next_cursor}
 * 
 * Note: Uses process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL as base URL
 */

// Interface for session data
interface Session {
  id: string;
  title: string;
  position: string;
  company_name: string;
  interview_type: string;
  status: string;
  status_prep?: string;
  created_at: string;
  display_text: string;
  color_class: string;
  is_ready_to_join: boolean;
}

interface Pagination {
  has_more: boolean;
  next_cursor?: string;
  current_count: number;
  page_size: number;
}

interface UseInfiniteScrollReturn {
  sessions: Session[];
  loading: boolean;
  initialLoading: boolean;
  error: string | null;
  hasMore: boolean;
  refresh: () => void;
  loadMore: () => void;
}

export const useInfiniteScroll = (endpoint = '/mockInterview/sessions'): UseInfiniteScrollReturn => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  // Helper function to map backend status to display properties
  const mapSessionForDisplay = useCallback((backendSession: any): Session => {
    const getStatusDisplay = (status: string, statusPrep?: string) => {
      if (statusPrep === 'DONE') {
        return {
          display_text: 'Ready to Join',
          color_class: 'bg-green-100 text-green-800',
          is_ready_to_join: true
        };
      } else if (statusPrep === 'PENDING' || statusPrep === 'PROCESSING') {
        return {
          display_text: 'Preparing',
          color_class: 'bg-yellow-100 text-yellow-800',
          is_ready_to_join: false
        };
      } else if (status === 'completed') {
        return {
          display_text: 'Completed',
          color_class: 'bg-blue-100 text-blue-800',
          is_ready_to_join: false
        };
      } else {
        return {
          display_text: 'Draft',
          color_class: 'bg-gray-100 text-gray-800',
          is_ready_to_join: false
        };
      }
    };

    const statusDisplay = getStatusDisplay(backendSession.status, backendSession.status_prep);

    return {
      id: backendSession.id,
      title: backendSession.title || `${backendSession.interview_type || 'Behavioral'} Interview`,
      position: backendSession.position || 'Software Engineer',
      company_name: backendSession.company_name || 'Not specified',
      interview_type: backendSession.interview_type || 'behavioral',
      status: backendSession.status,
      status_prep: backendSession.status_prep,
      created_at: backendSession.created_at,
      ...statusDisplay
    };
  }, []);

  // Load initial sessions
  const loadInitialSessions = useCallback(async () => {
    try {
      setInitialLoading(true);
      setError(null);

      // Get user session for authentication
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session?.access_token) {
        setError('Authentication required');
        return;
      }

      // Get backend URL
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
      if (!backendUrl) {
        setError('Backend URL not configured');
        return;
      }

      const response = await fetch(`${backendUrl}${endpoint}?limit=10`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || 'Failed to load sessions');
      }

      const data = await response.json();
      const transformedSessions = (data.sessions || []).map(mapSessionForDisplay);
      
      setSessions(transformedSessions);
      
      // Handle both direct pagination fields and nested pagination object
      const paginationData = data.pagination || data;
      setPagination({
        has_more: paginationData.has_more || false,
        next_cursor: paginationData.next_cursor,
        current_count: transformedSessions.length,
        page_size: 10
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error loading sessions');
    } finally {
      setInitialLoading(false);
    }
  }, [endpoint, supabase, mapSessionForDisplay]);

  // Load more sessions (infinite scroll)
  const loadMoreSessions = useCallback(async () => {
    if (!pagination?.has_more || loading) return;
    
    try {
      setLoading(true);
      setError(null);

      // Get user session for authentication
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session?.access_token) {
        setError('Authentication required');
        return;
      }

      // Get backend URL
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
      if (!backendUrl) {
        setError('Backend URL not configured');
        return;
      }
      
      const url = `${backendUrl}${endpoint}?limit=10&cursor=${pagination.next_cursor}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || 'Failed to load more sessions');
      }

      const data = await response.json();
      const transformedSessions = (data.sessions || []).map(mapSessionForDisplay);
      
      setSessions(prev => [...prev, ...transformedSessions]); // Append new sessions
      
      // Handle both direct pagination fields and nested pagination object
      const paginationData = data.pagination || data;
      setPagination({
        has_more: paginationData.has_more || false,
        next_cursor: paginationData.next_cursor,
        current_count: transformedSessions.length,
        page_size: 10
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error loading more sessions');
    } finally {
      setLoading(false);
    }
  }, [endpoint, pagination, loading, supabase, mapSessionForDisplay]);

  // Removed scroll detection - using manual Load More button only

  // Load initial data on mount
  useEffect(() => {
    loadInitialSessions();
  }, []);

  return {
    sessions,
    loading,
    initialLoading,
    error,
    hasMore: pagination?.has_more || false,
    loadMore: loadMoreSessions,
    refresh: loadInitialSessions
  };
};
