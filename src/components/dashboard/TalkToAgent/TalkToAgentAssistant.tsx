"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import LiveTranscript from "@/components/dashboard/tools/mockInterview/sessions/LiveTranscript";
import type { Participant, RemoteParticipant } from "livekit-client";

type TranscriptMessage = {
  id: string;
  type: "agent" | "user";
  content: string;
  timestamp: Date;
};

interface TalkToAgentAssistantProps {
  onExit?: () => void;
}

const TalkToAgentAssistant: React.FC<TalkToAgentAssistantProps> = ({ onExit }) => {
  const room = useRoomContext();
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [agentPresent, setAgentPresent] = useState(false);
  const isConnected = (room as any)?.state === "connected";

  useEffect(() => {
    if (!room) return;

    // 1) Voice transcription stream (preferred): lk.transcription
    const roomAny: any = room as any;
    const unsubs: Array<() => void> = [];
    if (roomAny && typeof roomAny.registerTextStreamHandler === "function") {
      try {
        const unsub = roomAny.registerTextStreamHandler(
          "lk.transcription",
          async (reader: any, participantInfo: any) => {
            try {
              // Option 1: accumulate all text when the stream finishes
              const fullText = await reader.readAll();
              if (!fullText) return;
              setMessages((prev) => [
                ...prev,
                {
                  id: `agent-transcript-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                  type: "agent",
                  content: String(fullText),
                  timestamp: new Date(),
                },
              ]);
            } catch {
              // Option 2: incremental (best-effort)
              try {
                const chunks: string[] = [];
                for await (const chunk of reader) {
                  chunks.push(String(chunk));
                }
                const combined = chunks.join("");
                if (combined) {
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: `agent-transcript-inc-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                      type: "agent",
                      content: combined,
                      timestamp: new Date(),
                    },
                  ]);
                }
              } catch {}
            }
          }
        );
        if (typeof unsub === "function") unsubs.push(unsub);
      } catch {
        // ignore and rely on fallback
      }

      // Also handle assistant chat replies as text streams on 'lk.agent'
      try {
        const unsubAgent = roomAny.registerTextStreamHandler(
          "lk.agent",
          async (reader: any) => {
            try {
              const fullText = await reader.readAll();
              if (!fullText) return;
              setMessages((prev) => [
                ...prev,
                {
                  id: `agent-chat-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                  type: "agent",
                  content: String(fullText),
                  timestamp: new Date(),
                },
              ]);
            } catch {}
          }
        );
        if (typeof unsubAgent === "function") unsubs.push(unsubAgent);
      } catch {}

      // Some agents may publish text replies on 'lk.chat' as a text stream; handle that too
      try {
        const unsubChat = roomAny.registerTextStreamHandler(
          "lk.chat",
          async (reader: any, participantInfo: any) => {
            try {
              // Ignore our own messages on lk.chat
              if (
                participantInfo?.identity &&
                room?.localParticipant?.identity &&
                participantInfo.identity === room.localParticipant.identity
              ) {
                return;
              }
              const fullText = await reader.readAll();
              if (!fullText) return;
              setMessages((prev) => [
                ...prev,
                {
                  id: `agent-chat2-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                  type: "agent",
                  content: String(fullText),
                  timestamp: new Date(),
                },
              ]);
            } catch {}
          }
        );
        if (typeof unsubChat === "function") unsubs.push(unsubChat);
      } catch {}
    }

    // Fallback: if text stream isn't available, listen to data packets with topic 'lk.transcription'
    const handleTranscriptionFallback = (
      payload: Uint8Array,
      _p?: Participant,
      _k?: any,
      topic?: string
    ) => {
      if (topic !== "lk.transcription") return;
      try {
        const text = new TextDecoder().decode(payload);
        let content = text;
        try {
          const parsed = JSON.parse(text);
          content = parsed?.text || parsed?.message || text;
        } catch {}
        setMessages((prev) => [
          ...prev,
          {
            id: `agent-transcript-fb-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            type: "agent",
            content,
            timestamp: new Date(),
          },
        ]);
      } catch {}
    };
    room.on("dataReceived", handleTranscriptionFallback);

    // 2) Assistant replies in chat mode: topic 'lk.agent' with JSON { type: 'agent', text }
    const handleAgentReply = (
      payload: Uint8Array,
      _p?: Participant,
      _k?: any,
      topic?: string
    ) => {
      if (topic !== "lk.agent") return;
      try {
        const text = new TextDecoder().decode(payload);
        const parsed = JSON.parse(text);
        const agentText: string | undefined = parsed?.text;
        if (!agentText) return;
        setMessages((prev) => [
          ...prev,
          {
            id: `agent-reply-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            type: "agent",
            content: String(agentText),
            timestamp: new Date(),
          },
        ]);
      } catch {}
    };
    room.on("dataReceived", handleAgentReply);

    // Some agents may send data replies on 'lk.chat' as well; treat remote senders as agent
    const handleAgentReplyOnChat = (
      payload: Uint8Array,
      p?: Participant,
      _k?: any,
      topic?: string
    ) => {
      if (topic !== "lk.chat") return;
      try {
        // Ensure it's not from the local participant
        if (p && room && p.identity === room.localParticipant.identity) return;
        const text = new TextDecoder().decode(payload);
        let agentText: string | undefined;
        try {
          const parsed = JSON.parse(text);
          agentText = parsed?.text || parsed?.message || undefined;
        } catch {
          agentText = text;
        }
        if (!agentText) return;
        setMessages((prev) => [
          ...prev,
          {
            id: `agent-reply-chat-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            type: "agent",
            content: String(agentText),
            timestamp: new Date(),
          },
        ]);
      } catch {}
    };
    room.on("dataReceived", handleAgentReplyOnChat);
    const handleParticipantConnected = (p: RemoteParticipant) => {
      const id = p.identity || "";
      if (id.includes("agent") || id.includes("assistant") || id.includes("general")) {
        setAgentPresent(true);
      }
    };
    const handleParticipantDisconnected = (p: RemoteParticipant) => {
      const id = p.identity || "";
      if (id.includes("agent") || id.includes("assistant") || id.includes("general")) {
        setAgentPresent(false);
      }
    };
    room.on("participantConnected", handleParticipantConnected);
    room.on("participantDisconnected", handleParticipantDisconnected);

    // Initialize presence from current participants
    const anyAgent = Array.from(room.remoteParticipants.values()).some((p) => {
      const id = p.identity || "";
      return id.includes("agent") || id.includes("assistant") || id.includes("general");
    });
    setAgentPresent(anyAgent);

    return () => {
      // Unregister text stream handlers if provided by SDK
      for (const u of unsubs) {
        try { u(); } catch {}
      }
      room.off("dataReceived", handleTranscriptionFallback);
      room.off("dataReceived", handleAgentReply);
      room.off("dataReceived", handleAgentReplyOnChat);
      room.off("participantConnected", handleParticipantConnected);
      room.off("participantDisconnected", handleParticipantDisconnected);
    };
  }, [room]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || !room || !isConnected) {
      if (!isConnected) {
        console.warn("LiveKit: cannot send, room not connected yet");
      }
      return;
    }
    setSending(true);
    try {
      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          type: "user",
          content: trimmed,
          timestamp: new Date(),
        },
      ]);
      // REQUIRED: send text as a text stream on topic 'lk.chat'
      const lp: any = room.localParticipant as any;
      if (!lp || typeof lp.sendText !== "function") {
        console.error("LiveKit: sendText API not available on localParticipant. Update SDK.");
        throw new Error("sendText unavailable");
      }
      console.debug("LiveKit: sendText -> lk.chat", { text: trimmed });
      await lp.sendText(trimmed, { topic: "lk.chat" });
      setInput("");
    } catch {
      try {
        // As last resort, attempt data packet (backend may ignore)
        const payload = JSON.stringify({ text: trimmed });
        console.debug("LiveKit: fallback publishData -> lk.chat", { text: trimmed });
        await room.localParticipant.publishData(new TextEncoder().encode(payload), {
          topic: "lk.chat",
          reliable: true,
        });
        setInput("");
      } catch (e) {
        console.error("LiveKit: publishData fallback failed", e);
      }
    } finally {
      setSending(false);
    }
  }, [input, room]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 p-4">
        {!agentPresent && (
          <div className="mb-2 text-xs text-gray-500">Waiting for agent to join…</div>
        )}
        <LiveTranscript messages={messages} />
      </div>
      <div className="border-t p-3 flex gap-2">
        <Input
          value={input}
          placeholder="Type your message..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button onClick={sendMessage} disabled={sending || !input.trim()}>
          Send
        </Button>
        <Button
          variant="secondary"
          onClick={async () => {
            try {
              const roomName = room?.name;
              if (room) await room.disconnect();
              if (roomName) {
                // ask server to end the room (disconnect agent and others)
                fetch("/api/ga-end-session", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ roomName }),
                }).catch(() => {});
              }
              onExit?.();
            } catch {
              onExit?.();
            }
          }}
        >
          End Session
        </Button>
      </div>
    </div>
  );
};

export default TalkToAgentAssistant;


