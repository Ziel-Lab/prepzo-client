import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { withOptionalAuth, withRateLimit, validateEmail, validateRequired, sanitizeString, AuthContext } from '@/lib/auth-middleware';

const rateLimitedHandler = withRateLimit(20, 15 * 60 * 1000); // 20 requests per 15 minutes

export async function POST(request: NextRequest) {
  return rateLimitedHandler(request, async (req) => {
    return withOptionalAuth(req, async (request, auth?: AuthContext) => {
      const supabase = await createClient();

      try {
        const body = await request.json();
        const { session_id, recipient_email } = body;

        // Validate required fields
        const missing = validateRequired({ session_id, recipient_email });
        if (missing.length > 0) {
          return NextResponse.json(
            { error: `Missing required fields: ${missing.join(', ')}` },
            { status: 400 }
          );
        }

        // Validate email format
        if (!validateEmail(recipient_email)) {
          return NextResponse.json(
            { error: 'Invalid email format' },
            { status: 400 }
          );
        }

        // Sanitize inputs
        const sanitizedSessionId = sanitizeString(session_id, 255);
        const sanitizedEmail = sanitizeString(recipient_email, 320); // Max email length

        // Prepare data object - include user_id only if authenticated
        const emailData: any = {
          session_id: sanitizedSessionId,
          email: sanitizedEmail,
        };
        
        if (auth) {
          emailData.user_id = auth.userId; // Associate with authenticated user
        }

        // Upsert into user_emails table with sanitized values
        // Note: This uses ANON key with RLS - ensure user_emails table has proper RLS policies
        const { data: upsertData, error: upsertError } = await supabase
          .from('user_emails')
          .upsert(emailData)
          .select();

        if (upsertError) {
          console.error('Error upserting to user_emails:', upsertError);
          return NextResponse.json(
            { error: 'Failed to store email. Please try again.' },
            { status: 500 }
          );
        }

        const logMessage = auth 
          ? `Email stored successfully for user ${auth.userId}:` 
          : 'Email stored successfully for anonymous session:';
        console.log(logMessage, upsertData);
        
        return NextResponse.json(
          { message: 'Email saved successfully', data: upsertData },
          { status: 200 }
        );

      } catch (error: any) {
        console.error('Error in store-email API route:', error.message);
        return NextResponse.json(
          { error: error.message || 'Failed to save email to database. Please try again later.' },
          { status: 500 }
        );
      }
    });
  });
} 