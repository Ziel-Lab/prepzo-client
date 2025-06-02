import { Calendar, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface BlogCardProps {
  id: string;
  title: string;
  excerpt: string;
  author: {
    name: string;
    image: string;
  };
  publishDate: string;
  readTime: string;
  image: string;
  category: string;
}

export const BlogCard = ({ 
  id, 
  title, 
  excerpt, 
  author, 
  publishDate, 
  readTime, 
  image, 
  category 
}: BlogCardProps) => {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden border-prepzo-100">
      <Link href={`/blog/${id}`}>
        <div className="aspect-video overflow-hidden">
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </Link>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 bg-prepzo-100 text-prepzo-800 text-xs font-medium rounded-full">
            {category}
          </span>
          <span className="text-sm text-gray-500">{readTime}</span>
        </div>
        
        <h3 className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-prepzo-600 transition-colors">
          <Link href={`/blog/${id}`}>{title}</Link>
        </h3>
        
        <p className="text-gray-600 mb-4 line-clamp-3">{excerpt}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={author.image} 
              alt={author.name}
              className="w-8 h-8 rounded-full"
            />
            <div>
              <p className="text-sm font-medium">{author.name}</p>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                {publishDate}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
