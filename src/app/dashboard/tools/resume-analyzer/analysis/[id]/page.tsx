"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  Copy, 
  FileText as FileIcon, 
  Sparkles, 
  Flame, 
  Lightbulb, 
  Calendar,
  ExternalLink,
  Download,
  Share2,
  Clock,
  Loader2
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface FeedbackDetails {
  score: number;
  feedback: string; 
}

interface NewResumeDetails {
  changes: string; 
  new_resume: string;
  new_score: number;
}
interface AnalysisItem {
  id: string | number;
  job_id?: string | number;
  resume_url?: string; 
  resume_title?: string;
  company_website?: string;
  job_description?: string; 
  created_at: string; 
  score?: number;
  new_score?: number;
  feedback?: string; 
  new_resume?: string; 
  job_description_title?: string; 
  is_roast?: boolean;
  roast_feedback_text?: string;
  additional_comment?: string;
  status: 'completed' | 'failed' | 'pending' | 'in_progress';
}

// Helper function to process markdown content

const processMarkdownContent = (content: string): string => {
  if (!content) return '';
  return content;
};

const AnalysisDetailsPage = ({ params }: { params: { id: string } }) => {
  // Get id from params for SSR support
  const routeParams = useParams();
  const currentId = Array.isArray(routeParams?.id) ? routeParams.id[0] : (routeParams?.id || params?.id);
  const router = useRouter();
  const { toast } = useToast();
  const [analysisItem, setAnalysisItem] = useState<AnalysisItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchAnalysisDetails = async () => {
      if (!currentId) return;
      
      setIsLoading(true);
      setError(null);

      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData?.session?.access_token) {
          setError("Could not retrieve user session.");
          return;
        }
        const jwtToken = sessionData.session.access_token;

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
        if (!backendUrl) throw new Error("Backend URL is not configured.");
        
        const historyUrl = `${backendUrl.replace(/\/$/, '')}/get-analyze-resume?job_id=${currentId}`;
        const response = await fetch(historyUrl, {
          method: "GET",
          headers: { Authorization: `Bearer ${jwtToken}`, "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch analysis: ${response.status}`);
        }

        const data = await response.json();
        const item = Array.isArray(data) ? data[0] : data;
        
        if (!item) {
          setError("Analysis not found.");
          return;
        }

        // Debug logging to see the actual data structure
        console.log('Raw item data:', item);
        console.log('feedback_analysis:', item.feedback_analysis);
        if (item.feedback_analysis) {
          console.log('feedback object:', item.feedback_analysis.feedback);
          console.log('new_resume object:', item.feedback_analysis.new_resume);
        }

        // Parse the analysis data - API returns structured objects, not stringified JSON
        const isRoastItem = !item.job_description && item.additional_comment === "Resume Roast";
        let parsedScore: number | undefined = undefined;
        let roastFeedbackTextFromApi: string | undefined = undefined;

        if (isRoastItem && item.feedback_analysis) {
          const roastPayload = item.feedback_analysis.feedback ?? item.feedback_analysis.roast;
          if (typeof roastPayload === 'object' && roastPayload !== null) {
            roastFeedbackTextFromApi = (roastPayload as {roast?: string}).roast;
          } else if (typeof roastPayload === 'string') {
            roastFeedbackTextFromApi = roastPayload;
          }
        } else if (item.feedback_analysis && item.feedback_analysis.feedback) {
          // The feedback is already an object with score and feedback properties
          const feedbackObj = item.feedback_analysis.feedback;
          if (typeof feedbackObj === 'object' && feedbackObj !== null) {
            parsedScore = Number((feedbackObj as FeedbackDetails).score);
          }
        }

        const resumeUrlFromAPI = item.current_resume;
        let derivedResumeTitle = 'N/A';
        if (resumeUrlFromAPI && typeof resumeUrlFromAPI === 'string') {
          try {
            const urlParts = resumeUrlFromAPI.split('/');
            const fileNameWithPotentialQuery = urlParts[urlParts.length - 1];
            const fileName = fileNameWithPotentialQuery.split('?')[0];
            derivedResumeTitle = decodeURIComponent(fileName);
          } catch (e) {
            // Error deriving resume title from URL
          }
        }

        const formattedItem: AnalysisItem = {
          id: item.id,
          job_id: item.job_id,
          resume_url: resumeUrlFromAPI,
          resume_title: derivedResumeTitle,
          company_website: item.company_website,
          job_description: item.job_description,
          created_at: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A',
          score: parsedScore,
          new_score: !isRoastItem && item.feedback_analysis && item.feedback_analysis.new_resume ? (() => {
            const newResumeObj = item.feedback_analysis.new_resume;
            if (typeof newResumeObj === 'object' && newResumeObj !== null) {
              return Number((newResumeObj as NewResumeDetails).new_score);
            }
            return undefined;
          })() : undefined,
          feedback: !isRoastItem && item.feedback_analysis && item.feedback_analysis.feedback ? 
            JSON.stringify(item.feedback_analysis.feedback) : undefined,
          new_resume: !isRoastItem && item.feedback_analysis && item.feedback_analysis.new_resume ? 
            JSON.stringify(item.feedback_analysis.new_resume) : undefined,
          job_description_title: isRoastItem ? "Resume Roast" : 
            (item.job_description && typeof item.job_description === 'string' ? 
              item.job_description.substring(0, 70) + '...' : 'N/A'),
          is_roast: isRoastItem,
          roast_feedback_text: roastFeedbackTextFromApi,
          additional_comment: item.additional_comment,
          status: 'completed'
        };

        setAnalysisItem(formattedItem);
      } catch (err: unknown) {
        setError("Failed to load analysis details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysisDetails();
  }, [currentId, supabase]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
      duration: 2000,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'in_progress':
        return <Badge variant="outline"><Loader2 className="w-3 h-3 mr-1 animate-spin" />In Progress</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-lg text-gray-600">Loading analysis details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analysisItem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Resume Analyzer
            </Button>
          </div>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || "Analysis not found."}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Key the root element with currentId to force remount on id change
  return (
    <div key={typeof currentId === 'string' ? currentId : String(currentId)} className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-6 hover:bg-blue-100">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Resume Analyzer
          </Button>
          
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {analysisItem.is_roast ? (
                  <div className="p-3 bg-gradient-to-br from-red-100 to-orange-100 rounded-xl">
                    <Flame className="h-8 w-8 text-red-600" />
                  </div>
                ) : (
                  <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl">
                    <Sparkles className="h-8 w-8 text-blue-600" />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {analysisItem.is_roast ? "Resume Roast" : "Resume Analysis"} Details
                  </h1>
                  <p className="text-gray-600 mt-1">Analysis from {analysisItem.created_at}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(analysisItem.status)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileIcon className="h-5 w-5 text-gray-600" />
                  <span className="font-semibold text-gray-700">Resume</span>
                </div>
                {analysisItem.resume_url ? (
                  <a 
                    href={analysisItem.resume_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                  >
                    {analysisItem.resume_title}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-gray-500 text-sm">{analysisItem.resume_title || 'N/A'}</span>
                )}
              </div>

              {!analysisItem.is_roast && (
                <>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ExternalLink className="h-5 w-5 text-gray-600" />
                      <span className="font-semibold text-gray-700">Company</span>
                    </div>
                    {analysisItem.company_website ? (
                      <a 
                        href={analysisItem.company_website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                      >
                        {analysisItem.company_website.replace(/^https?:\/\//, '')}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-gray-500 text-sm">N/A</span>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-5 w-5 text-gray-600" />
                      <span className="font-semibold text-gray-700">Job Position</span>
                    </div>
                    <p className="text-gray-700 text-sm">{analysisItem.job_description_title}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {analysisItem.is_roast ? (
          // Roast Content
          <Card className="bg-white shadow-xl border-0 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
              <CardTitle className="text-2xl flex items-center gap-3">
                <Flame className="h-6 w-6" />
                Your Resume Roast 🔥
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex justify-end mb-4">
                <Button 
                  variant="outline" 
                  onClick={() => copyToClipboard(analysisItem.roast_feedback_text || '', 'Roast')}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Roast
                </Button>
              </div>
                  <div className="prose prose-lg max-w-none p-8 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 rounded-2xl border-2 border-orange-200 [&_ul]:list-none [&_ol]:list-none [&_li]:pl-4">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                    >
                      {processMarkdownContent(analysisItem.roast_feedback_text || "No roast content available")}
                    </ReactMarkdown>
                  </div>
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 italic">
                  Remember, this roast is for entertainment purposes. Take it with a grain of salt! 😄
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Analysis Content
          <Tabs defaultValue="feedback" className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-xl p-1">
                <TabsTrigger value="feedback" className="flex items-center gap-2 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  Original Analysis
                </TabsTrigger>
                <TabsTrigger 
                  value="improved" 
                  className="flex items-center gap-2 rounded-lg"
                  disabled={!analysisItem.new_resume}
                >
                  <Sparkles className="h-4 w-4" />
                  Improved Resume
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="feedback">
              <Card className="bg-white shadow-xl border-0 rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-2xl flex items-center gap-3">
                      <AlertCircle className="h-6 w-6" />
                      Original Resume Analysis
                    </CardTitle>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{analysisItem.score || 'N/A'}/10</div>
                      <div className="text-sm opacity-90">Overall Score</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="flex justify-end mb-6">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        try {
                          const feedbackDetails: FeedbackDetails = JSON.parse(analysisItem.feedback || '');
                          copyToClipboard(feedbackDetails.feedback || '', 'Analysis');
                        } catch {
                          copyToClipboard('Unable to copy analysis content', 'Analysis');
                        }
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Analysis
                    </Button>
                  </div>
                  <div className="prose prose-lg max-w-none p-8 [&_ul]:list-none [&_ol]:list-none [&_li]:pl-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mb-4 [&_h1]:border-b-2 [&_h1]:border-blue-200 [&_h1]:pb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-800 [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:underline [&_h2]:decoration-blue-400 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-blue-700 [&_h3]:mb-2 [&_h3]:mt-4 [&_strong]:font-bold [&_strong]:text-gray-900 [&_em]:italic [&_em]:text-blue-600">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                    >
                      {(() => {
                        try {
                          let feedbackContent = '';
                          if (analysisItem.feedback) {
                            if (typeof analysisItem.feedback === 'string') {
                              const feedbackDetails: FeedbackDetails = JSON.parse(analysisItem.feedback);
                              feedbackContent = feedbackDetails.feedback || '';
                            } else if (typeof analysisItem.feedback === 'object' && analysisItem.feedback !== null) {
                              feedbackContent = (analysisItem.feedback as FeedbackDetails).feedback || '';
                            }
                          }
                          return processMarkdownContent(feedbackContent);
                        } catch (error) {
                          console.error('Error parsing feedback:', error);
                          return processMarkdownContent('Unable to load feedback content');
                        }
                      })()}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="improved">
              {analysisItem.new_resume && (
                <div className="space-y-6">
                  <Card className="bg-white shadow-xl border-0 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-2xl flex items-center gap-3">
                          <Sparkles className="h-6 w-6" />
                          Improved Resume
                        </CardTitle>
                        <div className="text-right">
                          <div className="text-3xl font-bold">{analysisItem.new_score || 'N/A'}/10</div>
                          <div className="text-sm opacity-90">New Score</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8">
                      <Tabs defaultValue="changes" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-xl p-1 mb-6">
                          <TabsTrigger value="changes" className="flex items-center gap-2 rounded-lg">
                            <Lightbulb className="h-4 w-4" />
                            Summary of Changes
                          </TabsTrigger>
                          <TabsTrigger value="resume" className="flex items-center gap-2 rounded-lg">
                            <FileIcon className="h-4 w-4" />
                            Updated Resume
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="changes">
                          <div className="prose prose-lg max-w-none p-8 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl border-2 border-yellow-200 [&_ul]:list-none [&_ol]:list-none [&_li]:pl-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mb-4 [&_h1]:border-b-2 [&_h1]:border-yellow-400 [&_h1]:pb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-800 [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:underline [&_h2]:decoration-yellow-500 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-amber-700 [&_h3]:mb-2 [&_h3]:mt-4 [&_strong]:font-bold [&_strong]:text-gray-900 [&_em]:italic [&_em]:text-amber-600">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                            >
                              {(() => {
                                try {
                                  let changesContent = '';
                                  if (analysisItem.new_resume) {
                                    if (typeof analysisItem.new_resume === 'string') {
                                      const newResumeDetails: NewResumeDetails = JSON.parse(analysisItem.new_resume);
                                      changesContent = newResumeDetails.changes || '';
                                    } else if (typeof analysisItem.new_resume === 'object' && analysisItem.new_resume !== null) {
                                      changesContent = (analysisItem.new_resume as NewResumeDetails).changes || '';
                                    }
                                  }
                                  return processMarkdownContent(changesContent || 'No changes summary available');
                                } catch (error) {
                                  console.error('Error parsing changes:', error);
                                  return processMarkdownContent('No changes summary available');
                                }
                              })()}
                            </ReactMarkdown>
                          </div>
                        </TabsContent>

                        <TabsContent value="resume">
                          <div className="space-y-4">
                            <div className="flex justify-end">
                              <Button 
                                onClick={() => {
                                  try {
                                    const newResumeDetails: NewResumeDetails = JSON.parse(analysisItem.new_resume || '');
                                    copyToClipboard(newResumeDetails.new_resume || '', 'Improved Resume');
                                  } catch {
                                    copyToClipboard(analysisItem.new_resume || '', 'Improved Resume');
                                  }
                                }}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Resume Text
                              </Button>
                            </div>
                            <div className="prose prose-lg max-w-none p-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 [&_ul]:list-none [&_ol]:list-none [&_li]:pl-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mb-4 [&_h1]:border-b-2 [&_h1]:border-green-400 [&_h1]:pb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-800 [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:underline [&_h2]:decoration-green-500 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-green-700 [&_h3]:mb-2 [&_h3]:mt-4 [&_strong]:font-bold [&_strong]:text-gray-900 [&_em]:italic [&_em]:text-green-600">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                            >
                              {(() => {
                                try {
                                  let resumeContent = '';
                                  if (analysisItem.new_resume) {
                                    if (typeof analysisItem.new_resume === 'string') {
                                      const newResumeDetails: NewResumeDetails = JSON.parse(analysisItem.new_resume);
                                      resumeContent = newResumeDetails.new_resume || '';
                                    } else if (typeof analysisItem.new_resume === 'object' && analysisItem.new_resume !== null) {
                                      resumeContent = (analysisItem.new_resume as NewResumeDetails).new_resume || '';
                                    }
                                  }
                                  return processMarkdownContent(resumeContent || 'Unable to load resume content');
                                } catch (error) {
                                  console.error('Error parsing resume:', error);
                                  return processMarkdownContent('Unable to load resume content');
                                }
                              })()}
                            </ReactMarkdown>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default AnalysisDetailsPage;
