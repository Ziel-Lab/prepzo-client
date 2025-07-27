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
      fetchDocuments();
    }
  }, [isOpen]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session?.access_token) {
        setError("Could not retrieve user session.");
        setResumeMethod('upload');
        return;
      }

      const jwtToken = sessionData.session.access_token;
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
      if (!backendUrl) {
        throw new Error("Backend URL is not configured.");
      }

      // Fetch resumes
      try {
        const resumeResponse = await fetch(`${backendUrl}/mockInterview/user-documents/resumes`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${jwtToken}`,
            "Content-Type": "application/json",
          },
        });

        if (resumeResponse.ok) {
          const resumeData = await resumeResponse.json();
          const resumes = (resumeData.resume_documents || []).map((doc: any) => ({
            id: doc.id,
            title: doc.document_name || "Untitled Resume",
            url: doc.document_url,
          }));
          setResumeDocuments(resumes);
          
          if (resumes.length === 0) {
            setResumeMethod('upload');
          }
        }
      } catch (e) {
        console.warn('Failed to fetch resumes:', e);
        setResumeMethod('upload');
      }

      // Fetch cover letters
      try {
        const coverLetterResponse = await fetch(`${backendUrl}/mockInterview/user-documents/cover-letters`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${jwtToken}`,
            "Content-Type": "application/json",
          },
        });

        if (coverLetterResponse.ok) {
          const coverLetterData = await coverLetterResponse.json();
          const coverLetters = (coverLetterData.cover_letter_documents || []).map((doc: any) => ({
            id: doc.id,
            title: doc.document_name || "Untitled Cover Letter",
            url: doc.document_url,
          }));
          setCoverLetterDocuments(coverLetters);
        }
      } catch (e) {
        console.warn('Failed to fetch cover letters:', e);
      }
    } catch (err) {
      setError("Unable to load documents.");
      setResumeMethod('upload');
    } finally {
      setLoading(false);
    }
  };

  const interviewTypes = [
    { value: 'behavioral', label: 'Behavioral' },
    { value: 'technical', label: 'Technical' },
    { value: 'system_design', label: 'System Design' },
    { value: 'case_study', label: 'Case Study' }
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
    }

    if (!selectedResumeUrl && !newResumeFile) {
      newErrors.resume = 'Please select or upload a resume';
    }

    if (!formData.jobDescription.trim()) {
      newErrors.jobDescription = 'Job description is required';
    }

    if (formData.companyUrl && !formData.companyUrl.match(/^https?:\/\/.+/)) {
      newErrors.companyUrl = 'Please enter a valid URL (starting with http:// or https://)';
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

      onSubmit({
        title: formData.title,
        type: formData.type,
        duration: 20,
        companyUrl: formData.companyUrl || undefined,
        role: formData.role || undefined,
        jobDescription: formData.jobDescription,
        description: formData.description || undefined,
        date: sessionDateTime,
        resumeUrl: finalResumeUrl,
        resumeDocumentId: resumeDocumentId,
        coverLetterUrl: includeCoverLetter ? finalCoverLetterUrl : undefined,
        coverLetterDocumentId: includeCoverLetter ? coverLetterDocumentId : undefined
      });

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
            <div className="grid grid-cols-2 gap-3">
              {interviewTypes.map((type) => (
                <Card
                  key={type.value}
                  className={`cursor-pointer transition-all ${
                    formData.type === type.value
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                  onClick={() => handleInputChange('type', type.value)}
                >
                  <CardContent className="p-3 text-center">
                    <h4 className="font-medium text-sm">{type.label}</h4>
                  </CardContent>
                </Card>
              ))}
            </div>
            {errors.type && <p className="text-sm text-red-600">{errors.type}</p>}
          </div>

          {/* Company URL */}
          <div className="space-y-2">
            <Label htmlFor="companyUrl" className="flex items-center gap-1">
              <Link size={14} />
              Company URL (Optional)
            </Label>
            <Input
              id="companyUrl"
              placeholder="https://company.com/careers/job-posting"
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
                <RadioGroupItem value="select" id="selectResume" disabled={loading || resumeDocuments.length === 0} />
                <Label htmlFor="selectResume">Select Existing</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="upload" id="uploadResume" />
                <Label htmlFor="uploadResume">Upload New</Label>
              </div>
            </RadioGroup>

            {resumeMethod === 'select' && !loading && (
              resumeDocuments.length > 0 ? (
                <Select 
                  value={selectedResumeUrl}
                  onValueChange={(value) => {
                    setSelectedResumeUrl(value);
                    setNewResumeFile(null);
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
                          {doc.title}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-gray-500">No resume documents found. Please upload one.</p>
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
                onChange={(e) => setIncludeCoverLetter(e.target.checked)}
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
                  }}
                  className="flex items-center gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="select" id="selectCoverLetter" disabled={loading || coverLetterDocuments.length === 0} />
                    <Label htmlFor="selectCoverLetter">Select Existing</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="upload" id="uploadCoverLetter" />
                    <Label htmlFor="uploadCoverLetter">Upload New</Label>
                  </div>
                </RadioGroup>

                {coverLetterMethod === 'select' && !loading && (
                  coverLetterDocuments.length > 0 ? (
                    <Select 
                      value={selectedCoverLetterUrl}
                      onValueChange={(value) => {
                        setSelectedCoverLetterUrl(value);
                        setNewCoverLetterFile(null);
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
                    <p className="text-sm text-gray-500">No cover letter documents found.</p>
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

          {/* Plan Info */}
          {userLimits && (
            <div className="p-3 bg-gray-50 border rounded-lg">
              <p className="text-sm text-gray-600">
                {userLimits.plan_name === 'Free' ? (
                  <span className="text-amber-700">Mock interviews require a Pro or Premium subscription.</span>
                ) : (
                  <span>
                    {userLimits.plan_name} Plan • Sessions: {userLimits.sessions_used}/{userLimits.session_limit || '∞'} • 20 min sessions
                  </span>
                )}
              </p>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isLoading || loading}>
            Cancel
          </Button>
          {userLimits?.plan_name === 'Free' ? (
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
              disabled={isLoading || loading || !userLimits?.can_create_session}
              className="bg-green-600 hover:bg-green-700 text-white"
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewSessionModal; 