import React from 'react'
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  useColorModeValue,
  Icon,
  Circle,
} from '@chakra-ui/react'
import { FaRobot, FaChartLine,  } from 'react-icons/fa'
import { FaPersonCircleCheck } from "react-icons/fa6";

const HowItWorkSection = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const cardBg = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.600', 'gray.400')
  
  // Icon styling based on color mode - more visible now
  const circleBg = useColorModeValue('rgba(147, 112, 219, 0.15)', 'rgba(33, 33, 35, 0.9)')
  const iconColor = useColorModeValue('purple.500', 'purple.400')

  return (
    <Box as="section" py={16} bg={bgColor} width="full">
      <Container maxW="container.xl" px={2}>
        <Heading 
          as="h2" 
          fontSize="4xl" 
          fontWeight="bold" 
          textAlign="center" 
          mb={16}
        >
          How It Works
        </Heading>
        
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} maxW="5xl" mx="auto">
          <Box 
            bg={cardBg} 
            rounded="lg" 
            shadow="md" 
            p={8} 
            textAlign="center"
          >
            <VStack spacing={6}>
              <Circle size="70px" bg={circleBg}>
                <Icon as={FaRobot} w={8} h={8} color={iconColor} />
              </Circle>
              <Heading as="h3" fontSize="2xl" fontWeight="semibold">
                AI-Powered Coaching
              </Heading>
              <Text color={textColor}>
                It&apos;s a coach that listens, learns, and evolves with you—offering tailored guidance for your career goals.
              </Text>
            </VStack>
          </Box>

          <Box 
            bg={cardBg} 
            rounded="lg" 
            shadow="md" 
            p={8} 
            textAlign="center"
          >
            <VStack spacing={6}>
              <Circle size="70px" bg={circleBg}>
                <Icon as={FaPersonCircleCheck } w={8} h={8} color={iconColor} />
              </Circle>
              <Heading as="h3" fontSize="2xl" fontWeight="semibold">
                Personal Dashboard
              </Heading>
              <Text color={textColor}>
                Practice real interviews. Get instant feedback. Build confidence.
              </Text>
            </VStack>
          </Box>

          <Box 
            bg={cardBg} 
            rounded="lg" 
            shadow="md" 
            p={8} 
            textAlign="center"
          >
            <VStack spacing={6}>
              <Circle size="70px" bg={circleBg}>
                <Icon as={FaChartLine} w={8} h={8} color={iconColor} />
              </Circle>
              <Heading as="h3" fontSize="2xl" fontWeight="semibold">
                Real-time Career Insights
              </Heading>
              <Text color={textColor}>
                Ask tough questions. Define your path. Make smarter decisions.
              </Text>
            </VStack>
          </Box>
        </SimpleGrid>
{/*         
        <Text 
          fontSize="2xl" 
          color={textColor} 
          textAlign="center" 
          mt={14}
        >
          Prepzo was built to make career growth simpler.
        </Text> */}
      </Container>
    </Box>
  )
}

export default HowItWorkSection 