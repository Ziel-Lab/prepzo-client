import { Container, Flex, FlexProps, chakra, VStack } from '@chakra-ui/react'

interface HeroProps extends Omit<FlexProps, 'title'> {
  title: string | React.ReactNode
  description?: string | React.ReactNode
}

export const Hero = ({ title, description, children, ...rest }: HeroProps) => {
  return (
    <Flex py="20" alignItems="center" {...rest}>
      <Container>
        <VStack spacing={[4, null, 8]} alignItems="flex-start">
          <chakra.h1 textStyle="h1" textAlign="left">
            {title}
          </chakra.h1>
          <chakra.div
            textStyle="subtitle"
            textAlign="left"
            color="gray.500"
            _dark={{ color: 'gray.400' }}
          >
            {description}
          </chakra.div>
        </VStack>
        {children}
      </Container>
    </Flex>
  )
}
