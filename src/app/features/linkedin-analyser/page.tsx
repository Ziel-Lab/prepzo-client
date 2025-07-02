import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Eye, MessageSquare, TrendingUp, CheckCircle } from "lucide-react";
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';

const LinkedInAnalyzer = () => {
  return (
    <>
      <Navbar/>
      
      <div className="pt-4 md:pt-8">
        {/* Hero Section */}
        <section className="bg-prepzo text-center mt-10 space-y-6 md:space-y-12 py-10 md:py-20 px-4">
          <div className="flex justify-center mb-4 md:mb-6">
            <div className="bg-gray-600 p-3 md:p-4 rounded-full">
              <User className="h-8 w-8 md:h-12 md:w-12 text-gray-200" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-200 leading-tight px-2">
            Your Profile is a Conversation, Not a Billboard
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-200 max-w-3xl mx-auto px-4 leading-relaxed">
            Paste your LinkedIn profile link. Get industry-standard analysis of your profile's relevance, 
            clarity, and opportunities to improve authenticity and discoverability.
          </p>
        </section>

        <div className="space-y-8 md:space-y-12 pt-8 md:pt-20 pb-8 md:pb-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Main Feature Section */}
          <section className="space-y-6 md:space-y-8">
            <Card className="overflow-hidden">
              <CardHeader className="bg-primary/5 p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl lg:text-2xl">
                  <User className="h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-primary flex-shrink-0" />
                  <span>LinkedIn Profile Analyzer</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
                <div className="grid lg:grid-cols-2 gap-6 md:gap-8 items-center">
                  <div className="space-y-3 md:space-y-4 order-2 lg:order-1">
                    <p className="text-gray-700 leading-relaxed text-sm md:text-base lg:text-lg">
                      Paste your profile link. Based on industry best practices and your conversations with Prepzo, we'll assess:
                    </p>
                    <ul className="space-y-2 md:space-y-3 text-gray-700">
                      <li className="flex items-start gap-2 md:gap-3">
                        <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm md:text-base">Your profile's relevance to your target roles</span>
                      </li>
                      <li className="flex items-start gap-2 md:gap-3">
                        <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm md:text-base">Clarity of your headline and summary</span>
                      </li>
                      <li className="flex items-start gap-2 md:gap-3">
                        <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm md:text-base">Opportunities to improve authenticity and discoverability</span>
                      </li>
                    </ul>
                    <p className="text-gray-700 leading-relaxed italic text-sm md:text-base">
                      A LinkedIn profile should feel like meeting you, not scanning your bio. 
                      It's one of the most overlooked tools in modern careers.
                    </p>
                  </div>
                  <div className="bg-primary/5 rounded-lg p-4 md:p-6 lg:p-8 text-center border border-primary/10 order-1 lg:order-2">
                    <div className="text-3xl md:text-4xl lg:text-6xl mb-3 md:mb-4">💼</div>
                    <p className="text-xs md:text-sm text-gray-600 font-medium">LinkedIn Profile Analysis</p>
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
                    <Eye className="h-4 w-4 md:h-5 md:w-5 text-green-700" />
                  </div>
                  <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                    Recruiters often check your <strong> LinkedIn</strong> before your <strong>CV</strong>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-green-200 rounded-full p-2 flex-shrink-0">
                    <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-700" />
                  </div>
                  <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                    Inconsistencies between your CV and LinkedIn can cost you <strong>credibility</strong>
                  </p>
                </div>
              </div>
              <div className="space-y-2 md:space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-green-200 rounded-full p-2 flex-shrink-0">
                    <MessageSquare className="h-4 w-4 md:h-5 md:w-5 text-green-700" />
                  </div>
                  <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                    A well-written <strong>About</strong> section is more powerful than 50 endorsements
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Analysis Areas */}
          <section className="space-y-6 md:space-y-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-gray-900 px-2">
              What We Analyze
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <Card className="text-center p-4 md:p-6">
                <div className="bg-primary/10 rounded-full w-12 h-12 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <User className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
                <h3 className="font-bold text-sm md:text-base lg:text-lg mb-1 md:mb-2">Professional Headline</h3>
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                  Optimize your headline to clearly communicate your value proposition
                </p>
              </Card>
              
              <Card className="text-center p-4 md:p-6">
                <div className="bg-primary/10 rounded-full w-12 h-12 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <MessageSquare className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
                <h3 className="font-bold text-sm md:text-base lg:text-lg mb-1 md:mb-2">About Section</h3>
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                  Craft a compelling story that showcases your personality and expertise
                </p>
              </Card>
              
              <Card className="text-center p-4 md:p-6">
                <div className="bg-primary/10 rounded-full w-12 h-12 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
                <h3 className="font-bold text-sm md:text-base lg:text-lg mb-1 md:mb-2">Experience Details</h3>
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                  Ensure your experience section tells a cohesive career story
                </p>
              </Card>
              
              <Card className="text-center p-4 md:p-6">
                <div className="bg-primary/10 rounded-full w-12 h-12 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <Eye className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
                <h3 className="font-bold text-sm md:text-base lg:text-lg mb-1 md:mb-2">Profile Visibility</h3>
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                  Optimize for search algorithms and recruiter discovery
                </p>
              </Card>
              
              <Card className="text-center p-4 md:p-6">
                <div className="bg-primary/10 rounded-full w-12 h-12 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
                <h3 className="font-bold text-sm md:text-base lg:text-lg mb-1 md:mb-2">Skills & Keywords</h3>
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                  Strategic placement of relevant industry keywords and skills
                </p>
              </Card>
              
              <Card className="text-center p-4 md:p-6">
                <div className="bg-primary/10 rounded-full w-12 h-12 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <User className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
                <h3 className="font-bold text-sm md:text-base lg:text-lg mb-1 md:mb-2">Professional Image</h3>
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                  Guidance on profile photo and overall brand consistency
                </p>
              </Card>
            </div>
          </section>

          {/* How It Works */}
          <section className="bg-primary/5 rounded-xl p-4 md:p-6 lg:p-10 space-y-4 md:space-y-6 border border-primary/10">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-gray-900 px-2">
              Simple 3-Step Process
            </h2>
            <div className="grid md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
              <div className="text-center space-y-2 md:space-y-3">
                <div className="bg-primary text-white rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center mx-auto font-bold text-sm md:text-lg">1</div>
                <h3 className="font-semibold text-sm md:text-base">Share Your Profile</h3>
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed">Simply paste your LinkedIn profile URL</p>
              </div>
              <div className="text-center space-y-2 md:space-y-3">
                <div className="bg-primary text-white rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center mx-auto font-bold text-sm md:text-lg">2</div>
                <h3 className="font-semibold text-sm md:text-base">AI Analysis</h3>
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed">Our AI analyzes your profile against industry best practices</p>
              </div>
              <div className="text-center space-y-2 md:space-y-3">
                <div className="bg-primary text-white rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center mx-auto font-bold text-sm md:text-lg">3</div>
                <h3 className="font-semibold text-sm md:text-base">Get Recommendations</h3>
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed">Receive actionable insights to improve your professional presence</p>
              </div>
            </div>
          </section>

          {/* Tips Section */}
          <section className="bg-primary/5 p-4 md:p-6 lg:p-8 rounded-lg border-l-4 border-primary">
            <h3 className="font-bold text-gray-900 mb-3 md:mb-4 text-base md:text-lg">💡 LinkedIn Optimization Tips</h3>
            <div className="grid md:grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm text-gray-700">
              <div className="space-y-1 md:space-y-2">
                <p className="leading-relaxed">• Use industry-specific keywords in your headline and summary</p>
                <p className="leading-relaxed">• Write in first person to create a personal connection</p>
                <p className="leading-relaxed">• Include quantifiable achievements in your experience</p>
              </div>
              <div className="space-y-1 md:space-y-2">
                <p className="leading-relaxed">• Keep your profile photo professional and current</p>
                <p className="leading-relaxed">• Engage with content in your industry regularly</p>
                <p className="leading-relaxed">• Customize your LinkedIn URL for better discoverability</p>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center space-y-4 md:space-y-6 py-6 md:py-8 px-4">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 px-2">
              Ready to Optimize Your LinkedIn Profile?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base leading-relaxed px-2">
              Transform your LinkedIn profile into a powerful networking and job-seeking asset
            </p>
            <div className="pt-4 md:pt-6">
              <Button className="bg-primary hover:bg-primary/90 text-white px-6 md:px-8 py-2 md:py-3 text-sm md:text-base lg:text-lg w-full sm:w-auto">
                Analyze My LinkedIn
              </Button>
            </div>
          </section>
        </div>
      </div>
      <Footer/>
    </>
  );
};

export default LinkedInAnalyzer;