"use client"
import { useEffect, useState } from "react";
import { BlogCard } from "@/components/blog/BlogCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const mockBlogs = [
  {
    id: "free-resume-builder-tools",
    title: "10 Free Resume Builder Tools That Will Transform Your Job Search in 2025",
    excerpt: "Discover the 10 best free resume builder tools of 2025 that will transform your job search. Compare features, pros, cons, and find the perfect tool for your career needs.",
    author: {
      name: "Sarah Johnson",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
    },
    publishDate: "June 1, 2025",
    readTime: "8 min read",
    image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&h=400&fit=crop",
    category: "Career Tools"
  },
  {
    id: "interview-tips-2025",
    title: "Master Your Next Interview: 15 Expert Tips for 2025",
    excerpt: "Learn the latest interview strategies and techniques that will help you stand out from the competition and land your dream job.",
    author: {
      name: "Michael Chen",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    },
    publishDate: "May 28, 2025",
    readTime: "12 min read",
    image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=400&fit=crop",
    category: "Interview Prep"
  },
  {
    id: "linkedin-optimization",
    title: "LinkedIn Profile Optimization: Complete Guide for 2025",
    excerpt: "Transform your LinkedIn profile into a powerful career tool that attracts recruiters and opens new opportunities.",
    author: {
      name: "Emma Davis",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
    },
    publishDate: "May 25, 2025",
    readTime: "10 min read",
    image: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=400&fit=crop",
    category: "Personal Branding"
  }
];

const categories = ["All", "Career Tools", "Interview Prep", "Personal Branding", "Job Search"];

const Blog = () => {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(()=>{
    const fetchBlogs= async()=>{
      setLoading(true);
      const {data,error} = await createClient()
        .from("posts")
        .select("*")
        .order("created_at",{ascending:false});
      if (error){
        setBlogs([]);
      }else{
        setBlogs(data);
      }
      setLoading(false);
    };
    fetchBlogs();
  },[]);

  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         blog.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || blog.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-prepzo-800 to-prepzo-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Career Insights & Tips
            </h1>
            <p className="text-xl text-prepzo-100 mb-8">
              Expert advice to accelerate your career growth and land your dream job
            </p>
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <section className="bg-prepzo-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category ? "bg-prepzo-600 hover:bg-prepzo-700" : "border-prepzo-200 text-prepzo-700 hover:bg-prepzo-50"}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
          {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Loading articles...</p>
              </div>
          ): filteredBlogs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredBlogs.map((blog) => (
                  <BlogCard key={blog.id} {...blog} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No articles found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Blog;