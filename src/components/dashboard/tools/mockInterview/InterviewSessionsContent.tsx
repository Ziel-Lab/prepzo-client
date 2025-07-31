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
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLimits, setUserLimits] = useState<any>(null);
  const [limitsLoading, setLimitsLoading] = useState(true);
  const supabase = createClient();

  // Fetch user limits from backend
  const fetchUserLimits = useCallback(async () => {
    try {
      setLimitsLoading(true);
      
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session?.access_token) {
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
          'Authorization': `Bearer ${session.access_token}`,
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
  }, [supabase]);

  // Fetch data from backend API instead of direct Supabase
  const fetchInterviewData = useCallback(async (showLoading: boolean = false) => {
      try {
        if (showLoading) {
          setIsLoading(true);
        }
        setError(null);

        console.log('🔍 Starting to fetch interview data via backend API...');

        // Get user session for authentication
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError || !session?.access_token) {
          console.error('❌ Authentication error:', authError);
          setError('Authentication required');
          return;
        }

        console.log('✅ User authenticated');

        // Get backend URL
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
        if (!backendUrl) {
          setError('Backend URL not configured');
          return;
        }

        console.log('🌐 Using backend URL:', backendUrl);

        // Fetch sessions from backend API (with attempts for stats calculation)
        const response = await fetch(`${backendUrl}/mockInterview/sessions?include_attempts=true`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Network error' }));
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch sessions`);
        }

        const result = await response.json();
        console.log('📊 Backend response:', result);

        const sessionsFromBackend = result.sessions || [];
        console.log('📊 Sessions from backend:', sessionsFromBackend.length, sessionsFromBackend);

        if (sessionsFromBackend.length === 0) {
                  console.log('📭 No sessions found');
        setSessions([]);
        return;
        }

        // Transform backend data to frontend format
        const sessionData: InterviewSession[] = sessionsFromBackend.map((backendSession: any) => {
          console.log(`📝 Processing backend session:`, {
            id: backendSession.id,
            title: backendSession.title,
            status: backendSession.status,
            display_status: backendSession.display_status
          });

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
          
          // Log status mapping for debugging
          if (backendSession.status_prep) {
            console.log('📊 Session status mapping during fetch:', {
              sessionId: backendSession.id.substring(0, 8) + '***',
              title: sessionItem.title,
              backendStatus: backendSession.status,
              statusPrep: backendSession.status_prep,
              mappedStatus: mappedStatus,
              attemptsCount: sessionAttempts.length
            });
          }

          console.log('✅ Transformed session item:', sessionItem);
          return sessionItem;
        });

        console.log('🎯 Final session data:', sessionData.length, sessionData);

        // Ensure all sessions have attempts data for accurate stats
        const sessionsWithAttempts = await ensureAttemptsForStats(sessionData);
        
        setSessions(sessionsWithAttempts);

      } catch (error) {
        console.error('💥 Error in fetchInterviewData:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch interview data');
      } finally {
        if (showLoading) {
          setIsLoading(false);
        }
      }
  }, [supabase]);

  useEffect(() => {
    fetchInterviewData(true); // Show loading on initial load
    fetchUserLimits();
  }, [fetchInterviewData, fetchUserLimits]);

  // Fallback periodic checking for status updates (less aggressive)
  useEffect(() => {
    // Only set up periodic checking if we have preparing sessions
    const hasPreparingSessions = sessions.some(s => s.status === 'preparing');
    
    if (!hasPreparingSessions) {
      return; // No need for periodic checking
    }
    
    console.log('🔄 Setting up fallback status checking for preparing sessions');
    
    const intervalId = setInterval(() => {
      // Only check status updates for preparing sessions
      const preparingSessions = sessions.filter(s => s.status === 'preparing');
      if (preparingSessions.length > 0) {
        console.log('🔄 Fallback check: Found', preparingSessions.length, 'preparing sessions');
        console.log('🔄 Preparing sessions:', preparingSessions.map(s => ({
          id: s.id.substring(0, 8) + '***',
          title: s.title,
          status: s.status
        })));
        
        // Fetch only session status updates without full refresh
        fetchInterviewData(false);
      } else {
        console.log('🔄 Fallback check: No preparing sessions found, skipping fetch');
      }
    }, 6000); // Check every 6 seconds for faster updates
    
    return () => {
      console.log('🔄 Cleaning up fallback status checking');
      clearInterval(intervalId);
    };
  }, [sessions, fetchInterviewData]);

  // Real-time subscription for mock_interview table changes
  useEffect(() => {
    let channel: any = null;

    const setupRealtimeSubscription = async () => {
      try {
        const { data: { session: authSession }, error: authError } = await supabase.auth.getSession();
        if (authError || !authSession?.user?.id) {
          console.log('🔔 No authenticated user for real-time subscription');
          return;
        }

        const userId = authSession.user.id;
        console.log('🔔 Setting up real-time subscription for user:', userId?.substring(0, 8) + '***');
        console.log('🔔 Listening for status_prep changes in mock_interview table');
        console.log('🔔 Subscription timestamp:', new Date().toISOString());

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
                oldStatus: oldData?.status,
                newStatus: newData?.status,
                timestamp: new Date().toISOString(),
                isStatusPrepChange: oldData?.status_prep !== newData?.status_prep,
                isPrepToDone: oldData?.status_prep !== 'DONE' && newData?.status_prep === 'DONE'
              });
              
              // Special logging for the important transition
              if (oldData?.status_prep !== 'DONE' && newData?.status_prep === 'DONE') {
                console.log('🎉 CRITICAL UPDATE: Status prep changed to DONE!', {
                  sessionId: newData?.id,
                  oldPrep: oldData?.status_prep,
                  newPrep: newData?.status_prep,
                  expectedTransition: 'preparing → ready'
                });
              }
              
              // Handle INSERT events (new sessions created)
              if (payload.eventType === 'INSERT' && newData) {
                console.log('🎉 New session created via real-time:', {
                  sessionId: newData.id,
                  title: newData.title,
                  status: newData.status,
                  status_prep: newData.status_prep
                });
                
                // Transform backend session to frontend format
                const backendSession = newData;
                const sessionAttempts: MockInterviewAttempt[] = []; // New sessions have no attempts yet
                const calculatedScore = calculateScoreFromAttempts(sessionAttempts);
                
                const newSession: InterviewSession = {
                  id: backendSession.id,
                  title: backendSession.title || generateSessionTitle(backendSession),
                  type: backendSession.interview_type || 'behavioral',
                  duration: backendSession.duration_minutes || 30,
                  status: mapBackendStatusToFrontend(backendSession.status, backendSession.status_prep, sessionAttempts),
                  score: calculatedScore,
                  date: new Date(backendSession.created_at),
                  companyUrl: backendSession.company_url || undefined,
                  companyName: backendSession.company_name || undefined,
                  role: backendSession.position || undefined,
                  feedback: undefined,
                  attempts: sessionAttempts,
                  latestAttempt: undefined
                };
                
                // Add or update session in state
                setSessions(prevSessions => {
                  // Try to find by real ID first, then by temp ID pattern
                  const existingIndex = prevSessions.findIndex(s => 
                    s.id === newSession.id || s.id.startsWith('temp-')
                  );
                  if (existingIndex >= 0) {
                    // Replace optimistic session with real data but preserve the title
                    console.log('🔄 Replacing optimistic session with real data');
                    const existingSession = prevSessions[existingIndex];
                    console.log('📝 Preserving original title during INSERT:', {
                      originalTitle: existingSession.title,
                      backendTitle: newSession.title,
                      sessionId: newSession.id,
                      existingSessionId: existingSession.id
                    });
                    const updatedSessions = [...prevSessions];
                    updatedSessions[existingIndex] = {
                      ...newSession,
                      // Preserve the original title to prevent visual changes
                      title: existingSession.title
                    };
                    return updatedSessions;
                  } else {
                    // Add new session to the beginning
                    console.log('✅ Adding new session to state');
                    return [newSession, ...prevSessions];
                  }
                });
              }
              
              // Handle UPDATE events (status changes, etc.)
              else if (payload.eventType === 'UPDATE' && newData && oldData) {
                const updatedSession = newData;
                const oldSession = oldData;
                
                console.log('🔔 Analyzing UPDATE event:', {
                  sessionId: updatedSession.id,
                  oldStatusPrep: oldSession.status_prep,
                  newStatusPrep: updatedSession.status_prep,
                  oldStatus: oldSession.status,
                  newStatus: updatedSession.status
                });

                // Always update the session to ensure real-time sync
                setSessions(prevSessions => {
                  return prevSessions.map(session => {
                    if (session.id === updatedSession.id) {
                      // Calculate new status based on updated backend data
                      const newStatus = mapBackendStatusToFrontend(
                        updatedSession.status, 
                        updatedSession.status_prep, 
                        session.attempts
                      );
                      
                      console.log('🔄 Updating session in real-time:', {
                        sessionId: updatedSession.id,
                        oldFrontendStatus: session.status,
                        newFrontendStatus: newStatus,
                        backendStatus: updatedSession.status,
                        backendStatusPrep: updatedSession.status_prep,
                        preservingTitle: session.status === 'preparing',
                        currentTitle: session.title,
                        backendTitle: updatedSession.title,
                        statusWillChange: session.status !== newStatus,
                        importantUpdate: session.status === 'preparing' && newStatus === 'ready'
                      });
                      
                      // Log important status transitions
                      if (session.status === 'preparing' && newStatus === 'ready') {
                        console.log('🎉 IMPORTANT: Session ready for interview!', {
                          sessionId: updatedSession.id,
                          title: session.title,
                          transition: 'preparing → ready'
                        });
                      }
                      
                      const willPreserveTitle = session.status === 'preparing';
                      if (willPreserveTitle) {
                        console.log('📝 Preserving title during UPDATE (preparing stage):', {
                          sessionId: session.id,
                          preservedTitle: session.title,
                          backendTitle: updatedSession.title
                        });
                      }
                      
                      return {
                        ...session,
                        status: newStatus,
                        // Don't update title during preparing stage to prevent visual changes
                        title: willPreserveTitle ? session.title : (updatedSession.title || session.title),
                        companyName: willPreserveTitle ? session.companyName : (updatedSession.company_name || session.companyName),
                        role: willPreserveTitle ? session.role : (updatedSession.position || session.role)
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
            if (status === 'SUBSCRIBED') {
              console.log('✅ Successfully subscribed to mock_interview table changes');
              console.log('🔔 Subscription details:', {
                channel: 'mock_interview_realtime_updates',
                event: '*',
                table: 'mock_interview',
                filter: `user_id=eq.${userId}`,
                userId: userId?.substring(0, 8) + '***',
                timestamp: new Date().toISOString()
              });
              
              // Add global test functions for manual testing
              (window as any).testRealtimeSubscription = () => {
                console.log('🧪 Testing real-time subscription...');
                console.log('🧪 Current sessions with preparing status:', 
                  sessions.filter(s => s.status === 'preparing').map(s => ({
                    id: s.id,
                    title: s.title,
                    status: s.status
                  }))
                );
              };
              
              (window as any).testStatusMapping = (sessionId: string) => {
                const session = sessions.find(s => s.id === sessionId);
                if (session) {
                  console.log('🧪 Testing status mapping for session:', sessionId);
                  const newStatus = mapBackendStatusToFrontend('created', 'DONE', session.attempts);
                  console.log('🧪 Mapped status (with DONE):', newStatus);
                } else {
                  console.log('🧪 Session not found:', sessionId);
                }
              };
              
              (window as any).forceStatusUpdate = (sessionId: string) => {
                console.log('🧪 Forcing status update for session:', sessionId);
                setSessions(prevSessions => 
                  prevSessions.map(session => {
                    if (session.id === sessionId && session.status === 'preparing') {
                      console.log('🧪 Updating session status: preparing → ready');
                      return { ...session, status: 'ready' as const };
                    }
                    return session;
                  })
                );
              };
              
              console.log('🧪 Test functions available:');
              console.log('🧪   - window.testRealtimeSubscription()');
              console.log('🧪   - window.testStatusMapping(sessionId)');
              console.log('🧪   - window.forceStatusUpdate(sessionId)');
            } else if (status === 'CHANNEL_ERROR') {
              console.error('❌ Real-time subscription error');
            } else {
              console.log('🔔 Subscription status change:', status);
            }
          });

      } catch (error) {
        console.error('❌ Error setting up real-time subscription:', error);
      }
    };

    setupRealtimeSubscription();

    // Cleanup subscription on unmount
    return () => {
      console.log('🔔 Cleaning up real-time subscription');
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase]);

  // Function to fetch attempts for sessions that don't have them loaded
  const ensureAttemptsForStats = async (sessionsToUpdate: InterviewSession[]) => {
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session?.access_token) return sessionsToUpdate;

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
                'Authorization': `Bearer ${session.access_token}`,
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

  // Memoized stats calculation - only recalculates when sessions change
  const stats = useMemo(() => {
    // Get all completed attempts across all sessions (expensive operation)
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
    
    // Count completed sessions
    const completedSessionsCount = sessions.filter(s => 
      s.attempts && s.attempts.some(attempt => attempt.status === 'PROCESSED')
    ).length;
    
    // Get avgScore and strip "/10" for stats display
    const avgScoreRating = calculateAvgScoreFromAttempts(allCompletedAttempts);
    const avgScoreNumeric = avgScoreRating ? avgScoreRating.replace('/10', '') : '0';
    
    return {
      total: sessions.length,
      completed: completedSessionsCount,
      avgScore: avgScoreNumeric, // Just the number, no "/10"
      totalTime: calculateTotalTimeFromAttempts(allCompletedAttemptsWithDuration)
    };
  }, [sessions, calculateAvgScoreFromAttempts, calculateTotalTimeFromAttempts]);

  const handleNewSession = useCallback(async (sessionData: any) => {
    console.log('🚀 handleNewSession received data:', sessionData);
    console.log('🏢 Company URL field mapping:', {
      company: sessionData.company,
      company_name: sessionData.company_name,
      companyUrl: sessionData.companyUrl,
      finalValue: sessionData.company || sessionData.company_name || ''
    });
    
    // Generate temporary ID for optimistic update
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create optimistic session immediately
    const optimisticSession: InterviewSession = {
      id: tempId,
      title: sessionData.title,
      type: sessionData.type || 'behavioral',
      duration: 15, // Always 15 minutes per backend
      status: 'preparing', // Start as preparing since status_prep will be PENDING initially
      score: undefined,
      date: new Date(),
      companyUrl: sessionData.company || sessionData.company_name || '',
      companyName: sessionData.company || sessionData.company_name || '',
      role: sessionData.role || 'Software Engineer',
      feedback: undefined,
      attempts: [],
      latestAttempt: undefined
    };
    
    // Add optimistic session to state immediately
    console.log('⚡ Adding optimistic session:', optimisticSession);
    setSessions(prevSessions => [optimisticSession, ...prevSessions]);
    
    // Close modal immediately for better UX
    setIsNewSessionModalOpen(false);
    
    try {
      // Get user session for authentication
      const { data: authData, error: authError } = await supabase.auth.getSession();
      if (authError || !authData?.session?.access_token) {
        // Remove optimistic session on auth error
        setSessions(prevSessions => prevSessions.filter(s => s.id !== tempId));
        setError('Authentication required');
        setIsNewSessionModalOpen(true); // Reopen modal
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
      if (!backendUrl) {
        setSessions(prevSessions => prevSessions.filter(s => s.id !== tempId));
        setError('Backend URL not configured');
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
      console.log('🏢 Company URL being sent:', requestBody.company_url);

      // Call backend create-session endpoint
      const response = await fetch(`${backendUrl}/mockInterview/create-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authData.session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Remove optimistic session on error
        setSessions(prevSessions => prevSessions.filter(s => s.id !== tempId));
        
        // Handle specific error types
        if (errorData.limit_reached) {
          console.log('🚫 Session limit reached:', errorData);
          setError(`Session limit reached (${errorData.current_count}/${errorData.limit}). Please upgrade your plan.`);
        } else {
          setError(errorData.error || 'Failed to create session');
        }
        
        setIsNewSessionModalOpen(true); // Reopen modal for retry
        return;
      }

      const result = await response.json();
      console.log('✅ Session created successfully:', result);

      // Update optimistic session with real data (will be replaced by real-time event)
      setSessions(prevSessions => 
        prevSessions.map(session => {
          if (session.id === tempId) {
            console.log('🔄 Updating optimistic session with backend response');
            return {
              ...session,
              id: result.session_id, // Replace temp ID with real ID
              title: session.title, // Keep the original user-entered title
              type: result.interview_type || session.type,
              duration: result.duration_minutes || 15,
              companyUrl: result.company_url || session.companyUrl,
              companyName: result.company_name || session.companyName,
              role: result.position || session.role,
              status: 'preparing' // Backend starts with status:'created' and status_prep:'PENDING'
            };
          }
          return session;
        })
      );

      // Real-time subscription will handle status updates automatically
      console.log('🎉 Session creation complete - waiting for real-time status updates');
      
    } catch (error) {
      console.error('❌ Error creating session:', error);
      
      // Remove optimistic session on network/server error
      setSessions(prevSessions => prevSessions.filter(s => s.id !== tempId));
      
      setError(error instanceof Error ? error.message : 'Failed to create session');
      setIsNewSessionModalOpen(true); // Reopen modal for retry
    }
  }, [supabase]);

  if (isLoading) {
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
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Sessions</h1>
            <p className="text-gray-600">Practice and track your interview performance</p>
          </div>
          <Button
            onClick={() => setIsNewSessionModalOpen(true)}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25"
          >
            <Plus size={16} className="mr-2" />
            New Session
          </Button>
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
            filteredSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))
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