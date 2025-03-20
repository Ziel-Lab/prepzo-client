import {
  chakra,
  HTMLChakraProps,
  useColorModeValue,
} from '@chakra-ui/react'

export const Em: React.FC<HTMLChakraProps<'em'>> = ({ children, ...props }) => {
  return (
    <chakra.em
      color={useColorModeValue('black', 'white')}
      fontStyle="normal"
      display="inline"
      {...props}
    >
      {children}
    </chakra.em>
  )
}

// @todo make this configurable
export const Br: React.FC<HTMLChakraProps<'span'>> = (props) => {
  return (
    <chakra.span {...props}>
      <br />
    </chakra.span>
  )
}
