import { defineStyle, defineStyleConfig } from '@chakra-ui/styled-system'
import { mode, StyleFunctionProps } from '@chakra-ui/theme-tools'

const baseStyle = {
  borderRadius: 'full',
  fontWeight: 'medium',
  lineHeight: 'inherit',
}

const variantPrimary = defineStyle((props) => {
  return {
    color: 'white',
    bg: 'primary.500',
    _hover: {
      bg: 'primary.600',
    },
    _active: {
      bg: 'primary.600',
    },
    _disabled: {
      bg: 'primary.500',
    },
  }
})

const variantSecondary = defineStyle((props) => {
  const { colorScheme: c } = props
  return {
    color: 'white',
    bg: 'gray.500',
    _hover: {
      bg: 'gray.600',
    },
    _active: {
      bg: 'gray.600',
    },
    _disabled: {
      bg: 'gray.200',
    },
  }
})

const variantGhost = defineStyle((props) => {
  const darkHoverBg = 'rgba(255, 255, 255, 0.08)'
  const darkActiveBg = 'rgba(255, 255, 255, 0.16)'
  const lightHoverBg = 'rgba(0, 0, 0, 0.04)'
  const lightActiveBg = 'rgba(0, 0, 0, 0.08)'

  return {
    color: mode('gray.600', 'whiteAlpha.800')(props),
    bg: 'transparent',
    _hover: {
      bg: mode(lightHoverBg, darkHoverBg)(props),
    },
    _active: {
      bg: mode(lightActiveBg, darkActiveBg)(props),
    },
  }
})

/**
 * Used for navigation buttons
 */
const variantNavLink = defineStyle((props: StyleFunctionProps) => {
  const darkHoverBg = 'rgba(255, 255, 255, 0.08)'
  const darkActiveBg = 'rgba(255, 255, 255, 0.16)'
  const lightHoverBg = 'rgba(0, 0, 0, 0.04)'
  const lightActiveBg = 'rgba(0, 0, 0, 0.08)'

  return {
    height: 'auto',
    padding: 2,
    fontWeight: 'medium',
    color: mode('gray.600', 'whiteAlpha.800')(props),
    bg: 'transparent',
    _hover: {
      bg: mode(lightHoverBg, darkHoverBg)(props),
    },
    _active: {
      bg: mode(lightActiveBg, darkActiveBg)(props),
    },
  }
})

const variants = {
  primary: variantPrimary,
  secondary: variantSecondary,
  ghost: variantGhost,
  'nav-link': variantNavLink,
}

const sizes = {
  lg: {
    fontSize: 'md',
    h: '48px',
    px: '40px',
    borderRadius: 'full',
  },
  md: {
    fontSize: 'sm',
    h: '40px',
    px: '30px',
  },
  sm: {
    fontSize: 'xs',
    h: '34px',
    px: '26px',
  },
  xs: {
    fontSize: 'xs',
    h: '30px',
    px: '16px',
  },
}

export default defineStyleConfig({
  baseStyle,
  variants,
  sizes,
  defaultProps: {
    variant: 'primary',
  },
})
