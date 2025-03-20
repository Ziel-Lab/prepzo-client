'use client'

import {
  Box,
  ButtonGroup,
  Container,
  Flex,
  HStack,
  IconButton,
  Stack,
  Text,
  VStack,
  useClipboard,
  useColorModeValue,
} from '@chakra-ui/react'
import { Br } from '@saas-ui/react'
import {
  FiCheck,
  FiCopy,
  FiGrid,
  FiLock,
  FiSliders,
  FiSmile,
  FiThumbsUp,
  FiUserPlus,
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
} from '@/components/highlights'
import { ChakraLogo, NextjsLogo } from '@/components/logos'
import { FallInPlace } from '@/components/motion/fall-in-place'
import { Pricing } from '@/components/pricing/pricing'
import { Testimonial, Testimonials } from '@/components/testimonials'
import { Em } from '@/components/typography'
import faq from '@/data/faq'
import pricing from '@/data/pricing'
import testimonials from '@/data/testimonials'
import { RippleButton } from '@/components/ripple-button'

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
  
  const handleCloseLiveKit = () => {
    setIsLiveKitActive(false);
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
          <HighlightsSection />
          <FeaturesSection />
          <TestimonialsSection />
          <PricingSection />
          <FaqSection />
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
      <Container maxW="container.xl" pt={{ base: 20, lg: 40 }} pb="40">
        <Stack direction={{ base: 'column', lg: 'row' }} alignItems="center" justifyContent="center">
          <Hero
            id="home"
            justifyContent="center"
            px="0"
            textAlign="center"
            title={!isBackgroundChanged && (
              <>
                Build beautiful
                <Br /> software faster
              </>
            )}
            description={!isBackgroundChanged && (
              <Box fontWeight="medium" fontFamily="ui-serif, LibreBaskerville, Georgia, serif">
                Saas UI is a <Em fontFamily="ui-serif, LibreBaskerville, Georgia, serif">React component library</Em>
                <Br /> that doesn&apos;t get in your way and helps you <Br />{' '}
                build intuitive SaaS products with speed.
              </Box>
            )}
          >
            <Box>
              {!isBackgroundChanged && (
                <HStack pt="4" pb="12" spacing="8" justifyContent="center">
                  <NextjsLogo height="28px" /> <ChakraLogo height="20px" />
                </HStack>
              )}

              <ButtonGroup spacing={4} alignItems="center" justifyContent="center">
                {!isBackgroundChanged && (
                  <>
                    <RippleButton
                      onClick={handleOpenLiveKit}
                    >
                      ✨ Start Talking to Your AI Coach ✨
                    </RippleButton>
                  </>
                )}
              </ButtonGroup>
            </Box>
          </Hero>
          <Box
            height="600px"
            position="absolute"
            display={{ base: 'none', lg: 'block' }}
            left={{ lg: '60%', xl: '55%' }}
            width="80vw"
            maxW="1100px"
            margin="0 auto"
          >
            
          </Box>
        </Stack>
      </Container>

      {!isBackgroundChanged && (
        <Features
          id="benefits"
          columns={[1, 2, 4]}
          iconSize={4}
          innerWidth="container.xl"
          pt="20"
          features={[
            {
              title: 'Accessible',
              icon: FiSmile,
              description: 'All components strictly follow WAI-ARIA standards.',
              iconPosition: 'left',
              delay: 0.6,
            },
            {
              title: 'Themable',
              icon: FiSliders,
              description:
                'Fully customize all components to your brand with theme support and style props.',
              iconPosition: 'left',
              delay: 0.8,
            },
            {
              title: 'Composable',
              icon: FiGrid,
              description:
                'Compose components to fit your needs and mix them together to create new ones.',
              iconPosition: 'left',
              delay: 1,
            },
            {
              title: 'Productive',
              icon: FiThumbsUp,
              description:
                'Designed to reduce boilerplate and fully typed, build your product at speed.',
              iconPosition: 'left',
              delay: 1.1,
            },
          ]}
          reveal={FallInPlace}
        />
      )}
    </Box>
  )
}

const HighlightsSection = () => {
  const { onCopy, hasCopied } = useClipboard('yarn add @saas-ui/react')

  return (
    <Highlights>
      <HighlightsItem colSpan={[1, null, 2]} title="Core components">
        <VStack alignItems="flex-start" spacing="8">
          <Text color="muted" fontSize="xl">
            Get started for free with <Em>30+ open source components</Em>.
            Including authentication screens with Clerk, Supabase and Magic.
            Fully functional forms with React Hook Form. Data tables with React
            Table.
          </Text>

          <Flex
            rounded="full"
            borderWidth="1px"
            flexDirection="row"
            alignItems="center"
            py="1"
            ps="8"
            pe="2"
            bg="primary.900"
            _dark={{ bg: 'gray.900' }}
          >
            <Box>
              <Text color="yellow.400" display="inline">
                yarn add
              </Text>{' '}
              <Text color="cyan.300" display="inline">
                @saas-ui/react
              </Text>
            </Box>
            <IconButton
              icon={hasCopied ? <FiCheck /> : <FiCopy />}
              aria-label="Copy install command"
              onClick={onCopy}
              variant="ghost"
              ms="4"
              isRound
              color="white"
            />
          </Flex>
        </VStack>
      </HighlightsItem>

      {/* Rest of the components (FeaturesSection, TestimonialsSection, PricingSection, FaqSection) */}
      {/* should be implemented here following the original code */}
    </Highlights>
  )
}

const FeaturesSection = () => {
  return (
    <Features
      id="features"
      title={
        <>
          Not your standard dashboard template
        </>
      }
      description="Saas UI Pro includes everything you need to build modern SaaS products."
      align="left"
      columns={[1, 2, 3]}
      iconSize={4}
      features={[
        {
          title: 'Authentication',
          icon: FiLock,
          description:
            'Complete authentication flows including signup, login and reset password. Supports social authentication and OAuth.',
          variant: 'inline',
        },
        {
          title: 'User Management',
          icon: FiUserPlus,
          description:
            'Manage your team and user roles. Invite new team members and manage their permissions.',
          variant: 'inline',
        },
        // Add more features as in the original code
      ]}
    />
  )
}

const TestimonialsSection = () => {
  return (
    <Testimonials
      title="Testimonials"
      description="People love our components, you will too."
      columns={[1, 2, 3]}
      innerWidth="container.xl"
    >
      {testimonials.items.map((testimonial, i) => (
        <Testimonial key={i} {...testimonial} />
      ))}
    </Testimonials>
  )
}

const PricingSection = () => {
  return (
    <Pricing 
      id="pricing"
      title={pricing.title}
      description={pricing.description}
      plans={pricing.plans}
    />
  )
}

const FaqSection = () => {
  return (
    <Faq {...faq} />
  )
} 