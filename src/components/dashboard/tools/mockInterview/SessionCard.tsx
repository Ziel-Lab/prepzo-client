"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Play, Award, Building2, Briefcase, ChevronDown, ChevronUp, Eye, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

// Database structure interfaces
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
  feedback?: any; // Contains score and other feedback data
  evaluation_score?: number;
  created_at: string;
  updated_at: string;
}

// Updated interface matching the database structure
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

interface SessionCardProps {
  session: InterviewSession;
  onCleanupFailed?: () => void;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, onCleanupFailed }) => {
  const router = useRouter();
  const supabase = createClient();
  const [showAttempts, setShowAttempts] = useState(false);
  const [showAnalyzingNotification, setShowAnalyzingNotification] = useState(false);

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
  const [attempts, setAttempts] = useState<MockInterviewAttempt[]>(session.attempts || []);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);
  const [lastStatusCheck, setLastStatusCheck] = useState<number>(Date.now());
  const [realtimeConnected, setRealtimeConnected] = useState<boolean>(false);
  const [isStarting, setIsStarting] = useState(false);

  // Sync attempts when session data changes
  React.useEffect(() => {
    if (session.attempts && session.attempts.length > 0) {
      setAttempts(session.attempts);
    }
  }, [session.attempts, session.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'ready':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'preparing':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusDisplayText = (status: string, attemptCount: number) => {
    switch (status) {
      case 'completed':
        return `All Attempts Used (${attemptCount}/3)`;
      case 'ready':
        return attemptCount === 0 ? 'Ready to Begin' : 'Ready to Continue';
      case 'preparing':
        return 'Setting up...';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const calculateSessionScore = () => {
    // Use attempts from state (may be updated via real-time)
    const currentAttempts = attempts.length > 0 ? attempts : (session.attempts || []);
    
    if (currentAttempts.length > 0) {
      // Only consider PROCESSED attempts (those with feedback ready)
      const processedAttempts = currentAttempts.filter(attempt => 
        attempt.status === 'PROCESSED' && (attempt.feedback?.Score || attempt.evaluation_score)
      );

      if (processedAttempts.length === 0) return undefined;
      
      // Calculate the average score as rating out of 10
      const scores = processedAttempts.map(attempt => {
        if (attempt.feedback?.Score) {
          // Parse numeric token from feedback.Score (e.g., "7.5/10")
          const scoreMatch = String(attempt.feedback.Score).match(/^(\d+\.?\d*)/);
          return scoreMatch ? parseFloat(scoreMatch[1]) : 0;
        }
        // Convert evaluation_score to rating out of 10
        const evalScore = attempt.evaluation_score || 0;
        return evalScore <= 10 ? evalScore : (evalScore / 100) * 10;
      });
      
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      return `${Math.round(averageScore * 10) / 10}/10`;
    }
    return session.score;
  };

  const getCompletedAttemptsCount = () => {
    const currentAttempts = attempts.length > 0 ? attempts : (session.attempts || []);
    return currentAttempts.filter(attempt => attempt.status === 'PROCESSED').length;
  };

  const getTotalAttemptsCount = () => {
    const currentAttempts = attempts.length > 0 ? attempts : (session.attempts || []);
    return currentAttempts.length;
  };

  const hasReachedAttemptLimit = () => {
    return getTotalAttemptsCount() >= 3; // Check total attempts, not just processed
  };

  const getTypeColor = (type: string) => {
    // Normalize type for consistent display
    const normalizedType = type.toLowerCase().replace(/[_-]/g, ' ');
    
    switch (normalizedType) {
      case 'behavioral':
        return 'bg-purple-100 text-purple-700';
      case 'technical':
        return 'bg-blue-100 text-blue-700';
      case 'system design':
      case 'system-design':
        return 'bg-emerald-100 text-emerald-700';
      case 'case study':
      case 'case-study':
        return 'bg-rose-100 text-rose-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Small, safe change: accept either 0-10 or 0-100 input. If score <= 10, treat as 0-10 and scale for thresholds.
  const getScoreColor = (score: number) => {
    const scaled = (typeof score === 'number' && score <= 10) ? score * 10 : score;
    if (scaled >= 90) return 'text-green-600';
    if (scaled >= 80) return 'text-emerald-600';
    if (scaled >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  // User-friendly status labels and colors
  const getAttemptStatusDisplay = (status: string) => {
    switch (status.toLowerCase()) {
      case 'processed':
        return { label: 'Feedback Ready', color: 'bg-green-100 text-green-700 border-green-200' };
      case 'completed':
        return { label: 'Analyzing...', color: 'bg-blue-100 text-blue-700 border-blue-200' };
      case 'active':
        return { label: 'Interview in Progress', color: 'bg-orange-100 text-orange-700 border-orange-200' };
      case 'pending':
        return { label: 'Ready to Begin', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
      default:
        return { label: status.charAt(0).toUpperCase() + status.slice(1), color: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  };

  const getAttemptStatusColor = (status: string) => {
    return getAttemptStatusDisplay(status).color;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    return date.toLocaleDateString();
  };

  const formatType = (type: string) => {
    // Format the type for display
    return type
      .split(/[_-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const extractDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  };

  // Minimal helper: parse numeric rating from an attempt and always return 0-10 numeric and X/10 display.
  const parseAttemptScore = (attempt: MockInterviewAttempt) => {
    // Try feedback.Score first (may contain explanatory text)
    if (attempt?.feedback?.Score) {
      const match = String(attempt.feedback.Score).match(/(\d+(?:\.\d+)?)/);
      if (match) {
        let num = parseFloat(match[1]);
        // If looks like percentage (>10) convert to 0-10 scale (rounded to 1dp)
        if (num > 10) {
          num = Math.round((num / 100) * 10 * 10) / 10;
        }
        const clamped = Math.max(0, Math.min(10, num));
        const display = Number.isInteger(clamped) ? `${clamped}/10` : `${clamped.toFixed(1)}/10`;
        return { scoreNumeric: clamped, scoreDisplay: display };
      }
    }

    // Fallback to evaluation_score
    if (attempt?.evaluation_score != null) {
      const raw = Number(attempt.evaluation_score);
      if (!Number.isNaN(raw)) {
        let num = raw;
        if (num > 10) {
          num = Math.round((num / 100) * 10 * 10) / 10;
        }
        const clamped = Math.max(0, Math.min(10, num));
        const display = Number.isInteger(clamped) ? `${clamped}/10` : `${clamped.toFixed(1)}/10`;
        return { scoreNumeric: clamped, scoreDisplay: display };
      }
    }

    return null;
  };

  // Real-time subscription for attempt updates
  useEffect(() => {
    let channel: any = null;

    const setupAttemptRealtimeSubscription = async () => {
      try {
        const { data: { session: authSession }, error: authError } = await supabase.auth.getSession();
        if (authError || !authSession?.user?.id) {
          return;
        }

        // Subscribe to changes in mock_interview_attempts table for this session
        channel = supabase
          .channel(`attempt_updates_${session.id}`)
          .on(
            'postgres_changes',
            {
              event: '*', // Listen to INSERT, UPDATE, DELETE
              schema: 'public',
              table: 'mock_interview_attempts',
              filter: `mock_interview_id=eq.${session.id}`
            },
            (payload) => {
              const newData = payload.new as MockInterviewAttempt;
              const oldData = payload.old as MockInterviewAttempt;
              
              // Handle INSERT events (new attempts created)
              if (payload.eventType === 'INSERT' && newData) {
                setAttempts(prevAttempts => {
                  // Check if attempt already exists to avoid duplicates
                  const exists = prevAttempts.some(attempt => attempt.id === newData.id);
                  if (exists) return prevAttempts;
                  
                  // Add new attempt and sort by attempt_number
                  return [...prevAttempts, newData].sort((a, b) => a.attempt_number - b.attempt_number);
                });
              }
              
              // Handle UPDATE events (status changes, feedback ready, etc.)
              else if (payload.eventType === 'UPDATE' && newData && oldData) {
                setAttempts(prevAttempts => {
                  return prevAttempts.map(attempt => {
                    if (attempt.id === newData.id) {
                      console.log(' Updating attempt:', attempt.id, 'from', oldData.status, 'to', newData.status);
                      return { ...attempt, ...newData };
                    }
                    return attempt;
                  });
                });

                // Handle status transitions and notifications
                const statusChanged = oldData.status !== newData.status;
                if (statusChanged) {
                  // Show appropriate notifications based on status change
                  if (newData.status === 'PROCESSED' && oldData.status !== 'PROCESSED') {
                    // optional: notify user
                  } else if (newData.status === 'completed' && oldData.status === 'active') {
                    // optional: notify user
                  } else if (newData.status === 'active' && oldData.status === 'pending') {
                    // optional: notify user
                  }
                  
                  // Force re-render of parent component to update stats for any status change
                  if (window.dispatchEvent) {
                    window.dispatchEvent(new CustomEvent('attemptStatusChanged', { 
                      detail: { 
                        sessionId: session.id, 
                        attemptId: newData.id, 
                        oldStatus: oldData.status,
                        newStatus: newData.status,
                        isCompleted: newData.status === 'PROCESSED'
                      } 
                    }));
                  }
                }
              }
            }
          )
          .subscribe((status) => {
            setRealtimeConnected(status === 'SUBSCRIBED');
          });

        setRealtimeChannel(channel);

      } catch (error) {
        console.error('Error setting up attempt real-time subscription:', error);
      }
    };

    // Always set up subscription for this session's attempts
    // This ensures we catch new attempts and status changes
    setupAttemptRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase, session.id]); // Always active for real-time updates

  // Fallback polling for active attempts to ensure status updates aren't missed
  useEffect(() => {
    const hasActiveAttempts = attempts.some(attempt => 
      attempt.status === 'active' || attempt.status === 'completed'
    );
    
    if (!hasActiveAttempts) return;
    
    const pollInterval = setInterval(async () => {
      try {
        const timeSinceLastCheck = Date.now() - lastStatusCheck;
        
        // Only poll if it's been more than 30 seconds since last check
        if (timeSinceLastCheck < 30000) return;
        
        const { data: sessionData, error: authError } = await supabase.auth.getSession();
        if (authError || !sessionData?.session?.access_token) return;

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
        if (!backendUrl) return;

        const response = await fetch(`${backendUrl}/mockInterview/session/${session.id}/attempts`, {
          method: 'GET',
          headers: getHeaders(sessionData.session.access_token, backendUrl)
        });

        if (response.ok) {
          const result = await response.json();
          const latestAttempts = result.attempts || [];
          
          // Check if any attempt status has changed
          const hasChanges = latestAttempts.some((latest: MockInterviewAttempt) => {
            const current = attempts.find(a => a.id === latest.id);
            return current && current.status !== latest.status;
          });
          
          if (hasChanges) {
            setAttempts(latestAttempts);
            setLastStatusCheck(Date.now());
          }
        }
      } catch (error) {
        console.error('Error in fallback polling:', error);
      }
    }, 15000); // Poll every 15 seconds for active attempts
    
    return () => {
      clearInterval(pollInterval);
    };
  }, [attempts, session.id, lastStatusCheck, supabase.auth, getHeaders]);

  const fetchAttempts = async () => {
    if (loadingAttempts) return;
    
    // If session already has attempts, use them and don't fetch again
    if (session.attempts && session.attempts.length > 0) {
      setAttempts(session.attempts);
      return;
    }
    
    setLoadingAttempts(true);
    try {
      // Get user session for authentication
      const { data: sessionData, error: authError } = await supabase.auth.getSession();
      if (authError || !sessionData?.session?.access_token) {
        console.error('Authentication required');
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
      if (!backendUrl) {
        console.error('Backend URL not configured');
        return;
      }

      // Fetch attempts for this session
      const response = await fetch(`${backendUrl}/mockInterview/session/${session.id}/attempts`, {
        method: 'GET',
        headers: getHeaders(sessionData.session.access_token, backendUrl)
      });

      if (!response.ok) {
        console.error('Failed to fetch attempts');
        return;
      }

      const result = await response.json();
      const fetchedAttempts = result.attempts || [];
      setAttempts(fetchedAttempts);
    } catch (error) {
      console.error('Error fetching attempts:', error);
    } finally {
      setLoadingAttempts(false);
    }
  };

  const handleToggleAttempts = () => {
    if (!showAttempts) {
      // Use session's attempts if available, otherwise fetch
      if (session.attempts && session.attempts.length > 0) {
        setAttempts(session.attempts);
      } else if (attempts.length === 0) {
        fetchAttempts();
      }
    }
    setShowAttempts(!showAttempts);
  };

  const handleStartInterview = async () => {
    if (isStarting) return;
    setIsStarting(true);
    try {
      // Get user session for authentication
      const { data: sessionData, error: authError } = await supabase.auth.getSession();
      if (authError || !sessionData?.session?.access_token) {
        setIsStarting(false);
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
      if (!backendUrl) {
        setIsStarting(false);
        return;
      }

      // Call join endpoint to create attempt and get room credentials
      const response = await fetch(`${backendUrl}/mockInterview/join/${session.id}`, {
        method: 'GET',
        headers: getHeaders(sessionData.session.access_token, backendUrl)
      });

      if (!response.ok) {
        const responseText = await response.text();
        console.error('Join request failed:', {
          status: response.status,
          statusText: response.statusText,
          responseText: responseText.substring(0, 500) // Log first 500 chars
        });

        // Check if response is HTML (ngrok landing page)
        if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
          console.error(' Received HTML instead of JSON for join - likely ngrok landing page');
          alert('Network error: Received unexpected response. Please check your connection.');
        } else {
          try {
            const errorData = JSON.parse(responseText);
            console.error('Join error data:', errorData);
            alert(`Failed to start interview: ${errorData.error || 'Unknown error'}`);
          } catch (parseError) {
            console.error(' Could not parse error response:', parseError);
            alert('Failed to start interview. Please try again.');
          }
        }
        return;
      }

      const joinData = await response.json();
      // Navigate to live session with credentials
      const sessionParams = new URLSearchParams({
        sessionId: session.id,
        serverUrl: joinData.livekit_url,
        roomName: joinData.room_name,
        participantToken: joinData.token,
        participantName: joinData.session.display_name || 'Participant'
      });

      router.push(`/dashboard/tools/mock-Interview/sessions?${sessionParams.toString()}`);
    } catch (error) {
      console.error(' Error starting interview:', error);
      alert('Failed to start interview. Please check your connection and try again.');
    }
  };

  const handleViewFeedback = (attemptId: string) => {
    router.push(`/dashboard/tools/mock-Interview/feedback/${attemptId}`);
  };

  // Check if any attempt is analyzing after attempts are loaded
  useEffect(() => {
    const hasAnalyzing = attempts.some(attempt => attempt.status === 'completed');
    setShowAnalyzingNotification(hasAnalyzing);
  }, [attempts]);

  // Auto-hide notification after 10 seconds of showing
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showAnalyzingNotification) {
      timer = setTimeout(() => {
        setShowAnalyzingNotification(false);
      }, 10000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showAnalyzingNotification]);

  return (
    <Card className="hover:shadow-xl transition-all duration-300 border border-gray-200/50 hover:border-green-300/50 animate-fade-in bg-white/80 backdrop-blur-sm hover:-translate-y-1 shadow-lg relative">
      {/* Analyzing Notification */}
      {showAnalyzingNotification && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-white px-4 py-2 rounded-lg shadow-xl border border-blue-100 flex items-center gap-3">
            <div className="p-1.5 bg-blue-100 rounded-full">
              <Clock size={14} className="text-blue-600 animate-pulse" />
            </div>
            <p className="text-sm text-blue-700 font-medium">
              Interview is being analyzed. Please check back in 3 minutes.
            </p>
          </div>
        </div>
      )}
      <CardContent className="p-6 bg-gradient-to-br from-white to-gray-50/30 rounded-lg">
        {/* Main Session Info */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{session.title}</h3>
              <Badge className={`text-xs ${getStatusColor(session.status)}`}>
                {getStatusDisplayText(session.status, getTotalAttemptsCount())}
              </Badge>
              <Badge variant="outline" className={`text-xs ${getTypeColor(session.type)}`}>
                {formatType(session.type)}
              </Badge>
            </div>
            
            {/* Role and Company Info */}
            <div className="space-y-2 mb-3">
              {session.role && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Briefcase size={14} />
                  <span>{session.role}</span>
                </div>
              )}
              {session.companyName && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Building2 size={14} />
                  <span>{session.companyName}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Score */}
          {(() => {
            const calculatedScore = calculateSessionScore();
            if (!calculatedScore) return null;
            
            // Extract numeric value for color calculation
            const scoreMatch = calculatedScore.match(/^(\d+\.?\d*)/);
            const numericScore = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
            
            return (
              <div className="flex items-center gap-2 ml-4">
                <Award size={16} className={getScoreColor(numericScore)} />
                <span className={`text-lg font-bold ${getScoreColor(numericScore)}`}>
                  {calculatedScore}
                </span>
              </div>
            );
          })()}
        </div>
        
        {/* Bottom Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{formatDate(session.date)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{session.duration} min</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Attempts Toggle Button */}
            <Button
              onClick={handleToggleAttempts}
              variant="outline"
              size="sm"
              className="border-gray-200 text-gray-600 hover:bg-gray-50 relative"
            >
              {showAttempts ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span className="ml-1">Attempts</span>
            </Button>

            {/* Primary Action Button - Only show if haven't reached 3 attempts */}
            {session.status === 'ready' && !hasReachedAttemptLimit() && (
              <Button
                size="sm"
                onClick={handleStartInterview}
                disabled={isStarting}
                aria-busy={isStarting}
                className={`
                  w-full sm:w-auto
                  flex items-center justify-center
                  bg-gradient-to-r from-emerald-600 to-green-600
                  hover:from-emerald-700 hover:to-green-700
                  text-white shadow-lg font-medium
                  px-3 sm:px-4 py-2
                  text-sm sm:text-base
                  ${isStarting ? 'opacity-60 pointer-events-none' : ''}
                `}
              >
                {isStarting ? (
                  <>
                    <Loader2 size={14} className="mr-1 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play size={14} className="mr-1 shrink-0" />
                    {getTotalAttemptsCount() === 0 ? 'Start Interview' : 'Continue'}
                    <span className="ml-1">({getTotalAttemptsCount() + 1}/3)</span>
                  </>
                )}
              </Button>
            )}

            {session.status === 'preparing' && (
              <Button
                size="sm"
                disabled
                className="bg-gradient-to-r from-orange-400 to-amber-400 text-white cursor-not-allowed shadow-sm font-medium"
              >
                <Clock size={14} className="mr-1 animate-pulse" />
                AI Agent Preparing...
              </Button>
            )}

            {/* Show completion message when 3 attempts reached */}
            {session.status === 'completed' && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-full shadow-sm">
                <Award size={14} className="text-orange-600" />
                <span className="text-sm font-bold text-orange-700">
                  All Attempts Exhausted ({getTotalAttemptsCount()}/3)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Attempts List (Expandable) */}
        {showAttempts && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="space-y-2">
              {loadingAttempts ? (
                <div className="text-center py-4 text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mx-auto mb-2"></div>
                  Loading attempts...
                </div>
              ) : attempts.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No attempts yet. Start your first interview!
                </div>
              ) : (
                attempts.map((attempt) => {
                  return (
                    <div 
                      key={attempt.id}
                      className="p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl border border-gray-200 hover:border-green-300 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-bold rounded-full">
                            {attempt.attempt_number}
                          </div>
                          <div className="text-sm font-bold text-gray-900">
                            Attempt #{attempt.attempt_number}
                          </div>
                          <Badge className={`text-xs ${getAttemptStatusColor(attempt.status)} font-medium px-3 py-1`}>
                            {getAttemptStatusDisplay(attempt.status).label}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(attempt.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Score and Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* START: only numeric score shown (no raw strings) */}
                          {(() => {
                            const parsed = parseAttemptScore(attempt);
                            if (!parsed) return null;
                            const colorClass = getScoreColor(parsed.scoreNumeric);
                            return (
                              <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border border-gray-200">
                                <Award size={14} className={colorClass} />
                                <span className={`text-sm font-bold ${colorClass}`}>{parsed.scoreDisplay}</span>
                              </div>
                            );
                          })()}
                          {/* END: only numeric score shown */}
                        </div>
                        <div className="flex items-center gap-2">
                          {attempt.status === 'PROCESSED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewFeedback(attempt.id)}
                              className="text-xs px-3 py-2 h-8 bg-white hover:bg-green-50 border-green-200 text-green-700 hover:text-green-800 font-medium"
                            >
                              <Eye size={12} className="mr-1" />
                              View Feedback
                            </Button>
                          )}
                          {attempt.status === 'failed' && onCleanupFailed && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={onCleanupFailed}
                              className="text-xs px-3 py-2 h-8 bg-white hover:bg-red-50 border-red-200 text-red-600 hover:text-red-700 font-medium"
                              title="Remove this failed attempt - it was caused by technical issues"
                            >
                              🧹 Clean Up
                            </Button>
                          )}
                          {attempt.status === 'completed' && (
                            <div className="relative group">
                              <div className="flex items-center gap-2 text-xs text-blue-600 px-3 py-1.5 bg-blue-50 rounded-lg cursor-help">
                                <div className="animate-spin rounded-full h-3 w-3 border border-blue-500 border-t-transparent"></div>
                                <span>Analyzing...</span>
                              </div>
                              
                              {/* Notification Popup */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <div className="bg-white p-3 rounded-lg shadow-xl border border-blue-100 text-sm">
                                  <div className="flex items-start gap-2 text-blue-700">
                                    <div className="p-1.5 bg-blue-100 rounded-full shrink-0 mt-0.5">
                                      <Clock size={12} className="animate-pulse" />
                                    </div>
                                    <p className="leading-tight">
                                      Your interview is being analyzed. This may take a few minutes. Please refresh the page after 3 minutes to check the status.
                                    </p>
                                  </div>
                                </div>
                                {/* Arrow */}
                                <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5">
                                  <div className="border-8 border-transparent border-t-white drop-shadow-lg"></div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SessionCard;
