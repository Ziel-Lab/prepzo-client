'use client'

import {
  Box,
  useDisclosure,
  Spinner,
  Center,
} from '@chakra-ui/react'
import LiveKitPage from '@/components/livekit/LiveKitPage'
// import { features } from '@/data/casegallery'
import * as React from 'react'
import { useState, useEffect } from 'react'
// import { IconButton } from '@chakra-ui/react'
// import { ArrowBackIcon } from '@chakra-ui/icons'

import { Faq } from '@/components/faq'
// import { Features } from '@/components/features'
// import { Pricing } from '@/components/pricing/pricing'


import faq from '@/data/faq'
// import pricing from '@/data/pricing'


import { Newsletter } from '@/components/newsletter'
import { UseCaseGallerySection } from '@/components/useCaseGallerySection/useCaseGallery'
import { HighlightsSection } from '@/components/highlightsSection/highlightsSection'
import HeroSection from '@/components/heroSection/HeroSection'
import TestimonialsSection from '@/components/testimonialsSection/TestimonialsSection'
import HowItWorkSection from '@/components/howItworkSection/howItworkSection'
import AgentModal from '@/components/modal/agentmodal'
import PasswordModal from '@/components/modal/PasswordModal'
import { fetchWithCredentials } from '@/utils/fetchWithCredentials'

// Ensure this points to your backend server
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function HomePage() {
  const [isLiveKitActive, setIsLiveKitActive] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { isOpen: isModalOpen, onOpen: openModal, onClose: closeModal } = useDisclosure();

  // State for password protection
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // Start loading auth status

  // Set isClient to true on the client-side only
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoadingAuth(true);
      try {
        const response = await fetchWithCredentials(`${BACKEND_URL}/check-auth`);
        if (response.ok) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking authentication status:', error);
        // Stay unauthenticated if check fails
      } finally {
        setIsLoadingAuth(false);
      }
    };

    if (isClient) {
      checkAuthStatus();
    }
  }, [isClient]); // Rerun if isClient changes (though it usually won't after mount)

  // Add/remove class to the body when LiveKit is active/inactive
  useEffect(() => {
    if (!isClient) return;

    if (isLiveKitActive) {
      document.body.classList.add('livekit-active');
    } else {
      document.body.classList.remove('livekit-active');
    }

    // Cleanup function to remove the class if the component unmounts while active
    return () => {
      if (isClient) {
        document.body.classList.remove('livekit-active');
      }
    };
  }, [isLiveKitActive, isClient]);

  // Function to actually start LiveKit (called from modal button)
  const handleStartLiveKit = () => {
    if (isClient) {
      setIsLiveKitActive(true);
      // closeModal(); // Modal closes itself via its own button onClick
    }
  };

  // Function to handle closing LiveKit (passed to LiveKitPage)
  const handleCloseLiveKitPage = () => {
     if (isClient) {
       console.log("LiveKitPage closed, setting isLiveKitActive to false.");
       setIsLiveKitActive(false);
       // Add any additional cleanup needed specifically on the HomePage level here if required
     }
  };

  // Function to handle password verification
  const handleVerifyPassword = async (password: string): Promise<boolean> => {
    try {
      const response = await fetchWithCredentials(`${BACKEND_URL}/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      if (response.ok) {
        setIsAuthenticated(true);
        return true; // Indicate success
      }
      return false; // Indicate failure
    } catch (error) {
      console.error('Password verification failed:', error);
      return false; // Indicate failure
    }
  };

  return (
    <Box position="relative">
      {/* Loading state while checking authentication */} 
      {isLoadingAuth ? (
        <Center height="100vh">
          <Spinner size="xl" />
        </Center>
      ) : isAuthenticated ? (
          <> 
            {/* Only show main content OR LiveKit overlay if authenticated */}
            <HeroSection onOpenModal={openModal} isLiveKitActive={isLiveKitActive} />
            {isClient && isLiveKitActive ? (
              <Box 
                position="fixed" 
                top="0" 
                left="0" 
                width="100%" 
                height="100vh" 
                zIndex="99999"
                bg="transparent"
                sx={{
                  "& ~ footer": {
                    display: "none !important" 
                  },
                  "& header": {
                    display: "none !important"
                  }
                }}
              >
                <LiveKitPage onClose={handleCloseLiveKitPage} />
              </Box>
            ) : (
              <>
                {/* Render regular page content sections when LiveKit is not active */} 
                <HowItWorkSection />
                <UseCaseGallerySection />
                <HighlightsSection />
                <TestimonialsSection />
                <FaqSection />
                <NewsletterSection />
              </>
            )}
          </>
      ) : (
          // Show Password Modal if not authenticated and not loading
          <PasswordModal isOpen={!isAuthenticated} onVerify={handleVerifyPassword} />
      )}

      {/* Add log before rendering AgentModal */}
      {(() => {
        console.log("Checking AgentModal render. isModalOpen:", isModalOpen);
        return null; // Return null as ReactNode
      })()}
      <AgentModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onStartTalking={handleStartLiveKit}
      />
    </Box>
  )
}





// const PricingSection = () => {
//   return (
//     <Pricing 
//       id="pricing"
//       title={pricing.title}
//       description={pricing.description}
//       plans={pricing.plans}
//     />
//   )
// }

const FaqSection = () => {
  return (
    <Faq 
      id="faq"
      title="Frequently Asked Questions"
      items={faq.items.map(item => ({
        question: item.q,
        answer: item.a
      }))}
    />
  )
}

const NewsletterSection = () => {
  return (
    <Newsletter
      id="newsletter"
      title="Stay Ahead Professionally"
      description="Join our newsletter for career tips, insights, and exclusive growth strategies."
    />
  )
} 