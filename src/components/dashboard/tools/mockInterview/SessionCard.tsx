"use client";

import React from 'react';
import { Calendar, Clock, Play, MoreVertical, Award, Building2, Briefcase } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';

interface InterviewSession {
  id: string;
  title: string;
  type: 'behavioral' | 'technical' | 'system-design' | 'case-study';
  duration: number;
  status: 'completed' | 'in-progress' | 'scheduled';
  score?: number;
  date: Date;
  company?: string;
  role?: string;
  feedback?: string;
}

interface SessionCardProps {
  session: InterviewSession;
}

const SessionCard: React.FC<SessionCardProps> = ({ session }) => {
  const router = useRouter();

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
    switch (type) {
      case 'behavioral':
        return 'bg-purple-100 text-purple-700';
      case 'technical':
        return 'bg-blue-100 text-blue-700';
      case 'system-design':
        return 'bg-emerald-100 text-emerald-700';
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

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    return date.toLocaleDateString();
  };

  const handleAction = (action: string) => {
    switch (action) {
      case 'start':
      case 'continue':
        // Navigate to the interview session page
        router.push('/dashboard/tools/mock-Interview/sessions');
        break;
      case 'review':
        console.log('Review session:', session.id);
        break;
      case 'duplicate':
        console.log('Duplicate session:', session.id);
        break;
      case 'delete':
        console.log('Delete session:', session.id);
        break;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border border-gray-100 hover:border-green-200 animate-fade-in">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{session.title}</h3>
              <Badge className={`text-xs ${getStatusColor(session.status)}`}>
                {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
              </Badge>
              <Badge variant="outline" className={`text-xs ${getTypeColor(session.type)}`}>
                {session.type.charAt(0).toUpperCase() + session.type.slice(1).replace('-', ' ')}
              </Badge>
            </div>
            
            {/* Company and Role */}
            {(session.company || session.role) && (
              <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                {session.company && (
                  <div className="flex items-center gap-1">
                    <Building2 size={14} />
                    <span>{session.company}</span>
                  </div>
                )}
                {session.role && (
                  <div className="flex items-center gap-1">
                    <Briefcase size={14} />
                    <span>{session.role}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Feedback */}
            {session.feedback && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{session.feedback}</p>
            )}
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
            
            {session.status === 'completed' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction('review')}
                className="border-green-200 text-green-600 hover:bg-green-50"
              >
                Review
              </Button>
            )}
            
            {session.status === 'scheduled' && (
              <Button
                size="sm"
                onClick={() => handleAction('start')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Play size={14} className="mr-1" />
                Start
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleAction('duplicate')}>
                  Duplicate Session
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction('export')}>
                  Export Results
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleAction('delete')}
                  className="text-red-600"
                >
                  Delete Session
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionCard; 