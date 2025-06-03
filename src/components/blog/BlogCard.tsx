import { Calendar, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";

interface BlogCardProps {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  author_name: string;
  author_image: string;
  publish_date: string;
  read_time: string;
  image_url: string;
  category: string;
}

export const BlogCard = ({ 
  id, 
  title,
  slug,
  excerpt, 
  author_name, 
  author_image, 
  publish_date, 
  read_time, 
  image_url, 
  category 
}: BlogCardProps) => {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden border-prepzo-100">
      <Link href={`/blog/${slug}`}>
        <div className="aspect-video overflow-hidden">
          <Image
            width={500}
            height={500}
            src={image_url} 
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
          <span className="text-sm text-gray-500">{read_time}</span>
        </div>
        
        <h3 className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-prepzo-600 transition-colors">
          <Link href={`/blog/${slug}`}>{title}</Link>
        </h3>
        
        <p className="text-gray-600 mb-4 line-clamp-3">{excerpt}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              width={32}
              height={32}
              src={author_image} 
              alt={author_name}
              className="w-8 h-8 rounded-full"
            />
            <div>
              <p className="text-sm font-medium">{author_name}</p>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                {publish_date}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
