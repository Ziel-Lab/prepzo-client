'use client'

import { Box, useTheme, useColorModeValue, BoxProps } from '@chakra-ui/react'
import { useEffect, useState } from 'react'

interface BackgroundGradientProps extends BoxProps {
  hideOverlay?: boolean;
}

export const BackgroundGradient = ({ hideOverlay, ...props }: BackgroundGradientProps) => {
  const theme = useTheme()
  const colors = [
    theme.colors.primary['800'],
    theme.colors.secondary['500'],
    theme.colors.cyan['500'],
    theme.colors.teal['500'],
  ]

  const fallbackBackground = `radial-gradient(at top left, ${colors[0]} 30%, transparent 80%), radial-gradient(at bottom, ${colors[1]} 0%, transparent 60%), radial-gradient(at bottom left, var(--chakra-colors-cyan-500) 0%, transparent 50%),
        radial-gradient(at top right, ${colors[3]}, transparent), radial-gradient(at bottom right, ${colors[0]} 0%, transparent 50%);`

  // Separate gradient overlays for light and dark mode
  const lightModeOverlay = `linear-gradient(0deg, var(--chakra-colors-white) 60%, rgba(135, 173, 226, 0.68) 100%);`
  const darkModeOverlay = `linear-gradient(0deg, var(--chakra-colors-gray-900) 60%, rgba(42, 84, 140, 0.68) 100%);`
  
  // Use the appropriate overlay based on color mode
  const gradientOverlay = useColorModeValue(lightModeOverlay, darkModeOverlay)
  
  // Client-side only rendering to avoid hydration mismatch
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Always call hooks unconditionally
  const opacityValue = useColorModeValue('0.3', '0.5')
  // Then use the value conditionally
  const opacity = isClient ? opacityValue : '0.3'

  return (
    <Box
      backgroundImage={fallbackBackground}
      backgroundBlendMode="saturation"
      position="absolute"
      top="0"
      left="0"
      zIndex="0"
      opacity={opacity}
      height="100vh"
      width="100%"
      overflow="hidden"
      pointerEvents="none"
      {...props}
    >
      <Box
        backgroundImage={!hideOverlay ? (isClient ? gradientOverlay : lightModeOverlay) : undefined}
        position="absolute"
        top="0"
        right="0"
        bottom="0"
        left="0"
        zIndex="1"
      ></Box>
    </Box>
  )
}
