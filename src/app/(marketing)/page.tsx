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

import {
  FiSliders,
  FiSmile,
  FiThumbsUp,
  FiBox,
  FiPackage,
  FiSearch,
  FiUsers,
  FiFlag,
  FiTrendingUp,
  FiLayout,
  FiCode,
  FiArchive,
} from 'react-icons/fi'
import LiveKitPage from '@/components/livekit/LiveKitPage'

import * as React from 'react'
import { useState, useEffect } from 'react'

import { Faq } from '@/components/faq'
import { Features } from '@/components/features'
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

export default function HomePage() {
  const [isLiveKitActive, setIsLiveKitActive] = useState(false);

  // Add a class to the body when LiveKit is active, to hide the footer
  useEffect(() => {
    if (isLiveKitActive) {
      document.body.classList.add('livekit-active');
    } else {
      document.body.classList.remove('livekit-active');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('livekit-active');
    };
  }, [isLiveKitActive]);
  
  const handleCloseLiveKit = async () => {
    console.log("Closing LiveKit and stopping all audio capture");
    
    // Check if user requested email follow-up
    const wantsEmailFollowUp = localStorage.getItem('prepzo_email_followup') === 'true';
    if (wantsEmailFollowUp) {
      console.log("User requested email follow-up - could trigger email capture flow here");
      // Here you would add code to handle the email follow-up request
      // For example, show a form to capture email, or redirect to a contact page
      
      // Clear the flag after processing
      localStorage.removeItem('prepzo_email_followup');
    }
    
    // Force release of any microphone permissions
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
        // Force element cleanup
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
      {isLiveKitActive ? (
        <Box 
          position="fixed" 
          top="0" 
          left="0" 
          width="100%" 
          height="100vh" 
          zIndex="99999"
          bg="transparent"
          sx={{
            // This will hide the footer and any other content
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
      {/* <PricingSection /> */}
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
    setIsBackgroundChanged(isLiveKitActive);
  }, [isLiveKitActive]);

  const handleOpenLiveKit = () => {
    setIsBackgroundChanged(true);
    onLiveKitStateChange(true);
  };

  // Use light mode values for server-side rendering, but apply the values conditionally after hooks are called
  const currentBgColor = isClient && isBackgroundChanged ? bgColor : "transparent";
  const currentBgImage = isClient && isBackgroundChanged ? backgroundGradient : "none";

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
              <Box textAlign="center" width="100%" mx="auto" maxW="container.lg">
                Discover Your AI-Powered Career Coach
              </Box>
            )}
            description={!isBackgroundChanged && (
              <Box fontWeight="medium" fontFamily="ui-serif, LibreBaskerville, Georgia, serif" textAlign="center" width="100%" mx="auto" maxW="container.lg">
                Embark on a journey of <Em fontFamily="ui-serif, LibreBaskerville, Georgia, serif">professional growth</Em>
                <br />with an AI coach that understands,{' '}
                remembers, and evolves with YOU.
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
              
              {!isBackgroundChanged && (
                <div className="panel max-w-1200px mx-auto mt-16 rounded lg:rounded-1-5 xl:rounded-2 border border-dark overflow-hidden">
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
        avatar="/testimonial-avatar.jpg"
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

const UseCaseGallerySection = () => {
  return (
    <Features
      id="features"
      title="Use Case Gallery"
      columns={[2, 3, 4, 4]}
      spacing={4}
      py={6}
      align="center"
      maxW="1800px"
      mx="auto"
      px={0}
      iconSize={3}
      maxFeatures={12}
      features={[
        {
          title: "Resume Preparation",
          description: "Create compelling resumes with AI-driven personalization to showcase your skills effectively.",
          icon: FiBox,
          iconBgColor: "purple.50",
          iconColor: "purple.500",
          titleColor: "gray.900",
          variant: 'left-icon',
        },
        {
          title: "Interview Preparation",
          description: "Prepare for job interviews with mock interviews, practice questions, and personalized feedback.",
          icon: FiPackage,
          iconBgColor: "blue.50",
          iconColor: "blue.500",
          titleColor: "gray.900",
          variant: 'left-icon',
        },
        {
          title: "Skill Development",
          description: "Identify skill gaps and access targeted learning resources to stay competitive in your field.",
          icon: FiSearch,
          iconBgColor: "pink.50",
          iconColor: "pink.500",
          titleColor: "gray.900",
          variant: 'left-icon',
        },
        {
          title: "Cover Letters",
          description: "Craft personalized cover letters that align with job descriptions and highlight your strengths.",
          icon: FiUsers,
          iconBgColor: "purple.50",
          iconColor: "purple.500",
          titleColor: "gray.900",
          variant: 'left-icon',
        },
        {
          title: "Career Planning",
          description: "Plan your career path with personalized guidance and strategic growth opportunities.",
          icon: FiFlag,
          iconBgColor: "blue.50",
          iconColor: "blue.500",
          titleColor: "gray.900",
          variant: 'left-icon',
        },
        {
          title: "Career Path Navigation",
          description: "Discover potential career paths aligned with your skills, interests, and long-term goals.",
          icon: FiTrendingUp,
          iconBgColor: "pink.50",
          iconColor: "pink.500",
          titleColor: "gray.900",
          variant: 'left-icon',
        },
        {
          title: "Office Politics",
          description: "Navigate complex workplace dynamics and build strong professional relationships.",
          icon: FiLayout,
          iconBgColor: "purple.50",
          iconColor: "purple.500",
          titleColor: "gray.900",
          variant: 'left-icon',
        },
        {
          title: "Salary Negotiation",
          description: "Negotiate salary and benefits effectively to secure the compensation you deserve.",
          icon: FiCode,
          iconBgColor: "blue.50",
          iconColor: "blue.500",
          titleColor: "gray.900",
          variant: 'left-icon',
        },
        {
          title: "Professional Traits",
          description: "Understand your strengths and leverage your unique capabilities for career success.",
          icon: FiArchive,
          iconBgColor: "pink.50",
          iconColor: "pink.500",
          titleColor: "gray.900",
          variant: 'left-icon',
        },
        {
          title: "Upskilling",
          description: "Identify opportunities for skill development to remain relevant in your industry.",
          icon: FiSliders,
          iconBgColor: "purple.50",
          iconColor: "purple.500",
          titleColor: "gray.900",
          variant: 'left-icon',
        },
        {
          title: "Stress Management",
          description: "Learn strategies to manage workplace stress and maintain a healthy work-life balance.",
          icon: FiSmile,
          iconBgColor: "blue.50",
          iconColor: "blue.500",
          titleColor: "gray.900",
          variant: 'left-icon',
        },
        {
          title: "Growth Framework",
          description: "Build a personal growth framework to achieve your long-term career goals.",
          icon: FiThumbsUp,
          iconBgColor: "pink.50",
          iconColor: "pink.500",
          titleColor: "gray.900",
          variant: 'left-icon',
        },
      ]}
    />
  )
}

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