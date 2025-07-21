"use client";

import { useState, useEffect, ChangeEvent, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, AlertCircle, CheckCircle2, Copy, UploadCloud, FileText as FileIcon, Sparkles, Smile, Flame, History, Lightbulb } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createClient } from "@/utils/supabase/client";
import { Table, TableHeader, TableBody, TableCell, TableRow, TableHead } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { LimitReached } from "@/components/dashboard/settings/subscription/limitReached";
import { useSearchParams } from "next/navigation";

const loadingMessages = [
  "Our AI is reading your resume closely...",
  "Comparing your skills to the job description...",
  "Analyzing your experience and achievements...",
  "Checking for keywords and best practices...",
  "Crafting personalized feedback just for you...",
  "Preparing your improved resume version...",
  "Checking for your analysis..."
];

interface FeedbackDetails {
  score: number;
  feedback: string; 
}

interface NewResumeDetails {
  changes: string; 
  new_resume: string;
  new_score: number;
}

interface ParsedRoastPayload {
  roast: string;
}

interface ParsedAnalysisResult {
  feedback: FeedbackDetails;
  new_resume: NewResumeDetails;
  id?: string | number;
}

interface RawApiResponse {
  feedback: string;
  new_resume: string;
  roast_feedback?: string;
  analysis_id?: string | number;
  [key: string]: any;
}

interface UserDocument {
  id: number | string;
  title: string;
  url?: string;
}

interface AnalysisHistoryItem {
  id: string | number;
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
}

const AnalyzerToolContent = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [additionalComments, setAdditionalComments] = useState("");
  const [resumeInputMethod, setResumeInputMethod] = useState<'select' | 'upload'>('select');
  const [userDocuments, setUserDocuments] = useState<UserDocument[]>([]);
  const [selectedDocumentUrl, setSelectedDocumentUrl] = useState<string>("");
  const [newResumeFile, setNewResumeFile] = useState<File | null>(null);
  const [toolMode, setToolMode] = useState<'analyze' | 'roast'>('analyze');
  const [isFetchingUserDocs, setIsFetchingUserDocs] = useState(true);
  const [isUploadingNewResume, setIsUploadingNewResume] = useState(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ParsedAnalysisResult | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ jobDescription?: string; companyWebsite?: string }>({});
  const [isLoadingRoast, setIsLoadingRoast] = useState(false);
  const [roastResult, setRoastResult] = useState<string | null>(null);
  const [roastError, setRoastError] = useState<string | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryItem[]>([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [showImprovedResume, setShowImprovedResume] = useState(false);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | number | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [limitReached, setLimitReached] = useState(false);
  const [selectedHistoryItemForDialog, setSelectedHistoryItemForDialog] = useState<AnalysisHistoryItem | null>(null);
  const searchParams = useSearchParams();

  const supabase = createClient();
  const resultsCardRef = useRef<HTMLDivElement>(null);
  const loadingCardRef = useRef<HTMLDivElement>(null);

  // Polling refs & helpers (for async analysis)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
    pollIntervalRef.current = null;
    pollingTimeoutRef.current = null;
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isLoadingAnalysis || isLoadingRoast) {
        setLoadingMessage(loadingMessages[0]);
        intervalId = setInterval(() => {
            setLoadingMessage(prev => {
                const currentIndex = loadingMessages.indexOf(prev);
                return loadingMessages[(currentIndex + 1) % loadingMessages.length];
            });
        }, 3500);
    }
    return () => clearInterval(intervalId);
  }, [isLoadingAnalysis, isLoadingRoast]);

  useEffect(() => {
    const fetchData = async () => {
      setIsFetchingUserDocs(true);
      setIsFetchingHistory(true);
      setError(null);
      setHistoryError(null);

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session?.access_token) {
        const errMsg = "Could not retrieve user session.";
        setError(errMsg);
        setHistoryError(errMsg + " Cannot fetch analysis history.");
        setIsFetchingUserDocs(false);
        setIsFetchingHistory(false);
        setResumeInputMethod('upload');
        return;
      }
      const jwtToken = sessionData.session.access_token;

      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
        if (!backendUrl) throw new Error("Backend URL for user portal is not configured.");
        const docsUrl = `${backendUrl.replace(/\/$/, '')}/get-documents`;
        const docsResponse = await fetch(docsUrl, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${jwtToken}`,
            "Content-Type": "application/json",
          },
        });
        if (!docsResponse.ok) {
          const errorData = await docsResponse.json().catch(() => ({ error: "Failed to parse error JSON for documents" }));
          throw new Error(errorData.error || `HTTP error fetching documents: ${docsResponse.status}`);
        }
        const fetchedDocsRaw = await docsResponse.json();
        const fetchedDocs: UserDocument[] = fetchedDocsRaw.map((doc: any) => ({
          id: doc.id,
          title: doc.document_name || doc.display_name || "Untitled Document",
          url: doc.document_url,
        }));
        setUserDocuments(fetchedDocs);
        if (!(fetchedDocs.length > 0 && fetchedDocs[0].url)) {
            setResumeInputMethod('upload');
        }
      } catch (err: any) {
        setError("Unable to load your documents right now. Please refresh the page and try again!");
        setResumeInputMethod('upload'); 
      } finally {
        setIsFetchingUserDocs(false);
      }

      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
        if (!backendUrl) throw new Error("Backend URL is not configured for history.");
        const historyUrl = `${backendUrl.replace(/\/$/, '')}/get-analyze-resume`;
        const historyResponse = await fetch(historyUrl, {
          method: "GET",
          headers: { "Authorization": `Bearer ${jwtToken}`, "Content-Type": "application/json" },
        });
        if (!historyResponse.ok) {
          const errorData = await historyResponse.json().catch(() => ({error: "Failed to parse history error"}));
          throw new Error(errorData.error || `HTTP error fetching history: ${historyResponse.status}`);
        }
        const historyDataFromApi: any[] = await historyResponse.json();

        const formattedHistory: AnalysisHistoryItem[] = historyDataFromApi.map((item: any) => {
          let parsedScore: number | undefined = undefined;
          const isRoastItem = !item.job_description && item.additional_comment === "Resume Roast Feedback";
          let roastFeedbackTextFromApi: string | undefined = undefined;

          if (isRoastItem) {
            // Roast payload shape can be string or object
            if (item.feedback_analysis) {
              const roastPayload = item.feedback_analysis.feedback ?? item.feedback_analysis.roast;
              if (typeof roastPayload === 'string') {
                try {
                  const parsedInnerJson: ParsedRoastPayload = JSON.parse(roastPayload);
                  roastFeedbackTextFromApi = parsedInnerJson.roast;
                } catch {
                  roastFeedbackTextFromApi = roastPayload;
                }
              } else if (typeof roastPayload === 'object' && roastPayload !== null) {
                roastFeedbackTextFromApi = (roastPayload as ParsedRoastPayload).roast;
              }
            }
          } else if (item.feedback_analysis) {
            // -------- Parse score --------
            const feedbackPayload = item.feedback_analysis.feedback;
            if (typeof feedbackPayload === 'string') {
              try {
                const feedbackDetails: FeedbackDetails = JSON.parse(feedbackPayload);
                parsedScore = Number(feedbackDetails.score); // ensure numeric
              } catch { /* score parse error ignored */ void 0; }
            } else if (typeof feedbackPayload === 'object' && feedbackPayload !== null) {
              const scoreVal = (feedbackPayload as FeedbackDetails).score as unknown;
              parsedScore = typeof scoreVal === 'string' ? Number(scoreVal) : (scoreVal as number | undefined);
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
          
          const jobDescTitle = isRoastItem 
            ? "Resume Roast" 
            : (item.job_description ? (item.job_description as string).substring(0, 70) + '...' : 'N/A');

          return {
            id: item.id,
            resume_url: resumeUrlFromAPI,
            resume_title: derivedResumeTitle,
            company_website: item.company_website,
            job_description: item.job_description,
            created_at: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A',
            score: parsedScore,
            new_score: !isRoastItem && item.feedback_analysis ? (() => {
                const newResumePayload = item.feedback_analysis.new_resume;
                if (typeof newResumePayload === 'string') {
                  try {
                    const newResumeDetails: NewResumeDetails = JSON.parse(newResumePayload);
                    return Number(newResumeDetails.new_score);
                  } catch { /* new_score parse error ignored */ return undefined; }
                } else if (typeof newResumePayload === 'object' && newResumePayload !== null) {
                  const ns = (newResumePayload as NewResumeDetails).new_score as unknown;
                  return typeof ns === 'string' ? Number(ns) : (ns as number | undefined);
                }
                return undefined;
            })() : undefined,
            feedback: !isRoastItem && item.feedback_analysis ? (typeof item.feedback_analysis.feedback === 'string' ? item.feedback_analysis.feedback : JSON.stringify(item.feedback_analysis.feedback)) : undefined,
            new_resume: !isRoastItem && item.feedback_analysis ? (typeof item.feedback_analysis.new_resume === 'string' ? item.feedback_analysis.new_resume : JSON.stringify(item.feedback_analysis.new_resume)) : undefined,
            job_description_title: jobDescTitle,
            is_roast: isRoastItem,
            roast_feedback_text: roastFeedbackTextFromApi,
            additional_comment: item.additional_comment,
          };
        });
        setAnalysisHistory(formattedHistory);
      } catch (err: any) {
        setHistoryError("Unable to load your analysis history. Please refresh the page and try again!");
      } finally {
        setIsFetchingHistory(false);
      }
    };
    if (supabase) {
        fetchData();
    }
  }, [supabase]);

  // Prefill job description and company website from query params when component mounts
  useEffect(() => {
    const jobDescParam = searchParams.get("jobDescription");
    const companyWebsiteParam = searchParams.get("companyWebsite");

    if (jobDescParam) {
      try {
        setJobDescription(decodeURIComponent(jobDescParam));
      } catch {
        setJobDescription(jobDescParam);
      }
    }

    if (companyWebsiteParam) {
      try {
        let url = decodeURIComponent(companyWebsiteParam);
        if (!/^https?:\/\//i.test(url)) {
          url = `https://${url}`;
        }
        setCompanyWebsite(url);
      } catch {
        setCompanyWebsite(companyWebsiteParam);
      }
    }
    // We run this only once on mount – searchParams is stable in Next.js App Router
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNewResumeFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      // Friendly PDF validation
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError(
          "Hey there! 👋 We'd love to help you with your resume, but our AI works best with PDF files. " +
          "PDFs preserve your formatting perfectly and are what most recruiters expect. " +
          "Could you convert your file to PDF and try again? Most word processors have a 'Save as PDF' option!"
        );
        setNewResumeFile(null);
        // Clear the input
        event.target.value = '';
        return;
      }
      
      setNewResumeFile(file);
      setSelectedDocumentUrl("");
      setError(null); 
    } else {
      setNewResumeFile(null);
    }
  };
  
  const uploadNewResumeAndGetUrl = async (file: File): Promise<string | null> => {
    setIsUploadingNewResume(true);
    setError(null);
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session?.access_token) {
      setError("Session error. Cannot upload new resume.");
      setIsUploadingNewResume(false);
      return null;
    }
    const jwtToken = sessionData.session.access_token;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", "Resume");

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
      if (!backendUrl) throw new Error("Backend URL (user portal) not configured for upload.");
      const uploadUrl = `${backendUrl.replace(/\/$/, '')}/upload-document`;
      
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Authorization": `Bearer ${jwtToken}` },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Upload failed, could not parse error."}) );
        throw new Error(errorData.error || `Upload failed: ${response.status}`);
      }
      const result = await response.json();
      if (!result.file_url) {
        throw new Error("Upload successful, but no file URL was returned.");
      }
      return result.file_url;
    } catch (err:any) {
      setError("Upload failed. Please refresh the page and try uploading your resume again!");
      return null;
    } finally {
      setIsUploadingNewResume(false);
    }
  };

  const startPolling = (
    jobId: string | number,
    resumeUrl: string,
    resumeTitle: string
  ) => {
    setLoadingMessage("Checking for your analysis...");

    const poll = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session?.access_token) {
        stopPolling();
        setError("Session expired during polling. Please try again.");
        setIsLoadingAnalysis(false);
        return;
      }
      const jwtToken = sessionData.session.access_token;
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
      if (!backendUrl) {
        stopPolling();
        setError("Backend URL is not configured.");
        setIsLoadingAnalysis(false);
        return;
      }

      try {
        const pollingUrl = `${backendUrl.replace(/\/$/, '')}/get-analyze-resume?job_id=${jobId}`;
        const pollingRes = await fetch(pollingUrl, {
          method: "GET",
          headers: { Authorization: `Bearer ${jwtToken}`, Accept: "application/json" },
        });

        if (!pollingRes.ok) {
          console.error(`Polling failed with status: ${pollingRes.status}`);
          return;
        }

        const raw = await pollingRes.json();
        const row: any = Array.isArray(raw) ? raw[0] : raw;
        if (!row) return;

        const feedbackPayload = row.feedback_analysis?.feedback || row.feedback;
        const newResumePayload = row.feedback_analysis?.new_resume || row.new_resume;

        let parsedFeedback: FeedbackDetails | undefined = undefined;
        let parsedNewResume: NewResumeDetails | undefined = undefined;

        if (feedbackPayload && newResumePayload) {
          // ---------- Parse feedback ----------
          if (typeof feedbackPayload === 'string') {
            try { parsedFeedback = JSON.parse(feedbackPayload); } catch { /* polling feedback parse error ignored */ void 0; }
          } else if (typeof feedbackPayload === 'object') {
            parsedFeedback = feedbackPayload as FeedbackDetails;
          }

          // ---------- Parse new resume ----------
          if (typeof newResumePayload === 'string') {
            try { parsedNewResume = JSON.parse(newResumePayload); } catch { /* polling newResume parse error ignored */ void 0; }
          } else if (typeof newResumePayload === 'object') {
            parsedNewResume = newResumePayload as NewResumeDetails;
          }
        }

        if (parsedFeedback && parsedNewResume) {
          stopPolling();
          setIsLoadingAnalysis(false);

          const analysisIdFound = row.id || jobId;
          setAnalysisResult({ id: analysisIdFound, feedback: parsedFeedback, new_resume: parsedNewResume });
          setCurrentAnalysisId(analysisIdFound);

          const newHistoryItem: AnalysisHistoryItem = {
            id: row.id || jobId,
            resume_url: resumeUrl,
            resume_title: resumeTitle,
            company_website: row.company_website || companyWebsite,
            job_description: row.job_description || jobDescription,
            created_at: new Date().toLocaleDateString(),
            score: typeof parsedFeedback.score === 'string' ? Number(parsedFeedback.score) : parsedFeedback.score,
            feedback: typeof feedbackPayload === 'string' ? feedbackPayload : JSON.stringify(feedbackPayload),
            new_resume: typeof newResumePayload === 'string' ? newResumePayload : JSON.stringify(newResumePayload),
            new_score: typeof parsedNewResume.new_score === 'string' ? Number(parsedNewResume.new_score) : parsedNewResume.new_score,
            job_description_title: (row.job_description || jobDescription || '').substring(0, 70) + '...',
            is_roast: false,
          };
          setAnalysisHistory(prev => [newHistoryItem, ...prev]);
          setNewResumeFile(null);
        }
      } catch (e) {
        console.error('Polling error:', e);
      }
    };

    pollIntervalRef.current = setInterval(poll, 60000);
    pollingTimeoutRef.current = setTimeout(() => {
      stopPolling();
      setError("Analysis is taking longer than usual. You can check the history section later.");
      setIsLoadingAnalysis(false);
    }, 180000);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoadingAnalysis(true);
    setError(null);
    setLimitReached(false);
    setAnalysisResult(null);
    setFieldErrors({});
    setShowImprovedResume(false);
    setCurrentAnalysisId(null);
    setIsLoadingRoast(false);
    setRoastResult(null);
    setRoastError(null);

    let finalResumeUrl = selectedDocumentUrl;
    const currentFieldErrors: { jobDescription?: string; companyWebsite?: string } = {};

    if (resumeInputMethod === 'upload' && newResumeFile) {
      const uploadedUrl = await uploadNewResumeAndGetUrl(newResumeFile);
      if (uploadedUrl) {
        finalResumeUrl = uploadedUrl;
        setSelectedDocumentUrl(uploadedUrl);
      } else {
        setIsLoadingAnalysis(false);
        return;
      }
    }

    if (!finalResumeUrl) {
      setError("Please select an existing resume or upload a new one.");
      setIsLoadingAnalysis(false);
      return;
    }
    // Some back-ends reject URLs with a trailing '?'. Sanitize if needed.
    if (finalResumeUrl.endsWith('?')) {
      finalResumeUrl = finalResumeUrl.slice(0, -1);
    }
    if (toolMode === 'analyze') {
        if (!jobDescription.trim()) {
        currentFieldErrors.jobDescription = "Job Description is a required field.";
        }
        if (!companyWebsite.trim()) {
        currentFieldErrors.companyWebsite = "Company Website is a required field.";
        }
    }

    if (Object.keys(currentFieldErrors).length > 0) {
      setFieldErrors(currentFieldErrors);
      setError("Please fill in all highlighted required fields.");
      setIsLoadingAnalysis(false);
      setIsLoadingRoast(false);
      return;
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session?.access_token) {
      setError("Could not retrieve user session. Please ensure you are logged in.");
      setIsLoadingAnalysis(false);
      return;
    }
    const jwtToken = sessionData.session.access_token;

    let resumeTitleForBackend = "Uploaded Resume"; 
    if (resumeInputMethod === 'select' && selectedDocumentUrl) {
        const selectedDoc = userDocuments.find(doc => doc.url === selectedDocumentUrl);
        if (selectedDoc) resumeTitleForBackend = selectedDoc.title;
    } else if (newResumeFile) {
        resumeTitleForBackend = newResumeFile.name;
    }

    if (toolMode === 'roast') {
      setIsLoadingRoast(true);
      setIsLoadingAnalysis(false);
      const roastPayload = new FormData();
      if (newResumeFile) {
        roastPayload.append("file", newResumeFile);
        roastPayload.append("document_type", "Resume");
      } else {
        roastPayload.append("current_resume_url", finalResumeUrl);
      }

      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
        if (!backendUrl) throw new Error("Backend URL for user portal is not configured.");
        const roastUrl = `${backendUrl.replace(/\/$/, '')}/roast-resume`;

        const response = await fetch(roastUrl, {
          method: "POST",
          headers: { "Authorization": `Bearer ${jwtToken}` },
          body: roastPayload,
        });

        const responseData = await response.json();

        if (!response.ok) {
          const specificError = responseData.error || responseData.details || `HTTP error! status: ${response.status}`;
          if (typeof specificError === 'string' && specificError.toLowerCase().includes("monthly limit")) {
            setLimitReached(true);
          } else {
            setRoastError("Resume roast failed to generate. Please refresh the page and try again!");
          }
          setIsLoadingRoast(false);
          return;
        }
        
        let actualRoastText: string | undefined;
        if (responseData.feedback && typeof responseData.feedback === 'string') {
            try {
                const parsedFeedbackPayload: ParsedRoastPayload = JSON.parse(responseData.feedback);
                if (parsedFeedbackPayload.roast && typeof parsedFeedbackPayload.roast === 'string') {
                    actualRoastText = parsedFeedbackPayload.roast;
                }
                          } catch (e) {
                // Error parsing nested roast feedback JSON
              }
        } else if (responseData.roast && typeof responseData.roast === 'string') {
            actualRoastText = responseData.roast;
        }

        setRoastResult(actualRoastText || "Roast complete, but no specific feedback message found.");

        const roastAnalysisId = responseData.analysis_id || Date.now();
        const newHistoryRoastItem: AnalysisHistoryItem = {
            id: roastAnalysisId,
            resume_url: finalResumeUrl, 
            resume_title: resumeTitleForBackend,
            created_at: new Date().toLocaleDateString(),
            job_description_title: "Resume Roast",
            is_roast: true,
            roast_feedback_text: actualRoastText,
            additional_comment: "Resume Roast Feedback",
        };
        if (newResumeFile && responseData.document_url) {
            const newDoc: UserDocument = {
                id: responseData.document_id || Date.now(),
                title: newResumeFile.name,
                url: responseData.document_url,
            };
            setUserDocuments(prev => [newDoc, ...prev]);
            setSelectedDocumentUrl(responseData.document_url);
            finalResumeUrl = responseData.document_url;
            newHistoryRoastItem.resume_url = responseData.document_url;
        }

        setAnalysisHistory(prevHistory => [newHistoryRoastItem, ...prevHistory].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime() ));
        setNewResumeFile(null);

      } catch (err: any) {
        setRoastError("Resume roast encountered an error. Please refresh the page and try again!");
      } finally {
        setIsLoadingRoast(false);
      }
      return;
    }

    setIsLoadingAnalysis(true);
    setIsLoadingRoast(false);

    const analysisPayload = {
      // Some back-ends expect `current_resume`, others `resume_url` – send both for compatibility
      current_resume: finalResumeUrl,
      job_description: jobDescription,
      company_website: companyWebsite,
      ...(additionalComments.trim() ? { additional_comments: additionalComments } : {}),
      // Preserve the document title so the back-end can reference it if needed
      resume_title: resumeTitleForBackend,
    };

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL; 
      if (!backendUrl) {
        throw new Error("Backend URL for user portal is not configured.");
      }
      const analyzeUrl = `${backendUrl.replace(/\/$/, '')}/analyze-resume`; 
      
      const response = await fetch(analyzeUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(analysisPayload),
      });

      if (response.status === 202) {
        const jobInfo: { job_id?: string | number } = await response.json().catch(() => ({}));
        if (jobInfo.job_id) {
          startPolling(jobInfo.job_id, finalResumeUrl, resumeTitleForBackend);
        } else {
          setError("Analysis job accepted but no job_id returned.");
          setIsLoadingAnalysis(false);
        }
        return;
      }

      const responseData: RawApiResponse = await response.json();

      if (!response.ok) {
        const specificError = responseData.error || responseData.details || `HTTP error! status: ${response.status}`;
        
        if (typeof specificError === 'string' && specificError.toLowerCase().includes("monthly limit")) {
            setLimitReached(true);
        } else {
            setError("Resume analysis failed to generate. Please refresh the page and try again!");
        }
        setIsLoadingAnalysis(false);
        return;
      }
      
      try {
        // Handle feedback (string JSON or already parsed object)
        const feedbackPayload = responseData.feedback;
        const newResumePayload = responseData.new_resume;

        let parsedFeedback: FeedbackDetails;
        if (typeof feedbackPayload === 'string') {
          try {
            parsedFeedback = JSON.parse(feedbackPayload);
          } catch {
            // If parsing fails, treat raw string as feedback text with score undefined
            parsedFeedback = { score: NaN, feedback: feedbackPayload } as unknown as FeedbackDetails;
          }
        } else {
          parsedFeedback = feedbackPayload as FeedbackDetails;
        }

        let parsedNewResume: NewResumeDetails;
        if (typeof newResumePayload === 'string') {
          try {
            parsedNewResume = JSON.parse(newResumePayload);
          } catch {
            // If parsing fails, wrap raw string
            parsedNewResume = { changes: '', new_resume: newResumePayload, new_score: NaN } as unknown as NewResumeDetails;
          }
        } else {
          parsedNewResume = newResumePayload as NewResumeDetails;
        }

        const analysisIdForCurrent = responseData.analysis_id || Date.now();

        setAnalysisResult({
          id: analysisIdForCurrent,
          feedback: parsedFeedback,
          new_resume: parsedNewResume,
        });
        setCurrentAnalysisId(analysisIdForCurrent);

        const newHistoryItem: AnalysisHistoryItem = {
          id: analysisIdForCurrent,
          resume_url: finalResumeUrl,
          resume_title: resumeTitleForBackend,
          company_website: companyWebsite,
          job_description: jobDescription,
          created_at: new Date().toLocaleDateString(),
          score: typeof parsedFeedback.score === 'string' ? Number(parsedFeedback.score) : parsedFeedback.score,
          feedback: typeof feedbackPayload === 'string' ? feedbackPayload : JSON.stringify(feedbackPayload),
          new_resume: typeof newResumePayload === 'string' ? newResumePayload : JSON.stringify(newResumePayload),
          new_score: typeof parsedNewResume.new_score === 'string' ? Number(parsedNewResume.new_score) : parsedNewResume.new_score,
          job_description_title: jobDescription.substring(0, 70) + '...',
          is_roast: false,
        };

        setAnalysisHistory(prevHistory => [newHistoryItem, ...prevHistory].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        setNewResumeFile(null);

      } catch {
        setError("Analysis results couldn't be processed. Please refresh the page and try again!");
      }

    } catch (err: any) {
      setError("Analysis request failed. Please refresh the page and try again!");
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const handleRevealImprovedResume = async () => {
    if (!analysisResult || !currentAnalysisId) return;

    setShowImprovedResume(true);
    const newScoreToSave = analysisResult.new_resume.new_score;

    setAnalysisHistory(prevHistory =>
      prevHistory.map(item =>
        item.id === currentAnalysisId
          ? { ...item, new_score: newScoreToSave }
          : item
      )
    );
  };

  useEffect(() => {
    // Scroll to loading indicator when it appears
    if ((isLoadingAnalysis || isLoadingRoast) && loadingCardRef.current) {
      const timerId = setTimeout(() => {
        loadingCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return () => clearTimeout(timerId);
    }
    
    // Scroll to results card when loading is finished and results are available
    if (resultsCardRef.current && ((toolMode === 'analyze' && analysisResult && !isLoadingAnalysis) || (toolMode === 'roast' && roastResult && !isLoadingRoast))) {
      const timerId = setTimeout(() => {
        resultsCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return () => clearTimeout(timerId);
    }
  }, [isLoadingAnalysis, isLoadingRoast, analysisResult, roastResult, toolMode]);

  if (limitReached) {
    return (
      <LimitReached 
        featureName="Resume Analysis"
        featureNamePlural="Resume Analyses & Roasts"
      />
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center"><History className="mr-2 h-5 w-5 text-gray-700"/> Analysis History</CardTitle>
          <CardDescription>Review your past resume analyses and roasts.</CardDescription>
        </CardHeader>
        <CardContent>
          {isFetchingHistory && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading history...
            </div>
          )}
          {historyError && !isFetchingHistory && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Fetching History</AlertTitle>
              <AlertDescription>{historyError}</AlertDescription>
            </Alert>
          )}
          {!isFetchingHistory && !historyError && analysisHistory.length === 0 && (
            <p className="text-sm text-gray-500 text-center p-4">No analysis history found.</p>
          )}
          {!isFetchingHistory && !historyError && analysisHistory.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[25%]">Job Info</TableHead>
                  <TableHead className="w-[25%]">Resume Used</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Score / Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysisHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                        <div className="truncate font-semibold" title={item.job_description || item.job_description_title}>
                            {item.job_description_title}
                        </div>
                        {item.company_website && !item.is_roast && <div className="text-xs text-gray-500 truncate" title={item.company_website}>{item.company_website}</div>}
                    </TableCell>
                    <TableCell className="text-xs truncate">
                        {item.resume_url ? (
                            <a href={item.resume_url} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600" title={item.resume_url}>
                                {item.resume_title || 'View Resume'}
                            </a>
                        ) : (
                            <span>{item.resume_title || 'N/A'}</span>
                        )}
                    </TableCell>
                    <TableCell>{item.created_at}</TableCell>
                    <TableCell>
                      {item.is_roast ? (
                        <span className="text-purple-600 font-semibold">Roast</span>
                      ) : typeof item.new_score === 'number' ? (
                        <span className="text-green-600 font-semibold">{`${item.new_score}/10 (Improved)`}</span>
                      ) : typeof item.score === 'number' ? (
                        `${item.score}/10`
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                           <Button variant="outline" size="sm" onClick={() => setSelectedHistoryItemForDialog(item)}>View</Button>
                        </DialogTrigger>
                        {selectedHistoryItemForDialog && selectedHistoryItemForDialog.id === item.id && (
                        <DialogContent className="sm:max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>
                              {selectedHistoryItemForDialog.is_roast ? (
                                <span className="flex items-center"><Flame className="mr-2 h-5 w-5 text-red-600"/>Resume Roast Details ({selectedHistoryItemForDialog.created_at})</span>
                              ) : (
                                <span className="flex items-center"><Sparkles className="mr-2 h-5 w-5 text-blue-600"/>Analysis Details ({selectedHistoryItemForDialog.created_at})</span>
                              )}
                            </DialogTitle>
                            <DialogDescription>
                                {!selectedHistoryItemForDialog.is_roast && (
                                  <>
                                    Job: {selectedHistoryItemForDialog.job_description_title?.replace('...','')}<br/>
                                    Company: {selectedHistoryItemForDialog.company_website || 'N/A'}<br/>
                                  </>
                                )}
                                Resume: <a href={selectedHistoryItemForDialog.resume_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedHistoryItemForDialog.resume_title || selectedHistoryItemForDialog.resume_url}</a>
                                {selectedHistoryItemForDialog.additional_comment && selectedHistoryItemForDialog.additional_comment !== "Resume Roast Feedback" && <><br/>Your Comments: <em>{selectedHistoryItemForDialog.additional_comment}</em></>}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto p-1">
                            {selectedHistoryItemForDialog.is_roast ? (
                              // Roast Content
                              <div>
                                <h4 className="font-semibold text-md mb-1 flex justify-between items-center">
                                    <span className="flex items-center"><Flame className="mr-2 h-5 w-5 text-red-600"/>Resume Roast</span>
                                    <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(selectedHistoryItemForDialog.roast_feedback_text || '')}><Copy size={12} className="mr-1"/>Copy</Button>
                                </h4>
                                <div className="prose prose-sm max-w-none p-4 bg-gradient-to-br from-amber-100 via-orange-100 to-red-200 rounded-md border min-h-[400px] max-h-[700px] overflow-y-auto">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {selectedHistoryItemForDialog.roast_feedback_text || "No roast content available"}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            ) : selectedHistoryItemForDialog.feedback || selectedHistoryItemForDialog.new_resume ? (
                              // Analysis Content
                              <>
                                {selectedHistoryItemForDialog.feedback && (
                                  <div>
                                    <h4 className="font-semibold text-md mb-1 flex justify-between items-center">
                                        <span>Original Analysis (Score: {selectedHistoryItemForDialog.score || 'N/A'}/10)</span>
                                        <Button variant="outline" size="sm" onClick={() => {
                                          try {
                                            const feedbackDetails: FeedbackDetails = JSON.parse(selectedHistoryItemForDialog.feedback || '');
                                            navigator.clipboard.writeText(feedbackDetails.feedback || '');
                                          } catch {
                                            navigator.clipboard.writeText(selectedHistoryItemForDialog.feedback || '');
                                          }
                                        }}><Copy size={12} className="mr-1"/>Copy</Button>
                                    </h4>
                                                                    <div className="prose prose-sm max-w-none p-4 bg-gray-50 rounded-md border min-h-[300px] max-h-[500px] overflow-y-auto">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {(() => {
                                      try {
                                        const feedbackDetails: FeedbackDetails = JSON.parse(selectedHistoryItemForDialog.feedback || '');
                                        return feedbackDetails.feedback || selectedHistoryItemForDialog.feedback || '';
                                      } catch {
                                        return selectedHistoryItemForDialog.feedback || '';
                                      }
                                    })()}
                                  </ReactMarkdown>
                                </div>
                                  </div>
                                )}
                                {selectedHistoryItemForDialog.new_resume && (
                                  <div>
                                    <h4 className="font-semibold text-md mb-1 flex justify-between items-center">
                                        <span className="flex items-center"><Sparkles className="mr-2 h-5 w-5 text-green-600"/>Improved Resume (Score: {selectedHistoryItemForDialog.new_score || 'N/A'}/10)</span>
                                        <Button variant="outline" size="sm" onClick={() => {
                                          try {
                                            const newResumeDetails: NewResumeDetails = JSON.parse(selectedHistoryItemForDialog.new_resume || '');
                                            navigator.clipboard.writeText(newResumeDetails.new_resume || '');
                                          } catch {
                                            navigator.clipboard.writeText(selectedHistoryItemForDialog.new_resume || '');
                                          }
                                        }}><Copy size={12} className="mr-1"/>Copy Resume</Button>
                                    </h4>
                                    
                                    {/* Changes Summary */}
                                    <div className="mb-3">
                                      <h5 className="font-medium text-sm mb-1 flex items-center"><Lightbulb className="mr-1 h-4 w-4 text-yellow-500"/>Summary of Changes:</h5>
                                      <div className="prose prose-sm max-w-none p-3 bg-yellow-50 border border-yellow-200 rounded-md min-h-[120px] max-h-[250px] overflow-y-auto">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                          {(() => {
                                            try {
                                              const newResumeDetails: NewResumeDetails = JSON.parse(selectedHistoryItemForDialog.new_resume || '');
                                              return newResumeDetails.changes || 'No changes summary available';
                                            } catch {
                                              return 'No changes summary available';
                                            }
                                          })()}
                                        </ReactMarkdown>
                                      </div>
                                    </div>
                                    
                                    {/* Improved Resume Text */}
                                    <div className="prose prose-sm max-w-none p-4 bg-green-50 rounded-md border border-green-200 min-h-[400px] max-h-[600px] overflow-y-auto">
                                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {(() => {
                                          try {
                                            const newResumeDetails: NewResumeDetails = JSON.parse(selectedHistoryItemForDialog.new_resume || '');
                                            return newResumeDetails.new_resume || selectedHistoryItemForDialog.new_resume || '';
                                          } catch {
                                            return selectedHistoryItemForDialog.new_resume || '';
                                          }
                                        })()}
                                      </ReactMarkdown>
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : (
                              <p className="text-sm text-gray-500 text-center py-4">No analysis details available for this history item.</p>
                            )}
                          </div>
                           <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary">Close</Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                        )}
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
            {toolMode === 'analyze' ? <Smile className="mr-2 h-6 w-6 text-blue-500" /> : <Flame className="mr-2 h-6 w-6 text-red-500" />}
            {toolMode === 'analyze' ? "Resume Analyzer 😊" : "Resume Roast 😈"}
          </CardTitle>
          <CardDescription>
            {toolMode === 'analyze' 
              ? "Analyze your resume against a job description to get tailored feedback and suggestions."
              : "Get a lighthearted roast of your resume. Good for a laugh and maybe some unexpected insights!"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2 p-4 border rounded-md bg-gray-50">
                <Label className="font-semibold text-lg">Choose Your Tool</Label>
                <RadioGroup
                    value={toolMode}
                    onValueChange={(value: 'analyze' | 'roast') => {
                        setToolMode(value);
                        setError(null);
                        setRoastError(null);
                        setAnalysisResult(null);
                        setRoastResult(null);
                        setFieldErrors({});
                    }}
                    className="flex items-center gap-x-6 gap-y-2 flex-wrap"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="analyze" id="analyzeMode" />
                        <Label htmlFor="analyzeMode" className="font-medium flex items-center">
                            <Smile size={18} className="mr-2 text-blue-500" /> Resume Analyzer
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="roast" id="roastMode" />
                        <Label htmlFor="roastMode" className="font-medium flex items-center">
                            <Flame size={18} className="mr-2 text-red-500"/> Resume Roast
                        </Label>
                    </div>
                </RadioGroup>
            </div>

            <div className="space-y-3 p-4 border rounded-md bg-slate-50">
              <Label className="font-semibold text-lg">Your Current Resume <span className="text-red-500">*</span></Label>
              <RadioGroup 
                defaultValue="select"
                value={resumeInputMethod}
                onValueChange={(value: 'select' | 'upload') => {
                    setResumeInputMethod(value);
                    setError(null);
                    if (value === 'select') setNewResumeFile(null);
                }}
                className="flex items-center gap-4 mb-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="select" id="selectExistingResume" disabled={isFetchingUserDocs || userDocuments.length === 0} />
                  <Label htmlFor="selectExistingResume">Select from My Documents</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="upload" id="uploadNewResume" />
                  <Label htmlFor="uploadNewResume">Upload New Resume</Label>
                </div>
              </RadioGroup>

              {isFetchingUserDocs && resumeInputMethod === 'select' && (
                <div className="flex items-center text-sm text-gray-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading your documents...
                </div>
              )}

              {resumeInputMethod === 'select' && !isFetchingUserDocs && (
                 userDocuments.length > 0 ? (
                    <Select 
                        value={selectedDocumentUrl}
                        onValueChange={(value) => {
                            setSelectedDocumentUrl(value);
                            setNewResumeFile(null);
                            setError(null);
                        }}
                        disabled={isUploadingNewResume || isLoadingAnalysis}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a document..." />
                        </SelectTrigger>
                        <SelectContent>
                        {userDocuments.map(doc => (
                            <SelectItem key={doc.id} value={doc.url || ""} disabled={!doc.url}>
                                <div className="flex items-center">
                                    <FileIcon size={16} className="mr-2 text-gray-600"/> 
                                    {doc.title} {!doc.url && "(URL missing)"}
                                </div>
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                 ) : (
                    <p className="text-sm text-gray-500">You have no documents. Please upload a new resume.</p>
                 )
              )}

              {resumeInputMethod === 'upload' && (
                <div className="space-y-3">
                  <Input 
                    id="newResumeUpload"
                                    type="file"
                accept=".pdf"
                onChange={handleNewResumeFileChange} 
                    className="w-full"
                    disabled={isUploadingNewResume || isLoadingAnalysis}
                  />
                  {newResumeFile && (
                    <p className="text-xs text-gray-600">Selected file: {newResumeFile.name}</p>
                  )}
                  {isUploadingNewResume && (
                    <div className="flex items-center text-sm text-blue-600">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading {newResumeFile?.name}... 
                    </div>
                  )}
                  
                  {/* PDF Benefits Info */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <FileIcon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-blue-700">
                        <p className="font-medium mb-1">Why PDF works best:</p>
                        <p>✅ Preserves your formatting perfectly • ✅ Professional standard • ✅ Works with all recruitment systems</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {toolMode === 'analyze' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyWebsite" className="font-semibold">Company Website <span className="text-red-500">*</span></Label>
                    <Input
                      id="companyWebsite"
                      type="url"
                      value={companyWebsite}
                      onChange={(e) => {
                        setCompanyWebsite(e.target.value);
                        if (fieldErrors.companyWebsite) {
                            setFieldErrors(prev => ({...prev, companyWebsite: undefined}));
                        }
                      }}
                      placeholder="https://example.com"
                      required
                      className={`mt-1 ${fieldErrors.companyWebsite ? 'border-red-500 focus:border-red-500 ring-red-500' : ''}`}
                    />
                    {fieldErrors.companyWebsite && <p className="text-sm text-red-500 mt-1">{fieldErrors.companyWebsite}</p>}
                  </div>
                  <div>
                    <Label htmlFor="additionalComments" className="font-semibold">Additional Comments (Optional)</Label>
                    <Textarea
                      id="additionalComments"
                      value={additionalComments}
                      onChange={(e) => setAdditionalComments(e.target.value)}
                      placeholder="Any specific aspects you want the AI to focus on?"
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="jobDescription" className="font-semibold">Job Description <span className="text-red-500">*</span></Label>
                    <Textarea
                      id="jobDescription"
                      value={jobDescription}
                      onChange={(e) => {
                        setJobDescription(e.target.value);
                        if (fieldErrors.jobDescription) {
                          setFieldErrors(prev => ({...prev, jobDescription: undefined}));
                        }
                      }}
                      placeholder="Paste the job description text here..."
                      rows={10}
                      required
                      className={`mt-1 ${fieldErrors.jobDescription ? 'border-red-500 focus:border-red-500 ring-red-500' : ''}`}
                    />
                    {fieldErrors.jobDescription && <p className="text-sm text-red-500 mt-1">{fieldErrors.jobDescription}</p>}
                  </div>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-4">
             {error && (
              <Alert variant="destructive" className="w-full">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {roastError && (
                <Alert variant="destructive" className="w-full">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Roast Error</AlertTitle>
                    <AlertDescription>{roastError}</AlertDescription>
                </Alert>
            )}
            <Button 
              type="submit" 
              disabled={isLoadingAnalysis || isUploadingNewResume || isLoadingRoast} 
              className="w-full md:w-auto"
            >
              {isUploadingNewResume ? 'Uploading Resume...' : 
                (isLoadingAnalysis ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : isLoadingRoast ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Roasting... <Flame className="ml-1 h-4 w-4 text-orange-400" />
                  </>
                ) : (
                  toolMode === 'analyze' ? <><Smile className="mr-2 h-5 w-5" /> Analyze Resume</> : <> <Flame className="mr-2 h-5 w-5" /> Roast My Resume</>
                )
              )}
            </Button>

          </CardFooter>
        </form>
      </Card>
      
      {/* Loading Indicator Card */}
      {(isLoadingAnalysis || isLoadingRoast) && (
        <Card className="mt-8 bg-blue-50 border-blue-200" ref={loadingCardRef}>
          <CardContent className="p-6 text-center">
            <p className="font-semibold text-lg text-blue-800 animate-pulse">{loadingMessage}</p>
            <p className="text-sm text-blue-600 mt-2">Hang tight, this can take up to 3 minutes.</p>
          </CardContent>
        </Card>
      )}

      {toolMode === 'analyze' && analysisResult && !isLoadingAnalysis && (
        <Card className="mt-8" ref={resultsCardRef}>
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-800">Feedback Analysis</h3>
              <Card className="p-4">
                <div className="flex justify-between items-center mb-2">
                    <p className="text-md font-medium">Overall Score: <span className="text-blue-600 font-bold">{analysisResult.feedback.score}/10</span></p>
                </div>
                <h4 className="text-sm font-semibold mb-1">Detailed Feedback:</h4>
                <div className="prose prose-sm max-w-none p-4 bg-gray-50 rounded-md border border-gray-200 min-h-[400px] max-h-[600px] overflow-y-auto">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {analysisResult.feedback.feedback}
                  </ReactMarkdown>
                </div>
              </Card>
            </div>

            {!showImprovedResume && (
              <div className="text-center py-4">
                <Button onClick={handleRevealImprovedResume} variant="default" size="lg">
                  <Sparkles className="mr-2 h-5 w-5" /> Unlock Your Resume's Potential: See Suggested Improvements!
                </Button>
              </div>
            )}

            {showImprovedResume && (
              <>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-800">Improved Resume</h3>
                  <Card className="p-4">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-md font-medium">New Score: <span className="text-green-600 font-bold">{analysisResult.new_resume.new_score}/10</span></p>
                    </div>
                    
                    <h4 className="text-sm font-semibold mb-1">Summary of Changes:</h4>
                    <div className="prose prose-sm max-w-none p-4 bg-yellow-50 border border-yellow-200 rounded-md min-h-[200px] max-h-[400px] overflow-y-auto mb-4">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {analysisResult.new_resume.changes}
                      </ReactMarkdown>
                    </div>

                    <h4 className="text-sm font-semibold mb-1 flex justify-between items-center">
                      Updated Resume Text:
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(analysisResult.new_resume.new_resume)}
                        className="text-xs"
                      >
                        <Copy size={12} className="mr-1" /> Copy Resume
                      </Button>
                    </h4>
                    <div className="prose prose-sm max-w-none p-4 bg-green-50 border border-green-200 rounded-md min-h-[600px] max-h-[800px] overflow-y-auto">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {analysisResult.new_resume.new_resume}
                      </ReactMarkdown>
                    </div>
                  </Card>
                </div>
              </>
            )}
            
          </CardContent>
        </Card>
      )}

      {toolMode === 'roast' && roastResult && !isLoadingRoast && (
        <Card className="mt-8" ref={resultsCardRef}>
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center">
              <Flame className="h-6 w-6 mr-2 text-red-600" />
              Your Sizzling Resume Roast! 😈
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Card className="p-4 bg-gradient-to-br from-amber-100 via-orange-100 to-red-200 shadow-lg border-orange-300">
                <div className="prose prose-sm max-w-none p-4 rounded-md min-h-[400px] max-h-[700px] overflow-y-auto text-gray-800">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {roastResult}
                  </ReactMarkdown>
                </div>
                <div className="mt-4 text-center text-xs text-gray-500">
                    Disclaimer: This is for entertainment purposes. Don't take it too seriously!
                </div>
            </Card>
             <div className="text-center py-2">
                <Button onClick={() => {
                    setRoastResult(null);
                    setRoastError(null);
                }} variant="outline" size="sm">
                    Done Roasting? Clear
                </Button>
              </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default AnalyzerToolContent;
