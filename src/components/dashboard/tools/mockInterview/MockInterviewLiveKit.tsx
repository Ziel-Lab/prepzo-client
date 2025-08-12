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
  const [lastAgentActivity, setLastAgentActivity] = useState(Date.now());

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

  // Navigation helper with proper cleanup
  const navigateToSessionsPage = useCallback(async (delay: number = 2000) => {
    try {
      // Ensure room cleanup before navigation
      await cleanupInterview();
      await disconnectRoom();
      
      setTimeout(() => {
        router.push('/dashboard/tools/mock-Interview');
      }, delay);
    } catch (error) {
      // Fallback navigation even if cleanup fails
      setTimeout(() => {
        router.push('/dashboard/tools/mock-Interview');
      }, delay);
    }
  }, [router, cleanupInterview, disconnectRoom]);

  // Handler functions for different end reasons
  const handleAgentDisconnected = useCallback(async (payload: any) => {
    toast({
      title: "AI Interviewer Disconnected",
      description: "The AI interviewer has left the session. Your responses have been saved.",
      duration: 6000,
    });
    
    await navigateToSessionsPage(3000);
  }, [toast, navigateToSessionsPage]);

  const handleTimeout = useCallback(async (payload: any) => {
    toast({
      title: "Interview Time Limit Reached",
      description: "The interview has ended due to the 12-minute time limit.",
      duration: 6000,
    });
    
    await navigateToSessionsPage(3000);
  }, [toast, navigateToSessionsPage]);

  const handleConnectionLost = useCallback(async (payload: any) => {
    toast({
      title: "Connection Lost",
      description: "The interview ended due to connection issues. You can start a new attempt.",
      duration: 8000,
    });
    
    await navigateToSessionsPage(4000);
  }, [toast, navigateToSessionsPage]);

  const handleEmergency = useCallback(async (payload: any) => {
    toast({
      title: "Interview Session Error",
      description: "An unexpected error occurred. Please try starting a new interview.",
      duration: 8000,
    });
    
    await navigateToSessionsPage(4000);
  }, [toast, navigateToSessionsPage]);

  const handleNormalCompletion = useCallback(async (payload: any) => {
    toast({
      title: "Interview Completed",
      description: "Your interview has been completed successfully. Generating feedback...",
      duration: 5000,
    });
    
    await navigateToSessionsPage(2000);
  }, [toast, navigateToSessionsPage]);

  // Main RPC handler for end_interview
  const endInterviewRpcHandler = useCallback(async (data: any) => {
    let handlerSuccess = false;
    let sessionId = 'unknown';
    let attemptId = 'unknown';
    
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

      sessionId = session_id || 'unknown';
      attemptId = attempt_id || 'unknown';

      // Validate RPC type
      if (rpc_type !== 'end_interview') {
        return JSON.stringify({
          status: 'error',
          message: `Invalid RPC type: ${rpc_type}`,
          timestamp: new Date().toISOString(),
          session_id: sessionId,
          attempt_id: attemptId,
          handler_success: false
        });
      }

      // Process different end reasons with specific handlers
      try {
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
        handlerSuccess = true;
      } catch (handlerError) {
        // Even if handler fails, we still want to cleanup and respond
        handlerSuccess = false;
      }
      
      // Return immediate success response to backend
      // Cleanup and navigation happen asynchronously
      return JSON.stringify({
        status: 'success',
        message: `Interview end request processed: ${reason}`,
        timestamp: new Date().toISOString(),
        session_id: sessionId,
        attempt_id: attemptId,
        handler_success: handlerSuccess
      });
      
    } catch (error) {
      // Extract session info if possible
      try {
        const payload = JSON.parse(data.payload);
        sessionId = payload.session_id || sessionId;
        attemptId = payload.attempt_id || attemptId;
      } catch (parseError) {
        // Silent parsing error
      }
      
      // Fallback navigation on any error
      try {
        toast({
          title: "Interview Session Ended",
          description: "The interview has ended unexpectedly. Returning to sessions page.",
          duration: 5000,
        });
        await navigateToSessionsPage(2000);
      } catch (fallbackError) {
        // Last resort: direct navigation
        setTimeout(() => {
          router.push('/dashboard/tools/mock-Interview');
        }, 2000);
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
  }, [handleAgentDisconnected, handleTimeout, handleConnectionLost, handleEmergency, handleNormalCompletion, toast, navigateToSessionsPage, router]);



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
        // If RPC registration fails, we rely on participant disconnect fallback
        console.warn('RPC registration failed, using fallback detection');
      }
    }
  }, [room, localParticipant, isRpcRegistered, endInterviewRpcHandler]);

  // Fallback: Listen for AI participant disconnect (when RPC fails)
  useEffect(() => {
    if (!room) return;

    const handleParticipantDisconnected = (participant: any) => {
      // Check if this is the AI interviewer/agent
      if (participant.identity && 
          (participant.identity.includes('agent') || 
           participant.identity.includes('assistant') || 
           participant.identity.includes('mock_interview_agent'))) {
        
        // Show toast and redirect (fallback when no RPC is received)
        toast({
          title: "AI Interviewer Disconnected",
          description: "The AI interviewer has left the session. Redirecting you back...",
          duration: 5000,
        });

        // Redirect after a short delay
        setTimeout(async () => {
          try {
            await cleanupInterview();
            await disconnectRoom();
          } catch (error) {
            // Silent cleanup error
          } finally {
            router.push('/dashboard/tools/mock-Interview');
          }
        }, 3000);
      }
    };

    room.on('participantDisconnected', handleParticipantDisconnected);

    return () => {
      room.off('participantDisconnected', handleParticipantDisconnected);
    };
  }, [room, toast, cleanupInterview, disconnectRoom, router]);

  // Emergency timeout fallback - if no activity for 30 seconds after room connection
  useEffect(() => {
    if (!room || room.state !== 'connected') return;

    const checkActivityTimeout = setInterval(() => {
      const timeSinceActivity = Date.now() - lastAgentActivity;
      
      // If no agent activity for 30 seconds and no remote participants
      if (timeSinceActivity > 30000 && room.remoteParticipants.size === 0) {
        toast({
          title: "Interview Session Timeout",
          description: "No interviewer activity detected. Returning to sessions page.",
          duration: 4000,
        });

        setTimeout(async () => {
          try {
            await cleanupInterview();
            await disconnectRoom();
          } catch (error) {
            // Silent cleanup error
          } finally {
            router.push('/dashboard/tools/mock-Interview');
          }
        }, 2000);

        clearInterval(checkActivityTimeout);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(checkActivityTimeout);
  }, [room, lastAgentActivity, toast, cleanupInterview, disconnectRoom, router]);

  // Track agent activity
  useEffect(() => {
    if (!room) return;

    const handleParticipantConnected = (participant: any) => {
      if (participant.identity && 
          (participant.identity.includes('agent') || 
           participant.identity.includes('assistant') || 
           participant.identity.includes('mock_interview_agent'))) {
        setLastAgentActivity(Date.now());
      }
    };

    const handleDataReceived = () => {
      setLastAgentActivity(Date.now());
    };

    room.on('participantConnected', handleParticipantConnected);
    room.on('dataReceived', handleDataReceived);

    return () => {
      room.off('participantConnected', handleParticipantConnected);
      room.off('dataReceived', handleDataReceived);
    };
  }, [room]);

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