"use client";

import React, { Suspense } from 'react';
import { Calendar, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SessionCard from './SessionCard';

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
  feedback?: any;
  evaluation_score?: number;
  created_at: string;
  updated_at: string;
}

interface InterviewSession {
  id: string;
  title: string;
  type: string;
  duration: number;
  status: 'completed' | 'ready' | 'preparing';
  score?: string;
  date: Date;
  companyUrl?: string;
  companyName?: string;
  role?: string;
  feedback?: string;
  attempts: MockInterviewAttempt[];
  latestAttempt?: MockInterviewAttempt;
  attempts_count: number;
  is_attempts_exhausted: boolean;
  processed_attempts_count: number;
}

interface SessionsListSectionProps {
  filteredSessions: InterviewSession[];
  sessions: InterviewSession[];
  searchTerm: string;
  statusFilter: string;
  typeFilter: string;
  loadingMore: boolean;
  hasMore: boolean;
  nextCursor: string | null;
  onSetNewSessionModalOpen: (open: boolean) => void;
  onLoadMore: () => void;
  onCleanupFailed: () => void;
}

const SkeletonSessionCard = () => (
  <Card className="border border-gray-200/50 bg-white/80 backdrop-blur-sm">
    <CardContent className="p-6">
      <div className="animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-5 bg-gray-200 rounded w-48"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-28"></div>
            </div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-20"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Lazy loading wrapper for SessionCard
const LazySessionCard: React.FC<{ session: InterviewSession; index: number; onCleanupFailed?: () => void }> = ({ session, index, onCleanupFailed }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [hasLoaded, setHasLoaded] = React.useState(false);

  React.useEffect(() => {
    // Load first 3 sessions immediately, then lazy load others
    if (index < 3) {
      setIsVisible(true);
      setHasLoaded(true);
      return;
    }

    // Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasLoaded) {
            setIsVisible(true);
            setHasLoaded(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '200px' }
    );

    const element = document.getElementById(`session-${session.id}`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [index, session.id, hasLoaded]);

  if (!isVisible) {
    return (
      <div 
        id={`session-${session.id}`} 
        className="h-48"
      >
        <SkeletonSessionCard />
      </div>
    );
  }

  return <SessionCard session={session} onCleanupFailed={onCleanupFailed} />;
};

const SessionsListSection: React.FC<SessionsListSectionProps> = ({
  filteredSessions,
  sessions,
  searchTerm,
  statusFilter,
  typeFilter,
  loadingMore,
  hasMore,
  nextCursor,
  onSetNewSessionModalOpen,
  onLoadMore,
  onCleanupFailed
}) => {
  if (filteredSessions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 sm:p-8 lg:p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Calendar size={40} className="mx-auto sm:w-12 sm:h-12" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-600 mb-2">No sessions found</h3>
          <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6 max-w-md mx-auto">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your filters or search terms'
              : sessions.length > 0 
                ? 'All sessions are filtered out. Try clearing your filters.'
                : 'Start practicing with your first interview session'}
          </p>
          <Button
            onClick={() => onSetNewSessionModalOpen(true)}
            variant="outline"
            className="w-full sm:w-auto border-green-200 text-green-600 hover:bg-green-50 text-sm sm:text-base"
          >
            <Plus size={16} className="mr-2" />
            Create Your First Session
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Suspense fallback={
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <SkeletonSessionCard key={i} />
        ))}
      </div>
    }>
      {filteredSessions.map((session, index) => (
        <LazySessionCard 
          key={session.id} 
          session={session} 
          index={index} 
          onCleanupFailed={onCleanupFailed}
        />
      ))}
      
      {/* Loading More Indicator */}
      {loadingMore && (
        <Card className="border-green-100 bg-green-50/30">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <div className="flex justify-center items-center">
              <div className="flex items-center space-x-3 sm:space-x-4 px-4 sm:px-6 py-3 sm:py-4 bg-white/80 rounded-xl border border-green-200 shadow-sm">
                <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-2 border-green-500 border-t-transparent"></div>
                <span className="text-green-700 font-medium text-sm sm:text-base lg:text-lg">Loading more sessions...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Load More Button */}
      {hasMore && !loadingMore && sessions.length > 0 && nextCursor && (
        <Card className="border-green-100 bg-gradient-to-br from-green-50/50 to-emerald-50/30">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <div className="flex justify-center">
              <button
                onClick={onLoadMore}
                className="group relative inline-flex items-center justify-center w-full sm:w-auto px-6 sm:px-8 lg:px-10 py-3 sm:py-4 text-sm sm:text-base font-semibold text-white transition-all duration-300 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl hover:from-green-700 hover:to-emerald-700 hover:shadow-xl hover:shadow-green-500/25 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transform hover:-translate-y-1 active:translate-y-0"
              >
                <svg 
                  className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 transition-transform group-hover:translate-y-1" 
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
    </Suspense>
  );
};

export default SessionsListSection;
