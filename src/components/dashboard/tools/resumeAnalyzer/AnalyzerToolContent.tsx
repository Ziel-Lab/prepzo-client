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
import { Loader2, AlertCircle, CheckCircle2, Copy, UploadCloud, FileText as FileIcon, Sparkles, Smile, Frown, Meh, Annoyed, Flame } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createClient } from "@/utils/supabase/client";
import { Table, TableHeader, TableBody, TableCell, TableRow, TableHead } from "@/components/ui/table";

interface FeedbackDetails {
  score: number;
  feedback: string; // Formatted text with newlines
}

interface NewResumeDetails {
  changes: string; // Formatted text with newlines
  new_resume: string; // Full text of the new resume
  new_score: number;
}

// New: Structure for the payload within the "feedback" string for roasts
interface ParsedRoastPayload {
  roast: string;
}

// This will be the structure of our state
interface ParsedAnalysisResult {
  feedback: FeedbackDetails;
  new_resume: NewResumeDetails;
  id?: string | number; // Add an ID to the analysis result itself for easier history update
}

// The direct response from API before parsing nested JSON
interface RawApiResponse {
  feedback: string; // JSON string
  new_resume: string; // JSON string
  // For roast, this might be different, e.g. directly RoastFeedback
  roast_feedback?: string; // If roast endpoint returns it at top level
  analysis_id?: string | number; // Keep this for consistency if backend provides it
  [key: string]: any; // Allow other potential top-level keys
}

// Document structure from DocumentsContent.tsx for fetched documents
interface UserDocument {
  id: number | string;
  title: string;
  url?: string;
  // Add other fields if needed for display or logic
}

// Updated Interface for historical analysis items
interface AnalysisHistoryItem {
  id: string | number;
  resume_url?: string; 
  resume_title?: string; // NEW: To store the name/title of the resume used
  company_website?: string;
  job_description?: string; 
  created_at: string; 
  score?: number; // Original score
  new_score?: number; // Score after improvements, conditionally added
  feedback?: string; 
  new_resume?: string; 
  job_description_title?: string; 
  is_roast?: boolean; // NEW: Flag to identify roast entries
  roast_feedback_text?: string; // NEW: Store the actual roast message here
  additional_comment?: string; // Existing, might be "Resume Roast Feedback"
}

const AnalyzerToolContent = () => {
  // Form inputs for analysis
  const [jobDescription, setJobDescription] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [additionalComments, setAdditionalComments] = useState("");

  // State for resume input method
  const [resumeInputMethod, setResumeInputMethod] = useState<'select' | 'upload'>('select');
  const [userDocuments, setUserDocuments] = useState<UserDocument[]>([]);
  const [selectedDocumentUrl, setSelectedDocumentUrl] = useState<string>(""); // URL from dropdown or successful upload
  const [newResumeFile, setNewResumeFile] = useState<File | null>(null);

  // NEW: State for tool mode
  const [toolMode, setToolMode] = useState<'analyze' | 'roast'>('analyze');

  // Loading and error states
  const [isFetchingUserDocs, setIsFetchingUserDocs] = useState(true);
  const [isUploadingNewResume, setIsUploadingNewResume] = useState(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ParsedAnalysisResult | null>(null);
  const [rawResponseForDebug, setRawResponseForDebug] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ jobDescription?: string; companyWebsite?: string }>({});

  // NEW: States for Roast feature
  const [isLoadingRoast, setIsLoadingRoast] = useState(false);
  const [roastResult, setRoastResult] = useState<string | null>(null); // Assuming roast feedback is a string
  const [roastError, setRoastError] = useState<string | null>(null);

  // State for Analysis History
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryItem[]>([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [showImprovedResume, setShowImprovedResume] = useState(false);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | number | null>(null);

  const supabase = createClient();
  const resultsCardRef = useRef<HTMLDivElement>(null);

  // Fetch user documents and analysis history on mount
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

      // Fetch User Documents
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
        console.error("Error fetching user documents:", err);
        setError("Uh oh! Something went a bit sideways. Our tech wizards are on it!");
        setResumeInputMethod('upload'); 
      } finally {
        setIsFetchingUserDocs(false);
      }

      // Fetch Analysis History
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
            // item.feedback_analysis is the object like { feedback: "{\"roast\":\"...\"}" }
            if (item.feedback_analysis && typeof item.feedback_analysis.feedback === 'string') {
              try {
                const parsedInnerJson: ParsedRoastPayload = JSON.parse(item.feedback_analysis.feedback);
                if (parsedInnerJson && typeof parsedInnerJson.roast === 'string') {
                  roastFeedbackTextFromApi = parsedInnerJson.roast;
                }
              } catch (e) {
                console.error("Error parsing nested roast string from item.feedback_analysis.feedback:", item.id, e);
              }
            } else if (item.feedback_analysis && typeof item.feedback_analysis.roast === 'string') {
                // Fallback if xano_data was directly { roast: "..." } and stored as such
                roastFeedbackTextFromApi = item.feedback_analysis.roast;
            }
          } else {
            // Score Parsing for non-roast items
            if (item.feedback_analysis && typeof item.feedback_analysis.feedback === 'string') {
              try {
                const feedbackDetails: FeedbackDetails = JSON.parse(item.feedback_analysis.feedback);
                parsedScore = feedbackDetails.score;
              } catch (e) {
                console.error("Error parsing score from item.feedback_analysis.feedback JSON string for item ID:", item.id, e);
              }
            }
          }
          
          const resumeUrlFromAPI = item.current_resume;
          let derivedResumeTitle = 'N/A';
          if (resumeUrlFromAPI && typeof resumeUrlFromAPI === 'string') {
            try {
              const urlParts = resumeUrlFromAPI.split('/');
              const fileNameWithPotentialQuery = urlParts[urlParts.length - 1];
              // Remove query parameters from filename, if any
              const fileName = fileNameWithPotentialQuery.split('?')[0];
              derivedResumeTitle = decodeURIComponent(fileName); // Decode URI components like %20
            } catch (e) {
                console.error("Error deriving resume title from URL:", resumeUrlFromAPI, e);
                // derivedResumeTitle remains 'N/A'
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
            score: parsedScore, // Will be undefined for roast
            // For new_score, we need to ensure it's only parsed for non-roast items
            new_score: !isRoastItem && item.feedback_analysis && typeof item.feedback_analysis.new_resume === 'string' ? (() => {
                try {
                    const newResumeDetails: NewResumeDetails = JSON.parse(item.feedback_analysis.new_resume);
                    return newResumeDetails.new_score;
                } catch { return undefined; }
            })() : undefined,
            feedback: !isRoastItem && item.feedback_analysis ? item.feedback_analysis.feedback : undefined, 
            new_resume: !isRoastItem && item.feedback_analysis ? item.feedback_analysis.new_resume : undefined, 
            job_description_title: jobDescTitle,
            is_roast: isRoastItem,
            roast_feedback_text: roastFeedbackTextFromApi,
            additional_comment: item.additional_comment,
          };
        });
        console.log("Formatted Analysis History:", JSON.stringify(formattedHistory, null, 2)); // DEBUG LOG
        setAnalysisHistory(formattedHistory);
      } catch (err: any) {
        console.error("Error fetching analysis history:", err);
        setHistoryError("Uh oh! Something went a bit sideways. Our tech wizards are on it!");
      } finally {
        setIsFetchingHistory(false);
      }
    };
    if (supabase) { // Ensure supabase client is available
        fetchData();
    }
  }, [supabase]);

  const handleNewResumeFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setNewResumeFile(event.target.files[0]);
      setSelectedDocumentUrl(""); // Clear selected URL if a new file is chosen
      setError(null); 
    } else {
      setNewResumeFile(null);
    }
  };
  
  // Placeholder for the actual upload logic that will set selectedDocumentUrl
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
      // Optionally, add to userDocuments state here if needed for immediate selection
      // For now, just return the URL
      console.log("New resume uploaded, URL:", result.file_url);
      return result.file_url;
    } catch (err:any) {
      console.error("New resume upload error:", err);
      setError("Uh oh! Something went a bit sideways. Our tech wizards are on it!");
      return null;
    } finally {
      setIsUploadingNewResume(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoadingAnalysis(true);
    setError(null);
    setAnalysisResult(null);
    setRawResponseForDebug(null);
    setFieldErrors({});
    setShowImprovedResume(false);
    setCurrentAnalysisId(null);
    // NEW: Reset roast states
    setIsLoadingRoast(false);
    setRoastResult(null);
    setRoastError(null);

    let finalResumeUrl = selectedDocumentUrl;
    let currentFieldErrors: { jobDescription?: string; companyWebsite?: string } = {};

    if (resumeInputMethod === 'upload' && newResumeFile) {
      const uploadedUrl = await uploadNewResumeAndGetUrl(newResumeFile);
      if (uploadedUrl) {
        finalResumeUrl = uploadedUrl;
        setSelectedDocumentUrl(uploadedUrl); // Update state to reflect the used URL
      } else {
        // Error already set by uploadNewResumeAndGetUrl
        setIsLoadingAnalysis(false);
        return;
      }
    }

    if (!finalResumeUrl) {
      // This specific error is handled by the general setError for now, as it depends on multiple inputs.
      // Could be refactored to fieldErrors if needed: currentFieldErrors.resume = "..."
      setError("Please select an existing resume or upload a new one.");
      setIsLoadingAnalysis(false);
      return;
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
      setIsLoadingAnalysis(false); // Also stop roast loading if it was set
      setIsLoadingRoast(false);
      return;
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session?.access_token) {
      setError("Could not retrieve user session. Please ensure you are logged in.");
      setIsLoadingAnalysis(false);
      console.error("AnalyzeResume: Session error or no access token.", sessionError);
      return;
    }
    const jwtToken = sessionData.session.access_token;

    // Determine resume_title to save (used by both analyze and roast if backend supports it for roast)
    let resumeTitleForBackend = "Uploaded Resume"; 
    if (resumeInputMethod === 'select' && selectedDocumentUrl) {
        const selectedDoc = userDocuments.find(doc => doc.url === selectedDocumentUrl);
        if (selectedDoc) resumeTitleForBackend = selectedDoc.title;
    } else if (newResumeFile) {
        resumeTitleForBackend = newResumeFile.name;
    }

    // --- Tool Mode Logic ---
    if (toolMode === 'roast') {
      setIsLoadingRoast(true);
      setIsLoadingAnalysis(false); // Ensure analysis loading is off
      const roastPayload = new FormData();
      if (newResumeFile) {
        roastPayload.append("file", newResumeFile);
      } else {
        roastPayload.append("current_resume_url", finalResumeUrl);
      }
      // Backend might auto-add resume_title for roasts if 'file' is uploaded, 
      // or you can explicitly add it if your roast endpoint handles 'resume_title' form field.
      // For now, assuming backend handles title derivation from file upload or doesn't need it for URL-based roasts for history.
      // roastPayload.append("resume_title", resumeTitleForBackend); // If needed for roast endpoint

      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
        if (!backendUrl) throw new Error("Backend URL for user portal is not configured.");
        const roastUrl = `${backendUrl.replace(/\/$/, '')}/roast-resume`;

        console.log("Submitting to Roast URL:", roastUrl);
        const response = await fetch(roastUrl, {
          method: "POST",
          headers: { "Authorization": `Bearer ${jwtToken}` },
          body: roastPayload,
        });

        const responseData = await response.json();
        setRawResponseForDebug(JSON.stringify(responseData, null, 2));

        if (!response.ok) {
          let specificError = responseData.error || responseData.details || `HTTP error! status: ${response.status}`;
          setRoastError("Uh oh! Something went a bit sideways. Our tech wizards are on it!");
          setIsLoadingRoast(false);
          return;
        }

        console.log("Roast successful, raw responseData:", responseData);
        
        let actualRoastText: string | undefined;
        // Assuming responseData from /roast-resume is { feedback: "{\"roast\":\"THE_ROAST\"}", ... }
        if (responseData.feedback && typeof responseData.feedback === 'string') {
            try {
                const parsedFeedbackPayload: ParsedRoastPayload = JSON.parse(responseData.feedback);
                if (parsedFeedbackPayload.roast && typeof parsedFeedbackPayload.roast === 'string') {
                    actualRoastText = parsedFeedbackPayload.roast;
                }
            } catch (e) {
                console.error("Error parsing nested roast feedback JSON from responseData.feedback:", e);
                // Set roastError or use a default message if parsing fails at this stage
            }
        } else if (responseData.roast && typeof responseData.roast === 'string') {
            // Fallback if the backend endpoint directly returns { roast: "..." }
            actualRoastText = responseData.roast;
        }

        setRoastResult(actualRoastText || "Roast complete, but no specific feedback message found.");

        // Optimistic history update for roast
        const roastAnalysisId = responseData.analysis_id || Date.now(); // Use backend ID if available
        const newHistoryRoastItem: AnalysisHistoryItem = {
            id: roastAnalysisId,
            resume_url: finalResumeUrl, 
            resume_title: resumeTitleForBackend,
            created_at: new Date().toLocaleDateString(),
            job_description_title: "Resume Roast",
            is_roast: true,
            roast_feedback_text: actualRoastText, // Use the correctly parsed text
            additional_comment: "Resume Roast Feedback",
        };
        // If new resume was uploaded during roast, update userDocuments and selectedDocumentUrl
        if (newResumeFile && responseData.document_url) { // Assuming roast endpoint might return the new doc URL
            const newDoc: UserDocument = {
                id: responseData.document_id || Date.now(), // Use new doc ID if available
                title: newResumeFile.name,
                url: responseData.document_url,
            };
            setUserDocuments(prev => [newDoc, ...prev]);
            setSelectedDocumentUrl(responseData.document_url); // Select it
            finalResumeUrl = responseData.document_url; // Update finalResumeUrl for history
            newHistoryRoastItem.resume_url = responseData.document_url;
        }

        setAnalysisHistory(prevHistory => [newHistoryRoastItem, ...prevHistory].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime() ));
        setNewResumeFile(null); // Clear uploaded file after processing

      } catch (err: any) {
        console.error("Roast Resume Submit Error:", err);
        setRoastError("Uh oh! Something went a bit sideways. Our tech wizards are on it!");
      } finally {
        setIsLoadingRoast(false);
      }
      return; // End submission here for roast mode
    }

    // --- Analysis Mode Logic (existing code) ---
    setIsLoadingAnalysis(true); // Already set, but for clarity
    setIsLoadingRoast(false); // Ensure roast loading is off

    const analysisPayload = new FormData();
    analysisPayload.append("current_resume", finalResumeUrl);
    analysisPayload.append("job_description", jobDescription);
    analysisPayload.append("company_website", companyWebsite);
    if (additionalComments.trim()) {
      analysisPayload.append("additional_comments", additionalComments);
    }
    analysisPayload.append("resume_title", resumeTitleForBackend); // Send title to backend

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL; 
      if (!backendUrl) {
        throw new Error("Backend URL for user portal is not configured.");
      }
      // If your career tools have a different base path, adjust this URL
      const analyzeUrl = `${backendUrl.replace(/\/$/, '')}/analyze-resume`; 
      
      console.log("Submitting to:", analyzeUrl);
      console.log("Payload (FormData entries):");
      for (let pair of analysisPayload.entries()) {
        if (typeof pair[1] === 'string') {
          console.log(pair[0] + ': ', pair[1].substring(0, 100) + '...');
        } else {
          console.log(pair[0] + ': ', '[File Object]');
        }
      }

      const response = await fetch(analyzeUrl, {
        method: "POST",
        headers: { "Authorization": `Bearer ${jwtToken}` },
        body: analysisPayload,
      });

      const responseData: RawApiResponse = await response.json();
      setRawResponseForDebug(JSON.stringify(responseData, null, 2));

      if (!response.ok) {
        console.error("AnalyzeResume Error Response:", responseData);
        let specificError = "An unknown error occurred.";
        if (responseData.error) {
            specificError = responseData.error;
        } else if (responseData.details) {
            specificError = typeof responseData.details === 'string' ? responseData.details : JSON.stringify(responseData.details);
        } else {
            specificError = `HTTP error! status: ${response.status}`;
        }
        setError("Uh oh! Something went a bit sideways. Our tech wizards are on it!");
        setIsLoadingAnalysis(false);
        return;
      }
      
      console.log("Raw Analysis successful:", responseData);

      try {
        const parsedFeedback: FeedbackDetails = JSON.parse(responseData.feedback);
        const parsedNewResume: NewResumeDetails = JSON.parse(responseData.new_resume);
        const analysisIdForCurrent = responseData.analysis_id || Date.now(); // Prefer backend ID

        setAnalysisResult({
          id: analysisIdForCurrent, // Store ID with the result
          feedback: parsedFeedback,
          new_resume: parsedNewResume,
        });
        setCurrentAnalysisId(analysisIdForCurrent);
        console.log("Parsed Analysis successful:", { feedback: parsedFeedback, new_resume: parsedNewResume });

        // Optimistically update history table (without new_score initially)
        const newHistoryItem: AnalysisHistoryItem = {
          id: analysisIdForCurrent, 
          resume_url: finalResumeUrl,
          resume_title: resumeTitleForBackend, 
          company_website: companyWebsite,
          job_description: jobDescription,
          created_at: new Date().toLocaleDateString(),
          score: parsedFeedback.score,
          // new_score is NOT added here initially
          feedback: responseData.feedback, 
          new_resume: responseData.new_resume, 
          job_description_title: jobDescription.substring(0,70) + '...',
          is_roast: false, // Explicitly mark as not a roast
        };
        setAnalysisHistory(prevHistory => [newHistoryItem, ...prevHistory].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime() ));
        setNewResumeFile(null); // Clear uploaded file after processing

      } catch (parseError: any) {
        console.error("Error parsing nested JSON from API response:", parseError);
        console.error("Raw response was:", responseData);
        setError("Uh oh! Something went a bit sideways. Our tech wizards are on it!");
      }

    } catch (err: any) {
      console.error("AnalyzeResume Submit Error:", err);
      setError("Uh oh! Something went a bit sideways. Our tech wizards are on it!");
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const handleRevealImprovedResume = async () => {
    if (!analysisResult || !currentAnalysisId) return;

    setShowImprovedResume(true);
    const newScoreToSave = analysisResult.new_resume.new_score;

    // Optimistically update the local history state for the current analysis
    setAnalysisHistory(prevHistory =>
      prevHistory.map(item =>
        item.id === currentAnalysisId
          ? { ...item, new_score: newScoreToSave }
          : item
      )
    );

    // TODO: Backend Call - Persist the new_score
    // Example: You'll need to create an endpoint like PATCH /api/user-portal/analysis-history/{currentAnalysisId}/update-new-score
    // The body of the request would be { new_score: newScoreToSave }
    // Remember to handle JWT authentication for this endpoint.
    console.log(`TODO: Call backend to update analysis history ID ${currentAnalysisId} with new_score: ${newScoreToSave}`);
    /*
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session?.access_token) {
        throw new Error("Session error, cannot update new score.");
      }
      const jwtToken = sessionData.session.access_token;
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
      if (!backendUrl) throw new Error("Backend URL not configured.");

      const updateScoreUrl = `${backendUrl.replace(/\/$/, '')}/analysis-history/${currentAnalysisId}/update-new-score`; // Example endpoint
      
      const response = await fetch(updateScoreUrl, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ new_score: newScoreToSave }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to update new_score on backend:", errorData.error || response.status);
        // Optionally, revert optimistic update or show error to user
      } else {
        console.log("Successfully updated new_score on backend for", currentAnalysisId);
      }
    } catch (error: any) {
      console.error("Error making PATCH request to update new_score:", error.message);
      // Optionally, revert optimistic update or show error to user
    }
    */
  };

  useEffect(() => {
    if (resultsCardRef.current && ((toolMode === 'analyze' && analysisResult && !isLoadingAnalysis) || (toolMode === 'roast' && roastResult && !isLoadingRoast))) {
      const timerId = setTimeout(() => {
        resultsCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return () => clearTimeout(timerId);
    }
  }, [analysisResult, roastResult, toolMode, isLoadingAnalysis, isLoadingRoast, resultsCardRef]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-8">
      {/* Analysis History Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">Analysis History</CardTitle>
          <CardDescription>Review your past resume analyses.</CardDescription>
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
                  <TableHead className="w-[30%]">Job Info</TableHead>
                  <TableHead className="w-[30%]">Resume Used</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Score / Type</TableHead>
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
            {/* Tool Mode Selection */}
            <div className="space-y-2 p-4 border rounded-md bg-gray-50">
                <Label className="font-semibold text-lg">Choose Your Tool</Label>
                <RadioGroup
                    value={toolMode}
                    onValueChange={(value: 'analyze' | 'roast') => {
                        setToolMode(value);
                        setError(null); // Clear general errors
                        setRoastError(null); // Clear roast-specific errors
                        setAnalysisResult(null); // Clear previous results
                        setRoastResult(null);
                        setFieldErrors({}); // Clear field errors
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

            {/* Resume Input Section */}
            <div className="space-y-3 p-4 border rounded-md bg-slate-50">
              <Label className="font-semibold text-lg">Your Current Resume <span className="text-red-500">*</span></Label>
              <RadioGroup 
                defaultValue="select"
                value={resumeInputMethod}
                onValueChange={(value: 'select' | 'upload') => {
                    setResumeInputMethod(value);
                    setError(null); // Clear error when switching method
                    if (value === 'select') setNewResumeFile(null); // Clear file if switching to select
                    // else setSelectedDocumentUrl(""); // Clear selection if switching to upload - or keep for quick switch back?
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
                            setNewResumeFile(null); // Clear file input if selection is made
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
                <div className="space-y-2">
                  <Input 
                    id="newResumeUpload"
                    type="file" 
                    accept=".pdf,.doc,.docx,.txt,.rtf"
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
            {roastError && ( // Display roast-specific errors
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
            {rawResponseForDebug && !analysisResult && !roastResult && (error || roastError) && (
                <details className="w-full mt-2 text-xs text-gray-500">
                    <summary>Show raw API response (for debugging)</summary>
                    <pre className="bg-gray-100 p-2 rounded-md overflow-x-auto mt-1">
                        {rawResponseForDebug}
                    </pre>
                </details>
            )}
          </CardFooter>
        </form>
      </Card>

      {/* Analysis Results - Conditionally shown for 'analyze' mode results */}
      {toolMode === 'analyze' && analysisResult && !isLoadingAnalysis && (
        <Card className="mt-8" ref={resultsCardRef}>
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Feedback Section */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-800">Feedback Analysis</h3>
              <Card className="p-4">
                <div className="flex justify-between items-center mb-2">
                    <p className="text-md font-medium">Overall Score: <span className="text-blue-600 font-bold">{analysisResult.feedback.score}/10</span></p>
                </div>
                <h4 className="text-sm font-semibold mb-1">Detailed Feedback:</h4>
                <div className="prose prose-sm max-w-none p-3 bg-gray-50 rounded-md overflow-x-auto overflow-y-auto max-h-72">
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
                {/* New Resume Section */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-800">Improved Resume</h3>
                  <Card className="p-4">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-md font-medium">New Score: <span className="text-green-600 font-bold">{analysisResult.new_resume.new_score}/10</span></p>
                    </div>
                    
                    <h4 className="text-sm font-semibold mb-1">Summary of Changes:</h4>
                    <div className="prose prose-sm max-w-none p-3 bg-gray-50 rounded-md overflow-x-auto overflow-y-auto max-h-72 mb-4">
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
                    <Textarea
                      value={analysisResult.new_resume.new_resume}
                      readOnly
                      rows={15}
                      className="bg-gray-50 p-3 rounded-md text-sm whitespace-pre-wrap break-words w-full focus:ring-0 focus:border-gray-300 border-gray-300 overflow-y-auto max-h-[400px]"
                    />
                  </Card>
                </div>
              </>
            )}
            
          </CardContent>
        </Card>
      )}

      {/* Roast Results - Conditionally shown for 'roast' mode results */}
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
                <div className="prose prose-sm max-w-none p-3 rounded-md overflow-x-auto overflow-y-auto max-h-96 text-gray-800">
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
                    // Optionally switch back to analyze mode or clear other fields
                    // setToolMode('analyze'); 
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
