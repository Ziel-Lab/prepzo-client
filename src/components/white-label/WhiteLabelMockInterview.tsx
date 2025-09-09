"use client";

import React, { useState } from 'react';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Clock, 
  Users, 
  TrendingUp,
  Play,
  Star,
  CheckCircle
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface WhiteLabelMockInterviewProps {
  showHeader?: boolean;
  className?: string;
}

const WhiteLabelMockInterview: React.FC<WhiteLabelMockInterviewProps> = ({ 
  showHeader = true, 
  className = "" 
}) => {
  const { config } = useWhiteLabel();

  const features = [
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "AI-Powered Interviews",
      description: "Practice with advanced AI that adapts to your responses"
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Flexible Scheduling",
      description: "Practice anytime, anywhere with 24/7 availability"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Industry-Specific",
      description: "Tailored questions for your target role and company"
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Detailed Feedback",
      description: "Get comprehensive insights to improve your performance"
    }
  ];

  const interviewTypes = [
    {
      type: "Technical Interview",
      description: "Coding challenges and technical problem-solving",
      difficulty: "Medium",
      duration: "45 min"
    },
    {
      type: "Behavioral Interview",
      description: "STAR method and situational questions",
      difficulty: "Easy",
      duration: "30 min"
    },
    {
      type: "Case Study",
      description: "Business case analysis and problem-solving",
      difficulty: "Hard",
      duration: "60 min"
    }
  ];

  if (!config.enabledFeatures.mockInterview) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-muted-foreground">
          Mock Interview feature is not available for your organization.
        </p>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {showHeader && (
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Master Your Interview Skills
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Practice with AI-powered mock interviews and get detailed feedback to ace your next interview.
          </p>
        </div>
      )}

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-8 mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-bold mb-4">
              Ready to Ace Your Next Interview?
            </h3>
            <p className="text-muted-foreground mb-6">
              Our AI-powered mock interview platform provides realistic practice sessions 
              with instant feedback to help you build confidence and improve your performance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/dashboard/tools/mock-Interview">
                <Button size="lg" className="w-full sm:w-auto">
                  <Play className="mr-2 h-5 w-5" />
                  Start Practice Session
                </Button>
              </Link>
              <Link href="/dashboard/tools/mock-Interview/sessions">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  View Past Sessions
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-64 h-64 bg-primary/20 rounded-full flex items-center justify-center">
                <MessageSquare className="h-32 w-32 text-primary" />
              </div>
              <div className="absolute -top-4 -right-4 bg-green-500 text-white rounded-full p-3">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {features.map((feature, index) => (
          <Card key={index} className="text-center">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  {feature.icon}
                </div>
              </div>
              <h4 className="font-semibold mb-2">{feature.title}</h4>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Interview Types */}
      <div className="mb-12">
        <h3 className="text-2xl font-bold text-center mb-8">
          Choose Your Interview Type
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {interviewTypes.map((interview, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{interview.type}</CardTitle>
                  <Badge variant="secondary">{interview.difficulty}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {interview.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Duration: {interview.duration}
                  </span>
                  <Link href="/dashboard/tools/mock-Interview">
                    <Button size="sm">
                      Start
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-muted/50 rounded-lg p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-primary mb-2">10,000+</div>
            <div className="text-muted-foreground">Practice Sessions Completed</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">95%</div>
            <div className="text-muted-foreground">User Satisfaction Rate</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">50+</div>
            <div className="text-muted-foreground">Interview Types Available</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhiteLabelMockInterview;
