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

const PrivacyPolicyPage = () => {
  return (
    <Box bg="white" _dark={{ bg: 'gray.900' }}>
      <Section>
        <Container maxW="container.lg" py={8}>
          <SectionTitle
            title="Privacy Policy"
            description="Learn how Prepzo collects, uses, and protects your personal information."
            align="left"
          />
          
          <VStack spacing={8} align="stretch">
            <Box>
              <Heading as="h3" size="md" mb={4}>
                1. Information We Collect
              </Heading>
              <Text mb={4}>
                We collect information that you provide directly to us, including:
              </Text>
              <UnorderedList spacing={2} pl={4}>
                <ListItem>Account information (name, email, professional details)</ListItem>
                <ListItem>Career goals and preferences</ListItem>
                <ListItem>Communication history with our AI coach</ListItem>
                <ListItem>Usage data and interaction patterns</ListItem>
              </UnorderedList>
            </Box>

            <Box>
              <Heading as="h3" size="md" mb={4}>
                2. How We Use Your Information
              </Heading>
              <Text mb={4}>
                Your information helps us provide and improve our services:
              </Text>
              <UnorderedList spacing={2} pl={4}>
                <ListItem>Personalizing your career coaching experience</ListItem>
                <ListItem>Improving our AI coaching algorithms</ListItem>
                <ListItem>Sending relevant updates and recommendations</ListItem>
                <ListItem>Analyzing service performance and user satisfaction</ListItem>
              </UnorderedList>
            </Box>

            <Box>
              <Heading as="h3" size="md" mb={4}>
                3. Data Protection
              </Heading>
              <Text mb={4}>
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </Text>
            </Box>

            <Box>
              <Heading as="h3" size="md" mb={4}>
                4. Data Sharing and Third Parties
              </Heading>
              <Text mb={4}>
                We do not sell your personal information. We may share your information with:
              </Text>
              <UnorderedList spacing={2} pl={4}>
                <ListItem>Service providers who assist in our operations</ListItem>
                <ListItem>Professional partners for career opportunities (with your consent)</ListItem>
                <ListItem>Legal authorities when required by law</ListItem>
              </UnorderedList>
            </Box>

            <Box>
              <Heading as="h3" size="md" mb={4}>
                5. Your Rights and Choices
              </Heading>
              <Text mb={4}>
                You have the right to:
              </Text>
              <UnorderedList spacing={2} pl={4}>
                <ListItem>Access your personal information</ListItem>
                <ListItem>Correct inaccurate data</ListItem>
                <ListItem>Request deletion of your data</ListItem>
                <ListItem>Opt-out of marketing communications</ListItem>
              </UnorderedList>
            </Box>

            <Box>
              <Heading as="h3" size="md" mb={4}>
                6. Cookies and Tracking
              </Heading>
              <Text mb={4}>
                We use cookies and similar technologies to enhance your experience, analyze usage patterns, and optimize our service. You can control cookie preferences through your browser settings.
              </Text>
            </Box>

            <Box>
              <Heading as="h3" size="md" mb={4}>
                7. Changes to Privacy Policy
              </Heading>
              <Text mb={4}>
                We may update this privacy policy periodically. We will notify you of any material changes via email or through our platform before they become effective.
              </Text>
            </Box>

            <Box>
              <Heading as="h3" size="md" mb={4}>
                8. Contact Us
              </Heading>
              <Text mb={4}>
                If you have questions about this Privacy Policy or your personal information, please contact us at hello@prepzo.co
              </Text>
            </Box>
          </VStack>
        </Container>
      </Section>
    </Box>
  )
}

export default PrivacyPolicyPage