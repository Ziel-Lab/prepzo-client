import { X } from 'lucide-react';
import type { LucideProps } from 'lucide-react'; // Import LucideProps for type safety
import { cn } from "@/lib/utils"; // Assuming you have a utility for merging class names

// Use LucideProps for better type checking
export function CloseIcon(props: LucideProps) {
  return (
    <X
      // Apply default size and allow overriding via className
      className={cn("w-4 h-4", props.className)} 
      // Spread other props (like onClick, etc.)
      {...props} 
    />
  );
}