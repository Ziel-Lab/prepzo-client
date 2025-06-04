"use client"

import { Calendar, Clock, ArrowLeft, Home, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthorCard } from "@/components/blog/AuthorCard";
import { RelatedBlogs } from "@/components/blog/RelatedBlogs";
import { MarkdownRenderer } from "@/components/blog/MarkdownRenderer";
import { SchemaMarkup } from "@/components/blog/SchemaMarkup";
import { toast } from "sonner";

import { supabase } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Footer from "@/components/footer/Footer";
import Navbar from "@/components/navbar/Navbar";

export default function BlogPost({ params }: { params: { slug: string } }) {
  const [blog, setBlog] = useState<any>(null);
  const [markdown, setMarkdown] = useState<string>("");
  const [relatedBlogs, setRelatedBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(()=>{
    const fetchBlog = async () => {
      setLoading(true);
      const {data, error}= await supabase
        .from("posts")
        .select("*")
        .eq("slug", params.slug)
        .single();

        if(error || !data){
          setBlog(null);
          setLoading(false);
          return;
        }
        setBlog(data);

        const {data: file, error: fileError} = await supabase
          .storage
          .from("blog-md")
          .download("free-resume-builder-tools.md");

        if(fileError || !file){
          setMarkdown("Could not load blog post");
        }else{
          const text = await file.text();
          setMarkdown(text);
        }

        const {data: relatedBlogs, error: relatedBlogsError} = await supabase
          .from("posts")
          .select("*")
          .eq("category",data.category)
          .neq("slug", data.slug)
          .limit(3);
        
        const relatedBlogsData = (relatedBlogs || []).map((b: any) => ({
          id: b.slug,
          title: b.title,
          excerpt: b.excerpt,
          author: {
            name: b.author_name,
            image: b.author_image,
          },
          publishDate: b.publish_date,
          readTime: b.read_time,
          image: b.image_url,
          category: b.category,
        }));

        setRelatedBlogs(relatedBlogsData);
        setLoading(false);
    };
    fetchBlog();
  }, [params.slug]);
  
  // const blog = mockBlogData[params.slug as keyof typeof mockBlogData];
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }
  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Blog post not found</h1>
          <Button asChild>
            <Link href="/blogs">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back to Blog
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: blog.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const articleSchema = blog.schema ;


  return (
    <div className="min-h-screen bg-white">
      <SchemaMarkup articleSchema={articleSchema} />
      <Navbar />
      <br />
      <br />
      <br />
      <div className="container mx-auto px-4 pt-16 ">
        <div className="max-w-4xl mx-auto">
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <Link 
              href="/" 
              className="flex items-center hover:text-prepzo transition-colors duration-200"
            >
              <Home className="w-4 h-4 mr-1" />
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <Link 
              href="/blogs" 
              className="hover:text-prepzo transition-colors duration-200"
            >
              Blog
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-800 font-medium truncate max-w-xs">
              {blog?.title || "Blog Post"}
            </span>
          </nav>
        </div>
      </div>
      {/* Hero section */}
      <article className="container mx-auto mt-10 px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Category and metadata */}
          
          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 leading-tight text-prepzo-900">
            {blog.title}
          </h1>
          <div className="flex items-center gap-4 mb-6">
            <span className="px-3 py-1 bg-prepzo-100 text-prepzo-800 text-sm font-medium rounded-full">
              {blog.category}
            </span>
            <div className="flex items-center gap-4 text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">{blog.publish_date}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{blog.read_time}</span>
              </div>
            </div>
          </div>
          {/* Featured image */}
          <div className="aspect-video mb-12 rounded-lg overflow-hidden">
            <Image 
              src={blog.image_url} 
              alt={blog.title}
              className="w-full h-full object-cover"
              width={1000}
              height={1000}
            />
          </div>

          {/* Author card */}
          <div className="mb-12">
            <AuthorCard author={blog} onShare={handleShare} />
          </div>

          {/* Content */}
          <div className="mb-16">
            <MarkdownRenderer content={markdown} />
          </div>

          {/* Author card again */}
          <div className="mb-16">
            <AuthorCard author={blog} onShare={handleShare} />
          </div>

          {/* Related blogs */}
          <RelatedBlogs blogs={relatedBlogs} />
        </div>
      </article>
      <Footer />
    </div>
  );
}
