import { Box, ButtonGroup, Container, HStack, Stack, useColorModeValue } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react'
import { Hero } from '../hero/hero';
import { Em } from '../typography';
import { RippleButton } from '../ripple-button';
import { BackgroundGradient } from '@/components/gradients/background-gradient'

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
          pb={{ base: 10, md: 15, lg: 20 }} 
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
                  maxW={{ base: "100%", lg: "80%" }}
                  fontSize={{ base: "3xl", sm: "4xl", md: "5xl", lg: "6xl" }}
                  lineHeight={{ base: "1.2", md: "1.1" }}
                  fontWeight="bold"
                  mb={{ base: 2, md: 3 }}
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  fontFamily="ui-serif, LibreBaskerville, Georgia, serif"
                >
                  <Box as="span" display="inline-block" whiteSpace="nowrap">
                    Discover Your
                  </Box>
                  <Box as="span" display="inline-block" whiteSpace="nowrap">
                   AI-Powered Career Coach
                  </Box>
                </Box>
              )}
              description={!isBackgroundChanged && (
                <Box
                  color="black"
                  fontWeight="normal"
                  fontFamily="ui-serif, LibreBaskerville, Georgia, serif"
                  textAlign="center"
                  width="100%"
                  mx="auto"
                  maxW={{ base: "90%", md: "80%", lg: "70%" }}
                  fontSize={{ base: "lg", md: "xl", lg: "2xl" }}
                  lineHeight={{ base: "1.6", md: "1.8" }}
                  px={{ base: 4, md: 6 }}
                  mt={2}
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
                  <Box 
                    width={{ base: '100%', md: '85%', lg: '75%' }} 
                    maxWidth="1200px" 
                    mx="auto" 
                    position="relative"
                    marginTop={{ base: "8", md: "12" }}
                  >
                    <Box 
                      width="100%" 
                      borderRadius="xl"
                      overflow="hidden"
                      boxShadow="xl"
                    >
                      <video
                        width="100%" 
                        height="auto"
                        preload="auto"
                        playsInline
                        muted
                        loop
                        autoPlay
                        poster="/media/lexend-home-7.png"
                        style={{ 
                          borderRadius: '12px',
                          aspectRatio: '16/9',
                          objectFit: 'cover'
                        }}
                      >
                        <source src="/media/home.webm" type="video/webm" />
                        Your browser does not support the video tag.
                      </video>
                    </Box>
                  </Box>
                )}
              </Box>
            </Hero>
          </Stack>
        </Container>
      </Box>
    )
  }

export default HeroSection