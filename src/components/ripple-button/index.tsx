import React, { useEffect, useRef } from 'react';
import { Button, ButtonProps } from '@chakra-ui/react';

interface RippleButtonProps extends ButtonProps {
  // Add any additional props specific to the ripple button
}

export const RippleButton: React.FC<RippleButtonProps> = (props) => {
  const { children, className = '', onClick, ...rest } = props;
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Add subtle animation when component mounts
  useEffect(() => {
    const button = buttonRef.current;
    if (button) {
      // Add a small pulse animation on mount
      button.animate(
        [
          { transform: 'scale(0.97)', opacity: 0.9 },
          { transform: 'scale(1.03)', opacity: 1 },
          { transform: 'scale(1)', opacity: 1 }
        ],
        {
          duration: 800,
          easing: 'ease-out',
          fill: 'forwards'
        }
      );
    }
  }, []);

  const createRippleEffect = (e: React.MouseEvent) => {
    const button = e.currentTarget;
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    
    // Get click position
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Position and animate the ripple
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    button.appendChild(ripple);
    
    // Remove ripple after animation
    setTimeout(() => {
      ripple.remove();
    }, 600);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    createRippleEffect(e);
    if (onClick) onClick(e);
  };

  return (
    <Button
      ref={buttonRef}
      className={`ripple-button ${className}`}
      size="lg"
      px={[3, 5]}
      py="6"
      onClick={handleClick}
      {...rest}
    >
      {children}
    </Button>
  );
}; 