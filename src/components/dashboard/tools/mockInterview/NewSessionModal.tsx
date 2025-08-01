"use client";

import React, { useState, useEffect, ChangeEvent } from 'react';
import { Target, Loader2, FileText, Star, Link, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/utils/supabase/client';

interface UserDocument {
  id: number | string;
  title: string;
  url?: string;
  subtitle?: string;
}

interface UserLimits {
  plan_id: number;
  session_limit: number;
  sessions_used: number;
  sessions_remaining: number;
  attempts_per_session: number;
  is_unlimited_sessions: boolean;
  can_create_session: boolean;
  plan_name: string;
}

interface NewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  userLimits?: UserLimits | null;
}

const NewSessionModal: React.FC<NewSessionModalProps> = ({ isOpen, onClose, onSubmit, isLoading = false, userLimits }) => {
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    companyUrl: '',
    role: '',
    jobDescription: '',
    description: ''
  });
  
  // Custom interview type state
  const [customInterviewType, setCustomInterviewType] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Resume state
  const [resumeMethod, setResumeMethod] = useState<'select' | 'upload'>('select');
  const [resumeDocuments, setResumeDocuments] = useState<UserDocument[]>([]);
  const [selectedResumeUrl, setSelectedResumeUrl] = useState<string>("");
  const [newResumeFile, setNewResumeFile] = useState<File | null>(null);
  
  // Cover letter state
  const [includeCoverLetter, setIncludeCoverLetter] = useState(false);
  const [coverLetterMethod, setCoverLetterMethod] = useState<'select' | 'upload'>('select');
  const [coverLetterDocuments, setCoverLetterDocuments] = useState<UserDocument[]>([]);
  const [selectedCoverLetterUrl, setSelectedCoverLetterUrl] = useState<string>("");
  const [newCoverLetterFile, setNewCoverLetterFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      console.log('🎭 NewSessionModal opened - fetching documents...');
      // Reset state when modal opens
      setResumeDocuments([]);
      setCoverLetterDocuments([]);
      setSelectedResumeUrl('');
      setSelectedCoverLetterUrl('');
      setError(null);
      
      fetchDocuments();
    } else {
      // Clear state when modal closes to prevent stale data
      console.log('🎭 NewSessionModal closed - clearing state...');
      setResumeDocuments([]);
      setCoverLetterDocuments([]);
      setSelectedResumeUrl('');
      setSelectedCoverLetterUrl('');
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session?.access_token) {
        console.error('🔐 Authentication error:', sessionError);
        setError("Could not retrieve user session.");
        return;
      }

      const jwtToken = sessionData.session.access_token;
      const userId = sessionData.session.user?.id;
      const userEmail = sessionData.session.user?.email;
      
      console.log('👤 Fetching documents for user:', {
        userId: userId?.substring(0, 8) + '***',
        userEmail: userEmail
      });
      
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
      if (!backendUrl) {
        throw new Error("Backend URL is not configured.");
      }

      // Fetch ALL documents using the upload blueprint endpoint
      try {
        const requestUrl = `${backendUrl}/get-documents`;
        console.log('📡 Fetching from:', requestUrl);

        const response = await fetch(requestUrl, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${jwtToken}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const responseData = await response.json();
          const allDocuments = responseData || []; // Response is directly an array, not wrapped in documents
          
          console.log('📄 Raw documents received:', {
            total: allDocuments.length,
            sample: allDocuments.slice(0, 2).map((doc: any) => ({
              id: doc.id,
              name: doc.document_name,
              type: doc.document_type,
              url_exists: !!doc.document_url
            }))
          });

          // Improved filtering with better logging and case-insensitive matching
          // Note: uid is filtered server-side, so all documents belong to the current user
          const resumes = allDocuments
            .filter((doc: { document_type: string; id: number; document_name: string; document_url: string; }) => {
              const docType = (doc.document_type || '').toLowerCase().trim();
              const fileName = (doc.document_name || '').toLowerCase();
              
              console.log('🔍 Resume filter check:', {
                docId: doc.id,
                docName: doc.document_name,
                docType: doc.document_type,
                normalizedType: docType,
                fileName: fileName
              });
              
              // Primary: Case-insensitive document type matching for resumes
              const isResumeType = (
                docType === 'resume' || docType === 'cv' ||
                docType === 'Resume' || docType === 'CV' ||
                docType.includes('resume') || docType.includes('cv')
              );
              
              // Secondary: Check filename for resume-like patterns (fallback for misclassified docs)
              const hasResumeInFilename = (
                fileName.includes('resume') || fileName.includes('cv') || 
                fileName.includes('curriculum') ||
                // Check if it's likely a personal resume file (firstname + lastname + optional numbers + pdf)
                /^[a-z]+[a-z0-9]*\.(pdf|doc|docx)$/i.test(fileName) ||
                // Common resume patterns
                /resume/i.test(fileName) || /cv/i.test(fileName) ||
                // Aggressive detection for likely personal documents (for misclassified resumes)
                (fileName.endsWith('.pdf') && 
                 fileName.length > 5 && 
                 fileName.length < 50 && 
                 /^[a-zA-Z]+[a-zA-Z0-9]*\.pdf$/i.test(fileName) &&
                 !fileName.toLowerCase().includes('cover') &&
                 !fileName.toLowerCase().includes('letter'))
              );
              
              console.log('📄 Filename analysis:', {
                fileName,
                hasResumeInFilename,
                isPdfFile: fileName.endsWith('.pdf'),
                looksLikePersonalFile: /^[a-z]+[a-z0-9]*\.(pdf|doc|docx)$/i.test(fileName),
                isResumeType,
                finalDecision: isResumeType || hasResumeInFilename,
                reasons: {
                  matchesResumeType: isResumeType,
                  matchesFilename: hasResumeInFilename
                }
              });
               
              return isResumeType || hasResumeInFilename;
            })
            .map((doc: any) => {
              const docType = (doc.document_type || '').toLowerCase().trim();
              const isProperlyCategories = docType.includes('resume') || docType.includes('cv');
              
              return {
                id: doc.id,
                title: doc.document_name || doc.display_name || "Untitled Resume",
                url: doc.document_url,
                // Add indicator if this was matched by filename rather than type
                subtitle: !isProperlyCategories ? "(Auto-detected from filename)" : undefined
              };
            });
          
          // Improved filtering for cover letters
          // Note: uid is filtered server-side, so all documents belong to the current user
          const coverLetters = allDocuments
            .filter((doc: { document_type: string; id: number; document_name: string; document_url: string; }) => {
              const docType = (doc.document_type || '').toLowerCase().trim();
              
              console.log('💌 Cover letter filter check:', {
                docId: doc.id,
                docName: doc.document_name,
                docType: doc.document_type,
                normalizedType: docType
              });
              
              // Case-insensitive document type matching for cover letters
              const isCoverLetterType = (
                docType === 'cover letter' || docType === 'cover_letter' ||
                docType === 'coverletter' || docType.includes('cover') ||
                docType === 'Cover Letter' || docType === 'Cover_Letter'
              );
              
              return isCoverLetterType;
            })
            .map((doc: any) => ({
              id: doc.id,
              title: doc.document_name || doc.display_name || "Untitled Cover Letter", 
              url: doc.document_url,
            }));

          // Check for potential misclassified documents
          // Note: uid is filtered server-side, so all documents belong to the current user
          const potentialResumes = allDocuments.filter((doc: any) => {
            const fileName = (doc.document_name || '').toLowerCase();
            const currentType = (doc.document_type || '').toLowerCase();
            
            // Look for resume-like filenames that might be misclassified
            const hasResumeInName = fileName.includes('resume') || fileName.includes('cv') || 
                                   fileName.includes('curriculum');
            
            return hasResumeInName && currentType !== 'resume' && currentType !== 'cv';
          });

          console.log('✅ Document filtering results:', {
            totalDocuments: allDocuments.length,
            resumesFound: resumes.length,
            coverLettersFound: coverLetters.length,
            potentialMisclassifiedResumes: potentialResumes.length,
            resumes: resumes.map((r: UserDocument) => ({ id: r.id, title: r.title })),
            coverLetters: coverLetters.map((c: UserDocument) => ({ id: c.id, title: c.title })),
            allDocTypes: allDocuments.map((doc: any) => ({ 
              name: doc.document_name, 
              type: doc.document_type
            })),
            potentialMisclassified: potentialResumes.map((doc: any) => ({
              name: doc.document_name,
              currentType: doc.document_type,
              suggestion: 'This looks like a resume but is categorized differently'
            }))
          });

          setResumeDocuments(resumes);
          setCoverLetterDocuments(coverLetters);
          
          // Show helpful message if no resumes found but potential misclassified documents exist
          if (resumes.length === 0 && potentialResumes.length > 0) {
            setError(`📋 Found ${potentialResumes.length} document(s) that might be resumes but are categorized differently. Check your Documents section to update document types.`);
          } else {
            // Clear any previous errors on successful load
            setError(null);
          }
          
        } else {
          const errorText = await response.text();
          console.error('❌ Failed to fetch documents:', {
            status: response.status,
            statusText: response.statusText,
            errorText
          });
          
          if (response.status === 401) {
            setError("Authentication failed. Please try logging out and back in.");
          } else if (response.status === 403) {
            setError("Access denied. Please check your account permissions.");
          } else if (response.status === 404) {
            setError("Document service not found. Please contact support.");
          } else {
            setError(`Failed to fetch documents (${response.status}). Please try again.`);
          }
        }
      } catch (networkError) {
        console.error('🌐 Network error fetching documents:', networkError);
        setError("Network error. Please check your connection and try again.");
      }
    } catch (authError) {
      console.error('🔒 Auth error:', authError);
      setError("Authentication error. Please try logging in again.");
    } finally {
      setLoading(false);
    }
  };

  const interviewTypes = [
    { value: 'behavioral', label: 'Behavioral' },
    { value: 'technical', label: 'Technical' },
    { value: 'system_design', label: 'System Design' },
    { value: 'case_study', label: 'Case Study' },
    { value: 'other', label: 'Other' }
  ];

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>, type: 'resume' | 'coverLetter') => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError(`Please upload a PDF file for your ${type === 'resume' ? 'resume' : 'cover letter'}.`);
        event.target.value = '';
        return;
      }
      
      if (type === 'resume') {
        setNewResumeFile(file);
        setSelectedResumeUrl("");
      } else {
        setNewCoverLetterFile(file);
        setSelectedCoverLetterUrl("");
      }
      
      setError(null);
      if (errors[type]) {
        setErrors(prev => ({ ...prev, [type]: '' }));
      }
    }
  };

  const uploadFile = async (file: File, documentType: string): Promise<string | null> => {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session?.access_token) {
        return null;
      }

      const jwtToken = sessionData.session.access_token;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", documentType);

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
      if (!backendUrl) throw new Error("Backend URL not configured.");

      const response = await fetch(`${backendUrl}/upload-document`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${jwtToken}` },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      return result.file_url || null;
    } catch (err) {
      console.error('Upload error:', err);
      return null;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Debug company URL changes
    if (field === 'companyUrl') {
      console.log('🏢 Company URL changed:', {
        field,
        newValue: value,
        valueLength: value.length,
        isEmpty: !value.trim()
      });
    }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Session title is required';
    }

    if (!formData.type) {
      newErrors.type = 'Interview type is required';
    } else if (formData.type === 'other' && !customInterviewType.trim()) {
      newErrors.type = 'Please specify the interview type';
    }

    if (resumeMethod === 'select' && !selectedResumeUrl) {
      newErrors.resume = 'Please select a resume or switch to "Upload New"';
    } else if (resumeMethod === 'upload' && !newResumeFile) {
      newErrors.resume = 'Please upload a resume file';
    }

    if (!formData.jobDescription.trim()) {
      newErrors.jobDescription = 'Job description is required';
    }

            if (!formData.companyUrl.trim()) {
          newErrors.companyUrl = 'Company URL is required';
        }

        if (formData.companyUrl && !formData.companyUrl.match(/^https?:\/\/.+\..+/)) {
          newErrors.companyUrl = 'Please enter a valid company website URL (e.g., https://company.com)';
        }

        console.log('🏢 Company URL validation:', {
          companyUrl: formData.companyUrl,
          length: formData.companyUrl.length,
          trimmed: formData.companyUrl.trim(),
          isValid: formData.companyUrl.match(/^https?:\/\/.+\..+/) !== null
        });

    if (includeCoverLetter) {
      if (coverLetterMethod === 'select' && !selectedCoverLetterUrl) {
        newErrors.coverLetter = 'Please select a cover letter or switch to "Upload New"';
      } else if (coverLetterMethod === 'upload' && !newCoverLetterFile) {
        newErrors.coverLetter = 'Please upload a cover letter file';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      let finalResumeUrl = selectedResumeUrl;
      let resumeDocumentId = undefined;
      let finalCoverLetterUrl = selectedCoverLetterUrl;
      let coverLetterDocumentId = undefined;

             // Handle resume upload/selection
       if (newResumeFile) {
         const uploadedResumeUrl = await uploadFile(newResumeFile, 'Resume');
         if (!uploadedResumeUrl) {
           setError('Failed to upload resume. Please try again.');
           return;
         }
         finalResumeUrl = uploadedResumeUrl;
       } else if (selectedResumeUrl) {
         const selectedDoc = resumeDocuments.find(doc => doc.url === selectedResumeUrl);
         if (selectedDoc) {
           resumeDocumentId = selectedDoc.id;
         }
       }

       // Handle cover letter upload/selection (only if included)
       if (includeCoverLetter) {
         if (newCoverLetterFile) {
           const uploadedCoverLetterUrl = await uploadFile(newCoverLetterFile, 'cover_letter');
           if (!uploadedCoverLetterUrl) {
             setError('Failed to upload cover letter. Please try again.');
             return;
           }
           finalCoverLetterUrl = uploadedCoverLetterUrl;
         } else if (selectedCoverLetterUrl) {
           const selectedDoc = coverLetterDocuments.find(doc => doc.url === selectedCoverLetterUrl);
           if (selectedDoc) {
             coverLetterDocumentId = selectedDoc.id;
           }
         }
       }

      const sessionDateTime = new Date();
      
      // Use custom type if "other" is selected
      const finalInterviewType = formData.type === 'other' ? customInterviewType.trim() : formData.type;

      const submitData = {
        title: formData.title,
        type: finalInterviewType,
        duration: 15,
        company: formData.companyUrl.trim(), // Ensure no extra whitespace
        company_name: formData.companyUrl.trim(), // Send both formats to be sure
        role: formData.role || undefined,
        jobDescription: formData.jobDescription,
        description: formData.description || undefined,
        date: sessionDateTime,
        resumeUrl: finalResumeUrl,
        resumeDocumentId: resumeDocumentId,
        coverLetterUrl: includeCoverLetter ? finalCoverLetterUrl : undefined,
        coverLetterDocumentId: includeCoverLetter ? coverLetterDocumentId : undefined
      };

      console.log('🚀 Submitting session data:', {
        ...submitData,
        companyUrlFromForm: formData.companyUrl,
        companyFieldSent: submitData.company,
        companyFieldLength: submitData.company?.length || 0,
        isCompanyEmpty: !submitData.company || submitData.company.trim() === '',
        date: submitData.date?.toISOString()
      });

      onSubmit(submitData);

      // Reset form
      setFormData({
        title: '',
        type: '',
        companyUrl: '',
        role: '',
        jobDescription: '',
        description: ''
      });
      setErrors({});
      setSelectedResumeUrl('');
      setSelectedCoverLetterUrl('');
      setNewResumeFile(null);
      setNewCoverLetterFile(null);
      setIncludeCoverLetter(false);
      setResumeMethod('select');
      setCoverLetterMethod('select');
      setCustomInterviewType('');
      setError(null);
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      type: '',
      companyUrl: '',
      role: '',
      jobDescription: '',
      description: ''
    });
    setErrors({});
    setSelectedResumeUrl('');
    setSelectedCoverLetterUrl('');
    setNewResumeFile(null);
    setNewCoverLetterFile(null);
    setIncludeCoverLetter(false);
    setResumeMethod('select');
    setCoverLetterMethod('select');
    setCustomInterviewType('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="text-green-600" size={20} />
            Create New Interview Session
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Session Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Senior Software Engineer Practice"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={errors.title ? 'border-red-300' : ''}
              />
              {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                placeholder="e.g., Senior Software Engineer"
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
              />
            </div>
          </div>

          {/* Interview Type */}
          <div className="space-y-2">
            <Label>Interview Type *</Label>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {interviewTypes.map((type) => (
                <Card
                  key={type.value}
                  className={`cursor-pointer transition-all ${
                    formData.type === type.value
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                  onClick={() => {
                    handleInputChange('type', type.value);
                    if (type.value !== 'other') {
                      setCustomInterviewType('');
                    }
                  }}
                >
                  <CardContent className="p-3 text-center">
                    <h4 className="font-medium text-sm">{type.label}</h4>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Custom Interview Type Input */}
            {formData.type === 'other' && (
              <div className="mt-3">
                <Input
                  placeholder="e.g., Product Manager, Sales, HR, Panel Interview"
                  value={customInterviewType}
                  onChange={(e) => {
                    setCustomInterviewType(e.target.value);
                    if (errors.type) {
                      setErrors(prev => ({ ...prev, type: '' }));
                    }
                  }}
                  className={errors.type ? 'border-red-300' : ''}
                />
              </div>
            )}
            
            {errors.type && <p className="text-sm text-red-600">{errors.type}</p>}
          </div>

          {/* Company URL */}
          <div className="space-y-2">
            <Label htmlFor="companyUrl" className="flex items-center gap-1">
              <Link size={14} />
              Company URL *
            </Label>
            <Input
              id="companyUrl"
              placeholder="https://company.com/"
              value={formData.companyUrl}
              onChange={(e) => handleInputChange('companyUrl', e.target.value)}
              className={errors.companyUrl ? 'border-red-300' : ''}
            />
            {errors.companyUrl && <p className="text-sm text-red-600">{errors.companyUrl}</p>}
          </div>

          {/* Resume */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Resume *</Label>
            
            <RadioGroup 
              value={resumeMethod}
              onValueChange={(value: 'select' | 'upload') => {
                setResumeMethod(value);
                setError(null);
                if (value === 'select') setNewResumeFile(null);
              }}
              className="flex items-center gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="select" id="selectResume" disabled={loading} />
                <Label htmlFor="selectResume">Select Existing</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="upload" id="uploadResume" />
                <Label htmlFor="uploadResume">Upload New</Label>
              </div>
            </RadioGroup>

            {resumeMethod === 'select' && (
              loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Loading documents...</span>
                </div>
              ) : resumeDocuments.length > 0 ? (
                <div className="space-y-2">
                  <Select 
                    value={selectedResumeUrl}
                    onValueChange={(value) => {
                      setSelectedResumeUrl(value);
                      setNewResumeFile(null);
                      if (errors.resume) {
                        setErrors(prev => ({ ...prev, resume: '' }));
                      }
                    }}
                  >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a resume..." />
                  </SelectTrigger>
                  <SelectContent>
                    {resumeDocuments.map(doc => (
                      <SelectItem key={doc.id} value={doc.url || ""}>
                        <div className="flex items-center">
                          <FileText size={16} className="mr-2 text-gray-600"/> 
                          <div className="flex flex-col">
                            <span>{doc.title}</span>
                            {doc.subtitle && (
                              <span className="text-xs text-amber-600">{doc.subtitle}</span>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {resumeDocuments.some(doc => doc.subtitle) && (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                    ℹ️ Some documents were auto-detected as resumes based on filename. Consider updating document types in the Documents section for better organization.
                  </p>
                )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">
                    {error && error.includes('📋') ? 
                      error :
                      error ? 
                        "Failed to load documents. Please try refreshing or contact support." : 
                        "No resume documents found. Please switch to \"Upload New\" or upload documents first."
                    }
                  </p>
                  {!error || !error.includes('📋') ? (
                    <p className="text-xs text-gray-400">💡 Tip: Upload documents in <strong>Documents</strong> section first, then return here to select them.</p>
                  ) : (
                    <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                      <p>🔍 <strong>Possible Issue:</strong> You have documents that might be resumes but are categorized as other types.</p>
                      <p className="mt-1">✅ <strong>Solution:</strong> Go to <strong>Documents</strong> section and check if any files should be re-categorized as "Resume" or "CV".</p>
                    </div>
                  )}
                  {error && (
                    <button 
                      onClick={fetchDocuments}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      🔄 Retry loading documents
                    </button>
                  )}
                </div>
              )
            )}

            {resumeMethod === 'upload' && (
              <div className="space-y-2">
                <Input 
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(e, 'resume')}
                  className="w-full"
                />
                {newResumeFile && (
                  <p className="text-xs text-gray-600">Selected: {newResumeFile.name}</p>
                )}
              </div>
            )}

            {errors.resume && <p className="text-sm text-red-600">{errors.resume}</p>}
          </div>

          {/* Cover Letter */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="includeCoverLetter"
                checked={includeCoverLetter}
                onChange={(e) => {
                  setIncludeCoverLetter(e.target.checked);
                  if (errors.coverLetter) {
                    setErrors(prev => ({ ...prev, coverLetter: '' }));
                  }
                }}
                className="rounded"
              />
              <Label htmlFor="includeCoverLetter" className="text-base font-semibold">
                Include Cover Letter
              </Label>
            </div>

            {includeCoverLetter && (
              <>
                <RadioGroup 
                  value={coverLetterMethod}
                  onValueChange={(value: 'select' | 'upload') => {
                    setCoverLetterMethod(value);
                    if (value === 'select') setNewCoverLetterFile(null);
                    if (errors.coverLetter) {
                      setErrors(prev => ({ ...prev, coverLetter: '' }));
                    }
                  }}
                  className="flex items-center gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="select" id="selectCoverLetter" disabled={loading} />
                    <Label htmlFor="selectCoverLetter">Select Existing</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="upload" id="uploadCoverLetter" />
                    <Label htmlFor="uploadCoverLetter">Upload New</Label>
                  </div>
                </RadioGroup>

                {coverLetterMethod === 'select' && (
                  loading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                      <span className="ml-2 text-sm text-gray-600">Loading documents...</span>
                    </div>
                  ) : coverLetterDocuments.length > 0 ? (
                    <Select 
                      value={selectedCoverLetterUrl}
                      onValueChange={(value) => {
                        setSelectedCoverLetterUrl(value);
                        setNewCoverLetterFile(null);
                        if (errors.coverLetter) {
                          setErrors(prev => ({ ...prev, coverLetter: '' }));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a cover letter..." />
                      </SelectTrigger>
                      <SelectContent>
                        {coverLetterDocuments.map(doc => (
                          <SelectItem key={doc.id} value={doc.url || ""}>
                            <div className="flex items-center">
                              <FileText size={16} className="mr-2 text-gray-600"/> 
                              {doc.title}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">
                        {error ? 
                          "Failed to load documents. Please try refreshing or contact support." : 
                          "No cover letter documents found. Please switch to \"Upload New\" or upload documents first."
                        }
                      </p>
                      <p className="text-xs text-gray-400">💡 Tip: Upload documents in <strong>Documents</strong> section first, then return here to select them.</p>
                      {error && (
                        <button 
                          onClick={fetchDocuments}
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          🔄 Retry loading documents
                        </button>
                      )}
                    </div>
                  )
                )}

                {coverLetterMethod === 'upload' && (
                  <div className="space-y-2">
                    <Input 
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, 'coverLetter')}
                      className="w-full"
                    />
                    {newCoverLetterFile && (
                      <p className="text-xs text-gray-600">Selected: {newCoverLetterFile.name}</p>
                    )}
                  </div>
                )}
              </>
            )}

            {errors.coverLetter && <p className="text-sm text-red-600">{errors.coverLetter}</p>}
          </div>

          {/* Job Description */}
          <div className="space-y-2">
            <Label htmlFor="jobDescription">Job Description *</Label>
            <Textarea
              id="jobDescription"
              placeholder="Paste the job description you're preparing for..."
              value={formData.jobDescription}
              onChange={(e) => handleInputChange('jobDescription', e.target.value)}
              rows={6}
              className={errors.jobDescription ? 'border-red-300' : ''}
            />
            {errors.jobDescription && <p className="text-sm text-red-600">{errors.jobDescription}</p>}
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="description">Additional Notes (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Any specific topics or focus areas for this session..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>


          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isLoading || loading}>
            Cancel
          </Button>
          {(userLimits?.plan_id === 1) ? (
            <Button 
              onClick={() => window.location.href = '/dashboard/settings/subscription'}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Star className="mr-2 h-4 w-4" />
              Upgrade to Pro
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={
                isLoading || 
                loading || 
                (
                  !userLimits?.can_create_session && 
                  !userLimits?.is_unlimited_sessions && 
                  !(userLimits?.plan_id && userLimits.plan_id >= 2) // Premium users (plan_id 2+) can create sessions
                )
              }
              className="bg-green-600 hover:bg-green-700 text-white"
              title={
                (!userLimits?.can_create_session && !userLimits?.is_unlimited_sessions && !(userLimits?.plan_id && userLimits.plan_id >= 2))
                  ? `Session limit reached (${userLimits?.sessions_used}/${userLimits?.session_limit})`
                  : isLoading || loading 
                    ? 'Loading...' 
                    : 'Create new interview session'
              }
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Session'
              )}
            </Button>
          )}
          
          {/* Debug Info (remove in production) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="absolute bottom-0 left-0 text-xs text-gray-500 bg-gray-100 p-2 rounded max-w-md">
              Debug: isLoading={String(isLoading)}, loading={String(loading)}, 
              can_create={String(userLimits?.can_create_session)}, 
              is_unlimited={String(userLimits?.is_unlimited_sessions)},
              plan_id={userLimits?.plan_id}, plan_name={userLimits?.plan_name}, 
              sessions={userLimits?.sessions_used}/{userLimits?.session_limit},
              isFree={String(userLimits?.plan_id === 1 || userLimits?.plan_name === 'Free')},
              premiumOverride={String(userLimits?.plan_id && userLimits.plan_id >= 2)}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewSessionModal; 