import { forwardRef, Button, ButtonProps } from "@chakra-ui/react";

import Link from "next/link";

export interface NavLinkProps extends ButtonProps {
  isActive?: boolean;
  href?: string;
  id?: string;
}

export const NavLink = forwardRef<NavLinkProps, "a">((props, ref) => {
  const { href, isActive, variant, ...rest } = props;

  const isPrimary = variant === "primary";

  return (
    <Button
      as={Link}
      href={href}
      ref={ref}
      variant={isPrimary ? "primary" : "nav-link"}
      lineHeight={isPrimary ? "normal" : "2rem"}
      isActive={isActive}
      fontWeight="medium"
      borderRadius={isPrimary ? "xl" : undefined}
      px={isPrimary ? 3 : undefined}
      py={isPrimary ? 3 : undefined}
      height={isPrimary ? "auto" : undefined}
      display={isPrimary ? "flex" : undefined}
      alignItems={isPrimary ? "center" : undefined}
      justifyContent={isPrimary ? "center" : undefined}
      {...rest}
    />
  );
});

NavLink.displayName = "NavLink";
