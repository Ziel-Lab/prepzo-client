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

  // Helper functions following the exact specification
  const showInterviewEndMessage = useCallback((reason: string) => {
    // Show a user-friendly message about why the interview ended
    const messages: { [key: string]: string } = {
      'User requested to end': 'Interview ended as requested.',
      'Interview completed successfully': 'Interview completed! Generating your feedback...',
      'timeout - session duration limit reached': 'Interview time limit reached.'
    };
    
    const message = messages[reason] || 'Interview has ended.';
    
    console.log('📢 Showing interview end message:', message);
    
    // Show this in your UI (toast, modal, etc.)
    toast({
      title: "Interview Ended",
      description: message,
      duration: 5000,
    });
  }, [toast]);

  const cleanupInterview = useCallback(() => {
    // Stop recording, cleanup local streams, etc.
    console.log('🧹 Cleaning up interview...');
    
    if (room?.localParticipant) {
      // Stop audio track if available
      const audioTrack = room.localParticipant.audioTrackPublications.values().next().value?.track;
      if (audioTrack) {
        audioTrack.stop();
      }
      
      // Stop video track if available  
      const videoTrack = room.localParticipant.videoTrackPublications.values().next().value?.track;
      if (videoTrack) {
        videoTrack.stop();
      }
    }
    
    // Any other cleanup needed
  }, [room]);

  const redirectToResults = useCallback((sessionId: string, attemptId: string) => {
    // Redirect to results/feedback page
    console.log(`🔀 Redirecting to results: /dashboard/tools/mock-Interview`);
    
    setTimeout(() => {
      window.location.href = `/dashboard/tools/mock-Interview`;
    }, 2000); // Give 2 seconds for user to see the message
  }, []);



  // Test function for manually triggering the RPC handler
  const testRPC = useCallback(() => {
    if (!room?.localParticipant) {
      console.error('Room or participant not available for testing');
      return;
    }

    const testPayload = {
      payload: JSON.stringify({
        reason: "Test end",
        timestamp: new Date().toISOString(),
        session_id: "test-session",
        attempt_id: "test-attempt"
      })
    };
    
    console.log('Testing RPC with payload:', testPayload);
    
    try {
      // Manually call your RPC handler for testing
      const handler = (room.localParticipant as any)._rpcMethods?.get?.('forceEndInterview') ||
                     (room.localParticipant as any).registeredRpcMethods?.['forceEndInterview'];
      
      if (handler) {
        const response = handler(testPayload);
        console.log('Test RPC response:', response);
      } else {
        console.error('RPC method not found');
        console.log('Available methods:', Object.keys((room.localParticipant as any).registeredRpcMethods || {}));
      }
    } catch (error) {
      console.error('Error testing RPC:', error);
    }
  }, [room]);

  // Make test function globally accessible
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).testRPC = testRPC;
      console.log('Test function available: window.testRPC()');
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).testRPC;
      }
    };
  }, [testRPC]);

  // Register RPC method when room and participant are available
  useEffect(() => {
    if (room && localParticipant?.localParticipant && room.state === 'connected' && !isRpcRegistered) {
      console.log('🔧 Registering RPC method forceEndInterview...');
      
      try {
        // Register the RPC method BEFORE connecting to the room
        localParticipant.localParticipant.registerRpcMethod('forceEndInterview', async (data: any) => {
          console.log('Received forceEndInterview RPC:', data);
          
          try {
            const payload = JSON.parse(data.payload);
            const { reason, timestamp, session_id, attempt_id } = payload;
            
            console.log(`Interview ending: ${reason} at ${timestamp}`);
            
            // Show user-friendly message
            showInterviewEndMessage(reason);
            
            // Cleanup and redirect
            cleanupInterview();
            redirectToResults(session_id, attempt_id);
            
            // Return success response to agent
            return 'received';
            
          } catch (error) {
            console.error('Error handling forceEndInterview RPC:', error);
            return 'error';
          }
        });
        
        setIsRpcRegistered(true);
        console.log('✅ RPC method forceEndInterview registered successfully');
        
      } catch (error) {
        console.error('❌ Failed to register RPC method:', error);
      }
    }
  }, [room, localParticipant, isRpcRegistered, showInterviewEndMessage, cleanupInterview, redirectToResults]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localParticipant?.localParticipant && isRpcRegistered) {
        try {
          localParticipant.localParticipant.unregisterRpcMethod('forceEndInterview');
          console.log('🔧 RPC method forceEndInterview unregistered');
        } catch (error) {
          console.error('🔧 Error unregistering RPC method:', error);
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
              {/* Register RPC handler - CRITICAL for agent communication */}
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