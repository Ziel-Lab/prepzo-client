"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, FileText, User, Search, Bot, Briefcase } from "lucide-react";
import Link from "next/link";
import { createClient } from '@/utils/supabase/client';
import Image from "next/image";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authStatusLoading, setAuthStatusLoading] = useState(true);
  const [isFeaturesOpen, setIsFeaturesOpen] = useState(false);
  const supabase = createClient();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeFeaturesDropdown = () => {
    setIsFeaturesOpen(false);
  };

  useEffect(() => {
    const checkUserSession = async () => {
      setAuthStatusLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setAuthStatusLoading(false);
    };

    checkUserSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      setAuthStatusLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-dropdown="features"]')) {
        setIsFeaturesOpen(false);
      }
    };

    if (isFeaturesOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isFeaturesOpen]);

  const loginTargetHref = "/auth/login";

  const featuresMenuItems = [
    {
      href: "/features/resume-analyser",
      icon: FileText,
              title: "Resume Generator",
      description: "AI-powered resume analysis and optimization"
    },
    {
      href: "/features/coverletter-generator", 
      icon: Briefcase,
      title: "Cover Letter Generator",
      description: "Create personalized, job-specific cover letters"
    },
    {
      href: "/features/linkedin-analyser",
      icon: User,
      title: "LinkedIn Optimizer", 
      description: "Optimize your LinkedIn profile for maximum impact"
    },
    {
      href: "/features/mock-interview",
      icon:  Bot,
      title: "Mock Interview",
      description: "Practice for your next interview with our AI agent"
    },
    // {
    //   href: "/features/job-search-engine",
    //   icon: Search,
    //   title: "Job Search Engine",
    //   description: "Search millions of jobs across global platforms"
    // }
  ];

  return (
    <nav className="fixed w-full bg-background/95 backdrop-blur-sm z-50 py-4 border-b border-border">
      <div className="container flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <Image src="/static/images/logo.svg" alt="Prepzo" width={140} height={140} />
            {/* <span className="text-2xl font-bold text-prepzo">Prepzo</span> */}
            {/* <span className="ml-2 text-xs py-0.5 px-2 bg-prepzo text-white rounded-full">Beta</span> */}
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {/* Features Dropdown */}
          <div 
            className="relative group"
            data-dropdown="features"
          >
            <button 
              onClick={() => setIsFeaturesOpen(!isFeaturesOpen)}
              className="text-foreground/80 hover:text-prepzo transition-all duration-300 hover:scale-105 relative group flex items-center gap-1"
            >
              <span>Features</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isFeaturesOpen ? 'rotate-180' : ''}`} />
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-prepzo transition-all duration-300 group-hover:w-full"></span>
            </button>
            
            {/* Dropdown Menu */}
            {isFeaturesOpen && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-background border border-border rounded-lg shadow-lg animate-fade-in z-50">
                {/* Close Button */}
                {/* <div className="flex justify-between items-center px-2 py-1">
                  <span className="text-sm font-medium text-foreground/80"></span>
                  <button
                    onClick={() => setIsFeaturesOpen(false)}
                    className="p-1 hover:bg-prepzo/10 rounded-md transition-colors"
                    aria-label="Close features menu"
                  >
                    <X className="h-4 w-4 text-foreground/60 hover:text-foreground" />
                  </button>
                </div> */}
                <div className="p-2">
                  {featuresMenuItems.map((item, index) => {
                    const IconComponent = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-start gap-3 p-3 rounded-md hover:bg-prepzo/10 transition-all duration-200 group"
                        onClick={closeFeaturesDropdown}
                      >
                        <div className="bg-prepzo/10 p-2 rounded-lg group-hover:bg-prepzo/20 transition-colors">
                          <IconComponent className="h-5 w-5 text-prepzo" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground group-hover:text-prepzo transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-sm text-foreground/60 leading-tight">
                            {item.description}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <Link href="/use-cases" className="text-foreground/80 hover:text-prepzo transition-all duration-300 hover:scale-105 relative group whitespace-nowrap">
            <span>Use Cases</span>
            {/* <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-prepzo transition-all duration-300 group-hover:w-full"></span> */}
          </Link>
          <Link href="/blogs" className="text-foreground/80 hover:text-prepzo transition-all duration-300 hover:scale-105 relative group">
            <span>Blog</span>
            {/* <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-prepzo transition-all duration-300 group-hover:w-full"></span> */}
          </Link>
          <Link href="/universities" className="text-foreground/80 hover:text-prepzo transition-all duration-300 hover:scale-105 relative group">
            <span>For Universities</span>
            {/* <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-prepzo transition-all duration-300 group-hover:w-full"></span> */}
          </Link>
          <Link href="/#pricing" className="text-foreground/80 hover:text-prepzo transition-all duration-300 hover:scale-105 relative group">
            <span>Pricing</span>
            {/* <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-prepzo transition-all duration-300 group-hover:w-full"></span> */}
          </Link>
          <Link href="/contact" className="text-foreground/80 hover:text-prepzo transition-all duration-300 hover:scale-105 relative group">
            <span>Contact</span>
            {/* <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-prepzo transition-all duration-300 group-hover:w-full"></span> */}
          </Link>
          {/* <Link href="https://www.prepzo.ai/" target="_blank" className="text-foreground/80 hover:text-prepzo transition-all duration-300 hover:scale-105 relative group">
            <span>Legacy Prepzo</span>
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-prepzo transition-all duration-300 group-hover:w-full"></span>
          </Link> */}
          
          <Link href={isAuthenticated ? "/dashboard" : "/auth/sign-up"}>
            <Button className="bg-prepzo hover:bg-prepzo-light text-white w-full">
              {isAuthenticated ? "Dashboard" : "Sign Up"}
            </Button>
          </Link>
          {/* <Link href={loginTargetHref} passHref>
            <Button className="bg-prepzo hover:bg-prepzo-light text-white w-full" disabled={authStatusLoading}>
              {authStatusLoading ? "Loading..." : "Login"}
            </Button>
          </Link> */}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <Button variant="ghost" size="icon" onClick={toggleMenu} aria-label="Toggle Menu" disabled={authStatusLoading}>
            {isMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden fixed top-[72px] left-0 right-0 h-[calc(100vh-72px)] bg-background border-b border-border animate-fade-in overflow-y-auto">
          <div className="container flex flex-col py-6 space-y-6">
            {/* Mobile Features Section */}
            <div className="space-y-3">
              <div className="text-foreground/60 font-medium px-3">Features</div>
              {featuresMenuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-4 text-foreground/80 hover:text-prepzo hover:bg-prepzo/10 transition-all duration-200 py-3 px-4 rounded-lg active:bg-prepzo/20"
                    onClick={toggleMenu}
                  >
                    <div className="bg-prepzo/10 p-2 rounded-lg">
                      <IconComponent className="h-5 w-5 text-prepzo" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{item.title}</span>
                      <span className="text-sm text-foreground/60">{item.description}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
            
            <div className="border-t border-border pt-6 space-y-2">
              <Link href="/use-cases" className="block text-foreground/80 hover:text-prepzo hover:bg-prepzo/10 transition-all duration-200 py-3 px-4 rounded-lg active:bg-prepzo/20" onClick={toggleMenu}>
                Use Cases
              </Link>
              <Link href="/blogs" className="block text-foreground/80 hover:text-prepzo hover:bg-prepzo/10 transition-all duration-200 py-3 px-4 rounded-lg active:bg-prepzo/20" onClick={toggleMenu}>
                Blogs
              </Link>
              <Link href="/universities" className="block text-foreground/80 hover:text-prepzo hover:bg-prepzo/10 transition-all duration-200 py-3 px-4 rounded-lg active:bg-prepzo/20" onClick={toggleMenu}>
                For Universities
              </Link>
              <Link href="/#pricing" className="block text-foreground/80 hover:text-prepzo hover:bg-prepzo/10 transition-all duration-200 py-3 px-4 rounded-lg active:bg-prepzo/20" onClick={toggleMenu}>
                Pricing
              </Link>
              <Link href="/contact" className="block text-foreground/80 hover:text-prepzo hover:bg-prepzo/10 transition-all duration-200 py-3 px-4 rounded-lg active:bg-prepzo/20" onClick={toggleMenu}>
                Contact
              </Link>
            </div>
            
            <div className="border-t border-border pt-6 px-4">
              <Link href={isAuthenticated ? "/dashboard" : "/auth/sign-up"} className="w-full" onClick={toggleMenu}>
                <Button className="bg-prepzo hover:bg-prepzo-light text-white w-full py-6 text-lg font-medium rounded-lg">
                  {isAuthenticated ? "Dashboard" : "Sign Up"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

