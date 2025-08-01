import {
  AccessToken,
  AccessTokenOptions,
  VideoGrant,
} from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabaseClient } from "@/utils/supabase/server";
import { v4 as uuidv4 } from 'uuid';

// Use special mock interview environment variables
const MOCK_INTERVIEW_API_KEY = process.env.MOCK_INTERVIEW_LIVEKIT_API_KEY;
const MOCK_INTERVIEW_API_SECRET = process.env.MOCK_INTERVIEW_LIVEKIT_API_SECRET;
const MOCK_INTERVIEW_LIVEKIT_URL = process.env.MOCK_INTERVIEW_LIVEKIT_URL;

export const revalidate = 0;

export type MockInterviewConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
  sessionId: string;
  userId: string;
  userEmail: string;
  userName: string;
};

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user from Supabase
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in to access mock interviews" },
        { status: 401 }
      );
    }

    // Parse request body for session configuration
    const body = await req.json();
    const { 
      sessionId, 
      interviewType = 'behavioral',
      position = 'Software Engineer',
      difficulty = 'medium',
      duration = 30 
    } = body;

    // Validate environment variables
    if (!MOCK_INTERVIEW_LIVEKIT_URL) {
      throw new Error("MOCK_INTERVIEW_LIVEKIT_URL is not defined");
    }
    if (!MOCK_INTERVIEW_API_KEY) {
      throw new Error("MOCK_INTERVIEW_LIVEKIT_API_KEY is not defined");
    }
    if (!MOCK_INTERVIEW_API_SECRET) {
      throw new Error("MOCK_INTERVIEW_LIVEKIT_API_SECRET is not defined");
    }

    // Generate unique session ID if not provided
    const finalSessionId = sessionId || uuidv4();
    
    // Create room name with user context
    const roomName = `mock_interview_${user.id}_${finalSessionId}`;
    
    // Create participant identity with user information
    const participantIdentity = `user_${user.id}`;
    const participantName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Interview Candidate';

    // Generate participant token for mock interview room
    const participantToken = await createMockInterviewParticipantToken(
      { 
        identity: participantIdentity,
        name: participantName,
        metadata: JSON.stringify({
          userId: user.id,
          email: user.email,
          sessionId: finalSessionId,
          interviewType,
          position,
          difficulty,
          duration
        })
      },
      roomName,
    );

    const connectionDetails: MockInterviewConnectionDetails = {
      serverUrl: MOCK_INTERVIEW_LIVEKIT_URL,
      roomName,
      participantToken,
      participantName,
      sessionId: finalSessionId,
      userId: user.id,
      userEmail: user.email || '',
      userName: participantName
    };

    // Log interview session start for analytics
    console.log(`Mock interview session started:`, {
      userId: user.id,
      userEmail: user.email,
      sessionId: finalSessionId,
      roomName,
      interviewType,
      position,
      difficulty,
      duration,
      timestamp: new Date().toISOString()
    });

    const headers = new Headers({
      "Cache-Control": "no-store",
    });

    return NextResponse.json(connectionDetails, { headers });

  } catch (error) {
    console.error("Mock interview token generation error:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to create mock interview session: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

function createMockInterviewParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string
) {
  const at = new AccessToken(MOCK_INTERVIEW_API_KEY, MOCK_INTERVIEW_API_SECRET, {
    ...userInfo,
    ttl: "2h", // Extended time for interviews
  });
  
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
    // Additional permissions for interview features
    canUpdateOwnMetadata: true,
  };
  
  at.addGrant(grant);
  return at.toJwt();
}

// GET method for retrieving existing session details (if needed)
export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Return session info for the authenticated user
    const sessionInfo = {
      userId: user.id,
      userEmail: user.email,
      userName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      sessionId,
      canAccess: true // Could add subscription checks here
    };

    return NextResponse.json(sessionInfo);

  } catch (error) {
    console.error("Session retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve session information" },
      { status: 500 }
    );
  }
} 