"use client"

import * as React from "react"
// Removed Chakra imports: Button, ButtonProps

// Define basic button props directly since ButtonProps is removed
interface NativeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

// Create a custom type that omits the our specific onChange from NativeButtonProps
type ButtonPropsWithoutCustomOnChange = Omit<NativeButtonProps, 'onChange'>;

interface ToggleProps extends ButtonPropsWithoutCustomOnChange {
  isActive?: boolean;
  onChange?: (isActive: boolean) => void;
  // Retain standard onClick from ButtonHTMLAttributes
}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({ children, isActive, onChange, onClick, className, ...props }, ref) => {
    const [isPressed, setIsPressed] = React.useState(isActive || false);

    React.useEffect(() => {
      if (isActive !== undefined) {
        setIsPressed(isActive);
      }
    }, [isActive]);

    const handleClick = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      const newState = !isPressed;
      setIsPressed(newState);
      if (onChange) onChange(newState);
      if (onClick) onClick(event); // Call original onClick if provided
    }, [isPressed, onChange, onClick]);

    // Define base styles and state-specific styles using Tailwind
    const baseClasses = "px-4 py-2 rounded-md text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed";
    const activeClasses = "bg-blue-600 border-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500";
    const inactiveClasses = "bg-transparent border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-gray-500";

    return (
      <button
        ref={ref}
        onClick={handleClick}
        aria-pressed={isPressed}
        type="button" // Explicitly set type
        className={`${baseClasses} ${isPressed ? activeClasses : inactiveClasses} ${className || ''}`}
        {...props} // Spread remaining native button attributes
      >
        {children}
      </button>
    );
  }
);

Toggle.displayName = "Toggle";

export { Toggle };