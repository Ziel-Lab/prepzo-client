import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Remote service that performs the real LinkedIn PDF extraction
const REMOTE_ENDPOINT = 'https://dev.prepzo.ai/profile/upload-linkedin-pdf';

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
    const remoteResponse = await fetch(REMOTE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: forwardForm,
    });

    const responseData = await remoteResponse.json();

    // Normalise shape for the frontend: it expects { success, data, ... }
    let normalised = responseData;
    if (!('data' in responseData) && responseData.profile_data) {
      const p = responseData.profile_data;
      normalised = {
        success: remoteResponse.ok,
        data: {
          ...p,
          skills: Array.isArray(p.skills) ? p.skills : [],
          experience: Array.isArray(p.experience) ? p.experience : [],
          education: Array.isArray(p.education) ? p.education : [],
          certificates: Array.isArray(p.certificates) ? p.certificates : [],
        },
        raw: responseData,
      };
    }

    return NextResponse.json(normalised, { status: remoteResponse.status });
  } catch (err) {
    console.error('LinkedIn PDF proxy error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}