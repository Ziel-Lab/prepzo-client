import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';


export async function POST(request: Request) {
  // Initialize Supabase client inside the handler
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! );

  try {
    const { session_id, recipient_email } = await request.json();

    // Validate input
    if (!session_id || !recipient_email) {
      return new NextResponse('Missing session_id or recipient_email', { status: 400 });
    }
    if (typeof recipient_email !== 'string' || !recipient_email.includes('@')) {
      return new NextResponse('Invalid recipient_email format', { status: 400 });
    }

    // Upsert into user_emails table
    const { data: upsertData, error: upsertError } = await supabase
      .from('user_emails')
      .upsert({
        session_id,
        email: recipient_email,
      })
      .select(); // it's good practice to select to confirm the operation

    if (upsertError) {
      console.error('Error upserting to user_emails:', upsertError);
      // It's good to be more specific with error messages if possible, but avoid leaking too much detail.
      throw new Error(`Failed to store email in user_emails. Supabase error: ${upsertError.message}`);
    }

    // The logic for conversation_histories seems to be an attempt to ensure a record exists.
    // This might be better handled by database triggers or a more direct check-then-insert if necessary.
    // For now, let's assume the primary goal is to store the email in user_emails.
    // If you absolutely need to ensure a conversation_histories entry, the logic would need refinement.
    // The original code for inserting into conversation_histories if no update occurred is a bit convoluted.
    // A simple check then insert would be:
    /*
    const { data: existingConversation, error: convCheckError } = await supabase
      .from('conversation_histories')
      .select('session_id')
      .eq('session_id', session_id)
      .maybeSingle();

    if (convCheckError) {
      console.error('Error checking conversation_histories:', convCheckError);
      // Decide if this is a critical failure
    }

    if (!existingConversation) {
      const { error: insertConvError } = await supabase
        .from('conversation_histories')
        .insert([{
          session_id,
          user_email: recipient_email, 
          // conversation: [], // Default value should ideally be set in DB schema
        }]);
      if (insertConvError) {
        console.error('Error inserting into conversation_histories:', insertConvError);
        // Decide if this is a critical failure
      }
    } else {
      // Optionally update the email in conversation_histories if it can change
      const { error: updateConvEmailError } = await supabase
        .from('conversation_histories')
        .update({ user_email: recipient_email })
        .eq('session_id', session_id);
      if (updateConvEmailError) {
        console.error('Error updating email in conversation_histories:', updateConvEmailError);
      }
    }
    */

    console.log('Email stored successfully in user_emails:', upsertData);
    return new NextResponse(
      JSON.stringify({ message: 'Email saved successfully', data: upsertData }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) { // Catching 'any' to access error.message safely
    console.error('Error in store-email API route:', error.message);
    return new NextResponse(
      JSON.stringify({ message: error.message || 'Failed to save email to database. Please try again later.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 