'use client'

import { ColorModeScript } from '@chakra-ui/react'
import { theme } from '@/theme'

export function ColorModeInitializer() {
  return (
    <ColorModeScript
      initialColorMode={theme.config.initialColorMode}
      storageKey="chakra-ui-color-mode"
    />
  )
}