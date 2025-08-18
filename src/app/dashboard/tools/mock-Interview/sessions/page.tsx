"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MockInterviewLiveKit from '@/components/dashboard/tools/mockInterview/MockInterviewLiveKit';
import { createClient } from '@/utils/supabase/client';
import type { MockInterviewConnectionDetails } from '@/app/api/mock-interview-token/route';

interface SessionData {
  id: string;
  title: string;
  interview_type: string;
  difficulty_level: string;
  position: string;
  company_name: string;
  duration_minutes: number;
  status: string;
  created_at: string;
}

// Loading component for Suspense fallback
const SessionsLoading = () => (
  <div className="min-h-screen bg-white flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading session parameters...</p>
    </div>
  </div>
);

// Main component that uses useSearchParams
const MockInterviewSessionsContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [connectionDetails, setConnectionDetails] = useState<MockInterviewConnectionDetails | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        // Try to get connection details from URL parameters
        const sessionId = searchParams.get('sessionId');
        const serverUrl = searchParams.get('serverUrl');
        const roomName = searchParams.get('roomName');
        const participantToken = searchParams.get('participantToken');
        const participantName = searchParams.get('participantName');

        console.log('🔍 Sessions page URL parameters:', {
          sessionId,
          serverUrl,
          roomName,
          participantToken,
          participantName
        });

        if (!sessionId) {
          setError('Missing session ID');
          router.push('/dashboard/tools/mock-Interview');
          return;
        }

        // Fetch session data from backend
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError || !session?.access_token) {
          setError('Authentication required');
          router.push('/auth/login');
          return;
        }

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
        if (!backendUrl) {
          setError('Backend configuration error');
          return;
        }

        const response = await fetch(`${backendUrl}/mockInterview/session/${sessionId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to fetch session data' }));
          throw new Error(errorData.error || 'Failed to fetch session data');
        }

        const result = await response.json();
        setSessionData(result.session);

        // Get user data for connection details
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('Authentication required');
          router.push('/dashboard/tools/mock-Interview');
          return;
        }

        // Set connection details if available from URL params
        if (serverUrl && roomName && participantToken && participantName) {
          setConnectionDetails({
            sessionId,
            serverUrl,
            roomName,
            participantToken,
            participantName,
            userId: user.id,
            userEmail: user.email || '',
            userName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
          });
        } else {
          // No valid parameters, redirect back to mock interview page
          console.error('❌ Missing required session parameters:', {
            sessionId,
            serverUrl,
            roomName,
            participantToken,
            participantName
          });
          setError('Missing interview session parameters. Please try starting the interview again.');
          return;
        }

      } catch (error: any) {
        console.error('Error fetching session data:', error);
        setError(error.message || 'Failed to load session data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionData();
  }, [searchParams, router, supabase.auth]);

  const handleEndInterview = () => {
    router.push('/dashboard/tools/mock-Interview');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparing your interview session...</p>
        </div>
      </div>
    );
  }

  if (error || !connectionDetails || !sessionData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Session Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'Unable to load interview session details.'}</p>
          <button 
            onClick={() => router.push('/dashboard/tools/mock-Interview')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Return to Mock Interviews
          </button>
        </div>
      </div>
    );
  }

  // Create session config from real session data
  const sessionConfig = {
    sessionId: connectionDetails.sessionId,
    interviewType: sessionData.interview_type || 'behavioral',
    position: sessionData.position || 'Software Engineer',
    difficulty: sessionData.difficulty_level || 'medium',
    duration: 20 // Always 20 minutes regardless of database value
  };

  return (
      <div className="min-h-screen bg-white">
        <MockInterviewLiveKit 
          sessionConfig={sessionConfig}
          connectionDetails={connectionDetails}
          onEndInterview={handleEndInterview}
        />
      </div>
  );
};

// Main page component with Suspense boundary
const MockInterviewSessionsPage = () => {
  return (
    <Suspense fallback={<SessionsLoading />}>
      <MockInterviewSessionsContent />
    </Suspense>
  );
};

export default MockInterviewSessionsPage; 