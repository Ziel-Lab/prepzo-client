import { BlogCard } from "./BlogCard";

interface RelatedBlogsProps {
  blogs: Array<{
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
  }>;
}

export const RelatedBlogs = ({ blogs }: RelatedBlogsProps) => {
  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold mb-8">Related Articles</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogs.map((blog) => (
          <BlogCard key={blog.id} {...blog} />
        ))}
      </div>
    </section>
  );
};
