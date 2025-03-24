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

import { Section, SectionTitle, SectionTitleProps } from '@/components/section'

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
    // Unused variables with underscore prefix
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    iconPosition,
    iconSize = 4,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ip,
    variant,
    titleColor = "gray.900",
    iconBgColor = "purple.50",
    iconColor = "purple.500"
  } = props
  const styles = useMultiStyleConfig('Feature', { variant })

  const direction = 'column'

  return (
    <Stack 
      sx={styles.container} 
      direction={direction} 
      spacing={1} 
      py={1}
      width="100%"
      maxW="280px"
      height="140px"
      align="center"
    >
      {icon && (
        <Circle sx={styles.icon} bg={iconBgColor} size="24px" flexShrink={0}>
          <Icon as={icon} boxSize={iconSize} color={iconColor} />
        </Circle>
      )}
      <Box width="100%" textAlign="center">
        <Heading 
          sx={styles.title} 
          color={titleColor} 
          fontSize="sm" 
          fontWeight="semibold" 
          mb={0.5}
          as="span"
          display="inline"
        >
          {title}
        </Heading>
        {description && (
          <Text 
            sx={styles.description} 
            color="gray.500" 
            fontSize="xs"
            lineHeight="shorter"
            ml={1}
            as="span"
            display="inline"
          >
            - {description}
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
    features,
    columns = [1, 2, 3],
    align: alignProp = 'center',
    iconSize = 4,
    aside,
    reveal: Wrap = Revealer,
    maxFeatures,
    ...rest
  } = props;

  const align = !!aside ? 'left' : alignProp
  const ip = align === 'left' ? 'left' : 'top'
  
  // If maxFeatures is set, only show that many features
  const displayFeatures = maxFeatures ? features.slice(0, maxFeatures) : features

  return (
    <Section maxW="1400px" py={8} display="flex" justifyContent="center" {...rest}>
      <Stack direction="row" height="full" align="center" width="100%" justifyContent="center" mx="auto">
        <VStack flex="1" spacing={4} alignItems="center" width="100%">
          {(title || description) && (
            <Wrap>
              <SectionTitle
                title={title}
                description={description}
                align="center"
              />
            </Wrap>
          )}
          <SimpleGrid 
            columns={columns} 
            spacing={[2, 3, 4]} 
            px={[0, 1]}
            width="100%"
            justifyItems="center"
          >
            {displayFeatures.map((feature, i) => {
              return (
                <Wrap key={i} delay={feature.delay}>
                  <Box px={1} py={1} width="100%" textAlign="center">
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
