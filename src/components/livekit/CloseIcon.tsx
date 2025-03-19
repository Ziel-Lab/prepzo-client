import { Icon, IconProps } from "@chakra-ui/react";

export function CloseIcon(props: IconProps) {
  return (
    <Icon
      width="16px"
      height="16px"
      viewBox="0 0 16 16"
      {...props}
    >
      <path
        d="M3.33398 3.33334L12.6673 12.6667M12.6673 3.33334L3.33398 12.6667"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
    </Icon>
  );
}