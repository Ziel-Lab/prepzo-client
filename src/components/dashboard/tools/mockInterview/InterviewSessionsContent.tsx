"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Filter, Calendar, Clock, Award, TrendingUp, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import SessionCard from './SessionCard';
import SessionStatsCard from './SessionStatsCard';
import NewSessionModal from './NewSessionModal';
import { createClient } from '@/utils/supabase/client';

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
  transcript?: any;
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
}

const InterviewSessionsContent = () => {
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
  
  const supabase = createClient();
  const SESSIONS_PER_PAGE = 10;

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
        return;
      }

      const response = await fetch(`${backendUrl}/mockInterview/user-limits`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authSession.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch user limits');
        return;
      }

      const limitsData = await response.json();
      setUserLimits(limitsData);
      console.log('✅ User limits fetched:', limitsData);
    } catch (error) {
      console.error('Error fetching user limits:', error);
    } finally {
      setLimitsLoading(false);
    }
  }, [authSession]);

  // Fetch sessions with pagination
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
          setError('Backend URL not configured');
          return;
        }

        // Build URL with cursor-based pagination
        // Always include attempts for accurate stats calculation
        const params = new URLSearchParams({
          include_attempts: 'true', // Always include for stats
          limit: SESSIONS_PER_PAGE.toString()
        });
        
        if (cursor) {
          params.append('cursor', cursor);
        }

        const url = `${backendUrl}/mockInterview/sessions?${params.toString()}`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authSession.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Network error' }));
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch sessions`);
        }

        const result = await response.json();

        const sessionsFromBackend = result.sessions || [];
        const returnedCount = sessionsFromBackend.length;
        
        // Extract cursor-based pagination metadata
        // If no pagination metadata in response, use fallback logic
        const backendHasMore = result.has_more !== undefined ? result.has_more : (returnedCount === SESSIONS_PER_PAGE);
        const backendNextCursor = result.next_cursor || null;
        
        // If backend doesn't support cursor pagination, use the last session's created_at as cursor
        let effectiveNextCursor = backendNextCursor;
        if (!effectiveNextCursor && returnedCount === SESSIONS_PER_PAGE && sessionsFromBackend.length > 0) {
          const lastSession = sessionsFromBackend[sessionsFromBackend.length - 1];
          effectiveNextCursor = lastSession.created_at;
        }

        if ((!cursor || isRefresh) && sessionsFromBackend.length === 0) {
          setSessions([]);
          setHasMore(false);
          setNextCursor(null);
          return;
        }

        // Transform backend data to frontend format
        const sessionData: InterviewSession[] = sessionsFromBackend.map((backendSession: any) => {

          // Fetch attempts for this session to calculate score
          const sessionAttempts: MockInterviewAttempt[] = backendSession.attempts || [];
          const calculatedScore = calculateScoreFromAttempts(sessionAttempts);
          
          // Map backend session to frontend format
          const mappedStatus = mapBackendStatusToFrontend(backendSession.display_status || backendSession.status, backendSession.status_prep, sessionAttempts);
          
          const sessionItem: InterviewSession = {
            id: backendSession.id,
            title: backendSession.title || generateSessionTitle(backendSession), // Use database title first
            type: backendSession.interview_type || 'behavioral',
            duration: backendSession.duration_minutes || 30,
            status: mappedStatus,
            score: calculatedScore,
            date: new Date(backendSession.created_at),
            companyUrl: backendSession.company_url || undefined,
            companyName: backendSession.company_name || undefined,
            role: backendSession.position || undefined,
            feedback: undefined,
            attempts: sessionAttempts,
            latestAttempt: sessionAttempts.length > 0 ? sessionAttempts[sessionAttempts.length - 1] : undefined
          };
          
          return sessionItem;
        });

        // Ensure all sessions have complete attempts data for accurate stats
        const finalSessionData = await ensureAttemptsForStats(sessionData);
        
        // Update sessions state based on cursor
        if (!cursor || isRefresh) {
          // First load or refresh - replace all sessions
          setSessions(finalSessionData);
        } else {
          // Load more - append to existing sessions
          setSessions(prevSessions => [...prevSessions, ...finalSessionData]);
        }

        // Update pagination state based on backend response
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
  const refreshSessions = useCallback(() => {
    setNextCursor(null);
    setHasMore(true);
    fetchInterviewData(null, true); // Refresh from beginning
  }, [fetchInterviewData]);

  useEffect(() => {
    // Only fetch data after auth is loaded
    if (!authLoading && authSession) {
      fetchInterviewData(null); // Load first batch of sessions
      fetchUserLimits();
    }
  }, [authLoading, authSession, fetchInterviewData, fetchUserLimits]);

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
        console.log('🔄 Updating status for', updatedSessions.length, 'sessions');
        
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
              
              console.log('🔄 Status changed for session:', session.id, 'from', session.status, 'to', newStatus);
              
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
    
    console.log('🔄 Setting up targeted status checking for preparing sessions');
    
    const intervalId = setInterval(() => {
      checkPreparingSessionsStatus();
    }, 12000); // Check every 12 seconds, optimized for performance
    
    return () => {
      console.log('🔄 Cleaning up targeted status checking');
      clearInterval(intervalId);
    };
  }, [sessions, checkPreparingSessionsStatus]);

  // Real-time subscription for mock_interview table changes
  useEffect(() => {
    let channel: any = null;

    const setupRealtimeSubscription = async () => {
      try {
        if (!authSession?.user?.id) {
          console.log('🔔 No authenticated user for real-time subscription');
          return;
        }

        const userId = authSession.user.id;
        console.log('🔔 Setting up real-time subscription for user:', userId?.substring(0, 8) + '***');

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
              
              console.log('🔔 Real-time event received for mock_interview:', {
                eventType: payload.eventType,
                sessionId: newData?.id,
                oldStatusPrep: oldData?.status_prep,
                newStatusPrep: newData?.status_prep,
                timestamp: new Date().toISOString()
              });
              
              // Handle INSERT events (new sessions created)
              if (payload.eventType === 'INSERT' && newData) {
                console.log('🎉 New session created via real-time, adding to list');
                
                // Create new session object and add to beginning of list
                const newSession = {
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
                  latestAttempt: undefined
                };
                
                // Add new session to the beginning of the list
                setSessions(prevSessions => [newSession, ...prevSessions]);
              }
              
              // Handle UPDATE events (status changes, etc.)
              else if (payload.eventType === 'UPDATE' && newData && oldData) {
                console.log('🔔 Session updated via real-time, updating display');
                
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
                      
                      return {
                        ...session,
                        status: newStatus,
                        title: willPreserveTitle ? session.title : (newData.title || session.title),
                        companyName: willPreserveTitle ? session.companyName : (newData.company_name || session.companyName),
                        role: willPreserveTitle ? session.role : (newData.position || session.role)
                      };
                    }
                    return session;
                  });
                });
              }
            }
          )
          .subscribe((status) => {
            console.log('🔔 Real-time subscription status:', status);
          });

      } catch (error) {
        console.error('❌ Error setting up real-time subscription:', error);
      }
    };

    setupRealtimeSubscription();

    return () => {
      console.log('🔔 Cleaning up real-time subscription');
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [authSession, supabase]);

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
              headers: {
                'Authorization': `Bearer ${authSession.access_token}`,
                'Content-Type': 'application/json'
              }
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
    console.log('🎯 Status mapping input:', {
      backendStatus,
      statusPrep,
      attemptsCount: attempts.length,
      attempts: attempts.map(a => ({ id: a.id, status: a.status }))
    });
    
    // Priority 1: Check if 3 attempts reached - session is complete
    if (attempts.length >= 3) {
      console.log('🎯 Status mapping result: completed (3+ attempts)');
      return 'completed'; // Session finished - no more attempts allowed
    }
    
    // Priority 2: Check if ready to start/continue based on agent preparation
    if (statusPrep === 'DONE') {
      console.log('🎯 Status mapping result: ready (status_prep = DONE) ✅');
      return 'ready'; // Can start new attempt or continue
    }
    
    // Check other possible "ready" indicators
    if (statusPrep === 'READY' || backendStatus === 'ready') {
      console.log('🎯 Status mapping result: ready (alternative ready state) ✅');
      return 'ready';
    }
    
    // Priority 3: Still preparing
    console.log('🎯 Status mapping result: preparing (status_prep =', statusPrep, ')');
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

  // Memoized stats calculation based on currently loaded sessions
  const stats = useMemo(() => {
    // Count completed sessions based on status
    const completedSessionsCount = sessions.filter(s => s.status === 'completed').length;
    
    // Alternative: count sessions with any completed attempts
    const sessionsWithCompletedAttempts = sessions.filter(s => 
      s.attempts && s.attempts.some(attempt => attempt.status === 'PROCESSED')
    ).length;
    
    // Use the higher count for more accurate representation
    const finalCompletedCount = Math.max(completedSessionsCount, sessionsWithCompletedAttempts);
    
    // Get all completed attempts across loaded sessions
    const allCompletedAttempts = sessions.flatMap(s => 
      s.attempts?.filter(attempt => 
        attempt.status === 'PROCESSED' && (attempt.feedback?.Score || attempt.evaluation_score)
      ) || []
    );
    
    // Get completed attempts with duration data
    const allCompletedAttemptsWithDuration = sessions.flatMap(s => 
      s.attempts?.filter(attempt => 
        attempt.status === 'PROCESSED' && attempt.actual_duration_minutes
      ) || []
    );
    
    // Calculate average score
    let avgScoreNumeric = '0';
    if (allCompletedAttempts.length > 0) {
      const avgScoreRating = calculateAvgScoreFromAttempts(allCompletedAttempts);
      avgScoreNumeric = avgScoreRating ? avgScoreRating.replace('/10', '') : '0';
    }
    
    // Calculate total time
    const totalTime = calculateTotalTimeFromAttempts(allCompletedAttemptsWithDuration);
    
    return {
      total: sessions.length,
      completed: finalCompletedCount,
      avgScore: avgScoreNumeric,
      totalTime: totalTime
    };
  }, [sessions, calculateAvgScoreFromAttempts, calculateTotalTimeFromAttempts]);

  const handleNewSession = useCallback(async (sessionData: any) => {
    console.log('🚀 handleNewSession received data:', sessionData);
    
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
      
      console.log('📤 Sending to backend:', requestBody);

      // Call backend create-session endpoint
      const response = await fetch(`${backendUrl}/mockInterview/create-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authSession.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle specific error types
        if (errorData.limit_reached) {
          console.log('🚫 Session limit reached:', errorData);
        } else {
          console.error('Failed to create session:', errorData.error);
        }
        
        setIsNewSessionModalOpen(true); // Reopen modal for retry
        return;
      }

      const result = await response.json();
      console.log('✅ Session created successfully:', result);

      // Note: No manual refresh needed - real-time subscription will automatically
      // add the new session to the list when it's created
      
    } catch (error) {
      console.error('❌ Error creating session:', error);
      setIsNewSessionModalOpen(true); // Reopen modal for retry
    }
  }, [authSession, refreshSessions]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/20 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/20 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <div className="text-red-600 mb-2">
                <Award size={48} className="mx-auto mb-4" />
              </div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Interview Sessions</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="border-red-300 text-red-600 hover:bg-red-100"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/20 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 shadow-xl p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent mb-3">
                Interview Sessions
              </h1>
              <p className="text-slate-600 text-lg font-medium">Practice and track your interview performance</p>
            </div>
            <Button
              onClick={() => setIsNewSessionModalOpen(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-xl shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300 font-semibold px-6 py-3 text-base"
            >
              <Plus size={18} className="mr-2" />
              New Session
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <SessionStatsCard
            title="Total Sessions"
            value={stats.total}
            icon={Calendar}
            color="blue"
          />
          <SessionStatsCard
            title="Completed"
            value={stats.completed}
            icon={Clock}
            color="green"
          />
          <SessionStatsCard
            title="Avg Score"
            value={stats.avgScore}
            icon={Award}
            color="purple"
          />
          <SessionStatsCard
            title="Total Time"
            value={`${Math.floor(stats.totalTime / 60)}h ${stats.totalTime % 60}m`}
            icon={TrendingUp}
            color="orange"
          />
        </div>



        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search sessions, companies, or roles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
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
                <SelectTrigger className="w-40">
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
          </CardContent>
        </Card>

        {/* Sessions List */}
        <div className="space-y-4">
          {filteredSessions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Calendar size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No sessions found</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'Try adjusting your filters or search terms'
                    : sessions.length > 0 
                      ? 'All sessions are filtered out. Try clearing your filters.'
                      : 'Start practicing with your first interview session'}
                </p>
                <Button
                  onClick={() => setIsNewSessionModalOpen(true)}
                  variant="outline"
                  className="border-green-200 text-green-600 hover:bg-green-50"
                >
                  <Plus size={16} className="mr-2" />
                  Create Your First Session
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
                            {filteredSessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
              
              {/* Loading More Indicator */}
              {loadingMore && (
                <Card className="border-green-100 bg-green-50/30">
                  <CardContent className="p-8">
                    <div className="flex justify-center items-center">
                      <div className="flex items-center space-x-4 px-6 py-4 bg-white/80 rounded-xl border border-green-200 shadow-sm">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-500 border-t-transparent"></div>
                        <span className="text-green-700 font-medium text-lg">Loading more sessions...</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Pretty Load More Button */}
              {hasMore && !loadingMore && sessions.length > 0 && nextCursor && (
                <Card className="border-green-100 bg-gradient-to-br from-green-50/50 to-emerald-50/30">
                  <CardContent className="p-8">
                    <div className="flex justify-center">
                      <button
                        onClick={loadMore}
                        className="group relative inline-flex items-center justify-center px-10 py-4 text-base font-semibold text-white transition-all duration-300 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl hover:from-green-700 hover:to-emerald-700 hover:shadow-xl hover:shadow-green-500/25 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transform hover:-translate-y-1 active:translate-y-0"
                      >
                        <svg 
                          className="w-5 h-5 mr-3 transition-transform group-hover:translate-y-1" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                        Load More Sessions
                        <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        {/* New Session Modal */}
        <NewSessionModal
          isOpen={isNewSessionModalOpen}
          onClose={() => setIsNewSessionModalOpen(false)}
          onSubmit={handleNewSession}
          userLimits={userLimits}
        />
      </div>
    </div>
  );
};

export default InterviewSessionsContent; 