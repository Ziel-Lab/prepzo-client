"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  Copy, 
  FileText as FileIcon, 
  Lightbulb,
  Calendar,
  ExternalLink,
  Clock,
  Loader2,
  Wand2
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface CoverLetterResult {
  cover_letter: string;
  additional_comments: string;
}

interface CoverLetterItem {
  id: string | number;
  job_id?: string | number;
  job_description?: string;
  company_website?: string;
  current_resume?: string;
  resume_title?: string;
  user_additional_comments?: string;
  generated_outputs: CoverLetterResult;
  created_at: string;
  status: 'completed' | 'failed' | 'pending' | 'in_progress';
}

// Helper function to process markdown content
const processMarkdownContent = (content: string): string => {
  if (!content) return '';
  return content;
};

const CoverLetterDetailsPage = ({ params }: { params: { id: string } }) => {
  const routeParams = useParams();
  const currentId = Array.isArray(routeParams?.id) ? routeParams.id[0] : (routeParams?.id || params?.id);
  const router = useRouter();
  const { toast } = useToast();
  const [coverLetterItem, setCoverLetterItem] = useState<CoverLetterItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchCoverLetterDetails = async () => {
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
        
        const historyUrl = `${backendUrl.replace(/\/$/, '')}/get-cover-letters?job_id=${currentId}`;
        const response = await fetch(historyUrl, {
          method: "GET",
          headers: { Authorization: `Bearer ${jwtToken}`, "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch cover letter: ${response.status}`);
        }

        const data = await response.json();
        const item = Array.isArray(data) ? data[0] : data;
        
        if (!item) {
          setError("Cover letter not found.");
          return;
        }

        // Parse the feedback
        let parsedFeedback: CoverLetterResult;
        if (typeof item.feedback === 'string') {
          try {
            parsedFeedback = JSON.parse(item.feedback);
          } catch {
            parsedFeedback = { cover_letter: '', additional_comments: '' };
          }
        } else {
          parsedFeedback = item.feedback || { cover_letter: '', additional_comments: '' };
        }

        // Derive resume title from URL
        let derivedResumeTitle = 'N/A';
        if (item.current_resume && typeof item.current_resume === 'string') {
          try {
            const urlParts = item.current_resume.split('/');
            const fileNameWithPotentialQuery = urlParts[urlParts.length - 1];
            const fileName = fileNameWithPotentialQuery.split('?')[0];
            derivedResumeTitle = decodeURIComponent(fileName);
          } catch (e) {
            // Error deriving resume title from URL
          }
        }

        const formattedItem: CoverLetterItem = {
          id: item.id,
          job_id: item.job_id,
          job_description: item.job_description,
          company_website: item.company_website,
          current_resume: item.current_resume,
          resume_title: derivedResumeTitle,
          user_additional_comments: item.additional_comments,
          generated_outputs: parsedFeedback,
          created_at: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A',
          status: 'completed'
        };

        setCoverLetterItem(formattedItem);
      } catch (err: unknown) {
        setError("Failed to load cover letter details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoverLetterDetails();
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-purple-600" />
              <p className="text-lg text-gray-600">Loading cover letter details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !coverLetterItem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cover Letter Generator
            </Button>
          </div>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || "Cover letter not found."}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div key={typeof currentId === 'string' ? currentId : String(currentId)} className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-6 hover:bg-purple-100">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cover Letter Generator
          </Button>
          
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-0 mb-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl">
                  <Wand2 className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
                    Cover Letter Details
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 mt-1">Generated on {coverLetterItem.created_at}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {getStatusBadge(coverLetterItem.status)}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-6">
              <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileIcon className="h-4 sm:h-5 w-4 sm:w-5 text-gray-600" />
                  <span className="font-semibold text-gray-700 text-sm sm:text-base">Resume Used</span>
                </div>
                {coverLetterItem.current_resume ? (
                  <Link 
                    href={coverLetterItem.current_resume} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs sm:text-sm break-all"
                  >
                    {coverLetterItem.resume_title}
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </Link>
                ) : (
                  <span className="text-gray-500 text-xs sm:text-sm">{coverLetterItem.resume_title || 'N/A'}</span>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ExternalLink className="h-4 sm:h-5 w-4 sm:w-5 text-gray-600" />
                  <span className="font-semibold text-gray-700 text-sm sm:text-base">Company</span>
                </div>
                {coverLetterItem.company_website ? (
                  <Link 
                    href={coverLetterItem.company_website} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm flex items-center gap-1 break-all"
                  >
                    {coverLetterItem.company_website.replace(/^https?:\/\//, '')}
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </Link>
                ) : (
                  <span className="text-gray-500 text-xs sm:text-sm">N/A</span>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 sm:h-5 w-4 sm:w-5 text-gray-600" />
                  <span className="font-semibold text-gray-700 text-sm sm:text-base">Job Description</span>
                </div>
                <p className="text-gray-700 text-xs sm:text-sm break-words">
                  {coverLetterItem.job_description ? 
                    (coverLetterItem.job_description.length > 100 ? 
                      coverLetterItem.job_description.substring(0, 100) + '...' : 
                      coverLetterItem.job_description
                    ) : 'N/A'
                  }
                </p>
              </div>
            </div>

            {coverLetterItem.user_additional_comments && (
              <div className="mt-6 bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 sm:h-5 w-4 sm:w-5 text-blue-600" />
                  <span className="font-semibold text-gray-700 text-sm sm:text-base">Your Additional Comments</span>
                </div>
                <p className="text-gray-700 text-xs sm:text-sm">{coverLetterItem.user_additional_comments}</p>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Cover Letter */}
          <Card className="bg-white shadow-xl border-0 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-2xl flex items-center gap-2 sm:gap-3">
                <FileIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                Generated Cover Letter
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-8">
              <div className="flex justify-end mb-4 sm:mb-6">
                <Button 
                  variant="outline"
                  size="sm" 
                  onClick={() => copyToClipboard(coverLetterItem.generated_outputs.cover_letter, 'Cover Letter')}
                  className="text-xs sm:text-sm"
                >
                  <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Copy Letter
                </Button>
              </div>
              <div className="prose prose-sm sm:prose-lg max-w-none p-4 sm:p-8 bg-gray-50 rounded-xl sm:rounded-2xl border border-gray-200 min-h-[600px] max-h-[800px] overflow-y-auto">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                >
                  {processMarkdownContent(coverLetterItem.generated_outputs.cover_letter || "No cover letter content available")}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>

          {/* AI Suggestions */}
          {coverLetterItem.generated_outputs.additional_comments && (
            <Card className="bg-white shadow-xl border-0 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-2xl flex items-center gap-2 sm:gap-3">
                  <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6" />
                  AI Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-8">
                <div className="flex justify-end mb-4 sm:mb-6">
                  <Button 
                    variant="outline"
                    size="sm" 
                    onClick={() => copyToClipboard(coverLetterItem.generated_outputs.additional_comments, 'AI Suggestions')}
                    className="text-xs sm:text-sm"
                  >
                    <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Copy Suggestions
                  </Button>
                </div>
                <div className="prose prose-sm sm:prose-lg max-w-none p-4 sm:p-8 bg-amber-50 rounded-xl sm:rounded-2xl border-2 border-amber-200 min-h-[400px] max-h-[800px] overflow-y-auto">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                  >
                    {processMarkdownContent(coverLetterItem.generated_outputs.additional_comments)}
                  </ReactMarkdown>
                </div>
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600 italic">
                    💡 Consider incorporating these suggestions into your next cover letter generation for even better results!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoverLetterDetailsPage;
