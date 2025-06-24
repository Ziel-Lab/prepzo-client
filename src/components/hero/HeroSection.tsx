"use client"; // Need client component for state and event handlers

import React from "react"; 
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import { createClient } from '@/utils/supabase/client';
import Image from "next/image";

// Define props for HeroSection
interface HeroSectionProps {
  onOpenAgentModal: () => void; // Add the new prop type
}

const HeroSection: React.FC<HeroSectionProps> = ({ onOpenAgentModal }) => { 

  const customerAvatars = [
    "/lovable-uploads/d6cf8351-91e5-4791-b2a5-f113b99c59d5.png",
    "/lovable-uploads/2c25799c-1e84-4207-a304-eb24f635dd3a.png",
    "/lovable-uploads/c7946da5-ad4d-4d4e-9a72-2929a62551db.png",
    "/lovable-uploads/d611d3b0-8ca3-42f4-81e4-78a7f787b870.png",
    "/lovable-uploads/941a96f8-537c-4f68-9ffb-e125224f7a9f.png"
  ];
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authStatusLoading, setAuthStatusLoading] = useState(true);
  const supabase = createClient();

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

  return (
    <section className="pt-32 pb-20 sm:pt-48 sm:pb-32 bg-prepzo overflow-hidden">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-slide-up" style={{
          '--delay': '0'
        } as React.CSSProperties}>
            <div className="inline-block py-2 text-white/90 rounded-full font-medium flex items-center gap-2 px-0">
               <div className="flex -space-x-3">
                 {customerAvatars.map((src, index) => <Avatar key={index} className="w-8 h-8 border-2 border-white">
                     <AvatarImage src={src} alt={`Customer ${index + 1}`} />
                     <AvatarFallback>
                       <Users className="w-4 h-4 text-white" />
                     </AvatarFallback>
                   </Avatar>)}
               </div>
               Join 400+ loving customers
             </div>
             
             <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white">
               Your All-in one <span className="bg-gradient-to-r from-prepzo-100 via-prepzo-300 to-prepzo-500 bg-clip-text text-transparent font-extrabold"><br/>AI Partner</span> for Job search & Career Success
             </h1>
             <p className="text-lg md:text-xl text-white/80">
             From powerful job search tools to AI-optimized resumes, cover letters, and
             LinkedIn profiles – Prepzo.ai empowers your career journey.
             </p>

            <div className="flex gap-3">
              <Link href={isAuthenticated ? "/dashboard" : "/auth/sign-up"}>
                <Button className="bg-white text-prepzo border border-prepzo hover:bg-gray-100 w-full px-8 py-3">
                  Get Started
                </Button>
              </Link>
              {/* Button uses the passed-in handler */}
              <Button 
                variant="outline" 
                className="border-white rounded bg-[#32874d] text-slate-50 hover:bg-[#32874d]/90 hover:text-slate-50 px-10"
                onClick={onOpenAgentModal} // Use the prop here
              >
                Try Demo
              </Button>
            </div>
            <p className="text-sm text-white/60">
              No credit card required. Start your free demo now.
            </p>
          </div>

          <div className="relative animate-slide-up" style={{
           '--delay': '2'
         } as React.CSSProperties}>
             <Image 
               alt="Career assessment showing Strategic Thinking, Adaptability, and Negotiation skills" 
               className="" 
               src="/lovable-uploads/cdfc3f3c-da0c-41c4-b46f-f3d647cdcfa3.png" 
               width={1000}
               height={1000}
             />
           </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
