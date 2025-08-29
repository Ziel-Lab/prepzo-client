import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: React.ReactNode;
}

interface MultiSelectProps {
  /** Controlled selected values */
  value: string[];
  /** Called when selection changes */
  onChange: (value: string[]) => void;
  /** Options to render */
  options: MultiSelectOption[];
  /** Placeholder when no value is selected */
  placeholder?: string;
  /** Optional className for the trigger button */
  className?: string;
}

/**
 * Reusable multi-select component built with Radix primitives.
 * Visually matches the existing Select trigger/button so it blends into the design system.
 */
const MultiSelect = ({
  value,
  onChange,
  options,
  placeholder = "Select options…",
  className,
}: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".multi-select")) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const filteredOptions = options.filter((opt) =>
    opt.label?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
    opt.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleValue = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const removeValue = (optionValue: string) => {
    onChange(value.filter((v) => v !== optionValue));
  };

  const selectedOptionObjects = options.filter((opt) => value.includes(opt.value));

  return (
    <div className={cn("relative multi-select", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border rounded-md px-3 py-2 text-left flex items-center min-h-[40px] flex-wrap gap-1 bg-background"
      >
        {value.length === 0 ? (
          <span className="text-muted-foreground text-sm">{placeholder}</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {selectedOptionObjects.map((opt) => (
              <span
                key={opt.value}
                className="flex items-center bg-blue-100 text-blue-700 rounded px-2 py-0.5 text-xs font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                {opt.label}
                <button
                  type="button"
                  className="ml-1 hover:text-destructive focus:outline-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeValue(opt.value);
                  }}
                  aria-label={`Remove ${opt.label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <span className="ml-auto pl-2">
          <Filter className="h-4 w-4" />
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-lg max-h-64 overflow-hidden">
          <div className="p-2 border-b bg-background">
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8"
            />
          </div>
          <div className="overflow-y-auto max-h-48 bg-background">
            {filteredOptions.map((opt) => (
              <div
                key={opt.value}
                className="flex items-center gap-2 p-2 hover:bg-accent cursor-pointer"
                onClick={() => toggleValue(opt.value)}
              >
                <Checkbox
                  checked={value.includes(opt.value)}
                  onChange={() => {}}
                />
                <span className="text-sm">{opt.label}</span>
              </div>
            ))}
            {filteredOptions.length === 0 && (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
