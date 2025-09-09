"use client";

import React from 'react';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Wand2, 
  Linkedin, 
  MessageSquare, 
  Briefcase,
  ArrowRight 
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface WhiteLabelToolsProps {
  showHeader?: boolean;
  className?: string;
}

const WhiteLabelTools: React.FC<WhiteLabelToolsProps> = ({ 
  showHeader = true, 
  className = "" 
}) => {
  const { config } = useWhiteLabel();

  const tools = [
    {
      id: "resume-generator",
      title: "Resume Generator",
      description: "Generate and optimize your resume with AI-powered suggestions.",
      link: "/dashboard/tools/resume-generator",
      icon: <FileText className="h-8 w-8 text-blue-500" />,
      enabled: config.enabledFeatures.resumeGenerator,
    },
    {
      id: "cover-letter-generator",
      title: "Cover Letter Generator",
      description: "Create a tailored cover letter in seconds for any job application.",
      link: "/dashboard/tools/cover-letter",
      icon: <Wand2 className="h-8 w-8 text-purple-500" />,
      enabled: config.enabledFeatures.coverLetterGenerator,
    },
    {
      id: "linkedin-optimizer",
      title: "LinkedIn Optimizer",
      description: "Enhance your LinkedIn profile to attract recruiters and opportunities.",
      link: "/dashboard/tools/linkedin-optimizer",
      icon: <Linkedin className="h-8 w-8 text-sky-600" />,
      enabled: config.enabledFeatures.linkedinOptimizer,
    },
    {
      id: "mock-interview",
      title: "Mock Interview",
      description: "Practice interviews with AI and get detailed feedback to improve.",
      link: "/dashboard/tools/mock-Interview",
      icon: <MessageSquare className="h-8 w-8 text-emerald-500" />,
      enabled: config.enabledFeatures.mockInterview,
    },
    {
      id: "job-search",
      title: "Job Search",
      description: "Track and manage your job applications with detailed analytics.",
      link: "/dashboard/applications",
      icon: <Briefcase className="h-8 w-8 text-green-500" />,
      enabled: config.enabledFeatures.jobSearch,
    },
  ].filter(tool => tool.enabled);

  return (
    <div className={`w-full ${className}`}>
      {showHeader && (
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            {config.brandName} Career Tools
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {config.description}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <Card key={tool.id} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                {tool.icon}
                <CardTitle className="text-xl">{tool.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {tool.description}
              </p>
              <Link href={tool.link}>
                <Button className="w-full group-hover:bg-primary/90 transition-colors">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {tools.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No tools are currently available for your organization.
          </p>
        </div>
      )}
    </div>
  );
};

export default WhiteLabelTools;
