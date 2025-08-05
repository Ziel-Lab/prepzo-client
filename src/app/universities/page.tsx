import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { 
  Rocket, 
  FileText, 
  Linkedin, 
  MessageSquare, 
  BarChart3,
  Users,
  Zap,
  Star,
  Phone,
  Brain,
  LineChart,
  Globe,
  Headphones,
  GraduationCap,
  Search,
  TrendingUp
} from "lucide-react";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
import universityGraduation from "./../../../public/static/images/university-graduation.jpg";
import careerServices from "./../../../public/static/images/career-services.jpg";
import jobFair from "./../../../public/static/images/job-fair.jpg";
import Image from "next/image";
import campusLife from "./../../../public/static/images/campus-life.jpg";
import Link from "next/link";

const Universities = () => {
  const offerings = [
    {
      icon: FileText,
      title: "AI-powered ATS-Ready Resumes & Cover Letters",
      description: "Role-specific, industry-aligned, and optimized for global hiring standards.",
      impact: "95% ATS compatibility rate"
    },
    {
      icon: Linkedin,
      title: "LinkedIn Profile Analyzer",
      description: "Turn a passive profile into an active recruiter magnet with optimization tools and insights.",
      impact: "3x more profile views"
    },
    {
      icon: MessageSquare,
      title: "Mock Interviews & Negotiation Prep",
      description: "Practice, feedback, and confidence to handle real-life interviews and offers.",
      impact: "87% interview success rate"
    },
    {
      icon: Globe,
      title: "Global Job Search Engine",
      description: "Scans 17+ job boards, syncing with a student's context to surface best-fit roles.",
      impact: "50% faster job placement"
    },
    {
      icon: Brain,
      title: "Continuous Professional Growth",
      description: "Coaching beyond the job hunt — from leadership to workplace wellbeing.",
      impact: "25% higher career satisfaction"
    },
    {
      icon: Headphones,
      title: "Voice-First Career Coach (Coming Soon)",
      description: "24/7 AI-powered conversations help students navigate applications, interviews, and pivots.",
      impact: "200+ career paths explored"
    }
  ];

  const benefits = [
    {
      icon: LineChart,
      title: "Boosts Employability Rates",
      description: "Students get personalized guidance, more callbacks, and better job matches.",
      stat: "92% employment rate within 6 months"
    },
    {
      icon: BarChart3,
      title: "Data-Backed Insights",
      description: "Faculty access analytics on student engagement, success trends, and areas for curriculum improvement.",
      stat: "Real-time analytics dashboard"
    },
    {
      icon: Users,
      title: "Complements, Doesn't Compete",
      description: "Prepzo's AI acts as a co-pilot to human counselors, extending your reach and freeing you to focus on the human touch.",
      stat: "24/7 AI support availability"
    },
    {
      icon: Zap,
      title: "Seamless Integration",
      description: "White-label branding, single sign-on, LMS plugins — no heavy lift to onboard.",
      stat: "Setup in under 48 hours"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar/>
      {/* Hero Section with Background Image */}
      <section className="relative bg-prepzo text-white min-h-[90vh] sm:min-h-[80vh] flex items-center py-20 sm:py-24 lg:py-32">
        <Image
          src={campusLife}
          alt="Career Services Background"
          fill
          priority
          className="object-cover object-center"
          style={{ 
            filter: 'brightness(0.9)'
          }}
        />
        <div className="absolute inset-0 bg-prepzo/80" />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 mb-6 mx-auto lg:mx-0">
                <Rocket className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span className="text-sm sm:text-base">Empowering Students. Elevating Institutions.</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                Better ROI on Education Through Career Success
              </h1>
              <p className="text-base sm:text-lg opacity-90 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Students invest $10,000–$50,000+ on tuition, yet up to 50% graduate without clear pathways to meaningful work. Prepzo bridges this gap as a lifelong career companion.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/contact" className="w-full sm:w-auto">
                  <Button size="lg" className="bg-white text-prepzo hover:bg-prepzo-50 px-8 py-6 w-full text-lg font-medium">
                    <Phone className="w-5 h-5 mr-3" />
                    Book a Demo
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative z-10 mt-8 lg:mt-0 hidden sm:block">
              <div className="relative overflow-hidden max-w-2xl mx-auto">
                <Image
                  src={universityGraduation}
                  alt="University graduation ceremony"
                  width={600}
                  height={400}
                  className="w-full h-auto rounded-2xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Offer Section with Images */}
      <section className="py-16 sm:py-20 lg:py-28 bg-gradient-to-br from-prepzo-50/30 to-prepzo-100/20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6">
              What Prepzo Delivers for Students
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive tools and guidance for career success
            </p>
          </div>
          
          {/* First Row */}
          <div className="space-y-12">
            {/* First Row */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
              <div className="space-y-6 order-2 lg:order-1">
                {offerings.slice(0, 3).map((offering, index) => (
                  <Card key={index} className="border-border hover:shadow-lg transition-all duration-300 hover:border-prepzo/30">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
                        <div className="w-12 h-12 bg-prepzo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <offering.icon className="w-6 h-6 text-prepzo" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-3">{offering.title}</h3>
                          <p className="text-base text-muted-foreground mb-4">{offering.description}</p>
                          <Badge variant="outline" className="text-prepzo border-prepzo/30 text-sm">
                            <Star className="w-3 h-3 mr-2" />
                            {offering.impact}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="relative order-1 lg:order-2">
                <Image
                  src={careerServices}
                  alt="Students working with career services"
                  width={600}
                  height={400}
                  className="rounded-2xl shadow-2xl w-full h-auto"
                />
              </div>
            </div>

            {/* Second Row */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
              <div className="space-y-6">
                {offerings.slice(3, 6).map((offering, index) => (
                  <Card key={index} className="border-border hover:shadow-lg transition-all duration-300 hover:border-prepzo/30">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
                        <div className="w-12 h-12 bg-prepzo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <offering.icon className="w-6 h-6 text-prepzo" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-3">{offering.title}</h3>
                          <p className="text-base text-muted-foreground mb-4">{offering.description}</p>
                          <Badge variant="outline" className="text-prepzo border-prepzo/30 text-sm">
                            <Star className="w-3 h-3 mr-2" />
                            {offering.impact}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="relative">
                <Image
                  src={jobFair}
                  alt="University job fair networking"
                  width={600}
                  height={400}
                  className="rounded-2xl shadow-2xl w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Student Journey Section */}
      <section className="py-16 sm:py-20 lg:py-28 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              The Student Journey: How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Prepzo combines AI voice technology with career expertise to provide guidance when you need it most.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Internship Search Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-border/50 hover:border-prepzo/30 transition-all duration-300">
              <div className="bg-prepzo-50/20 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <Search className="w-7 h-7 text-prepzo" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Internship Search</h3>
              <p className="text-muted-foreground text-base leading-relaxed">
                Targeted resumes, smart job matching, and outreach templates.
              </p>
            </div>

            {/* Final-Year Transition Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-border/50 hover:border-prepzo/30 transition-all duration-300">
              <div className="bg-prepzo-50/20 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <GraduationCap className="w-7 h-7 text-prepzo" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Final-Year Transition</h3>
              <p className="text-muted-foreground text-base leading-relaxed">
                Mock interviews, negotiation prep, and personal branding feedback.
              </p>
            </div>

            {/* Early Career Launch Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-border/50 hover:border-prepzo/30 transition-all duration-300">
              <div className="bg-prepzo-50/20 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7 text-prepzo" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Early Career Launch</h3>
              <p className="text-muted-foreground text-base leading-relaxed">
                Ongoing coaching for role changes, leadership growth, and career pivots.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Career Services Love Us */}
      <section className="py-16 sm:py-20 lg:py-28 bg-gradient-to-br from-prepzo-50/30 to-prepzo-100/20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6">
              Why Faculty & Career Services Choose Prepzo
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              Empowering institutions to deliver better career outcomes
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-border bg-white/50 backdrop-blur-sm">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">{benefit.title}</h3>
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-3 sm:mb-4">{benefit.description}</p>
                      <Badge className="bg-prepzo-50 text-prepzo text-sm">
                        {benefit.stat}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 sm:py-24 lg:py-32 text-white min-h-[80vh] flex items-center">
        <Image
          src={careerServices}
          alt="Career Services Background"
          fill
          className="object-cover object-center"
          style={{ 
            filter: 'brightness(0.8)'
          }}
        />
        <div className="absolute inset-0 bg-prepzo/90" />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Let's Build Careers Together
            </h2>
            <p className="text-lg text-white/90 mb-12 leading-relaxed">
              Contact our University Partnerships team to craft a plan that scales with your needs
            </p>
            
            <div className="grid sm:grid-cols-2 gap-6 mb-12">
              <div className="bg-prepzo-dark/50 backdrop-blur-sm rounded-2xl p-8 hover:bg-prepzo-dark/60 transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-2xl sm:text-3xl">🎯</span>
                  <h3 className="text-xl font-semibold">See It Live</h3>
                </div>
                <p className="text-base text-white/80 leading-relaxed">
                  Experience how Prepzo's conversational AI works, explore the student dashboard, and discover integration options.
                </p>
              </div>
              <div className="bg-prepzo-dark/50 backdrop-blur-sm rounded-2xl p-8 hover:bg-prepzo-dark/60 transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-2xl sm:text-3xl">🤝</span>
                  <h3 className="text-xl font-semibold">A Shared Promise</h3>
                </div>
                <p className="text-base text-white/80 leading-relaxed">
                  Higher employability stats, stronger industry connections, and a clear edge in the talent market.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="w-full sm:w-auto">
                <Button size="lg" className="bg-white text-prepzo hover:bg-gray-100 px-8 py-6 text-lg font-medium w-full">
                  <Phone className="w-5 h-5 mr-3" />
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer/>
    </div>
  );
};

export default Universities;