"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { createClient } from '@/utils/supabase/client';
import Image from "next/image";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authStatusLoading, setAuthStatusLoading] = useState(true);
  const supabase = createClient();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
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

  const loginTargetHref = "/auth/login";

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
          <Link href="/#features" className="text-foreground/80 hover:text-prepzo transition-all duration-300 hover:scale-105 relative group">
            <span>Features</span>
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-prepzo transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link href="/use-cases" className="text-foreground/80 hover:text-prepzo transition-all duration-300 hover:scale-105 relative group whitespace-nowrap">
            <span>Use Cases</span>
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-prepzo transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link href="/blogs" className="text-foreground/80 hover:text-prepzo transition-all duration-300 hover:scale-105 relative group">
            <span>Blogs</span>
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-prepzo transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link href="/contact" className="text-foreground/80 hover:text-prepzo transition-all duration-300 hover:scale-105 relative group">
            <span>Contact</span>
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-prepzo transition-all duration-300 group-hover:w-full"></span>
          </Link>
          {/* <Link href="https://www.prepzo.ai/" target="_blank" className="text-foreground/80 hover:text-prepzo transition-all duration-300 hover:scale-105 relative group">
            <span>Legacy Prepzo</span>
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-prepzo transition-all duration-300 group-hover:w-full"></span>
          </Link> */}
          
          <Link href={isAuthenticated ? "/dashboard" : "/auth/sign-up"}>
            <Button className="bg-prepzo hover:bg-prepzo-light text-white w-full">
              Sign Up
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
        <div className="md:hidden absolute w-full bg-background border-b border-border animate-fade-in">
          <div className="container flex flex-col py-4 space-y-4">
            <Link href="/#features" className="text-foreground/80 hover:text-prepzo hover:bg-prepzo/10 transition-all duration-300 py-2 px-3 rounded-md hover:translate-x-2" onClick={toggleMenu}>
              Features
            </Link>
            <Link href="/use-cases" className="text-foreground/80 hover:text-prepzo hover:bg-prepzo/10 transition-all duration-300 py-2 px-3 rounded-md hover:translate-x-2" onClick={toggleMenu}>
              Use Cases
            </Link>
            <Link href="/blogs" className="text-foreground/80 hover:text-prepzo hover:bg-prepzo/10 transition-all duration-300 py-2 px-3 rounded-md hover:translate-x-2" onClick={toggleMenu}>
              Blogs
            </Link>
            <Link href="/contact" className="text-foreground/80 hover:text-prepzo hover:bg-prepzo/10 transition-all duration-300 py-2 px-3 rounded-md hover:translate-x-2" onClick={toggleMenu}>
              Contact
            </Link>
            
            <Link href={isAuthenticated ? "/dashboard" : "/auth/sign-up"} className="w-full" onClick={toggleMenu}>
              <Button className="bg-prepzo hover:bg-prepzo-light text-white w-full">
                Sign Up
              </Button>
            </Link>
            {/* <Link href={loginTargetHref} className="w-full" onClick={toggleMenu}>
              <Button className="bg-prepzo hover:bg-prepzo-light text-white w-full" disabled={authStatusLoading}>
                {authStatusLoading ? "Loading..." : "Login"}
              </Button>
            </Link> */}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

