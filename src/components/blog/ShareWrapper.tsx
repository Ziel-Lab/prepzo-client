"use client"

import { AuthorCard } from "./AuthorCard";
import { toast } from "sonner";

interface ShareWrapperProps {
  author: any;
}

export const ShareWrapper = ({ author }: ShareWrapperProps) => {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: author.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  return <AuthorCard author={author} onShare={handleShare} />;
}; 