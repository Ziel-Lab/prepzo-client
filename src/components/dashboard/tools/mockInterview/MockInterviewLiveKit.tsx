"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  LiveKitRoom,
  useRoomContext,
  useLocalParticipant,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { MediaDeviceFailure, RemoteParticipant, DataPacket_Kind, ConnectionQuality, Track, LocalAudioTrack, RoomEvent } from "livekit-client";
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
  onKrispStatusChange?: (enabled: boolean, pending: boolean) => void;
}> = ({ sessionConfig, onEndInterview, onEndingCountdown, onKrispStatusChange }) => {
  const room = useRoomContext();
  const localParticipant = useLocalParticipant();
  const router = useRouter();
  const { toast } = useToast();
  const [isRpcRegistered, setIsRpcRegistered] = useState(false);
  const [lastAgentActivity, setLastAgentActivity] = useState(Date.now());
  const [krispProcessor, setKrispProcessor] = useState<any>(null);
  const [isKrispEnabled, setIsKrispEnabled] = useState(false);
  const [isKrispPending, setIsKrispPending] = useState(false);
  const [isKrispSupported, setIsKrispSupported] = useState(false);

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

  // Initialize Krisp noise cancellation
  useEffect(() => {
    if (!room || !localParticipant?.localParticipant) return;

    const initializeKrisp = async () => {
      try {
        // Dynamic import to load Krisp only when needed
        const { KrispNoiseFilter, isKrispNoiseFilterSupported } = await import('@livekit/krisp-noise-filter');
        
        if (!isKrispNoiseFilterSupported()) {
          console.warn('Krisp noise filter is not supported on this browser');
          setIsKrispSupported(false);
          return;
        }
        
        setIsKrispSupported(true);
        
        // Listen for local track publications
        const handleLocalTrackPublished = async (trackPublication: any) => {
          if (
            trackPublication.source === Track.Source.Microphone &&
            trackPublication.track instanceof LocalAudioTrack
          ) {
            try {
              setIsKrispPending(true);
              onKrispStatusChange?.(false, true);
              
              console.log('Initializing Krisp noise filter for microphone track');
              const processor = KrispNoiseFilter();
              
              await trackPublication.track.setProcessor(processor);
              await processor.setEnabled(true);
              
              setKrispProcessor(processor);
              setIsKrispEnabled(true);
              setIsKrispPending(false);
              onKrispStatusChange?.(true, false);
              
              toast({
                title: "Noise Cancellation Enabled",
                description: "AI-powered noise cancellation is now active for clearer audio.",
                duration: 3000,
              });
              
              console.log('Krisp noise filter enabled successfully');
            } catch (error) {
              console.error('Failed to enable Krisp noise filter:', error);
              setIsKrispPending(false);
              onKrispStatusChange?.(false, false);
              
              toast({
                title: "Noise Cancellation Warning",
                description: "Could not enable noise cancellation, but audio will still work.",
                variant: "default",
                duration: 3000,
              });
            }
          }
        };
        
        room.on(RoomEvent.LocalTrackPublished, handleLocalTrackPublished);
        
        // Check if microphone track is already published
        const micTrackPub = Array.from(room.localParticipant.audioTrackPublications.values())
          .find(pub => pub.source === Track.Source.Microphone);
        
        if (micTrackPub) {
          await handleLocalTrackPublished(micTrackPub);
        }
        
        return () => {
          room.off(RoomEvent.LocalTrackPublished, handleLocalTrackPublished);
        };
        
      } catch (error) {
        console.error('Failed to initialize Krisp:', error);
        setIsKrispSupported(false);
      }
    };
    
    // Small delay to ensure room is fully connected
    const timeout = setTimeout(initializeKrisp, 1000);
    
    return () => clearTimeout(timeout);
  }, [room, localParticipant, toast, onKrispStatusChange]);

  // Toggle Krisp noise filter
  const toggleKrispFilter = useCallback(async () => {
    if (!krispProcessor || isKrispPending) return;
    
    try {
      setIsKrispPending(true);
      onKrispStatusChange?.(isKrispEnabled, true);
      
      const newState = !isKrispEnabled;
      await krispProcessor.setEnabled(newState);
      
      setIsKrispEnabled(newState);
      setIsKrispPending(false);
      onKrispStatusChange?.(newState, false);
      
      toast({
        title: newState ? "Noise Cancellation Enabled" : "Noise Cancellation Disabled",
        description: newState 
          ? "AI-powered noise cancellation is now active." 
          : "Noise cancellation has been disabled.",
        duration: 2000,
      });
    } catch (error) {
      console.error('Failed to toggle Krisp filter:', error);
      setIsKrispPending(false);
      onKrispStatusChange?.(isKrispEnabled, false);
    }
  }, [krispProcessor, isKrispEnabled, isKrispPending, toast, onKrispStatusChange]);

  // Expose toggle function globally for UI components
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).toggleKrispFilter = toggleKrispFilter;
      (window as any).krispStatus = {
        enabled: isKrispEnabled,
        pending: isKrispPending,
        supported: isKrispSupported
      };
    }
  }, [toggleKrispFilter, isKrispEnabled, isKrispPending, isKrispSupported]);

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
      
      // Cleanup Krisp processor
      if (krispProcessor) {
        try {
          const micTrackPub = Array.from(room?.localParticipant?.audioTrackPublications?.values() || [])
            .find(pub => pub.source === Track.Source.Microphone);
          
          if (micTrackPub?.track) {
            micTrackPub.track.stopProcessor();
          }
        } catch (error) {
          console.error('Error cleaning up Krisp processor:', error);
        }
      }
    };
  }, [localParticipant, isRpcRegistered, krispProcessor, room]);

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
  const [krispStatus, setKrispStatus] = useState({ enabled: false, pending: false });

  console.log(' MockInterviewLiveKit received:', {
    sessionConfig,
    providedConnectionDetails,
    connectionDetails
  });

  // Fetch connection details
  const onConnectButtonClicked = useCallback(async () => {
    try {
      console.error('DEPRECATED: onConnectButtonClicked should not be called');
      console.error(' Connection details should be passed from URL params or SessionCard');
      console.error(' sessionConfig:', sessionConfig);
      
      const response = await fetch("/api/mock-interview-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionConfig),
      });

      if (response.ok) {
        const connectionDetailsData = await response.json();
        console.log(' Fallback token fetch successful:', connectionDetailsData);
        updateConnectionDetails(connectionDetailsData);
      } else {
        console.error(' Fallback token fetch failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error(' Fallback token fetch error:', error);
    }
  }, [sessionConfig]);

  // Extract connection details from URL parameters
  useEffect(() => {
    if (!providedConnectionDetails) {
      console.log('No connection details provided, checking URL params...');
      
      // Try to extract from URL parameters (from SessionCard navigation)
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const serverUrl = urlParams.get('serverUrl');
        const roomName = urlParams.get('roomName');
        const participantToken = urlParams.get('participantToken');
        const participantName = urlParams.get('participantName');
        
        console.log('URL params extracted:', {
          serverUrl: serverUrl ? 'PRESENT' : 'MISSING',
          roomName: roomName ? 'PRESENT' : 'MISSING', 
          participantToken: participantToken ? 'PRESENT' : 'MISSING',
          participantName: participantName ? 'PRESENT' : 'MISSING'
        });
        
        if (serverUrl && roomName && participantToken) {
          const urlConnectionDetails: MockInterviewConnectionDetails = {
            serverUrl,
            roomName,
            participantToken,
            participantName: participantName || 'Participant',
            sessionId: sessionConfig.sessionId || 'unknown',
            userId: 'user', // Placeholder - will be replaced by auth
            userEmail: 'user@example.com', // Placeholder - will be replaced by auth
            userName: participantName || 'Participant'
          };
          
          updateConnectionDetails(urlConnectionDetails);
          return;
        }
      }
      

      onConnectButtonClicked();
    } else {
      console.log(' Using provided connection details:', providedConnectionDetails);
    }
  }, [onConnectButtonClicked, providedConnectionDetails]);

  const handleInterviewEnd = () => {
    onEndInterview();
  };

  const handleKrispStatusChange = useCallback((enabled: boolean, pending: boolean) => {
    setKrispStatus({ enabled, pending });
  }, []);

  // Validate connection details before rendering LiveKitRoom
  const validateConnectionDetails = (details: any) => {
    console.log(' Validating connection details:', details);
    
    if (!details) {
      console.error(' No connection details provided');
      return false;
    }
    
    const required = ['participantToken', 'serverUrl'];
    const missing = required.filter(field => !details[field]);
    
    if (missing.length > 0) {
      console.error(' Missing required fields:', missing);
      console.error(' Provided fields:', Object.keys(details));
      return false;
    }
    
    console.log(' Connection details validation passed');
    return true;
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
          ) : !validateConnectionDetails(connectionDetails) ? (
            <div className="flex h-full w-full items-center justify-center">
              <div className="text-center">
                <h2 className="text-xl font-bold text-red-600 mb-4">Connection Error</h2>
                <p className="text-gray-600 mb-4">Unable to connect to interview room.</p>
                <p className="text-sm text-gray-500">Check console for details.</p>
              </div>
            </div>
          ) : (
            <LiveKitRoom
              key={roomKey}
              token={connectionDetails.participantToken}
              serverUrl={connectionDetails.serverUrl}
              connect={true}
              audio={true}
              video={true}
              onError={(error) => {
                console.error('LiveKit connection error:', error);
                console.error('Connection details used:', {
                  serverUrl: connectionDetails.serverUrl,
                  roomName: connectionDetails.roomName || 'NOT_PROVIDED',
                  hasToken: !!connectionDetails.participantToken,
                  tokenLength: connectionDetails.participantToken?.length || 0
                });
              }}
              onDisconnected={(reason) => {
                console.log('LiveKit disconnected:', reason);
              }}
              onConnected={() => {
                console.log(' LiveKit connected successfully!');
                console.log(' Room info:', {
                  serverUrl: connectionDetails.serverUrl,
                  roomName: connectionDetails.roomName || 'NOT_PROVIDED'
                });
              }}
              className="flex h-full w-full flex-col"
            >
              {/* Register RPC handler - CRITICAL for agent communication */}
              {/* Method: 'end_interview' - Must match backend agent exactly */}
              <RpcHandler
                sessionConfig={sessionConfig}
                onEndInterview={handleInterviewEnd}
                onEndingCountdown={() => {}} // Not used in this simplified setup
                onKrispStatusChange={handleKrispStatusChange}
              />
              
              <MockInterviewVoiceAssistant
                sessionConfig={sessionConfig}
                connectionDetails={connectionDetails}
                onEndInterview={handleInterviewEnd}
                krispStatus={krispStatus}
              />
            </LiveKitRoom>
          )}
        </MockInterviewErrorBoundary>
      </div>
    </div>
  );
};

export default MockInterviewLiveKit; 