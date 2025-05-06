"use client"; 

import { useState } from "react";
import { useRouter } from 'next/navigation';
import Navbar from "@/components/navbar/Navbar";
import HeroSection from "@/components/hero/HeroSection";
import FeaturesSection from "@/components/features/FeaturesSection";
import UseCasesSection from "@/components/usecases/UseCasesSection";
import DemoForm from "@/components/faq/DemoForm";
import Footer from "@/components/footer/Footer";
import AgentModal from "@/components/modal/agentmodal";

const HomePage = () => {
  const router = useRouter();
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);

  const handleStartTalking = () => {
    console.log("Start Talking action initiated from HomePage, navigating to LiveKit session...");
    router.push('/prepzo-session'); 
  };
  
  const handleOpenAgentModal = () => {
    setIsAgentModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <HeroSection onOpenAgentModal={handleOpenAgentModal} />
        <FeaturesSection />
        <UseCasesSection />
        <DemoForm onOpenAgentModal={handleOpenAgentModal} />
      </main>
      <Footer />
      <AgentModal 
        isOpen={isAgentModalOpen} 
        onClose={() => setIsAgentModalOpen(false)} 
        onStartTalking={handleStartTalking}
      />
    </div>
  );
};

export default HomePage; 