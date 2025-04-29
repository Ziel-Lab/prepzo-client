"use client"; // Need client component for state and event handlers

import React, { useState } from "react";
import { useRouter } from 'next/navigation'; // Import useRouter
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Users } from "lucide-react";
// import DemoDialog from "./DemoDialog"; // This was the old Shadcn dialog
import AgentModal from "@/components/modal/agentmodal"; // Import the converted AgentModal

const VoiceWave = () => {
  return <div className="flex items-center justify-center gap-1 h-12">
      {[...Array(5)].map((_, i) => <div key={i} className="wave-animation" style={{
      '--delay': i
    } as React.CSSProperties}>
          <span className="bg-prepzo/80 w-1.5 h-8 rounded-full inline-block"></span>
        </div>)}
    </div>;
};

const HeroSection = () => {
  const router = useRouter(); // Initialize the router
  const [email, setEmail] = useState("");
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false); // State for AgentModal

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Demo requested with email:", email);
  };
  
  const customerAvatars = [
    "/lovable-uploads/d6cf8351-91e5-4791-b2a5-f113b99c59d5.png",
    "/lovable-uploads/2c25799c-1e84-4207-a304-eb24f635dd3a.png",
    "/lovable-uploads/c7946da5-ad4d-4d4e-9a72-2929a62551db.png",
    "/lovable-uploads/d611d3b0-8ca3-42f4-81e4-78a7f787b870.png",
    "/lovable-uploads/941a96f8-537c-4f68-9ffb-e125224f7a9f.png"
  ];

  const handleStartTalking = () => {
    console.log("Start Talking action initiated, navigating to LiveKit session...");
    // Navigate to the LiveKit session page
    router.push('/livekit-session'); 
  };

  return (
    <section className="pt-48 pb-32 bg-prepzo overflow-hidden">
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
               Get personalized <span className="bg-gradient-to-r from-prepzo-100 via-prepzo-300 to-prepzo-500 bg-clip-text text-transparent font-extrabold">career guidance</span> through conversations
             </h1>
             <p className="text-lg md:text-xl text-white/80">
               Talk to Prepzo, an AI voice agent that provides tailored strategies for your professional challenges, job search, and career growth.
             </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="bg-white text-prepzo hover:bg-white/90 rounded">
                Sign Up
              </Button>
              {/* Button to trigger AgentModal */}
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white rounded bg-[#32874d] text-slate-50 hover:bg-[#32874d]/90 hover:text-slate-50"
                onClick={() => setIsAgentModalOpen(true)} // Open the AgentModal
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
             <img 
               alt="Career assessment showing Strategic Thinking, Adaptability, and Negotiation skills" 
               className="" 
               src="/lovable-uploads/cdfc3f3c-da0c-41c4-b46f-f3d647cdcfa3.png" 
             />
           </div>
        </div>
      </div>

      {/* Render the AgentModal, controlled by state */}
      <AgentModal 
        isOpen={isAgentModalOpen} 
        onClose={() => setIsAgentModalOpen(false)} 
        onStartTalking={handleStartTalking}
      />
    </section>
  );
};

export default HeroSection;
