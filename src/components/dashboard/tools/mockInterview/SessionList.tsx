// components/SessionsList.tsx
import React from 'react';
import { useInfiniteScroll } from '@/hooks/use-infiniteScroll';

// Interface for session data from the hook
interface Session {
  id: string;
  title: string;
  position: string;
  company_name: string;
  interview_type: string;
  status: string;
  status_prep?: string;
  created_at: string;
  display_text: string;
  color_class: string;
  is_ready_to_join: boolean;
}

const SessionsList = () => {
  const { 
    sessions, 
    loading, 
    initialLoading, 
    error, 
    hasMore, 
    refresh,
    loadMore 
  } = useInfiniteScroll('/mockInterview/sessions');

  if (initialLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading sessions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-500 mb-4">Error: {error}</div>
        <button 
          onClick={refresh}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sessions List */}
      {sessions.map((session) => (
        <SessionCard key={session.id} session={session} />
      ))}
      
      {/* Loading More Indicator */}
      {loading && (
        <div className="flex justify-center p-6">
          <div className="flex items-center space-x-3 px-6 py-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
            <span className="text-blue-700 font-medium">Loading more sessions...</span>
          </div>
        </div>
      )}
      
      {/* Pretty Load More Button */}
      {hasMore && !loading && sessions.length > 0 && (
        <div className="flex justify-center p-6">
          <button
            onClick={loadMore}
            className="group relative inline-flex items-center justify-center px-8 py-3 text-sm font-semibold text-white transition-all duration-200 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:-translate-y-0.5"
          >
            <svg 
              className="w-4 h-4 mr-2 transition-transform group-hover:translate-y-0.5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            Load More Sessions
            <div className="absolute inset-0 rounded-lg bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
          </button>
        </div>
      )}
      
      {/* No Sessions */}
      {!loading && !initialLoading && sessions.length === 0 && (
        <div className="text-center p-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Sessions Found</h3>
          <p className="text-gray-500">Create your first interview session to get started!</p>
        </div>
      )}
    </div>
  );
};

interface SessionCardProps {
  session: Session;
}

const SessionCard: React.FC<SessionCardProps> = ({ session }) => {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg">{session.title}</h3>
        <span className={`px-2 py-1 rounded text-sm ${session.color_class}`}>
          {session.display_text}
        </span>
      </div>
      
      <div className="text-gray-600 text-sm space-y-1">
        <div>Position: {session.position}</div>
        <div>Company: {session.company_name}</div>
        <div>Type: {session.interview_type}</div>
        <div>Created: {new Date(session.created_at).toLocaleDateString()}</div>
      </div>
      
      {session.is_ready_to_join && (
        <button className="mt-3 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          Join Interview
        </button>
      )}
    </div>
  );
};

export default SessionsList;