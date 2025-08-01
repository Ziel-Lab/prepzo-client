import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { withOptionalAuth, withRateLimit, validateRequired, sanitizeString, AuthContext } from '@/lib/auth-middleware';

const rateLimitedHandler = withRateLimit(10, 15 * 60 * 1000); // 10 feedback submissions per 15 minutes

export async function POST(request: NextRequest) {
  return rateLimitedHandler(request, async (req) => {
    return withOptionalAuth(req, async (request, auth?: AuthContext) => {
      const supabase = await createClient();

      try {
        const body = await request.json();
        const { stars, comments, room_id, submit } = body;

        // Validate required fields
        const missing = validateRequired({ room_id, submit });
        if (missing.length > 0) {
          return NextResponse.json(
            { error: `Missing required fields: ${missing.join(', ')}` },
            { status: 400 }
          );
        }

        // Validate submit is boolean
        if (typeof submit !== 'boolean') {
          return NextResponse.json(
            { error: 'submit must be a boolean value' },
            { status: 400 }
          );
        }

        // Sanitize room_id
        const sanitizedRoomId = sanitizeString(room_id, 255);

        // If submit is true, validate stars and comments
        let sanitizedComments: string | undefined;
        if (submit) {
          if (typeof stars !== 'number' || stars < 1 || stars > 5) {
            return NextResponse.json(
              { error: 'Stars must be a number between 1 and 5' },
              { status: 400 }
            );
          }
          
          if (comments) {
            sanitizedComments = sanitizeString(comments, 1000);
          }
        }

        // Prepare insert object with sanitized values
        const insertObj: any = { 
          room_id: sanitizedRoomId, 
          submit
        };
        
        // Include user_id only if authenticated
        if (auth) {
          insertObj.user_id = auth.userId;
        }
        
        if (submit) {
          insertObj.stars = stars;
          insertObj.comments = sanitizedComments || null;
        }

        const { data, error } = await supabase
          .from('feedback')
          .insert([insertObj])
          .select();

        if (error) {
          console.error('Supabase insert error:', error);
          return NextResponse.json(
            { error: 'Failed to store feedback. Please try again.' },
            { status: 500 }
          );
        }

        const logMessage = auth 
          ? `Feedback stored successfully for user ${auth.userId}:` 
          : 'Anonymous feedback stored successfully:';
        console.log(logMessage, { room_id: sanitizedRoomId, submit });
        return NextResponse.json(
          { message: 'Feedback stored successfully', data },
          { status: 200 }
        );

      } catch (error: any) {
        console.error('Error processing feedback:', error);
        return NextResponse.json(
          { error: 'Internal server error. Please try again later.' },
          { status: 500 }
        );
      }
    });
  });
}
