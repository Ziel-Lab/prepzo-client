"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  LiveKitRoom,
  useRoomContext,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { MediaDeviceFailure, RemoteParticipant, DataPacket_Kind, ConnectionQuality } from "livekit-client";
import type { MockInterviewConnectionDetails } from "@/app/api/mock-interview-token/route";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import MockInterviewVoiceAssistant from "./MockInterviewVoiceAssistant";

class MockInterviewErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: false }; // Always continue, don't show error
  }

  componentDidCatch(error: Error) {
    console.error("Mock Interview error (silently handled):", error);
    // Don't show any error UI, just log and continue
  }

  render() {
    return this.props.children; // Always render children, never show error UI
  }
}

interface MockInterviewLiveKitProps {
  sessionConfig: {
    sessionId?: string;
    interviewType: string;
    position: string;
    difficulty: string;
    duration: number;
  };
  onEndInterview: () => void;
  connectionDetails?: MockInterviewConnectionDetails;
}

const MockInterviewLiveKit: React.FC<MockInterviewLiveKitProps> = ({ 
  sessionConfig, 
  onEndInterview,
  connectionDetails: providedConnectionDetails 
}) => {
  const router = useRouter();
  const [connectionDetails, updateConnectionDetails] = useState<MockInterviewConnectionDetails | undefined>(providedConnectionDetails);
  const [roomKey, setRoomKey] = useState(Date.now());

  // Simple function to fetch connection details without error handling
  const onConnectButtonClicked = useCallback(async () => {
    try {
      const response = await fetch("/api/mock-interview-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionConfig),
      });

      if (response.ok) {
        const connectionDetailsData = await response.json();
        updateConnectionDetails(connectionDetailsData);
      }
    } catch (error) {
      console.error("Connection error (silently handled):", error);
      // Continue without showing error
    }
  }, [sessionConfig]);

  // Get connection details on mount (only if not provided)
  useEffect(() => {
    if (!providedConnectionDetails) {
      onConnectButtonClicked();
    }
  }, [onConnectButtonClicked, providedConnectionDetails]);

  const handleInterviewEnd = () => {
    onEndInterview();
  };

  return (
    <div className="relative h-full w-full">
      <div className="flex h-full w-full flex-col justify-between">
        <MockInterviewErrorBoundary>
          {!connectionDetails ? (
            <MockInterviewVoiceAssistant
              sessionConfig={sessionConfig}
              connectionDetails={null}
              onEndInterview={handleInterviewEnd}
            />
          ) : (
            <LiveKitRoom
              key={roomKey}
              token={connectionDetails.participantToken}
              serverUrl={connectionDetails.serverUrl}
              connect={true}
              audio={true}
              video={false}
              onError={(error) => {
                console.error("LiveKit error (silently handled):", error);
              }}
              onDisconnected={() => {
                console.log("LiveKit room disconnected");
              }}
              onConnected={() => {
                console.log("LiveKit room connected successfully");
              }}
              className="flex h-full w-full flex-col"
            >
              <MockInterviewVoiceAssistant
                sessionConfig={sessionConfig}
                connectionDetails={connectionDetails}
                onEndInterview={handleInterviewEnd}
              />
            </LiveKitRoom>
          )}
        </MockInterviewErrorBoundary>
      </div>
    </div>
  );
};

export default MockInterviewLiveKit; 