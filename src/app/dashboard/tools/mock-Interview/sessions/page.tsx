"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import MockInterviewLiveKit from '@/components/dashboard/tools/mockInterview/MockInterviewLiveKit';

const MockInterviewSessionsPage = () => {
  const router = useRouter();

  const handleEndInterview = () => {
    router.push('/dashboard/tools/mock-Interview');
  };

  const sessionConfig = {
    sessionId: 'session-' + Date.now(),
    interviewType: 'behavioral',
    position: 'Software Engineer',
    difficulty: 'intermediate',
    duration: 30
  };

  return (
      <div className="min-h-screen bg-white">
        <MockInterviewLiveKit 
          sessionConfig={sessionConfig}
          onEndInterview={handleEndInterview}
        />
      </div>
  )
};

export default MockInterviewSessionsPage; 