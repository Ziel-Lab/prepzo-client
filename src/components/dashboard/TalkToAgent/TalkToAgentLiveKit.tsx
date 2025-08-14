"use client";

import React, { useEffect, useState } from "react";
import { LiveKitRoom } from "@livekit/components-react";
import "@livekit/components-styles";
import type { GAConnectionDetails } from "@/app/api/ga-token/route";

interface TalkToAgentLiveKitProps {
  children: React.ReactNode;
}

const TalkToAgentLiveKit: React.FC<TalkToAgentLiveKitProps> = ({ children }) => {
  const [details, setDetails] = useState<GAConnectionDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("connecting");
  const [reloadKey, setReloadKey] = useState(0);
  const [roomToken, setRoomToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await fetch("/api/ga-token", { method: "POST" });
        if (!resp.ok) {
          const j = await resp.json().catch(() => ({}));
          throw new Error(j?.error || `Failed to fetch GA token (${resp.status})`);
        }
        const data = (await resp.json()) as GAConnectionDetails;
        if (!mounted) return;
        setDetails(data);
        setRoomToken(data.participantToken);
        setServerUrl(data.serverUrl);
        setRoomName(data.roomName);
        setStatus("connecting");
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Failed to initialize agent chat");
        setStatus("error");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [reloadKey]);

  if (error) {
    return (
      <div className="w-full h-[65vh] flex flex-col items-center justify-center gap-3">
        <div className="text-red-600">{error}</div>
        <button
          className="px-3 py-2 text-sm rounded-md border bg-white hover:bg-gray-50"
          onClick={() => {
            setError(null);
            setDetails(null);
            setStatus("connecting");
            setReloadKey((k) => k + 1);
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="w-full h-[65vh] flex items-center justify-center text-gray-500">
        Connecting to your agent...
      </div>
    );
  }

  return (
    <LiveKitRoom
      key={`${reloadKey}-${roomToken || ''}`}
      token={roomToken || undefined}
      serverUrl={serverUrl || undefined}
      connect={true}
      audio={false}
      video={false}
      className="h-full"
      onConnected={() => setStatus("connected")}
      onDisconnected={() => setStatus("disconnected")}
      onError={() => setStatus("error")}
    >
      {/* Minimal status indicator */}
      <div className="px-3 py-1 text-xs text-gray-500">Status: {status} {roomName ? `(${roomName})` : ""}</div>
      {children}
    </LiveKitRoom>
  );
};

export default TalkToAgentLiveKit;


