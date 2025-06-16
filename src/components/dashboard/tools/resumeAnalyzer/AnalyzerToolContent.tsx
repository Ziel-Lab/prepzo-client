"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";

// Simplified interfaces for the result
interface FeedbackDetails {
  score: number;
  feedback: string;
}

interface NewResumeDetails {
  changes: string;
  new_resume: string;
  new_score: number;
}

interface ParsedAnalysisResult {
  feedback: FeedbackDetails;
  new_resume: NewResumeDetails;
}


const AnalyzerToolContent = () => {
  // Form state
  const [jobDescription, setJobDescription] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [additionalComments, setAdditionalComments] = useState("");
  const [selectedDocumentUrl, setSelectedDocumentUrl] = useState<string>("");

  // UI/Data flow state
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ParsedAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollingTaskId, setPollingTaskId] = useState<string | null>(null);

  const supabase = createClient();
  const resultsCardRef = useRef<HTMLDivElement>(null);

  // This effect polls the backend for the task status
  useEffect(() => {
    if (!pollingTaskId) return;

    const intervalId = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
            throw new Error("User session not found. Please log in again.");
        }

        // NOTE: This assumes you have a Next.js proxy setup for `/api/userPortal`
        const statusResponse = await fetch(`/api/userPortal/careerTools/resumeAnalyze/task-status/${pollingTaskId}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (statusResponse.status === 404) {
            // Task not found on the server, maybe due to a server restart.
            // Stop polling to prevent infinite loops.
            throw new Error("Analysis task not found. It may have expired. Please try again.");
        }
        
        if (!statusResponse.ok) {
          throw new Error('Failed to fetch task status from the server.');
        }

        const data = await statusResponse.json();

        if (data.status === 'SUCCESS') {
          clearInterval(intervalId);
          setPollingTaskId(null);

          // The backend sends feedback and new_resume as JSON strings.
          // We need to parse them before setting the state.
          const parsedResult: ParsedAnalysisResult = {
              feedback: JSON.parse(data.result.feedback),
              new_resume: JSON.parse(data.result.new_resume)
          };
          setAnalysisResult(parsedResult);
          setIsLoading(false);
        } else if (data.status === 'FAILURE') {
          clearInterval(intervalId);
          setPollingTaskId(null);
          setError(data.result?.error || 'Analysis failed on the server. Please try again.');
          setIsLoading(false);
        }
        // If status is 'PENDING', we do nothing and the interval continues.

      } catch (err: any) {
        clearInterval(intervalId);
        setPollingTaskId(null);
        setError(err.message || 'An error occurred while checking the analysis status.');
        setIsLoading(false);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(intervalId); // Cleanup on component unmount or when pollingTaskId changes
  }, [pollingTaskId, supabase.auth]);
  
  // Scroll to results when they appear
  useEffect(() => {
      if(analysisResult && resultsCardRef.current) {
          resultsCardRef.current.scrollIntoView({ behavior: 'smooth' });
      }
  }, [analysisResult]);


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDocumentUrl) {
      setError('Please provide a URL for your resume.');
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);
    setError(null);
    setPollingTaskId(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
          throw new Error("User session not found. Please log in again.");
      }

      const analysisPayload = {
        current_resume_url: selectedDocumentUrl,
        job_description: jobDescription,
        company_website: companyWebsite,
        additional_comments: additionalComments,
        resume_title: 'User Resume', // You can derive this from the URL if you wish
      };

      const analyzeResponse = await fetch('/api/userPortal/careerTools/resumeAnalyze/start-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(analysisPayload),
      });

      if (analyzeResponse.status !== 202) {
        const errorData = await analyzeResponse.json();
        throw new Error(errorData.error || 'The server failed to start the analysis task.');
      }

      const { task_id } = await analyzeResponse.json();
      setPollingTaskId(task_id);
      // The isLoading state remains true while we poll.

    } catch (err: any) {
      setIsLoading(false);
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Resume Analyzer</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="resumeUrl" className="block text-sm font-medium text-gray-700">Resume URL</label>
              <Input
                id="resumeUrl"
                type="url"
                value={selectedDocumentUrl}
                onChange={(e) => setSelectedDocumentUrl(e.target.value)}
                placeholder="https://example.com/my-resume.pdf"
                required
              />
            </div>
            <div>
              <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700">Job Description</label>
              <Textarea
                id="jobDescription"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                rows={8}
                required
              />
            </div>
            <div>
              <label htmlFor="companyWebsite" className="block text-sm font-medium text-gray-700">Company Website</label>
              <Input
                id="companyWebsite"
                type="url"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
                placeholder="https://example.com"
                required
              />
            </div>
             <div>
              <label htmlFor="additionalComments" className="block text-sm font-medium text-gray-700">Additional Comments (Optional)</label>
              <Textarea
                id="additionalComments"
                value={additionalComments}
                onChange={(e) => setAdditionalComments(e.target.value)}
                placeholder="Any specific aspects you want the AI to focus on?"
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</> : "Analyze Resume"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading && pollingTaskId && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="font-semibold text-lg">Analysis in Progress...</p>
            <p className="text-sm text-gray-600 mt-2">This may take a moment. The results will appear here automatically when complete.</p>
          </CardContent>
        </Card>
      )}
      
      {error && <p className="text-red-500 p-4 bg-red-100 rounded-md text-center">{error}</p>}

      {analysisResult && (
        <Card ref={resultsCardRef}>
          <CardHeader>
            <CardTitle>Analysis Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div>
                <h3 className="text-lg font-semibold">Feedback (Score: {analysisResult.feedback.score}/10)</h3>
                <pre className="p-4 bg-gray-100 rounded-md overflow-x-auto text-sm">
                  {analysisResult.feedback.feedback}
                </pre>
             </div>
             <div>
                <h3 className="text-lg font-semibold">Suggested Improvements (New Score: {analysisResult.new_resume.new_score}/10)</h3>
                <pre className="p-4 bg-gray-100 rounded-md overflow-x-auto text-sm">
                  {analysisResult.new_resume.new_resume}
                </pre>
             </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyzerToolContent;