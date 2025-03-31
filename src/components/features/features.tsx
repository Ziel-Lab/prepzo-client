import * as React from 'react'
import {
  Box,
  Stack,
  VStack,
  SimpleGrid,
  Heading,
  Text,
  Icon,
  Circle,
  ResponsiveValue,
  useMultiStyleConfig,
  ThemingProps,
  SystemProps,
  Card,
  CardBody,
} from '@chakra-ui/react'

import { Section, SectionTitleProps } from '@/components/section'

interface RevealerProps {
  children: React.ReactNode;
  delay?: number;
}

const Revealer = ({ children }: RevealerProps) => {
  return children
}

export interface UseCaseGalleryProps
  extends Omit<SectionTitleProps, 'title' | 'variant'>,
    ThemingProps<'Features'> {
  title?: React.ReactNode
  description?: React.ReactNode
  subheading?: React.ReactNode
  features: Array<FeatureProps>
  columns?: ResponsiveValue<number>
  spacing?: string | number
  aside?: React.ReactNode
  reveal?: React.FC<RevealerProps>
  iconSize?: SystemProps['boxSize']
  innerWidth?: SystemProps['maxW']
  maxFeatures?: number
}

export interface FeatureProps {
  title?: React.ReactNode
  description?: React.ReactNode
  icon?: React.ComponentType | React.ElementType
  iconPosition?: 'left' | 'top'
  iconSize?: SystemProps['boxSize']
  ip?: 'left' | 'top'
  variant?: string
  delay?: number
  titleColor?: string
  iconBgColor?: string
  iconColor?: string
}

export function Feature(props: FeatureProps) {
  const {
    title,
    description,
    icon,
    variant,
    iconBgColor = "whiteAlpha.200",
    iconColor = "purple.500"
  } = props
  const styles = useMultiStyleConfig('Feature', { variant })

  return (
    <Card
      width="100%"
      maxW="500px"
      minH="300px"
      height="100%"
      borderRadius="xl"
      border="1px solid"
      borderColor="gray.200"
      bg="gray.50"
      backdropFilter="blur(10px)"
      overflow="hidden"
      _dark={{
        bg: "rgba(17, 17, 17, 0.75)",
        borderColor: "whiteAlpha.100"
      }}
      transition="all 0.3s ease-in-out"
      _hover={{
        transform: "translateY(-2px)",
        boxShadow: "0 0 30px -5px rgba(122, 55, 230, 0.5)",
        borderColor: "#7A37E6",
        bg: "white",
        _dark: {
          bg: "rgba(25, 25, 25, 0.85)",
          borderColor: "purple.400"
        }
      }}
    >
      <CardBody display="flex" flexDirection="column" alignItems="flex-start" gap={4} p={8} height="100%">
        {icon && (
          <Circle 
            sx={styles.icon} 
            bg={iconBgColor} 
            size="60px" 
            flexShrink={0}
            alignSelf="flex-start"
            _dark={{
              bg: "whiteAlpha.200"
            }}
          >
            <Icon as={icon} boxSize={7} color={iconColor} />
          </Circle>
        )}
        <Box width="100%" textAlign="left">
          <Heading 
            sx={styles.title} 
            color="gray.900" 
            fontSize="lg" 
            fontWeight="semibold" 
            mb={3}
            as="h3"
            display="block"
            _dark={{
              color: "white"
            }}
          >
            {title}
          </Heading>
          {description && (
            <Text 
              sx={styles.description} 
              color="gray.600" 
              fontSize="sm"
              lineHeight="1.6"
              display="block"
              _dark={{
                color: "whiteAlpha.700"
              }}
            >
              {description}
            </Text>
          )}
        </Box>
      </CardBody>
    </Card>
  )
}

export function UseCaseGallery(props: UseCaseGalleryProps) {
  const {
    title,
    description,
    subheading,
    features,
    columns = [1, 2, 3],
    align: alignProp = 'center',
    iconSize = 5,
    aside,
    reveal: Wrap = Revealer,
    maxFeatures,
    ...rest
  } = props;

  const align = !!aside ? 'left' : alignProp
  const ip = align === 'left' ? 'left' : 'top'
  
  const displayFeatures = maxFeatures ? features.slice(0, maxFeatures) : features

  return (
    <Section maxW="100vw" width="100%" py={10} display="flex" justifyContent="center" px={0} overflow="hidden" innerWidth="1200px" {...rest}>
      <Stack direction="row" height="full" align="center" width="100%" justifyContent="center" mx="auto" maxW="100%">
        <VStack flex="1" spacing={12} alignItems="center" width="100%">
          {(title || description || subheading) && (
            <Wrap>
              <Box textAlign="center" width="100%">
                <Heading 
                  as="h2" 
                  fontSize="4xl" 
                  fontWeight="bold" 
                  mb={1}
                  _dark={{
                    color: "white"
                  }}
                >
                  {title}
                </Heading>
                {subheading && (
                  <Text 
                    fontSize="lg" 
                    color="gray.600" 
                    maxW="1200px"
                    mx="auto"
                    mt={3}
                    _dark={{
                      color: "gray.400"
                    }}
                  >
                    {subheading}
                  </Text>
                )}
                {description && (
                  <Text mt={4} maxW="1200px" mx="auto">
                    {description}
                  </Text>
                )}
              </Box>
            </Wrap>
          )}
          <SimpleGrid 
            columns={columns} 
            spacing={6} 
            px={[4, 5, 6]}
            width="100%"
            maxW="100%"
            justifyItems="center"
          >
            {displayFeatures.map((feature, i) => {
              return (
                <Wrap key={i} delay={feature.delay}>
                  <Box width="100%" height="100%">
                    <Feature iconSize={iconSize} {...feature} ip={ip} />
                  </Box>
                </Wrap>
              )
            })}
          </SimpleGrid>
        </VStack>
        {aside && (
          <Box flex="1" p="4">
            {aside}
          </Box>
        )}
      </Stack>
    </Section>
  )
}

// For backwards compatibility
export const Features = UseCaseGallery;
