'use client'

import { AuthProvider } from '@saas-ui/auth'
import { SaasProvider } from '@saas-ui/react'
import { CacheProvider } from '@chakra-ui/next-js'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'

import { theme } from '@/theme'

export function Provider(props: { children: React.ReactNode }) {
  return (
    <>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <CacheProvider>
        <ChakraProvider theme={theme}>
          <SaasProvider theme={theme}>
            <AuthProvider>{props.children}</AuthProvider>
          </SaasProvider>
        </ChakraProvider>
      </CacheProvider>
    </>
  )
} 