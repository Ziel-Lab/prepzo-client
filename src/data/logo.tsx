import React from 'react';

// Define props type using standard React ImgHTMLAttributes
interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {}

export const Logo: React.FC<LogoProps> = (props) => {
  // Remove useColorModeValue and set a default logo source
  // Light/dark mode switching should be handled where the logo is rendered
  const defaultLogoSrc = '/static/images/prepzo-dark.svg'; // Or prepzo-light.svg as default
  
  // Return a standard img tag
  return (
    <img
      src={props.src || defaultLogoSrc} // Use passed src or default
      alt={props.alt || "Prepzo Logo"} // Use passed alt or default
      // Spread remaining props like className, style, width, height, etc.
      {...props} 
    />
  );
};