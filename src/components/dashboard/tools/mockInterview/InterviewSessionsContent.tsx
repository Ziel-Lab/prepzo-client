"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Play, MoreVertical, Filter, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import SessionCard from './SessionCard';
import NewSessionModal from './NewSessionModal';
import SessionStatsCard from './SessionStatsCard';

interface InterviewSession {
  id: string;
  title: string;
  type: 'behavioral' | 'technical' | 'system-design' | 'case-study';
  duration: number; // in minutes
  status: 'completed' | 'in-progress' | 'scheduled';
  score?: number;
  date: Date;
  company?: string;
  role?: string;
  feedback?: string;
}

const InterviewSessionsContent = () => {
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<InterviewSession[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - replace with actual API call
  const mockSessions: InterviewSession[] = [
    {
      id: '1',
      title: 'Senior Software Engineer Interview',
      type: 'technical',
      duration: 45,
      status: 'completed',
      score: 85,
      date: new Date('2024-01-15'),
      company: 'Google',
      role: 'Senior Software Engineer',
      feedback: 'Strong technical knowledge, good problem-solving approach'
    },
    {
      id: '2',
      title: 'Product Manager Behavioral',
      type: 'behavioral',
      duration: 30,
      status: 'completed',
      score: 92,
      date: new Date('2024-01-12'),
      company: 'Microsoft',
      role: 'Product Manager',
      feedback: 'Excellent communication and leadership examples'
    },
    {
      id: '3',
      title: 'System Design Practice',
      type: 'system-design',
      duration: 60,
      status: 'in-progress',
      date: new Date('2024-01-16'),
      company: 'Amazon',
      role: 'Principal Engineer'
    },
    {
      id: '4',
      title: 'Consulting Case Interview',
      type: 'case-study',
      duration: 45,
      status: 'scheduled',
      date: new Date('2024-01-18'),
      company: 'McKinsey',
      role: 'Associate'
    },
    {
      id: '5',
      title: 'Data Scientist Technical Round',
      type: 'technical',
      duration: 50,
      status: 'completed',
      score: 78,
      date: new Date('2024-01-10'),
      company: 'Netflix',
      role: 'Data Scientist',
      feedback: 'Good statistical knowledge, could improve coding efficiency'
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setSessions(mockSessions);
      setFilteredSessions(mockSessions);
      setIsLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = sessions;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(session =>
        session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.role?.toLowerCase().includes(searchTerm.toLowerCase())
      );
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
    avgScore: Math.round(
      sessions.filter(s => s.score).reduce((acc, s) => acc + (s.score || 0), 0) /
      sessions.filter(s => s.score).length || 0
    ),
    totalTime: sessions.reduce((acc, s) => acc + s.duration, 0)
  };

  const handleNewSession = (sessionData: Partial<InterviewSession>) => {
    const newSession: InterviewSession = {
      id: Date.now().toString(),
      title: sessionData.title || 'New Interview Session',
      type: sessionData.type || 'behavioral',
      duration: sessionData.duration || 30,
      status: 'scheduled',
      date: sessionData.date || new Date(),
      company: sessionData.company,
      role: sessionData.role
    };

    setSessions(prev => [newSession, ...prev]);
    setIsNewSessionModalOpen(false);
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
            icon={Play}
            color="purple"
          />
          <SessionStatsCard
            title="Total Time"
            value={`${Math.floor(stats.totalTime / 60)}h ${stats.totalTime % 60}m`}
            icon={Clock}
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
        />
      </div>
    </div>
  );
};

export default InterviewSessionsContent; 