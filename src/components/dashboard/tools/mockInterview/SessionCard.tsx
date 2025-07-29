"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Play, MoreVertical, Award, Building2, Briefcase, ChevronDown, ChevronUp, Eye, RotateCcw, Trash2, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
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
  status: 'completed' | 'in-progress' | 'scheduled' | 'ready' | 'done';
  score?: number; // Calculated from attempts
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
      case 'in-progress':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'done':
      case 'ready':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'scheduled':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusDisplayText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      case 'done':
        return 'Ready to Start';
      case 'ready':
        return 'Ready to Start';
      case 'scheduled':
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
      
      // Calculate the average score from all completed attempts
      const scores = completedAttempts.map(attempt => {
        if (attempt.feedback?.Score) {
          // Parse "7.5/10" format to percentage
          const scoreMatch = attempt.feedback.Score.match(/^(\d+\.?\d*)/);
          return scoreMatch ? (parseFloat(scoreMatch[1]) / 10) * 100 : 0;
        }
        return attempt.evaluation_score || 0;
      });
      
      // Return average instead of maximum
      const totalScore = scores.reduce((sum, score) => sum + score, 0);
      return Math.round(totalScore / scores.length);
    }
    return session.score;
  };

  const getCompletedAttemptsCount = () => {
    return session.attempts?.filter(attempt => attempt.status === 'PROCESSED').length || 0;
  };

  const hasReachedAttemptLimit = () => {
    return getCompletedAttemptsCount() >= 3;
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

  const handleCompanyClick = () => {
    if (session.companyUrl) {
      window.open(session.companyUrl, '_blank');
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

  const handleAction = async (action: string) => {
    switch (action) {
      case 'start':
      case 'continue':
        await handleStartInterview();
        break;
      case 'duplicate':
        console.log('Duplicate session:', session.id);
        break;
      case 'delete':
        console.log('Delete session:', session.id);
        break;
    }
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
                {getStatusDisplayText(session.status)}
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
              {session.companyUrl && (
                <button
                  onClick={handleCompanyClick}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                  title="View job posting"
                >
                  <ExternalLink size={14} />
                  <span>View Job Posting</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Score */}
          {(() => {
            const calculatedScore = calculateSessionScore();
            return calculatedScore && (
              <div className="flex items-center gap-2 ml-4">
                <Award size={16} className={getScoreColor(calculatedScore)} />
                <span className={`text-lg font-bold ${getScoreColor(calculatedScore)}`}>
                  {Math.round(calculatedScore)}%
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

            {/* Primary Action Button */}
            {session.status === 'in-progress' && !hasReachedAttemptLimit() && (
              <Button
                size="sm"
                onClick={() => handleAction('continue')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Play size={14} className="mr-1" />
                Continue
              </Button>
            )}

            {session.status === 'done' && !hasReachedAttemptLimit() && (
              <Button
                size="sm"
                onClick={() => handleAction('start')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Play size={14} className="mr-1" />
                Start Interview
              </Button>
            )}

            {session.status === 'scheduled' && !hasReachedAttemptLimit() && (
              <Button
                size="sm"
                disabled
                className="bg-gray-400 text-white cursor-not-allowed"
              >
                <Clock size={14} className="mr-1" />
                Preparing...
              </Button>
            )}

            {session.status === 'ready' && !hasReachedAttemptLimit() && (
              <Button
                size="sm"
                onClick={() => handleAction('start')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Play size={14} className="mr-1" />
                Start Interview
              </Button>
            )}
            
            {session.status === 'completed' && !hasReachedAttemptLimit() && (
              <Button
                size="sm"
                onClick={() => handleAction('start')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Play size={14} className="mr-1" />
                Practice Again
              </Button>
            )}

            {/* Show completion message when attempt limit is reached */}
            {hasReachedAttemptLimit() && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-full">
                <Award size={14} className="text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  Session Complete ({getCompletedAttemptsCount()}/3 attempts)
                </span>
              </div>
            )}
            
            {/* More Options Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleAction('duplicate')}>
                  <RotateCcw size={14} className="mr-2" />
                  Duplicate Session
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleAction('delete')}
                  className="text-red-600"
                >
                  <Trash2 size={14} className="mr-2" />
                  Delete Session
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                        let score = null;
                        if (attempt.feedback?.Score) {
                          // Parse "7.5/10" format
                          const scoreMatch = attempt.feedback.Score.match(/^(\d+\.?\d*)/);
                          if (scoreMatch) {
                            score = (parseFloat(scoreMatch[1]) / 10) * 100;
                          }
                        } else if (attempt.evaluation_score) {
                          score = attempt.evaluation_score;
                        }
                        
                        return score && (
                          <div className="flex items-center gap-1">
                            <Award size={12} className={getScoreColor(score)} />
                            <span className={`text-sm font-medium ${getScoreColor(score)}`}>
                              {attempt.feedback?.Score || `${Math.round(score)}%`}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-500">
                        {new Date(attempt.created_at).toLocaleDateString()}
                      </div>
                      {(attempt.status === 'PROCESSED' || attempt.status === 'completed') && (
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