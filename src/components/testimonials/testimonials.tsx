'use client'

import { ResponsiveValue, SimpleGrid, Box } from '@chakra-ui/react'
import React from 'react'
import {
  Section,
  SectionProps,
  SectionTitle,
  SectionTitleProps,
} from '@/components/section'
import { motion, AnimatePresence } from 'framer-motion'

export interface TestimonialsProps
  extends Omit<SectionProps, 'title'>,
    Pick<SectionTitleProps, 'title' | 'description'> {
  columns?: ResponsiveValue<number>
}

interface TestimonialWrapperProps {
  children: React.ReactNode;
  index: number;
}

// Animation wrapper for individual testimonials
const TestimonialWrapper = ({ children, index }: TestimonialWrapperProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.7,
        delay: index * 0.2,
        ease: [0.25, 0.1, 0.25, 1.0],
      }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{
        y: -5,
        boxShadow: "0 10px 30px -5px rgba(0,0,0,0.1)",
        transition: { duration: 0.2 }
      }}
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {children}
    </motion.div>
  )
}

// Container animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

export const Testimonials: React.FC<TestimonialsProps> = (props) => {
  const { children, title, columns = [1, null, 2], ...rest } = props
  
  // Wrap each child with the animation wrapper
  const wrappedChildren = React.Children.map(children, (child, index) => {
    return (
      <TestimonialWrapper index={index}>
        <Box height="100%" display="flex">
          {child}
        </Box>
      </TestimonialWrapper>
    );
  });

  return (
    <AnimatePresence>
      <motion.div
        initial="hidden"
        whileInView="visible"
        variants={containerVariants}
        viewport={{ once: true, margin: "-100px" }}
      >
        <Section {...rest}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <SectionTitle title={title} />
          </motion.div>
          <SimpleGrid 
            columns={columns} 
            spacing="8" 
            templateColumns={{ base: "1fr", md: "repeat(auto-fill, minmax(300px, 1fr))" }}
            autoRows="1fr"
          >
            {wrappedChildren}
          </SimpleGrid>
        </Section>
      </motion.div>
    </AnimatePresence>
  )
}
