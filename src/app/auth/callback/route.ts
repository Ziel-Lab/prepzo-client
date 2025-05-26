import { NextResponse } from 'next/server'
import { cookies } from 'next/headers' // Import cookies
import { createClient } from '@/utils/supabase/server' // Use the server client

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = cookies() // Get cookie store
    const supabase = await createClient() // Use the server client

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const redirectUrlBase = process.env.NEXT_PUBLIC_SITE_URL || origin;

      const finalRedirectPath = '/dashboard'; 
      return NextResponse.redirect(`${redirectUrlBase}${finalRedirectPath}`)
    }
     console.error('Error exchanging code for session:', error);
  }

  // return the user to an error page with instructions
  console.error('No code found in callback request or error occurred during exchange.');
  // It's recommended to create a dedicated error page (e.g., /auth/auth-code-error)
  // and redirect there instead of the generic origin.
  return NextResponse.redirect(`${origin}/auth/error?message=Authentication%20failed`) // Redirect to an error page
} 