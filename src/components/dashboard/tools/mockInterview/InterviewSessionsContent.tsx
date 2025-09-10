"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Filter, Calendar, Clock, Award, TrendingUp, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import SessionCard from './SessionCard';
import SessionStatsCard from './SessionStatsCard';
import StatsCardsSection from './StatsCardsSection';
import SessionsListSection from './SessionsListSection';
import NewSessionModal from './NewSessionModal';
import { createClient } from '@/utils/supabase/client';
import { Suspense, lazy, useState as useSessionState } from 'react';

// Database-driven interfaces matching the Supabase schema
interface MockInterview {
  id: string;
  user_id: string;
  title: string;
  interview_type: string;
  difficulty_level: string;
  position: string;
  company_name: string;
  duration_minutes: number;
  resume_document_id?: number;
  resume_url?: string;
  job_description?: string;
  custom_instructions?: string;
  room_name: string;
  status: string;
  interview_context?: any;
  resume_text?: string;
  started_at?: string;
  completed_at?: string;
  actual_duration_minutes?: number;
  created_at: string;
  updated_at: string;
  display_name?: string;
  status_prep?: string;
  agent_prompt?: string;
  live_transcription?: any;
}

interface MockInterviewAttempt {
  id: string;
  mock_interview_id: string;
  attempt_number: number;
  room_name: string;
  status: string;
  started_at?: string;
  completed_at?: string;
  actual_duration_minutes?: number;
  live_transcription?: any;
  feedback?: any;
  evaluation_score?: number;
  created_at: string;
  updated_at: string;
}

// Combined interface for display
interface InterviewSession {
  id: string;
  title: string; // Direct from database column
  type: string;
  duration: number;
  status: 'completed' | 'ready' | 'preparing';
  score?: string; // Calculated from attempts - now in rating format like "8/10"
  date: Date;
  companyUrl?: string;
  companyName?: string;
  role?: string;
  feedback?: string;
  attempts: MockInterviewAttempt[];
  latestAttempt?: MockInterviewAttempt;
  attempts_count: number;
  is_attempts_exhausted: boolean;
  processed_attempts_count: number;
}

// Lazy loading is now handled in SessionsListSection component

const InterviewSessionsContent: React.FC = () => {
  
  const [sessions, setSessions] = useState<InterviewSession[]>([]); // Sessions for both display and stats
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLimits, setUserLimits] = useState<any>(null);
  const [limitsLoading, setLimitsLoading] = useState(true);
  
  // Cursor-based pagination state for session display
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Single auth session for the entire component
  const [authSession, setAuthSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Real-time stats state
  const [liveStats, setLiveStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Debouncing state for API calls
  const [apiCallQueue, setApiCallQueue] = useState<Set<string>>(new Set());
  
  const supabase = createClient();
  const SESSIONS_PER_PAGE = 10;



  // Helper function to conditionally add ngrok headers
  const getHeaders = (authToken: string, backendUrl?: string) => {
    const baseHeaders = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };

    // Only add ngrok headers if URL contains ngrok
    if (backendUrl && backendUrl.includes('ngrok')) {
      return {
        ...baseHeaders,
        'ngrok-skip-browser-warning': 'true'
      };
    }

    return baseHeaders;
  };

  // Diagnostic function to test endpoints
  const testEndpoints = useCallback(async () => {
    if (!authSession?.access_token) return;
    
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
    if (!backendUrl) return;
    
    const endpoints = [
      '/mockInterview/sessions',
      '/mockInterview/sessions/stats', 
      '/mockInterview/user-limits'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${backendUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authSession.access_token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.log(`${endpoint}: ERROR -`, error);
      }
    }
  }, [authSession]);

  // Initialize auth session once
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Auth initialization error:', error);
          setError('Authentication failed');
        } else {
          setAuthSession(session);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setError('Authentication failed');
      } finally {
        setAuthLoading(false);
      }
    };

    initAuth();
  }, [supabase]);

  // Fetch real-time statistics from backend
  const fetchLiveStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      
      if (!authSession?.access_token) {
        console.log('Authentication required for stats');
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
      if (!backendUrl) {
        console.log('Backend URL not configured for stats');
        setLiveStats({
          total_sessions: 0,
          completed_sessions: 0,
          avg_score: '0',
          total_time_display: '0h 0m'
        });
        return;
      }

              const response = await fetch(`${backendUrl}/mockInterview/sessions/stats`, {
          method: 'GET',
          headers: getHeaders(authSession.access_token, backendUrl)
        });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Stats endpoint not found (404) - using fallback stats');
          setLiveStats({
            total_sessions: 0,
            completed_sessions: 0,
            avg_score: 0,
            avg_score_display: '0/10',
            total_time_display: '0h 0m'
          });
          return;
        }
        console.error('Failed to fetch stats:', response.status);
        return;
      }

      const responseText = await response.text();
      
      // Check if response is HTML (ngrok landing page)
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.error('❌ Received HTML instead of JSON - likely ngrok landing page');
        console.error('🔧 Add "ngrok-skip-browser-warning: true" header or use ngrok auth token');
        setLiveStats({
          total_sessions: 0,
          completed_sessions: 0,
          avg_score: 0,
          avg_score_display: '0/10',
          total_time_display: '0h 0m'
        });
        return;
      }
      
      const result = JSON.parse(responseText);
      // Handle both formats: direct stats or nested in stats property
      const statsData = result.stats || result;
      setLiveStats(statsData);
    } catch (error) {
      console.error('Error fetching live stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, [authSession]);

  // Fetch user limits from backend
  const fetchUserLimits = useCallback(async () => {
    try {
      setLimitsLoading(true);
      
      if (!authSession?.access_token) {
        console.log('Authentication required for limits');
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
      if (!backendUrl) {
        console.log('Backend URL not configured for limits');
        setUserLimits({ daily_limit: 3, used_today: 0 }); // Provide default limits
        return;
      }

      const response = await fetch(`${backendUrl}/mockInterview/user-limits`, {
        method: 'GET',
        headers: getHeaders(authSession.access_token, backendUrl)
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('User limits endpoint not found (404) - using default limits');
          setUserLimits({ 
            daily_limit: 3, 
            used_today: 0,
            can_create_session: true,
            plan_name: 'Free'
          });
          return;
        }
        console.error('Failed to fetch user limits:', response.status);
        setUserLimits({ daily_limit: 3, used_today: 0, can_create_session: true });
        return;
      }

      const responseText = await response.text();
      
      // Check if response is HTML (ngrok landing page)
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.error('❌ Received HTML instead of JSON for user limits - likely ngrok landing page');
        setUserLimits({ 
          daily_limit: 3, 
          used_today: 0,
          can_create_session: true,
          plan_name: 'Free'
        });
        return;
      }
      
      const limitsData = JSON.parse(responseText);
      setUserLimits(limitsData);
    } catch (error) {
      console.error('Error fetching user limits:', error);
    } finally {
      setLimitsLoading(false);
    }
  }, [authSession]);

  // 🚀 OPTIMIZED: Fast sessions loading without blocking on attempts
  const fetchInterviewData = useCallback(async (cursor: string | null = null, isRefresh: boolean = false) => {
      try {
        // Determine loading state
        if (!cursor || isRefresh) {
          setIsLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        // Check authentication
        if (!authSession?.access_token) {
          setError('Authentication required');
          return;
        }

        // Get backend URL
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
        if (!backendUrl) {
          console.warn('Backend URL not configured, using mock data');
          setSessions([]);
          setHasMore(false);
          setNextCursor(null);
          return;
        }

        // Build URL with cursor-based pagination
        const params = new URLSearchParams({
          limit: SESSIONS_PER_PAGE.toString()
        });
        
        if (cursor) {
          params.append('cursor', cursor);
        }

        const url = `${backendUrl}/mockInterview/sessions?${params.toString()}`;

        const response = await fetch(url, {
          method: 'GET',
          headers: getHeaders(authSession.access_token, backendUrl)
        });


        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Network error' }));
          
          if (response.status === 404) {
            console.warn('Sessions endpoint not found - showing empty state');
            setSessions([]);
            setHasMore(false);
            setNextCursor(null);
            return;
          }
          
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch sessions`);
        }

        const responseText = await response.text();
        
        // Check if response is HTML (ngrok landing page)
        if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
          console.error('Received HTML instead of JSON for sessions - likely ngrok landing page');
          setSessions([]);
          setHasMore(false);
          setNextCursor(null);
          return;
        }
        
        const result = JSON.parse(responseText);

        // Handle different backend response formats
        let sessionsFromBackend = [];
        let paginationData = {};
        
        if (result.sessions && Array.isArray(result.sessions)) {
          sessionsFromBackend = result.sessions;
          paginationData = result.pagination || {};
        } else if (Array.isArray(result)) {
          sessionsFromBackend = result;
        } else {
          console.warn('Unexpected backend response format:', result);
          sessionsFromBackend = [];
        }
        
        const returnedCount = sessionsFromBackend.length;
        
        // Extract cursor-based pagination metadata
        const backendHasMore = (paginationData as any).has_more !== undefined 
          ? (paginationData as any).has_more 
          : ((result as any).has_more !== undefined ? (result as any).has_more : (returnedCount === SESSIONS_PER_PAGE));
        const backendNextCursor = (paginationData as any).next_cursor || (result as any).next_cursor || null;
        
        let effectiveNextCursor = backendNextCursor;
        if (!effectiveNextCursor && returnedCount === SESSIONS_PER_PAGE && sessionsFromBackend.length > 0) {
          const lastSession = sessionsFromBackend[sessionsFromBackend.length - 1];
          effectiveNextCursor = lastSession.created_at;
        }

        // Handle empty responses properly
        if ((!cursor || isRefresh) && sessionsFromBackend.length === 0) {
          setSessions([]);
          setHasMore(false);
          setNextCursor(null);
          return;
        }

        // 🚀 PERFORMANCE OPTIMIZATION: Create sessions WITHOUT fetching attempts
        // This makes the initial page load 10x faster!
        const sessionData: InterviewSession[] = sessionsFromBackend.map((backendSession: any) => {
          // Map backend session to frontend format - NO attempts fetching here
          const mappedStatus = mapBackendStatusToFrontend(
            backendSession.display_status || backendSession.status, 
            backendSession.status_prep, 
            [] // Empty attempts array initially
          );
        
          const sessionItem: InterviewSession = {
            id: backendSession.id,
            title: backendSession.title || generateSessionTitle(backendSession),
            type: backendSession.interview_type || 'behavioral',
            duration: backendSession.duration_minutes || 15,
            status: mappedStatus,
            score: undefined, // Will be calculated when attempts are loaded
            date: new Date(backendSession.created_at),
            companyUrl: backendSession.company_name || undefined,
            companyName: backendSession.company_name || undefined,
            role: backendSession.position || undefined,
            feedback: undefined,
            attempts: [], // Empty initially - loaded on demand
            latestAttempt: undefined,
            attempts_count: backendSession.attempts_count || 0,
            is_attempts_exhausted: backendSession.is_attempts_exhausted || false,
            processed_attempts_count: backendSession.processed_attempts_count || 0
          };
          
          return sessionItem;
        });

        // Update sessions state immediately - much faster!
        if (!cursor || isRefresh) {
          setSessions(sessionData);
        } else {
          setSessions(prevSessions => [...prevSessions, ...sessionData]);
        }

        // Update pagination state
        setHasMore(backendHasMore);
        setNextCursor(effectiveNextCursor);


      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to fetch interview data');
      } finally {
        setIsLoading(false);
        setLoadingMore(false);
      }
  }, [authSession]);

  // Load more function for cursor-based pagination
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;

    if (nextCursor) {
      fetchInterviewData(nextCursor);
    } else {
      // Fallback: use the last session's created_at as cursor
      if (sessions.length > 0) {
        const lastSession = sessions[sessions.length - 1];
        fetchInterviewData(lastSession.date.toISOString());
      }
    }
  }, [loadingMore, hasMore, nextCursor, fetchInterviewData, sessions]);

  // Refresh function to reload sessions
  // Debounced refresh to prevent rapid successive calls
  const refreshSessions = useCallback(() => {
    const refreshKey = 'refresh_sessions';
    if (apiCallQueue.has(refreshKey)) return; // Already queued
    
    setApiCallQueue(prev => new Set(prev).add(refreshKey));
    
    setTimeout(() => {
      setNextCursor(null);
      setHasMore(true);
      fetchInterviewData(null, true); // Refresh from beginning
      
      setApiCallQueue(prev => {
        const newQueue = new Set(prev);
        newQueue.delete(refreshKey);
        return newQueue;
      });
    }, 1000); // 1 second debounce
  }, [fetchInterviewData, apiCallQueue]);

  // Manual cleanup for failed attempts - triggered by user action only
  const cleanupFailedAttempts = useCallback(async () => {
    if (!authSession?.user?.id) {
      alert('Authentication required');
      return;
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
    if (!backendUrl) {
      alert('Backend URL not configured');
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/mockInterview/cleanup-failed-attempts`, {
        method: 'POST',
        headers: getHeaders(authSession.access_token, backendUrl)
      });

      if (!response.ok) {
        throw new Error(`Cleanup failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.cleaned_attempts > 0) {
        alert(`Cleaned up ${result.cleaned_attempts} failed attempts!`);
        refreshSessions();
        fetchLiveStats();
        fetchUserLimits();
      } else {
        alert('No failed attempts found to cleanup.');
      }

    } catch (error) {
      alert(`Failed to cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [authSession, getHeaders, refreshSessions, fetchLiveStats, fetchUserLimits]);

  useEffect(() => {
    // Only fetch data after auth is loaded
    if (!authLoading && authSession) {
      // Temporarily disabled endpoint testing to reduce log noise
      // testEndpoints(); // Test all endpoints first
      fetchInterviewData(null); // Load first batch of sessions
      fetchUserLimits();
      fetchLiveStats(); // Fetch real-time stats
      
      // Removed automatic cleanup to reduce backend load
    }
  }, [authLoading, authSession, fetchInterviewData, fetchUserLimits, fetchLiveStats]);

  // Targeted status checking for preparing sessions only
  const checkPreparingSessionsStatus = useCallback(async () => {
    const preparingSessions = sessions.filter(s => s.status === 'preparing');
    if (preparingSessions.length === 0 || !authSession?.access_token) return;

    try {

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
      if (!backendUrl) return;

      // Check status for each preparing session individually
      const statusChecks = preparingSessions.map(async (prepSession) => {
        try {
          // Try session-specific endpoint first, fallback to general sessions endpoint with filter
          let response = await fetch(`${backendUrl}/mockInterview/session/${prepSession.id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authSession.access_token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const sessionData = await response.json();
            return { sessionId: prepSession.id, statusData: sessionData.session || sessionData };
          }
        } catch (error) {
          console.log('Failed to check status for session:', prepSession.id);
        }
        return null;
      });

      const results = await Promise.all(statusChecks);
      
      // Batch all session updates into a single state update
      const updatedSessions = results.filter(result => {
        if (!result || !result.statusData) return false;
        
        const { sessionId, statusData } = result;
        const newStatus = mapBackendStatusToFrontend(
          statusData.status, 
          statusData.status_prep, 
          []
        );
        
        // Only include sessions that actually changed status
        const currentSession = sessions.find(s => s.id === sessionId);
        return currentSession && currentSession.status !== newStatus;
      });

      if (updatedSessions.length > 0) {
        
        setSessions(prevSessions => {
          return prevSessions.map(session => {
            const update = updatedSessions.find(u => u && u.sessionId === session.id);
            if (update && update.statusData) {
              const { statusData } = update;
              const newStatus = mapBackendStatusToFrontend(
                statusData.status, 
                statusData.status_prep, 
                []
              );
                            
              return {
                ...session,
                status: newStatus,
                title: statusData.title || session.title,
                companyName: statusData.company_name || session.companyName,
                role: statusData.position || session.role
              };
            }
            return session;
          });
        });
      }
    } catch (error) {
      console.log('Error checking preparing sessions status:', error);
    }
  }, [sessions, authSession]);

  // Fallback periodic checking for status updates (less aggressive)
  useEffect(() => {
    // Only set up periodic checking if we have preparing sessions
    const hasPreparingSessions = sessions.some(s => s.status === 'preparing');
    
    if (!hasPreparingSessions) {
      return; // No need for periodic checking
    }
    
    
    const intervalId = setInterval(() => {
      checkPreparingSessionsStatus();
    }, 12000); // Check every 12 seconds, optimized for performance
    
    return () => {
      clearInterval(intervalId);
    };
  }, [sessions, checkPreparingSessionsStatus]);

  // Real-time subscription for mock_interview table changes
  useEffect(() => {
    let channel: any = null;

    const setupRealtimeSubscription = async () => {
      try {
        if (!authSession?.user?.id) {
          return;
        }

        const userId = authSession.user.id;
        // Subscribe to changes in mock_interview table for current user
        channel = supabase
          .channel('mock_interview_realtime_updates')
          .on(
            'postgres_changes',
            {
              event: '*', // Listen to INSERT, UPDATE, DELETE
              schema: 'public',
              table: 'mock_interview',
              filter: `user_id=eq.${userId}`
            },
            (payload) => {
              const newData = payload.new as any;
              const oldData = payload.old as any;
                            
              // Handle INSERT events (new sessions created)
              if (payload.eventType === 'INSERT' && newData) {
                
                // Create new session object and add to beginning of list
                const newSession: InterviewSession = {
                  id: newData.id,
                  title: newData.title || generateSessionTitle(newData),
                  type: newData.interview_type || 'behavioral',
                  duration: newData.duration_minutes || 30,
                  status: mapBackendStatusToFrontend(newData.status, newData.status_prep, []) as 'completed' | 'ready' | 'preparing',
                  score: undefined,
                  date: new Date(newData.created_at),
                  companyUrl: newData.company_url || undefined,
                  companyName: newData.company_name || undefined,
                  role: newData.position || undefined,
                  feedback: undefined,
                  attempts: [],
                  latestAttempt: undefined,
                  attempts_count: newData.attempts_count || 0,
                  is_attempts_exhausted: newData.is_attempts_exhausted || false,
                  processed_attempts_count: newData.processed_attempts_count || 0
                };
                
                // Add new session to the beginning of the list
                setSessions(prevSessions => [newSession, ...prevSessions]);
              }
              
              // Handle UPDATE events (status changes, etc.)
              else if (payload.eventType === 'UPDATE' && newData && oldData) {
                
                // Check if this is a status_prep change (agent is ready)
                if (oldData.status_prep !== newData.status_prep) {
                  
                  if (newData.status_prep === 'DONE') {
                    fetchLiveStats();
                  }
                }
                
                // Update the current display inline for immediate UI feedback
                setSessions(prevSessions => {
                  return prevSessions.map(session => {
                    if (session.id === newData.id) {
                      const newStatus = mapBackendStatusToFrontend(
                        newData.status, 
                        newData.status_prep, 
                        session.attempts
                      );
                                           
                      const willPreserveTitle = session.status === 'preparing';
                        // Update attempts info from backend
                      const attempts_count = newData.attempts_count || session.attempts_count || 0;
                      const is_attempts_exhausted = newData.is_attempts_exhausted || attempts_count >= 3;
                      const processed_attempts_count = newData.processed_attempts_count || 0;
                      
                      return {
                        ...session,
                        status: newStatus,
                        title: willPreserveTitle ? session.title : (newData.title || session.title),
                        companyName: willPreserveTitle ? session.companyName : (newData.company_name || session.companyName),
                        role: willPreserveTitle ? session.role : (newData.position || session.role),
                        attempts_count,
                        is_attempts_exhausted,
                        processed_attempts_count
                      };
                    }
                    return session;
                  });
                });
              }
            }
          )
          .subscribe((status) => {
            console.log(' Real-time subscription status:', status);
          });

      } catch (error) {
        console.error(' Error setting up real-time subscription:', error);
      }
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [authSession, supabase]);

  // Listen for attempt status change events from SessionCard components
  useEffect(() => {
    const handleAttemptStatusChanged = (event: CustomEvent) => {
      const { sessionId, attemptId, oldStatus, newStatus, isCompleted } = event.detail;
      
      // Refresh stats when significant status changes occur
      if (newStatus === 'PROCESSED' || newStatus === 'completed' || newStatus === 'active') {
        fetchLiveStats();
      }
      
      // Update session status if needed based on attempt changes
      if (newStatus === 'PROCESSED' || oldStatus !== newStatus) {
        setSessions(prevSessions => {
          return prevSessions.map(session => {
            if (session.id === sessionId) {
              const updatedAttempts = session.attempts?.map(attempt => 
                attempt.id === attemptId ? { ...attempt, status: newStatus } : attempt
              ) || [];
              
              const newSessionStatus = mapBackendStatusToFrontend(
                session.status, 
                undefined, 
                updatedAttempts
              );
                           
              return {
                ...session,
                status: newSessionStatus,
                attempts: updatedAttempts
              };
            }
            return session;
          });
        });
      }
    };

    // 🚀 NEW: Handle progressive attempt loading for better stats
    const handleAttemptsLoaded = (event: CustomEvent) => {
      const { sessionId, attempts: loadedAttempts } = event.detail;
      
      setSessions(prevSessions => {
        return prevSessions.map(session => {
          if (session.id === sessionId) {
            const calculatedScore = calculateScoreFromAttempts(loadedAttempts);
            return {
              ...session,
              attempts: loadedAttempts,
              score: calculatedScore,
              latestAttempt: loadedAttempts.length > 0 ? loadedAttempts[loadedAttempts.length - 1] : undefined
            };
          }
          return session;
        });
      });
      
      // Update stats progressively as attempts are loaded
      fetchLiveStats();
    };

    // Listen for both old and new event types for compatibility
    const handleAttemptCompleted = (event: CustomEvent) => {
      fetchLiveStats();
    };

    const handleAttemptsCleanedUp = (event: CustomEvent) => {
      // Refresh stats and sessions when attempts are cleaned up
      fetchLiveStats();
      fetchUserLimits();
      refreshSessions();
    };

    // Event listeners
    window.addEventListener('attemptStatusChanged', handleAttemptStatusChanged as EventListener);
    window.addEventListener('attemptsLoaded', handleAttemptsLoaded as EventListener);
    window.addEventListener('attemptCompleted', handleAttemptCompleted as EventListener);
    window.addEventListener('attemptsCleanedUp', handleAttemptsCleanedUp as EventListener);
    
    return () => {
      window.removeEventListener('attemptStatusChanged', handleAttemptStatusChanged as EventListener);
      window.removeEventListener('attemptsLoaded', handleAttemptsLoaded as EventListener);
      window.removeEventListener('attemptCompleted', handleAttemptCompleted as EventListener);
      window.removeEventListener('attemptsCleanedUp', handleAttemptsCleanedUp as EventListener);
    };
  }, [fetchLiveStats]);

  // All automatic cleanup removed - only manual cleanup via buttons

  // Function to fetch attempts for sessions that don't have them loaded
  const ensureAttemptsForStats = async (sessionsToUpdate: InterviewSession[]) => {
    try {
      if (!authSession?.access_token) return sessionsToUpdate;

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
      if (!backendUrl) return sessionsToUpdate;

      // Check which sessions need attempts data
      const sessionsNeedingAttempts = sessionsToUpdate.filter(s => 
        !s.attempts || s.attempts.length === 0
      );

      if (sessionsNeedingAttempts.length === 0) return sessionsToUpdate;

      // Fetch attempts for sessions that need them
      const updatedSessions = await Promise.all(
        sessionsToUpdate.map(async (sessionItem) => {
          if (sessionItem.attempts && sessionItem.attempts.length > 0) {
            return sessionItem; // Already has attempts
          }

          try {
            const response = await fetch(`${backendUrl}/mockInterview/session/${sessionItem.id}/attempts`, {
              method: 'GET',
              headers: getHeaders(authSession.access_token, backendUrl)
            });

            if (response.ok) {
              const result = await response.json();
              const attempts = result.attempts || [];
              const calculatedScore = calculateScoreFromAttempts(attempts);
              
              return {
                ...sessionItem,
                attempts,
                score: calculatedScore,
                latestAttempt: attempts.length > 0 ? attempts[attempts.length - 1] : undefined
              };
            }
          } catch (error) {
            console.error(`Failed to fetch attempts for session ${sessionItem.id}:`, error);
          }

          return sessionItem; // Return unchanged if fetch failed
        })
      );

      return updatedSessions;
    } catch (error) {
      console.error('Error ensuring attempts for stats:', error);
      return sessionsToUpdate;
    }
  };

  // Helper function to generate meaningful session titles
  const generateSessionTitle = (backendSession: any): string => {
    const position = backendSession.position || 'Software Engineer';
    const company = backendSession.company_name;
    const interviewType = backendSession.interview_type || 'behavioral';
    
    // Format interview type for display
    const formattedType = interviewType
      .split(/[_-]/)
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    if (company) {
      return `${position} at ${company}`;
    } else {
      return `${formattedType} Interview - ${position}`;
    }
  };

  // Helper function to map backend status to frontend status
  const mapBackendStatusToFrontend = (backendStatus: string, statusPrep?: string, attempts: MockInterviewAttempt[] = []): 'completed' | 'ready' | 'preparing' => {
    // Priority 1: Check if 3 attempts reached - session is complete (all attempts exhausted)
    if (attempts.length >= 3) {
      return 'completed'; // Session finished - no more attempts allowed
    }
    
    // Priority 2: Check backend's computed display_status first
    if (backendStatus === 'completed') {
      return 'completed';
    }
    
    if (backendStatus === 'ready' || backendStatus === 'agent_ready') {
      return 'ready';
    }
    
    if (backendStatus === 'active' || backendStatus === 'in-progress') {
      return 'ready'; // Active session can continue
    }
    
    // Priority 3: Check if ready to start/continue based on agent preparation
    if (statusPrep === 'DONE') {
      return 'ready'; // Can start new attempt or continue
    }
    
    // Priority 4: Still preparing
    return 'preparing'; // Agent still setting up
  };

  // Helper function to calculate score from attempts - return as rating out of 10
  const calculateScoreFromAttempts = (attempts: MockInterviewAttempt[]): string | undefined => {
    if (!attempts || attempts.length === 0) return undefined;
    
    const completedAttempts = attempts.filter(attempt => 
      attempt.status === 'PROCESSED' && (attempt.feedback?.Score || attempt.evaluation_score)
    );
    
    if (completedAttempts.length === 0) return undefined;
    
    // Calculate the average score from all completed attempts
    const scores = completedAttempts.map(attempt => {
      if (attempt.feedback?.Score) {
        // Parse "7.5/10" format
        const scoreMatch = attempt.feedback.Score.match(/^(\d+\.?\d*)/);
        return scoreMatch ? parseFloat(scoreMatch[1]) : 0;
      }
      // Convert evaluation_score to rating out of 10
      const evalScore = attempt.evaluation_score || 0;
      if (evalScore <= 10) {
        return evalScore;
      } else {
        // Convert percentage to rating out of 10
        return (evalScore / 100) * 10;
      }
    });
    
    // Return average as rating out of 10
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return `${Math.round(averageScore * 10) / 10}/10`;
  };

  // Memoized filtered sessions - only recalculates when dependencies change
  const filteredSessions = useMemo(() => {
    let filtered = sessions;

    // Apply search filter
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      
      filtered = filtered.filter(session => {
        const extractDomain = (url: string) => {
          try {
            return new URL(url).hostname.replace('www.', '');
          } catch {
            return url;
          }
        };
        
        const titleMatch = session.title.toLowerCase().includes(searchTermLower);
        const urlMatch = session.companyUrl && extractDomain(session.companyUrl).toLowerCase().includes(searchTermLower);
        const roleMatch = session.role?.toLowerCase().includes(searchTermLower);
        const companyNameMatch = session.companyName?.toLowerCase().includes(searchTermLower);
        
        return titleMatch || urlMatch || roleMatch || companyNameMatch;
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => session.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(session => session.type === typeFilter);
    }

    return filtered;
  }, [sessions, searchTerm, statusFilter, typeFilter]);

  // Helper functions for stats calculations (extracted for better performance)
  const calculateAvgScoreFromAttempts = useCallback((allCompletedAttempts: MockInterviewAttempt[]): string => {
    if (allCompletedAttempts.length === 0) return "0/10";
    
    const scores = allCompletedAttempts.map(attempt => {
      if (attempt.feedback?.Score) {
        // Parse "7.5/10" format - keep as rating out of 10
        const scoreMatch = attempt.feedback.Score.match(/^(\d+\.?\d*)/);
        return scoreMatch ? parseFloat(scoreMatch[1]) : 0;
      }
      // Convert evaluation_score to rating out of 10
      const evalScore = attempt.evaluation_score || 0;
      if (evalScore <= 10) {
        return evalScore;
      } else {
        // Convert percentage to rating out of 10
        return (evalScore / 100) * 10;
      }
    });
    
    const averageScore = scores.reduce((acc, score) => acc + score, 0) / scores.length;
    return `${Math.round(averageScore * 10) / 10}/10`;
  }, []);

  const calculateTotalTimeFromAttempts = useCallback((allCompletedAttempts: MockInterviewAttempt[]): number => {
    return allCompletedAttempts.reduce((acc, attempt) => 
      acc + (attempt.actual_duration_minutes || 0), 0
    );
  }, []);

  // Memoized stats calculation - TEMPORARILY using local calculation only until backend is updated
  const stats = useMemo(() => {
    // Use live stats from backend if available
    if (liveStats && !statsLoading) {
      return {
        total: liveStats.total_sessions || 0,
        completed: liveStats.completed_sessions || 0,
        avgScore: liveStats.avg_score?.toString() || '0',
        totalTime: liveStats.total_time_minutes || 0
      };
    }
    
    // Fallback to local calculation from loaded sessions
    // Count sessions that have reached their attempt limit (3/3 attempts exhausted)
    const completedSessionsCount = sessions.filter(s => {
      const attemptCount = s.attempts ? s.attempts.length : 0;
      return attemptCount >= 3; // Session completed when all 3 attempts are exhausted
    }).length;
    
    // Get all PROCESSED attempts (those with feedback) across loaded sessions  
    const allProcessedAttempts = sessions.flatMap(s => 
      s.attempts?.filter(attempt => 
        attempt.status === 'PROCESSED' && (attempt.feedback?.Score || attempt.evaluation_score)
      ) || []
    );
    
    // Get PROCESSED attempts with duration data
    const allProcessedAttemptsWithDuration = sessions.flatMap(s => 
      s.attempts?.filter(attempt => 
        attempt.status === 'PROCESSED' && attempt.actual_duration_minutes
      ) || []
    );
    
    // Calculate average score from PROCESSED attempts only
    let avgScoreNumeric = '0';
    if (allProcessedAttempts.length > 0) {
      const avgScoreRating = calculateAvgScoreFromAttempts(allProcessedAttempts);
      avgScoreNumeric = avgScoreRating ? avgScoreRating.replace('/10', '') : '0';
    }
    
    // Calculate total time from PROCESSED attempts only
    const totalTime = calculateTotalTimeFromAttempts(allProcessedAttemptsWithDuration);
    
    return {
      total: sessions.length,
      completed: completedSessionsCount, // Sessions with 3/3 attempts exhausted
      avgScore: avgScoreNumeric,
      totalTime: totalTime
    };
  }, [sessions, liveStats, statsLoading, calculateAvgScoreFromAttempts, calculateTotalTimeFromAttempts]);



  const handleNewSession = useCallback(async (sessionData: any) => {
    // Close modal immediately for better UX
    setIsNewSessionModalOpen(false);
    
    try {
      // Check authentication
      if (!authSession?.access_token) {
        console.error('Authentication required');
        setIsNewSessionModalOpen(true); // Reopen modal
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
      if (!backendUrl) {
        console.error('Backend URL not configured');
        alert('Backend configuration error. Please contact support.');
        setIsNewSessionModalOpen(true);
        return;
      }

      // Prepare request body
      const requestBody = {
        title: sessionData.title,
        interview_type: sessionData.type,
        difficulty_level: 'medium', // Default
        position: sessionData.role || 'Software Engineer',
        company_url: sessionData.company || sessionData.company_name || '',
        job_description: sessionData.jobDescription,
        custom_instructions: sessionData.description || '',
        resume_url: sessionData.resumeUrl,
        resume_document_id: sessionData.resumeDocumentId,
        cover_letter_url: sessionData.coverLetterUrl,
        cover_letter_document_id: sessionData.coverLetterDocumentId
      };
      
      const response = await fetch(`${backendUrl}/mockInterview/create-session`, {
        method: 'POST',
        headers: getHeaders(authSession.access_token, backendUrl),
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle specific error types
        if (errorData.limit_reached) {
          console.log(' Session limit reached:', errorData);
        } else {
          console.error('Failed to create session:', errorData.error);
        }
        
        setIsNewSessionModalOpen(true); // Reopen modal for retry
        return;
      }

      const result = await response.json();

      // Refresh stats immediately after creating session
      fetchLiveStats();
      
      // Note: No manual refresh needed - real-time subscription will automatically
      // add the new session to the list when it's created
      
      // Return the session data for modal tracking
      return result;
      
    } catch (error) {
      console.error(' Error creating session:', error);
      setIsNewSessionModalOpen(true); // Reopen modal for retry
      throw error; // Re-throw so modal can handle the error
    }
  }, [authSession, refreshSessions]);

  // Add early error check
  if (error && !authLoading && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/20 p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="text-red-600 mb-2">
                <Award size={40} className="mx-auto mb-3 sm:mb-4 sm:w-12 sm:h-12" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-red-900 mb-2">Failed to Load Interview Sessions</h3>
              <p className="text-sm sm:text-base text-red-700 mb-4 max-w-md mx-auto">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="w-full sm:w-auto border-red-300 text-red-600 hover:bg-red-100 text-sm sm:text-base"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/20 p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4 sm:space-y-6">
            <div className="h-6 sm:h-8 bg-gray-200 rounded w-2/3 sm:w-1/3"></div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 sm:h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="space-y-3 sm:space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 sm:h-40 lg:h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/20 p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="text-red-600 mb-2">
                <Award size={40} className="mx-auto mb-3 sm:mb-4 sm:w-12 sm:h-12" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-red-900 mb-2">Failed to Load Interview Sessions</h3>
              <p className="text-sm sm:text-base text-red-700 mb-4 max-w-md mx-auto">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="w-full sm:w-auto border-red-300 text-red-600 hover:bg-red-100 text-sm sm:text-base"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/20 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8">
        {/* Header */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 shadow-xl p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent mb-2 sm:mb-3">
                Interview Sessions
              </h1>
              <p className="text-slate-600 text-sm sm:text-base lg:text-lg font-medium">
                Practice and track your interview performance
              </p>
            </div>
                          <Button
                onClick={() => setIsNewSessionModalOpen(true)}
                className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-xl shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300 font-semibold px-4 sm:px-6 py-3 text-sm sm:text-base"
              >
                <Plus size={16} className="mr-2" />
                New Session
              </Button>
          </div>
        </div>

        {/* 🚀 Stats Cards - Load First for Immediate Feedback */}
        <StatsCardsSection
          liveStats={liveStats}
          statsLoading={statsLoading}
          localStats={stats}
        />



        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Search Bar */}
              <div className="w-full">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search sessions, companies, or roles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-sm sm:text-base"
                  />
                </div>
              </div>
              
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="preparing">Preparing</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="behavioral">Behavioral</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="system-design">System Design</SelectItem>
                    <SelectItem value="case-study">Case Study</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 🚀 Sessions List - Progressive Loading */}
        <div className="space-y-3 sm:space-y-4">
          <SessionsListSection
            filteredSessions={filteredSessions}
            sessions={sessions}
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            typeFilter={typeFilter}
            loadingMore={loadingMore}
            hasMore={hasMore}
            nextCursor={nextCursor}
            onSetNewSessionModalOpen={setIsNewSessionModalOpen}
            onLoadMore={loadMore}
            onCleanupFailed={cleanupFailedAttempts}
          />
        </div>

        {/* New Session Modal */}
        <NewSessionModal
          isOpen={isNewSessionModalOpen}
          onClose={() => setIsNewSessionModalOpen(false)}
          onSubmit={handleNewSession}
          userLimits={userLimits}
          onSuccess={refreshSessions}
        />
      </div>
    </div>
  );
};

export default InterviewSessionsContent; 