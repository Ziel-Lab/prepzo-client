"use client";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, 
  Mail, 
  Phone, 
  Linkedin, 
  Github, 
  Globe, 
  ExternalLink,
  Download,
  Share2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  skills: string[];
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
}

const PublicProfile = () => {
  const { id, username } = useParams();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would fetch from an API
    // For demo purposes, we'll use mock data
    setTimeout(() => {
      setProfile({
        id: id || "123",
        username: username || "johndoe",
        name: "John Doe",
        title: "Senior Software Engineer",
        bio: "Passionate software engineer with 5+ years of experience building scalable web applications. I love solving complex problems and mentoring junior developers.",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
        location: "San Francisco, CA",
        email: "john.doe@example.com",
        phone: "+1 (555) 123-4567",
        linkedin: "linkedin.com/in/johndoe",
        github: "github.com/johndoe",
        website: "johndoe.dev",
        skills: ["React", "TypeScript", "Node.js", "Python", "AWS", "Docker"],
        experience: [
          {
            company: "Tech Corp",
            role: "Senior Software Engineer",
            duration: "2022 - Present",
            description: "Lead development of microservices architecture serving 1M+ users. Mentored 3 junior developers and improved deployment speed by 40%."
          },
          {
            company: "StartupXYZ",
            role: "Full Stack Developer",
            duration: "2020 - 2022",
            description: "Built the entire frontend and backend infrastructure. Scaled the platform from 0 to 100k users."
          }
        ],
        education: [
          {
            institution: "Stanford University",
            degree: "Master of Science in Computer Science",
            year: "2020",
            description: "Specialized in Machine Learning and Distributed Systems. GPA: 3.8/4.0"
          },
          {
            institution: "UC Berkeley",
            degree: "Bachelor of Science in Computer Science",
            year: "2018",
            description: "Graduated Magna Cum Laude. Active in ACM and hackathons."
          }
        ],
        projects: [
          {
            name: "PrepZo",
            description: "AI-powered job application tracking and preparation platform",
            technologies: ["React", "TypeScript", "Supabase"],
            link: "prepzo.com"
          },
          {
            name: "DevTools Pro",
            description: "Developer productivity suite with 10k+ active users",
            technologies: ["Vue.js", "Python", "PostgreSQL"],
            link: "devtools.pro"
          }
        ],
        achievements: [
          {
            title: "AWS Solutions Architect Certification",
            description: "Achieved professional level certification",
            date: "2023"
          },
          {
            title: "Best Innovation Award",
            description: "Won company-wide innovation challenge",
            date: "2022"
          }
        ]
      });
      setLoading(false);
    }, 1000);

    // Set meta tags for social sharing
    document.title = `${username}'s Profile | PrepZo`;
    
    // Update meta tags
    updateMetaTags({
      title: `${username}'s Professional Profile`,
      description: "View my professional experience, skills, and projects",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      url: window.location.href
    });
  }, [id, username]);

  const updateMetaTags = (meta: { title: string; description: string; image: string; url: string }) => {
    // Update existing meta tags or create new ones
    const updateMeta = (property: string, content: string) => {
      let element = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('property', property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    const updateName = (name: string, content: string) => {
      let element = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('name', name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Open Graph tags
    updateMeta('og:title', meta.title);
    updateMeta('og:description', meta.description);
    updateMeta('og:image', meta.image);
    updateMeta('og:url', meta.url);
    updateMeta('og:type', 'profile');
    updateMeta('og:site_name', 'PrepZo');

    // Twitter Card tags
    updateName('twitter:card', 'summary_large_image');
    updateName('twitter:title', meta.title);
    updateName('twitter:description', meta.description);
    updateName('twitter:image', meta.image);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Profile link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const handleDownloadResume = () => {
    toast({
      title: "Resume Downloaded",
      description: "Resume PDF has been downloaded",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-prepzo-50 to-prepzo-100 flex items-center justify-center">
        <div className="animate-pulse text-prepzo-600 text-xl">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-prepzo-50 to-prepzo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-prepzo-900 mb-2">Profile Not Found</h1>
          <p className="text-prepzo-700">The profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-prepzo-50 to-prepzo-100">
      {/* Header */}
      <div className="bg-white border-b border-prepzo-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img src="/prepzo-logo.png" alt="PrepZo" className="h-8" />
              <span className="text-prepzo-900 font-semibold">Professional Profile</span>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleShare}
                className="border-prepzo-200 text-prepzo-800 hover:bg-prepzo-50"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button 
                size="sm"
                onClick={handleDownloadResume}
                className="bg-prepzo-600 hover:bg-prepzo-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Resume
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8 border-prepzo-200 shadow-lg">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex flex-col items-center md:items-start">
                <Avatar className="w-32 h-32 mb-4 border-4 border-prepzo-200">
                  <AvatarImage src={profile.avatar} />
                  <AvatarFallback className="text-2xl bg-prepzo-100 text-prepzo-800">
                    {profile.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex gap-2 flex-wrap justify-center md:justify-start">
                  <Button size="sm" variant="outline" className="border-prepzo-200 text-prepzo-800" asChild>
                    <a href={`https://${profile.linkedin}`} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" className="border-prepzo-200 text-prepzo-800" asChild>
                    <a href={`https://${profile.github}`} target="_blank" rel="noopener noreferrer">
                      <Github className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" className="border-prepzo-200 text-prepzo-800" asChild>
                    <a href={`https://${profile.website}`} target="_blank" rel="noopener noreferrer">
                      <Globe className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>
              
              <div className="flex-1">
                <div className="mb-4">
                  <h2 className="text-3xl font-bold text-prepzo-900 mb-2">{profile.name}</h2>
                  <p className="text-xl text-prepzo-700 mb-4">{profile.title}</p>
                  <p className="text-prepzo-800 leading-relaxed">{profile.bio}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-prepzo-700">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${profile.email}`} className="hover:text-prepzo-600">
                      {profile.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${profile.phone}`} className="hover:text-prepzo-600">
                      {profile.phone}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="experience" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-prepzo-100 border border-prepzo-200">
            <TabsTrigger value="experience" className="data-[state=active]:bg-prepzo-600 data-[state=active]:text-white">Experience</TabsTrigger>
            <TabsTrigger value="skills" className="data-[state=active]:bg-prepzo-600 data-[state=active]:text-white">Skills</TabsTrigger>
            <TabsTrigger value="education" className="data-[state=active]:bg-prepzo-600 data-[state=active]:text-white">Education</TabsTrigger>
            <TabsTrigger value="projects" className="data-[state=active]:bg-prepzo-600 data-[state=active]:text-white">Projects</TabsTrigger>
            <TabsTrigger value="achievements" className="data-[state=active]:bg-prepzo-600 data-[state=active]:text-white">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="experience" className="space-y-4">
            {profile.experience.map((exp, index) => (
              <Card key={index} className="border-prepzo-200 shadow-md">
                <CardHeader className="bg-prepzo-50">
                  <CardTitle className="text-prepzo-900">{exp.role}</CardTitle>
                  <p className="text-prepzo-700">{exp.company} • {exp.duration}</p>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-prepzo-800">{exp.description}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="skills" className="space-y-4">
            <Card className="border-prepzo-200 shadow-md">
              <CardHeader className="bg-prepzo-50">
                <CardTitle className="text-prepzo-900">Technical Skills</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <Badge key={index} className="bg-prepzo-100 text-prepzo-800 hover:bg-prepzo-200">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="education" className="space-y-4">
            {profile.education.map((edu, index) => (
              <Card key={index} className="border-prepzo-200 shadow-md">
                <CardHeader className="bg-prepzo-50">
                  <CardTitle className="text-prepzo-900">{edu.degree}</CardTitle>
                  <p className="text-prepzo-700">{edu.institution} • {edu.year}</p>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-prepzo-800">{edu.description}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profile.projects.map((project, index) => (
                <Card key={index} className="border-prepzo-200 shadow-md">
                  <CardHeader className="bg-prepzo-50">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-prepzo-900">{project.name}</CardTitle>
                      {project.link && (
                        <Button size="sm" variant="ghost" className="text-prepzo-600" asChild>
                          <a href={`https://${project.link}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-prepzo-800 mb-4">{project.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {project.technologies.map((tech, techIndex) => (
                        <Badge key={techIndex} variant="secondary" className="bg-prepzo-200 text-prepzo-800 text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            {profile.achievements.map((achievement, index) => (
              <Card key={index} className="border-prepzo-200 shadow-md">
                <CardHeader className="bg-prepzo-50">
                  <CardTitle className="text-prepzo-900">{achievement.title}</CardTitle>
                  <p className="text-prepzo-700">{achievement.date}</p>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-prepzo-800">{achievement.description}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PublicProfile;