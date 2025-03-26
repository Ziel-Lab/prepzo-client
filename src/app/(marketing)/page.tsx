'use client'

import {
  Box,
  ButtonGroup,
  Container,
  HStack,
  Stack,
  Text,
  VStack,
  useColorModeValue,
  UnorderedList,
  ListItem,
} from '@chakra-ui/react'

import LiveKitPage from '@/components/livekit/LiveKitPage'
// import { features } from '@/data/casegallery'
import * as React from 'react'
import { useState, useEffect } from 'react'

import { Faq } from '@/components/faq'
// import { Features } from '@/components/features'
import { BackgroundGradient } from '@/components/gradients/background-gradient'
import { Hero } from '@/components/hero'
import {
  Highlights,
  HighlightsItem,
  HighlightsTestimonialItem,
} from '@/components/highlights'
// import { Pricing } from '@/components/pricing/pricing'
import { Testimonial, Testimonials } from '@/components/testimonials'
import { Em } from '@/components/typography'
import faq from '@/data/faq'
// import pricing from '@/data/pricing'
import testimonials from '@/data/testimonials'
import { RippleButton } from '@/components/ripple-button'
import { Newsletter } from '@/components/newsletter'
import { UseCaseGallerySection } from '@/components/useCaseGallerySection/useCaseGallery'

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
            }
          }}
        >
          <LiveKitPage onClose={handleCloseLiveKit} />
        </Box>
      ) : (
        <>
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

const HeroSection: React.FC<{ isLiveKitActive: boolean; onLiveKitStateChange: (active: boolean) => void }> = ({ isLiveKitActive, onLiveKitStateChange }) => {
  const [isBackgroundChanged, setIsBackgroundChanged] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // Define color values outside of JSX
  const bgColorLight = "rgba(87, 125, 178, 0.25)";
  const bgColorDark = "rgba(40, 70, 110, 0.35)";
  const bgColor = useColorModeValue(bgColorLight, bgColorDark);
  
  const gradientLight = "linear-gradient(180deg, rgba(87, 125, 178, 0.2) 0%, rgba(255, 255, 255, 0.9) 100%)";
  const gradientDark = "linear-gradient(180deg, rgba(40, 70, 110, 0.3) 0%, rgba(23, 25, 35, 0.9) 100%)";
  const backgroundGradient = useColorModeValue(gradientLight, gradientDark);

  // Set isClient to true on the client-side only
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Sync isBackgroundChanged with parent isLiveKitActive state
  useEffect(() => {
    if (isClient) {
      setIsBackgroundChanged(isLiveKitActive);
    }
  }, [isLiveKitActive, isClient]);

  const handleOpenLiveKit = () => {
    if (isClient) {
      setIsBackgroundChanged(true);
      onLiveKitStateChange(true);
    }
  };

  // Default values for server-side rendering
  const defaultBgColor = "transparent";
  const defaultBgImage = "none";

  // Use client-side values only after hydration
  const currentBgColor = !isClient ? defaultBgColor : (isBackgroundChanged ? bgColor : defaultBgColor);
  const currentBgImage = !isClient ? defaultBgImage : (isBackgroundChanged ? backgroundGradient : defaultBgImage);

  return (
    <Box 
      position="relative" 
      overflow="hidden"
      bg={currentBgColor}
      backgroundImage={currentBgImage}
      transition="all 0.3s ease"
    >
      <BackgroundGradient height="100%" zIndex="-1" opacity={isBackgroundChanged ? 0 : 1} transition="opacity 0.3s ease" />
      <Container maxW="container.2xl" pt={{ base: 20, lg: 40 }} pb="40" textAlign="center">
        <Stack direction={{ base: 'column', lg: 'row' }} alignItems="center" justifyContent="center" width="100%">
          <Hero
            id="home"
            justifyContent="center"
            px="0"
            textAlign="center"
            width="100%"
            title={!isBackgroundChanged && (
              <Box textAlign="center" width="100%" mx="auto" maxW="container.lg"  backdropFilter="blur(100px)">
                Discover Your <br/> AI-Powered Career Coach
              </Box>
            )}
            description={!isBackgroundChanged && (
              <Box
                color="black"
                fontWeight="medium"
                fontFamily="ui-serif, LibreBaskerville, Georgia, serif"
                textAlign="center"
                width="100%"
                mx="auto"
                maxW="container.lg"
                _dark={{
                  color: "white",
                }}
                
                backdropFilter="blur(100px)" // blur the background behind the box
              >
              Embark on a journey of{" "}
                <Em fontFamily="ui-serif, LibreBaskerville, Georgia, serif">
                    professional growth
                </Em>
              
              with an AI coach that understands, remembers, and evolves with YOU.
              </Box>

            )}
          >
            <Box width="100%" textAlign="center" mx="auto">
              {!isBackgroundChanged && (
                <HStack pt="4" pb="12" spacing="8" justifyContent="center">
                </HStack>
              )}

              <ButtonGroup spacing={4} alignItems="center" justifyContent="center" mb={10}>
                {!isBackgroundChanged && (
                  <>
                    <RippleButton
                      onClick={handleOpenLiveKit}
                      borderRadius="xl"
                      px={8}
                      py={4}
                      width="auto"
                      height="auto"
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                    >
                      ✨ Start Talking to Your AI Coach ✨
                    </RippleButton>
                  </>
                )}
              </ButtonGroup>
              
              {!isBackgroundChanged && isClient && (
                <div className="panel max-w-1600px mx-auto mt-16 rounded lg:rounded-1-5 xl:rounded-2 border border-dark overflow-hidden">
                  <video
                    width="100%" 
                    height="auto"
                    preload="auto"
                    playsInline
                    muted
                    loop
                    autoPlay
                    poster="/media/lexend-home-7.png"
                    style={{ borderRadius: '12px' }}
                  >
                    <source src="/media/home.webm" type="video/webm" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}
            </Box>
          </Hero>
        </Stack>
      </Container>
    </Box>
  )
}

const HighlightsSection = () => {
  return (
    <Highlights>
      <HighlightsItem colSpan={[12, null, 6]} title="Evolving with Your Journey">
        <VStack alignItems="flex-start" spacing="8">
          <Text color="gray.500" fontSize="lg" lineHeight="tall">
          Each session builds upon the last, ensuring your coaching experience grows with your career progression.
          </Text>
          <UnorderedList color="gray.500" fontSize="lg" spacing={2} pl={2}>
            <ListItem>Reflect on past discussions to inform future decisions</ListItem>
            <ListItem>Develop a coherent and personalized career plan</ListItem>
          </UnorderedList>
        </VStack>
      </HighlightsItem>

      <HighlightsItem colSpan={[12, null, 6]} title="Curated Resources Just for You">
        <VStack alignItems="flex-start" spacing="8">
          <Text color="gray.500" fontSize="lg" lineHeight="tall">
            Receive up-to-date resources specifically selected to match your evolving professional needs.
          </Text>
          <UnorderedList color="gray.500" fontSize="lg" spacing={2} pl={2}>
            <ListItem>Explore job opportunities aligned with your goals</ListItem>
            <ListItem>Engage with tailored skills training materials</ListItem>
            <ListItem>Gain insights to foster professional growth</ListItem>
          </UnorderedList>
        </VStack>
      </HighlightsItem>

      <HighlightsTestimonialItem
        colSpan={[12, null, 5]}
        name="Abhishek Singla"
        customTitle="Founder"
        avatar="/static/images/abhishek.png"
        gradient={['purple.500', 'purple.300']}
        description="Founder"
      >
        &ldquo;At Prepzo, we recognize that finding the right mentor can be challenging. Leveraging advanced AI technology, Prepzo serves as a personalized mentor, offering tailored guidance to help you navigate your career journey effectively.&rdquo;
      </HighlightsTestimonialItem>

      <HighlightsItem colSpan={[12, null, 7]} title="Engaging Conversations">
        <VStack alignItems="flex-start" spacing="8">
          <Text color="gray.500" fontSize="lg" lineHeight="tall">
            Interact in real-time with an AI that offers empathetic support, helping you navigate professional challenges and seize opportunities.
          </Text>

          <UnorderedList color="gray.500" fontSize="lg" spacing={2} pl={2}>
            <ListItem>Immediate, relevant advice</ListItem>
            <ListItem>Continuous learning to better understand your needs</ListItem>
            <ListItem>Access to professional insights instantly</ListItem>
          </UnorderedList>
        </VStack>
      </HighlightsItem>
    </Highlights>
  )
}

<UseCaseGallerySection/>

const TestimonialsSection = () => {
  return (
    <Testimonials
      title={testimonials.title}
      description="Hear from professionals who have accelerated their careers with our AI coach."
      columns={[1, 2, 3]}
      innerWidth="container.xl"
    >
      {testimonials.items.map((testimonial, i) => (
        <Testimonial key={i} {...testimonial} />
      ))}
    </Testimonials>
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
    <Faq {...faq} />
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