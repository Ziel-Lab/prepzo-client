'use client'

import { Features } from "../features"
import { features } from '@/data/casegallery'
import { motion, AnimatePresence } from "framer-motion"
import { ReactNode } from "react"

interface RevealerProps {
  children: ReactNode;
  delay?: number;
}

// Custom revealer component with Framer Motion animations
const FeatureRevealer = ({ children, delay = 0 }: RevealerProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.6,
        delay: delay * 0.15,
        ease: [0.25, 0.1, 0.25, 1.0], // Cubic bezier for smoother motion
      }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{
        y: -5,
        transition: { duration: 0.2 }
      }}
    >
      {children}
    </motion.div>
  )
}

// Animation variants for container
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

// Prepare features with custom delays based on grid position
const enhancedFeatures = features.map((feature, index) => ({
  ...feature,
  delay: Math.floor(index / 3) + (index % 3) * 0.5 // Creates a wave-like staggered effect
}));

export const UseCaseGallerySection = () => {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      variants={containerVariants}
      viewport={{ once: true, margin: "-100px" }}
    >
      <AnimatePresence>
        <Features
          id="features"
          title="Use Case Gallery"
          subheading="Explore our range of professional development tools designed to elevate your career journey"
          columns={[1, 2, 3]}
          spacing={6}
          py={0}
          mt={2}
          align="center"
          maxW="1800px"
          mx="auto"
          px={0}
          iconSize={3}
          maxFeatures={12}
          features={enhancedFeatures}
          reveal={FeatureRevealer}
        />
      </AnimatePresence>
    </motion.div>
  )
}