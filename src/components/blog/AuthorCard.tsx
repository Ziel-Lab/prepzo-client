import {
    Linkedin,
    Facebook,
    Instagram,
    Twitter,
    Share2,
  } from "lucide-react";
  import {
    Popover,
    PopoverTrigger,
    PopoverContent,
  } from "@/components/ui/popover";
  import { Button } from "@/components/ui/button";
  import { Card, CardContent } from "@/components/ui/card";
  import Image from "next/image";
  import { toast } from "sonner";
  
  interface AuthorCardProps {
    author: {
      author_name: string;
      author_image: string;
      bio: string;
      linkedin_url: string;
    };
    onShare: () => void;
  }
  
  export const AuthorCard = ({ author, onShare }: AuthorCardProps) => {
    return (
      <Card className="bg-prepzo-50 border-prepzo-100">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Image 
              src={author.author_image} 
              alt={author.author_name}
              className="w-16 h-16 rounded-full"
              width={1000}
              height={1000}
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2 text-prepzo-900">{author.author_name}</h3>
              <p className="text-prepzo-700 text-sm mb-4">{author.bio}</p>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(author.linkedin_url, '_blank')}
                  className="flex items-center gap-2 border-prepzo-200 text-prepzo-700 hover:bg-prepzo-100"
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 border-prepzo-200 text-prepzo-700 hover:bg-prepzo-100"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto bg-white">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Share on LinkedIn"
                        onClick={() => {
                          if (typeof window === "undefined") return;
                          const url = encodeURIComponent(window.location.href);
                          const title = encodeURIComponent(document.title);
                          window.open(
                            `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`,
                            "_blank",
                            "noopener"
                          );
                        }}
                      >
                        <Linkedin className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Share on Facebook"
                        onClick={() => {
                          if (typeof window === "undefined") return;
                          const url = encodeURIComponent(window.location.href);
                          window.open(
                            `https://www.facebook.com/sharer/sharer.php?u=${url}`,
                            "_blank",
                            "noopener"
                          );
                        }}
                      >
                        <Facebook className="w-4 h-4" />
                      </Button>
                      {/* <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Share on Instagram"
                        onClick={() => {
                          if (typeof window === "undefined") return;
                          const url = window.location.href;
                          navigator.clipboard.writeText(url);
                          toast.success("Link copied to clipboard!");
                        }}
                      >
                        <Instagram className="w-4 h-4" />
                      </Button> */}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Share on X"
                        onClick={() => {
                          if (typeof window === "undefined") return;
                          const url = encodeURIComponent(window.location.href);
                          window.open(
                            `https://twitter.com/intent/tweet?url=${url}`,
                            "_blank",
                            "noopener"
                          );
                        }}
                      >
                        <Twitter className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Copy link"
                        onClick={onShare}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };