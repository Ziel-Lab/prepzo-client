import { Calendar, Clock, ArrowLeft, Home, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthorCard } from "@/components/blog/AuthorCard";
import { RelatedBlogs } from "@/components/blog/RelatedBlogs";
import { MarkdownRenderer } from "@/components/blog/MarkdownRenderer";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import type { Metadata } from 'next'
import Footer from "@/components/footer/Footer";
import Navbar from "@/components/navbar/Navbar";
import { ShareWrapper } from "@/components/blog/ShareWrapper";
import Script from "next/script";

// Enable SSR for this page
export const dynamic = "force-dynamic";

// Create server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Generate static paths at build time
export async function generateStaticParams() {
  const { data: posts } = await supabase
    .from("posts")
    .select("slug");
  
  return posts?.map((post) => ({
    slug: post.slug,
  })) || [];
}



// 1. Use generateMetadata for meta tags
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { data: blog } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (!blog) return {};

  return {
    title: blog.title,
    description: blog.excerpt,
    metadataBase: new URL("https://www.prepzo.ai"),
    alternates: {
      canonical: "/blog/" + blog.slug,
    },
    openGraph: {
      title: blog.title,
      description: blog.excerpt,
      images: blog.image_url,
      type: 'article',
      publishedTime: blog.publish_date,
      authors: blog.author_name,
      section: blog.category,
      locale: "en_US",
      url: `https://www.prepzo.ai/blog/${blog.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.title,
      description: blog.excerpt,
      site: "@prepzo",
      creator: "@prepzo",
    },
    keywords: `${blog.keywords}`,
    robots: "index, follow",
    applicationName: "Prepzo",
  };
}


// Add interface for blog type
interface BlogPost {
  publish_date: string;
  author_name: string;
  category: string;
  title: string;
  excerpt: string;
  image_url: string;
  slug: string;
}

// Add custom meta tags component with proper typing
function CustomMetaTags({ blog }: { blog: BlogPost }) {
  return (
    <>
      <meta property="article:published_time" content={blog.publish_date} />
      <meta property="article:author" content={blog.author_name} />
      <meta property="article:section" content={blog.category} />
    </>
  );
}

// Make the page component async for static generation
export default async function BlogPost({ params }: { params: { slug: string } }) {
  // Fetch blog data at request time (SSR)
  const { data: blog } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", params.slug)
    .single();

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

  // Fetch markdown content
  const { data: file } = await supabase
    .storage
    .from("blog-md")
    .download(blog.slug + ".md");

  const markdown = file ? await file.text() : "Could not load blog post";

  // Fetch related blogs
  const { data: relatedBlogsData } = await supabase
    .from("posts")
    .select("*")
    .eq("category", blog.category)
    .neq("slug", blog.slug)
    .limit(3);

  const relatedBlogs = (relatedBlogsData || []).map((b: { slug: string; title: string; excerpt: string; author_name: string; author_image: string; publish_date: string; read_time: string; image_url: string; category: string; }) => ({
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

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://www.prepzo.ai/blog/${blog.slug}`
    },
    "headline": blog.title,
    "description": blog.excerpt,
    "image": blog.image_url,
    "url": `https://www.prepzo.ai/blog/${blog.slug}`,
    "datePublished": blog.publish_date,
    "author": {
      "@type": "Person",
      "name": blog.author_name
    },
    "publisher": {
      "@type": "Organization",
      "name": "Prepzo",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.prepzo.ai/og.jpeg"
      }
    }
  };
  

  return (
  <>
   <Script
        id="article-schema"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleSchema).replace(/</g, '\\u003c'),
        }}
      />
    <div className="min-h-screen bg-white">  
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
      <article className="container mx-auto mt-10 px-4 pb-12">
        <div className="max-w-4xl mx-auto">
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
          <div className="aspect-video mb-12 rounded-lg overflow-hidden">
            <Image 
              src={blog.image_url} 
              alt={blog.title}
              className="w-full h-full object-cover"
              width={1000}
              height={1000}
              priority
            />
          </div>

          <div className="mb-12">
            <ShareWrapper author={blog} />
          </div>

          <div className="mb-16">
            <MarkdownRenderer content={markdown} />
          </div>

          <div className="mb-16">
            <ShareWrapper author={blog} />
          </div>

          <RelatedBlogs blogs={relatedBlogs} />
        </div>
      </article>
      <Footer />
      {/* JSON-LD structured data (rendered server-side) */}
      {/* <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleSchema).replace(/</g, "\\u003c"),
        }}
      /> */}
    </div>
    </>
  );
}