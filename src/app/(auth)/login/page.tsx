'use client'

import { Center, IconButton } from '@chakra-ui/react'
import { Auth } from '@saas-ui/auth'
import { Link } from '@saas-ui/react'
// import { BackgroundGradient } from '@/components/gradients/background-gradient'
import { PageTransition } from '@/components/motion/page-transition'
import { Section } from '@/components/section'
import { FaGithub, FaGoogle, FaArrowLeft } from 'react-icons/fa'
import { useRouter } from 'next/navigation'  // Changed from next/router

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

export default function LoginPage() {
  const router = useRouter()

  const handleGoBack = () => {
    router.push('/')
  }
  return (
    <Section height="calc(100vh - 200px)" innerWidth="container.sm">
      {/* <BackgroundGradient zIndex="-1" /> */}

      <Center height="100%" pt="20">
      <IconButton
        icon={<FaArrowLeft />}
        aria-label="Go back to homepage"
        position="absolute"
        top={{ base: 4, md: 8 }}
        left={{ base: 4, md: 8 }}
        variant="ghost"
        onClick={handleGoBack}
        zIndex="10"
        rounded="full"
        size="lg"
        _hover={{
          bg: 'rgba(255,255,255,0.1)',
          border: '2px solid',
          borderColor: 'purple.500',
          color: 'purple.500',
        }}
        bg="gray.100"
        _dark={{
          bg: 'gray.900',
        }}
      />
        <PageTransition width="100%">
          <Auth
            view="login"
            providers={providers}
            signupLink={<Link href="/signup">Sign up</Link>}
          />
        </PageTransition>
      </Center>
    </Section>
  )
}