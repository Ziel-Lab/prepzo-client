"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { FileText, UploadCloud, Loader2, Trash2, MessageSquare, ExternalLink, Pencil, X } from "lucide-react";
import { useState, useRef, ChangeEvent, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

// Define a type for the document structure
interface Document {
  id: number | string; // From database primary key
  title: string; // From database 'document_name' or 'display_name'
  type: string; // From database 'document_type'
  createdAt: string; // From database 'created_at'
  lastModified: string; // From database 'updated_at' (or same as createdAt if no updates)
  status: string; // Can be client-side (e.g., "Uploaded", "Final") or from DB if available
  url?: string; // From database 'document_url'
  user_comment?: string; // New field for user comments
}

const DocumentsContent = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false); // For file upload
  const [isFetchingDocs, setIsFetchingDocs] = useState(true); // For initial doc fetch
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null); // For delete errors
  const [deletingDocId, setDeletingDocId] = useState<string | number | null>(null); // To track which doc is being deleted
  
  // State for comments
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [updatingCommentDocId, setUpdatingCommentDocId] = useState<string | number | null>(null);
  const [commentError, setCommentError] = useState<{ [key: string]: string | null }>({}); // Error per document ID
  const [editingCommentDocId, setEditingCommentDocId] = useState<string | number | null>(null); // New state for active editor

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchDocuments = async () => {
      setIsFetchingDocs(true);
      setError(null);
      setDeleteError(null);
      setCommentError({});
      console.log("Fetching documents...");

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData?.session?.access_token) {
        setError("Could not retrieve user session for fetching documents. Please ensure you are logged in.");
        console.error("fetchDocuments: Session error or no access token.", sessionError, sessionData);
        setIsFetchingDocs(false);
        return;
      }
      const jwtToken = sessionData.session.access_token;

      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
        if (!backendUrl) {
          throw new Error("Backend URL is not configured (fetchDocuments).");
        }
        const fetchUrl = `${backendUrl.replace(/$/, '')}/get-documents`;
        console.log(`fetchDocuments: Fetching from ${fetchUrl}`);

        const response = await fetch(fetchUrl, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${jwtToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Failed to parse error JSON" }));
          console.error("fetchDocuments: Response not OK:", response.status, errorData);
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const fetchedDocsRaw = await response.json();
        console.log("fetchDocuments: Successfully fetched raw documents:", fetchedDocsRaw);

        // Map fetched documents to the frontend Document interface
        const fetchedDocs: Document[] = fetchedDocsRaw.map((doc: any) => ({
          id: doc.id, // Assuming 'id' is the primary key from your table
          title: doc.document_name || doc.display_name || "Untitled Document",
          type: doc.document_type || "Unknown Type",
          createdAt: doc.created_at ? new Date(doc.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          lastModified: doc.updated_at ? new Date(doc.updated_at).toISOString().split('T')[0] : (doc.created_at ? new Date(doc.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
          status: "Final", // Or derive from backend if available, default to "Final"
          url: doc.document_url,
          user_comment: doc.user_comment || "", // Initialize comment, assuming backend field is 'user_comment'
        }));
        
        setDocuments(fetchedDocs);
        // Initialize comment inputs based on fetched documents
        const initialCommentInputs: { [key: string]: string } = {};
        fetchedDocs.forEach(doc => {
          initialCommentInputs[doc.id.toString()] = doc.user_comment || "";
        });
        setCommentInputs(initialCommentInputs);

      } catch (err: any) {
        console.error("fetchDocuments: Error:", err);
        setError(err.message || "Failed to fetch documents.");
      } finally {
        setIsFetchingDocs(false);
      }
    };

    fetchDocuments();
  }, [supabase]); // Re-fetch if supabase client instance changes (though unlikely)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setError(null); // Clear previous errors
      setDeleteError(null); // Clear delete errors as well
    }
  };

  const handleUpload = async () => {
    console.log("handleUpload called");
    if (!selectedFile) {
      setError("Please select a file first.");
      console.error("handleUpload: No file selected");
      return;
    }
    console.log("handleUpload: Selected file:", selectedFile);

    setIsLoading(true);
    setError(null);
    setDeleteError(null);
    setCommentError({});

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData?.session?.access_token) {
      setError("Could not retrieve user session for upload. Please ensure you are logged in.");
      console.error("handleUpload: Session error or no access token.", sessionError, sessionData);
      setIsLoading(false);
      return;
    }

    const jwtToken = sessionData.session.access_token;
    console.log("handleUpload: JWT Token retrieved:", jwtToken ? `${jwtToken.substring(0, 20)}...` : null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
      if (!backendUrl) {
        throw new Error("Backend URL is not configured (handleUpload).");
      }
      const uploadUrl = `${backendUrl.replace(/$/, '')}/upload-document`;
      console.log(`handleUpload: Fetching to: ${uploadUrl}`);
      
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${jwtToken}`,
        },
        body: formData,
      });

      setIsLoading(false);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse error JSON" }));
        console.error("handleUpload: Fetch response not OK:", response.status, errorData);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("handleUpload: Fetch successful, result:", result);
      
      // Add the new document to the state optimistically
      const newDocumentDataFromServer = result.db_response?.[0]; // Data from the insert operation

      const newDocument: Document = {
        id: newDocumentDataFromServer?.id || Date.now().toString(), // Use ID from DB response
        title: selectedFile.name,
        type: selectedFile.type || "Other",
        createdAt: newDocumentDataFromServer?.created_at ? new Date(newDocumentDataFromServer.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        lastModified: newDocumentDataFromServer?.updated_at ? new Date(newDocumentDataFromServer.updated_at).toISOString().split('T')[0] : (newDocumentDataFromServer?.created_at ? new Date(newDocumentDataFromServer.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
        status: "Uploaded",
        url: result.file_url,
        user_comment: "", // New documents start with no comment
      };
      setDocuments(prevDocuments => [newDocument, ...prevDocuments]);
      setCommentInputs(prev => ({ ...prev, [newDocument.id.toString()]: "" })); // Initialize comment input for new doc
      setSelectedFile(null);
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }

    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || "An unexpected error occurred during upload.");
      console.error("Upload error (in catch block):", err);
    }
  };

  const handleDeleteDocument = async (documentId: number | string) => {
    console.log(`handleDeleteDocument called for ID: ${documentId}`);
    setDeletingDocId(documentId.toString());
    setError(null);
    setDeleteError(null);

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData?.session?.access_token) {
      setDeleteError("Could not retrieve user session for deletion. Please ensure you are logged in.");
      console.error("handleDeleteDocument: Session error or no access token.", sessionError, sessionData);
      setDeletingDocId(null);
      return;
    }

    const jwtToken = sessionData.session.access_token;
    console.log("handleDeleteDocument: JWT Token retrieved:", jwtToken ? `${jwtToken.substring(0, 20)}...` : null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
      if (!backendUrl) {
        throw new Error("Backend URL is not configured (handleDeleteDocument).");
      }
      const deleteUrl = `${backendUrl.replace(/$/, '')}/delete-document/${documentId}`;
      console.log(`handleDeleteDocument: Fetching to: ${deleteUrl}`);
      
      const response = await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${jwtToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse error JSON" }));
        console.error("handleDeleteDocument: Fetch response not OK:", response.status, errorData);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("handleDeleteDocument: Fetch successful, result:", result);
      
      setDocuments(prevDocuments => prevDocuments.filter(doc => doc.id.toString() !== documentId.toString()));

    } catch (err: any) {
      console.error("handleDeleteDocument: Error:", err);
      setDeleteError(err.message || "Failed to delete document.");
    } finally {
      setDeletingDocId(null);
    }
  };

  const handleCommentInputChange = (documentId: string | number, value: string) => {
    setCommentInputs(prev => ({ ...prev, [documentId.toString()]: value }));
    setCommentError(prev => ({...prev, [documentId.toString()]: null})); // Clear error for this doc on input change
  };

  const handleStartEditComment = (doc: Document) => {
    setEditingCommentDocId(doc.id.toString());
    // Initialize input with current comment when starting edit
    setCommentInputs(prev => ({ ...prev, [doc.id.toString()]: doc.user_comment || "" }));
    setCommentError(prev => ({...prev, [doc.id.toString()]: null})); // Clear error when starting edit
  };

  const handleCancelEditComment = (docId: string | number) => {
    setEditingCommentDocId(null);
    // Optionally, reset comment input to original value if needed, but for now, just exit edit mode
    // const originalDoc = documents.find(d => d.id.toString() === docId.toString());
    // if (originalDoc) {
    //   setCommentInputs(prev => ({ ...prev, [docId.toString()]: originalDoc.user_comment || "" }));
    // }
    setCommentError(prev => ({...prev, [docId.toString()]: null})); 
  };

  const handleUpdateComment = async (documentId: number | string) => {
    const docIdStr = documentId.toString();
    const commentText = commentInputs[docIdStr];
    if (typeof commentText === 'undefined') {
        console.warn("handleUpdateComment: No comment text found for doc ID:", docIdStr);
        return; // Should not happen if UI is correct
    }

    console.log(`handleUpdateComment called for ID: ${docIdStr} with comment: "${commentText}"`);
    setUpdatingCommentDocId(docIdStr);
    setCommentError(prev => ({...prev, [docIdStr]: null})); // Clear previous error for this specific doc
    setError(null); // Clear general errors
    setDeleteError(null); // Clear delete errors

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData?.session?.access_token) {
      setCommentError(prev => ({...prev, [docIdStr]: "Session error. Please log in."}) );
      console.error("handleUpdateComment: Session error.", sessionError);
      setUpdatingCommentDocId(null);
      return;
    }
    const jwtToken = sessionData.session.access_token;

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
      if (!backendUrl) {
        throw new Error("Backend URL is not configured.");
      }
      const updateUrl = `${backendUrl.replace(/$/, '')}/update-document-comments/${docIdStr}`;
      console.log(`handleUpdateComment: Fetching to: ${updateUrl}`);
      
      const response = await fetch(updateUrl, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment: commentText }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse error JSON" }));
        console.error("handleUpdateComment: Response not OK:", response.status, errorData);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json(); // Assuming backend returns the updated document or a success message
      console.log("handleUpdateComment: Success, result:", result);
      
      setDocuments(prevDocuments => 
        prevDocuments.map(doc => 
          doc.id.toString() === docIdStr ? { ...doc, user_comment: commentText } : doc
        )
      );
      setEditingCommentDocId(null); // Exit edit mode on successful save

    } catch (err: any) {
      console.error("handleUpdateComment: Error for doc ID", docIdStr, err);
      setCommentError(prev => ({...prev, [docIdStr]: err.message || "Failed to update comment."}));
    } finally {
      setUpdatingCommentDocId(null);
      // Do not setEditingCommentDocId to null here if save fails, user might want to retry or see error
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#12231B]">My Documents</h1>
          <p className="text-gray-600 mt-1">Track your career documents and materials</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.rtf"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-[#12231B] text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition-colors flex items-center gap-2"
            disabled={isLoading}
          >
            <UploadCloud size={20} />
            Add Document
          </button>
        </div>
      </div>

      {selectedFile && !isLoading && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md flex justify-between items-center">
          <div>
            <p className="font-medium text-blue-700">Selected file: {selectedFile.name}</p>
            <p className="text-sm text-blue-600">Type: {selectedFile.type}, Size: {(selectedFile.size / 1024).toFixed(2)} KB</p>
          </div>
          <button
            onClick={handleUpload}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
          >
            Upload
          </button>
        </div>
      )}

      {isLoading && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-center">
          <p className="font-medium text-yellow-700">Uploading, please wait...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-center">
          <p className="font-medium text-red-700">Error: {error}</p>
        </div>
      )}

      {deleteError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-center mt-4">
          <p className="font-medium text-red-700">Delete Error: {deleteError}</p>
        </div>
      )}

      {isFetchingDocs && (
        <div className="flex justify-center items-center p-10">
          <Loader2 className="h-8 w-8 animate-spin text-[#12231B]" />
          <p className="ml-2 text-gray-600">Loading your documents...</p>
        </div>
      )}

      {!isFetchingDocs && documents.length === 0 && !error && (
        <div className="text-center p-10 border border-dashed border-gray-300 rounded-md">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700">No documents yet</h3>
          <p className="text-gray-500 mt-1">Upload your first document to get started.</p>
        </div>
      )}

      {!isFetchingDocs && documents.length > 0 && (
        <Table className="mt-4">
          <TableCaption>A list of your uploaded documents.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Document Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead>Last Modified</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[300px]">Your Comment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#12231B] flex-shrink-0" />
                    <span className="truncate" title={doc.title}>{doc.title}</span>
                  </div>
                </TableCell>
                <TableCell>{doc.type}</TableCell>
                <TableCell>{doc.createdAt}</TableCell>
                <TableCell>{doc.lastModified}</TableCell>
                <TableCell>
                  <span
                    className={`text-xs px-2 py-1 rounded-full flex-shrink-0 whitespace-nowrap ${
                      doc.status === "Final" || doc.status === "Uploaded"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {doc.status}
                  </span>
                </TableCell>
                <TableCell>
                  {editingCommentDocId === doc.id.toString() ? (
                    // Edit Mode
                    <div className="flex flex-col items-start w-full">
                      <textarea
                        id={`comment-edit-${doc.id.toString()}`}
                        value={commentInputs[doc.id.toString()] || ""}
                        onChange={(e) => handleCommentInputChange(doc.id, e.target.value)}
                        placeholder="Add a private comment..."
                        className="w-full p-1.5 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-[#12231B] focus:border-[#12231B] resize-none"
                        rows={2} // Slightly more rows when editing
                        autoFocus
                      />
                      {commentError[doc.id.toString()] && (
                        <p className="text-xs text-red-500 mt-1">Error: {commentError[doc.id.toString()]}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <button
                          onClick={() => handleUpdateComment(doc.id)}
                          disabled={updatingCommentDocId === doc.id.toString() || commentInputs[doc.id.toString()] === (doc.user_comment || "")}
                          className="bg-[#12231B] text-white px-2 py-0.5 text-xs rounded hover:bg-opacity-90 transition-colors disabled:opacity-60 flex items-center justify-center min-w-[60px]"
                        >
                          {updatingCommentDocId === doc.id.toString() ? (
                            <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Saving...</>
                          ) : (
                            (doc.user_comment && doc.user_comment !== "") ? "Save" : "Add"
                          )}
                        </button>
                        <button
                          onClick={() => handleCancelEditComment(doc.id)}
                          className="text-gray-600 hover:text-gray-800 px-2 py-0.5 text-xs rounded border border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center"
                          disabled={updatingCommentDocId === doc.id.toString()}
                        >
                           <X size={12} className="mr-0.5"/> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Display Mode
                    <div className="flex flex-col items-start w-full group">
                      {doc.user_comment && doc.user_comment.trim() !== "" ? (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-sm text-gray-700 whitespace-pre-wrap break-words w-[calc(100%-28px)]">{doc.user_comment}</span>
                          <button 
                            onClick={() => handleStartEditComment(doc)}
                            className="text-gray-500 hover:text-[#12231B] p-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity ml-1"
                            title="Edit comment"
                          >
                            <Pencil size={14} />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleStartEditComment(doc)}
                          className="text-xs text-gray-500 hover:text-[#12231B] p-1 rounded flex items-center gap-1 border border-transparent hover:border-gray-300 transition-colors"
                          title="Add comment"
                        >
                          <MessageSquare size={14} /> Add Comment
                        </button>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end items-center gap-2">
                    {doc.url && (
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="View Document"
                      >
                        <ExternalLink size={18} />
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      disabled={deletingDocId === doc.id.toString()}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50 p-1"
                      aria-label="Delete document"
                      title="Delete Document"
                    >
                      {deletingDocId === doc.id.toString() ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          {documents.length > 10 && (
            <TableFooter>
                <TableRow>
                    <TableCell colSpan={7} className="text-center">End of documents.</TableCell>
                </TableRow>
            </TableFooter>
          )}
        </Table>
      )}
    </div>
  );
};

export default DocumentsContent; 