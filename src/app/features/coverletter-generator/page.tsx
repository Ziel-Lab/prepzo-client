"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Edit3, Target, Zap, FileText, MessageSquare } from "lucide-react";
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';

import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

const CoverLetterGenerator = () => {
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

  const handleGenerateCoverLetter = () => {
    if (isAuthenticated) {
      router.push('/dashboard/tools/cover-letter');
    } else {
      // Redirect to login with return URL
      router.push('/auth/login?redirect=/dashboard/tools/cover-letter');
    }
  };

  return (
    <>
      <Navbar/>
      <div className="pt-4 md:pt-8">
        {/* Hero Section */}
        <section className="text-center mt-10 space-y-6 md:space-y-12 py-10 md:py-20 bg-prepzo px-4">
          <div className="flex justify-center mb-4 md:mb-6">
            <div className="bg-gray-600 p-3 md:p-4 rounded-full">
              <Briefcase className="h-8 w-8 md:h-12 md:w-12 text-gray-200" />
            </div> 
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-200 leading-tight px-2">
            Don't Dread Cover Letters. Ace Them.
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-prepzo-100 max-w-3xl mx-auto px-4">
            Prepzo writes cover letters that sound like you — just more articulate, strategic, and aligned. 
            The right cover letter can make a hiring manager pause, not scroll past.
          </p>
        </section>

        <div className="space-y-8 md:space-y-12 pt-8 md:pt-20 pb-8 md:pb-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Main Feature Section */}
          <section className="space-y-6 md:space-y-8">
            <Card className="overflow-hidden">
              <CardHeader className="bg-primary/5 p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl">
                  <Briefcase className="h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-primary flex-shrink-0" />
                  <span>Cover Letter Generator</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
                <div className="grid lg:grid-cols-2 gap-6 md:gap-8 items-center">
                  <div className="space-y-3 md:space-y-4 order-2 lg:order-1">
                    <p className="text-gray-700 leading-relaxed text-sm md:text-base lg:text-lg">
                      Writing a cover letter from scratch is often the most dreaded part of applying. 
                      Prepzo makes it intuitive and authentic.
                    </p>
                    <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                      With your resume, the job you're applying for, and the tone of your past conversations 
                      with our voice agent, Prepzo drafts a cover letter that sounds like a confident, 
                      thoughtful version of <em>you</em>.
                    </p>
                  </div>
                  <div className="bg-primary/5 rounded-lg p-4 md:p-6 lg:p-8 text-center border border-primary/10 order-1 lg:order-2">
                    <div className="text-3xl md:text-4xl lg:text-6xl mb-3 md:mb-4">✍️</div>
                    <p className="text-xs md:text-sm text-gray-600 font-medium">Cover Letter Generator Interface</p>
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
                    <FileText className="h-4 w-4 md:h-5 md:w-5 text-green-700" />
                  </div>
                  <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                    A great cover letter connects the dots a CV can't
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-green-200 rounded-full p-2 flex-shrink-0">
                    <Target className="h-4 w-4 md:h-5 md:w-5 text-green-700" />
                  </div>
                  <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                    It shows thoughtfulness, preparation, and communication skill
                  </p>
                </div>
              </div>
              <div className="space-y-2 md:space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-green-200 rounded-full p-2 flex-shrink-0">
                    <Edit3 className="h-4 w-4 md:h-5 md:w-5 text-green-700" />
                  </div>
                  <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                    Ours are crafted to sound like you, not a template
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Features Comparison */}
          <section className="space-y-6 md:space-y-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-gray-900 px-2">
              Beyond Generic Templates
            </h2>
            <div className="grid lg:grid-cols-2 gap-4 md:gap-8">
              <Card className="p-4 md:p-6 bg-gray-50 border-gray-200">
                <h3 className="font-bold text-base md:text-lg mb-3 md:mb-4 text-gray-700">❌ Generic Templates</h3>
                <ul className="space-y-1 md:space-y-2 text-xs md:text-sm text-gray-700">
                  <li>• One-size-fits-all approach</li>
                  <li>• Robotic, impersonal language</li>
                  <li>• No job-specific customization</li>
                  <li>• Easily spotted by recruiters</li>
                  <li>• Doesn't reflect your personality</li>
                </ul>
              </Card>
              
              <Card className="p-4 md:p-6 bg-primary/5 border-primary/20">
                <h3 className="font-bold text-base md:text-lg mb-3 md:mb-4 text-primary">✅ Prepzo Cover Letters</h3>
                <ul className="space-y-1 md:space-y-2 text-xs md:text-sm text-gray-700">
                  <li>• Tailored to specific job requirements</li>
                  <li>• Authentic, personal voice</li>
                  <li>• Strategic positioning of your experience</li>
                  <li>• Professional yet conversational tone</li>
                  <li>• Reflects your unique background</li>
                </ul>
              </Card>
            </div>
          </section>

          {/* Optimization Features */}
          <section className="space-y-6 md:space-y-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-gray-900 px-2">
              Optimized For Maximum Impact
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <Card className="text-center p-4 md:p-6">
                <div className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2 md:mb-3 lg:mb-4">
                  <MessageSquare className="w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-green-600" />
                </div>
                <h3 className="font-bold text-sm md:text-base lg:text-lg mb-1 md:mb-2">Tone</h3>
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                  Matches your authentic voice and professional style
                </p>
              </Card>
              
              <Card className="text-center p-4 md:p-6">
                <div className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2 md:mb-3 lg:mb-4">
                  <Target className="w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-green-600" />
                </div>
                <h3 className="font-bold text-sm md:text-base lg:text-lg mb-1 md:mb-2">Clarity</h3>
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                  Clear, concise messaging that gets to the point
                </p>
              </Card>
              
              <Card className="text-center p-4 md:p-6">
                <div className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2 md:mb-3 lg:mb-4">
                  <Zap className="w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-green-600" />
                </div>
                <h3 className="font-bold text-sm md:text-base lg:text-lg mb-1 md:mb-2">Strategic Framing</h3>
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                  Positions your experience to match job requirements
                </p>
              </Card>
              
              <Card className="text-center p-4 md:p-6">
                <div className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2 md:mb-3 lg:mb-4">
                  <Edit3 className="w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-green-600" />
                </div>
                <h3 className="font-bold text-sm md:text-base lg:text-lg mb-1 md:mb-2">Authenticity</h3>
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                  Sounds like you, not a generic template
                </p>
              </Card>
            </div>
          </section>

          {/* How It Works */}
          <section className="bg-primary/5 p-4 md:p-6 lg:p-8 rounded-lg border-l-4 border-primary">
            <h3 className="font-bold text-gray-900 mb-3 md:mb-4 text-lg md:text-xl">How It Works</h3>
            <div className="grid md:grid-cols-3 gap-4 md:gap-6">
              <div className="text-center space-y-2 md:space-y-3">
                <div className="bg-primary/10 rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center mx-auto">
                  <span className="text-primary font-bold text-sm md:text-base">1</span>
                </div>
                <p className="text-gray-700 text-xs md:text-sm leading-relaxed">
                  Upload your resume (or use your last uploaded one)
                </p>
              </div>
              <div className="text-center space-y-2 md:space-y-3">
                <div className="bg-primary/10 rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center mx-auto">
                  <span className="text-primary font-bold text-sm md:text-base">2</span>
                </div>
                <p className="text-gray-700 text-xs md:text-sm leading-relaxed">
                  Enter the job title and job description
                </p>
              </div>
              <div className="text-center space-y-2 md:space-y-3">
                <div className="bg-primary/10 rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center mx-auto">
                  <span className="text-primary font-bold text-sm md:text-base">3</span>
                </div>
                <p className="text-gray-700 text-xs md:text-sm leading-relaxed">
                  Get your personalized draft, optimized for impact
                </p>
              </div>
            </div>
          </section>

          {/* Process Deep Dive */}
          <section className="bg-gradient-to-r from-gray-50 to-primary/5 rounded-xl p-4 md:p-6 lg:p-10 space-y-4 md:space-y-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-gray-900 px-2">
              The Science Behind Great Cover Letters
            </h2>
            <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
              <p className="text-gray-700 text-center leading-relaxed text-sm md:text-base px-2">
                Our AI analyzes thousands of successful cover letters to understand what makes recruiters pay attention. 
                Combined with your personal style and the specific job requirements, we create letters that stand out for all the right reasons.
              </p>
              <div className="grid md:grid-cols-3 gap-4 md:gap-6">
                <div className="text-center space-y-2 md:space-y-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2 md:mb-3 lg:mb-4">
                    <Target className="h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-sm md:text-base">Job Match Analysis</h3>
                  <p className="text-gray-600 text-xs md:text-sm leading-relaxed">We identify key requirements and align your experience accordingly</p>
                </div>
                <div className="text-center space-y-2 md:space-y-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2 md:mb-3 lg:mb-4">
                    <MessageSquare className="w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:w-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-sm md:text-base">Voice Adaptation</h3>
                  <p className="text-gray-600 text-xs md:text-sm leading-relaxed">Your past conversations help us match your authentic communication style</p>
                </div>
                <div className="text-center space-y-2 md:space-y-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2 md:mb-3 lg:mb-4">
                    <Edit3 className="w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-sm md:text-base">Strategic Structuring</h3>
                  <p className="text-gray-600 text-xs md:text-sm leading-relaxed">Perfect flow that builds interest and demonstrates fit</p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center space-y-4 md:space-y-6 py-6 md:py-8 px-4">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 px-2">
              Ready to Write Cover Letters That Get Noticed?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base leading-relaxed px-2">
              Stop dreading cover letters and start creating ones that open doors
            </p>
            <div className="pt-4 md:pt-6">
              <Button 
                onClick={handleGenerateCoverLetter}
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90 text-white px-6 md:px-8 py-2 md:py-3 text-sm md:text-base w-full sm:w-auto"
              >
                {isLoading ? "Loading..." : "Generate My Cover Letter"}
              </Button>
            </div>
          </section>
        </div>
      </div>
      <Footer/>
    </>
  );
};

export default CoverLetterGenerator;
