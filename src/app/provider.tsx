'use client'

import { AuthProvider } from '@saas-ui/auth'
import { SaasProvider } from '@saas-ui/react'
import { CacheProvider } from '@chakra-ui/next-js'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'

import { theme } from '@/theme'

export function Provider(props: { children: React.ReactNode }) {
  return (
    <>
      {/* Script to ensure consistent color mode on initial load */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var mode = localStorage.getItem('chakra-ui-color-mode');
                if (!mode) localStorage.setItem('chakra-ui-color-mode', 'light');
              } catch (e) {}
            })();
          `
        }}
      />
      <ColorModeScript initialColorMode="light" />
      <CacheProvider>
        <ChakraProvider theme={theme} resetCSS colorModeManager={{
          get: () => 'light',
          set: () => {},
          type: 'localStorage',
        }}>
          <SaasProvider theme={theme}>
            <AuthProvider>{props.children}</AuthProvider>
          </SaasProvider>
        </ChakraProvider>
      </CacheProvider>
    </>
  )
} 