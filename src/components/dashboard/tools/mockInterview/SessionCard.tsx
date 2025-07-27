"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Play, MoreVertical, Award, Building2, Briefcase, ChevronDown, ChevronUp, Eye, RotateCcw, Trash2, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

// Updated interface matching the database structure
interface InterviewSession {
  id: string;
  title: string;
  type: string; // Changed from union to string to match database
  duration: number;
  status: 'completed' | 'in-progress' | 'scheduled';
  score?: number;
  date: Date;
  companyUrl?: string; // Changed from company to companyUrl
  role?: string;
  feedback?: string;
  attempts?: any[]; // For future use
  latestAttempt?: any; // For future use
}

interface Attempt {
  id: string;
  attempt_number: number;
  status: string;
  started_at: string;
  completed_at?: string;
  actual_duration_minutes?: number;
  evaluation_score?: number;
  feedback?: any;
  created_at: string;
}

interface SessionCardProps {
  session: InterviewSession;
}

const SessionCard: React.FC<SessionCardProps> = ({ session }) => {
  const router = useRouter();
  const supabase = createClient();
  const [showAttempts, setShowAttempts] = useState(false);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'scheduled':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
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
    if (!showAttempts && attempts.length === 0) {
      fetchAttempts();
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
                {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
              </Badge>
              <Badge variant="outline" className={`text-xs ${getTypeColor(session.type)}`}>
                {formatType(session.type)}
              </Badge>
            </div>
            
            {/* Role and Company URL */}
            <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
              {session.role && (
                <div className="flex items-center gap-1">
                  <Briefcase size={14} />
                  <span>{session.role}</span>
                </div>
              )}
              {session.companyUrl && (
                <button
                  onClick={handleCompanyClick}
                  className="flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer"
                  title="View job posting"
                >
                  <ExternalLink size={14} />
                  <span>{extractDomain(session.companyUrl)}</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Score */}
          {session.score && (
            <div className="flex items-center gap-2 ml-4">
              <Award size={16} className={getScoreColor(session.score)} />
              <span className={`text-lg font-bold ${getScoreColor(session.score)}`}>
                {session.score}%
              </span>
            </div>
          )}
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
            {session.status === 'in-progress' && (
              <Button
                size="sm"
                onClick={() => handleAction('continue')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Play size={14} className="mr-1" />
                Continue
              </Button>
            )}
            
            {(session.status === 'completed' || session.status === 'scheduled') && (
              <Button
                size="sm"
                onClick={() => handleAction('start')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Play size={14} className="mr-1" />
                {session.status === 'completed' ? 'Practice Again' : 'Start'}
              </Button>
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
                      {attempt.evaluation_score && (
                        <div className="flex items-center gap-1">
                          <Award size={12} className={getScoreColor(attempt.evaluation_score)} />
                          <span className={`text-sm font-medium ${getScoreColor(attempt.evaluation_score)}`}>
                            {Math.round(attempt.evaluation_score)}%
                          </span>
                        </div>
                      )}
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