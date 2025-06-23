"use client"
import { useEffect, useState } from "react";
import { BlogCard } from "@/components/blog/BlogCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Search } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Footer from "@/components/footer/Footer";
import Navbar from "@/components/navbar/Navbar";
import { ArrowLeft } from 'lucide-react';


const categories = ["All", "Career Tools", "Interview Prep","Cover Letter", "Resume", "Personal Branding", "Job Search","Company Updates"];

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  author_name: string;
  author_image: string;
  slug: string;
  publish_date: string;
  read_time: string;
  image_url: string;
  category: string;
}
const Blog = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [page, setPage]= useState(1);
  const [total, setTotal] = useState(0);

  const pageSize= 6;
  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = createClient()
        .from("posts")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      // Apply category filter
      if (selectedCategory !== "All") {
        query = query.eq("category", selectedCategory);
      }

      // Apply search filter (case-insensitive, on title and excerpt)
      if (searchTerm) {
        query = query.or(
          `title.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%`
        );
      }

      const { data, error, count } = await query.range(from, to);

      if (error) {
        setBlogs([]);
        setTotal(0);
      } else {
        setBlogs(data);
        setTotal(count || 0);
      }
      setLoading(false);
    };
    fetchBlogs();
  }, [page, pageSize, selectedCategory, searchTerm]);

  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-prepzo-900 text-white">
        <div className="container mx-auto px-4 py-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl mt-20 md:text-5xl font-bold mb-6">
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
          ): blogs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogs.map((blog) => (
                    <BlogCard key={blog.id} {...blog}/>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No articles found matching your criteria.</p>
              </div>
            )}
          </div>
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
            <ArrowLeft className="w-4 h-4 " />
            </Button>
            <span>
            Page {page} of {Math.ceil(total / pageSize) || 1}
            </span>
          <Button
            onClick={() => setPage((p) => (p * pageSize < total ? p + 1 : p))}
            disabled={page * pageSize >= total}
          >
            <ArrowRight className="w-4 h-4 " />
          </Button>
        </div>
        </div>
      </section>
      
    </div>
    <Footer />
    </>
  );
};

export default Blog;