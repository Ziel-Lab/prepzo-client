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
}

const CoverLetterContent = () => {
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

  const supabase = createClient();
  const resultsRef = useRef<HTMLDivElement>(null);

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
        const fetchedDocsRaw = await docsResponse.json();
        const fetchedDocs: UserDocument[] = fetchedDocsRaw.map((doc: any) => ({
          id: doc.id,
          title: doc.document_name || doc.display_name || "Untitled Document",
          url: doc.document_url,
        }));
        setUserDocuments(fetchedDocs);
        if (!(fetchedDocs.length > 0 && fetchedDocs[0].url)) {
          setResumeInputMethod("upload");
        }
      } catch (err: any) {
        console.error("Error fetching user documents:", err);
        setError("Uh oh! Something went a bit sideways. Our tech wizards are on it!");
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
        const historyDataRaw: any[] = await historyResponse.json();
        const formattedHistory: CoverLetterHistoryItem[] = historyDataRaw.map((item: any) => ({
          id: item.id,
          job_description: item.job_description ? (item.job_description.substring(0, 70) + '...') : "N/A",
          company_website: item.company_website,
          current_resume: item.current_resume,
          resume_title: item.current_resume ? decodeURIComponent(item.current_resume.split('/').pop().split('?')[0]) : 'N/A',
          user_additional_comments: item.additional_comments, // User's input comments for this generation
          generated_outputs: item.feedback, // Corrected: Map from item.feedback
          created_at: new Date(item.created_at).toLocaleDateString(),
        })).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setHistory(formattedHistory);
      } catch (err: any) {
        console.error("Error fetching cover letter history:", err);
        setHistoryError("Uh oh! Something went a bit sideways. Our tech wizards are on it!");
      } finally {
        setIsFetchingHistory(false);
      }
    };

    if (supabase) fetchData();
  }, [supabase]);

  const handleResumeFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setNewResumeFile(event.target.files[0]);
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
    } catch (err: any) {
      console.error("New resume upload error:", err);
      setError("Uh oh! Something went a bit sideways. Our tech wizards are on it!");
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
    setGeneratedResult(null);

    let finalResumeUrl = selectedResumeUrl;
    if (resumeInputMethod === "upload" && newResumeFile) {
      const uploadedUrl = await uploadNewResumeAndGetUrl(newResumeFile);
      if (uploadedUrl) {
        finalResumeUrl = uploadedUrl;
        setSelectedResumeUrl(uploadedUrl); // So it's selected if user re-submits without changing file
      } else {
        setIsLoading(false);
        return; // Error is set by uploadNewResumeAndGetUrl
      }
    }

    if (!finalResumeUrl) {
        setError("Resume URL could not be determined. Please select or upload a resume.");
        setIsLoading(false);
        return;
    }

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

    const payload = new FormData();
    payload.append("current_resume", finalResumeUrl);
    payload.append("job_description", jobDescription);
    if (companyWebsite.trim()) payload.append("company_website", companyWebsite);
    if (userComments.trim()) payload.append("additional_comments", userComments);

    try {
      const response = await fetch(`${backendUrl.replace(/\/$/, '')}/create-cover-letter`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwtToken}` },
        body: payload,
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Try to parse error from backend if it's structured, otherwise use raw text or status
        let errorMessage = `HTTP Error: ${response.status}`;
        if (responseData && (responseData.error || responseData.details)) {
            errorMessage = responseData.error || (typeof responseData.details === 'string' ? responseData.details : JSON.stringify(responseData.details));
        }
        setError("Uh oh! Something went a bit sideways. Our tech wizards are on it!");
        setIsLoading(false);
        return;
      }
      
      // EXPECTED: responseData = { feedback: "{\"cover_letter\":\"...\", \"additional_comments\":\"...\"}" }
      if (responseData.feedback && typeof responseData.feedback === 'string') {
        const parsedFeedback: CoverLetterResult = JSON.parse(responseData.feedback);

        if (parsedFeedback.cover_letter && parsedFeedback.additional_comments !== undefined) {
            setGeneratedResult(parsedFeedback);
            
            // Add to history
            const historyItemId = responseData.id || Date.now(); // Use backend ID if provided
            const newHistoryEntry: CoverLetterHistoryItem = {
                id: historyItemId, 
                job_description: jobDescription.substring(0,70) + '...',
                company_website: companyWebsite,
                current_resume: finalResumeUrl,
                resume_title: newResumeFile?.name || userDocuments.find(d => d.url === finalResumeUrl)?.title || 'N/A',
                user_additional_comments: userComments,
                generated_outputs: parsedFeedback, // Store the parsed object directly
                created_at: new Date().toLocaleDateString(),
            };
            setHistory(prev => [newHistoryEntry, ...prev].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
            setNewResumeFile(null); 
        } else {
            console.error("Parsed feedback from backend is missing cover_letter or additional_comments:", parsedFeedback);
            setError("Uh oh! Something went a bit sideways. Our tech wizards are on it!");
            setIsLoading(false);
        }
      } else if (responseData.cover_letter && responseData.additional_comments !== undefined) {
        // Fallback: if backend ALREADY parsed it and sent it as top-level (less likely based on new info)
        console.warn("Backend sent parsed cover letter data directly, adapting...");
        setGeneratedResult({
          cover_letter: responseData.cover_letter,
          additional_comments: responseData.additional_comments,
        });
        const historyItemId = responseData.id || Date.now();
        const newHistoryEntry: CoverLetterHistoryItem = {
            id: historyItemId,
            job_description: jobDescription.substring(0,70) + '...',
            company_website: companyWebsite,
            current_resume: finalResumeUrl,
            resume_title: newResumeFile?.name || userDocuments.find(d => d.url === finalResumeUrl)?.title || 'N/A',
            user_additional_comments: userComments,
            generated_outputs: { cover_letter: responseData.cover_letter, additional_comments: responseData.additional_comments },
            created_at: new Date().toLocaleDateString(),
        };
        setHistory(prev => [newHistoryEntry, ...prev].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        setNewResumeFile(null);
      } else if (responseData.message && responseData.details) { // Your existing specific error handling
        console.error("Error processing cover letter from backend:", responseData.details);
        setError("Uh oh! Something went a bit sideways. Our tech wizards are on it!");
      } else {
        setError("Uh oh! Something went a bit sideways. Our tech wizards are on it!");
      }

    } catch (err: any) {
      console.error("Cover letter generation error:", err);
      setError("Uh oh! Something went a bit sideways. Our tech wizards are on it!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Maybe show a toast notification
      console.log("Copied to clipboard");
    }).catch(err => {
      console.error("Failed to copy:", err);
    });
  };
  
  const handleUseSuggestion = (suggestion: string) => {
    setUserComments(prev => prev ? `${prev}\n\n${suggestion}` : suggestion);
  };

  useEffect(() => {
    if (generatedResult && resultsRef.current && !isLoading) {
      const timerId = setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return () => clearTimeout(timerId);
    }
  }, [generatedResult, isLoading, resultsRef]);

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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Job Snippet</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Resume</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.created_at}</TableCell>
                    <TableCell className="truncate max-w-xs" title={item.job_description}>{item.job_description}</TableCell>
                    <TableCell className="truncate max-w-xs" title={item.company_website}>{item.company_website || 'N/A'}</TableCell>
                    <TableCell className="truncate max-w-xs" title={item.current_resume}>{item.resume_title || 'N/A'}</TableCell>
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
                                    <Textarea value={selectedHistoryItemForDialog.generated_outputs?.cover_letter || "(Cover letter content not available for this item.)"} readOnly rows={10} className="bg-gray-50 text-sm"/>
                                </div>
                                {selectedHistoryItemForDialog.generated_outputs?.additional_comments && (
                                    <div>
                                        <h4 className="font-semibold text-md mb-1 flex items-center"><Lightbulb size={16} className="mr-2 text-yellow-500"/> AI Suggestions</h4>
                                        <div className="prose prose-sm max-w-none p-3 bg-yellow-50 border border-yellow-200 rounded-md overflow-x-auto overflow-y-auto">
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
              <RadioGroup value={resumeInputMethod} onValueChange={(v: any) => { setResumeInputMethod(v); setError(null); if (v === 'select') setNewResumeFile(null);}} className="flex items-center gap-4 mb-3">
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
                <div className="space-y-1">
                  <Input id="newResumeUpload" type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleResumeFileChange} className={`w-full ${fieldErrors.resume ? 'border-red-500' : ''}`} disabled={isLoading || isUploadingNewResume} />
                  {newResumeFile && <p className="text-xs text-gray-600">Selected: {newResumeFile.name}</p>}
                  {isUploadingNewResume && <div className="flex items-center text-sm text-blue-600"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</div>}
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

      {/* Results Section */}
      {generatedResult && !isLoading && (
        <Card className="mt-8" ref={resultsRef}>
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center"><CheckCircle2 className="mr-2 h-6 w-6 text-green-600" /> Your Generated Cover Letter</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1: Cover Letter Text */}
            <div>
              <h3 className="text-lg font-semibold mb-2 flex justify-between items-center">
                Cover Letter Text
                <Button variant="outline" size="sm" onClick={() => handleCopyToClipboard(generatedResult.cover_letter)}><Copy size={14} className="mr-1"/>Copy All</Button>
              </h3>
              <Textarea value={generatedResult.cover_letter} readOnly rows={20} className="bg-gray-50 p-3 rounded-md text-sm whitespace-pre-wrap break-words w-full focus:ring-0 focus:border-gray-300 border-gray-300 h-full min-h-[300px] md:min-h-[400px] overflow-y-auto" />
            </div>
            
            {/* Column 2: AI Suggestions */}
            {generatedResult.additional_comments && (
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold mb-2 flex items-center"><Lightbulb className="mr-2 h-5 w-5 text-yellow-500"/> AI Suggestions for Improvement</h3>
                <Card className="bg-amber-50 border-amber-200 p-4 flex-grow">
                  <CardContent className="p-0 flex flex-col h-full">
                    <p className="text-sm text-gray-700 mb-2">Consider incorporating these points into the "Your Additional Comments" field above and regenerating for an even better cover letter.</p>
                    <div className="prose prose-sm max-w-none p-3 bg-white border border-gray-200 rounded-md overflow-y-auto flex-grow min-h-0">
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
