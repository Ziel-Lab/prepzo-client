"use client";
import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const UseCasesSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="use-cases" ref={sectionRef} className="py-12 md:py-20">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-8 md:mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
            How <span className="text-gradient">Professionals Like You</span> Use Prepzo
          </h2>
          <p className="text-base md:text-lg text-foreground/70 max-w-2xl mx-auto mb-4 md:mb-6 px-2">
            See how Prepzo helps people in different career situations overcome their professional challenges.
          </p>
        </div>

        <div className={`fade-in-section ${isVisible ? 'is-visible' : ''}`}>
          <Tabs defaultValue="job-seeker" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 md:mb-8">
              <TabsTrigger value="job-seeker">Job Seeker</TabsTrigger>
              <TabsTrigger value="startup-founder">Startup Founder</TabsTrigger>
              <TabsTrigger value="career-growth">Career Growth</TabsTrigger>
            </TabsList>
            
            <TabsContent value="job-seeker">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-start">
                <div className="order-2 lg:order-1">
                  <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Find Your Dream Job</h3>
                  <p className="mb-3 md:mb-4 text-foreground/70 text-sm md:text-base">
                    When looking for a new job, Prepzo helps you:
                  </p>
                  <ul className="space-y-2 md:space-y-3 text-sm md:text-base">
                    <li className="flex items-start">
                      <div className="mr-2 md:mr-3 mt-1 w-4 h-4 md:w-5 md:h-5 bg-prepzo rounded-full flex items-center justify-center text-white text-xs">✓</div>
                      <span>Navigate 16+ global job portals of job openings with intelligent search filters</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-2 md:mr-3 mt-1 w-4 h-4 md:w-5 md:h-5 bg-prepzo rounded-full flex items-center justify-center text-white text-xs">✓</div>
                      <span>Generate ATS friendly resumes & cover letters within minutes.</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-2 md:mr-3 mt-1 w-4 h-4 md:w-5 md:h-5 bg-prepzo rounded-full flex items-center justify-center text-white text-xs">✓</div>
                      <span>Prepare for interviews & industry specific questions.</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-2 md:mr-3 mt-1 w-4 h-4 md:w-5 md:h-5 bg-prepzo rounded-full flex items-center justify-center text-white text-xs">✓</div>
                      <span>Optimize your linkedin to stand out from other applicants.</span>
                    </li>
                  </ul>
                </div>
                <Card className="overflow-hidden order-1 lg:order-2">
                  <CardContent className="p-0">
                    <div className="bg-muted p-4 md:p-8 space-y-3 md:space-y-4">
                      <div className="bg-background rounded-lg p-3 md:p-4 border border-border">
                        <p className="text-xs md:text-sm text-foreground/70 mb-1 md:mb-2">Voice conversation:</p>
                        <p className="text-sm md:text-base">I'm applying for a senior product manager role but haven't updated my resume in years.</p>
                      </div>
                      <div className="bg-prepzo/10 rounded-lg p-3 md:p-4 border border-prepzo/20">
                        <p className="text-xs md:text-sm text-foreground/70 mb-1 md:mb-2">Prepzo response:</p>
                        <p className="text-sm md:text-base">Let's optimize your resume for product management. Based on your LinkedIn, I see you led 3 product launches. Let's highlight those achievements with metrics to make your application stand out.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="startup-founder">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-start">
                <div className="order-2 lg:order-1">
                  <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Grow Your Startup</h3>
                  <p className="mb-3 md:mb-4 text-foreground/70 text-sm md:text-base">
                    As a startup founder, Prepzo helps you:
                  </p>
                  <ul className="space-y-2 md:space-y-3 text-sm md:text-base">
                    <li className="flex items-start">
                      <div className="mr-2 md:mr-3 mt-1 w-4 h-4 md:w-5 md:h-5 bg-prepzo rounded-full flex items-center justify-center text-white text-xs">✓</div>
                      <span>Develop effective pitch strategies for investors</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-2 md:mr-3 mt-1 w-4 h-4 md:w-5 md:h-5 bg-prepzo rounded-full flex items-center justify-center text-white text-xs">✓</div>
                      <span>Create compelling business plans and presentations</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-2 md:mr-3 mt-1 w-4 h-4 md:w-5 md:h-5 bg-prepzo rounded-full flex items-center justify-center text-white text-xs">✓</div>
                      <span>Build and manage effective teams</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-2 md:mr-3 mt-1 w-4 h-4 md:w-5 md:h-5 bg-prepzo rounded-full flex items-center justify-center text-white text-xs">✓</div>
                      <span>Navigate growth challenges with strategic advice</span>
                    </li>
                  </ul>
                </div>
                <Card className="overflow-hidden order-1 lg:order-2">
                  <CardContent className="p-0">
                    <div className="bg-muted p-4 md:p-8 space-y-3 md:space-y-4">
                      <div className="bg-background rounded-lg p-3 md:p-4 border border-border">
                        <p className="text-xs md:text-sm text-foreground/70 mb-1 md:mb-2">Voice conversation:</p>
                        <p className="text-sm md:text-base">I'm preparing to pitch to VCs next week and need help refining my presentation.</p>
                      </div>
                      <div className="bg-prepzo/10 rounded-lg p-3 md:p-4 border border-prepzo/20">
                        <p className="text-xs md:text-sm text-foreground/70 mb-1 md:mb-2">Prepzo response:</p>
                        <p className="text-sm md:text-base">Let's structure your pitch for maximum impact. We should lead with your traction metrics, then highlight market opportunity. I notice your competitive analysis slide needs more specificity on your unique advantages.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="career-growth">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-start">
                <div className="order-2 lg:order-1">
                  <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Advance Your Career</h3>
                  <p className="mb-3 md:mb-4 text-foreground/70 text-sm md:text-base">
                    For advancing in your current role, Prepzo helps you:
                  </p>
                  <ul className="space-y-2 md:space-y-3 text-sm md:text-base">
                    <li className="flex items-start">
                      <div className="mr-2 md:mr-3 mt-1 w-4 h-4 md:w-5 md:h-5 bg-prepzo rounded-full flex items-center justify-center text-white text-xs">✓</div>
                      <span>Navigate workplace challenges and conflicts</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-2 md:mr-3 mt-1 w-4 h-4 md:w-5 md:h-5 bg-prepzo rounded-full flex items-center justify-center text-white text-xs">✓</div>
                      <span>Prepare for performance reviews and salary negotiations</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-2 md:mr-3 mt-1 w-4 h-4 md:w-5 md:h-5 bg-prepzo rounded-full flex items-center justify-center text-white text-xs">✓</div>
                      <span>Build leadership skills and manage teams effectively</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-2 md:mr-3 mt-1 w-4 h-4 md:w-5 md:h-5 bg-prepzo rounded-full flex items-center justify-center text-white text-xs">✓</div>
                      <span>Create a personalized development plan for promotion</span>
                    </li>
                  </ul>
                </div>
                <Card className="overflow-hidden order-1 lg:order-2">
                  <CardContent className="p-0">
                    <div className="bg-muted p-4 md:p-8 space-y-3 md:space-y-4">
                      <div className="bg-background rounded-lg p-3 md:p-4 border border-border">
                        <p className="text-xs md:text-sm text-foreground/70 mb-1 md:mb-2">Voice conversation:</p>
                        <p className="text-sm md:text-base">I feel like my ideas are often overlooked in team meetings, which is affecting my confidence.</p>
                      </div>
                      <div className="bg-prepzo/10 rounded-lg p-3 md:p-4 border border-prepzo/20">
                        <p className="text-xs md:text-sm text-foreground/70 mb-1 md:mb-2">Prepzo response:</p>
                        <p className="text-sm md:text-base">I understand how frustrating that can be. Let's develop a communication strategy that will help your ideas get the attention they deserve. First, try sending a brief outline of your ideas before meetings, and second, practice assertive phrasing techniques like...</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        {/* <Link 
            href="/use-cases"
            className="inline-flex items-center gap-1 md:gap-2 text-prepzo hover:text-prepzo/90 transition-colors text-sm md:text-base"
          >
            View All Use Cases
            <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
          </Link> */}
      </div>
    </section>
  );
};

export default UseCasesSection;
