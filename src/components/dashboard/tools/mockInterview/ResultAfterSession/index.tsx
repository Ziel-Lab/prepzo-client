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

  // Parse structured feedback
  const parseStructuredFeedback = (): StructuredFeedback | null => {
    if (typeof feedback === 'object' && feedback !== null) {
      return feedback as StructuredFeedback;
    }
    return null;
  };

  // Standardized score parsing and display - NEVER show percentages, always ratings
  const parseAndDisplayScore = () => {
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

  const parseAdditionalQA = (qaText: string) => {
    console.log('🔍 parseAdditionalQA: Starting to parse:', qaText.substring(0, 200) + '...');
    const results = [];
    let currentIndex = 0;
    let questionNumber = 1;
    
    while (true) {
      // Try multiple question marker formats - both old and new
      const questionMarkers = [
        // New format: **Question 1: [question text]**
        `**Question ${questionNumber}:`,
        // Old format: **Question 1:**
        `**Question ${questionNumber}:**`,
        // Additional old formats
        `**Additional Question ${questionNumber}:**`,
        `### Additional Question ${questionNumber}:`,
        `### Question ${questionNumber}:`
      ];
      
      console.log(`🔍 Looking for question ${questionNumber} with markers:`, questionMarkers);
      
      let questionIndex = -1;
      let usedMarker = '';
      let isNewFormat = false;
      
      // Find which marker format exists
      for (const marker of questionMarkers) {
        const index = qaText.indexOf(marker, currentIndex);
        if (index !== -1) {
          questionIndex = index;
          usedMarker = marker;
          // Check if this is the new format (no closing colon immediately)
          isNewFormat = marker === `**Question ${questionNumber}:`;
          console.log(`✅ Found marker "${usedMarker}" at index ${questionIndex}`);
          break;
        }
      }
      
      if (questionIndex === -1) {
        console.log(`❌ No marker found for question ${questionNumber}, stopping parse`);
        break;
      }
      
      let question = '';
      let questionTextStart = questionIndex + usedMarker.length;
      
      if (isNewFormat) {
        // New format: extract question from **Question 1: [question text]**
        const questionEndMarker = '**';
        const questionEndIndex = qaText.indexOf(questionEndMarker, questionTextStart);
        if (questionEndIndex !== -1) {
          question = qaText.substring(questionTextStart, questionEndIndex).trim();
          // Update questionTextStart to be after the closing **
          questionTextStart = questionEndIndex + 2;
          console.log(`📝 New format question extracted: "${question}"`);
        }
      } else {
        // Old format: question text is after the marker and before response
        const responseMarker = '**Appropriate Response:**';
        const responseIndex = qaText.indexOf(responseMarker, questionTextStart);
        console.log(`🔍 Looking for response marker at index ${responseIndex} starting from ${questionTextStart}`);
        if (responseIndex !== -1) {
          question = qaText.substring(questionTextStart, responseIndex).trim();
          console.log(`📝 Old format question extracted: "${question.substring(0, 100)}..."`);
        } else {
          console.log(`❌ Could not find response marker "**Appropriate Response:**"`);
        }
      }
      
      const responseMarker = '**Appropriate Response:**';
      const responseIndex = qaText.indexOf(responseMarker, questionTextStart);
      
      if (responseIndex === -1) {
        break;
      }
      
      const responseTextStart = responseIndex + responseMarker.length;
      
      // Look for next question to determine where this response ends
      const nextQuestionNumber = questionNumber + 1;
      const nextQuestionMarkers = [
        `**Question ${nextQuestionNumber}:`,
        `**Question ${nextQuestionNumber}:**`,
        `**Additional Question ${nextQuestionNumber}:**`,
        `### Additional Question ${nextQuestionNumber}:`,
        `### Question ${nextQuestionNumber}:`
      ];
      
      let nextQuestionIndex = -1;
      for (const marker of nextQuestionMarkers) {
        const index = qaText.indexOf(marker, responseTextStart);
        if (index !== -1) {
          nextQuestionIndex = index;
          break;
        }
      }
      
      let response;
      if (nextQuestionIndex !== -1) {
        response = qaText.substring(responseTextStart, nextQuestionIndex).trim();
      } else {
        response = qaText.substring(responseTextStart).trim();
      }
      
      // Clean up response text - remove quotes and extra whitespace
      response = response.replace(/^['"`''""]|['"`''""]$/g, '').trim();
      
      if (question && response) {
        console.log(`✅ Successfully parsed Q&A ${questionNumber}:`, { 
          question: question.substring(0, 50) + '...', 
          response: response.substring(0, 50) + '...' 
        });
        results.push({ question, response });
      } else {
        console.log(`❌ Failed to parse Q&A ${questionNumber}:`, { question, response });
      }
      
      questionNumber++;
      currentIndex = responseTextStart;
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

  // Function to format markdown text (convert ** to bold and ### to headers)
  const formatMarkdownText = (text: string) => {
    // First handle ### headers, then ** bold text
    const lines = text.split('\n');
    return lines.map((line, lineIndex) => {
      // Handle ### headers
      if (line.trim().startsWith('### ')) {
        const headerText = line.replace(/^### /, '').trim();
        return (
          <h3 key={lineIndex} className="text-lg font-bold text-emerald-900 mt-4 mb-2 first:mt-0">
            {headerText}
          </h3>
        );
      }
      
      // Handle ** bold text within the line
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      const formattedLine = parts.map((part, partIndex) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const boldText = part.slice(2, -2);
          return <strong key={partIndex} className="font-semibold text-emerald-800">{boldText}</strong>;
        }
        return part;
      });
      
      return (
        <div key={lineIndex} className="mb-2">
          {formattedLine}
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

      {/* Structured Feedback */}
      {structuredFeedback && (
        <div className="space-y-6">
          {/* Feedback Analysis */}
          <Card>
            <CardContent className="pt-6">
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

          {/* Practice Questions */}
          {structuredFeedback["additional_questions_and_answers"] && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="text-emerald-600" size={24} />
                  Practice Questions & Model Answers
                </CardTitle>
                <p className="text-gray-600 text-sm mt-1">
                  Additional questions to help you prepare for similar interviews
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  const qaData = structuredFeedback["additional_questions_and_answers"] || "";
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
                    <div className="space-y-3">
                      {parsedQA.map((qa, index) => (
                        <Collapsible key={index}>
                          <CollapsibleTrigger
                            onClick={() => toggleSection(`qa-${index}`)}
                            className="w-full text-left"
                          >
                            <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer">
                              <div className="flex items-start gap-3">
                                <Badge className="bg-emerald-600 text-white shrink-0 mt-0.5">
                                  Q{index + 1}
                                </Badge>
                                <span className="font-medium text-emerald-900 text-left">
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
                            <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Star size={14} className="text-yellow-500" />
                                Model Answer:
                              </h4>
                              <div className="text-gray-800 leading-relaxed bg-white p-3 rounded border border-gray-100">
                                {qa.response}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  );
                })()}
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
              <TrendingUp className="text-blue-600" size={20} />
              Detailed Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{feedback}</p>
            </div>
          </CardContent>
        </Card>
      )}

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
