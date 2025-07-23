import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Endpoint that accepts the PDF upload
const REMOTE_UPLOAD_ENDPOINT = 'https://dev.prepzo.ai/profile/upload-linkedin-pdf';
// Endpoint to fetch the processed profile data (populated asynchronously by n8n)
const REMOTE_PROFILE_ENDPOINT = 'https://dev.prepzo.ai/profile';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    // Accept either "file" (curl usage) or "linkedin_pdf" (frontend usage)
    const pdfFile = (formData.get('file') || formData.get('linkedin_pdf')) as File | null;

    if (!pdfFile) {
      return NextResponse.json({ error: 'No LinkedIn PDF file provided.' }, { status: 400 });
    }

    // Basic validation – only allow PDF files up to 10 MB
    if (pdfFile.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Invalid file type. Please upload a PDF.' }, { status: 400 });
    }
    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (pdfFile.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10 MB.' }, { status: 400 });
    }

    // Retrieve the user session to forward the access token
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    // Re-create a FormData object to forward to the remote service
    const forwardForm = new FormData();
    // Reconstruct the File/Blob so that the remote endpoint receives a fresh stream
    const pdfBuffer = await pdfFile.arrayBuffer();
    forwardForm.append(
      'file',
      new Blob([pdfBuffer], { type: pdfFile.type }),
      pdfFile.name,
    );

    // Forward the request to the remote extraction service
    const remoteResponse = await fetch(REMOTE_UPLOAD_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: forwardForm,
    });

    // If the initial upload failed, just forward the error back
    if (!remoteResponse.ok) {
      const errorJson = await remoteResponse.json();
      return NextResponse.json(errorJson, { status: remoteResponse.status });
    }

    // The upload succeeded – the backend will now extract the profile asynchronously.
    // Poll the profile endpoint for a short period to retrieve the processed data.
    const MAX_ATTEMPTS = 10;
    const DELAY_MS = 1500;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      // eslint-disable-next-line no-await-in-loop
      const profRes = await fetch(REMOTE_PROFILE_ENDPOINT, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Accept': 'application/json',
        },
      });

      if (profRes.ok) {
        // eslint-disable-next-line no-await-in-loop
        const profJson: any = await profRes.json();

        const rawProfile = profJson?.db_result || profJson?.profile_data || null;
        if (rawProfile) {
          // Map backend fields to the structure expected by the frontend component
          const {
            name,
            title,
            bio,
            location,
            email,
            phone,
            linkedin_url,
            linkedin,
            website,
            skills,
            experience,
            education,
            certifications,
          } = rawProfile as Record<string, any>;

          const normalised = {
            success: true,
            data: {
              name,
              title,
              bio,
              location,
              email,
              phone,
              linkedin: linkedin_url || linkedin || '',
              website,
              skills: Array.isArray(skills) ? skills : [],
              experience: Array.isArray(experience) ? experience : [],
              education: Array.isArray(education) ? education : [],
              certificates: Array.isArray(certifications) ? certifications : [],
            },
            raw: rawProfile,
          };

          return NextResponse.json(normalised);
        }
      }

      // Wait before the next attempt
      // eslint-disable-next-line no-await-in-loop
      await new Promise(res => setTimeout(res, DELAY_MS));
    }

    // Timed-out waiting for extraction – let the frontend know so it can handle manual input
    return NextResponse.json({
      success: false,
      note: 'Profile extraction is still in progress. Please try again shortly.',
      data: {},
    }, { status: 202 });
  } catch (err) {
    console.error('LinkedIn PDF proxy error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}