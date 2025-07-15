"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Target, Zap, Award, TrendingUp } from "lucide-react";
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

const ResumeAnalyzer = () => {
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

  const handleAnalyzeResume = () => {
    if (isAuthenticated) {
      router.push('/dashboard/tools/resume-generator');
    } else {
      // Redirect to login with return URL
      router.push('/auth/login?redirect=/dashboard/tools/resume-generator');
    }
  };

  return (
    <>
      <Navbar/>
      
      <div className="pt-4 md:pt-8">
        {/* Hero Section */}
        <section className="bg-prepzo text-center mt-10 space-y-6 md:space-y-12 py-10 md:py-20 px-4">
          <div className="flex justify-center mb-4 md:mb-6">
            <div className="bg-gray-600 p-3 md:p-4 rounded-full">
              <FileText className="h-8 w-8 md:h-12 md:w-12 text-gray-200" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-200 leading-tight px-2">
            Make Your Resume Unignorable
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-200 max-w-3xl mx-auto px-4 leading-relaxed">
            Upload your resume and job description. Get a detailed analysis, score out of 10, 
            and a reusable resume version optimized for ATS and recruiter eyes alike.
          </p>
        </section>

        <div className="space-y-8 md:space-y-12 pt-8 md:pt-20 pb-8 md:pb-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Main Feature Section */}
          <section className="space-y-6 md:space-y-8">
            <Card className="overflow-hidden">
              <CardHeader className="bg-primary/5 p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl lg:text-2xl">
                  <FileText className="h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-primary flex-shrink-0" />
                  <span>Resume Generator - Polished & Powerful</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
                <div className="grid lg:grid-cols-2 gap-6 md:gap-8 items-center">
                  <div className="space-y-3 md:space-y-4 order-2 lg:order-1">
                    <p className="text-gray-700 leading-relaxed text-sm md:text-base lg:text-lg">
                      Upload your resume and the job description you're applying to. 
                      We have an additional information section for those who want to go deeper.
                    </p>
                    <div className="space-y-2 md:space-y-3">
                      <h3 className="font-semibold text-gray-900 text-sm md:text-base">Prepzo gives you:</h3>
                      <ul className="space-y-2 md:space-y-3 text-gray-700">
                        <li className="flex items-start gap-2 md:gap-3">
                          <Award className="h-4 w-4 md:h-5 md:w-5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm md:text-base">A score out of 10</span>
                        </li>
                        <li className="flex items-start gap-2 md:gap-3">
                          <Target className="h-4 w-4 md:h-5 md:w-5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm md:text-base">Customized feedback to improve impact, keywords, and clarity</span>
                        </li>
                        <li className="flex items-start gap-2 md:gap-3">
                          <Zap className="h-4 w-4 md:h-5 md:w-5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm md:text-base">A reusable resume version that stands out</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="bg-primary/5 rounded-lg p-4 md:p-6 lg:p-8 text-center border border-primary/10 order-1 lg:order-2">
                    <div className="text-3xl md:text-4xl lg:text-6xl mb-3 md:mb-4">📊</div>
                    <p className="text-xs md:text-sm text-gray-600 font-medium">Resume Analysis Dashboard</p>
                    <p className="text-xs text-gray-500 mt-1 md:mt-2">Walkthrough video coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Why It Matters Section */}
          <section className="bg-green-50 md:bg-green-100 p-4 md:p-6 lg:p-8 rounded-lg border-l-4 border-primary">
            <h3 className="font-bold text-gray-900 mb-3 md:mb-4 text-lg md:text-xl">Why It Matters</h3>
            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2 md:space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-green-200 rounded-full p-2 flex-shrink-0">
                    <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-700" />
                  </div>
                  <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                    <strong>Recruiters spend 7.4 seconds on average</strong> per resume
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-green-200 rounded-full p-2 flex-shrink-0">
                    <Target className="h-4 w-4 md:h-5 md:w-5 text-green-700" />
                  </div>
                  <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                    Most resumes fail <strong>due to lack of job-match specificity</strong>
                  </p>
                </div>
              </div>
              <div className="space-y-2 md:space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-green-200 rounded-full p-2 flex-shrink-0">
                    <Zap className="h-4 w-4 md:h-5 md:w-5 text-green-700" />
                  </div>
                  <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                    Our analyzer doesn't just fix keywords — it sharpens <em>signal</em>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-green-200 rounded-full p-2 flex-shrink-0">
                    <Award className="h-4 w-4 md:h-5 md:w-5 text-green-700" />
                  </div>
                  <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                    We give you the final product — a functioning, usable, unignorable CV
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="space-y-6 md:space-y-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-gray-900 px-2">
              How Resume Analysis Works
            </h2>
            <div className="grid md:grid-cols-3 gap-4 md:gap-6">
              <Card className="text-center p-4 md:p-6">
                <div className="bg-primary/10 rounded-full w-12 h-12 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <span className="text-lg md:text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="font-bold text-sm md:text-base lg:text-lg mb-2 md:mb-3">Upload & Input</h3>
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                  Upload your current resume and paste the job description you're targeting
                </p>
              </Card>
              
              <Card className="text-center p-4 md:p-6">
                <div className="bg-primary/10 rounded-full w-12 h-12 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <span className="text-lg md:text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="font-bold text-sm md:text-base lg:text-lg mb-2 md:mb-3">AI Analysis</h3>
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                  Our AI analyzes keyword relevance, ATS compatibility, and overall impact
                </p>
              </Card>
              
              <Card className="text-center p-4 md:p-6">
                <div className="bg-primary/10 rounded-full w-12 h-12 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <span className="text-lg md:text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="font-bold text-sm md:text-base lg:text-lg mb-2 md:mb-3">Get Results</h3>
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                  Receive detailed feedback, score, and an optimized resume ready to use
                </p>
              </Card>
            </div>
          </section>

          {/* Features Grid */}
          <section className="space-y-6 md:space-y-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-gray-900 px-2">
              What Makes Our Analyzer Different
            </h2>
            <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <Card className="p-4 md:p-6">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="bg-primary/10 rounded-lg p-2 md:p-3 flex-shrink-0">
                    <Target className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm md:text-base lg:text-lg mb-1 md:mb-2">Job-Specific Analysis</h3>
                    <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                      Unlike generic resume checkers, we analyze your resume against specific job requirements
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 md:p-6">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="bg-primary/10 rounded-lg p-2 md:p-3 flex-shrink-0">
                    <Zap className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm md:text-base lg:text-lg mb-1 md:mb-2">ATS Optimization</h3>
                    <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                      Ensure your resume passes Applicant Tracking Systems used by most companies
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 md:p-6">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="bg-primary/10 rounded-lg p-2 md:p-3 flex-shrink-0">
                    <Award className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm md:text-base lg:text-lg mb-1 md:mb-2">Actionable Feedback</h3>
                    <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                      Get specific, actionable suggestions instead of vague recommendations
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 md:p-6">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="bg-primary/10 rounded-lg p-2 md:p-3 flex-shrink-0">
                    <FileText className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm md:text-base lg:text-lg mb-1 md:mb-2">Ready-to-Use Output</h3>
                    <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                      Receive a polished, formatted resume ready for immediate use
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center space-y-4 md:space-y-6 py-6 md:py-8 px-4">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 px-2">
              Ready to Make Your Resume Stand Out?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base leading-relaxed px-2">
              Get detailed analysis and optimization recommendations in minutes
            </p>
            <div className="pt-4 md:pt-6">
              <Button 
                onClick={handleAnalyzeResume}
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90 text-white px-6 md:px-8 py-2 md:py-3 text-sm md:text-base lg:text-md w-full sm:w-auto"
              >
                {isLoading ? "Loading..." : "Analyze My Resume"}
              </Button>
            </div>
          </section>
        </div>
      </div>
      <Footer/>    
    </>
  );
};

export default ResumeAnalyzer;