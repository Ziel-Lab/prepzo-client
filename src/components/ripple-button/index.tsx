import React, { useEffect, useRef, MouseEvent } from 'react';
import { cn } from "@/lib/utils"; // Assuming you use cn for class merging

// Define props based on standard button attributes
interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Controls the ripple animation duration in milliseconds.
   * Default is 600ms.
   */
  rippleDuration?: number;
  children?: React.ReactNode; // Explicitly add children prop
}

export const RippleButton: React.FC<RippleButtonProps> = (props) => {
  const { children, className = '', onClick, rippleDuration = 600, ...rest } = props;
  const buttonRef = useRef<HTMLButtonElement>(null);

  const createRippleEffect = (e: MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const ripple = document.createElement('span');

    // Add the ripple class and necessary Tailwind classes for absolute positioning and styling
    // Note: The actual animation (.ripple::after keyframes) needs to be defined in your global CSS.
    ripple.className = 'ripple absolute block rounded-full pointer-events-none'; // Added Tailwind positioning

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2; // Make ripple large enough
    const x = e.clientX - rect.left - size / 2; // Center ripple on click
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    // Prepend ripple so it's behind the text content
    button.prepend(ripple);

    setTimeout(() => {
      ripple.remove();
    }, rippleDuration);
  };

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    createRippleEffect(e);
    if (onClick) onClick(e);
  };

  // Base Tailwind button styles - Removed overflow-hidden
  const baseButtonClasses = "relative inline-flex items-center justify-center px-4 py-2 text-base font-medium rounded-md border-0 shadow-md focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out hover:shadow-lg"; // Removed overflow-hidden

  return (
    <button
      ref={buttonRef}
      type="button" // Default to button type
      className={cn(baseButtonClasses, className)} // Merge base classes with incoming className
      onClick={handleClick}
      {...rest} // Spread remaining native button attributes
    >
      {/* Removed transition and group-hover classes */}
      <span className="relative z-10 inline-flex items-center justify-center">
        {children}
      </span>
    </button>
  );
}; 