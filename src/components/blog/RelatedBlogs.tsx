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
      {blogs.length === 0 ? (
        <div className="text-gray-500 text-center py-8">
          No related articles found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <BlogCard 
                key={blog.id} 
                slug={blog.id} 
                author_name={blog.author.name} 
                author_image={blog.author.image} 
                publish_date={blog.publishDate} 
                read_time={blog.readTime} 
                image_url={blog.image}
                category={blog.category} 
                id={blog.id} 
                title={blog.title} 
                excerpt={blog.excerpt} />
          ))}
        </div>
      )}
    </section>
  );
};