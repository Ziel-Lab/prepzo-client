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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    iconPosition,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ip,
    variant,
    iconBgColor = "whiteAlpha.200",
    iconColor = "purple.500"
  } = props
  const styles = useMultiStyleConfig('Feature', { variant })

  const direction = 'column'

  return (
    <Stack 
      sx={styles.container} 
      direction={direction} 
      spacing={4} 
      p={3}
      pt={5}
      width="100%"
      maxW="480px"
      minH="200px"
      height="auto"
      align="flex-start"
      borderRadius="xl"
      border="1px solid"
      borderColor="gray.200"
      bg="gray.50"
      backdropFilter="blur(10px)"
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
          bg: "rgba(25, 25, 25, 0.85)"
        }
      }}
    >
      {icon && (
        <Circle 
          sx={styles.icon} 
          bg={iconBgColor} 
          size="36px" 
          flexShrink={0}
          _dark={{
            bg: "whiteAlpha.200"
          }}
        >
          <Icon as={icon} boxSize={5} color={iconColor} />
        </Circle>
      )}
      <Box width="100%" pt={1}>
        <Heading 
          sx={styles.title} 
          color="gray.900" 
          fontSize="md" 
          fontWeight="semibold" 
          mb={4}
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
            color="whiteAlpha.700" 
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
    </Stack>
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
    <Section maxW="1400px" py={10} display="flex" justifyContent="center" {...rest}>
      <Stack direction="row" height="full" align="center" width="100%" justifyContent="center" mx="auto">
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
                    maxW="800px"
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
                  <Text mt={4} maxW="container.md" mx="auto">
                    {description}
                  </Text>
                )}
              </Box>
            </Wrap>
          )}
          <SimpleGrid 
            columns={columns} 
            spacing={8} 
            px={[6, 8]}
            width="100%"
            justifyItems="center"
          >
            {displayFeatures.map((feature, i) => {
              return (
                <Wrap key={i} delay={feature.delay}>
                  <Box width="100%">
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
