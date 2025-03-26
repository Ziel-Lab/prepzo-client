import { 
  Avatar,
  Box, 
  HStack,
  ListItem, 
  SimpleGrid, 
  Text, 
  UnorderedList, 
  useBreakpointValue, 
  useColorModeValue, 
  VStack 
} from "@chakra-ui/react"
import { Highlights, HighlightsItem, HighlightsTestimonialItem } from "../highlights/highlights"

export const HighlightsSection = () => {
  const isMobile = useBreakpointValue({ base: true, md: false })
  const bgColor = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue("gray.600", "gray.300")
  const headingColor = useColorModeValue('gray.900', 'white')
  const testimonialTextColor = useColorModeValue("gray.700", "gray.200")

  const MobileHighlightCard = ({ title, description, items }: { title: string; description: string; items: string[] }) => (
    <Box
      bg={bgColor}
      borderRadius="lg"
      p={6}
      shadow="sm"
      width="100%"
    >
      <VStack spacing={4} align="start" width="100%">
        <Text
          fontSize="xl"
          fontWeight="bold"
          color={headingColor}
        >
          {title}
        </Text>
        <Text
          color={textColor}
          fontSize="md"
          lineHeight="tall"
        >
          {description}
        </Text>
        <UnorderedList
          color={textColor}
          fontSize="md"
          spacing={3}
          pl={4}
          width="100%"
          stylePosition="outside"
        >
          {items.map((item, index) => (
            <ListItem key={index}>{item}</ListItem>
          ))}
        </UnorderedList>
      </VStack>
    </Box>
  )

  const MobileTestimonial = ({ quote, name, title, avatar }: { quote: string; name: string; title: string; avatar: string }) => (
    <Box
      bgGradient="linear(to-r, purple.500, purple.300)"
      borderRadius="lg"
      p={6}
      shadow="md"
      width="100%"
      color="white"
    >
      <VStack spacing={4} align="start">
        <Text
          fontSize="md"
          fontStyle="italic"
          lineHeight="tall"
        >
          {quote}
        </Text>
        <HStack spacing={3} width="100%">
          <Avatar src={avatar} size="md" />
          <Box>
            <Text fontWeight="bold">
              {name}
            </Text>
            <Text fontSize="sm" opacity={0.9}>
              {title}
            </Text>
          </Box>
        </HStack>
      </VStack>
    </Box>
  )

  if (isMobile) {
    return (
      <Box px={4} py={8}>
        <SimpleGrid columns={1} spacing={6} width="100%">
          <MobileHighlightCard
            title="Evolving with Your Journey"
            description="Each session builds upon the last, ensuring your coaching experience grows with your career progression."
            items={[
              "Reflect on past discussions to inform future decisions",
              "Develop a coherent and personalized career plan"
            ]}
          />
          
          <MobileHighlightCard
            title="Curated Resources Just for You"
            description="Receive up-to-date resources specifically selected to match your evolving professional needs."
            items={[
              "Explore job opportunities aligned with your goals",
              "Engage with tailored skills training materials",
              "Gain insights to foster professional growth"
            ]}
          />

          <MobileTestimonial
            quote="At Prepzo, we recognize that finding the right mentor can be challenging. Leveraging advanced AI technology, Prepzo serves as a personalized mentor, offering tailored guidance to help you navigate your career journey effectively."
            name="Abhishek Singla"
            title="Founder"
            avatar="/static/images/abhishek.png"
          />

          <MobileHighlightCard
            title="Engaging Conversations"
            description="Interact in real-time with an AI that offers empathetic support, helping you navigate professional challenges and seize opportunities."
            items={[
              "Immediate, relevant advice",
              "Continuous learning to better understand your needs",
              "Access to professional insights instantly"
            ]}
          />
        </SimpleGrid>
      </Box>
    )
  }

  return (
    <Highlights
      py={{ base: 8, md: 12, lg: 16 }}
      px={{ base: 4, md: 6, lg: 8 }}
      gap={{ base: 6, md: 8 }}
      mx="auto"
      maxW="7xl"
    >
      <HighlightsItem 
        colSpan={[12, null, 6]} 
        title="Evolving with Your Journey"
        py={{ base: 6, md: 8 }}
        px={{ base: 6, md: 8 }}
        bg={bgColor}
        borderRadius="xl"
        shadow="sm"
      >
        <VStack alignItems="flex-start" spacing={{ base: 4, md: 6 }} width="100%">
          <Text 
            color={textColor}
            fontSize={{ base: "md", md: "lg" }} 
            lineHeight="tall"
          >
            Each session builds upon the last, ensuring your coaching experience grows with your career progression.
          </Text>
          <UnorderedList 
            color={textColor}
            fontSize={{ base: "md", md: "lg" }} 
            spacing={{ base: 3, md: 4 }} 
            pl={{ base: 4, md: 6 }}
            width="100%"
          >
            <ListItem>Reflect on past discussions to inform future decisions</ListItem>
            <ListItem>Develop a coherent and personalized career plan</ListItem>
          </UnorderedList>
        </VStack>
      </HighlightsItem>

      <HighlightsItem 
        colSpan={[12, null, 6]} 
        title="Curated Resources Just for You"
        py={{ base: 6, md: 8 }}
        px={{ base: 6, md: 8 }}
        bg={bgColor}
        borderRadius="xl"
        shadow="sm"
      >
        <VStack alignItems="flex-start" spacing={{ base: 4, md: 6 }} width="100%">
          <Text 
            color={textColor}
            fontSize={{ base: "md", md: "lg" }} 
            lineHeight="tall"
          >
            Receive up-to-date resources specifically selected to match your evolving professional needs.
          </Text>
          <UnorderedList 
            color={textColor}
            fontSize={{ base: "md", md: "lg" }} 
            spacing={{ base: 3, md: 4 }} 
            pl={{ base: 4, md: 6 }}
            width="100%"
          >
            <ListItem>Explore job opportunities aligned with your goals</ListItem>
            <ListItem>Engage with tailored skills training materials</ListItem>
            <ListItem>Gain insights to foster professional growth</ListItem>
          </UnorderedList>
        </VStack>
      </HighlightsItem>

      <HighlightsTestimonialItem
        colSpan={[12, null, 5]}
        name="Abhishek Singla"
        customTitle="Founder"
        avatar="/static/images/abhishek.png"
        gradient={['purple.500', 'purple.300']}
        description="Founder"
        py={{ base: 8, md: 10 }}
        px={{ base: 6, md: 8 }}
        borderRadius="xl"
        shadow="lg"
      >
        <Text
          fontSize={{ base: "md", md: "lg" }}
          fontStyle="italic"
          lineHeight="tall"
          color={testimonialTextColor}
        >
          &ldquo;At Prepzo, we recognize that finding the right mentor can be challenging. Leveraging advanced AI technology, Prepzo serves as a personalized mentor, offering tailored guidance to help you navigate your career journey effectively.&rdquo;
        </Text>
      </HighlightsTestimonialItem>

      <HighlightsItem 
        colSpan={[12, null, 7]} 
        title="Engaging Conversations"
        py={{ base: 6, md: 8 }}
        px={{ base: 6, md: 8 }}
        bg={bgColor}
        borderRadius="xl"
        shadow="sm"
      >
        <VStack alignItems="flex-start" spacing={{ base: 4, md: 6 }} width="100%">
          <Text 
            color={textColor}
            fontSize={{ base: "md", md: "lg" }} 
            lineHeight="tall"
          >
            Interact in real-time with an AI that offers empathetic support, helping you navigate professional challenges and seize opportunities.
          </Text>

          <UnorderedList 
            color={textColor}
            fontSize={{ base: "md", md: "lg" }} 
            spacing={{ base: 3, md: 4 }} 
            pl={{ base: 4, md: 6 }}
            width="100%"
          >
            <ListItem>Immediate, relevant advice</ListItem>
            <ListItem>Continuous learning to better understand your needs</ListItem>
            <ListItem>Access to professional insights instantly</ListItem>
          </UnorderedList>
        </VStack>
      </HighlightsItem>
    </Highlights>
  )
}