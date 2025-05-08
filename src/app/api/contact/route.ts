import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// Ensure your environment variables are set up for these
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Using service role key for backend operations
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, organization, inquiryType, message } = body;

    // Validate incoming data (basic check)
    if (!name || !email || !organization || !inquiryType || !message) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await supabase
      .from('contact us') // Table name as per your image
      .insert([
        { 
          name, 
          email, 
          organization, 
          'inquiry type': inquiryType, // Column name with space needs quotes
          message 
        },
      ])
      .select(); // Optionally, select the inserted data if needed

    if (error) {
      console.error('Supabase insert error:', error);
      return new NextResponse(
        JSON.stringify({ error: 'Failed to store contact information', details: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new NextResponse(
      JSON.stringify({ message: 'Contact information stored successfully', data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error processing contact form:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}