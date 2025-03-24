import React from 'react'
import { Tag, useColorModeValue } from '@chakra-ui/react'

export const FeatureTag: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const bgColor = useColorModeValue("purple.50", "purple.900")
  const textColor = useColorModeValue("purple.600", "purple.200")
  
  return (
    <Tag 
      size="md" 
      borderRadius="full" 
      px="3" 
      py="1" 
      bg={bgColor} 
      color={textColor}
      fontWeight="medium"
      m="1"
    >
      {children}
    </Tag>
  )
}
