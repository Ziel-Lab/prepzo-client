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
  Calendar
} from 'lucide-react';

interface StructuredFeedback {
  "Strengths of the interview": string;
  "Weaknesses of the interview": string;
  "Opportunities of the interview": string;
  "Threats of the interview": string;
  "Score": string;
  "How can questions be answered better": string;
  "additional_questions_and_answers": string;
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

  // Extract data from attemptData
  const feedback = attemptData.feedback;
  const score = attemptData.evaluation_score;
  const duration = attemptData.actual_duration_minutes;
  const status = attemptData.status;
  const attemptId = attemptData.id;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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

  // Parse structured feedback - feedback will always come in the expected format
  const parseStructuredFeedback = (): StructuredFeedback | null => {
    // Only show feedback if attempt status is PROCESSED
    if (attemptData.status !== 'PROCESSED') {
      return null;
    }
    
    if (typeof feedback === 'object' && feedback !== null) {
      return feedback as StructuredFeedback;
    }
    return null;
  };

  // Standardized score parsing and display - NEVER show percentages, always ratings
  const parseAndDisplayScore = () => {
    // Only show score if attempt status is PROCESSED
    if (attemptData.status !== 'PROCESSED') {
      return null;
    }
    
    const structuredScore = structuredFeedback?.Score;
    const evaluationScore = attemptData.evaluation_score;

    // If we have structured feedback score, use it
    if (structuredScore) {
      // Check if it's in "X/10" format
      const fractionMatch = structuredScore.match(/^(\d+\.?\d*)\/(\d+)$/);
      if (fractionMatch) {
        return {
          display: structuredScore, // Show original "8/10" format
          numeric: parseFloat(fractionMatch[1]), // For color calculation
          maxScore: parseFloat(fractionMatch[2])
        };
      }
      
      // Check if it's just a number
      const numberMatch = structuredScore.match(/^(\d+\.?\d*)$/);
      if (numberMatch) {
        const num = parseFloat(numberMatch[1]);
        // Always convert to rating format, never percentage
        if (num <= 10) {
          return {
            display: `${structuredScore}/10`,
            numeric: num,
            maxScore: 10
          };
        } else {
          // If it's a large number (like 80), convert to rating out of 10
          const rating = Math.round((num / 100) * 10);
          return {
            display: `${rating}/10`,
            numeric: rating,
            maxScore: 10
          };
        }
      }
      
      // Fallback: show as-is
      return {
        display: structuredScore,
        numeric: parseFloat(structuredScore) || 0,
        maxScore: 10
      };
    }
    
    // If we only have evaluation score
    if (evaluationScore !== undefined && evaluationScore !== null) {
      // If it's a small number, assume it's already out of 10
      if (evaluationScore <= 10) {
        return {
          display: `${evaluationScore}/10`,
          numeric: evaluationScore,
          maxScore: 10
        };
      }
      // If it's a percentage-like number (0-100), convert to rating out of 10
      else if (evaluationScore <= 100) {
        const rating = Math.round((evaluationScore / 100) * 10);
        return {
          display: `${rating}/10`,
          numeric: rating,
          maxScore: 10
        };
      }
      // Fallback for very large numbers
      else {
        return {
          display: `${Math.round(evaluationScore)}/10`,
          numeric: Math.round(evaluationScore),
          maxScore: 10
        };
      }
    }
    
    return null;
  };

  // Optimized parsing for the standard feedback format
  const parseAdditionalQA = (qaText: string) => {
    console.log('🔍 parseAdditionalQA: Starting optimized parsing...');
    const results = [];
    
    // Split on the pattern "Question:" to get individual Q&A blocks
    const sections = qaText.split(/\n\n(?=Question:)/);
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i].trim();
      if (!section || !section.startsWith('Question:')) continue;
      
      console.log(`🔍 Processing section ${i + 1}:`, section.substring(0, 100) + '...');
      
      // Find the split between question and response
      const responseMarkerIndex = section.indexOf('Appropriate Response:');
      if (responseMarkerIndex === -1) {
        console.log(`❌ No "Appropriate Response:" found in section ${i + 1}`);
        continue;
      }
      
      // Extract question (remove "Question: " prefix and trim)
      let question = section.substring(0, responseMarkerIndex).trim();
      question = question.replace(/^Question:\s*/, '').trim();
      
      // Extract response (remove "Appropriate Response: " prefix and quotes)
      let response = section.substring(responseMarkerIndex).trim();
      response = response.replace(/^Appropriate Response:\s*/, '').trim();
      
      // Remove surrounding quotes from response
      response = response.replace(/^["']|["']$/g, '').trim();
      
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
    
    console.log(`🎯 Optimized parse complete. Found ${results.length} Q&A pairs`);
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
      
      // Clean up question: remove markdown headers and question markers
      questionPart = questionPart
        .replace(/^###\s*(?:Additional\s*)?Question\s*\d*:?\s*/i, '')
        .replace(/^\*\*(?:Additional\s*)?Question\s*\d*:?\s*\*\*/i, '')
        .trim();
      
      // If question is still empty, create a generic one
      if (!questionPart) {
        questionPart = `Question ${results.length + 1}`;
      }
      
      // Clean up response
      responsePart = responsePart.replace(/^['"`''""]|['"`''""]$/g, '').trim();
      
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

  // Enhanced function to format markdown text with better paragraph handling
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
            <h3 key={lineIndex} className="text-lg font-bold mt-4 mb-3 first:mt-0">
              {headerText}
            </h3>
          );
        }
        
        // Handle ** bold text within the line
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        const formattedLine = parts.map((part, partIndex) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            const boldText = part.slice(2, -2);
            return <strong key={partIndex} className="font-semibold">{boldText}</strong>;
          }
          return part;
        });
        
        return (
          <span key={lineIndex}>
            {formattedLine}
            {lineIndex < lines.length - 1 && <br />}
          </span>
        );
      });
      
      return (
        <div key={paragraphIndex} className={paragraphIndex > 0 ? "mt-4" : ""}>
          {processedLines}
        </div>
      );
    });
  };

  const structuredFeedback = parseStructuredFeedback();
  const scoreData = parseAndDisplayScore();
  const parsedScore = structuredFeedback?.Score ? parseInt(structuredFeedback.Score) : score;

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
    <div className="max-w-4xl mx-auto space-y-6 p-6">
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
      <Card className="border-green-200 shadow-md">
        <CardHeader className="bg-gradient-to-r from-green-50 to-green-100/50 border-b border-green-200">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-green-600 rounded-lg">
              <MessageSquare className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-green-900">Session Overview</h2>
              <p className="text-sm text-green-700 font-normal mt-1">Interview session details and performance</p>
            </div>
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
              {scoreData && (
                <div className="flex items-center gap-2 text-sm">
                  <Award size={14} className="text-yellow-600" />
                  <span className="font-semibold text-gray-900">
                    <span className={getScoreColor(scoreData)}>
                      {scoreData.display}
                    </span>
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Badge className={`text-sm ${attemptData.status === 'PROCESSED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {attemptData.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Status Message */}
      {attemptData.status !== 'PROCESSED' && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6 text-center">
            <div className="text-orange-600 mb-4">
              <Clock size={48} className="mx-auto mb-4" />
            </div>
            <h3 className="text-lg font-semibold text-orange-900 mb-2">Feedback Processing</h3>
            <p className="text-orange-800 mb-4">
              Your interview feedback is being processed. This usually takes a few minutes.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-orange-700">
              <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                Status: {attemptData.status}
              </Badge>
            </div>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              className="mt-4 border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              <RotateCcw size={16} className="mr-2" />
              Refresh Page
            </Button>
            <p className="text-xs text-orange-600 mt-3">
              Feedback usually takes 2-3 minutes to process after completing the interview.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Structured Feedback */}
      {structuredFeedback && (
        <div className="space-y-6">
          {/* Feedback Analysis */}
          <Card className="border-gray-200 shadow-md">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-gray-700 rounded-lg">
                  <TrendingUp className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-normal mt-1">Comprehensive interview assessment</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs defaultValue="strengths" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="strengths" className="text-xs sm:text-sm">Strengths</TabsTrigger>
                  <TabsTrigger value="weaknesses" className="text-xs sm:text-sm">Weaknesses</TabsTrigger>
                  <TabsTrigger value="opportunities" className="text-xs sm:text-sm">Opportunities</TabsTrigger>
                  <TabsTrigger value="threats" className="text-xs sm:text-sm">Threats</TabsTrigger>
                </TabsList>

                <TabsContent value="strengths" className="space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="text-green-600" size={20} />
                    <h3 className="font-semibold text-green-800 text-lg">What You Did Well</h3>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100/80 border-l-4 border-green-400 rounded-lg p-6 shadow-sm">
                    <div className="text-green-900 leading-relaxed space-y-3">
                      {formatMarkdownText(structuredFeedback["Strengths of the interview"])}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="weaknesses" className="space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="text-red-600" size={20} />
                    <h3 className="font-semibold text-red-800 text-lg">Areas for Improvement</h3>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-red-100/80 border-l-4 border-red-400 rounded-lg p-6 shadow-sm">
                    <div className="text-red-900 leading-relaxed space-y-3">
                      {formatMarkdownText(structuredFeedback["Weaknesses of the interview"])}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="opportunities" className="space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="text-blue-600" size={20} />
                    <h3 className="font-semibold text-blue-800 text-lg">Growth Opportunities</h3>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/80 border-l-4 border-blue-400 rounded-lg p-6 shadow-sm">
                    <div className="text-blue-900 leading-relaxed space-y-3">
                      {formatMarkdownText(structuredFeedback["Opportunities of the interview"])}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="threats" className="space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="text-orange-600" size={20} />
                    <h3 className="font-semibold text-orange-800 text-lg">Challenges to Address</h3>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100/80 border-l-4 border-orange-400 rounded-lg p-6 shadow-sm">
                    <div className="text-orange-900 leading-relaxed space-y-3">
                      {formatMarkdownText(structuredFeedback["Threats of the interview"])}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Improvement Tips */}
          <Card className="border-purple-200 shadow-md">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100/50 border-b border-purple-200">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-purple-600 rounded-lg">
                  <BookOpen className="text-white" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-purple-900">How to Improve Your Answers</h2>
                  <p className="text-sm text-purple-700 font-normal mt-1">Detailed guidance for better responses</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/80 border-l-4 border-purple-400 rounded-lg p-6 shadow-sm">
                <div className="text-purple-900 leading-relaxed space-y-4">
                  {formatMarkdownText(structuredFeedback["How can questions be answered better"])}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Practice Questions */}
          <Card className="border-emerald-200 shadow-md">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-b border-emerald-200">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600 rounded-lg">
                  <Lightbulb className="text-white" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-emerald-900">Practice Questions & Model Answers</h2>
                  <p className="text-sm text-emerald-700 font-normal mt-1">
                    Additional questions to help you prepare for similar interviews
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {(() => {
                  const qaData = structuredFeedback["additional_questions_and_answers"];
                  const parsedQA = parseWithFallback(qaData);
                  
                  // If both main and fallback parsing failed, show clean raw format
                  if (parsedQA.length === 0 && qaData) {
                    console.log('🚨 Both parsing methods failed, showing raw format');
                    return (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                        <h4 className="font-semibold text-emerald-900 mb-4 flex items-center gap-2">
                          <BookOpen size={16} />
                          Practice Questions & Model Answers
                        </h4>
                        <div className="text-emerald-800 leading-relaxed whitespace-pre-line space-y-4">
                          {formatMarkdownText(qaData)}
                        </div>
                      </div>
                    );
                  }
                  
                  // Return parsed Q&A as collapsible components
                  console.log(`🎉 Displaying ${parsedQA.length} Q&A dropdowns`);
                  return (
                    <div className="space-y-4">
                      {parsedQA.map((qa, index) => (
                        <Collapsible key={index}>
                          <CollapsibleTrigger
                            onClick={() => toggleSection(`qa-${index}`)}
                            className="w-full text-left"
                          >
                            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-emerald-50 to-emerald-100/70 border border-emerald-200 rounded-xl hover:from-emerald-100 hover:to-emerald-100 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md">
                              <div className="flex items-start gap-4">
                                <div className="flex items-center justify-center w-8 h-8 bg-emerald-600 text-white text-sm font-bold rounded-full shrink-0 mt-0.5">
                                  {index + 1}
                                </div>
                                <span className="font-semibold text-emerald-900 text-left leading-relaxed">
                                  {qa.question}
                                </span>
                              </div>
                              {expandedSections[`qa-${index}`] ? 
                                <ChevronUp className="text-emerald-600 shrink-0" size={20} /> : 
                                <ChevronDown className="text-emerald-600 shrink-0" size={20} />
                              }
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="mt-3 p-6 bg-gradient-to-br from-gray-50 to-gray-100/80 border border-gray-200 rounded-xl shadow-sm">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="p-1.5 bg-yellow-500 rounded-lg">
                                  <Star size={14} className="text-white" />
                                </div>
                                <h4 className="font-bold text-gray-900 text-lg">Model Answer</h4>
                              </div>
                              <div className="text-gray-800 leading-relaxed bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                                <div className="prose prose-sm max-w-none">
                                  {qa.response}
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
      {attemptData.transcript && attemptData.status === 'PROCESSED' && (
        <Card className="border-gray-200 shadow-md">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gray-600 rounded-lg">
                <MessageSquare className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Interview Transcript</h2>
                <p className="text-sm text-gray-700 font-normal mt-1">Complete conversation record</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100/80 border border-gray-200 rounded-xl p-6 max-h-96 overflow-y-auto shadow-sm">
              {typeof attemptData.transcript === 'string' ? (
                <div className="text-gray-900 whitespace-pre-wrap text-sm leading-relaxed font-mono">
                  {attemptData.transcript}
                </div>
              ) : (
                <pre className="text-sm text-gray-900 font-mono leading-relaxed">
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
              onClick={() => router.push('/dashboard/tools/mock-Interview')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Practice Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultAfterSession; 
