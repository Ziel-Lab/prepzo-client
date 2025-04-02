import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { session_id, recipient_email } = await request.json();

    // Update the conversation_histories table with the email
    const { data, error } = await supabase
      .from('conversation_histories')
      .update({ user_email: recipient_email })
      .eq('session_id', session_id)
      .select();

    if (error) {
      console.error('Error updating Supabase:', error);
      throw new Error('Failed to store email');
    }

    if (!data || data.length === 0) {
      // If no existing record found, create a new one
      const { error: insertError } = await supabase
        .from('conversation_histories')
        .insert([
          {
            session_id,
            user_email: recipient_email,
            conversation: [], // Empty array for now
          },
        ]);

      if (insertError) {
        console.error('Error inserting into Supabase:', insertError);
        throw new Error('Failed to store email');
      }
    }

    return new NextResponse(
      `Email saved successfully`,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving email to database:', error);
    return new NextResponse(
      'Failed to save email to database. Please try again later.',
      { status: 500 }
    );
  }
} 