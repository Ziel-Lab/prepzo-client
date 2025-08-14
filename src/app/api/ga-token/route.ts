export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import {
  AccessToken,
  AccessTokenOptions,
  VideoGrant,
} from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabaseClient } from "@/utils/supabase/server";
import { v4 as uuidv4 } from "uuid";

// GA (General Agent) environment variables
const GA_LIVEKIT_API_KEY = process.env.NEXT_LIVEKIT_API_KEY_GA;
const GA_LIVEKIT_API_SECRET = process.env.NEXT_LIVEKIT_API_SECRET_GA;
const GA_LIVEKIT_URL = process.env.NEXT_LIVEKIT_URL_GA;

export const revalidate = 0;

export type GAConnectionDetails = {
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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in to talk to your agent" },
        { status: 401 }
      );
    }

    // Validate environment variables
    if (!GA_LIVEKIT_URL) {
      throw new Error("LIVEKIT_URL_GA is not defined");
    }
    if (!GA_LIVEKIT_API_KEY) {
      throw new Error("LIVEKIT_API_KEY_GA is not defined");
    }
    if (!GA_LIVEKIT_API_SECRET) {
      throw new Error("LIVEKIT_API_SECRET_GA is not defined");
    }

    // Optional body can carry a sessionId to resume; else create new
    let finalSessionId: string | undefined;
    try {
      const body = await req.json();
      finalSessionId = body?.sessionId;
    } catch {}
    const sessionId = finalSessionId || uuidv4();

    // Create room name with user context
    const roomName = `ga_general_${user.id}_${sessionId}`;

    // Create participant identity with user information
    const participantIdentity = `user_${user.id}`;
    const participantName =
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "Prepzo User";

    // Generate participant token for GA room
    const participantToken = await createGAParticipantToken(
      {
        identity: participantIdentity,
        name: participantName,
        metadata: JSON.stringify({
          userId: user.id,
          email: user.email,
          sessionId,
          agentKey: "general",
          displayName: participantName,
          externalId: user.id,
          livekitIdentity: participantIdentity,
        }),
      },
      roomName
    );

    const connectionDetails: GAConnectionDetails = {
      serverUrl: GA_LIVEKIT_URL,
      roomName,
      participantToken,
      participantName,
      sessionId,
      userId: user.id,
      userEmail: user.email || "",
      userName: participantName,
    };

    const headers = new Headers({
      "Cache-Control": "no-store",
    });

    return NextResponse.json(connectionDetails, { headers });
  } catch (error) {
    console.error("GA token generation error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create GA session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function createGAParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string
) {
  const at = new AccessToken(GA_LIVEKIT_API_KEY!, GA_LIVEKIT_API_SECRET!, {
    ...userInfo,
    ttl: "1h",
  });

  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
    canUpdateOwnMetadata: true,
  };

  at.addGrant(grant);
  return at.toJwt();
}


