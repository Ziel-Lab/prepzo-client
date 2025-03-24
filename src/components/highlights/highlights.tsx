import React, { ReactNode } from 'react'
import {
  Box,
  Card,
  CardProps,
  Grid,
  GridItem,
  GridItemProps,
  Heading,
  Text,
  VStack,
  Container,
  useColorModeValue,
  chakra,
  Tag
} from '@chakra-ui/react'

import { Section, SectionProps } from '@/components/section'
import { Testimonial } from '@/components/testimonials'

export type CustomSectionProps = Omit<SectionProps, 'title' | 'children'> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
}

export interface HighlightsProps extends Omit<SectionProps, 'title' | 'description'> {
  /* Props for the Highlights component */
  title?: ReactNode | string;
  description?: ReactNode | string;
  columns?: number[];
  spacing?: number | string;
}

export interface CustomGridItemProps extends Omit<GridItemProps, 'title'> {
  /* Custom properties for grid items */
  extraPadding?: string | number;
}

export interface CustomTestimonialProps {
  customTitle?: React.ReactNode;
  description?: React.ReactNode;
  name: string;
  avatar?: string;
}

export interface HighlightBoxProps
  extends CustomGridItemProps,
    Omit<CardProps, 'title'> {
      iconBg?: string;
      icon?: React.ReactNode;
      featureTitle?: string;
      description?: React.ReactNode;
      title?: React.ReactNode;
    }

export function HighlightsItem(props: HighlightBoxProps) {
  const {
    children,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    icon,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    iconBg,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    featureTitle,
    ...rest
  } = props;
  
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  
  return (
    // @ts-expect-error - GridItem accepts ReactNode for title but types are incorrect
    <GridItem
      as={Card}
      borderRadius="md"
      p="8"
      flex="1 0"
      alignItems="flex-start"
      spacing="8"
      overflow="hidden"
      position="relative"
      bg={bgColor}
      boxShadow="sm"
      borderWidth="1px"
      borderColor={borderColor}
      {...rest}
    >
      {props.title && (
        <Heading fontSize="2xl" fontWeight="bold" mb="6">
          {props.title}
        </Heading>
      )}
      
      {props.description && typeof props.description === 'string' ? (
        <Text fontSize="lg" color="gray.600" mb="6" lineHeight="tall">
          {props.description}
        </Text>
      ) : props.description}
      
      {children}
    </GridItem>
  )
}

export const HighlightsTestimonialItem: React.FC<
  HighlightBoxProps & CustomTestimonialProps & { gradient?: [string, string] }
> = (props) => {
  const {
    name,
    description,
    avatar = "",
    customTitle,
    children,
    gradient = ['purple.400', 'purple.600'],
    ...rest
  } = props
  
  return (
    <HighlightsItem
      justifyContent="center"
      _dark={{ borderColor: 'whiteAlpha.300' }}
      p="6"
      {...rest}
    >
      <Box
        bgGradient={`linear(to-br, ${gradient[0]}, ${gradient[1]})`}
        opacity="1"
        position="absolute"
        inset="0px"
        pointerEvents="none"
        zIndex="0"
        borderRadius="md"
      />
      <Testimonial
        name={name}
        // @ts-expect-error - We're passing a React element instead of string
        title={
          <Text as="span" fontWeight="normal" fontSize="sm" color="whiteAlpha.800">
            {customTitle}
          </Text>
        }
        description={
          <Box as="span" color="white">
            {description || children}
          </Box>
        }
        avatar={avatar}
        border="0"
        bg="transparent"
        boxShadow="none"
        color="white"
        position="relative"
      >
        {children}
      </Testimonial>
    </HighlightsItem>
  )
}

export const FeatureTag: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const bgColor = useColorModeValue("purple.50", "purple.900");
  const textColor = useColorModeValue("purple.600", "purple.200");
  
  return (
    <Tag 
      size="md" 
      borderRadius="full" 
      px="3" 
      py="1" 
      bg={bgColor} 
      color={textColor}
      fontWeight="medium"
      fontSize="sm"
      mr="2"
      mb="2"
    >
      {children}
    </Tag>
  )
}

export const Highlights: React.FC<HighlightsProps> = (props) => {
  const { children, title, description, ...rest } = props

  return (
    <Section
      innerWidth="container.xl"
      position="relative"
      overflow="hidden"
      py="20"
      {...rest}
    >
      {(title || description) && (
        <VStack spacing="4" mb="16" textAlign="center">
          {title && (
            <chakra.h2 fontSize="3xl" fontWeight="bold">
              {title}
            </chakra.h2>
          )}
          {description && (
            <Text fontSize="lg" color="gray.500" maxW="3xl" mx="auto">
              {description}
            </Text>
          )}
        </VStack>
      )}
      
      <Container maxW="container.xl" px="6">
        <Grid
          templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(12, 1fr)' }}
          gap={8}
          position="relative"
        >
          {children}
        </Grid>
      </Container>
    </Section>
  )
}
