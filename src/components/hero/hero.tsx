import { Container, Flex, FlexProps, Text, VStack } from '@chakra-ui/react'

interface HeroProps extends Omit<FlexProps, 'title'> {
  title: string | React.ReactNode
  description?: string | React.ReactNode
}

export const Hero = ({ title, description, children, ...rest }: HeroProps) => {
  return (
    <Flex py="10" alignItems="center" width="100%" {...rest}>
      <Container maxW="container.2xl" width="100%">
        <VStack spacing={[4, null, 8]} alignItems="center" width="100%">
          {title}
          {description && (
            <Text
              as="div"
              textStyle="subtitle"
              textAlign="center"
              width="100%"
              color="gray.500"
              _dark={{ color: 'gray.400' }}
              fontFamily="ui-serif, LibreBaskerville, Georgia, serif"
            >
              {description}
            </Text>
          )}
        </VStack>
        {children}
      </Container>
    </Flex>
  )
}
