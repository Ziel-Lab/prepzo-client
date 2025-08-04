"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useRef } from "react";
import { useAuth } from '@/hooks/use-auth';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
  Globe,
  Trophy,
  Plus,
  PlusCircle,
  Calendar,
  X,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';

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
  achievements?: Array<{
    title: string;
    description: string;
    date: string;
  }>;

  // Projects section extracted from LinkedIn PDF
  projects?: Array<{
    name: string;
    role: string;
    description: string;
    impact?: string;
    timeline: string;
    technologies: string[];
    links: {
      demo: string;
      repo: string;
    };
  }>;

  // Optional resume URL if backend generates one
  resume_url?: string;

  // Optional avatar/profile picture URL
  avatar_url?: string;
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
  // Access the current Supabase session for the Bearer token
  const { session } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<LinkedInExtractedData | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'processing' | 'preview' | 'complete'>('upload');
  const [showCertDialog, setShowCertDialog] = useState(false);
  const [newCertificate, setNewCertificate] = useState({
    name: '',
    issuer: '',
    issueDate: '',
    expiryDate: '',
    credentialId: ''
  });
  
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

    // Remote endpoints
    const REMOTE_UPLOAD_ENDPOINT = `${process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL}/profile/upload-linkedin-pdf`;
    const REMOTE_PROFILE_ENDPOINT = `${process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL}/profile`;

    try {
      // Ensure we have an auth token to forward
      if (!session?.access_token) {
        throw new Error('You must be logged in to import LinkedIn data.');
      }

      const formData = new FormData();
      formData.append('file', selectedFile);

      // Modified progress simulation with slower initial progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          // Initial phase (0-30%): Fast
          if (prev < 30) {
            return prev + 5;
          }
          // Middle phase (30-60%): Slower
          else if (prev < 60) {
            return prev + 2;
          }
          // Final phase (60-85%): Very slow
          else if (prev < 85) {
            return prev + 0.5;
          }
          // Stop at 85% and wait for actual response
          return 85;
        });
      }, 200); // Reduced interval frequency for smoother animation

      // 1. Upload PDF to remote backend
      const uploadRes = await fetch(REMOTE_UPLOAD_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!uploadRes.ok) {
        clearInterval(progressInterval);
        const errJson = await uploadRes.json();
        throw new Error(errJson.error || 'Failed to upload PDF to extraction service');
      }

      // 2. Poll for processed profile data
      const MAX_ATTEMPTS = 10;
      const DELAY_MS = 1500;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let extracted: any = null;

      // Wait 20 seconds before the first attempt to give the backend some processing time
      await new Promise(res => setTimeout(res, 20000));

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        // eslint-disable-next-line no-await-in-loop
        const profRes = await fetch(REMOTE_PROFILE_ENDPOINT, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            Accept: 'application/json',
          },
        });

        if (profRes.ok) {
          // eslint-disable-next-line no-await-in-loop
          const profJson = await profRes.json() as any;
          const rawProfile = profJson?.db_result || profJson?.profile_data || null;

          if (rawProfile) {
            extracted = rawProfile;
            break;
          }
        }

        // eslint-disable-next-line no-await-in-loop
        await new Promise(res => setTimeout(res, DELAY_MS));
      }

      clearInterval(progressInterval);
      
      // Add a small delay before showing 100% to make the transition smoother
      setTimeout(() => {
        setUploadProgress(100);
      }, 300);

      // Normalisation (mirrors previous API route logic)
      const normaliseData = (raw: any): LinkedInExtractedData => {
        const {
          name,
          title,
          bio,
          location,
          email,
          phone,
          linkedin_url,
          linkedin,
          website,
          skills,
          experience,
          education,
          certifications,
          achievements,
          projects,
          resume_url,
          avatar_url,
        } = raw;

        return {
          name,
          title,
          bio,
          location,
          email,
          phone,
          linkedin: linkedin_url || linkedin || '',
          website,
          skills: Array.isArray(skills) ? skills : [],
          experience: Array.isArray(experience) ? experience : [],
          education: Array.isArray(education) ? education : [],
          certificates: Array.isArray(certifications) ? certifications : [],
          achievements: Array.isArray(achievements) ? achievements : [],
          projects: Array.isArray(projects) ? projects : [],
          resume_url,
          avatar_url,
        };
      };

      if (extracted) {
        const normalised = normaliseData(extracted);
        setExtractedData(normalised);
        setCurrentStep('preview');

        toast({
          title: 'LinkedIn Data Extracted!',
          description: 'Review the extracted data before applying to your profile.',
        });
      } else {
        // Timed out – allow manual input
        setExtractedData({} as LinkedInExtractedData);
        setCurrentStep('preview');

        toast({
          title: 'PDF Processing Delayed',
          description: 'Extraction is still in progress. You can fill the info manually for now.',
          variant: 'destructive',
        });
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

  const handleAddCertificate = () => {
    if (!extractedData) return;
    
    const updatedData = {
      ...extractedData,
      certificates: [
        ...(extractedData.certificates || []),
        newCertificate
      ]
    };
    
    setExtractedData(updatedData);
    setNewCertificate({
      name: '',
      issuer: '',
      issueDate: '',
      expiryDate: '',
      credentialId: ''
    });
    setShowCertDialog(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
        <CardHeader className="border-b bg-gradient-to-r from-prepzo-50 to-prepzo-100/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Linkedin className="w-6 h-6 text-white" />
              </div> */}
              <div>
                <CardTitle className="text-xl text-prepzo-900">Import from LinkedIn/Resume</CardTitle>
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
          <div className="flex items-center justify-center mb-6 sm:mb-8 overflow-x-auto px-2 sm:px-4">
            <div className="flex items-center gap-1.5 sm:gap-3 min-w-max">
              {['Upload', 'Process', 'Preview', 'Complete'].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={`w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs md:text-sm font-medium ${
                    index <= ['upload', 'processing', 'preview', 'complete'].indexOf(currentStep)
                      ? 'bg-prepzo-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  {index < 3 && (
                    <div className={`w-6 sm:w-12 md:w-16 h-0.5 sm:h-1 mx-1 sm:mx-2 ${
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
              {/* Add LinkedIn Optimizer suggestion */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-900 mb-1">
                      Want to improve your LinkedIn profile first?
                    </h4>
                    <p className="text-xs text-blue-700 mb-3">
                      Use our LinkedIn Optimizer tool to enhance your profile before importing.
                    </p>
                    <Link 
                      href="/dashboard/tools/linkedin-optimizer"
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 transition-colors"
                    >
                      Optimize my LinkedIn Profile
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-prepzo-900 mb-2">
                  Upload Your Resume or LinkedIn PDF Export
                </h3>
                <p className="text-prepzo-600 mb-6">
                  Export your LinkedIn profile as PDF and upload it here to automatically populate your profile
                  <br/>
                  <span className="underline text-sm text-prepzo-600"><Link href="https://www.youtube.com/watch?v=HJMeP06Esg8" target="_blank">How to export your LinkedIn profile as a PDF?</Link></span>
                </p>
                
              </div>

              <div className="border-2 border-dashed border-prepzo-300 rounded-lg p-4 sm:p-8 text-center hover:border-prepzo-400 transition-colors">
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <h4 className="font-medium text-blue-900 mb-2">How to prepare your files:</h4>
                <div className="space-y-3">
                  <div>
                    {/* <h5 className="text-sm font-medium text-blue-800 mb-1">LinkedIn Export:</h5>
                    <ol className="text-xs sm:text-sm text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Go to your LinkedIn profile page</li>
                      <li>Click "More" button near your profile picture</li>
                      <li>Select "Save to PDF" option</li>
                      <li>Download the generated PDF</li>
                    </ol> */}
                  </div>
                  <div>
                    {/* <h5 className="text-sm font-medium text-blue-800 mb-1">Resume Upload:</h5> */}
                    <ul className="text-xs sm:text-sm text-blue-800 space-y-1 list-disc list-inside">
                      <li>Ensure your resume is in PDF format</li>
                      <li>File size should be under 10MB</li>
                      <li>Make sure text is selectable (not scanned)</li>
                    </ul>
                  </div>
                </div>
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 max-h-[60vh] overflow-y-auto px-2">
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

                {/* Certificates */}
                {extractedData.certificates && extractedData.certificates.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Award className="w-4 h-4" />
                        Certificates ({extractedData.certificates.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {extractedData.certificates.slice(0, 2).map((cert, index) => (
                          <div key={index} className="border-l-2 border-prepzo-200 pl-3">
                            <p className="font-medium text-sm">{cert.name}</p>
                            <p className="text-xs text-gray-600">{cert.issuer}</p>
                            <p className="text-xs text-gray-500">{cert.issueDate}</p>
                          </div>
                        ))}
                        {extractedData.certificates.length > 2 && (
                          <p className="text-xs text-gray-500">
                            +{extractedData.certificates.length - 2} more...
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Achievements */}
                {extractedData.achievements && extractedData.achievements.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Trophy className="w-4 h-4" />
                        Achievements ({extractedData.achievements.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {extractedData.achievements.slice(0, 2).map((achievement, index) => (
                          <div key={index} className="border-l-2 border-prepzo-200 pl-3">
                            <p className="font-medium text-sm">{achievement.title}</p>
                            <p className="text-xs text-gray-600">{achievement.description}</p>
                            <p className="text-xs text-gray-500">{achievement.date}</p>
                          </div>
                        ))}
                        {extractedData.achievements.length > 2 && (
                          <p className="text-xs text-gray-500">
                            +{extractedData.achievements.length - 2} more...
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Add Certificate Dialog */}
                <Dialog open={showCertDialog} onOpenChange={setShowCertDialog}>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-prepzo-600" />
                        Add New Certificate
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="cert-name">Certificate Name *</Label>
                        <Input
                          id="cert-name"
                          value={newCertificate.name}
                          onChange={(e) => setNewCertificate({...newCertificate, name: e.target.value})}
                          placeholder="e.g. AWS Solutions Architect"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="cert-issuer">Issuing Organization *</Label>
                        <Input
                          id="cert-issuer"
                          value={newCertificate.issuer}
                          onChange={(e) => setNewCertificate({...newCertificate, issuer: e.target.value})}
                          placeholder="e.g. Amazon Web Services"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="cert-date">Issue Date *</Label>
                        <Input
                          id="cert-date"
                          type="date"
                          value={newCertificate.issueDate}
                          onChange={(e) => setNewCertificate({...newCertificate, issueDate: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="cert-expiry">Expiry Date (Optional)</Label>
                        <Input
                          id="cert-expiry"
                          type="date"
                          value={newCertificate.expiryDate}
                          onChange={(e) => setNewCertificate({...newCertificate, expiryDate: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="cert-id">Credential ID (Optional)</Label>
                        <Input
                          id="cert-id"
                          value={newCertificate.credentialId}
                          onChange={(e) => setNewCertificate({...newCertificate, credentialId: e.target.value})}
                          placeholder="e.g. ABC123XYZ"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowCertDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddCertificate}
                        disabled={!newCertificate.name || !newCertificate.issuer || !newCertificate.issueDate}
                        className="bg-prepzo-600 hover:bg-prepzo-700"
                      >
                        Add Certificate
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Empty State Cards for Missing Sections */}
                {(!extractedData.certificates || extractedData.certificates.length === 0) && (
                  <Card className="border-2 border-dashed border-prepzo-300 bg-prepzo-50/50 hover:bg-prepzo-50 transition-colors">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-base">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-prepzo-600" />
                          <span>Certificates</span>
                        </div>
                        <PlusCircle className="w-5 h-5 text-prepzo-600" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-4">
                        <p className="text-sm text-prepzo-600 mb-2">No certificates found in your LinkedIn PDF</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-xs"
                          onClick={() => setShowCertDialog(true)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Manually
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {(!extractedData.achievements || extractedData.achievements.length === 0) && (
                  <Card className="border-2 border-dashed border-prepzo-300 bg-prepzo-50/50 hover:bg-prepzo-50 transition-colors">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-base">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-prepzo-600" />
                          <span>Achievements</span>
                        </div>
                        <PlusCircle className="w-5 h-5 text-prepzo-600" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-4">
                        <p className="text-sm text-prepzo-600 mb-2">No achievements found in your LinkedIn PDF</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            // Apply empty data first, then switch to edit mode
                            handleApplyData();
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Manually
                        </Button>
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