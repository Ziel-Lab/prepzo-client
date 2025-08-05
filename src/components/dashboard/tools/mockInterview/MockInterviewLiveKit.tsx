"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  LiveKitRoom,
  useRoomContext,
  useLocalParticipant,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { MediaDeviceFailure, RemoteParticipant, DataPacket_Kind, ConnectionQuality } from "livekit-client";
import type { MockInterviewConnectionDetails } from "@/app/api/mock-interview-token/route";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import MockInterviewVoiceAssistant from "./MockInterviewVoiceAssistant";

// RPC payload interface from LiveKit agent
interface ForceEndInterviewPayload {
  reason: string;           // "Interview completed" or "timeout - session duration limit reached"
  timestamp: string;        // ISO timestamp
  session_id: string;       // Mock interview session ID
  attempt_id: string;       // Attempt ID
}

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
    // Silent error handling - don't show any error UI, just continue
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

// Component that handles RPC registration inside the room
const RpcHandler: React.FC<{
  sessionConfig: any;
  onEndInterview: () => void;
  onEndingCountdown: (countdown: number | null) => void;
}> = ({ sessionConfig, onEndInterview, onEndingCountdown }) => {
  const room = useRoomContext();
  const localParticipant = useLocalParticipant();
  const router = useRouter();
  const { toast } = useToast();
  const [isRpcRegistered, setIsRpcRegistered] = useState(false);

  // Handler functions for different end reasons
  const handleAgentDisconnected = useCallback(async (payload: any) => {
    toast({
      title: "AI Interviewer Disconnected",
      description: "The AI interviewer has left the session. Your responses have been saved.",
      duration: 8000,
    });
    
    setTimeout(() => {
      window.location.href = `/dashboard/tools/mock-Interview`;
    }, 3000);
  }, [toast]);

  const handleTimeout = useCallback(async (payload: any) => {
    toast({
      title: "Interview Time Limit Reached",
      description: "The interview has ended due to the 12-minute time limit.",
      duration: 8000,
    });
    
    setTimeout(() => {
      window.location.href = `/dashboard/tools/mock-Interview`;
    }, 3000);
  }, [toast]);

  const handleConnectionLost = useCallback(async (payload: any) => {
    toast({
      title: "Connection Lost",
      description: "The interview ended due to connection issues. You can start a new attempt.",
      duration: 10000,
    });
    
    setTimeout(() => {
      window.location.href = `/dashboard/tools/mock-Interview`;
    }, 4000);
  }, [toast]);

  const handleEmergency = useCallback(async (payload: any) => {
    toast({
      title: "Interview Session Error",
      description: "An unexpected error occurred. Please try starting a new interview.",
      duration: 10000,
    });
    
    setTimeout(() => {
      window.location.href = `/dashboard/tools/mock-Interview`;
    }, 4000);
  }, [toast]);

  const handleNormalCompletion = useCallback(async (payload: any) => {
    toast({
      title: "Interview Completed",
      description: "Your interview has been completed successfully. Generating feedback...",
      duration: 5000,
    });
    
    setTimeout(() => {
      window.location.href = `/dashboard/tools/mock-Interview`;
    }, 2000);
  }, [toast]);

  const cleanupInterview = useCallback(async () => {
    if (room?.localParticipant) {
      const audioTrack = room.localParticipant.audioTrackPublications.values().next().value?.track;
      if (audioTrack) {
        audioTrack.stop();
      }
      
      const videoTrack = room.localParticipant.videoTrackPublications.values().next().value?.track;
      if (videoTrack) {
        videoTrack.stop();
      }
    }
  }, [room]);

  const disconnectRoom = useCallback(async () => {
    if (room && room.state === 'connected') {
      try {
        await room.disconnect();
      } catch (error) {
        throw error;
      }
    }
  }, [room]);

  // Main RPC handler for end_interview
  const endInterviewRpcHandler = useCallback(async (data: any) => {
    try {
      const payload = JSON.parse(data.payload);
      const { 
        reason, 
        session_id, 
        attempt_id, 
        requires_confirmation, 
        rpc_type, 
        timestamp 
      } = payload;

      // Validate RPC type
      if (rpc_type !== 'end_interview') {
        return JSON.stringify({
          status: 'error',
          message: `Invalid RPC type: ${rpc_type}`,
          timestamp: new Date().toISOString(),
          session_id,
          attempt_id,
          handler_success: false
        });
      }

      // Process different end reasons
      if (reason.includes('agent_disconnected')) {
        await handleAgentDisconnected(payload);
      } else if (reason.includes('timeout')) {
        await handleTimeout(payload);
      } else if (reason.includes('connection lost')) {
        await handleConnectionLost(payload);
      } else if (reason.includes('emergency')) {
        await handleEmergency(payload);
      } else {
        await handleNormalCompletion(payload);
      }

      // Cleanup interview resources
      await cleanupInterview();
      
      // Disconnect from LiveKit room (CRITICAL)
      await disconnectRoom();
      
      // Return success confirmation
      return JSON.stringify({
        status: 'success',
        message: `Interview ended successfully: ${reason}`,
        timestamp: new Date().toISOString(),
        session_id,
        attempt_id,
        handler_success: true
      });
      
    } catch (error) {
      // Extract session info if possible
      let sessionId = 'unknown';
      let attemptId = 'unknown';
      try {
        const payload = JSON.parse(data.payload);
        sessionId = payload.session_id || 'unknown';
        attemptId = payload.attempt_id || 'unknown';
      } catch (parseError) {
        // Silent parsing error
      }
      
      // Still try to disconnect room even on error
      try {
        await disconnectRoom();
      } catch (disconnectError) {
        // Silent disconnect error
      }
      
      // Return error response
      return JSON.stringify({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error in RPC handler',
        timestamp: new Date().toISOString(),
        session_id: sessionId,
        attempt_id: attemptId,
        handler_success: false
      });
    }
  }, [handleAgentDisconnected, handleTimeout, handleConnectionLost, handleEmergency, handleNormalCompletion, cleanupInterview, disconnectRoom]);



  // Register RPC method BEFORE room connection (CRITICAL requirement)
  useEffect(() => {
    if (room && localParticipant?.localParticipant && !isRpcRegistered) {
      try {
        // CRITICAL: Use exact method name 'end_interview'
        localParticipant.localParticipant.registerRpcMethod(
          'end_interview',
          async (data) => endInterviewRpcHandler(data)
        );
        setIsRpcRegistered(true);
      } catch (error) {
        // Silent fail - will retry on next render
      }
    }
  }, [room, localParticipant, isRpcRegistered, endInterviewRpcHandler]);



  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localParticipant?.localParticipant && isRpcRegistered) {
        try {
          localParticipant.localParticipant.unregisterRpcMethod('end_interview');
        } catch (error) {
          // Silent cleanup error
        }
      }
    };
  }, [localParticipant, isRpcRegistered]);

  return null; // This component only handles RPC registration
};



const MockInterviewLiveKit: React.FC<MockInterviewLiveKitProps> = ({ 
  sessionConfig, 
  onEndInterview,
  connectionDetails: providedConnectionDetails 
}) => {
  const router = useRouter();
  const [connectionDetails, updateConnectionDetails] = useState<MockInterviewConnectionDetails | undefined>(providedConnectionDetails);
  const [roomKey, setRoomKey] = useState(Date.now());

  // Fetch connection details
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
      // Silent error handling
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
                // Silent error handling
              }}
              onDisconnected={() => {
                // Silent disconnect handling
              }}
              onConnected={() => {
                // Silent connection handling
              }}
              className="flex h-full w-full flex-col"
            >
              {/* Register RPC handler - CRITICAL for agent communication */}
              {/* Method: 'end_interview' - Must match backend agent exactly */}
              <RpcHandler
                sessionConfig={sessionConfig}
                onEndInterview={handleInterviewEnd}
                onEndingCountdown={() => {}} // Not used in this simplified setup
              />
              
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