import { NextRequest, NextResponse } from 'next/server';

// Use environment variable for Flask URL, default for development
const FLASK_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const FLASK_API_KEY = process.env.FLASK_INTERNAL_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const resumeFile = formData.get('resume') as File | null;
    const sessionId = formData.get('session_id') as string | null;

    if (!resumeFile) {
      console.error('Resume upload error: No resume file provided.');
      return NextResponse.json({ error: 'No resume file provided.' }, { status: 400 });
    }

    if (!sessionId) {
      console.error('Resume upload error: No session ID provided.');
      return NextResponse.json({ error: 'No session ID provided.' }, { status: 400 });
    }

    // Validate file type (optional but recommended)
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(resumeFile.type)) {
       console.error(`Resume upload error: Invalid file type ${resumeFile.type}`);
      return NextResponse.json({ error: 'Invalid file type. Only PDF, DOC, and DOCX are allowed.' }, { status: 400 });
    }

    console.log(`Received resume for session: ${sessionId}, name: ${resumeFile.name}, type: ${resumeFile.type}, size: ${resumeFile.size} bytes`);

    // Construct the Flask endpoint URL safely, removing potential double slashes
    const flaskBaseUrl = FLASK_BACKEND_URL?.replace(/\/$/, '') || ''; // Remove trailing slash if present
    const flaskEndpoint = `${flaskBaseUrl}/api/process-resume`; // Append path

    // Check if base URL is missing after processing
    if (!flaskBaseUrl) {
        console.error('Server configuration error: NEXT_PUBLIC_BACKEND_URL is not set or invalid.');
        return NextResponse.json({ error: 'Internal server configuration error.' }, { status: 500 });
    }

    console.log(`Forwarding resume to Flask endpoint: ${flaskEndpoint}`);

    // --- Forward file to Flask backend --- 
    const flaskFormData = new FormData();
    flaskFormData.append('resume', resumeFile, resumeFile.name);
    flaskFormData.append('session_id', sessionId);

    if (!FLASK_API_KEY) {
      console.error('Server configuration error: FLASK_INTERNAL_API_KEY is not set.');
      return NextResponse.json({ error: 'Internal server configuration error.' }, { status: 500 });
    }

    const headers = new Headers();
    headers.append('X-Internal-API-Key', FLASK_API_KEY);

    const flaskResponse = await fetch(flaskEndpoint, {
      method: 'POST',
      headers: headers, 
      body: flaskFormData,
    });

    if (!flaskResponse.ok) {
        const errorData = await flaskResponse.json().catch(() => ({ error: 'Failed to parse Flask error response' }));
        console.error(`Flask backend failed to process resume (Status: ${flaskResponse.status}):`, errorData);
        return NextResponse.json(
          { error: 'Backend failed to process resume.', details: errorData.error || 'Unknown backend error' }, 
          { status: flaskResponse.status < 500 ? 400 : 500 } // Return 400 for client errors from Flask, 500 otherwise
        );
    }
    
    const successData = await flaskResponse.json();
    console.log('Flask backend processed resume successfully:', successData);

    // Return success response based on Flask response
    return NextResponse.json({ 
        message: successData.message || 'Resume forwarded successfully.', 
        fileName: resumeFile.name 
    });
    // --- End Forwarding Logic ---

  } catch (error) {
    console.error('Error processing resume upload request:', error);
    let errorMessage = 'An unexpected error occurred handling the upload.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    // Distinguish fetch errors (e.g., Flask server down)
    if (error instanceof TypeError && error.message === 'fetch failed') {
      errorMessage = 'Could not connect to the backend processing service.';
      console.error('Fetch failed, likely cannot connect to Flask backend at:', FLASK_BACKEND_URL);
      return NextResponse.json({ error: errorMessage }, { status: 502 }); // Bad Gateway
    }

    return NextResponse.json({ error: 'Failed to process resume upload.', details: errorMessage }, { status: 500 });
  }
}
