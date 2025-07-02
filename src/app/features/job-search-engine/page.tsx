import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Globe, Filter, Target } from "lucide-react";
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';

const JobSearchEngine = () => {
  return (
    <>
      <Navbar/>
      
      <div className="pt-4 md:pt-8">
        {/* Hero Section */}
        <section className="bg-prepzo text-center mt-10 space-y-6 md:space-y-12 py-10 md:py-20 px-4">
          <div className="flex justify-center mb-4 md:mb-6">
            <div className="bg-gray-600 p-3 md:p-4 rounded-full">
              <Search className="h-8 w-8 md:h-12 md:w-12 text-gray-200" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-200 leading-tight px-2">
            One Engine to Find Every Job on the Planet
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-200 max-w-3xl mx-auto px-4 leading-relaxed">
            Search across 16 global job platforms — all in one place. With over 25+ job filters, 
            our engine has tracked over 118 million jobs over 195 countries.
          </p>
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 px-4">
            <Badge variant="secondary" className="text-xs md:text-sm">16 Global Platforms</Badge>
            <Badge variant="secondary" className="text-xs md:text-sm">25+ Filters</Badge>
            <Badge variant="secondary" className="text-xs md:text-sm">118M+ Jobs</Badge>
            <Badge variant="secondary" className="text-xs md:text-sm">195 Countries</Badge>
          </div>
        </section>

        <div className="space-y-8 md:space-y-12 pt-8 md:pt-20 pb-8 md:pb-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Main Feature Section */}
          <section className="space-y-6 md:space-y-8">
            <Card className="overflow-hidden">
              <CardHeader className="bg-primary/5 p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-xl lg:text-2xl">
                  <Search className="h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-primary flex-shrink-0" />
                  <span>Powerful Job Search Engine</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
                <div className="grid lg:grid-cols-2 gap-6 md:gap-8 items-center">
                  <div className="space-y-3 md:space-y-4 order-2 lg:order-1">
                    <p className="text-gray-700 leading-relaxed text-sm md:text-base lg:text-lg">
                      No more jumping between tabs. Our intelligent engine finds you the most accurate, 
                      current, and location-specific roles for any keyword you enter.
                    </p>
                    <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                      From entry-level positions to executive roles, remote opportunities to on-site positions, 
                      our comprehensive search covers every type of job across all major industries.
                    </p>
                  </div>
                  <div className="bg-primary/5 rounded-lg p-4 md:p-6 lg:p-8 text-center border border-primary/10 order-1 lg:order-2">
                    <div className="text-3xl md:text-4xl lg:text-6xl mb-3 md:mb-4">🔍</div>
                    <p className="text-xs md:text-sm text-gray-600 font-medium">Advanced Job Search Interface</p>
                    <p className="text-xs text-gray-500 mt-1 md:mt-2">Walkthrough video coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Key Features Grid */}
          <section className="space-y-6 md:space-y-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-gray-900 px-2">
              Why Our Job Search Engine Stands Out
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <Card className="text-center p-4 md:p-6">
                <div className="bg-primary/10 rounded-full w-12 h-12 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <Globe className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
                <h3 className="font-bold text-sm md:text-base lg:text-lg mb-1 md:mb-2">Global Coverage</h3>
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                  Access jobs from 16 major platforms across 195 countries in one unified search
                </p>
              </Card>
              
              <Card className="text-center p-4 md:p-6">
                <div className="bg-primary/10 rounded-full w-12 h-12 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <Filter className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
                <h3 className="font-bold text-sm md:text-base lg:text-lg mb-1 md:mb-2">Advanced Filtering</h3>
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                  25+ precise filters for location, experience, salary, remote work, and more
                </p>
              </Card>
              
              <Card className="text-center p-4 md:p-6">
                <div className="bg-primary/10 rounded-full w-12 h-12 md:w-16 md:h-16 flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <Target className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
                <h3 className="font-bold text-sm md:text-base lg:text-lg mb-1 md:mb-2">Smart Matching</h3>
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                  AI-powered relevance scoring to show you the most suitable opportunities first
                </p>
              </Card>
            </div>
          </section>

          {/* How It Works */}
          <section className="bg-primary/5 rounded-xl p-4 md:p-6 lg:p-10 space-y-4 md:space-y-6 border border-primary/10">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-gray-900 px-2">
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
              <div className="text-center space-y-2 md:space-y-3">
                <div className="bg-primary text-white rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center mx-auto font-bold text-sm md:text-lg">1</div>
                <h3 className="font-semibold text-sm md:text-base">Search & Filter</h3>
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed">Enter your keywords and apply filters to narrow down results</p>
              </div>
              <div className="text-center space-y-2 md:space-y-3">
                <div className="bg-primary text-white rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center mx-auto font-bold text-sm md:text-lg">2</div>
                <h3 className="font-semibold text-sm md:text-base">Browse Results</h3>
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed">Review job listings with key details and relevance scores</p>
              </div>
              <div className="text-center space-y-2 md:space-y-3">
                <div className="bg-primary text-white rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center mx-auto font-bold text-sm md:text-lg">3</div>
                <h3 className="font-semibold text-sm md:text-base">Reveal Details</h3>
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed">Click Reveal to see full job details and application links</p>
              </div>
            </div>
          </section>

          {/* Pro Tips */}
          <section className="bg-primary/5 p-4 md:p-6 lg:p-8 rounded-lg border-l-4 border-primary">
            <h3 className="font-bold text-gray-900 mb-3 md:mb-4 text-base md:text-lg">💡 Pro Tips for Better Results</h3>
            <div className="grid md:grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm text-gray-700">
              <div className="space-y-1 md:space-y-2">
                <p className="leading-relaxed">• Use specific job titles rather than generic terms</p>
                <p className="leading-relaxed">• Apply location filters to find remote or local opportunities</p>
                <p className="leading-relaxed">• Set experience level filters to match your background</p>
              </div>
              <div className="space-y-1 md:space-y-2">
                <p className="leading-relaxed">• Save your search preferences for quick access</p>
                <p className="leading-relaxed">• Use the salary range filter to find roles in your target range</p>
                <p className="leading-relaxed">• Revealing jobs requires credits — use them strategically</p>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center space-y-4 md:space-y-6 py-6 md:py-8 px-4">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 px-2">
              Ready to Find Your Next Opportunity?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base leading-relaxed px-2">
              Start searching millions of jobs from around the world with our powerful engine
            </p>
            <div className="pt-4 md:pt-6">
              <Button className="bg-primary hover:bg-primary/90 text-white px-6 md:px-8 py-2 md:py-3 text-sm md:text-base lg:text-lg w-full sm:w-auto">
                Start Job Search
              </Button>
            </div>
          </section>
        </div>
      </div>
      <Footer/>
    </>
  );
};

export default JobSearchEngine;