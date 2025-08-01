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
        return attemptCount === 0 ? 'Ready to Start' : 'Ready to Continue';
      case 'preparing':
        return 'Preparing...';
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

  const getAttemptStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'processed':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'active':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
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
    <Card className="hover:shadow-lg transition-all duration-200 border border-gray-100 hover:border-green-200 animate-fade-in">
      <CardContent className="p-6">
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
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Play size={14} className="mr-1" />
                Begin Interview ({getTotalAttemptsCount() + 1}/3)
              </Button>
            )}

            {session.status === 'preparing' && (
              <Button
                size="sm"
                disabled
                className="bg-gray-400 text-white cursor-not-allowed"
              >
                <Clock size={14} className="mr-1" />
                Preparing...
              </Button>
            )}

            {/* Show completion message when 3 attempts reached */}
            {session.status === 'completed' && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-full">
                <Award size={14} className="text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  All Attempts Complete ({getTotalAttemptsCount()}/3)
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
                attempts.map((attempt) => (
                  <div 
                    key={attempt.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-gray-900">
                        Attempt #{attempt.attempt_number}
                      </div>
                      <Badge className={`text-xs ${getAttemptStatusColor(attempt.status)}`}>
                        {attempt.status}
                      </Badge>
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
                          <div className="flex items-center gap-1">
                            <Award size={12} className={getScoreColor(scoreNumeric)} />
                            <span className={`text-sm font-medium ${getScoreColor(scoreNumeric)}`}>
                              {scoreDisplay}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-500">
                        {new Date(attempt.created_at).toLocaleDateString()}
                      </div>
                      {attempt.status === 'PROCESSED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewFeedback(attempt.id)}
                          className="text-xs px-2 py-1 h-7"
                        >
                          <Eye size={12} className="mr-1" />
                          View Feedback
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SessionCard; 