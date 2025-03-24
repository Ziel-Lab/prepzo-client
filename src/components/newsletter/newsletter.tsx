import React, { useState } from 'react'
import {
  Box,
  Button,
  Container,
  Heading,
  Input,
  Stack,
  Text,
  VStack,
  useColorModeValue,
  useToast,
  FormControl,
  HStack,
} from '@chakra-ui/react'
import { FiSend } from 'react-icons/fi'
import { Section, SectionProps } from '@/components/section'
import { Em } from '@/components/typography'

export interface CustomSectionProps extends Omit<SectionProps, 'title' | 'children'> {
  title?: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
}

export interface NewsletterProps extends CustomSectionProps {
  /* Newsletter specific properties */
  id?: string;
  onSubscribe?: (email: string) => Promise<void>;
}

export const Newsletter: React.FC<NewsletterProps> = (props) => {
  const { title, description, ...rest } = props
  const [email, setEmail] = useState('')
  // Commented out unused variable
  // const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const toast = useToast()
  
  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const buttonBg = useColorModeValue('purple.500', 'purple.300')
  const buttonHoverBg = useColorModeValue('purple.600', 'purple.400')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast({
        title: 'Email is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }
    
    setIsSubmitting(true)
    
    // Here you would integrate with your newsletter service (Mailchimp, ConvertKit, etc.)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: 'Subscription successful!',
        description: "We've sent a confirmation to your email.",
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
      
      setEmail('')
    } catch (
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _error
    ) {
      toast({
        title: 'Error subscribing',
        description: 'Please try again later.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Section bg={bgColor} py="16" {...rest}>
      <Container maxW="container.xl">
        <VStack spacing={8} textAlign="center">
          {title && (
            <Heading as="h2" fontSize={{ base: '3xl', md: '4xl' }} fontWeight="bold">
              {title}
            </Heading>
          )}
          
          {description && (
            <Text fontSize="lg" color={textColor} maxW="3xl">
              {description}
            </Text>
          )}
          
          <Box w="full" maxW="xl" mx="auto" mt={4}>
            <Stack
              as="form"
              onSubmit={handleSubmit}
              direction={{ base: 'column', md: 'row' }}
              spacing={4}
              w="full"
            >
              <FormControl flex="3">
                <Input
                  h="14"
                  px={4}
                  fontSize="md"
                  border="1px solid"
                  borderColor={borderColor}
                  _hover={{ borderColor: 'purple.300' }}
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  _focus={{ 
                    borderColor: 'purple.500',
                    boxShadow: '0 0 0 1px var(--chakra-colors-purple-500)'
                  }}
                  borderRadius="md"
                />
              </FormControl>
              
              <Button
                flex={{ base: '1', md: 'initial' }}
                h="14"
                px={8}
                fontSize="md"
                fontWeight="bold"
                colorScheme="purple"
                bg={buttonBg}
                _hover={{ bg: buttonHoverBg }}
                isLoading={isSubmitting}
                type="submit"
                leftIcon={<FiSend />}
                borderRadius="md"
              >
                Subscribe
              </Button>
            </Stack>
          </Box>
          
          <HStack spacing={4} pt={4} justify="center" wrap="wrap">
            <Box px={3} py={1} bg="purple.50" color="purple.600" borderRadius="full" fontSize="sm" fontWeight="medium" _dark={{ bg: 'purple.900', color: 'purple.200' }}>
              Accessible
            </Box>
            <Box px={3} py={1} bg="blue.50" color="blue.600" borderRadius="full" fontSize="sm" fontWeight="medium" _dark={{ bg: 'blue.900', color: 'blue.200' }}>
              Themable
            </Box>
            <Box px={3} py={1} bg="pink.50" color="pink.600" borderRadius="full" fontSize="sm" fontWeight="medium" _dark={{ bg: 'pink.900', color: 'pink.200' }}>
              Composable
            </Box>
            <Box px={3} py={1} bg="green.50" color="green.600" borderRadius="full" fontSize="sm" fontWeight="medium" _dark={{ bg: 'green.900', color: 'green.200' }}>
              Productive
            </Box>
          </HStack>
          
          <Text fontSize="sm" color="gray.500" pt={2}>
            By subscribing, you agree to our <Em>Privacy Policy</Em> and <Em>Terms of Service</Em>.
          </Text>
        </VStack>
      </Container>
    </Section>
  )
} 