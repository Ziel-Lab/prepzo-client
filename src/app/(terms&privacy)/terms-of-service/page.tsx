'use client'

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  UnorderedList,
  ListItem,
} from '@chakra-ui/react'
import { Section } from '@/components/section'
import { SectionTitle } from '@/components/section/section-title'

const TermsOfServicePage = () => {
  return (
    <Box bg="white" _dark={{ bg: 'gray.900' }}>
      <Section>
        <Container maxW="container.lg" py={8}>
          <SectionTitle
            title="Terms of Service"
            description="Please read these terms of service carefully before using Prepzo."
            align="left"
          />
          
          <VStack spacing={8} align="stretch">
            <Box>
              <Heading as="h3" size="md" mb={4}>
                1. Acceptance of Terms
              </Heading>
              <Text mb={4}>
                By accessing and using Prepzo, you accept and agree to be bound by the terms and conditions outlined in this agreement.
              </Text>
            </Box>

            <Box>
              <Heading as="h3" size="md" mb={4}>
                2. Description of Service
              </Heading>
              <Text mb={4}>
                Prepzo is an AI-powered career coaching platform that provides personalized guidance, resources, and support for professional development.
              </Text>
            </Box>

            <Box>
              <Heading as="h3" size="md" mb={4}>
                3. User Responsibilities
              </Heading>
              <Text mb={4}>
                As a user of Prepzo, you agree to:
              </Text>
              <UnorderedList spacing={2} pl={4}>
                <ListItem>Provide accurate and complete information</ListItem>
                <ListItem>Maintain the confidentiality of your account</ListItem>
                <ListItem>Use the service in a lawful and appropriate manner</ListItem>
                <ListItem>Not share your account access with others</ListItem>
              </UnorderedList>
            </Box>

            <Box>
              <Heading as="h3" size="md" mb={4}>
                4. Privacy and Data Protection
              </Heading>
              <Text mb={4}>
                Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms of Service.
              </Text>
            </Box>

            <Box>
              <Heading as="h3" size="md" mb={4}>
                5. Intellectual Property
              </Heading>
              <Text mb={4}>
                All content, features, and functionality of Prepzo, including but not limited to text, graphics, logos, and software, are owned by Prepzo and protected by intellectual property laws.
              </Text>
            </Box>

            <Box>
              <Heading as="h3" size="md" mb={4}>
                6. Limitation of Liability
              </Heading>
              <Text mb={4}>
                Prepzo and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service.
              </Text>
            </Box>

            <Box>
              <Heading as="h3" size="md" mb={4}>
                7. Changes to Terms
              </Heading>
              <Text mb={4}>
                We reserve the right to modify these terms at any time. We will notify users of any material changes through the service or via email.
              </Text>
            </Box>

            <Box>
              <Heading as="h3" size="md" mb={4}>
                8. Contact Information
              </Heading>
              <Text mb={4}>
                For questions about these Terms of Service, please contact us at hello@prepzo.co
              </Text>
            </Box>
          </VStack>
        </Container>
      </Section>
    </Box>
  )
}

export default TermsOfServicePage