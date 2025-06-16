"use client"

import { AuthorCard } from "./AuthorCard";
import { toast } from "sonner";

interface Author {
  author_name: string;
  author_image: string;
  bio: string;
  linkedin_url: string;
  title: string;
}

interface ShareWrapperProps {
  author: Author;
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