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
import BeyondToolsSection from "@/components/beyondSection/BeyondToolsSection";

const HomePage = () => {
  const router = useRouter();
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);

  const handleStartTalking = () => {
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
        <BeyondToolsSection />
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