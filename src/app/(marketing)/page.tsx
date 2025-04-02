'use client'

import {
  Box,
} from '@chakra-ui/react'
import LiveKitPage from '@/components/livekit/LiveKitPage'
// import { features } from '@/data/casegallery'
import * as React from 'react'
import { useState, useEffect } from 'react'
import { IconButton } from '@chakra-ui/react'
import { ArrowBackIcon } from '@chakra-ui/icons'

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

export default function HomePage() {
  const [isLiveKitActive, setIsLiveKitActive] = useState(false);
  const [isClient, setIsClient] = useState(false);
  // Set isClient to true on the client-side only
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Add a class to the body when LiveKit is active, to hide the footer
  useEffect(() => {
    if (isClient && isLiveKitActive) {
      document.body.classList.add('livekit-active');
    } else if (isClient) {
      document.body.classList.remove('livekit-active');
    }
    
    // Cleanup on unmount
    return () => {
      if (isClient) {
      document.body.classList.remove('livekit-active');
      }
    };
  }, [isLiveKitActive, isClient]);
  
  const handleCloseLiveKit = async () => {
    if (!isClient) return;

    console.log("Closing LiveKit and stopping all audio capture");
    
    // Check if user requested email follow-up
    const wantsEmailFollowUp = localStorage.getItem('prepzo_email_followup') === 'true';
    if (wantsEmailFollowUp) {
      console.log("User requested email follow-up - could trigger email capture flow here");
      localStorage.removeItem('prepzo_email_followup');
    }
    
    try {
      // First: Set state to inactive immediately
      setIsLiveKitActive(false);
      
      // Second: Add a forced cleanup of browser permissions
      if ('permissions' in navigator) {
        try {
          const permissionStatus = await (navigator as unknown as { 
            permissions: { 
              query: (options: { name: string }) => Promise<{ state: string }> 
            } 
          }).permissions.query({ name: 'microphone' });
          console.log("Microphone permission status:", permissionStatus.state);
        } catch (err) {
          console.error("Error querying permissions:", err);
        }
      }
      
      // Third: Create a dummy stream and stop all tracks
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
        console.log("Stopped audio track after LiveKit closed:", track.id);
      });
      
      // Fourth: Remove any hidden audio elements that might still be capturing
      document.querySelectorAll('audio').forEach(el => {
        if (el.srcObject) {
          try {
            const stream = el.srcObject as MediaStream;
            if (stream && typeof stream.getTracks === 'function') {
              stream.getTracks().forEach(track => track.stop());
            }
            el.srcObject = null;
          } catch (e) {
            console.error("Error cleaning audio element:", e);
          }
        }
        el.removeAttribute('src');
        el.load();
        el.remove();
      });
      
      console.log("Successfully released all microphone permissions");
    } catch (err) {
      console.error("Error releasing microphone access:", err);
    }
  };

  return (
    <Box position="relative">
      <HeroSection isLiveKitActive={isLiveKitActive} onLiveKitStateChange={setIsLiveKitActive} />
      
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
          <IconButton
            aria-label="Back to home"
            icon={<ArrowBackIcon />}
            position="absolute"
            top="4"
            left="4"
            zIndex="100000"
            size="lg"
            colorScheme="gray"
            variant="solid"
            onClick={handleCloseLiveKit}
          />
          <LiveKitPage onClose={handleCloseLiveKit} />
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