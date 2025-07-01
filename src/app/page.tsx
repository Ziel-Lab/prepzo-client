"use client"; 

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Navbar from "@/components/navbar/Navbar";
import HeroSection from "@/components/hero/HeroSection";
import FeaturesSection from "@/components/features/FeaturesSection";
import UseCasesSection from "@/components/usecases/UseCasesSection";
import DemoForm from "@/components/faq/DemoForm";
import Footer from "@/components/footer/Footer";
import AgentModal from "@/components/modal/agentmodal";
import BeyondToolsSection from "@/components/beyondSection/BeyondToolsSection";
import SubscriptionPricing from "@/components/dashboard/settings/subscription/subscriptionPricing";

const HomePage = () => {
  const router = useRouter();
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setIsLoading(false);
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

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
        <section id="pricing" className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <SubscriptionPricing 
              currentPlanId={undefined}
              isProcessingAction={isLoading}
              handleUpgrade={(plan) => {
                if (isAuthenticated) {
                  // User is logged in, go directly to subscription settings
                  router.push('/dashboard/settings/subscription');
                } else {
                  // User not logged in, redirect to signup first, then to subscription settings
                  router.push('/auth/sign-up?redirect=/dashboard/settings/subscription');
                }
              }}
              handleFreeSignup={() => {
                if (isAuthenticated) {
                  // User is already logged in, go to dashboard
                  router.push('/dashboard');
                } else {
                  // User not logged in, redirect to signup
                  router.push('/auth/sign-up');
                }
              }}
            />
          </div>
        </section>
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