"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Play, Award, Building2, Briefcase, ChevronDown, ChevronUp, Eye } from 'lucide-react';
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
}

const SessionCard: React.FC<SessionCardProps> = ({ session }) => {
  const router = useRouter();
  const supabase = createClient();
  const [showAttempts, setShowAttempts] = useState(false);
  const [attempts, setAttempts] = useState<MockInterviewAttempt[]>(session.attempts || []);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);

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
        return `Session Complete (${attemptCount}/3)`;
      case 'ready':
        return attemptCount === 0 ? 'Ready to Begin' : 'Ready to Continue';
      case 'preparing':
        return 'Setting up...';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const calculateSessionScore = () => {
    if (session.attempts && session.attempts.length > 0) {
      const completedAttempts = session.attempts.filter(attempt => 
        attempt.status === 'PROCESSED' && (attempt.feedback?.Score || attempt.evaluation_score)
      );
      
      if (completedAttempts.length === 0) return undefined;
      
      // Calculate the average score as rating out of 10
      const scores = completedAttempts.map(attempt => {
        if (attempt.feedback?.Score) {
          // Parse "7.5/10" format
          const scoreMatch = attempt.feedback.Score.match(/^(\d+\.?\d*)/);
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
    return session.attempts?.filter(attempt => attempt.status === 'PROCESSED').length || 0;
  };

  const getTotalAttemptsCount = () => {
    return session.attempts?.length || 0;
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

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-emerald-600';
    if (score >= 70) return 'text-yellow-600';
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

  // Real-time subscription for attempt updates
  useEffect(() => {
    let channel: any = null;

    const setupAttemptRealtimeSubscription = async () => {
      try {
        const { data: { session: authSession }, error: authError } = await supabase.auth.getSession();
        if (authError || !authSession?.user?.id) {
          console.log('🔔 No authenticated user for attempt real-time subscription');
          return;
        }

        console.log('🔔 Setting up real-time subscription for attempts in session:', session.id);

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
              
              console.log('🔔 Real-time attempt update received:', {
                eventType: payload.eventType,
                attemptId: newData?.id,
                oldStatus: oldData?.status,
                newStatus: newData?.status,
                sessionId: session.id,
                timestamp: new Date().toISOString()
              });
              
              // Handle INSERT events (new attempts created)
              if (payload.eventType === 'INSERT' && newData) {
                console.log('🎉 New attempt created via real-time, adding to list');
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
                console.log('🔔 Attempt updated via real-time, updating display');
                
                setAttempts(prevAttempts => {
                  return prevAttempts.map(attempt => {
                    if (attempt.id === newData.id) {
                      console.log('🔄 Updating attempt:', attempt.id, 'from', oldData.status, 'to', newData.status);
                      return { ...attempt, ...newData };
                    }
                    return attempt;
                  });
                });

                // Show notification when feedback becomes ready
                if (newData.status === 'PROCESSED' && oldData.status !== 'PROCESSED') {
                  console.log('🎉 Feedback is now ready for attempt:', newData.id);
                  // You can add a toast notification here if you have a toast system
                }
              }
            }
          )
          .subscribe((status) => {
            console.log('🔔 Attempt real-time subscription status:', status);
          });

        setRealtimeChannel(channel);

      } catch (error) {
        console.error('❌ Error setting up attempt real-time subscription:', error);
      }
    };

    // Only set up subscription if we have attempts or are showing attempts
    if (attempts.length > 0 || showAttempts) {
      setupAttemptRealtimeSubscription();
    }

    return () => {
      console.log('🔔 Cleaning up attempt real-time subscription for session:', session.id);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase, session.id, showAttempts]); // Re-run when showAttempts changes

  const fetchAttempts = async () => {
    if (loadingAttempts) return;
    
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
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch attempts');
        return;
      }

      const result = await response.json();
      setAttempts(result.attempts || []);
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

      // Call join endpoint to create attempt and get room credentials
      const response = await fetch(`${backendUrl}/mockInterview/join/${session.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to join session:', errorData.error);
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
      console.error('Error starting interview:', error);
    }
  };

  const handleViewFeedback = (attemptId: string) => {
    router.push(`/dashboard/tools/mock-Interview/feedback/${attemptId}`);
  };

  return (
    <Card className="hover:shadow-xl transition-all duration-300 border border-gray-200/50 hover:border-green-300/50 animate-fade-in bg-white/80 backdrop-blur-sm hover:-translate-y-1 shadow-lg">
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
              className="border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              {showAttempts ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span className="ml-1">Attempts</span>
            </Button>

            {/* Primary Action Button - Only show if haven't reached 3 attempts */}
            {session.status === 'ready' && !hasReachedAttemptLimit() && (
              <Button
                size="sm"
                onClick={handleStartInterview}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg font-medium"
              >
                <Play size={14} className="mr-1" />
                {getTotalAttemptsCount() === 0 ? 'Start Interview' : 'Continue'} ({getTotalAttemptsCount() + 1}/3)
              </Button>
            )}

            {session.status === 'preparing' && (
              <Button
                size="sm"
                disabled
                className="bg-gradient-to-r from-orange-400 to-amber-400 text-white cursor-not-allowed shadow-sm font-medium"
              >
                <Clock size={14} className="mr-1 animate-pulse" />
                Setting up...
              </Button>
            )}

            {/* Show completion message when 3 attempts reached */}
            {session.status === 'completed' && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full shadow-sm">
                <Award size={14} className="text-green-600" />
                <span className="text-sm font-bold text-green-700">
                  Session Complete ({getTotalAttemptsCount()}/3)
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
                      {(() => {
                        let scoreDisplay = null;
                        let scoreNumeric = 0;
                        
                        if (attempt.feedback?.Score) {
                          // Show original "X/10" format
                          scoreDisplay = attempt.feedback.Score;
                          const scoreMatch = attempt.feedback.Score.match(/^(\d+\.?\d*)/);
                          scoreNumeric = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
                        } else if (attempt.evaluation_score) {
                          // Convert to rating format, never percentage
                          if (attempt.evaluation_score <= 10) {
                            scoreDisplay = `${attempt.evaluation_score}/10`;
                            scoreNumeric = attempt.evaluation_score;
                          } else {
                            // Convert percentage to rating out of 10
                            const rating = Math.round((attempt.evaluation_score / 100) * 10);
                            scoreDisplay = `${rating}/10`;
                            scoreNumeric = rating;
                          }
                        }
                        
                          return scoreDisplay && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border border-gray-200">
                              <Award size={14} className={getScoreColor(scoreNumeric)} />
                              <span className={`text-sm font-bold ${getScoreColor(scoreNumeric)}`}>
                                {scoreDisplay}
                              </span>
                            </div>
                          );
                        })()}
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
                          {attempt.status === 'completed' && (
                            <div className="flex items-center gap-2 text-xs text-blue-600 px-2 py-1 bg-blue-50 rounded-lg">
                              <div className="animate-spin rounded-full h-3 w-3 border border-blue-500 border-t-transparent"></div>
                              <span>Processing...</span>
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