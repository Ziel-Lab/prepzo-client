'use client'

import { Box, Center, Stack, Text } from '@chakra-ui/react'
import { Auth } from '@saas-ui/auth'
import { Link } from '@saas-ui/react'
import { FaGithub, FaGoogle } from 'react-icons/fa'


import { BackgroundGradient } from '@/components/gradients/background-gradient'
import { PageTransition } from '@/components/motion/page-transition'
import { Section } from '@/components/section'
import siteConfig from '@/data/config'

const providers = {
  google: {
    name: 'Google',
    icon: FaGoogle,
  },
  github: {
    name: 'Github',
    icon: FaGithub,
    variant: 'solid',
  },
}

export default function SignupPage() {
  return (
    <Section height="100vh" innerWidth="container.xl">
      <BackgroundGradient height="100%" zIndex="-1"  transition="opacity 0.3s ease" />
      <PageTransition height="100%" display="flex" alignItems="center">
        <Stack
          width="100%"
          alignItems={{ base: 'center', lg: 'flex-start' }}
          spacing="20"
          flexDirection={{ base: 'column', lg: 'row' }}
        >
          <Center height="100%" flex="1">
            <Box width="container.sm" pt="8" px="8">
              <Auth
                view="signup"
                title={siteConfig.signup.title}
                providers={providers}
                loginLink={<Link href="/login">Log in</Link>}
              >
                <Text color="muted" fontSize="sm">
                  By signing up you agree to our{' '}
                  <Link href='/terms-of-service' target='_blank' fontWeight='bold'>
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy-policy" target='_blank' fontWeight='bold'>
                    Privacy Policy
                  </Link>
                </Text>
              </Auth>
            </Box>
          </Center>
        </Stack>
      </PageTransition>
    </Section>
  )
} 