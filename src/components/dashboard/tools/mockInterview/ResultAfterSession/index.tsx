"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Award, 
  Clock, 
  TrendingUp, 
  ArrowRight, 
  RotateCcw, 
  Target,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Star
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

interface ResultAfterSessionProps {
  attemptId: string;
  sessionId: string;
  score?: number;
  duration: number;
  feedback?: string | StructuredFeedback;
  status: string;
}

const ResultAfterSession: React.FC<ResultAfterSessionProps> = ({
  attemptId,
  sessionId,
  score,
  duration,
  feedback,
  status
}) => {
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-emerald-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 80) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  // Parse structured feedback
  const parseStructuredFeedback = (): StructuredFeedback | null => {
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

  const structuredFeedback = parseStructuredFeedback();
  const parsedScore = structuredFeedback?.Score ? parseInt(structuredFeedback.Score) : score;

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Complete!</h1>
        <p className="text-gray-600">Your detailed analysis and personalized feedback are ready.</p>
      </div>

      {/* Quick Stats */}
      <Card className="border-2 border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <TrendingUp size={24} />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock size={20} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-600">Duration</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{duration} min</div>
            </div>
            
            {parsedScore && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Award size={20} className="text-yellow-600" />
                  <span className="text-sm font-medium text-gray-600">Overall Score</span>
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(parsedScore)}`}>
                  {Math.round(parsedScore)}/100
                </div>
              </div>
            )}

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star size={20} className="text-purple-600" />
                <span className="text-sm font-medium text-gray-600">Status</span>
              </div>
              <Badge className={`text-sm ${
                status === 'PROCESSED' ? 'bg-green-100 text-green-700 border-green-200' : 
                'bg-blue-100 text-blue-700 border-blue-200'
              }`}>
                {status === 'PROCESSED' ? 'Analysis Complete' : 'Processing...'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Structured Feedback */}
      {structuredFeedback && (
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
                {parseAdditionalQA(structuredFeedback["additional_questions_and_answers"]).map((qa, index) => (
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
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Legacy Simple Feedback */}
      {!structuredFeedback && feedback && typeof feedback === 'string' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="text-blue-600" size={20} />
              Feedback Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-800 leading-relaxed">{feedback}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          onClick={() => router.push(`/dashboard/tools/mock-Interview/feedback/${attemptId}`)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12"
          size="lg"
        >
          View Complete Analysis
          <ArrowRight size={18} className="ml-2" />
        </Button>
        
        <Button 
          onClick={() => router.push('/dashboard/tools/mock-Interview')}
          variant="outline"
          className="flex-1 h-12"
          size="lg"
        >
          <RotateCcw size={18} className="mr-2" />
          Practice Again
        </Button>
      </div>

      {/* Processing Notice */}
      {status !== 'PROCESSED' && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <Clock size={16} />
              <span className="text-sm font-medium">
                Your interview is being analyzed. Detailed feedback will be available shortly.
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ResultAfterSession; 