import React from 'react'
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
  Container,
  Heading,
  Text,
  VStack,
  useColorModeValue
} from '@chakra-ui/react'

interface FaqItem {
  question: string;
  answer: string | React.ReactNode;
}

interface FaqProps {
  id?: string;
  title?: string;
  description?: string;
  items: FaqItem[];
}

export const Faq: React.FC<FaqProps> = ({
  title = 'Frequently asked questions',
  description,
  items,
  id
}) => {
  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.900')
  const textColor = useColorModeValue('gray.800', 'white')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const expandedColor = useColorModeValue('purple.500', 'purple.300')
  const answerBgColor = useColorModeValue('gray.50', 'gray.800')
  const answerTextColor = useColorModeValue('gray.600', 'gray.300')
  const hoverBgColor = useColorModeValue('gray.100', 'gray.800')

  return (
    <Container maxW="container.lg" py={12} id={id} bg={bgColor}>
      <VStack spacing={8} align="stretch">
        {/* Section Header */}
        <VStack textAlign="center" spacing={4}>
          <Heading 
            as="h2" 
            size="xl" 
            color={textColor}
          >
            {title}
          </Heading>
          {description && (
            <Text color="gray.500" maxW="2xl">
              {description}
            </Text>
          )}
        </VStack>

        {/* Accordion */}
        <Accordion 
          allowMultiple 
          variant="unstyled"
        >
          {items.map((item, index) => (
            <AccordionItem 
              key={index} 
              borderTop="1px solid" 
              borderBottom="1px solid" 
              borderColor={borderColor}
              _last={{ 
                borderBottom: "1px solid", 
                borderColor: borderColor 
              }}
            >
              {({ isExpanded }) => (
                <>
                  <AccordionButton
                    py={4}
                    _hover={{ 
                      bg: hoverBgColor,
                      transition: "background 0.3s ease"
                    }}
                  >
                    <Box 
                      flex="1" 
                      textAlign="left" 
                      fontWeight="semibold"
                      color={isExpanded ? expandedColor : textColor}
                    >
                      {item.question}
                    </Box>
                    <AccordionIcon color={isExpanded ? expandedColor : textColor} />
                  </AccordionButton>
                  <AccordionPanel 
                    pb={4} 
                    color={answerTextColor}
                    bg={answerBgColor}
                  >
                    {item.answer}
                  </AccordionPanel>
                </>
              )}
            </AccordionItem>
          ))}
        </Accordion>
      </VStack>
    </Container>
  )
}

// Example usage

