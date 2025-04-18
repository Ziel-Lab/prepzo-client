'use client'

import {
  Box,
  useDisclosure,
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

export default function HomePage() {
  const [isLiveKitActive, setIsLiveKitActive] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { isOpen: isModalOpen, onOpen: openModal, onClose: closeModal } = useDisclosure();

  // Set isClient to true on the client-side only
  useEffect(() => {
    setIsClient(true);
  }, []);

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

  return (
    <Box position="relative">
      <HeroSection onOpenModal={openModal} isLiveKitActive={isLiveKitActive} />
      
      {/* Agent Interstitial Modal */}
      <AgentModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onStartTalking={handleStartLiveKit}
      />

      {/* When LiveKit is active, show LiveKit overlay; otherwise show regular content */}
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
      <HowItWorkSection />
      <UseCaseGallerySection />
      <HighlightsSection />
      <TestimonialsSection />
      <FaqSection />
      <NewsletterSection />
        </>
      )}
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