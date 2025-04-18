import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Button,
    Text,
    VStack,
    HStack,
    List,
    ListItem,
    ListIcon,
    Image,
    Box,
    useColorModeValue,
    Icon,
  } from "@chakra-ui/react";
  import { CheckCircleIcon } from "@chakra-ui/icons"; // Using CheckCircleIcon for a filled look
  import React from "react";
  
  // Rocket emoji as a custom icon component
  const RocketIcon = (props: React.ComponentProps<typeof Icon>) => (
    <Icon viewBox="0 0 200 200" {...props}>
      <text x="10" y="150" fontSize="140">🚀</text>
    </Icon>
  );
  
  interface InterstitialModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStartTalking: () => void;
  }
  
  const AgentModal: React.FC<InterstitialModalProps> = ({
    isOpen,
    onClose,
    onStartTalking,
  }) => {
    const bgColor = useColorModeValue("white", "gray.800");
    const textColor = useColorModeValue("gray.700", "gray.300");
    const headerColor = useColorModeValue("gray.800", "white");
    const quoteBg = useColorModeValue("blue.50", "blue.900");
    const quoteBorder = useColorModeValue("blue.200", "blue.700");
    const stickyBg = useColorModeValue("rgba(255, 255, 255, 0.8)", "rgba(45, 55, 72, 0.8)"); // Semi-transparent bg for sticky button
  
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(5px)" />
        <ModalContent bg={bgColor} borderRadius="lg" maxH="85vh">
          <ModalHeader /> {/* Remove default header text, we'll add custom below */}
          <ModalCloseButton />
          <ModalBody pt={0} pb={24}> {/* Add padding-bottom to avoid overlap with sticky button */}
            <VStack spacing={6} align="stretch">
              {/* Header Section */}
              <HStack align="center" spacing={4} flexWrap="wrap" justify="space-between">
                <VStack align="start" spacing={1} flex="1">
                  <Text
                    as="h1"
                    fontSize={{ base: "xl", md: "2xl", lg: "3xl" }}
                    fontWeight="bold"
                    lineHeight="tight"
                    color={headerColor}
                  >
                    Meet Prepzo — Your Personal AI Career Coach
                  </Text>
                  <Text fontSize={{ base: "sm", md: "md" }} color={textColor}>
                  Prepzo isn&apos;t just another chatbot. It&apos;s your career co-pilot — built to help you navigate work, job searches, upskilling, and everything in between.
                  </Text>
                </VStack>

                <Box flexShrink={0}>
                  <Image
                    src="/media/prepzo-agent.png"
                    alt="Prepzo AI Agent Illustration"
                    boxSize={{ base: "80px", md: "120px" }}
                    objectFit="contain"
                  />
                </Box>
              </HStack>
              {/* Quick Overview Section */}
              <Box>
                <Text fontSize="lg" fontWeight="semibold" mb={3} color={headerColor}>
                  Quick Overview: What Can Prepzo Do for You?
                </Text>
                <List spacing={2}>
                  {[
                    "Help you find better jobs (and tailor your applications)",
                    "Answer questions about skills, career moves, and job trends",
                    "Coach you on interview prep, salary negotiations, and workplace situations",
                    "Talk through career fears — from AI job disruption to job stagnation",
                    "Summarize insights in an email you can keep for reference",
                    "Brainstorm strategies to grow, lead, or reconnect with your team",
                    "Help you plan when you feel demotivated, stuck, or lost at work",
                  ].map((item, index) => (
                    <ListItem key={index} display="flex" alignItems="center">
                      <ListIcon as={CheckCircleIcon} color="green.500" mt="1px" />
                      <Text fontSize="sm" color={textColor}>{item}</Text>
                    </ListItem>
                  ))}
                </List>
              </Box>
  
              {/* Try Asking Section */}
              <Box>
                <Text fontSize="lg" fontWeight="semibold" mb={3} color={headerColor}>
                  Try Asking Prepzo:
                </Text>
                <Box
                  bg={quoteBg}
                  borderLeft="4px"
                  borderColor={quoteBorder}
                  p={4}
                  borderRadius="md"
                >
                  <VStack align="start" spacing={1}>
                    <Text fontStyle="italic" fontSize="sm" color={textColor}>“What kind of jobs fit my skills right now?”</Text>
                    <Text fontStyle="italic" fontSize="sm" color={textColor}>“I want to switch industries. What should I learn first?”</Text>
                    <Text fontStyle="italic" fontSize="sm" color={textColor}>“How can I talk to my manager about a promotion?”</Text>
                    <Text fontStyle="italic" fontSize="sm" color={textColor}>“Is AI going to replace my job in marketing?”</Text>
                    <Text fontStyle="italic" fontSize="sm" color={textColor}>“Can you email me a plan to improve my career this quarter?”</Text>
                  </VStack>
                </Box>
                <Text mt={2} fontSize="xs" color="gray.500">
                  💡 **Tip:** The more honest and personal your questions, the better Prepzo can help.
                </Text>
              </Box>
            </VStack>
          </ModalBody>
  
          {/* Sticky Footer Button */}
          <Box
            position="sticky"
            bottom="0"
            left="0"
            right="0"
            p={4}
            bg={stickyBg}
            backdropFilter="blur(5px)" // Enhance the floating effect
            borderTopWidth="1px"
            borderColor={useColorModeValue("gray.200", "gray.700")}
            zIndex={1} // Ensure it's above the scrolling content
            borderBottomRadius="lg" // Match modal border radius
          >
            <Button
              width="full"
              colorScheme="red" // Using red to match the original screenshot's button color hint
              size="lg"
              onClick={() => {
                onStartTalking(); // Call the function passed from the parent
                onClose(); // Close the modal
              }}
              leftIcon={<RocketIcon boxSize="1.5em" />}
            >
              Great — Start Talking to Prepzo Now!
            </Button>
          </Box>
        </ModalContent>
      </Modal>
    );
  };
  
  export default AgentModal;
  