import { NextResponse } from 'next/server';
import { sendSignupEvent } from '@/lib/amplitude';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      user_uuid,
      user_email,
      user_name,
      source,
      subscription_status,
      subscription_plan,
    } = body as {
      user_uuid: string;
      user_email: string | null;
      user_name: string | null;
      source: 'Google' | 'Linkedin';
      subscription_status: string;
      subscription_plan: string;
    };

    if (!user_uuid) {
      return NextResponse.json(
        { error: 'Missing user_uuid' },
        { status: 400 },
      );
    }

    await sendSignupEvent({
      user_uuid,
      user_email,
      user_name,
      source: source === 'Linkedin' ? 'Linkedin' : 'Google',
      subscription_status: subscription_status || 'Unknown',
      subscription_plan: subscription_plan || 'Unknown',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to send Amplitude signup event:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
} 