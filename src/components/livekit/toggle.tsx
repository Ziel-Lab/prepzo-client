"use client"

import * as React from "react"
import { Button, ButtonProps } from "@chakra-ui/react"

// Create a custom type that omits the onChange from ButtonProps
type ButtonPropsWithoutOnChange = Omit<ButtonProps, 'onChange'>;

interface ToggleProps extends ButtonPropsWithoutOnChange {
  isActive?: boolean;
  onChange?: (isActive: boolean) => void;
}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({ children, isActive, onChange, onClick, ...props }, ref) => {
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
      if (onClick) onClick(event);
    }, [isPressed, onChange, onClick]);

    return (
      <Button
        ref={ref}
        onClick={handleClick}
        aria-pressed={isPressed}
        variant={isPressed ? "solid" : "outline"}
        colorScheme={isPressed ? "blue" : "gray"}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

Toggle.displayName = "Toggle";

export { Toggle };