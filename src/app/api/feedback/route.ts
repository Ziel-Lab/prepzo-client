import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stars, comments, room_id, submit } = body;

    // Validate room_id and submit
    if (!room_id || typeof submit !== 'boolean') {
      return new NextResponse(
        JSON.stringify({ error: 'room_id and submit are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // If submit is true, validate stars
    if (submit) {
      if (typeof stars !== 'number' || stars < 1 || stars > 5) {
        return new NextResponse(
          JSON.stringify({ error: 'Stars must be a number between 1 and 5' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Prepare insert object
    const insertObj: any = { room_id, submit };
    if (submit) {
      insertObj.stars = stars;
      insertObj.comments = comments;
    }

    const { data, error } = await supabase
      .from('feedback')
      .insert([insertObj])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return new NextResponse(
        JSON.stringify({ error: 'Failed to store feedback', details: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new NextResponse(
      JSON.stringify({ message: 'Feedback stored successfully', data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error processing feedback:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
