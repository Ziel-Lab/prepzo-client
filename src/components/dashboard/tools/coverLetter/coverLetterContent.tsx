"use client";

import { useState, useEffect, ChangeEvent, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  FileText as FileIcon,
  Lightbulb,
  History,
  Wand2,
  Clock,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/utils/supabase/client";
import {
  Table,
  TableHeader,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { LimitReached } from "@/components/dashboard/settings/subscription/limitReached";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

const loadingMessages = [
    "Understanding the job role...",
    "Aligning your skills with the company's needs...",
    "Drafting a compelling opening paragraph...",
    "Weaving your experience into a narrative...",
    "Adding the finishing touches to your letter...",
    "Checking for your generated letter...",
];

// Interface for user documents (resumes)
interface UserDocument {
  id: number | string;
  title: string;
  url?: string;
}

// Interface for the generated cover letter result
interface CoverLetterResult {
  cover_letter: string; // The main generated cover letter text
  additional_comments: string; // AI suggestions for improvement
  // Any other fields returned by Xano within the parsed feedback object
}

// NEW: Interface for the direct backend response which contains a feedback JSON string
interface BackendCoverLetterResponse {
    feedback: string; // This is a JSON string like "{\"cover_letter\": \"...\", \"additional_comments\": \"...\"}"
    // Include other potential top-level keys from your backend if any, e.g., an ID for the saved record
    id?: string | number; 
}

// For raw document from /get-documents
interface RawUserDocument {
    id: number | string;
    document_name?: string;
    display_name?: string;
    document_url: string;
}

// For raw history item from /get-cover-letters
interface RawCoverLetterHistoryItem {
    id: string | number;
    job_description?: string;
    company_website?: string;
    current_resume?: string;
    additional_comments?: string; // User's input comments
    feedback: CoverLetterResult | string; // Can be parsed object or string
    created_at: string;
    status?: string; // Add status field
}

// Interface for history items
interface CoverLetterHistoryItem {
  id: string | number;
  job_description?: string; // Store a snippet or title
  company_website?: string;
  current_resume?: string; // URL of the resume used
  resume_title?: string; // Derived title of the resume
  user_additional_comments?: string; // User's input comments for this generation
  generated_outputs: CoverLetterResult; // The stored {cover_letter, additional_comments}
  created_at: string;
  status: 'completed' | 'failed' | 'pending' | 'in_progress';
}

// Helper function to map API status to UI status
const mapApiStatusToUiStatus = (apiStatus: string | undefined): 'completed' | 'failed' | 'pending' | 'in_progress' => {
  if (!apiStatus) return 'completed';
  
  const status = apiStatus.toUpperCase();
  
  // If we have SUCCESS status and content, treat as completed
  if (status === 'SUCCESS') {
    return 'completed';
  }
  
  switch(status) {
    case 'COMPLETED':
      return 'completed';
    case 'FAILED':
    case 'FAILURE':
      return 'failed';
    case 'PENDING':
      return 'pending';
    case 'IN_PROGRESS':
      return 'in_progress';
    default:
      // If status is unknown but we have SUCCESS, treat as completed
      return status === 'SUCCESS' ? 'completed' : 'pending';
  }
};

// Helper to safely parse feedback
const parseFeedback = (feedback: string | CoverLetterResult | null): CoverLetterResult => {
  if (!feedback) {
    return { cover_letter: '', additional_comments: '' };
  }
  if (typeof feedback === 'string') {
    try {
      return JSON.parse(feedback) as CoverLetterResult;
    } catch {
      // Fallback: return empty structure to satisfy types
      return { cover_letter: '', additional_comments: '' };
    }
  }
  return feedback;
};

const CoverLetterContent = () => {
  const { toast } = useToast();
  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Form Inputs
  const [jobDescription, setJobDescription] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [userComments, setUserComments] = useState(""); // User's additional comments for the AI
  const [selectedResumeUrl, setSelectedResumeUrl] = useState<string>("");
  const [newResumeFile, setNewResumeFile] = useState<File | null>(null);
  const [resumeInputMethod, setResumeInputMethod] = useState<"select" | "upload">("select");

  // API Interaction State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [generatedResult, setGeneratedResult] = useState<CoverLetterResult | null>(null);

  // User Documents (Resumes)
  const [userDocuments, setUserDocuments] = useState<UserDocument[]>([]);
  const [isFetchingUserDocs, setIsFetchingUserDocs] = useState(true);
  const [isUploadingNewResume, setIsUploadingNewResume] = useState(false);

  // History State
  const [history, setHistory] = useState<CoverLetterHistoryItem[]>([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [selectedHistoryItemForDialog, setSelectedHistoryItemForDialog] = useState<CoverLetterHistoryItem | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

  const supabase = createClient();
  const resultsRef = useRef<HTMLDivElement>(null);
  const loadingCardRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
    pollIntervalRef.current = null;
    pollingTimeoutRef.current = null;
  };

  // Prefill job description & company website from URL query params
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
        let url= decodeURIComponent(companyWebsiteParam);
        if (!/^https?:\/\//i.test(url)) {
          url = `https://${url}`;
        }
        setCompanyWebsite(url);
      } catch {
        setCompanyWebsite(companyWebsiteParam);
      }
    }
    // Run only once on mount – searchParams is stable in App Router
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Stop polling on component unmount
    return () => stopPolling();
  }, []);

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
        setHistoryError(errMsg + " Cannot fetch history.");
        setIsFetchingUserDocs(false);
        setIsFetchingHistory(false);
        setResumeInputMethod("upload");
        return;
      }
      const jwtToken = sessionData.session.access_token;
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
      if (!backendUrl) {
        const errMsg = "Backend URL is not configured.";
        setError(errMsg);
        setHistoryError(errMsg);
        setIsFetchingUserDocs(false);
        setIsFetchingHistory(false);
        return;
      }

      // Fetch User Documents (Resumes)
      try {
        const docsUrl = `${backendUrl.replace(/\/$/, '')}/get-documents`;
        const docsResponse = await fetch(docsUrl, {
          method: "GET",
          headers: { Authorization: `Bearer ${jwtToken}`, "Content-Type": "application/json" },
        });
        if (!docsResponse.ok) throw new Error(`HTTP error fetching documents: ${docsResponse.status}`);
        const fetchedDocsRaw: RawUserDocument[] = await docsResponse.json();
        const fetchedDocs: UserDocument[] = fetchedDocsRaw.map((doc) => ({
          id: doc.id,
          title: doc.document_name || doc.display_name || "Untitled Document",
          url: doc.document_url,
        }));
        setUserDocuments(fetchedDocs);
        if (!(fetchedDocs.length > 0 && fetchedDocs[0].url)) {
          setResumeInputMethod("upload");
        }
      } catch (err) {
        setError("Unable to load your documents right now. Please refresh the page and try again!");
        setResumeInputMethod("upload");
      } finally {
        setIsFetchingUserDocs(false);
      }

      // Fetch Cover Letter History
      try {
        const historyUrl = `${backendUrl.replace(/\/$/, '')}/get-cover-letters`;
        const historyResponse = await fetch(historyUrl, {
          method: "GET",
          headers: { Authorization: `Bearer ${jwtToken}`, "Content-Type": "application/json" },
        });
        if (!historyResponse.ok) throw new Error(`HTTP error fetching history: ${historyResponse.status}`);
        const historyResponseData: RawCoverLetterHistoryItem[] = await historyResponse.json() || [];
        const processedHistory: CoverLetterHistoryItem[] = (Array.isArray(historyResponseData) ? historyResponseData : [])
          .filter(item => item) // Filter out null/undefined items
          .map((item) => {
            const resumeTitle = item.current_resume ? decodeURIComponent(item.current_resume.substring(item.current_resume.lastIndexOf('/') + 1).split('?')[0]) : 'N/A';
            return {
              id: item.id,
              job_description: item.job_description ? (item.job_description.substring(0, 70) + '...') : "N/A",
              company_website: item.company_website,
              current_resume: item.current_resume,
              resume_title: resumeTitle,
              user_additional_comments: item.additional_comments,
              generated_outputs: parseFeedback(item.feedback),
              created_at: new Date(item.created_at).toLocaleDateString(),
              status: mapApiStatusToUiStatus(item.status),
            };
          }).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setHistory(processedHistory);
      } catch (err) {
        setHistoryError("Unable to load your cover letter history. Please refresh the page and try again!");
      } finally {
        setIsFetchingHistory(false);
      }
    };

    if (supabase) fetchData();
  }, [supabase]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isLoading) {
        setLoadingMessage(loadingMessages[0]); // Reset to first message
        intervalId = setInterval(() => {
            setLoadingMessage(prev => {
                const currentIndex = loadingMessages.indexOf(prev);
                return loadingMessages[(currentIndex + 1) % loadingMessages.length];
            });
        }, 3500);
    }
    return () => clearInterval(intervalId);
  }, [isLoading]);

  // Reset pagination when history changes
  useEffect(() => {
    setCurrentPage(1);
  }, [history.length]);

  const handleResumeFileChange = (event: ChangeEvent<HTMLInputElement>) => {
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
      setSelectedResumeUrl("");
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
    formData.append("document_type", "Cover Letter");

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
      if (!backendUrl) throw new Error("Backend URL not configured for upload.");
      const uploadUrl = `${backendUrl.replace(/\/$/, '')}/upload-document`;
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwtToken}` },
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(errorData.error || `Upload failed: ${response.status}`);
      }
      const result = await response.json();
      if (!result.file_url) throw new Error("Upload successful, but no file URL returned.");
      
      // Add to userDocuments state for immediate selection if needed
       const newDocEntry: UserDocument = { id: Date.now(), title: file.name, url: result.file_url };
       setUserDocuments(prev => [newDocEntry, ...prev]);
      return result.file_url;
    } catch (err: unknown) {
      setError("Upload failed. Please refresh the page and try uploading your resume again!");
      return null;
    } finally {
      setIsUploadingNewResume(false);
    }
  };

  const validateInputs = () => {
    const errors: { [key: string]: string } = {};
    if (!jobDescription.trim()) errors.jobDescription = "Job Description is required.";
    if (!selectedResumeUrl && !newResumeFile) errors.resume = "A resume is required.";
    if (!companyWebsite.trim()) errors.companyWebsite = "Company Website is required.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateInputs()) {
      setError("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setLimitReached(false);
    setGeneratedResult(null);

    let currentResumeUrl = selectedResumeUrl;

    try {
      const startGeneration = async (resumeUrl: string) => {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData?.session?.access_token) {
          setError("Could not retrieve user session.");
          setIsLoading(false);
          return;
        }
        const jwtToken = sessionData.session.access_token;
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
        if (!backendUrl) {
            setError("Backend URL is not configured.");
            setIsLoading(false);
            return;
        }
  
        const payload = {
            resume_url: resumeUrl,
            company_url: companyWebsite,
            job_description: jobDescription,
            additional_comments: userComments.trim() ? userComments : undefined
        };
  
        const response = await fetch(`${backendUrl.replace(/\/$/, '')}/create-cover-letter`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${jwtToken}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify(payload),
        });
  
        if (response.status === 202) {
          const jobInfo: { job_id?: string | number } = await response.json().catch(() => ({}));
          if (jobInfo.job_id) {
            startPolling(jobInfo.job_id, resumeUrl);
          } else {
            setError("Cover letter job accepted but no job_id returned.");
            setIsLoading(false);
          }
          return;
        }
  
        // Fallback for non-202 responses or errors
        setIsLoading(false);
        const responseData = await response.json();
  
        if (!response.ok) {
          let errorMessage = `HTTP Error: ${response.status}`;
          if (responseData && (responseData.error || responseData.details)) {
              errorMessage = responseData.error || (typeof responseData.details === 'string' ? responseData.details : JSON.stringify(responseData.details));
          }
          
          if (typeof errorMessage === 'string' && errorMessage.toLowerCase().includes("limit")) {
            setLimitReached(true);
          } else {
            setError("Cover letter generation failed. Please refresh the page and try again!");
          }
          return;
        }
      };

      if (resumeInputMethod === "upload" && newResumeFile) {
        uploadNewResumeAndGetUrl(newResumeFile).then(uploadedUrl => {
            if (uploadedUrl) {
                currentResumeUrl = uploadedUrl;
                setSelectedResumeUrl(uploadedUrl);
                startGeneration(uploadedUrl);
            } else {
                setIsLoading(false);
            }
        });
      } else if(currentResumeUrl) {
        startGeneration(currentResumeUrl);
      } else {
        setError("Resume URL could not be determined. Please select or upload a resume.");
        setIsLoading(false);
      }
    } catch (err) {
      setError("Cover letter request failed. Please refresh the page and try again!");
      setIsLoading(false);
    }
  };

  const startPolling = (jobId: string | number, resumeUrl: string) => {
    toast({
      title: "Generation Started",
      description: "Your cover letter will show in the history section shortly.",
      duration: 5000,
    });

    // Add initial pending item to history, ensuring no duplicates
    const pendingHistoryItem: CoverLetterHistoryItem = {
      id: jobId,
      job_description: jobDescription ? (jobDescription.substring(0, 70) + '...') : "N/A",
      company_website: companyWebsite,
      current_resume: resumeUrl,
      resume_title: resumeUrl ? decodeURIComponent(resumeUrl.substring(resumeUrl.lastIndexOf('/') + 1).split('?')[0]) : 'N/A',
      user_additional_comments: userComments,
      generated_outputs: { cover_letter: '', additional_comments: '' },
      created_at: new Date().toLocaleDateString(),
      status: 'pending'
    };

    // Remove any existing entries with the same job ID or same company website
    setHistory(prev => {
      const filtered = prev.filter(item => 
        item.id !== jobId && 
        !(item.company_website === companyWebsite && 
          item.current_resume === resumeUrl && 
          item.status === 'pending')
      );
      return [pendingHistoryItem, ...filtered];
    });

    const poll = async () => {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData?.session?.access_token) {
            stopPolling();
            setError("Session expired during polling. Please try again.");
            setIsLoading(false);
            return;
        }
        const jwtToken = sessionData.session.access_token;
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
        if (!backendUrl) {
            stopPolling();
            setError("Backend URL is not configured.");
            setIsLoading(false);
            return;
        }

        try {
            const historyUrl = `${backendUrl.replace(/\/$/, '')}/get-cover-letters?job_id=${jobId}`;
            const historyResponse = await fetch(historyUrl, {
                method: "GET",
                headers: { Authorization: `Bearer ${jwtToken}`, "Accept": "application/json" },
            });
            if (!historyResponse.ok) {
                 console.error(`Polling failed with status: ${historyResponse.status}`);
                 return; 
            }

            const raw = await historyResponse.json();
            // console.log('API Response:', raw); // Debug log
            const row: RawCoverLetterHistoryItem | undefined = Array.isArray(raw) ? raw[0] : raw;

            if (!row) return;

            // console.log('Row status:', row.status); // Debug log
            // console.log('Row feedback:', row.feedback); // Debug log

            // Parse feedback first to check if we have content
            const parsedFeedback = parseFeedback(row.feedback);
            const hasCoverLetter = Boolean(parsedFeedback?.cover_letter && parsedFeedback.cover_letter.length > 0);

            // Determine the actual status
            let actualStatus = row.status;
            // Only consider it complete if we have both SUCCESS status and actual content
            if (hasCoverLetter && actualStatus?.toUpperCase() === 'SUCCESS') {
                actualStatus = 'COMPLETED';
            } else if (actualStatus?.toUpperCase() === 'SUCCESS' && !hasCoverLetter) {
                // If we have SUCCESS but no content, keep polling
                actualStatus = 'IN_PROGRESS';
            }

            const formatted: CoverLetterHistoryItem = {
                id: row.id,
                job_description: row.job_description ? (row.job_description.substring(0, 70) + '...') : "N/A",
                company_website: row.company_website,
                current_resume: row.current_resume,
                resume_title: row.current_resume ? decodeURIComponent(row.current_resume.substring(row.current_resume.lastIndexOf('/') + 1).split('?')[0]) : 'N/A',
                user_additional_comments: row.additional_comments,
                generated_outputs: parsedFeedback,
                created_at: new Date(row.created_at).toLocaleDateString(),
                status: mapApiStatusToUiStatus(actualStatus),
            };

            // console.log('Mapped status:', formatted.status); // Debug log

            // Update history ensuring no duplicates by job ID or company website
            setHistory(prev => {
                const filtered = prev.filter(item => 
                  item.id !== formatted.id && 
                  !(item.company_website === formatted.company_website && 
                    item.current_resume === formatted.current_resume && 
                    item.status === 'pending')
                );
                return [formatted, ...filtered];
            });

            // Check if generation is complete based on both status and content
            if (hasCoverLetter && formatted.status === 'completed') {
                stopPolling();
                setIsLoading(false);
                setGeneratedResult(parsedFeedback);
                setNewResumeFile(null);

                toast({
                  title: "Cover Letter Complete",
                  description: "Your cover letter is now available in the history section.",
                  duration: 5000,
                });
            } else if (formatted.status === 'failed') {
                // Handle failed status
                stopPolling();
                setIsLoading(false);
                setError("Cover letter generation failed. Please try again.");
                
                toast({
                    variant: "destructive",
                    title: "Generation Failed",
                    description: "The cover letter generation failed. Please try again.",
                    duration: 5000,
                });
            } else {
                // Update status message based on current status
                setLoadingMessage(
                    formatted.status === 'in_progress' 
                        ? "Generating your cover letter..."
                        : "Checking for your generated letter..."
                );
            }
        } catch (e) {
            console.error("Polling error:", e);
        }
    };

    pollIntervalRef.current = setInterval(poll, 10000); // Poll every 10 seconds
    
    pollingTimeoutRef.current = setTimeout(() => {
        stopPolling();
        setError("Generation is taking longer than usual. You can check your history for the result in a few moments.");
        setIsLoading(false);

        // Update status to failed if timeout, ensuring no duplicates
        setHistory(prev => {
            const filtered = prev.filter(item => item.id !== jobId);
            const failedItem = prev.find(item => item.id === jobId);
            if (failedItem) {
                return [{ ...failedItem, status: 'failed' }, ...filtered];
            }
            return prev;
        });

        toast({
          variant: "destructive",
          title: "Generation Timeout",
          description: "The generation is taking longer than expected. Please check back later.",
          duration: 5000,
        });
    }, 180000); // 3 minutes timeout
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Copy successful
    }).catch(err => {
      // Copy failed - could show a user-friendly message if needed
    });
  };
  
  const handleUseSuggestion = (suggestion: string) => {
    setUserComments(prev => prev ? `${prev}\n\n${suggestion}` : suggestion);
  };

  useEffect(() => {
    // Scroll to loading indicator when it appears
    if (isLoading && loadingCardRef.current) {
      const timerId = setTimeout(() => {
        loadingCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return () => clearTimeout(timerId);
    }
    
    // Scroll to results card when loading is finished and results are available
    if (generatedResult && !isLoading && resultsRef.current) {
      const timerId = setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return () => clearTimeout(timerId);
    }
  }, [isLoading, generatedResult]);

  if (limitReached) {
    return (
      <LimitReached 
        featureName="Cover Letter Generation"
        featureNamePlural="Cover Letters"
      />
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-8 px-4">
      {/* History Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center"><History className="mr-2 h-5 w-5 text-gray-700"/> Generation History</CardTitle>
          <CardDescription>Review your previously generated cover letters.</CardDescription>
        </CardHeader>
        <CardContent>
          {isFetchingHistory && <div className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading history...</div>}
          {historyError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{historyError}</AlertDescription></Alert>}
          {!isFetchingHistory && !historyError && history.length === 0 && <p className="text-sm text-gray-500">No history found.</p>}
          {!isFetchingHistory && !historyError && history.length > 0 && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Job Snippet</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Resume</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.created_at}</TableCell>
                      <TableCell className="truncate max-w-xs" title={item.job_description}>{item.job_description}</TableCell>
                      <TableCell className="truncate max-w-xs" title={item.company_website}>{item.company_website || 'N/A'}</TableCell>
                      <TableCell className="truncate max-w-xs" title={item.current_resume}>{item.resume_title || 'N/A'}</TableCell>
                      <TableCell>
                        {item.status === 'completed' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
                          </span>
                        ) : item.status === 'failed' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertCircle className="w-3 h-3 mr-1" /> Failed
                          </span>
                        ) : item.status === 'pending' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Clock className="w-3 h-3 mr-1" /> Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" /> In Progress
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedHistoryItemForDialog(item)}>View</Button>
                          </DialogTrigger>
                          {selectedHistoryItemForDialog && selectedHistoryItemForDialog.id === item.id && (
                          <DialogContent className="sm:max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Cover Letter Details ({new Date(selectedHistoryItemForDialog.created_at).toLocaleDateString()})</DialogTitle>
                              <DialogDescription>
                                  Job: {selectedHistoryItemForDialog.job_description?.replace('... ','')}<br/>
                                  Company: {selectedHistoryItemForDialog.company_website || 'N/A'}<br/>
                                  Resume: <a href={selectedHistoryItemForDialog.current_resume} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedHistoryItemForDialog.resume_title || selectedHistoryItemForDialog.current_resume}</a>
                                  {selectedHistoryItemForDialog.user_additional_comments && <><br/>Your Comments: <em>{selectedHistoryItemForDialog.user_additional_comments}</em></>}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto p-1">
                              {selectedHistoryItemForDialog.generated_outputs ? (
                                <>
                                  <div>
                                      <h4 className="font-semibold text-md mb-1 flex justify-between items-center">
                                          Generated Cover Letter
                                          <Button variant="outline" size="sm" onClick={() => handleCopyToClipboard(selectedHistoryItemForDialog.generated_outputs?.cover_letter || '')}><Copy size={12} className="mr-1"/>Copy</Button>
                                      </h4>
                                      <div className="prose prose-sm max-w-none p-4 bg-gray-50 rounded-md border min-h-[400px] max-h-[600px] overflow-y-auto">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                          {selectedHistoryItemForDialog.generated_outputs?.cover_letter || ""}
                                        </ReactMarkdown>
                                      </div>
                                  </div>
                                  {selectedHistoryItemForDialog.generated_outputs?.additional_comments && (
                                      <div>
                                          <h4 className="font-semibold text-md mb-1 flex items-center"><Lightbulb size={16} className="mr-2 text-yellow-500"/> AI Suggestions</h4>
                                          <div className="prose prose-sm max-w-none p-4 bg-yellow-50 border border-yellow-200 rounded-md min-h-[200px] max-h-[400px] overflow-y-auto">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedHistoryItemForDialog.generated_outputs.additional_comments}</ReactMarkdown>
                                          </div>
                                      </div>
                                  )}
                                </>
                              ) : (
                                <p className="text-sm text-gray-500 text-center py-4">No generated content details available for this history item.</p>
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

              {/* Pagination Controls */}
              <div className="flex items-center justify-between space-x-2 py-4">
                <div className="text-sm text-gray-500">
                  Showing {Math.min((currentPage - 1) * itemsPerPage + 1, history.length)} to {Math.min(currentPage * itemsPerPage, history.length)} of {history.length} entries
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="text-sm font-medium">
                    Page {currentPage} of {Math.ceil(history.length / itemsPerPage)}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(history.length / itemsPerPage), prev + 1))}
                    disabled={currentPage >= Math.ceil(history.length / itemsPerPage)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Generator Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center"><Wand2 className="mr-2 h-6 w-6 text-purple-600"/> Cover Letter Generator</CardTitle>
          <CardDescription>
            Craft a compelling cover letter tailored to your job application.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Resume Input */}
            <div className="space-y-3 p-4 border rounded-md bg-slate-50">
              <Label className="font-semibold text-lg">Your Resume <span className="text-red-500">*</span></Label>
              <RadioGroup value={resumeInputMethod} onValueChange={(v: "select" | "upload") => { setResumeInputMethod(v); setError(null); if (v === 'select') setNewResumeFile(null);}} className="flex items-center gap-4 mb-3">
                <div className="flex items-center space-x-2"><RadioGroupItem value="select" id="selectExisting" disabled={isFetchingUserDocs || userDocuments.length === 0} /><Label htmlFor="selectExisting">Select Existing</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="upload" id="uploadNew" /><Label htmlFor="uploadNew">Upload New</Label></div>
              </RadioGroup>
              {isFetchingUserDocs && resumeInputMethod === 'select' && <div className="flex items-center text-sm text-gray-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading documents...</div>}
              {resumeInputMethod === 'select' && !isFetchingUserDocs && (
                userDocuments.length > 0 ? (
                  <Select value={selectedResumeUrl} onValueChange={(v) => {setSelectedResumeUrl(v); setNewResumeFile(null); setError(null); if(fieldErrors.resume) setFieldErrors(p => ({...p, resume: ''}))}} disabled={isLoading || isUploadingNewResume}>
                    <SelectTrigger className={fieldErrors.resume ? 'border-red-500' : ''}><SelectValue placeholder="Select a resume..." /></SelectTrigger>
                    <SelectContent>{userDocuments.map(doc => <SelectItem key={doc.id} value={doc.url || ""} disabled={!doc.url}><FileIcon size={16} className="mr-2 inline" />{doc.title}</SelectItem>)}</SelectContent>
                  </Select>
                ) : <p className="text-sm text-gray-500">No documents found. Please upload a resume.</p>
              )}
              {resumeInputMethod === 'upload' && (
                <div className="space-y-3">
                  <Input id="newResumeUpload" type="file" accept=".pdf" onChange={handleResumeFileChange} className={`w-full ${fieldErrors.resume ? 'border-red-500' : ''}`} disabled={isLoading || isUploadingNewResume} />
                  {newResumeFile && <p className="text-xs text-gray-600">Selected: {newResumeFile.name}</p>}
                  {isUploadingNewResume && <div className="flex items-center text-sm text-blue-600"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</div>}
                  
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
              {fieldErrors.resume && <p className="text-sm text-red-500 mt-1">{fieldErrors.resume}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="jobDescription" className="font-semibold">Job Description <span className="text-red-500">*</span></Label>
                <Textarea id="jobDescription" value={jobDescription} onChange={(e) => {setJobDescription(e.target.value); if(fieldErrors.jobDescription) setFieldErrors(p => ({...p, jobDescription: ''}));}} placeholder="Paste job description here..." rows={8} required className={`mt-1 ${fieldErrors.jobDescription ? 'border-red-500' : ''}`} />
                {fieldErrors.jobDescription && <p className="text-sm text-red-500 mt-1">{fieldErrors.jobDescription}</p>}
              </div>
              <div>
                <Label htmlFor="companyWebsite" className="font-semibold">Company Website <span className="text-red-500">*</span></Label>
                <Input 
                  id="companyWebsite" 
                  type="url" 
                  value={companyWebsite} 
                  onChange={(e) => {
                    setCompanyWebsite(e.target.value); 
                    if(fieldErrors.companyWebsite) setFieldErrors(p => ({...p, companyWebsite: ''}));
                  }}
                  placeholder="https://example.com" 
                  required
                  className={`mt-1 ${fieldErrors.companyWebsite ? 'border-red-500' : ''}`} 
                />
                {fieldErrors.companyWebsite && <p className="text-sm text-red-500 mt-1">{fieldErrors.companyWebsite}</p>}
              
                <div className="mt-4">
                    <Label htmlFor="userComments" className="font-semibold">Your Additional Comments (Optional)</Label>
                    <Textarea id="userComments" value={userComments} onChange={(e) => setUserComments(e.target.value)} placeholder="E.g., specific skills to highlight, your connection to the company, or paste AI suggestions here for a re-attempt." rows={3} className="mt-1" />
                    <p className="text-xs text-gray-500 mt-1">Provide any extra details or paste AI suggestions here for an improved version.</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-4">
            {error && <Alert variant="destructive" className="w-full"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            <Button type="submit" disabled={isLoading || isUploadingNewResume} className="w-full md:w-auto">
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</> : <><Wand2 className="mr-2 h-4 w-4"/>Generate Cover Letter</>}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Loading Indicator Card */}
      {isLoading && (
        <Card className="mt-8 bg-blue-50 border-blue-200" ref={loadingCardRef}>
          <CardContent className="p-6 text-center">
            <p className="font-semibold text-lg text-blue-800 animate-pulse">{loadingMessage}</p>
            <p className="text-sm text-blue-600 mt-2">Hang tight, this can take up to 3 minutes.</p>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {generatedResult && !isLoading && (
        <Card className="mt-8" ref={resultsRef}>
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center"><CheckCircle2 className="mr-2 h-6 w-6 text-green-600" /> Your Generated Cover Letter</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {/* Column 1: Cover Letter Text */}
            <div>
              <h3 className="text-lg font-semibold mb-2 flex justify-between items-center">
                Cover Letter Text
                <Button variant="outline" size="sm" onClick={() => handleCopyToClipboard(generatedResult.cover_letter)}><Copy size={14} className="mr-1"/>Copy All</Button>
              </h3>
              <div className="prose prose-sm max-w-none p-4 bg-gray-50 rounded-md border border-gray-300 min-h-[600px] max-h-[800px] overflow-y-auto">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {generatedResult.cover_letter}
                </ReactMarkdown>
              </div>
            </div>
            
            {/* Column 2: AI Suggestions */}
            {generatedResult.additional_comments && (
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold mb-2 flex items-center"><Lightbulb className="mr-2 h-5 w-5 text-yellow-500"/> AI Suggestions for Improvement</h3>
                <Card className="bg-amber-50 border-amber-200 p-4 flex-grow">
                  <CardContent className="p-0 flex flex-col h-full">
                    <p className="text-sm text-gray-700 mb-2">Consider incorporating these points into the "Your Additional Comments" field above and regenerating for an even better cover letter.</p>
                    <div className="prose prose-sm max-w-none p-4 bg-white border border-gray-200 rounded-md min-h-[300px] max-h-[500px] overflow-y-auto">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{generatedResult.additional_comments}</ReactMarkdown>
                    </div>
                    <Button variant="link" size="sm" className="px-0 text-purple-600 hover:text-purple-700 mt-2 self-start" onClick={() => handleUseSuggestion(generatedResult.additional_comments || '')}>Use these suggestions</Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CoverLetterContent;
