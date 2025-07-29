"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ResultAfterSession from '@/components/dashboard/tools/mockInterview/ResultAfterSession';

interface AttemptData {
  id: string;
  attempt_number: number;
  status: string;
  started_at: string;
  completed_at: string;
  actual_duration_minutes: number;
  evaluation_score: number;
  feedback: any;
  transcript: any;
  mock_interview: {
    title: string;
    interview_type: string;
    position: string;
    company_name: string;
  };
}

const FeedbackPage = () => {
  const params = useParams();
  const router = useRouter();
  const [attemptData, setAttemptData] = useState<AttemptData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const attemptId = params.attemptId as string;

  useEffect(() => {
    if (attemptId) {
      fetchAttemptData();
    }
  }, [attemptId]);

  const fetchAttemptData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get user session for authentication
      const { data: sessionData, error: authError } = await supabase.auth.getSession();
      if (authError || !sessionData?.session?.access_token) {
        setError('Authentication required');
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
      if (!backendUrl) {
        setError('Backend URL not configured');
        return;
      }

      // Fetch attempt details from backend
      const response = await fetch(`${backendUrl}/mockInterview/attempt/${attemptId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch feedback');
      }

      const result = await response.json();
      setAttemptData(result.attempt);

    } catch (error) {
      console.error('Error fetching attempt data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load feedback');
    } finally {
      setIsLoading(false);
    }
  };



  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/20 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-64 bg-gray-200 rounded-lg"></div>
              <div className="h-48 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/20 p-6">
          <div className="max-w-4xl mx-auto">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Feedback</h3>
                <p className="text-red-700 mb-4">{error}</p>
                <div className="space-x-4">
                  <Button 
                    onClick={() => router.back()} 
                    variant="outline" 
                    className="border-red-300 text-red-600 hover:bg-red-100"
                  >
                    <ArrowLeft size={16} className="mr-2" />
                    Go Back
                  </Button>
                  <Button 
                    onClick={fetchAttemptData}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!attemptData) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/20 p-6">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Feedback Available</h3>
                <p className="text-gray-600 mb-4">This attempt doesn't have feedback yet.</p>
                <Button onClick={() => router.back()} variant="outline">
                  <ArrowLeft size={16} className="mr-2" />
                  Go Back
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/20">
        <ResultAfterSession attemptData={attemptData} />
      </div>
    </DashboardLayout>
  );
};

export default FeedbackPage; 