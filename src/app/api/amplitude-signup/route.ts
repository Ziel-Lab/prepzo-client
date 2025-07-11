import { NextRequest, NextResponse } from 'next/server';
import { sendSignupEvent } from '@/lib/amplitude';
import { withAuth, withRateLimit, validateRequired, sanitizeString } from '@/lib/auth-middleware';

const rateLimitedHandler = withRateLimit(5, 15 * 60 * 1000); // 5 analytics events per 15 minutes

export async function POST(request: NextRequest) {
  return rateLimitedHandler(request, async (req) => {
    return withAuth(req, async (request, auth) => {
      try {
        const body = await request.json();

        const {
          user_uuid,
          user_email,
          user_name,
          source,
          subscription_status,
          subscription_plan,
        } = body;

        // Validate required fields
        const missing = validateRequired({ user_uuid, source });
        if (missing.length > 0) {
          return NextResponse.json(
            { error: `Missing required fields: ${missing.join(', ')}` },
            { status: 400 }
          );
        }

        // Validate that the user_uuid matches the authenticated user
        if (user_uuid !== auth.userId) {
          return NextResponse.json(
            { error: 'Unauthorized - Cannot submit analytics for other users' },
            { status: 403 }
          );
        }

        // Validate source value
        const allowedSources = ['Google', 'Linkedin'];
        if (!allowedSources.includes(source)) {
          return NextResponse.json(
            { error: 'Invalid source. Must be Google or Linkedin' },
            { status: 400 }
          );
        }

        // Sanitize optional string fields
        const sanitizedUserEmail = user_email ? sanitizeString(user_email, 320) : null;
        const sanitizedUserName = user_name ? sanitizeString(user_name, 100) : null;
        const sanitizedSubscriptionStatus = subscription_status ? sanitizeString(subscription_status, 50) : 'Unknown';
        const sanitizedSubscriptionPlan = subscription_plan ? sanitizeString(subscription_plan, 50) : 'Unknown';

        await sendSignupEvent({
          user_uuid: auth.userId, // Use authenticated user ID for security
          user_email: sanitizedUserEmail,
          user_name: sanitizedUserName,
          source: source === 'Linkedin' ? 'Linkedin' : 'Google',
          subscription_status: sanitizedSubscriptionStatus,
          subscription_plan: sanitizedSubscriptionPlan,
        });

        console.log(`Analytics signup event sent for user ${auth.userId}`);
        return NextResponse.json({ success: true });

      } catch (error) {
        console.error('Failed to send Amplitude signup event:', error);
        return NextResponse.json(
          { error: 'Failed to process analytics event. Please try again.' },
          { status: 500 }
        );
      }
    });
  });
} 