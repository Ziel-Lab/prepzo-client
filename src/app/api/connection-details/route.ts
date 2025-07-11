import {
  AccessToken,
  AccessTokenOptions,
  VideoGrant,
} from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from 'uuid';
import { withOptionalAuth, withRateLimit, AuthContext } from '@/lib/auth-middleware';

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

const rateLimitedHandler = withRateLimit(10, 15 * 60 * 1000); // 10 connection requests per 15 minutes

export const revalidate = 0;

export type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};

export async function GET(request: NextRequest) {
  return rateLimitedHandler(request, async (req) => {
    return withOptionalAuth(req, async (request, auth?: AuthContext) => {
      try {
        // Validate environment variables
        if (!LIVEKIT_URL) {
          console.error("LIVEKIT_URL is not configured");
          return NextResponse.json(
            { error: "LiveKit service not configured" },
            { status: 500 }
          );
        }
        if (!API_KEY) {
          console.error("LIVEKIT_API_KEY is not configured");
          return NextResponse.json(
            { error: "LiveKit service not configured" },
            { status: 500 }
          );
        }
        if (!API_SECRET) {
          console.error("LIVEKIT_API_SECRET is not configured");
          return NextResponse.json(
            { error: "LiveKit service not configured" },
            { status: 500 }
          );
        }

        // Generate session ID and participant identity
        const session_id = uuidv4();
        const userIdentifier = auth ? auth.userId : `anonymous_${Date.now()}`;
        const participantIdentity = `voice_assistant_user_${userIdentifier}_${Date.now()}`;
        const roomName = `voice_assistant_room_${session_id}`;
        
        // Generate participant token with user-specific or anonymous identity
        const participantToken = await createParticipantToken(
          { identity: participantIdentity },
          roomName
        );

        const data: ConnectionDetails = {
          serverUrl: LIVEKIT_URL,
          roomName,
          participantToken: participantToken,
          participantName: participantIdentity,
        };

        const logMessage = auth 
          ? `LiveKit connection details generated for user ${auth.userId}:` 
          : 'LiveKit connection details generated for anonymous user:';
        console.log(logMessage, { roomName, participantIdentity });
        
        const headers = new Headers({
          "Cache-Control": "no-store",
        });
        return NextResponse.json(data, { headers });

      } catch (error) {
        console.error('Error generating LiveKit connection details:', error);
        return NextResponse.json(
          { error: 'Failed to generate connection details. Please try again.' },
          { status: 500 }
        );
      }
    });
  });
}

function createParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string
) {
  const at = new AccessToken(API_KEY, API_SECRET, {
    ...userInfo,
    ttl: "18m",
  });
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };
  at.addGrant(grant);
  return at.toJwt();
}