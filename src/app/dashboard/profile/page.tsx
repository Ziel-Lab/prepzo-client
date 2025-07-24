"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Share2,
  Edit,
  Save,
  Plus,
  X,
  Copy,
  ExternalLink,
  Upload,
  Download,
  Eye,
  Trophy,
  Target,
  Zap,
  Code,
  Brain,
  Calendar,
  Star,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  BarChart3,
  PlusCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import LinkedInUpload from "@/components/dashboard/profile/LinkedInUpload";
import Link from "next/link";
import { Linkedin, Github, Globe, FileText } from "lucide-react";

interface ProfileData {
  id: string;
  username: string;
  name: string;
  title: string;
  bio: string;
  avatar: string;
  location: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  website: string;
  skills: Array<{
    name: string;
    level: number;
    category: string;
  }>;
  experience: Array<{
    company: string;
    role: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    year: string;
    description: string;
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    link?: string;
  }>;
  achievements: Array<{
    title: string;
    description: string;
    date: string;
  }>;
  certificates: Array<{
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate?: string;
    credentialId?: string;
    verificationUrl?: string;
  }>;
  practiceStats: {
    problemsSolved: {
      total: number;
      easy: number;
      medium: number;
      hard: number;
    };
    dailyStreak: {
      current: number;
      longest: number;
      lastPracticed: string;
    };
    weeklyGoal: {
      target: number;
      completed: number;
    };
    languages: Array<{
      name: string;
      problems: number;
    }>;
    topics: Array<{
      name: string;
      solved: number;
      accuracy: number;
    }>;
  };
  interviewPractice: {
    sessionsCompleted: number;
    totalHours: number;
    categories: Array<{
      name: string;
      sessionsCount: number;
      averageScore: number;
      lastSession: string;
      improvement: number;
    }>;
    recentSessions: Array<{
      date: string;
      category: string;
      score: number;
      duration: number;
    }>;
  };
  resume?: {
    url: string;
    fileName: string;
    uploadedAt: string;
  };
}

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

const Profile = () => {
  const { toast } = useToast();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { session } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showLinkedInUpload, setShowLinkedInUpload] = useState(false);
  const fetchedTokenRef = useRef<string | null>(null);

  // Dialog states for editing different sections
  const [showCertDialog, setShowCertDialog] = useState(false);
  const [showAchievementDialog, setShowAchievementDialog] = useState(false);
  const [showExperienceDialog, setShowExperienceDialog] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showSkillDialog, setShowSkillDialog] = useState(false);
  
  // Form states for different items
  const [editingCertIndex, setEditingCertIndex] = useState<number | null>(null);
  const [editingAchievementIndex, setEditingAchievementIndex] = useState<number | null>(null);
  const [editingExperienceIndex, setEditingExperienceIndex] = useState<number | null>(null);
  const [editingProjectIndex, setEditingProjectIndex] = useState<number | null>(null);
  const [editingSkillIndex, setEditingSkillIndex] = useState<number | null>(null);
  
  const [newCertificate, setNewCertificate] = useState({
    name: '',
    issuer: '',
    issueDate: '',
    expiryDate: '',
    credentialId: '',
    verificationUrl: ''
  });
  
  const [newAchievement, setNewAchievement] = useState({
    title: '',
    description: '',
    date: ''
  });
  
  const [newExperience, setNewExperience] = useState({
    company: '',
    role: '',
    duration: '',
    description: ''
  });
  
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    technologies: [] as string[],
    link: ''
  });
  
  const [newSkill, setNewSkill] = useState({
    name: '',
    level: 50,
    category: 'General'
  });

  // Empty initial profile & loading flag
  const emptyProfile: ProfileData = {
    id: '', username: '', name: '', title: '', bio: '', avatar: '', location: '', email: '', phone: '', linkedin: '', github: '', website: '',
    skills: [], experience: [], education: [], projects: [], achievements: [], certificates: [],
    practiceStats: {
      problemsSolved: { total: 0, easy: 0, medium: 0, hard: 0 },
      dailyStreak: { current: 0, longest: 0, lastPracticed: '' },
      weeklyGoal: { target: 0, completed: 0 },
      languages: [], topics: [],
    },
    interviewPractice: { sessionsCompleted: 0, totalHours: 0, categories: [], recentSessions: [] },
    resume: undefined,
  };

  const [profile, setProfile] = useState<ProfileData>(emptyProfile);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // const publicUrl = `${window.location.origin}/public/${profile.id}/${profile.username}`;

  // Helper to strip undefined values so we don't overwrite good data with undefined
  const stripUndefined = (obj: Record<string, unknown>) => {
    return Object.fromEntries(
      Object.entries(obj).filter(([, v]) => v !== undefined && v !== null),
    );
  };

  /**
   * Convert various skill formats (array of strings or objects) coming from
   * the backend / LinkedIn extractor into the uniform `ProfileData` shape.
   */
  const normaliseSkills = (rawSkills: unknown): ProfileData['skills'] => {
    if (!Array.isArray(rawSkills)) return [];

    // Array of simple strings → map to objects with defaults
    if (rawSkills.length > 0 && typeof rawSkills[0] === 'string') {
      return (rawSkills as string[]).map(name => ({
        name,
        level: 50, // default proficiency
        category: 'General',
      }));
    }

    // Array of objects – ensure each has required props
    return (rawSkills as any[]).map(s => ({
      name: s.name ?? (typeof s === 'string' ? s : 'Skill'),
      level: s.level ?? 50,
      category: s.category ?? 'General',
    }));
  };

  /**
   * Convert backend project objects (which may include `impact`, `links`, etc.)
   * into the simpler shape expected by the UI.
   */
  const normaliseProjects = (rawProjects: unknown): ProfileData['projects'] => {
    if (!Array.isArray(rawProjects)) return [];

    return (rawProjects as any[]).map(p => ({
      name: p.name ?? 'Project',
      description: p.description ?? '',
      technologies: Array.isArray(p.technologies) ? p.technologies : [],
      // Use repo link first, fall back to demo link if available
      link: p.links?.repo || p.links?.demo || undefined,
    }));
  };

  // Convert backend response shape into our local ProfileData partial
  const mapRemoteProfile = (raw: any): Partial<ProfileData> => {
    if (!raw) return {};
    const {
      id,
      user_id,
      name,
      title,
      bio,
      location,
      email,
      phone,
      linkedin_url,
      linkedin,
      github_url,
      github,
      website,
      avatar_url,
      avatar,
      skills,
      experience,
      projects,
      certifications,
      resume_url,
      updated_at,
    } = raw;

    return {
      id: id || user_id || '',
      name,
      title,
      bio,
      location,
      email,
      phone,
      linkedin: linkedin_url || linkedin || '',
      github: github_url || github || '',
      website,
      avatar: avatar_url || avatar || '',
      skills: normaliseSkills(skills),
      experience: Array.isArray(experience) ? experience : [],
      projects: normaliseProjects(projects),
      certificates: Array.isArray(certifications) ? certifications : [],
      resume: resume_url
        ? {
            url: resume_url,
            fileName: resume_url.split('/')?.pop() || 'resume.pdf',
            uploadedAt: updated_at || new Date().toISOString(),
          }
        : undefined,
    };
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.access_token) return;
      if (fetchedTokenRef.current === session.access_token) return; // already fetched for this token
      fetchedTokenRef.current = session.access_token;
      try {
        setIsProfileLoading(true);
        const response = await fetch('https://dev.prepzo.ai/profile', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          console.error('Failed to fetch profile:', response.status);
          return;
        }

        const data = await response.json();

        let rawProfile: any = data;
        if (data.profile_data) {
          rawProfile = data.profile_data;
        } else if (data.db_result) {
          rawProfile = Array.isArray(data.db_result) ? data.db_result[0] : data.db_result;
        }
        const mapped = stripUndefined(mapRemoteProfile(rawProfile));
        console.log('Remote profile raw', rawProfile);
        console.log('Mapped profile', mapped);

        setProfile(prev => ({
          ...prev, // keep defaults for sections missing in mapped
          ...mapped,
        }));

        setIsProfileLoading(false);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setIsProfileLoading(false);
      }
    };

    fetchProfile();
  }, [session]);
  const currentUser = session?.user;

  // Global loading screen while fetching profile
  if (isProfileLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen text-prepzo-600">Loading profile...</div>
      </DashboardLayout>
    );
  }

  const handleShare = async () => {
    const publicUrl = `${window.location.origin}/public/${profile.id}/${profile.username}`;
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast({
        title: "Link copied!",
        description: "Public profile link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!session?.access_token) {
      toast({
        title: "Error",
        description: "You must be logged in to save changes",
        variant: "destructive",
      });
      return;
    }

    try {
      const endpoint = 'https://dev.prepzo.ai/api/save-linkedin-profile';
      
      const payload = {
        user_id: session.user.id,
        name: profile.name,
        title: profile.title,
        bio: profile.bio,
        location: profile.location,
        email: profile.email,
        phone: profile.phone,
        linkedin_url: profile.linkedin,
        website: profile.website,
        skills: profile.skills,
        achievements: profile.achievements,
        certifications: profile.certificates,
        experience: profile.experience,
        projects: profile.projects,
        resume_url: profile.resume?.url
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setIsEditing(false);
        toast({
          title: "Profile updated!",
          description: "Your changes have been saved successfully",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save profile');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({
        title: "Error",
        description: `Failed to save changes: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const handleLinkedInDataExtracted = (linkedInData: LinkedInExtractedData) => {
    const userName = currentUser?.user_metadata?.full_name || currentUser?.user_metadata?.name || currentUser?.email?.split('@')[0] || '';

    setProfile(prevProfile => ({
      ...prevProfile,
      // Always use the name from Supabase Auth
      name: userName,
      // Use API data for everything else, but skip name
      ...(linkedInData.title && { title: linkedInData.title }),
      ...(linkedInData.bio && { bio: linkedInData.bio }),
      ...(linkedInData.location && { location: linkedInData.location }),
      ...(linkedInData.email && { email: linkedInData.email }),
      ...(linkedInData.phone && { phone: linkedInData.phone }),
      ...(linkedInData.linkedin && { linkedin: linkedInData.linkedin }),
      ...(linkedInData.website && { website: linkedInData.website }),
      ...(linkedInData.skills && linkedInData.skills.length > 0 && { skills: normaliseSkills(linkedInData.skills) }),
      ...(linkedInData.experience && linkedInData.experience.length > 0 && { experience: linkedInData.experience }),
      ...(linkedInData.education && linkedInData.education.length > 0 && { education: linkedInData.education }),
      ...(linkedInData.certificates && linkedInData.certificates.length > 0 && { certificates: linkedInData.certificates }),
    }));

    setIsEditing(true);
    toast({
      title: "LinkedIn Data Imported!",
      description: "Your profile has been updated with LinkedIn data. Review and save when ready.",
      duration: 5000,
    });
  };

  // Handler for adding/editing certificates
  const handleSaveCertificate = () => {
    const updatedCerts = [...profile.certificates];
    if (editingCertIndex !== null) {
      updatedCerts[editingCertIndex] = newCertificate;
    } else {
      updatedCerts.push(newCertificate);
    }
    
    setProfile({ ...profile, certificates: updatedCerts });
    resetCertificateForm();
  };
  
  const resetCertificateForm = () => {
    setNewCertificate({
      name: '',
      issuer: '',
      issueDate: '',
      expiryDate: '',
      credentialId: '',
      verificationUrl: ''
    });
    setEditingCertIndex(null);
    setShowCertDialog(false);
  };
  
  const handleEditCertificate = (index: number) => {
    const cert = profile.certificates[index];
    setNewCertificate({
      name: cert.name,
      issuer: cert.issuer,
      issueDate: cert.issueDate,
      expiryDate: cert.expiryDate || '',
      credentialId: cert.credentialId || '',
      verificationUrl: cert.verificationUrl || ''
    });
    setEditingCertIndex(index);
    setShowCertDialog(true);
  };
  
  const handleDeleteCertificate = (index: number) => {
    const updatedCerts = profile.certificates.filter((_, i) => i !== index);
    setProfile({ ...profile, certificates: updatedCerts });
  };
  
  // Handler for adding/editing achievements
  const handleSaveAchievement = () => {
    const updatedAchievements = [...profile.achievements];
    if (editingAchievementIndex !== null) {
      updatedAchievements[editingAchievementIndex] = newAchievement;
    } else {
      updatedAchievements.push(newAchievement);
    }
    
    setProfile({ ...profile, achievements: updatedAchievements });
    resetAchievementForm();
  };
  
  const resetAchievementForm = () => {
    setNewAchievement({
      title: '',
      description: '',
      date: ''
    });
    setEditingAchievementIndex(null);
    setShowAchievementDialog(false);
  };
  
  const handleEditAchievement = (index: number) => {
    const achievement = profile.achievements[index];
    setNewAchievement({
      title: achievement.title,
      description: achievement.description,
      date: achievement.date
    });
    setEditingAchievementIndex(index);
    setShowAchievementDialog(true);
  };
  
  const handleDeleteAchievement = (index: number) => {
    const updatedAchievements = profile.achievements.filter((_, i) => i !== index);
    setProfile({ ...profile, achievements: updatedAchievements });
  };
  
  // Similar handlers for Experience, Projects, Skills...
  const handleSaveExperience = () => {
    const updatedExp = [...profile.experience];
    if (editingExperienceIndex !== null) {
      updatedExp[editingExperienceIndex] = newExperience;
    } else {
      updatedExp.push(newExperience);
    }
    
    setProfile({ ...profile, experience: updatedExp });
    resetExperienceForm();
  };
  
  const resetExperienceForm = () => {
    setNewExperience({
      company: '',
      role: '',
      duration: '',
      description: ''
    });
    setEditingExperienceIndex(null);
    setShowExperienceDialog(false);
  };

  // ... existing code ...

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-prepzo-50 via-white to-prepzo-100/30">
        <div className="container mx-auto px-4 py-4 sm:py-8 max-w-6xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 sm:justify-between sm:items-center mb-8 sm:mb-12">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-prepzo-800 to-prepzo-600 bg-clip-text text-transparent mb-2">
                My Profile
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">Manage your professional profile and share it with the world</p>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowLinkedInUpload(true)}
                className="group border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 text-xs sm:text-sm"
                size="sm"
              >
                <span className="hidden sm:inline">Import from</span>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span className="hidden sm:inline">LinkedIn</span>
                <span className="sm:hidden">LI</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={handleShare}
                className="group border-prepzo-300 text-prepzo-700 hover:bg-prepzo-50 hover:border-prepzo-400 transition-all duration-200 text-xs sm:text-sm"
                size="sm"
              >
                <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Share Profile</span>
                <span className="sm:hidden">Share</span>
              </Button>
              <Button 
                onClick={isEditing ? handleSave : () => setIsEditing(true)}
                className="bg-gradient-to-r from-prepzo-600 to-prepzo-700 hover:from-prepzo-700 hover:to-prepzo-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-xs sm:text-sm"
                size="sm"
              >
                {isEditing ? <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> : <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />}
                <span className="hidden sm:inline">{isEditing ? "Save Changes" : "Edit Profile"}</span>
                <span className="sm:hidden">{isEditing ? "Save" : "Edit"}</span>
              </Button>
            </div>
          </div>

          {/* Profile Header */}
          <Card className="mb-6 sm:mb-8 border-0 shadow-2xl bg-gradient-to-br from-white to-prepzo-50/30 backdrop-blur-sm">
            <CardContent className="p-0">
              {/* Cover Section */}
              <div className="h-24 sm:h-32 bg-gradient-to-r from-prepzo-600 via-prepzo-500 to-prepzo-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-pattern opacity-30"></div>
              </div>
              
              <div className="px-4 sm:px-8 pb-6 sm:pb-8 -mt-12 sm:-mt-16 relative">
                <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">
                  <div className="flex flex-col items-center lg:items-start">
                    <div className="relative mb-4 sm:mb-6">
                      <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-white shadow-xl ring-4 ring-prepzo-100">
                        <AvatarImage src={profile.avatar} className="object-cover" />
                        <AvatarFallback className="text-2xl bg-gradient-to-br from-prepzo-200 to-prepzo-300 text-prepzo-800 font-bold">
                          {profile.name ? profile.name.split(' ').map(n => n[0]).join('') : ''}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 sm:-bottom-2 left-1/2 transform -translate-x-1/2 bg-green-500 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex gap-2 sm:gap-3 flex-wrap justify-center lg:justify-start">
                      {profile.linkedin && (
                        <Button size="sm" variant="outline" asChild className="border-prepzo-200 text-prepzo-700 hover:bg-prepzo-50 hover:border-prepzo-400 transition-all duration-200 rounded-full w-8 h-8 sm:w-10 sm:h-10 p-0">
                          <Link
                            href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                        <Linkedin className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Link>
                      </Button>
                      )}
                      {profile.github && (
                        <Button size="sm" variant="outline" asChild className="border-prepzo-200 text-prepzo-700 hover:bg-prepzo-50 hover:border-prepzo-400 transition-all duration-200 rounded-full w-8 h-8 sm:w-10 sm:h-10 p-0">
                          <Link
                            href={profile.github.startsWith('http') ? profile.github : `https://${profile.github}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                        <Github className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Link>
                      </Button>
                      )}
                      {profile.website && (
                        <Button size="sm" variant="outline" asChild className="border-prepzo-200 text-prepzo-700 hover:bg-prepzo-50 hover:border-prepzo-400 transition-all duration-200 rounded-full w-8 h-8 sm:w-10 sm:h-10 p-0">
                          <Link
                            href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                        <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Link>
                      </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 mt-2 sm:mt-4">
                    <div className="mb-4 sm:mb-6 text-center lg:text-left">
                      {isEditing ? (
                        <div className="space-y-3">
                          <Input 
                            value={profile.name} 
                            onChange={(e) => setProfile({...profile, name: e.target.value})}
                            className="text-xl sm:text-3xl font-bold border-prepzo-200 bg-white/50 backdrop-blur-sm"
                            placeholder="Full Name"
                          />
                          <Input 
                            value={profile.title} 
                            onChange={(e) => setProfile({...profile, title: e.target.value})}
                            className="text-base sm:text-lg border-prepzo-200 bg-white/50 backdrop-blur-sm"
                            placeholder="Professional Title"
                          />
                        </div>
                      ) : (
                        <>
                          <h2 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-prepzo-900 to-prepzo-700 bg-clip-text text-transparent mb-2 sm:mb-3">
                            {profile.name}
                          </h2>
                          <p className="text-lg sm:text-xl text-prepzo-600 font-medium mb-3 sm:mb-4">{profile.title}</p>
                        </>
                      )}
                    </div>
                    
                    <div className="mb-4 sm:mb-6">
                      {isEditing ? (
                        <Textarea 
                          value={profile.bio} 
                          onChange={(e) => setProfile({...profile, bio: e.target.value})}
                          className="border-prepzo-200 bg-white/50 backdrop-blur-sm resize-none text-sm sm:text-base"
                          rows={3}
                          placeholder="Tell us about yourself..."
                        />
                      ) : (
                        <p className="text-prepzo-700 leading-relaxed text-sm sm:text-lg">{profile.bio}</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-prepzo-100">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-prepzo-100 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-prepzo-600" />
                        </div>
                        {isEditing ? (
                          <Input 
                            value={profile.location} 
                            onChange={(e) => setProfile({...profile, location: e.target.value})}
                            className="border-0 bg-transparent text-xs sm:text-sm"
                            placeholder="Location"
                          />
                        ) : (
                          <span className="text-prepzo-700 font-medium text-xs sm:text-sm truncate">{profile.location}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-prepzo-100">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-prepzo-100 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-prepzo-600" />
                        </div>
                        {isEditing ? (
                          <Input 
                            value={profile.email} 
                            onChange={(e) => setProfile({...profile, email: e.target.value})}
                            className="border-0 bg-transparent text-xs sm:text-sm"
                            placeholder="Email"
                          />
                        ) : (
                          <span className="text-prepzo-700 font-medium text-xs sm:text-sm truncate">{profile.email}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-prepzo-100 sm:col-span-2 lg:col-span-1">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-prepzo-100 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-prepzo-600" />
                        </div>
                        {isEditing ? (
                          <Input 
                            value={profile.phone} 
                            onChange={(e) => setProfile({...profile, phone: e.target.value})}
                            className="border-0 bg-transparent text-xs sm:text-sm"
                            placeholder="Phone"
                          />
                        ) : (
                          <span className="text-prepzo-700 font-medium text-xs sm:text-sm truncate">{profile.phone}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Tabs */}
          <Tabs defaultValue="practice" className="space-y-6 sm:space-y-8">
            <div className="overflow-x-auto scrollbar-hide">
              <TabsList className="flex w-full bg-white/80 backdrop-blur-sm border border-prepzo-200 shadow-lg rounded-xl p-1.5 h-12 sm:h-14 overflow-x-auto scrollbar-hide">
              <TabsTrigger 
                value="practice" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-prepzo-600 data-[state=active]:to-prepzo-700 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg font-medium text-xs sm:text-sm px-3 sm:px-6 py-1.5 sm:py-2 whitespace-nowrap min-w-[80px] mx-0.5"
              >
                Practice
              </TabsTrigger>
              <TabsTrigger 
                value="interviews" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-prepzo-600 data-[state=active]:to-prepzo-700 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg font-medium text-xs sm:text-sm px-3 sm:px-6 py-1.5 sm:py-2 whitespace-nowrap min-w-[80px] mx-0.5"
              >
                Interviews
              </TabsTrigger>
              <TabsTrigger 
                value="skills" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-prepzo-600 data-[state=active]:to-prepzo-700 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg font-medium text-xs sm:text-sm px-3 sm:px-6 py-1.5 sm:py-2 whitespace-nowrap min-w-[80px] mx-0.5"
              >
                Skills
              </TabsTrigger>
              <TabsTrigger 
                value="certificates" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-prepzo-600 data-[state=active]:to-prepzo-700 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg font-medium text-xs sm:text-sm px-3 sm:px-6 py-1.5 sm:py-2 whitespace-nowrap min-w-[80px] mx-0.5"
              >
                <span className="hidden sm:inline">Certificates</span>
                <span className="sm:hidden">Certs</span>
              </TabsTrigger>
              <TabsTrigger 
                value="experience" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-prepzo-600 data-[state=active]:to-prepzo-700 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg font-medium text-xs sm:text-sm px-3 sm:px-6 py-1.5 sm:py-2 whitespace-nowrap min-w-[80px] mx-0.5"
              >
                <span className="hidden sm:inline">Experience</span>
                <span className="sm:hidden">Exp</span>
              </TabsTrigger>
              <TabsTrigger 
                value="projects" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-prepzo-600 data-[state=active]:to-prepzo-700 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg font-medium text-xs sm:text-sm px-3 sm:px-6 py-1.5 sm:py-2 whitespace-nowrap min-w-[80px] mx-0.5"
              >
                Projects
              </TabsTrigger>
              <TabsTrigger 
                value="achievements" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-prepzo-600 data-[state=active]:to-prepzo-700 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg font-medium text-xs sm:text-sm px-3 sm:px-6 py-1.5 sm:py-2 whitespace-nowrap min-w-[80px] mx-0.5"
              >
                <span className="hidden sm:inline">Achievements</span>
                <span className="sm:hidden">Awards</span>
              </TabsTrigger>
              <TabsTrigger 
                value="resume" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-prepzo-600 data-[state=active]:to-prepzo-700 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg font-medium text-xs sm:text-sm px-3 sm:px-6 py-1.5 sm:py-2 whitespace-nowrap min-w-[80px] mx-0.5"
              >
                Resume
              </TabsTrigger>
            </TabsList>
            </div>

            {/* Practice Stats Tab */}
            <TabsContent value="practice" className="space-y-4 sm:space-y-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-green-100/80 backdrop-blur-sm">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-2xl sm:text-3xl font-bold text-green-700">{profile.practiceStats.problemsSolved.total}</p>
                        <p className="text-xs sm:text-sm text-green-600 font-medium">Problems Solved</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1 sm:gap-2 text-center">
                      <div className="bg-white/60 rounded-lg p-1 sm:p-2">
                        <p className="text-sm sm:text-lg font-bold text-green-700">{profile.practiceStats.problemsSolved.easy}</p>
                        <p className="text-xs text-green-600">Easy</p>
                      </div>
                      <div className="bg-white/60 rounded-lg p-1 sm:p-2">
                        <p className="text-sm sm:text-lg font-bold text-orange-700">{profile.practiceStats.problemsSolved.medium}</p>
                        <p className="text-xs text-orange-600">Medium</p>
                      </div>
                      <div className="bg-white/60 rounded-lg p-1 sm:p-2">
                        <p className="text-sm sm:text-lg font-bold text-red-700">{profile.practiceStats.problemsSolved.hard}</p>
                        <p className="text-xs text-red-600">Hard</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 to-orange-100/80 backdrop-blur-sm">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-2xl sm:text-3xl font-bold text-orange-700">{profile.practiceStats.dailyStreak.current}</p>
                        <p className="text-xs sm:text-sm text-orange-600 font-medium">Day Streak</p>
                      </div>
                    </div>
                    <div className="text-center bg-white/60 rounded-lg p-1 sm:p-2">
                      <p className="text-sm sm:text-lg font-bold text-orange-700">{profile.practiceStats.dailyStreak.longest}</p>
                      <p className="text-xs text-orange-600">Longest Streak</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100/80 backdrop-blur-sm sm:col-span-2 lg:col-span-1">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-2xl sm:text-3xl font-bold text-blue-700">{profile.practiceStats.weeklyGoal.completed}/{profile.practiceStats.weeklyGoal.target}</p>
                        <p className="text-xs sm:text-sm text-blue-600 font-medium">Weekly Goal</p>
                      </div>
                    </div>
                    <Progress 
                      value={(profile.practiceStats.weeklyGoal.completed / profile.practiceStats.weeklyGoal.target) * 100} 
                      className="h-2" 
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Topics Progress */}
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="flex items-center gap-2 sm:gap-3 text-prepzo-900 text-lg sm:text-xl">
                    <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-prepzo-600" />
                    Topic Mastery
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 sm:space-y-4">
                    {profile.practiceStats.topics.map((topic, index) => (
                      <div key={index} className="p-3 sm:p-4 bg-prepzo-50 rounded-lg">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 sm:mb-3 gap-2">
                          <div>
                            <h4 className="font-semibold text-prepzo-900 text-sm sm:text-base">{topic.name}</h4>
                            <p className="text-xs sm:text-sm text-prepzo-600">{topic.solved} problems solved</p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-lg sm:text-lg font-bold text-prepzo-700">{topic.accuracy}%</p>
                            <p className="text-xs text-prepzo-600">accuracy</p>
                          </div>
                        </div>
                        <Progress value={topic.accuracy} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Language Stats */}
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-prepzo-900">
                    <Code className="w-6 h-6 text-prepzo-600" />
                    Programming Languages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile.practiceStats.languages.map((lang, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-prepzo-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-prepzo-500 to-prepzo-600 rounded-lg flex items-center justify-center">
                            <Code className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-semibold text-prepzo-900">{lang.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-prepzo-700">{lang.problems}</p>
                          <p className="text-sm text-prepzo-600">problems</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Interview Practice Tab */}
            <TabsContent value="interviews" className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-purple-100/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-purple-700">{profile.interviewPractice.sessionsCompleted}</p>
                        <p className="text-sm text-purple-600 font-medium">Sessions Completed</p>
                      </div>
                    </div>
                    <div className="text-center bg-white/60 rounded-lg p-2">
                      <p className="text-lg font-bold text-purple-700">{profile.interviewPractice.totalHours}h</p>
                      <p className="text-xs text-purple-600">Total Practice Hours</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-50 to-emerald-100/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-emerald-700">
                          {Math.round(profile.interviewPractice.categories.reduce((sum, cat) => sum + cat.averageScore, 0) / profile.interviewPractice.categories.length)}%
                        </p>
                        <p className="text-sm text-emerald-600 font-medium">Overall Score</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Category Performance */}
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-prepzo-900">
                    <BarChart3 className="w-6 h-6 text-prepzo-600" />
                    Interview Category Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {profile.interviewPractice.categories.map((category, index) => (
                      <div key={index} className="p-4 bg-prepzo-50 rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <h4 className="font-semibold text-prepzo-900">{category.name}</h4>
                            <p className="text-sm text-prepzo-600">{category.sessionsCount} sessions • Last: {category.lastSession}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-prepzo-700">{category.averageScore}%</p>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3 text-green-600" />
                              <span className="text-xs text-green-600">+{category.improvement}%</span>
                            </div>
                          </div>
                        </div>
                        <Progress value={category.averageScore} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Sessions */}
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-prepzo-900">
                    <Clock className="w-6 h-6 text-prepzo-600" />
                    Recent Practice Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {profile.interviewPractice.recentSessions.map((session, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-prepzo-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-prepzo-600 rounded-lg flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-prepzo-900">{session.category}</p>
                            <p className="text-sm text-prepzo-600">{session.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-prepzo-700">{session.score}%</p>
                          <p className="text-sm text-prepzo-600">{session.duration}min</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Skills Tab */}
            <TabsContent value="skills" className="space-y-6">
              {Object.entries(
                profile.skills.reduce((acc, skill) => {
                  if (!acc[skill.category]) acc[skill.category] = [];
                  acc[skill.category].push(skill);
                  return acc;
                }, {} as Record<string, typeof profile.skills>)
              ).map(([category, skills]) => (
                <Card key={category} className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-prepzo-900">
                      <Brain className="w-6 h-6 text-prepzo-600" />
                      {category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {skills.map((skill, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-prepzo-900">{skill.name}</span>
                            <span className="text-sm font-medium text-prepzo-600">{skill.level}%</span>
                          </div>
                          <Progress value={skill.level} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Certificates Tab */}
            <TabsContent value="certificates" className="space-y-6">
              {profile.certificates && profile.certificates.length > 0 ? (
                <div className="grid gap-4 sm:gap-6">
                  {profile.certificates.map((cert, index) => (
                    <Card key={index} className="border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row gap-4 sm:items-start sm:justify-between">
                          <div className="flex items-start gap-3 sm:gap-4 flex-1">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-prepzo-500 to-prepzo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                              <Award className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg sm:text-xl font-bold text-prepzo-900 mb-1 break-words">{cert.name}</h3>
                              <p className="text-prepzo-600 font-medium mb-2 text-sm sm:text-base">{cert.issuer}</p>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-prepzo-600">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                  <span>Issued: {cert.issueDate}</span>
                                </div>
                                {cert.expiryDate && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                    <span>Expires: {cert.expiryDate}</span>
                                  </div>
                                )}
                              </div>
                              {cert.credentialId && (
                                <p className="text-xs text-prepzo-500 mt-2 break-all">Credential ID: {cert.credentialId}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0 self-start sm:self-auto">
                           {isEditing && (
                             <>
                               <Button 
                                 size="sm" 
                                 variant="outline" 
                                 className="border-prepzo-300 text-prepzo-700 hover:bg-prepzo-50 text-xs"
                                 onClick={() => handleEditCertificate(index)}
                               >
                                 <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                 Edit
                               </Button>
                               <Button 
                                 size="sm" 
                                 variant="outline" 
                                 className="border-red-300 text-red-700 hover:bg-red-50 text-xs"
                                 onClick={() => handleDeleteCertificate(index)}
                               >
                                 <X className="w-3 h-3 sm:w-4 sm:h-4" />
                               </Button>
                             </>
                           )}
                            {cert.verificationUrl && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-prepzo-300 text-prepzo-700 hover:bg-prepzo-50 text-xs"
                                onClick={() => window.open(cert.verificationUrl, '_blank')}
                              >
                                <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                <span className="hidden sm:inline">Verify</span>
                                <span className="sm:hidden">View</span>
                              </Button>
                            )}
                            <Badge 
                              className={`text-xs ${
                                cert.expiryDate && new Date(cert.expiryDate) > new Date() 
                                  ? 'bg-green-100 text-green-700 border-green-300' 
                                  : cert.expiryDate 
                                  ? 'bg-orange-100 text-orange-700 border-orange-300'
                                  : 'bg-blue-100 text-blue-700 border-blue-300'
                              }`}
                            >
                              {cert.expiryDate 
                                ? (new Date(cert.expiryDate) > new Date() ? 'Active' : 'Expired')
                                : 'No Expiry'
                              }
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                 
                 {isEditing && (
                   <Card className="border-2 border-dashed border-prepzo-300 bg-prepzo-50/50 hover:bg-prepzo-50 transition-colors cursor-pointer" onClick={() => setShowCertDialog(true)}>
                     <CardContent className="p-6 sm:p-8 text-center">
                       <div className="w-12 h-12 sm:w-16 sm:h-16 bg-prepzo-200 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                         <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-prepzo-600" />
                       </div>
                       <h3 className="text-base sm:text-lg font-medium text-prepzo-700 mb-2">Add New Certificate</h3>
                       <p className="text-sm text-prepzo-600">Showcase your professional certifications</p>
                     </CardContent>
                   </Card>
                 )}
                </div>
              ) : (
                <Card className="border-2 border-dashed border-prepzo-300 bg-prepzo-50/50 hover:bg-prepzo-50 transition-colors cursor-pointer">
                  <CardContent className="p-6 sm:p-8 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-prepzo-200 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Award className="w-6 h-6 sm:w-8 sm:h-8 text-prepzo-600" />
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-prepzo-700 mb-2">Add New Certificate</h3>
                    <p className="text-sm text-prepzo-600 mb-4">Showcase your professional certifications</p>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCertDialog(true)}
                      className="group border-prepzo-300 text-prepzo-700 hover:bg-prepzo-50 hover:border-prepzo-400 transition-all duration-200"
                    >
                      <PlusCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                      Add Certificate
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Certificate Dialog */}
            <Dialog open={showCertDialog} onOpenChange={setShowCertDialog}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-prepzo-600" />
                    {editingCertIndex !== null ? 'Edit Certificate' : 'Add New Certificate'}
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
                  <div className="grid gap-2">
                    <Label htmlFor="cert-url">Verification URL (Optional)</Label>
                    <Input
                      id="cert-url"
                      value={newCertificate.verificationUrl}
                      onChange={(e) => setNewCertificate({...newCertificate, verificationUrl: e.target.value})}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={resetCertificateForm}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveCertificate}
                    disabled={!newCertificate.name || !newCertificate.issuer || !newCertificate.issueDate}
                    className="bg-prepzo-600 hover:bg-prepzo-700"
                  >
                    {editingCertIndex !== null ? 'Update Certificate' : 'Add Certificate'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Experience Tab */}
            <TabsContent value="experience" className="space-y-6">
              {profile.experience.map((exp, index) => (
                <Card key={index} className="border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <CardHeader className="bg-gradient-to-r from-prepzo-50 to-prepzo-100/50 border-b border-prepzo-100">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <CardTitle className="text-xl text-prepzo-900 font-bold">{exp.role}</CardTitle>
                        <div className="flex items-center gap-2 text-prepzo-600">
                          <span className="font-semibold">{exp.company}</span>
                          <span className="w-1 h-1 bg-prepzo-400 rounded-full"></span>
                          <span className="text-sm">{exp.duration}</span>
                        </div>
                      </div>
                      {isEditing && (
                        <Button size="sm" variant="ghost" className="text-prepzo-600 hover:bg-prepzo-100 rounded-full">
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="text-prepzo-700 leading-relaxed">{exp.description}</p>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>


            <TabsContent value="education" className="space-y-6">
              {profile.education.map((edu, index) => (
                <Card key={index} className="border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <CardHeader className="bg-gradient-to-r from-prepzo-50 to-prepzo-100/50 border-b border-prepzo-100">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <CardTitle className="text-xl text-prepzo-900 font-bold">{edu.degree}</CardTitle>
                        <div className="flex items-center gap-2 text-prepzo-600">
                          <span className="font-semibold">{edu.institution}</span>
                          <span className="w-1 h-1 bg-prepzo-400 rounded-full"></span>
                          <span className="text-sm">{edu.year}</span>
                        </div>
                      </div>
                      {isEditing && (
                        <Button size="sm" variant="ghost" className="text-prepzo-600 hover:bg-prepzo-100 rounded-full">
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="text-prepzo-700 leading-relaxed">{edu.description}</p>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="projects" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {profile.projects.map((project, index) => (
                  <Card key={index} className="group border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                    <CardHeader className="bg-gradient-to-r from-prepzo-50 to-prepzo-100/50 border-b border-prepzo-100">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl text-prepzo-900 font-bold group-hover:text-prepzo-700 transition-colors">
                          {project.name}
                        </CardTitle>
                        <div className="flex gap-2">
                          {project.link && (
                            <Button size="sm" variant="ghost" className="text-prepzo-600 hover:bg-prepzo-100 rounded-full">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                          {isEditing && (
                            <Button size="sm" variant="ghost" className="text-prepzo-600 hover:bg-prepzo-100 rounded-full">
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <p className="text-prepzo-700 leading-relaxed mb-6">{project.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {project.technologies.map((tech, techIndex) => (
                          <Badge 
                            key={techIndex} 
                            variant="secondary" 
                            className="bg-gradient-to-r from-prepzo-200 to-prepzo-300 text-prepzo-800 text-xs px-3 py-1 font-medium"
                          >
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {profile.projects.length === 0 && (
                  isEditing ? (
                    <Card className="border-2 border-dashed border-prepzo-300 bg-prepzo-50/50 hover:bg-prepzo-50 transition-colors cursor-pointer">
                      <CardContent className="p-6 sm:p-8 text-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-prepzo-200 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                          <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-prepzo-600" />
                        </div>
                        <h3 className="text-base sm:text-lg font-medium text-prepzo-700 mb-2">Add New Project</h3>
                        <p className="text-sm text-prepzo-600">Showcase your work and achievements</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <p className="text-prepzo-600 col-span-full text-center">No projects to display.</p>
                  )
                )}
              </div>
            </TabsContent>

            {/* Resume Section */}
            <TabsContent value="resume" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Current Resume */}
                <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-prepzo-50 to-prepzo-100/50 border-b border-prepzo-100">
                    <CardTitle className="text-xl text-prepzo-900 font-bold flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Current Resume
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {profile.resume ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-prepzo-50 rounded-lg border border-prepzo-200">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-prepzo-900 truncate">{profile.resume.fileName}</p>
                              <p className="text-sm text-prepzo-600">
                                Uploaded on {new Date(profile.resume.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            {profile.resume && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-prepzo-200 text-prepzo-700 hover:bg-prepzo-50"
                                  onClick={() => window.open(profile.resume?.url, '_blank')}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-prepzo-200 text-prepzo-700 hover:bg-prepzo-50"
                                  onClick={() => window.open(profile.resume?.url, '_blank')}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {isEditing && (
                          <div className="border-2 border-dashed border-prepzo-300 rounded-lg p-4 sm:p-6 text-center hover:border-prepzo-400 transition-colors cursor-pointer">
                            <Upload className="w-8 h-8 text-prepzo-600 mx-auto mb-2" />
                            <p className="text-prepzo-700 font-medium">Upload New Resume</p>
                            <p className="text-sm text-prepzo-600">Drag and drop or click to browse</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-prepzo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FileText className="w-8 h-8 text-prepzo-600" />
                        </div>
                        <p className="text-prepzo-700 font-medium mb-2">No resume uploaded</p>
                        <p className="text-sm text-prepzo-600 mb-4">Upload your current resume to get started</p>
                        <div className="border-2 border-dashed border-prepzo-300 rounded-lg p-4 sm:p-6 hover:border-prepzo-400 transition-colors cursor-pointer">
                          <Upload className="w-8 h-8 text-prepzo-600 mx-auto mb-2" />
                          <p className="text-prepzo-700 font-medium">Upload Resume</p>
                          <p className="text-sm text-prepzo-600">PDF, DOC, or DOCX files only</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Generate Resume */}
                <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-prepzo-50 to-prepzo-100/50 border-b border-prepzo-100">
                    <CardTitle className="text-xl text-prepzo-900 font-bold flex items-center gap-2">
                      <Download className="w-5 h-5" />
                      Generate Resume
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-prepzo-100 to-prepzo-200 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FileText className="w-8 h-8 text-prepzo-700" />
                        </div>
                        <p className="text-prepzo-700 font-medium mb-2">Create Professional Resume</p>
                        <p className="text-sm text-prepzo-600 mb-6">
                          Generate a beautifully formatted resume using your profile information
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-prepzo-50 rounded-lg border border-prepzo-200 text-center">
                            <div className="w-8 h-8 bg-prepzo-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                              <span className="text-prepzo-700 font-bold text-sm">CV</span>
                            </div>
                            <p className="text-sm text-prepzo-700 font-medium">Classic Format</p>
                          </div>
                          <div className="p-4 bg-prepzo-50 rounded-lg border border-prepzo-200 text-center">
                            <div className="w-8 h-8 bg-prepzo-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                              <span className="text-prepzo-700 font-bold text-sm">MD</span>
                            </div>
                            <p className="text-sm text-prepzo-700 font-medium">Modern Design</p>
                          </div>
                        </div>

                        <Button className="w-full bg-gradient-to-r from-prepzo-600 to-prepzo-700 hover:from-prepzo-700 hover:to-prepzo-800 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                          <Download className="w-4 h-4 mr-2" />
                          Generate & Download Resume
                        </Button>

                        <div className="text-center">
                          <p className="text-xs text-prepzo-600">
                            Your resume will include all sections from your profile
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Resume Preview */}
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-prepzo-50 to-prepzo-100/50 border-b border-prepzo-100">
                  <CardTitle className="text-xl text-prepzo-900 font-bold flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Resume Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {profile.resume?.url ? (
                    <div className="rounded-lg overflow-hidden border border-prepzo-200 h-[600px]">
                      <iframe
                        src={profile.resume.url}
                        title="Resume preview"
                        className="w-full h-full"
                      />
                    </div>
                  ) : (
                  <div className="bg-gray-50 rounded-lg p-6 min-h-96 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-gray-500" />
                      </div>
                      <p className="text-gray-600 font-medium mb-2">Resume Preview</p>
                      <p className="text-sm text-gray-500">
                          {isEditing ? 'Upload a resume file to preview it here' : 'Generate or upload a resume to see it here'}
                      </p>
                    </div>
                  </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Achievements Tab */}
            <TabsContent value="achievements" className="space-y-6">
              {profile.achievements && profile.achievements.length > 0 ? (
                profile.achievements.map((achievement, index) => (
                  <Card key={index} className="border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="bg-gradient-to-r from-prepzo-50 to-prepzo-100/50 border-b border-prepzo-100">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-gradient-to-r from-prepzo-600 to-prepzo-700 rounded-full"></div>
                            <CardTitle className="text-xl text-prepzo-900 font-bold">{achievement.title}</CardTitle>
                          </div>
                          <p className="text-prepzo-600 font-medium ml-6">{achievement.date}</p>
                        </div>
                        {isEditing && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-prepzo-600 hover:bg-prepzo-100 rounded-full"
                              onClick={() => handleEditAchievement(index)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-red-600 hover:bg-red-100 rounded-full"
                              onClick={() => handleDeleteAchievement(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <p className="text-prepzo-700 leading-relaxed ml-6">{achievement.description}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-2 border-dashed border-prepzo-300 bg-prepzo-50/50 hover:bg-prepzo-50 transition-colors cursor-pointer">
                  <CardContent className="p-6 sm:p-8 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-prepzo-200 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-prepzo-600" />
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-prepzo-700 mb-2">Add New Achievement</h3>
                    <p className="text-sm text-prepzo-600 mb-4">Highlight your accomplishments and milestones</p>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAchievementDialog(true)}
                      className="group border-prepzo-300 text-prepzo-700 hover:bg-prepzo-50 hover:border-prepzo-400 transition-all duration-200"
                    >
                      <PlusCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                      Add Achievement
                    </Button>
                  </CardContent>
                </Card>
              )}
             
             {isEditing && profile.achievements && profile.achievements.length > 0 && (
               <Card className="border-2 border-dashed border-prepzo-300 bg-prepzo-50/50 hover:bg-prepzo-50 transition-colors cursor-pointer" onClick={() => setShowAchievementDialog(true)}>
                 <CardContent className="p-6 sm:p-8 text-center">
                   <div className="w-12 h-12 sm:w-16 sm:h-16 bg-prepzo-200 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                     <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-prepzo-600" />
                   </div>
                   <h3 className="text-base sm:text-lg font-medium text-prepzo-700 mb-2">Add New Achievement</h3>
                   <p className="text-sm text-prepzo-600">Highlight your accomplishments and milestones</p>
                 </CardContent>
               </Card>
             )}
            </TabsContent>

            {/* Achievement Dialog */}
            <Dialog open={showAchievementDialog} onOpenChange={setShowAchievementDialog}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-prepzo-600" />
                    {editingAchievementIndex !== null ? 'Edit Achievement' : 'Add New Achievement'}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="achievement-title">Achievement Title *</Label>
                    <Input
                      id="achievement-title"
                      value={newAchievement.title}
                      onChange={(e) => setNewAchievement({...newAchievement, title: e.target.value})}
                      placeholder="e.g. Employee of the Month"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="achievement-date">Date *</Label>
                    <Input
                      id="achievement-date"
                      type="date"
                      value={newAchievement.date}
                      onChange={(e) => setNewAchievement({...newAchievement, date: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="achievement-description">Description (Optional)</Label>
                    <Textarea
                      id="achievement-description"
                      value={newAchievement.description}
                      onChange={(e) => setNewAchievement({...newAchievement, description: e.target.value})}
                      placeholder="Describe the achievement briefly"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={resetAchievementForm}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveAchievement}
                    disabled={!newAchievement.title || !newAchievement.date}
                    className="bg-prepzo-600 hover:bg-prepzo-700"
                  >
                    {editingAchievementIndex !== null ? 'Update Achievement' : 'Add Achievement'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Tabs>
        </div>
      </div>

      {/* LinkedIn Upload Modal */}
      <LinkedInUpload
        isOpen={showLinkedInUpload}
        onClose={() => setShowLinkedInUpload(false)}
        onDataExtracted={handleLinkedInDataExtracted}
      />
   </DashboardLayout>
  );
};

export default Profile;