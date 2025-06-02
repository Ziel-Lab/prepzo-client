import { Linkedin, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AuthorCardProps {
  author: {
    name: string;
    image: string;
    bio: string;
    linkedin: string;
  };
  onShare: () => void;
}

export const AuthorCard = ({ author, onShare }: AuthorCardProps) => {
  return (
    <Card className="bg-prepzo-50 border-prepzo-100">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <img 
            src={author.image} 
            alt={author.name}
            className="w-16 h-16 rounded-full"
          />
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2 text-prepzo-900">{author.name}</h3>
            <p className="text-prepzo-700 text-sm mb-4">{author.bio}</p>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(author.linkedin, '_blank')}
                className="flex items-center gap-2 border-prepzo-200 text-prepzo-700 hover:bg-prepzo-100"
              >
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onShare}
                className="flex items-center gap-2 border-prepzo-200 text-prepzo-700 hover:bg-prepzo-100"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
