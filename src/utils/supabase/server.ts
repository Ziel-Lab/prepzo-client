import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = cookies()

  // Create a server-side client using the SSR package
  // Requires environment variables named SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or ANON_KEY)
  // Note: Using SERVICE_ROLE_KEY bypasses RLS but might be necessary for certain admin actions.
  // Using ANON_KEY respects RLS. Choose based on your needs for this server client.
  // For auth flows like code exchange, ANON_KEY is usually sufficient and safer.
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, // Use NEXT_PUBLIC_ for consistency, but server can access non-prefixed too
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Use ANON key for RLS
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
} 