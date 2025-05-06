import { NextResponse } from "next/server";

const LIVEKIT_URL = process.env.LIVEKIT_URL;
// Use NEXT_PUBLIC_BACKEND_URL for the base URL
const PYTHON_BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
// Construct the full token endpoint URL
const PYTHON_BACKEND_GET_TOKEN_URL = PYTHON_BACKEND_BASE_URL 
  ? `${PYTHON_BACKEND_BASE_URL.replace(/\/$/, '')}/getToken` // Remove trailing slash if present before appending
  : null;

console.log("LIVEKIT_URL for API proxy:", LIVEKIT_URL);
console.log("Python token endpoint for API proxy:", PYTHON_BACKEND_GET_TOKEN_URL);

export const revalidate = 0;

export type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};

interface PythonTokenResponse {
  identity: string;
  accessToken: string;
  roomName: string;
}

export async function GET() {
  try {
    if (!LIVEKIT_URL) {
      throw new Error("LIVEKIT_URL is not defined in the Next.js server environment.");
    }
    // Check if the Python endpoint URL could be constructed (depends on NEXT_PUBLIC_BACKEND_URL)
    if (!PYTHON_BACKEND_GET_TOKEN_URL) {
      throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined or invalid in the Next.js server environment, cannot construct token endpoint.");
    }

    console.log(`Fetching token from Python backend: ${PYTHON_BACKEND_GET_TOKEN_URL}`);
    // Fetch uses the constructed URL
    const pythonResponse = await fetch(PYTHON_BACKEND_GET_TOKEN_URL, {
      cache: "no-store", 
    });

    if (!pythonResponse.ok) {
      const errorText = await pythonResponse.text();
      console.error(`Error fetching token from Python backend: ${pythonResponse.status}`, errorText);
      throw new Error(`Failed to fetch token from Python backend: ${pythonResponse.status} ${errorText}`);
    }

    const tokenData: PythonTokenResponse = await pythonResponse.json();
    console.log("Token data received from Python backend:", tokenData);

    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName: tokenData.roomName,
      participantToken: tokenData.accessToken,
      participantName: tokenData.identity,
    };

    const headers = new Headers({
      "Cache-Control": "no-store",
    });
    return NextResponse.json(data, { headers });

  } catch (error) {
    if (error instanceof Error) {
      console.error("Error in /api/connection-details proxy route:", error.message);
      return new NextResponse(error.message, { status: 500 });
    }
    // Fallback for non-Error instances
    console.error("Unknown error in /api/connection-details proxy route:", error);
    return new NextResponse("An unknown error occurred", { status: 500 });
  }
}