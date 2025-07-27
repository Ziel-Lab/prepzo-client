"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ArrowLeft, 
  Award, 
  Clock, 
  Calendar, 
  Building2, 
  Briefcase, 
  MessageSquare, 
  TrendingUp,
  Target,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  BookOpen,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface StructuredFeedback {
  "Strengths of the interview"?: string;
  "Weaknesses of the interview"?: string;
  "Opportunities of the interview"?: string;
  "Threats of the interview"?: string;
  "Score"?: string;
  "How can questions be answered better"?: string;
  "additional_questions_and_answers"?: string;
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

const FeedbackPage = () => {
  const params = useParams();
  const router = useRouter();
  const [attemptData, setAttemptData] = useState<AttemptData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});
  const supabase = createClient();

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Parse structured feedback
  const parseStructuredFeedback = (feedback: any): StructuredFeedback | null => {
    if (typeof feedback === 'object' && feedback !== null) {
      return feedback as StructuredFeedback;
    }
    return null;
  };

  const parseAdditionalQA = (qaText: string) => {
    // Split by "**Additional Question" but preserve the marker
    const sections = qaText.split(/(?=\*\*Additional Question)/);
    return sections.filter(section => section.includes('Additional Question')).map(section => {
      // Extract question number and text
      const questionMatch = section.match(/\*\*Additional Question (\d+):\*\*\s*([\s\S]+?)(?=\*\*Appropriate Response:|$)/);
      const question = questionMatch ? questionMatch[2].trim() : '';
      
      // Extract response
      const responseMatch = section.match(/\*\*Appropriate Response:\*\*\s*([\s\S]+?)(?=\*\*Additional Question|$)/);
      let response = responseMatch ? responseMatch[1].trim() : '';
      
      // Clean up response - remove quotes and extra whitespace
      response = response.replace(/^['"]|['"]$/g, '').trim();
      
      return { question, response };
    }).filter(qa => qa.question && qa.response);
  };

  // Function to format markdown text (convert ** to bold)
  const formatMarkdownText = (text: string) => {
    // Split text by ** markers and format accordingly
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        return <strong key={index} className="font-semibold">{boldText}</strong>;
      }
      return part;
    });
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-emerald-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 80) return 'bg-emerald-100 text-emerald-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/20 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => router.push('/dashboard/tools/mock-Interview')} 
              variant="outline"
              size="sm"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Sessions
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Interview Feedback</h1>
              <p className="text-gray-600">Attempt #{attemptData.attempt_number}</p>
            </div>
          </div>

          {/* Session Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="text-green-600" size={20} />
                Session Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{attemptData.mock_interview.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Building2 size={14} />
                      <span>{attemptData.mock_interview.company_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase size={14} />
                      <span>{attemptData.mock_interview.position}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="mt-2">
                    {attemptData.mock_interview.interview_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={14} />
                    <span>{formatDate(attemptData.started_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={14} />
                    <span>{attemptData.actual_duration_minutes} minutes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge className={`text-sm ${attemptData.status === 'PROCESSED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {attemptData.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Score Card */}
          {attemptData.evaluation_score && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="text-yellow-600" size={20} />
                  Performance Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className={`text-6xl font-bold ${getScoreColor(attemptData.evaluation_score)} mb-2`}>
                    {Math.round(attemptData.evaluation_score)}%
                  </div>
                  <Badge className={getScoreBgColor(attemptData.evaluation_score)}>
                    {attemptData.evaluation_score >= 90 ? 'Excellent' :
                     attemptData.evaluation_score >= 80 ? 'Good' :
                     attemptData.evaluation_score >= 70 ? 'Average' : 'Needs Improvement'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Structured Feedback */}
          {attemptData.feedback && (() => {
            const structuredFeedback = parseStructuredFeedback(attemptData.feedback);
            
            if (structuredFeedback) {
              return (
                <div className="space-y-6">
                  {/* SWOT Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="text-indigo-600" size={24} />
                        SWOT Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="strengths" className="space-y-4">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="strengths" className="text-xs sm:text-sm">Strengths</TabsTrigger>
                          <TabsTrigger value="weaknesses" className="text-xs sm:text-sm">Weaknesses</TabsTrigger>
                          <TabsTrigger value="opportunities" className="text-xs sm:text-sm">Opportunities</TabsTrigger>
                          <TabsTrigger value="threats" className="text-xs sm:text-sm">Threats</TabsTrigger>
                        </TabsList>

                                                 <TabsContent value="strengths" className="space-y-3">
                           <div className="flex items-center gap-2 mb-3">
                             <CheckCircle className="text-green-600" size={20} />
                             <h3 className="font-semibold text-green-800">What You Did Well</h3>
                           </div>
                           <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                             <p className="text-green-900 leading-relaxed whitespace-pre-line">
                               {formatMarkdownText(structuredFeedback["Strengths of the interview"] || "")}
                             </p>
                           </div>
                         </TabsContent>

                                                 <TabsContent value="weaknesses" className="space-y-3">
                           <div className="flex items-center gap-2 mb-3">
                             <AlertTriangle className="text-red-600" size={20} />
                             <h3 className="font-semibold text-red-800">Areas for Improvement</h3>
                           </div>
                           <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                             <p className="text-red-900 leading-relaxed whitespace-pre-line">
                               {formatMarkdownText(structuredFeedback["Weaknesses of the interview"] || "")}
                             </p>
                           </div>
                         </TabsContent>

                                                 <TabsContent value="opportunities" className="space-y-3">
                           <div className="flex items-center gap-2 mb-3">
                             <Lightbulb className="text-blue-600" size={20} />
                             <h3 className="font-semibold text-blue-800">Growth Opportunities</h3>
                           </div>
                           <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                             <p className="text-blue-900 leading-relaxed whitespace-pre-line">
                               {formatMarkdownText(structuredFeedback["Opportunities of the interview"] || "")}
                             </p>
                           </div>
                         </TabsContent>

                                                 <TabsContent value="threats" className="space-y-3">
                           <div className="flex items-center gap-2 mb-3">
                             <Target className="text-orange-600" size={20} />
                             <h3 className="font-semibold text-orange-800">Challenges to Address</h3>
                           </div>
                           <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                             <p className="text-orange-900 leading-relaxed whitespace-pre-line">
                               {formatMarkdownText(structuredFeedback["Threats of the interview"] || "")}
                             </p>
                           </div>
                         </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>

                  {/* Improvement Tips */}
                  {structuredFeedback["How can questions be answered better"] && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="text-purple-600" size={24} />
                          How to Improve Your Answers
                        </CardTitle>
                      </CardHeader>
                                             <CardContent>
                         <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                           <p className="text-purple-900 leading-relaxed whitespace-pre-line">
                             {formatMarkdownText(structuredFeedback["How can questions be answered better"] || "")}
                           </p>
                         </div>
                       </CardContent>
                    </Card>
                  )}

                                                        {/* Additional Practice Questions */}
                   {structuredFeedback["additional_questions_and_answers"] && (
                     <Card>
                       <CardHeader>
                         <CardTitle className="flex items-center gap-2">
                           <Lightbulb className="text-emerald-600" size={24} />
                           Practice Questions & Model Answers
                         </CardTitle>
                       </CardHeader>
                       <CardContent className="space-y-4">
                         {(() => {
                           const parsedQA = parseAdditionalQA(structuredFeedback["additional_questions_and_answers"] || "");
                           console.log('📝 Raw additional Q&A:', structuredFeedback["additional_questions_and_answers"]);
                           console.log('🔍 Parsed Q&A:', parsedQA);
                           
                           return parsedQA.length > 0 ? parsedQA.map((qa, index) => (
                             <Collapsible key={index}>
                               <CollapsibleTrigger
                                 onClick={() => toggleSection(`qa-${index}`)}
                                 className="w-full text-left"
                               >
                                 <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors">
                                   <div className="flex items-center gap-3">
                                     <Badge className="bg-emerald-600 text-white">Q{index + 1}</Badge>
                                     <span className="font-medium text-emerald-900">{qa.question}</span>
                                   </div>
                                   {expandedSections[`qa-${index}`] ? 
                                     <ChevronUp className="text-emerald-600" size={20} /> : 
                                     <ChevronDown className="text-emerald-600" size={20} />
                                   }
                                 </div>
                               </CollapsibleTrigger>
                               <CollapsibleContent>
                                 <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                   <h4 className="font-semibold text-gray-900 mb-2">Model Answer:</h4>
                                   <p className="text-gray-800 leading-relaxed">{qa.response}</p>
                                 </div>
                               </CollapsibleContent>
                             </Collapsible>
                           )) : (
                             <div className="text-center py-8 text-gray-500">
                               <p>No practice questions available for this interview.</p>
                             </div>
                           );
                         })()}
                       </CardContent>
                     </Card>
                   )}
                </div>
              );
            } else {
              // Legacy feedback display
              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="text-blue-600" size={20} />
                      Detailed Feedback
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      {typeof attemptData.feedback === 'string' ? (
                        <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{attemptData.feedback}</p>
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-auto">
                          <p className="text-gray-900 font-mono text-sm whitespace-pre-wrap">
                            {JSON.stringify(attemptData.feedback, null, 2)}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            }
          })()}

          {/* Transcript */}
          {attemptData.transcript && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="text-gray-600" size={20} />
                  Interview Transcript
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg max-h-96 overflow-y-auto">
                  {typeof attemptData.transcript === 'string' ? (
                    <p className="text-gray-900 whitespace-pre-wrap text-sm leading-relaxed">{attemptData.transcript}</p>
                  ) : (
                    <pre className="text-sm text-gray-900 font-mono">
                      {JSON.stringify(attemptData.transcript, null, 2)}
                    </pre>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-4">
                <Button 
                  onClick={() => router.push('/dashboard/tools/mock-Interview')}
                  variant="outline"
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Sessions
                </Button>
                <Button 
                  onClick={() => window.print()}
                  variant="outline"
                >
                  Print Feedback
                </Button>
                <Button 
                  onClick={() => {
                    // Navigate to create a new session based on this one
                    router.push('/dashboard/tools/mock-Interview');
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Practice Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FeedbackPage; 