"use client";

import React, { useState, useEffect } from 'react';
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
  title: string;
  type: string;
  duration: number;
  status: 'completed' | 'in-progress' | 'scheduled';
  score?: number;
  date: Date;
  companyUrl?: string; // Changed from company to companyUrl
  role?: string;
  feedback?: string;
  attempts: MockInterviewAttempt[];
  latestAttempt?: MockInterviewAttempt;
}

const InterviewSessionsContent = () => {
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<InterviewSession[]>([]);
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
  const fetchUserLimits = async () => {
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
  };

  // Fetch data from backend API instead of direct Supabase
  useEffect(() => {
    const fetchInterviewData = async () => {
      try {
        setIsLoading(true);
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

        // Fetch sessions from backend API
        const response = await fetch(`${backendUrl}/mockInterview/sessions`, {
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
          setFilteredSessions([]);
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

          // Map backend session to frontend format
          const sessionItem: InterviewSession = {
            id: backendSession.id,
            title: generateSessionTitle(backendSession),
            type: backendSession.interview_type || 'behavioral',
            duration: backendSession.duration_minutes || 30,
            status: mapBackendStatusToFrontend(backendSession.display_status || backendSession.status),
            score: undefined, // Will be filled by attempts if available
            date: new Date(backendSession.created_at),
            companyUrl: backendSession.company_url || undefined,
            role: backendSession.position || undefined,
            feedback: undefined, // Will be filled by attempts if available
            attempts: [], // Will be filled if needed
            latestAttempt: undefined
          };

          console.log('✅ Transformed session item:', sessionItem);
          return sessionItem;
        });

        console.log('🎯 Final session data:', sessionData.length, sessionData);

        setSessions(sessionData);
        setFilteredSessions(sessionData);

      } catch (error) {
        console.error('💥 Error in fetchInterviewData:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch interview data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInterviewData();
    fetchUserLimits();
  }, [supabase]);

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
  const mapBackendStatusToFrontend = (backendStatus: string): 'completed' | 'in-progress' | 'scheduled' => {
    switch (backendStatus?.toLowerCase()) {
      case 'completed':
        return 'completed';
      case 'active':
      case 'in-progress':
        return 'in-progress';
      case 'ready':
      case 'scheduled':
      case 'created':
      default:
        return 'scheduled';
    }
  };

  useEffect(() => {
    let filtered = sessions;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(session => {
        const extractDomain = (url: string) => {
          try {
            return new URL(url).hostname.replace('www.', '');
          } catch {
            return url;
          }
        };
        
        return session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (session.companyUrl && extractDomain(session.companyUrl).toLowerCase().includes(searchTerm.toLowerCase())) ||
          session.role?.toLowerCase().includes(searchTerm.toLowerCase());
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

    setFilteredSessions(filtered);
  }, [sessions, searchTerm, statusFilter, typeFilter]);

  const stats = {
    total: sessions.length,
    completed: sessions.filter(s => s.status === 'completed').length,
    avgScore: (() => {
      const sessionsWithScores = sessions.filter(s => s.score);
      if (sessionsWithScores.length === 0) return 0;
      const total = sessionsWithScores.reduce((acc, s) => acc + (s.score || 0), 0);
      return Math.round(total / sessionsWithScores.length);
    })(),
    totalTime: sessions.reduce((acc, s) => acc + s.duration, 0)
  };

  const handleNewSession = async (sessionData: any) => {
    try {
      // Get user session for authentication
      const { data: authData, error: authError } = await supabase.auth.getSession();
      if (authError || !authData?.session?.access_token) {
        setError('Authentication required');
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
      if (!backendUrl) {
        setError('Backend URL not configured');
        return;
      }

      // Call backend create-session endpoint
      const response = await fetch(`${backendUrl}/mockInterview/create-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authData.session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: sessionData.title,
          interview_type: sessionData.type,
          difficulty_level: 'medium', // Default
          position: sessionData.role || 'Software Engineer',
          company_url: sessionData.companyUrl || '',
          job_description: sessionData.jobDescription,
          custom_instructions: sessionData.description || '',
          resume_url: sessionData.resumeUrl,
          resume_document_id: sessionData.resumeDocumentId,
          cover_letter_url: sessionData.coverLetterUrl,
          cover_letter_document_id: sessionData.coverLetterDocumentId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create session');
      }

      const result = await response.json();
      console.log('Session created successfully:', result);

      // Close modal and refresh data
      setIsNewSessionModalOpen(false);
      
      // Refresh the page to show the new session
      window.location.reload();

    } catch (error) {
      console.error('Error creating session:', error);
      setError(error instanceof Error ? error.message : 'Failed to create session');
    }
  };

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
            value={`${stats.avgScore}%`}
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
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
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

        {/* Debug Info (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Debug Info</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>📊 Total sessions: {sessions.length}</p>
                <p>🔍 Filtered sessions: {filteredSessions.length}</p>
                <p>⚡ Loading: {isLoading ? 'Yes' : 'No'}</p>
                <p>❌ Error: {error || 'None'}</p>
                <p>🔍 Search term: "{searchTerm}"</p>
                <p>📋 Status filter: {statusFilter}</p>
                <p>🏷️ Type filter: {typeFilter}</p>
              </div>
            </CardContent>
          </Card>
        )}

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