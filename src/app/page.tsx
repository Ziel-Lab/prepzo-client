"use client"; 

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import Navbar from "@/components/navbar/Navbar";
import HeroSection from "@/components/hero/HeroSection";
import FeaturesSection from "@/components/features/FeaturesSection";
import UseCasesSection from "@/components/usecases/UseCasesSection";
import TestimonialsSection from "@/components/testimonials/TestimonialsSection";
import DemoForm from "@/components/faq/DemoForm";
import Footer from "@/components/footer/Footer";
import AgentModal from "@/components/modal/agentmodal";
import PasswordModal from "@/components/modal/PasswordModal";
import { fetchWithCredentials } from "@/utils/fetchWithCredentials"; // Import the utility

// Ensure this points to your backend server URL in .env.local or similar
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'; // Corrected fallback port

// Renamed component to follow convention (e.g., Page or HomePage)
const HomePage = () => {
  const router = useRouter();
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);

  // State for password protection
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // Start loading auth status

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoadingAuth(true);
      try {
        // Use fetchWithCredentials to automatically include credentials
        const response = await fetchWithCredentials(`${BACKEND_URL}/api/check-auth`); // Use the utility
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          // Optional: handle specific non-ok statuses if needed
           console.log('Not authenticated via check-auth');
        }
      } catch (error) {
        console.error('Error checking authentication status:', error);
        // Stay unauthenticated if check fails
      } finally {
        setIsLoadingAuth(false);
      }
    };
    checkAuthStatus();
  }, []); // Run only on mount

  const handleStartTalking = () => {
    console.log("Start Talking action initiated from HomePage, navigating to LiveKit session...");
    router.push('/livekit-session'); 
  };
  
  const handleOpenAgentModal = () => {
    setIsAgentModalOpen(true);
  };

  // Function to handle password verification
  const handleVerifyPassword = async (password: string): Promise<boolean> => {
    try {
      // Use fetchWithCredentials for the verification request
      const response = await fetchWithCredentials(`${BACKEND_URL}/api/verify-password`, { // Use the utility
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // credentials: 'include' is handled by fetchWithCredentials
        body: JSON.stringify({ password }),
      });
      if (response.ok) {
        setIsAuthenticated(true); // Set authenticated on success
        return true; // Indicate success to modal
      }
      return false; // Indicate failure to modal
    } catch (error) {
      console.error('Password verification failed:', error);
      return false; // Indicate failure to modal
    }
  };
  
  useEffect(() => {
    // Add intersection observer for animation elements
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const fadeElements = document.querySelectorAll(".fade-in-section");
    fadeElements.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      // Check if observer exists and elements exist before unobserving
      if (observer && fadeElements) {
          fadeElements.forEach((element) => {
            observer.unobserve(element);
        });
      }
    };
  }, []);

  // Loading State
  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {/* Add a spinner or loading text here */}
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  // Password Modal State
  if (!isAuthenticated) {
      return <PasswordModal isOpen={!isAuthenticated} onVerify={handleVerifyPassword} />;
  }

  // Authenticated State: Render the main application
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <HeroSection onOpenAgentModal={handleOpenAgentModal} />
        <FeaturesSection />
        <UseCasesSection />
        <TestimonialsSection />
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