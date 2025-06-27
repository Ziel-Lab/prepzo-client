import React, { useState, KeyboardEvent, ChangeEvent } from "react";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

const TagInput: React.FC<TagInputProps> = ({ value, onChange, placeholder, label, disabled }) => {
  const [input, setInput] = useState("");

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      addTag(input);
      setInput("");
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      // Remove last tag on backspace if input is empty
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div>
      {label && <label className="block mb-1 text-sm font-medium">{label}</label>}
      <div className="flex flex-wrap items-center gap-2 border rounded-md px-2 py-1 bg-background focus-within:ring-2 focus-within:ring-ring">
        {value.map((tag, idx) => (
          <span
            key={tag + idx}
            className="flex items-center bg-blue-100 text-blue-700 rounded px-2 py-0.5 text-xs font-medium mr-1 mb-1"
          >
            {tag}
            <button
              type="button"
              className="ml-1 text-blue-500 hover:text-red-500 focus:outline-none"
              onClick={() => removeTag(idx)}
              aria-label={`Remove ${tag}`}
              disabled={disabled}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          className="flex-1 min-w-[80px] border-none outline-none bg-transparent text-sm py-1 px-2"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default TagInput; 