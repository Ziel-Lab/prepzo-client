"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Linkedin,
  User,
  Briefcase,
  GraduationCap,
  Award,
  Globe
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LinkedInExtractedData {
  name?: string;
  title?: string;
  bio?: string;
  location?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  website?: string;
  skills?: Array<{
    name: string;
    level: number;
    category: string;
  }>;
  experience?: Array<{
    company: string;
    role: string;
    duration: string;
    description: string;
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    year: string;
    description: string;
  }>;
  certificates?: Array<{
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate?: string;
    credentialId?: string;
  }>;
}

interface LinkedInUploadProps {
  onDataExtracted: (data: LinkedInExtractedData) => void;
  isOpen: boolean;
  onClose: () => void;
}

const LinkedInUpload: React.FC<LinkedInUploadProps> = ({ 
  onDataExtracted, 
  isOpen, 
  onClose 
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<LinkedInExtractedData | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'processing' | 'preview' | 'complete'>('upload');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file exported from LinkedIn.');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size should be less than 10MB.');
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a LinkedIn PDF file first.');
      return;
    }

    setIsUploading(true);
    setCurrentStep('processing');
    setUploadProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('linkedin_pdf', selectedFile);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      const response = await fetch('/api/linkedin-pdf-extract', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract data from LinkedIn PDF');
      }

      const result = await response.json();
      
      if (result.data) {
        setExtractedData(result.data);
        setCurrentStep('preview');
        
        if (result.success) {
          toast({
            title: "LinkedIn Data Extracted!",
            description: "Review the extracted data before applying to your profile.",
          });
        } else {
          // PDF extraction failed but we have empty structure for manual input
          toast({
            title: "PDF Processing Failed",
            description: result.note || "Could not extract data from PDF. You can fill in the information manually.",
            variant: "destructive",
          });
        }
      } else {
        throw new Error('No data structure returned from the server');
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to extract data');
      setCurrentStep('upload');
      setUploadProgress(0);
      
      toast({
        title: "Extraction Failed",
        description: "Could not extract data from the LinkedIn PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyData = () => {
    if (extractedData) {
      onDataExtracted(extractedData);
      setCurrentStep('complete');
      
      toast({
        title: "Profile Updated!",
        description: "LinkedIn data has been applied to your profile successfully.",
      });

      // Close after a short delay
      setTimeout(() => {
        handleReset();
        onClose();
      }, 2000);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setExtractedData(null);
    setError(null);
    setUploadProgress(0);
    setCurrentStep('upload');
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b bg-gradient-to-r from-prepzo-50 to-prepzo-100/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Linkedin className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-prepzo-900">Import from LinkedIn</CardTitle>
                <p className="text-sm text-prepzo-600">Extract your profile data from LinkedIn PDF export</p>
              </div>
            </div>
            <Button variant="ghost" onClick={handleClose} className="text-prepzo-600">
              ×
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              {['Upload', 'Process', 'Preview', 'Complete'].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= ['upload', 'processing', 'preview', 'complete'].indexOf(currentStep)
                      ? 'bg-prepzo-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  {index < 3 && (
                    <div className={`w-16 h-1 mx-2 ${
                      index < ['upload', 'processing', 'preview', 'complete'].indexOf(currentStep)
                        ? 'bg-prepzo-600'
                        : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Upload Step */}
          {currentStep === 'upload' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-prepzo-900 mb-2">
                  Upload Your LinkedIn PDF Export
                </h3>
                <p className="text-prepzo-600 mb-6">
                  Export your LinkedIn profile as PDF and upload it here to automatically populate your profile
                </p>
              </div>

              <div className="border-2 border-dashed border-prepzo-300 rounded-lg p-8 text-center hover:border-prepzo-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="mb-4"
                  disabled={isUploading}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Choose LinkedIn PDF
                </Button>
                {selectedFile && (
                  <div className="mt-4 p-3 bg-prepzo-50 rounded-lg">
                    <p className="text-sm font-medium text-prepzo-900">{selectedFile.name}</p>
                    <p className="text-xs text-prepzo-600">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpload} 
                  disabled={!selectedFile || isUploading}
                  className="bg-prepzo-600 hover:bg-prepzo-700"
                >
                  Extract Data
                </Button>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">How to export from LinkedIn:</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Go to your LinkedIn profile page</li>
                  <li>Click "More" button near your profile picture</li>
                  <li>Select "Save to PDF" option</li>
                  <li>Download the generated PDF</li>
                  <li>Upload it here to extract your data</li>
                </ol>
              </div>
            </div>
          )}

          {/* Processing Step */}
          {currentStep === 'processing' && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-prepzo-900 mb-2">
                  Extracting Your LinkedIn Data
                </h3>
                <p className="text-prepzo-600 mb-4">
                  Our AI is reading your LinkedIn PDF and extracting profile information...
                </p>
                <Progress value={uploadProgress} className="w-full max-w-md mx-auto" />
                <p className="text-sm text-prepzo-500 mt-2">{uploadProgress}% complete</p>
              </div>
            </div>
          )}

          {/* Preview Step */}
          {currentStep === 'preview' && extractedData && (
            <div className="space-y-6">
              <div className="text-center">
                {/* Check if any meaningful data was extracted */}
                {extractedData.name || extractedData.title || extractedData.email || 
                 (extractedData.skills && extractedData.skills.length > 0) ||
                 (extractedData.experience && extractedData.experience.length > 0) ? (
                  <>
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-prepzo-900 mb-2">
                      Data Extracted Successfully!
                    </h3>
                    <p className="text-prepzo-600">
                      Review the extracted information below and apply it to your profile
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-8 h-8 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-prepzo-900 mb-2">
                      Ready for Manual Input
                    </h3>
                    <p className="text-prepzo-600">
                      PDF extraction was not successful. You can now fill in your information manually in the profile editor.
                    </p>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-96 overflow-y-auto">
                {/* Basic Info */}
                {(extractedData.name || extractedData.title || extractedData.location) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <User className="w-4 h-4" />
                        Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {extractedData.name && (
                        <div>
                          <p className="text-xs text-gray-500">Name</p>
                          <p className="font-medium">{extractedData.name}</p>
                        </div>
                      )}
                      {extractedData.title && (
                        <div>
                          <p className="text-xs text-gray-500">Title</p>
                          <p className="font-medium">{extractedData.title}</p>
                        </div>
                      )}
                      {extractedData.location && (
                        <div>
                          <p className="text-xs text-gray-500">Location</p>
                          <p className="font-medium">{extractedData.location}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Experience */}
                {extractedData.experience && extractedData.experience.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Briefcase className="w-4 h-4" />
                        Experience ({extractedData.experience.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {extractedData.experience.slice(0, 3).map((exp, index) => (
                          <div key={index} className="border-l-2 border-prepzo-200 pl-3">
                            <p className="font-medium text-sm">{exp.role}</p>
                            <p className="text-xs text-gray-600">{exp.company}</p>
                            <p className="text-xs text-gray-500">{exp.duration}</p>
                          </div>
                        ))}
                        {extractedData.experience.length > 3 && (
                          <p className="text-xs text-gray-500">
                            +{extractedData.experience.length - 3} more...
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Education */}
                {extractedData.education && extractedData.education.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <GraduationCap className="w-4 h-4" />
                        Education ({extractedData.education.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {extractedData.education.slice(0, 2).map((edu, index) => (
                          <div key={index} className="border-l-2 border-prepzo-200 pl-3">
                            <p className="font-medium text-sm">{edu.degree}</p>
                            <p className="text-xs text-gray-600">{edu.institution}</p>
                            <p className="text-xs text-gray-500">{edu.year}</p>
                          </div>
                        ))}
                        {extractedData.education.length > 2 && (
                          <p className="text-xs text-gray-500">
                            +{extractedData.education.length - 2} more...
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Skills */}
                {extractedData.skills && extractedData.skills.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Award className="w-4 h-4" />
                        Skills ({extractedData.skills.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {extractedData.skills.slice(0, 8).map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill.name}
                          </Badge>
                        ))}
                        {extractedData.skills.length > 8 && (
                          <Badge variant="outline" className="text-xs">
                            +{extractedData.skills.length - 8} more
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleReset}>
                  Try Another File
                </Button>
                <Button 
                  onClick={handleApplyData}
                  className="bg-prepzo-600 hover:bg-prepzo-700"
                >
                  Apply to Profile
                </Button>
              </div>
            </div>
          )}

          {/* Complete Step */}
          {currentStep === 'complete' && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-prepzo-900 mb-2">
                  Profile Updated Successfully!
                </h3>
                <p className="text-prepzo-600">
                  Your LinkedIn data has been applied to your profile. You can now edit and customize it further.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LinkedInUpload; 