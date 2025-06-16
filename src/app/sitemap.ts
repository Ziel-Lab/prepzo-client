// app/sitemap.ts
import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

// 1️⃣  Turn off static bundling so the code runs every time
//    – or cache & re-validate on a timer if you prefer.
// export const dynamic = 'force-dynamic'          // instant refresh
export const revalidate = 60 * 60            // <- hourly refresh

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!       // stays on the server
)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  
  const { data: posts } = await supabase
    .from('posts')
    .select('slug, updated_at')                 

  
  const staticPages = [
    {
      url: 'https://www.prepzo.ai',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1
    },
    {
      url: 'https://www.prepzo.ai/contact',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5
    },
    {
      url: 'https://www.prepzo.ai/use-cases',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8
    },
    {
      url: 'https://www.prepzo.ai/blogs',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7
    }
  ]

  
  const blogPages =
    posts?.map(p => ({
      url: `https://www.prepzo.ai/blog/${p.slug}`,
      lastModified: p.updated_at ?? new Date(),
      changeFrequency: 'weekly',
      priority: 0.7
    })) ?? []

  // 5️⃣  Return the array.  Next.js turns it into XML automatically.
  return [...staticPages, ...blogPages] as MetadataRoute.Sitemap
}