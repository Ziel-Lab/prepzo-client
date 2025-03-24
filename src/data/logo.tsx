import { chakra, HTMLChakraProps, useColorModeValue, Image } from '@chakra-ui/react'

export const Logo: React.FC<HTMLChakraProps<'img'>> = (props) => {
  const logoSrc = useColorModeValue('/static/images/prepzo-dark.svg', '/static/images/prepzo-light.svg')
  
  return (
    <Image
      src={logoSrc}
      alt="Prepzo Logo"
      {...props}
    />
  )
}
