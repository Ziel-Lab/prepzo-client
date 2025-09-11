"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { createClient } from '@/utils/supabase/client';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { 
  Award, 
  Clock, 
  TrendingUp, 
  ArrowRight, 
  ArrowLeft,
  RotateCcw, 
  Target,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Star,
  MessageSquare,
  Building2,
  Briefcase,
  Calendar,
  Bell
} from 'lucide-react';

interface QAItem {
  question: string;
  response: string;
}

interface StructuredFeedback {
  strengths_of_the_interview: string;
  weaknesses_of_the_interview: string;
  opportunities_of_the_interview: string;
  threats_of_the_interview: string;
  score: number;
  how_can_questions_be_answered_better: string;
  additional_questions_and_answers: QAItem[];
}

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

interface ResultAfterSessionProps {
  attemptData: AttemptData;
}

const ResultAfterSession: React.FC<ResultAfterSessionProps> = ({
  attemptData
}) => {
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});
  
  // Real-time monitoring state
  const [currentAttemptData, setCurrentAttemptData] = useState(attemptData);
  const [showNotification, setShowNotification] = useState(false);
  const subscriptionRef = useRef<any>(null);
  const supabase = createClient();

  // Extract data from current attempt data (which may be updated via real-time)
  const feedback = currentAttemptData.feedback;
  const score = currentAttemptData.evaluation_score;
  const duration = currentAttemptData.actual_duration_minutes;
  const status = currentAttemptData.status;
  const attemptId = currentAttemptData.id;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Real-time subscription setup
  const setupAttemptSubscription = async (attemptId: string) => {
    try {
      // Get user session for authentication
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session?.access_token) {
        console.log('No authenticated session for real-time subscription');
        return null;
      }

      const userToken = sessionData.session.access_token;
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
      
      if (!backendUrl) {
        console.log('Backend URL not configured for real-time subscription');
        return null;
      }

      // Get subscription configuration from backend
      const response = await fetch(`${backendUrl}/mockInterview/attempt/${attemptId}/subscribe`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.log('Failed to get subscription configuration');
        return null;
      }

      const { subscription_config, supabase_config } = await response.json();

      // Initialize Supabase client for real-time
      const realtimeClient = createSupabaseClient(
        supabase_config.url, 
        supabase_config.anon_key
      );

      // Subscribe to attempt updates
      const channel = realtimeClient
        .channel(subscription_config.channel_name)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public', 
            table: 'mock_interview_attempts',
            filter: `id=eq.${attemptId}`
          },
          (payload) => {
            console.log('🔔 Attempt updated via real-time!', payload);
            handleAttemptUpdate(payload.new, payload.old);
          }
        )
        .subscribe();

      return { channel, realtimeClient };

    } catch (error) {
      console.error('Failed to setup real-time subscription:', error);
      return null;
    }
  };

  // Handle attempt updates from real-time subscription
  const handleAttemptUpdate = (newData: any, oldData: any) => {
    console.log('📡 Processing attempt update:', { newData, oldData });

    // Update current attempt data
    setCurrentAttemptData(prevData => ({
      ...prevData,
      ...newData
    }));

    // Check if status changed to PROCESSED
    if (newData.status === 'PROCESSED' && oldData.status !== 'PROCESSED') {
      console.log('🎉 Feedback is now available!');
      
      // Show notification to user
      showFeedbackAvailableNotification();
      
      // Auto-reload page to show feedback after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }

    // Handle other status changes
    if (newData.status !== oldData.status) {
      console.log(`📊 Status changed: ${oldData.status} → ${newData.status}`);
    }

    // Handle score updates
    if (newData.evaluation_score !== oldData.evaluation_score) {
      console.log(`🎯 Score updated: ${oldData.evaluation_score} → ${newData.evaluation_score}`);
    }
  };

  // Show feedback available notification
  const showFeedbackAvailableNotification = () => {
    setShowNotification(true);
    
    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      setShowNotification(false);
    }, 5000);
  };

  // Setup subscription when component mounts (only if not processed)
  useEffect(() => {
    let subscriptionCleanup: any = null;

    if (currentAttemptData.status !== 'PROCESSED') {
      console.log('🔄 Setting up real-time subscription for attempt:', currentAttemptData.id);
      
      setupAttemptSubscription(currentAttemptData.id).then((subscription) => {
        if (subscription) {
          subscriptionRef.current = subscription;
          console.log('✅ Real-time subscription established');
        }
      });

      // Auto-cleanup after 1 hour (feedback usually processes within minutes)
      subscriptionCleanup = setTimeout(() => {
        if (subscriptionRef.current) {
          subscriptionRef.current.channel.unsubscribe();
          subscriptionRef.current = null;
          console.log('🧹 Auto-cleaned up subscription after 1 hour');
        }
      }, 3600000); // 1 hour
    }

    // Cleanup on unmount
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.channel.unsubscribe();
        console.log('🧹 Cleaned up real-time subscription on unmount');
      }
      if (subscriptionCleanup) {
        clearTimeout(subscriptionCleanup);
      }
    };
  }, []);

  // Manual cleanup function
  const cleanupSubscription = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.channel.unsubscribe();
      subscriptionRef.current = null;
      console.log('🧹 Manually cleaned up subscription');
    }
  };

  const getScoreColor = (scoreData: {numeric: number, maxScore: number} | null) => {
    if (!scoreData) return 'text-gray-600';
    
    // Normalize score to percentage for color calculation
    const percentage = (scoreData.numeric / scoreData.maxScore) * 100;
    
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-emerald-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (scoreData: {numeric: number, maxScore: number} | null) => {
    if (!scoreData) return 'bg-gray-100 text-gray-800 border-gray-200';
    
    // Normalize score to percentage for color calculation
    const percentage = (scoreData.numeric / scoreData.maxScore) * 100;
    
    if (percentage >= 90) return 'bg-green-100 text-green-800 border-green-200';
    if (percentage >= 80) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (percentage >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  // Parse structured feedback - only handles new format
  const parseStructuredFeedback = (): StructuredFeedback | null => {
    // Only show feedback if attempt status is PROCESSED
    if (currentAttemptData.status !== 'PROCESSED') {
      return null;
    }
    
    if (typeof feedback === 'object' && feedback !== null) {
      // Check if it's new format (snake_case keys)
      if ('strengths_of_the_interview' in feedback) {
        return feedback as StructuredFeedback;
      }
      console.log('Legacy format detected, feedback may not display correctly');
    }
    return null;
  };

  // Standardized score parsing and display - NEVER show percentages, always ratings
  const parseAndDisplayScore = () => {
    // Only show score if attempt status is PROCESSED
    if (currentAttemptData.status !== 'PROCESSED' || !structuredFeedback) {
      return null;
    }
    
    const score = structuredFeedback.score;
    if (typeof score === 'number') {
      return {
        display: `${score}/10`,
        numeric: score,
        maxScore: 10
      };
    }
    
    return null;
  };

  // Optimized parsing for both JSON and text formats
  const parseAdditionalQA = (qaData: any) => {
    console.log('🔍 parseAdditionalQA: Starting parsing...', typeof qaData);
    
    // Handle new JSON array format
    if (Array.isArray(qaData)) {
      console.log('📦 Processing JSON array format');
      return qaData.map(item => ({
        question: item.question || '',
        response: item.response || ''
      })).filter(item => item.question && item.response);
    }
    
    // If it's not a string, we can't parse it
    if (typeof qaData !== 'string') {
      console.log('❌ Invalid data type for parsing:', typeof qaData);
      return [];
    }
    
    const qaText = qaData.trim();
    if (!qaText) {
      console.log('❌ Empty text data');
      return [];
    }
    
    // Try parsing as JSON string
    try {
      const jsonData = JSON.parse(qaText);
      if (Array.isArray(jsonData)) {
        console.log('📦 Successfully parsed JSON string array');
        return jsonData.map(item => ({
          question: item.question || '',
          response: item.response || ''
        })).filter(item => item.question && item.response);
      }
    } catch (e) {
      console.log('🔄 Not valid JSON, falling back to text parsing');
    }
    
    const results = [];
    
    // Split on various question patterns to get individual Q&A blocks
    const sections = qaText.split(/\n\n(?=\*\*Question|\n\nQuestion:|Question \d+:)/);
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i].trim();
      if (!section) continue;
      
      console.log(`🔍 Processing section ${i + 1}:`, section.substring(0, 100) + '...');
      
      // Find the split between question and response
      const responseMarkerIndex = section.indexOf('Appropriate Response:');
      if (responseMarkerIndex === -1) {
        console.log(`❌ No "Appropriate Response:" found in section ${i + 1}`);
        continue;
      }
      
      // Extract question part
      let question = section.substring(0, responseMarkerIndex).trim();
      
      // Clean up question: remove various question markers and asterisks
      question = question
        .replace(/^\*\*Question\s*\d*:?\s*\*\*/i, '') // Remove **Question X:**
        .replace(/^Question\s*\d*:?\s*/i, '') // Remove Question X:
        .replace(/^\*\*/, '') // Remove leading **
        .replace(/\*\*$/, '') // Remove trailing **
        .replace(/^\d+\.\s*/, '') // Remove leading numbers
        .trim();
      
      // Extract response (remove "Appropriate Response: " prefix and quotes)
      let response = section.substring(responseMarkerIndex).trim();
      response = response.replace(/^Appropriate Response:\s*/, '').trim();
      
      // Remove surrounding quotes from response
      response = response.replace(/^["'`''""„]|["'`''""„]$/g, '').trim();
      
      if (question && response) {
        console.log(`✅ Successfully parsed Q&A ${results.length + 1}:`, {
          question: question.substring(0, 50) + '...',
          response: response.substring(0, 50) + '...'
        });
        results.push({ question, response });
      } else {
        console.log(`❌ Failed to parse section ${i + 1}:`, { question, response });
      }
    }
    
    console.log(`🎯 Parse complete. Found ${results.length} Q&A pairs`);
    return results;
  };

  // Robust fallback parsing - creates dropdowns even when main parsing fails
  const parseWithFallback = (qaText: string) => {
    console.log('🔄 Starting parseWithFallback...');
    
    // Try main parsing first
    let parsed = parseAdditionalQA(qaText);
    
    // If main parsing found results, return them
    if (parsed.length > 0) {
      console.log('✅ Main parsing successful, returning results');
      return parsed;
    }
    
    console.log('🔄 Main parsing failed, trying fallback...');
    
    // Fallback: Split by patterns and create basic Q&A structure
    const sections = qaText.split(/(?=###\s*(?:Additional\s*)?Question|\*\*(?:Additional\s*)?Question)/i);
    const results = [];
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i].trim();
      if (!section) continue;
      
      console.log(`🔍 Processing section ${i}:`, section.substring(0, 100) + '...');
      
      // Extract question (everything before **Appropriate Response:**)
      const responseMarkerIndex = section.indexOf('**Appropriate Response:**');
      if (responseMarkerIndex === -1) {
        console.log(`❌ No response marker found in section ${i}`);
        continue;
      }
      
      let questionPart = section.substring(0, responseMarkerIndex).trim();
      let responsePart = section.substring(responseMarkerIndex + '**Appropriate Response:**'.length).trim();
      
      // Clean up question: remove markdown headers, question markers, and asterisks
      questionPart = questionPart
        .replace(/^###\s*(?:Additional\s*)?Question\s*\d*:?\s*/i, '') // Remove ### Question headers
        .replace(/^\*\*(?:Additional\s*)?Question\s*\d*:?\s*\*\*/i, '') // Remove **Question X:**
        .replace(/^\*\*/, '') // Remove leading **
        .replace(/\*\*$/, '') // Remove trailing **
        .replace(/^\d+\.\s*/, '') // Remove leading numbers
        .replace(/^Question\s*\d*:?\s*/i, '') // Remove plain Question X:
        .trim();
      
      // If question is still empty, create a generic one
      if (!questionPart) {
        questionPart = `Practice Question ${results.length + 1}`;
      }
      
      // Clean up response: remove quotes and asterisks
      responsePart = responsePart
        .replace(/^["'`''""„\*]|["'`''""„\*]$/g, '') // Remove quotes and asterisks
        .replace(/^\*\*/, '') // Remove leading **
        .replace(/\*\*$/, '') // Remove trailing **
        .trim();
      
      if (questionPart && responsePart) {
        console.log(`✅ Fallback parsed Q&A ${results.length + 1}:`, {
          question: questionPart.substring(0, 50) + '...',
          response: responsePart.substring(0, 50) + '...'
        });
        results.push({ 
          question: questionPart, 
          response: responsePart 
        });
      }
    }
    
    console.log(`🎯 Fallback complete. Found ${results.length} Q&A pairs`);
    return results;
  };

  // Enhanced function to format markdown text with better paragraph handling and typography
  const formatMarkdownText = (text: string) => {
    // Split into paragraphs (double line breaks)
    const paragraphs = text.split('\n\n');
    
    return paragraphs.map((paragraph, paragraphIndex) => {
      const lines = paragraph.split('\n');
      
      // Process each line in the paragraph
      const processedLines = lines.map((line, lineIndex) => {
        // Handle ### headers
        if (line.trim().startsWith('### ')) {
          const headerText = line.replace(/^### /, '').trim();
          return (
            <h3 key={lineIndex} className="text-xl font-bold mt-6 mb-4 first:mt-0 text-slate-900 border-b border-slate-200/50 pb-2">
              {headerText}
            </h3>
          );
        }
        
        // Handle ## headers
        if (line.trim().startsWith('## ')) {
          const headerText = line.replace(/^## /, '').trim();
          return (
            <h2 key={lineIndex} className="text-2xl font-bold mt-8 mb-5 first:mt-0 text-slate-900">
              {headerText}
            </h2>
          );
        }
        
        // Handle bullet points
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          const bulletText = line.replace(/^[\-\*]\s+/, '').trim();
          const parts = bulletText.split(/(\*\*[^*]+\*\*)/g);
          const formattedBullet = parts.map((part, partIndex) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              const boldText = part.slice(2, -2);
              return <strong key={partIndex} className="font-bold text-slate-900">{boldText}</strong>;
            }
            return part;
          });
          
          return (
            <div key={lineIndex} className="flex items-start gap-3 mb-2">
              <div className="w-1.5 h-1.5 bg-current rounded-full mt-2.5 shrink-0 opacity-60"></div>
              <span className="flex-1 leading-relaxed">{formattedBullet}</span>
            </div>
          );
        }
        
        // Handle numbered lists
        const numberedMatch = line.trim().match(/^(\d+)\.\s+(.+)$/);
        if (numberedMatch) {
          const [, number, text] = numberedMatch;
          const parts = text.split(/(\*\*[^*]+\*\*)/g);
          const formattedText = parts.map((part, partIndex) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              const boldText = part.slice(2, -2);
              return <strong key={partIndex} className="font-bold text-slate-900">{boldText}</strong>;
            }
            return part;
          });
          
          return (
            <div key={lineIndex} className="flex items-start gap-3 mb-2">
              <span className="flex items-center justify-center w-6 h-6 bg-slate-200 text-slate-700 text-sm font-bold rounded-full shrink-0 mt-1">
                {number}
              </span>
              <span className="flex-1 leading-relaxed">{formattedText}</span>
            </div>
          );
        }
        
        // Handle ** bold text within regular lines and clean up stray asterisks
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        const formattedLine = parts.map((part, partIndex) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            const boldText = part.slice(2, -2);
            return <strong key={partIndex} className="font-bold text-slate-900">{boldText}</strong>;
          }
          // Clean up isolated asterisks and markdown artifacts
          const cleanedPart = part
            .replace(/^\*\*|\*\*$/g, '') // Remove isolated ** at start/end
            .replace(/\*{3,}/g, '') // Remove 3+ consecutive asterisks
            .trim();
          return cleanedPart;
        });
        
        // Skip empty lines
        if (line.trim() === '') {
          return null;
        }
        
        return (
          <span key={lineIndex} className="block mb-1 leading-relaxed">
            {formattedLine}
          </span>
        );
      }).filter(Boolean); // Remove null entries
      
      return (
        <div key={paragraphIndex} className={paragraphIndex > 0 ? "mt-6" : ""}>
          {processedLines}
        </div>
      );
    });
  };

  const structuredFeedback = parseStructuredFeedback();
  const scoreData = parseAndDisplayScore();
    const parsedScore = structuredFeedback?.score || score;

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="max-w-5xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8">
        {/* Real-time Feedback Notification */}
        {showNotification && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
            <Card className="border-green-200 bg-green-50 shadow-xl max-w-sm backdrop-blur-sm">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-gradient-to-r from-green-600 to-green-700 rounded-full shadow-sm">
                    <Bell className="text-white" size={16} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-green-900 mb-1 text-lg">🎉 Feedback Ready!</h4>
                    <p className="text-sm text-green-800 mb-4 leading-relaxed">
                      Your interview has been processed. The page will refresh automatically.
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => window.location.reload()}
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-sm font-medium"
                      >
                        View Now
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setShowNotification(false)}
                        className="border-green-300 text-green-700 hover:bg-green-100 font-medium"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Header */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 shadow-xl p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <Button 
              onClick={() => router.push('/dashboard/tools/mock-Interview')} 
              variant="outline"
              size="sm"
              className="self-start bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-slate-50 shadow-sm font-medium"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Sessions
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent mb-2">
                Interview Feedback
              </h1>
              <p className="text-slate-600 text-lg font-medium">Attempt #{currentAttemptData.attempt_number}</p>
            </div>
          </div>
        </div>

        {/* Session Overview */}
        <Card className="border-green-200/50 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-green-50/80 to-emerald-50/80 border-b border-green-200/50 rounded-t-xl">
            <CardTitle className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg">
                <MessageSquare className="text-white" size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-900 to-emerald-800 bg-clip-text text-transparent">
                  Session Overview
                </h2>
                <p className="text-sm text-green-700/80 font-medium mt-1">Interview session details and performance</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 mb-3">{currentAttemptData.mock_interview.title}</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-lg border border-slate-200/50">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building2 size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Company</p>
                      <p className="font-semibold text-slate-900">{currentAttemptData.mock_interview.company_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-lg border border-slate-200/50">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Briefcase size={16} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Position</p>
                      <p className="font-semibold text-slate-900">{currentAttemptData.mock_interview.position}</p>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="mt-4 bg-green-50 border-green-200 text-green-800 font-medium px-3 py-1">
                  {currentAttemptData.mock_interview.interview_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              </div>
              <div className="space-y-4">
                <div className="grid gap-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-lg border border-slate-200/50">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Calendar size={16} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Date & Time</p>
                      <p className="font-semibold text-slate-900">{formatDate(currentAttemptData.started_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-lg border border-slate-200/50">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Clock size={16} className="text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Duration</p>
                      <p className="font-semibold text-slate-900">{currentAttemptData.actual_duration_minutes} minutes</p>
                    </div>
                  </div>
                  {scoreData && (
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200/50">
                      <div className="p-2 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-lg">
                        <Award size={16} className="text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-yellow-700 uppercase tracking-wide">Score</p>
                        <p className={`text-lg font-bold ${getScoreColor(scoreData)}`}>
                          {scoreData.numeric}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-center pt-2">
                  <Badge 
                    className={`text-sm font-medium px-4 py-2 ${
                      currentAttemptData.status === 'PROCESSED' 
                        ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200' 
                        : 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200'
                    }`}
                  >
                    {currentAttemptData.status}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Processing Status Message */}
        {currentAttemptData.status !== 'PROCESSED' && (
          <Card className="border-orange-200/50 bg-gradient-to-br from-orange-50/80 to-amber-50/80 shadow-xl backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full shadow-lg">
                  <Clock size={48} className="text-white animate-pulse" />
                </div>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-900 to-amber-800 bg-clip-text text-transparent mb-3">
                Feedback Processing
              </h3>
              <p className="text-orange-800 mb-6 text-lg leading-relaxed max-w-md mx-auto">
                Your interview feedback is being processed. This usually takes a few minutes.
              </p>
              <div className="flex items-center justify-center gap-3 mb-6">
                <Badge className="bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border-orange-200 font-medium px-4 py-2">
                  Status: {currentAttemptData.status}
                </Badge>
                {subscriptionRef.current && (
                  <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200 font-medium px-4 py-2">
                    <Bell size={12} className="mr-2" />
                    Live Monitoring
                  </Badge>
                )}
              </div>
              
              {subscriptionRef.current ? (
                <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/50 rounded-xl p-6 mb-6 backdrop-blur-sm shadow-sm">
                  <div className="flex items-center justify-center gap-3 text-blue-800 mb-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Bell size={16} className="text-white animate-pulse" />
                    </div>
                    <span className="font-bold text-lg">Real-time monitoring active</span>
                  </div>
                  <p className="text-blue-700 leading-relaxed">
                    You'll be notified automatically when your feedback is ready. No need to refresh manually!
                  </p>
                </div>
              ) : (
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-100 font-medium shadow-sm px-6 py-3"
                >
                  <RotateCcw size={16} className="mr-2" />
                  Refresh Page
                </Button>
              )}
              
              <p className="text-sm text-orange-600/80 mt-4 font-medium">
                Feedback usually takes 2-3 minutes to process after completing the interview.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Structured Feedback */}
        {structuredFeedback && (
          <div className="space-y-8">
            {/* Feedback Analysis */}
            <Card className="border-slate-200/50 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-slate-50/80 to-gray-50/80 border-b border-slate-200/50 rounded-t-xl">
                <CardTitle className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-slate-700 to-gray-700 rounded-xl shadow-lg">
                    <TrendingUp className="text-white" size={22} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-gray-800 bg-clip-text text-transparent">
                      Feedback Analysis
                    </h2>
                    <p className="text-sm text-slate-700/80 font-medium mt-1">Comprehensive interview assessment</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 lg:p-8">
                <Tabs defaultValue="strengths" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-4 bg-slate-100/80 backdrop-blur-sm rounded-xl p-1 shadow-sm">
                    <TabsTrigger 
                      value="strengths" 
                      className="text-xs sm:text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"
                    >
                      Strengths
                    </TabsTrigger>
                    <TabsTrigger 
                      value="weaknesses" 
                      className="text-xs sm:text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"
                    >
                      Weaknesses
                    </TabsTrigger>
                    <TabsTrigger 
                      value="opportunities" 
                      className="text-xs sm:text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"
                    >
                      Opportunities
                    </TabsTrigger>
                    <TabsTrigger 
                      value="threats" 
                      className="text-xs sm:text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"
                    >
                      Threats
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="strengths" className="space-y-4">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg">
                        <CheckCircle className="text-white" size={20} />
                      </div>
                      <h3 className="text-xl font-bold bg-gradient-to-r from-green-800 to-emerald-700 bg-clip-text text-transparent">
                        What You Did Well
                      </h3>
                    </div>
                    <div className="bg-gradient-to-br from-green-50/90 to-emerald-50/90 border border-green-200/50 rounded-xl p-8 shadow-lg backdrop-blur-sm">
                      <div className="text-green-900 leading-relaxed space-y-4 text-base">
                        {formatMarkdownText(structuredFeedback?.strengths_of_the_interview || '')}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="weaknesses" className="space-y-4">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2.5 bg-gradient-to-r from-red-600 to-rose-600 rounded-xl shadow-lg">
                        <AlertTriangle className="text-white" size={20} />
                      </div>
                      <h3 className="text-xl font-bold bg-gradient-to-r from-red-800 to-rose-700 bg-clip-text text-transparent">
                        Areas for Improvement
                      </h3>
                    </div>
                    <div className="bg-gradient-to-br from-red-50/90 to-rose-50/90 border border-red-200/50 rounded-xl p-8 shadow-lg backdrop-blur-sm">
                      <div className="text-red-900 leading-relaxed space-y-4 text-base">
                        {formatMarkdownText(structuredFeedback?.weaknesses_of_the_interview || '')}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="opportunities" className="space-y-4">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                        <Lightbulb className="text-white" size={20} />
                      </div>
                      <h3 className="text-xl font-bold bg-gradient-to-r from-blue-800 to-indigo-700 bg-clip-text text-transparent">
                        Growth Opportunities
                      </h3>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50/90 to-indigo-50/90 border border-blue-200/50 rounded-xl p-8 shadow-lg backdrop-blur-sm">
                      <div className="text-blue-900 leading-relaxed space-y-4 text-base">
                        {formatMarkdownText(structuredFeedback?.opportunities_of_the_interview || '')}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="threats" className="space-y-4">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2.5 bg-gradient-to-r from-orange-600 to-amber-600 rounded-xl shadow-lg">
                        <Target className="text-white" size={20} />
                      </div>
                      <h3 className="text-xl font-bold bg-gradient-to-r from-orange-800 to-amber-700 bg-clip-text text-transparent">
                        Challenges to Address
                      </h3>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50/90 to-amber-50/90 border border-orange-200/50 rounded-xl p-8 shadow-lg backdrop-blur-sm">
                      <div className="text-orange-900 leading-relaxed space-y-4 text-base">
                        {formatMarkdownText(structuredFeedback?.threats_of_the_interview || '')}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Improvement Tips */}
            <Card className="border-purple-200/50 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-50/80 to-violet-50/80 border-b border-purple-200/50 rounded-t-xl">
                <CardTitle className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-purple-600 to-violet-600 rounded-xl shadow-lg">
                    <BookOpen className="text-white" size={22} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-900 to-violet-800 bg-clip-text text-transparent">
                      How to Improve Your Answers
                    </h2>
                    <p className="text-sm text-purple-700/80 font-medium mt-1">Detailed guidance for better responses</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 lg:p-8">
                <div className="bg-gradient-to-br from-purple-50/90 to-violet-50/90 border border-purple-200/50 rounded-xl p-8 shadow-lg backdrop-blur-sm">
                  <div className="text-purple-900 leading-relaxed space-y-4 text-base">
                    {formatMarkdownText(structuredFeedback?.how_can_questions_be_answered_better || '')}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Practice Questions */}
            <Card className="border-emerald-200/50 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 border-b border-emerald-200/50 rounded-t-xl">
                <CardTitle className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-lg">
                    <Lightbulb className="text-white" size={22} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-900 to-teal-800 bg-clip-text text-transparent">
                      Practice Questions & Model Answers
                    </h2>
                    <p className="text-sm text-emerald-700/80 font-medium mt-1">
                      Additional questions to help you prepare for similar interviews
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 lg:p-8">
                <div className="space-y-5">
                  {(() => {
                    const qaData = structuredFeedback?.additional_questions_and_answers || [];
                    const parsedQA = qaData;
                    
                    // Return Q&A as collapsible components
                    return (
                      <div className="space-y-5">
                        {qaData.map((qa: QAItem, index: number) => (
                          <Collapsible key={index}>
                            <CollapsibleTrigger
                              onClick={() => toggleSection(`qa-${index}`)}
                              className="w-full text-left"
                            >
                              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 border border-emerald-200/50 rounded-xl hover:from-emerald-100/80 hover:to-teal-100/80 transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg backdrop-blur-sm">
                                <div className="flex items-start gap-4">
                                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold rounded-full shrink-0 mt-1 shadow-md">
                                    {index + 1}
                                  </div>
                                  <span className="font-semibold text-emerald-900 text-left leading-relaxed text-base">
                                    {typeof qa.question === 'string' ? qa.question.replace(/^\*\*|\*\*$/g, '').trim() : qa.question}
                                  </span>
                                </div>
                                {expandedSections[`qa-${index}`] ? 
                                  <ChevronUp className="text-emerald-600 shrink-0" size={22} /> : 
                                  <ChevronDown className="text-emerald-600 shrink-0" size={22} />
                                }
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="mt-4 p-6 bg-gradient-to-br from-slate-50/90 to-gray-50/90 border border-slate-200/50 rounded-xl shadow-lg backdrop-blur-sm">
                                <div className="flex items-center gap-3 mb-5">
                                  <div className="p-2.5 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-xl shadow-md">
                                    <Star size={16} className="text-white" />
                                  </div>
                                  <h4 className="font-bold text-slate-900 text-lg">Model Answer</h4>
                                </div>
                                <div className="text-slate-800 leading-relaxed bg-white/80 p-6 rounded-xl border border-slate-200/50 shadow-sm backdrop-blur-sm">
                                  <div className="prose prose-sm max-w-none text-base">
                                    {typeof qa.response === 'string' ? qa.response.replace(/^\*\*|\*\*$/g, '').replace(/\*{3,}/g, '').trim() : qa.response}
                                  </div>
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
        </div>
      )}

      {/* Note: Legacy feedback format removed - feedback always comes in structured format */}

        {/* Transcript */}
        {currentAttemptData.transcript && currentAttemptData.status === 'PROCESSED' && (
          <Card className="border-slate-200/50 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-slate-50/80 to-gray-50/80 border-b border-slate-200/50 rounded-t-xl">
              <CardTitle className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-slate-600 to-gray-600 rounded-xl shadow-lg">
                  <MessageSquare className="text-white" size={22} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-gray-800 bg-clip-text text-transparent">
                    Interview Transcript
                  </h2>
                  <p className="text-sm text-slate-700/80 font-medium mt-1">Complete conversation record</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 lg:p-8">
              <div className="bg-gradient-to-br from-slate-50/90 to-gray-50/90 border border-slate-200/50 rounded-xl p-8 max-h-96 overflow-y-auto shadow-lg backdrop-blur-sm">
                {typeof currentAttemptData.transcript === 'string' ? (
                  <div className="text-slate-900 whitespace-pre-wrap text-sm leading-relaxed font-mono">
                    {currentAttemptData.transcript}
                  </div>
                ) : (
                  <pre className="text-sm text-slate-900 font-mono leading-relaxed">
                    {JSON.stringify(currentAttemptData.transcript, null, 2)}
                  </pre>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card className="border-slate-200/50 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={() => router.push('/dashboard/tools/mock-Interview')}
                variant="outline"
                className="bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-slate-50 shadow-md font-medium px-6 py-3 text-base w-full sm:w-auto"
              >
                <ArrowLeft size={18} className="mr-2" />
                Back to Sessions
              </Button>
              <Button 
                onClick={() => router.push('/dashboard/tools/mock-Interview')}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg font-medium px-8 py-3 text-base w-full sm:w-auto"
              >
                Practice Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResultAfterSession; 
