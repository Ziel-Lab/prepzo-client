export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { RoomServiceClient } from "livekit-server-sdk";

const GA_LIVEKIT_API_KEY = process.env.NEXT_LIVEKIT_API_KEY_GA;
const GA_LIVEKIT_API_SECRET = process.env.NEXT_LIVEKIT_API_SECRET_GA;
const GA_LIVEKIT_URL = process.env.NEXT_LIVEKIT_URL_GA;

export async function POST(req: NextRequest) {
  try {
    const { roomName } = await req.json();
    if (!roomName) {
      return NextResponse.json({ error: "roomName is required" }, { status: 400 });
    }
    if (!GA_LIVEKIT_URL || !GA_LIVEKIT_API_KEY || !GA_LIVEKIT_API_SECRET) {
      return NextResponse.json({ error: "LiveKit GA server not configured" }, { status: 500 });
    }

    const client = new RoomServiceClient(GA_LIVEKIT_URL, GA_LIVEKIT_API_KEY, GA_LIVEKIT_API_SECRET);
    try {
      await client.deleteRoom(roomName);
    } catch (e) {
      // If room does not exist or already closed, ignore
    }

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: "Failed to end session" }, { status: 500 });
  }
}


