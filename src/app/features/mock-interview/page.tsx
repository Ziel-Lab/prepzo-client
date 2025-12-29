"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import mockinterview from './../../../../public/static/images/mockinterview.png';
import { 
  MessageSquare, 
  Edit3, 
  Target, 
  Zap, 
  FileText, 
  Brain,
  Clock,
  BarChart3,
  CheckCircle,
  Users,
  Linkedin,
  Search,
  ArrowRight,
  Star,
  Play
} from "lucide-react";
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';

import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const MockInterview = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const checkUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setIsLoading(false);
    };

    checkUserSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleStartMockInterview = () => {
    if (isAuthenticated) {
      router.push('/dashboard/tools/mock-Interview');
    } else {
      // Redirect to login with return URL
      router.push('/auth/login?redirect=/dashboard/tools/mock-Interview');
    }
  };

  return (
    <>
      <Navbar/>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative bg-prepzo text-white min-h-[90vh] sm:min-h-[80vh] flex items-center py-20 sm:py-24 lg:py-28">
          <div className="absolute inset-0 bg-gradient-to-br from-prepzo/90 to-prepzo-dark/80" />
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 mb-6 mx-auto lg:mx-0 lg: mt-10">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="text-sm sm:text-base">AI-Powered Interview Practice</span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                  Master Every Interview Before It Matters
                </h1>
                <p className="text-base sm:text-lg opacity-90 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  Prepare with confidence using our AI-powered mock interview system that analyzes real job postings to create personalized interview experiences tailored to your target role.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button 
                    onClick={handleStartMockInterview}
                    disabled={isLoading}
                    size="lg" 
                    className="bg-white text-prepzo hover:bg-prepzo-50 px-8 py-6 w-full sm:w-auto text-lg font-medium"
                  >
                    {/* <Play className="w-5 h-5 mr-3" /> */}
                    {isLoading ? "Loading..." : "Start Your Free Mock Interview"}
                  </Button>
                </div>
                <p className="text-sm text-white/70 mt-4">
                  Join thousands of professionals who've landed their dream jobs
                </p>
              </div>
              <div className="relative z-10 lg:mt-0">
                <div className="relative max-w-2xl mx-auto p-4 lg:mt-20">
                  <div className="video-wrapper relative w-full overflow-hidden rounded-xl shadow-2xl bg-black/10" style={{ aspectRatio: '16/9' }}>
                    <iframe 
                      className="absolute top-0 left-0 w-full h-full"
                      src="https://www.youtube-nocookie.com/embed/NjSb3W4UwDA?si=kpNw1mD7FbHFBLDg&controls=0" 
                      title="YouTube video player" 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                      referrerPolicy="strict-origin-when-cross-origin" 
                      allowFullScreen
                      loading="lazy"
                      style={{ clipPath: 'inset(0% 0% 0% 0% round 0.75rem)' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Prepzo's Interview Tool Section */}
        <section className="py-20 sm:py-24 lg:py-28 bg-gradient-to-br from-prepzo-50/30 to-prepzo-100/20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                Why Prepzo's Intelligent Interview Tool?
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Beyond Practice: Intelligent Career Growth
              </p>
            </div>
            
            <Card className="border-border bg-white/50 backdrop-blur-sm">
              <CardContent className="p-8 lg:p-12">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div className="space-y-6">
                    <p className="text-base lg:text-lg text-muted-foreground leading-relaxed">
                      While traditional mock interviews offer generic questions, <strong>Prepzo.ai</strong> goes further. 
                      Our advanced AI analyzes your target company's URL and job description to generate highly relevant, 
                      role-specific questions that mirror real interview scenarios.
                    </p>
                    <p className="text-base lg:text-lg text-muted-foreground leading-relaxed">
                      Get mission-critical feedback that transforms nervous candidates into confident interviewees.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Badge className="bg-green-100 text-green-600 px-4 py-2">
                        <Brain className="w-4 h-4 mr-2" />
                        AI-Powered
                      </Badge>
                      <Badge className="bg-green-100 text-green-600 px-4 py-2">
                        <Target className="w-4 h-4 mr-2" />
                        Role-Specific
                      </Badge>
                      <Badge className="bg-green-100 text-green-600 px-4 py-2">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Real-Time Feedback
                      </Badge>
                    </div>
                  </div>
                  <div className="bg-prepzo/5 rounded-2xl p-8 text-center border border-prepzo/20">
                    <div className="w-20 h-20 bg-prepzo/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Brain className="w-10 h-10 text-prepzo" />
                    </div>
                    <p className="text-prepzo font-medium">Intelligent Interview Analysis</p>
                    <p className="text-sm text-muted-foreground mt-2">Company-specific questions & feedback</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 sm:py-24 lg:py-28">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                How It Works
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Turn Any Job Posting Into Your Interview Advantage
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {/* Step 1 */}
              <Card className="text-center p-6 sm:p-8 border-border hover:border-prepzo/30 transition-all duration-300">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-lg">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Input Job Details</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Simply paste the job description and company URL you're applying for. Our AI instantly accesses current company information.
                </p>
              </Card>

              {/* Step 2 */}
              <Card className="text-center p-6 sm:p-8 border-border hover:border-prepzo/30 transition-all duration-300">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-lg">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Jump on call with our AI agent</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Our AI agent will ask you questions based on the job description and company culture.
                </p>
              </Card>

              {/* Step 3 */}
              <Card className="text-center p-6 sm:p-8 border-border hover:border-prepzo/30 transition-all duration-300">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-lg">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Real-Time Practice</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Engage with our AI interviewer exactly as you would in a real interview with natural conversation flow.
                </p>
              </Card>

              {/* Step 4 */}
              <Card className="text-center p-6 sm:p-8 border-border hover:border-prepzo/30 transition-all duration-300">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-lg">4</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Mission-Critical Feedback</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Receive detailed, actionable insights that could make the difference between getting hired and rejected.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Key Features Section */}
        <section className="py-20 sm:py-24 lg:py-28 bg-gradient-to-br from-prepzo-50/30 to-prepzo-100/20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                Key Features
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Intelligent Interview Simulation & Comprehensive Performance Analysis
              </p>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Intelligent Interview Simulation */}
              <Card className="border-border bg-white/50 backdrop-blur-sm">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-6 text-prepzo">Intelligent Interview Simulation</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">Company-Specific Questions</p>
                        <p className="text-sm text-muted-foreground">AI researches your target company to ask relevant questions about their values and industry trends</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">Role-Tailored Scenarios</p>
                        <p className="text-sm text-muted-foreground">Practice questions designed for your specific position level and responsibilities</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">Industry Intelligence</p>
                        <p className="text-sm text-muted-foreground">Stay current with the latest trends and challenges in your field</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">Adaptive Follow-ups</p>
                        <p className="text-sm text-muted-foreground">Dynamic questioning that responds to your answers, just like real interviews</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comprehensive Performance Analysis */}
              <Card className="border-border bg-white/50 backdrop-blur-sm">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-6 text-prepzo">Comprehensive Performance Analysis</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">Response Quality Assessment</p>
                        <p className="text-sm text-muted-foreground">Detailed feedback on content, structure, and relevance of your answers</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">Communication Clarity</p>
                        <p className="text-sm text-muted-foreground">Analysis of your speaking pace, filler words, and overall delivery</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">Technical Accuracy</p>
                        <p className="text-sm text-muted-foreground">For technical roles, evaluation of your problem-solving approach and accuracy</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">Confidence Building</p>
                        <p className="text-sm text-muted-foreground">Personalized tips to overcome nervousness and project professional confidence</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Why Professionals Choose Prepzo */}
        <section className="py-20 sm:py-24 lg:py-28">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                Why Professionals Choose Prepzo's Mock Interviews
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              <Card className="text-center p-6 border-border hover:border-prepzo/30 transition-all duration-300">
                <div className="w-12 h-12 bg-prepzo/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-6 h-6 text-prepzo" />
                </div>
                <h3 className="font-bold text-lg mb-3">Intelligent Rather Than Generic</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Unlike basic tools with pre-written questions, Prepzo's AI creates fresh, relevant scenarios based on your actual target role.
                </p>
              </Card>
              
              <Card className="text-center p-6 border-border hover:border-prepzo/30 transition-all duration-300">
                <div className="w-12 h-12 bg-prepzo/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Target className="w-6 h-6 text-prepzo" />
                </div>
                <h3 className="font-bold text-lg mb-3">Mission-Critical Feedback</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Detailed, objective feedback that highlights subtle communication issues that could cost you the job.
                </p>
              </Card>
              
              <Card className="text-center p-6 border-border hover:border-prepzo/30 transition-all duration-300">
                <div className="w-12 h-12 bg-prepzo/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-prepzo" />
                </div>
                <h3 className="font-bold text-lg mb-3">Available 24/7</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Practice anytime, anywhere. No scheduling conflicts, no waiting for availability. Your AI interviewer is always ready.
                </p>
              </Card>
              
              <Card className="text-center p-6 border-border hover:border-prepzo/30 transition-all duration-300">
                <div className="w-12 h-12 bg-prepzo/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-6 h-6 text-prepzo" />
                </div>
                <h3 className="font-bold text-lg mb-3">Data-Driven Improvement</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Track your progress over multiple sessions. See measurable improvement in response quality and confidence levels.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Integration with Prepzo Ecosystem */}
        <section className="py-20 sm:py-24 lg:py-28 bg-gradient-to-br from-prepzo-50/30 to-prepzo-100/20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                Integration with Prepzo Ecosystem
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Your mock interview experience seamlessly connects with your other Prepzo tools
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              <Card className="text-center p-6 bg-white/50 backdrop-blur-sm border-border">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Resume Builder</h3>
                <p className="text-sm text-muted-foreground">Interview questions align with your resume content</p>
              </Card>
              
              <Card className="text-center p-6 bg-white/50 backdrop-blur-sm border-border">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Linkedin className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">LinkedIn Optimization</h3>
                <p className="text-sm text-muted-foreground">Practice discussing your profile achievements</p>
              </Card>
              
              <Card className="text-center p-6 bg-white/50 backdrop-blur-sm border-border">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Job Search</h3>
                <p className="text-sm text-muted-foreground">Direct integration with positions you've saved or applied to</p>
              </Card>
              
              <Card className="text-center p-6 bg-white/50 backdrop-blur-sm border-border">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Edit3 className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Cover Letter Generator</h3>
                <p className="text-sm text-muted-foreground">Personalized cover letters for every role</p>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-20 sm:py-24 lg:py-28 text-primary">
          <div className="absolute inset-0" />
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                Ready to Transform Your Interview Performance?
              </h2>
              <p className="text-lg text-primary mb-12 leading-relaxed">
                Don't let interview anxiety hold you back from your dream job. Join thousands of professionals who've mastered the interview process with Prepzo's AI-powered preparation.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Button 
                  onClick={handleStartMockInterview}
                  disabled={isLoading}
                  size="lg" 
                  className="bg-primary text-white hover:bg-primary/80 px-8 py-6 w-full sm:w-auto text-lg font-medium"
                >
                  
                  {isLoading ? "Loading..." : "Begin Your First Mock Interview - Free"}
                </Button>
              </div>
              
              {/* <p className="text-sm text-primary">
                No credit card required. Start practicing in under 2 minutes.
              </p> */}
            </div>
          </div>
        </section>
      </div>
      <Footer/>
    </>
  );
};

export default MockInterview;
