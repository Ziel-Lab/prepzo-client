import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { withRateLimit, validateEmail, validateRequired, sanitizeString } from '@/lib/auth-middleware';

const rateLimitedHandler = withRateLimit(5, 15 * 60 * 1000); // 5 contact submissions per 15 minutes

export async function POST(request: NextRequest) {
  return rateLimitedHandler(request, async (req) => {
    const supabase = await createClient();

    try {
      const body = await request.json();
      const { name, email, organization, inquiryType, message } = body;

      // Validate required fields
      const missing = validateRequired({ name, email, organization, inquiryType, message });
      if (missing.length > 0) {
        return NextResponse.json(
          { error: `Missing required fields: ${missing.join(', ')}` },
          { status: 400 }
        );
      }

      // Validate email format
      if (!validateEmail(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }

      // Sanitize inputs to prevent XSS and limit length
      const sanitizedName = sanitizeString(name, 100);
      const sanitizedEmail = sanitizeString(email, 320);
      const sanitizedOrganization = sanitizeString(organization, 200);
      const sanitizedInquiryType = sanitizeString(inquiryType, 50);
      const sanitizedMessage = sanitizeString(message, 2000);

      // Validate inquiry type is from allowed values
      const allowedInquiryTypes = ['general', 'support', 'sales', 'partnership', 'feedback', 'other'];
      if (!allowedInquiryTypes.includes(sanitizedInquiryType.toLowerCase())) {
        return NextResponse.json(
          { error: 'Invalid inquiry type' },
          { status: 400 }
        );
      }

      // Insert contact form data using sanitized values
      const { data, error } = await supabase
        .from('contact_us')
        .insert([
          { 
            name: sanitizedName, 
            email: sanitizedEmail, 
            organization: sanitizedOrganization, 
            inquiry_type: sanitizedInquiryType,
            message: sanitizedMessage 
          },
        ])
        .select();

      if (error) {
        console.error('Supabase insert error:', JSON.stringify(error, null, 2));
        return NextResponse.json(
          { error: 'Failed to store contact information. Please try again.' },
          { status: 500 }
        );
      }

      console.log('Contact form submitted successfully:', { email: sanitizedEmail, organization: sanitizedOrganization });
      return NextResponse.json(
        { message: 'Contact information stored successfully', data },
        { status: 200 }
      );

    } catch (error: any) {
      console.error('Error processing contact form:', error);
      return NextResponse.json(
        { error: 'Internal server error. Please try again later.' },
        { status: 500 }
      );
    }
  });
}