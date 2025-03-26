'use client'

import {
  Box,
  ButtonGroup,
  Container,
  HStack,
  Stack,
  
  
  useColorModeValue,
  
  
} from '@chakra-ui/react'

import LiveKitPage from '@/components/livekit/LiveKitPage'
// import { features } from '@/data/casegallery'
import * as React from 'react'
import { useState, useEffect } from 'react'

import { Faq } from '@/components/faq'
// import { Features } from '@/components/features'
import { BackgroundGradient } from '@/components/gradients/background-gradient'
import { Hero } from '@/components/hero'

// import { Pricing } from '@/components/pricing/pricing'
import { Testimonial, Testimonials } from '@/components/testimonials'
import { Em } from '@/components/typography'
import faq from '@/data/faq'
// import pricing from '@/data/pricing'
import testimonials from '@/data/testimonials'
import { RippleButton } from '@/components/ripple-button'
import { Newsletter } from '@/components/newsletter'
import { UseCaseGallerySection } from '@/components/useCaseGallerySection/useCaseGallery'
import { HighlightsSection } from '@/components/highlightsSection/highlightsSection'

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
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        zIndex="0"
        backdropFilter="blur(2px)"
        bg={useColorModeValue(
          "rgba(255, 255, 255, 0.02)",
          "rgba(0, 0, 0, 0.02)"
        )}
        borderBottom="1px solid"
        borderColor={useColorModeValue(
          "rgba(255, 255, 255, 0.05)",
          "rgba(255, 255, 255, 0.01)"
        )}
      />
      <Container 
        maxW="container.2xl" 
        pt={{ base: 12, sm: 16, md: 20, lg: 40 }} 
        pb={{ base: 20, md: 30, lg: 40 }} 
        px={{ base: 4, sm: 6, md: 8 }}
        textAlign="center" 
        position="relative" 
        zIndex="1"
      >
        <Stack direction={{ base: 'column', lg: 'row' }} alignItems="center" justifyContent="center" width="100%" spacing={{ base: 6, md: 8 }}>
          <Hero
            id="home"
            justifyContent="center"
            px="0"
            textAlign="center"
            width="100%"
            title={!isBackgroundChanged && (
              <Box 
                textAlign="center" 
                width="100%" 
                mx="auto" 
                maxW="container.lg"
                fontSize={{ base: "3xl", sm: "4xl", md: "5xl", lg: "6xl" }}
                lineHeight={{ base: "1.2", md: "1.1" }}
                fontWeight="bold"
                mb={{ base: 4, md: 6 }}
              >
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
                fontSize={{ base: "lg", md: "xl", lg: "2xl" }}
                lineHeight={{ base: "1.6", md: "1.8" }}
                px={{ base: 4, md: 6 }}
                _dark={{
                  color: "white",
                }}
              >
              Embark on a journey of{" "}
                <Em 
                  fontFamily="ui-serif, LibreBaskerville, Georgia, serif"
                  fontSize={{ base: "lg", md: "xl", lg: "2xl" }}
                >
                    professional growth
                </Em>
              {" "}
              with an AI coach that understands, remembers, and evolves with YOU.
              </Box>
            )}
          >
            <Box width="100%" textAlign="center" mx="auto">
              {!isBackgroundChanged && (
                <HStack pt={{ base: 2, md: 4 }} pb={{ base: 8, md: 12 }} spacing={{ base: 4, md: 8 }} justifyContent="center">
                </HStack>
              )}

              <ButtonGroup spacing={{ base: 2, md: 4 }} alignItems="center" justifyContent="center" mb={{ base: 6, md: 10 }}>
                {!isBackgroundChanged && (
                  <>
                    <RippleButton
                      onClick={handleOpenLiveKit}
                      borderRadius="xl"
                      px={{ base: 6, md: 8 }}
                      py={{ base: 3, md: 4 }}
                      width="auto"
                      height="auto"
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      fontSize={{ base: "md", md: "lg" }}
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

// const HighlightsSection = () => {
//   return (
//     <Highlights
//       py={{ base: 8, md: 12, lg: 16 }}
//       px={{ base: 4, md: 6, lg: 8 }}
//       gap={{ base: 6, md: 8 }}
//       mx="auto"
//       maxW="7xl"
//     >
//       <HighlightsItem 
//         colSpan={[12, null, 6]} 
//         title="Evolving with Your Journey"
//         py={{ base: 6, md: 8 }}
//         px={{ base: 6, md: 8 }}
//         bg={useColorModeValue('white', 'gray.800')}
//         borderRadius="xl"
//         shadow="sm"
//       >
//         <VStack alignItems="flex-start" spacing={{ base: 4, md: 6 }} width="100%">
//           <Text 
//             color={useColorModeValue("gray.600", "gray.300")}
//             fontSize={{ base: "md", md: "lg" }} 
//             lineHeight="tall"
//           >
//             Each session builds upon the last, ensuring your coaching experience grows with your career progression.
//           </Text>
//           <UnorderedList 
//             color={useColorModeValue("gray.600", "gray.300")}
//             fontSize={{ base: "md", md: "lg" }} 
//             spacing={{ base: 3, md: 4 }} 
//             pl={{ base: 4, md: 6 }}
//             width="100%"
//           >
//             <ListItem>Reflect on past discussions to inform future decisions</ListItem>
//             <ListItem>Develop a coherent and personalized career plan</ListItem>
//           </UnorderedList>
//         </VStack>
//       </HighlightsItem>

//       <HighlightsItem 
//         colSpan={[12, null, 6]} 
//         title="Curated Resources Just for You"
//         py={{ base: 6, md: 8 }}
//         px={{ base: 6, md: 8 }}
//         bg={useColorModeValue('white', 'gray.800')}
//         borderRadius="xl"
//         shadow="sm"
//       >
//         <VStack alignItems="flex-start" spacing={{ base: 4, md: 6 }} width="100%">
//           <Text 
//             color={useColorModeValue("gray.600", "gray.300")}
//             fontSize={{ base: "md", md: "lg" }} 
//             lineHeight="tall"
//           >
//             Receive up-to-date resources specifically selected to match your evolving professional needs.
//           </Text>
//           <UnorderedList 
//             color={useColorModeValue("gray.600", "gray.300")}
//             fontSize={{ base: "md", md: "lg" }} 
//             spacing={{ base: 3, md: 4 }} 
//             pl={{ base: 4, md: 6 }}
//             width="100%"
//           >
//             <ListItem>Explore job opportunities aligned with your goals</ListItem>
//             <ListItem>Engage with tailored skills training materials</ListItem>
//             <ListItem>Gain insights to foster professional growth</ListItem>
//           </UnorderedList>
//         </VStack>
//       </HighlightsItem>

//       <HighlightsTestimonialItem
//         colSpan={[12, null, 5]}
//         name="Abhishek Singla"
//         customTitle="Founder"
//         avatar="/static/images/abhishek.png"
//         gradient={['purple.500', 'purple.300']}
//         description="Founder"
//         py={{ base: 8, md: 10 }}
//         px={{ base: 6, md: 8 }}
//         borderRadius="xl"
//         shadow="lg"
//       >
//         <Text
//           fontSize={{ base: "md", md: "lg" }}
//           fontStyle="italic"
//           lineHeight="tall"
//         >
//           &ldquo;At Prepzo, we recognize that finding the right mentor can be challenging. Leveraging advanced AI technology, Prepzo serves as a personalized mentor, offering tailored guidance to help you navigate your career journey effectively.&rdquo;
//         </Text>
//       </HighlightsTestimonialItem>

//       <HighlightsItem 
//         colSpan={[12, null, 7]} 
//         title="Engaging Conversations"
//         py={{ base: 6, md: 8 }}
//         px={{ base: 6, md: 8 }}
//         bg={useColorModeValue('white', 'gray.800')}
//         borderRadius="xl"
//         shadow="sm"
//       >
//         <VStack alignItems="flex-start" spacing={{ base: 4, md: 6 }} width="100%">
//           <Text 
//             color={useColorModeValue("gray.600", "gray.300")}
//             fontSize={{ base: "md", md: "lg" }} 
//             lineHeight="tall"
//           >
//             Interact in real-time with an AI that offers empathetic support, helping you navigate professional challenges and seize opportunities.
//           </Text>

//           <UnorderedList 
//             color={useColorModeValue("gray.600", "gray.300")}
//             fontSize={{ base: "md", md: "lg" }} 
//             spacing={{ base: 3, md: 4 }} 
//             pl={{ base: 4, md: 6 }}
//             width="100%"
//           >
//             <ListItem>Immediate, relevant advice</ListItem>
//             <ListItem>Continuous learning to better understand your needs</ListItem>
//             <ListItem>Access to professional insights instantly</ListItem>
//           </UnorderedList>
//         </VStack>
//       </HighlightsItem>
//     </Highlights>
//   )
// }
<>
<HighlightsSection/>

<UseCaseGallerySection/>
</>

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