"use client";

import {
  useVoiceAssistant,
  useTrackTranscription,
  useLocalParticipant,
  useRemoteParticipants,
  useRoomContext,
  AgentState,
  AudioTrack,
  ParticipantTile,
} from "@livekit/components-react";
import { Track, TrackPublication, Participant, RemoteParticipant } from "livekit-client";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera, Mic, MicOff } from "lucide-react";
import AnimatedOrb from "@/components/dashboard/tools/mockInterview/sessions/AnimatedOrb";
import LiveTranscript from "@/components/dashboard/tools/mockInterview/sessions/LiveTranscript";
import type { MockInterviewConnectionDetails } from "@/app/api/mock-interview-token/route";
import { useToast } from "@/components/ui/use-toast";

// Custom hook to safely use voice assistant with enhanced error handling
function useSafeVoiceAssistant() {
  try {
    return useVoiceAssistant();
  } catch (error) {
    console.error("Error in useVoiceAssistant:", error);
    return {
      state: "connecting" as AgentState,
      agentTranscriptions: [],
      audioTrack: null,
    };
  }
}

interface MockInterviewVoiceAssistantProps {
  sessionConfig: {
    sessionId?: string;
    interviewType: string;
    position: string;
    difficulty: string;
    duration: number;
  };
  connectionDetails: MockInterviewConnectionDetails | null;
  onEndInterview: () => void;
}

export interface InterviewTranscriptionMessage {
  id: string;
  type: "agent" | "user";
  content: string;
  timestamp: Date;
}

// Helper function to format interview type for display
const formatInterviewType = (type: string) => {
  switch (type) {
    case 'behavioral':
      return 'Behavioral';
    case 'technical':
      return 'Technical';
    case 'system_design':
      return 'System Design';
    case 'case_study':
      return 'Case Study';
    case 'leadership':
      return 'Leadership';
    case 'sales':
      return 'Sales';
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
};

// Component for when LiveKit is connected
const ConnectedVoiceAssistant: React.FC<MockInterviewVoiceAssistantProps> = ({ 
  sessionConfig,
  connectionDetails,
  onEndInterview
}) => {
  const { state, agentTranscriptions, audioTrack } = useSafeVoiceAssistant();
  const remoteParticipants = useRemoteParticipants();
  const localParticipant = useLocalParticipant();
  const room = useRoomContext();
  
  // Debug logging for room and participant states
  useEffect(() => {
    console.log('🏠 Room context:', {
      roomName: room?.name,
      roomState: room?.state,
      localParticipantIdentity: localParticipant?.localParticipant?.identity,
      remoteParticipantCount: remoteParticipants.length,
      remoteParticipants: remoteParticipants.map(p => p.identity)
    });
  }, [room, localParticipant, remoteParticipants]);

  // Listen for participant changes to detect agent joining/leaving
  useEffect(() => {
    if (room) {
      const handleParticipantConnected = (participant: RemoteParticipant) => {
        console.log('👥 Participant connected:', participant.identity);
        if (participant.identity?.includes('agent') || participant.identity?.includes('assistant')) {
          console.log('🤖 Agent/Assistant joined the room!');
        }
      };

      const handleParticipantDisconnected = (participant: RemoteParticipant) => {
        console.log('👥 Participant disconnected:', participant.identity);
        if (participant.identity?.includes('agent') || participant.identity?.includes('assistant')) {
          console.log('🤖 Agent/Assistant left the room!');
        }
      };

      room.on('participantConnected', handleParticipantConnected);
      room.on('participantDisconnected', handleParticipantDisconnected);

      return () => {
        room.off('participantConnected', handleParticipantConnected);
        room.off('participantDisconnected', handleParticipantDisconnected);
      };
    }
  }, [room]);
  const { toast } = useToast();
  const [isTranscriptVisible, setIsTranscriptVisible] = useState(false);
  const [messages, setMessages] = useState<InterviewTranscriptionMessage[]>([]);
  const [sessionStartTime] = useState(new Date());
  const [timer, setTimer] = useState("15:00");
  const [timeRemaining, setTimeRemaining] = useState(900); // Always 15 minutes (900 seconds)
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [lastAgentMessage, setLastAgentMessage] = useState<string>("");
  const [agentSpeakingStartTime, setAgentSpeakingStartTime] = useState<number | null>(null);
  const [consecutiveRepeats, setConsecutiveRepeats] = useState(0);
  const [warningsShown, setWarningsShown] = useState<Set<number>>(new Set());
  const [endingCountdown, setEndingCountdown] = useState<number | null>(null);
  
  // Debug effect to track endingCountdown state changes
  useEffect(() => {
    console.log('🎯 endingCountdown state changed:', endingCountdown);
  }, [endingCountdown]);
  
  // Refs for audio feedback prevention
  const lastAgentTranscriptionRef = useRef<string>("");
  const agentResponseTimeoutRef = useRef<NodeJS.Timeout>();
  const silenceTimeoutRef = useRef<NodeJS.Timeout>();
  const lastUserSpeechRef = useRef<number>(0);
  
  // Constants for feedback prevention
  const MAX_AGENT_SPEAKING_TIME = 30000; // 30 seconds max
  const MIN_SILENCE_BETWEEN_RESPONSES = 2000; // 2 seconds minimum silence
  const MAX_CONSECUTIVE_REPEATS = 2;
  const RESPONSE_THROTTLE_MS = 1500; // Minimum time between agent responses

  // Force disconnect from LiveKit room
  const forceDisconnect = useCallback(async () => {
    try {
      console.log('Forcing LiveKit room disconnection...');
      if (room) {
        await room.disconnect();
        console.log('LiveKit room disconnected successfully');
      }
    } catch (error) {
      console.error('Error disconnecting from LiveKit room:', error);
    } finally {
      // Always call onEndInterview as fallback
      onEndInterview();
    }
  }, [room, onEndInterview]);

  // Show warning notification
  const showWarning = useCallback((timeRemaining: number) => {
    if (warningsShown.has(timeRemaining)) return;
    
    setWarningsShown(prev => new Set(prev).add(timeRemaining));
    
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    
    let message = '';
    let variant: "default" | "destructive" = "default";
    
    if (timeRemaining === 300) { // 5 minutes
      message = '5 minutes remaining in your interview';
      variant = "default";
    } else if (timeRemaining === 120) { // 2 minutes  
      message = '2 minutes remaining in your interview';
      variant = "default";
    } else if (timeRemaining === 30) { // 30 seconds
      message = '30 seconds remaining - interview will end soon';
      variant = "destructive";
    }
    
    if (message) {
      toast({
        title: "Time Warning",
        description: message,
        variant: variant,
        duration: 4000,
      });
    }
  }, [warningsShown, toast]);

  // Countdown timer effect with 2 second delay - ALWAYS 15 MINUTES
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    // Start countdown timer after 2 second delay
    const delayTimeout = setTimeout(() => {
      interval = setInterval(() => {
        setTimeRemaining((prevTime) => {
          const newTime = prevTime - 1;
          
          // Format time display
          const minutes = Math.floor(Math.max(0, newTime) / 60);
          const seconds = Math.max(0, newTime) % 60;
          setTimer(`${minutes}:${seconds.toString().padStart(2, '0')}`);
          
          // Show progressive warnings
          if (newTime === 300) { // 5 minutes remaining
            showWarning(300);
          } else if (newTime === 120) { // 2 minutes remaining  
            showWarning(120);
          } else if (newTime === 30) { // 30 seconds remaining
            showWarning(30);
          }
          
          // Force disconnect when time reaches 0
          if (newTime <= 0) {
            console.log('Interview time expired - forcing disconnection');
            forceDisconnect();
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
    }, 2000);

    return () => {
      clearTimeout(delayTimeout);
      if (interval) clearInterval(interval);
    };
  }, [sessionStartTime, forceDisconnect, showWarning]);

  // RPC registration for force end interview
  useEffect(() => {
    if (localParticipant?.localParticipant && room?.state === 'connected') {
      let registrationRetryCount = 0;
      const maxRetries = 3;
      let registrationTimer: NodeJS.Timeout;

      const registerRpc = async () => {
        try {
          console.log(`🔧 Attempting to register RPC method forceEndInterview (attempt ${registrationRetryCount + 1}/${maxRetries})...`);
          console.log('🔧 Local participant identity:', localParticipant.localParticipant.identity);
          console.log('🔧 Local participant sid:', localParticipant.localParticipant.sid);
          console.log('🔧 Room state:', room?.state);
          
          await localParticipant.localParticipant.registerRpcMethod('forceEndInterview', async (data: any) => {
            console.log('🎯 RPC RECEIVED - forceEndInterview called!');
            console.log('🎯 Raw RPC data:', data);
            
            try {
              let payload;
              
              // Handle different payload formats
              if (typeof data === 'string') {
                try {
                  payload = JSON.parse(data);
                } catch {
                  payload = { message: data }; // If not JSON, wrap in object
                }
              } else if (data && typeof data.payload === 'string') {
                try {
                  payload = JSON.parse(data.payload);
                } catch {
                  payload = { message: data.payload };
                }
              } else if (data && typeof data.payload === 'object') {
                payload = data.payload;
              } else {
                payload = data || {};
              }
              
              console.log('🎯 Parsed RPC payload:', payload);
              
              // Show toast notification
              toast({
                title: "Interview Completed",
                description: "The interview has been completed. Ending session...",
                duration: 3000,
              });
              
              // Start immediate countdown (3 seconds for faster response)
              console.log('🎯 Starting ending countdown: 3 seconds');
              setEndingCountdown(3);
              
              return JSON.stringify({
                status: 'success',
                message: 'Interview ended successfully',
                timestamp: new Date().toISOString()
              });
              
            } catch (parseError) {
              console.error('🎯 Error parsing RPC payload:', parseError);
              console.log('🎯 Fallback: Starting countdown anyway');
              
              // Still start countdown even if parsing fails
              setEndingCountdown(3);
              return JSON.stringify({
                status: 'success_with_error',
                message: 'Interview ended (with parsing error)',
                error: (parseError as Error).message,
                timestamp: new Date().toISOString()
              });
            }
          });
          
          console.log('✅ RPC method forceEndInterview registered successfully');
          
          // Verify registration by testing if the method exists
          // Note: We can't directly test our own RPC without causing issues, so we'll just log success
          console.log('✅ RPC registration verification: forceEndInterview handler is active and ready');
          console.log('🎯 Backend agents can now call forceEndInterview RPC on identity:', localParticipant.localParticipant.identity);
          
          // Registration successful, clear any retry timer
          if (registrationTimer) {
            clearTimeout(registrationTimer);
          }
          
        } catch (error) {
          console.error(`❌ Failed to register RPC method (attempt ${registrationRetryCount + 1}):`, error);
          console.error('❌ Error details:', (error as Error).message, (error as Error).stack);
          
          registrationRetryCount++;
          
          if (registrationRetryCount < maxRetries) {
            console.log(`🔄 Retrying RPC registration in 2 seconds... (${maxRetries - registrationRetryCount} attempts left)`);
            registrationTimer = setTimeout(() => {
              registerRpc();
            }, 2000);
          } else {
            console.error('❌ Max RPC registration retries exceeded');
            // RPC registration failed after retries - show fallback notification
            toast({
              title: "Please End Call",
              description: "Please end the interview call manually in 10 seconds",
              variant: "destructive",
              duration: 10000,
            });
            setEndingCountdown(10); // Still show countdown for user guidance
          }
        }
      };
      
      // Start registration with a small delay to ensure room is fully ready
      const initialDelay = setTimeout(() => {
        registerRpc();
      }, 500);

      // Cleanup: unregister RPC method and clear timers when component unmounts
      return () => {
        clearTimeout(initialDelay);
        if (registrationTimer) {
          clearTimeout(registrationTimer);
        }
        
        if (localParticipant?.localParticipant) {
          try {
            localParticipant.localParticipant.unregisterRpcMethod('forceEndInterview');
            console.log('🔧 RPC method forceEndInterview unregistered');
          } catch (error) {
            console.error('🔧 Error unregistering RPC method:', error);
          }
        }
      };
    } else {
      console.log('🔧 Waiting for room connection and local participant for RPC registration...', {
        hasLocalParticipant: !!localParticipant?.localParticipant,
        roomState: room?.state
      });
    }
  }, [localParticipant, room?.state, toast]);

  // Data channel listener as fallback for interview ending
  useEffect(() => {
    if (room) {
      const handleDataReceived = (data: Uint8Array, participant?: RemoteParticipant, kind?: any, topic?: string) => {
        try {
          const message = new TextDecoder().decode(data);
          console.log('📨 Data channel message received:', { message, topic, participant: participant?.identity });
          
          const parsed = JSON.parse(message);
          
          // Handle interview end notifications
          if ((parsed.type === "interview_end" || parsed.type === "force_interview_end") && 
              (topic === "interview_control" || topic === "interview_force_end")) {
            
            console.log('📨 Interview end notification via data channel:', parsed);
            
            toast({
              title: "Interview Completed",
              description: "The interview has been completed. Ending session...",
              duration: 3000,
            });
            
            // Start countdown
            console.log('📨 Starting ending countdown from data channel: 3 seconds');
            setEndingCountdown(3);
          }
        } catch (error) {
          console.log('📨 Non-JSON data channel message or parsing error:', error);
        }
      };

      room.on('dataReceived', handleDataReceived);
      console.log('📨 Data channel listener registered');

      return () => {
        room.off('dataReceived', handleDataReceived);
        console.log('📨 Data channel listener unregistered');
      };
    }
  }, [room, toast]);

  // Ending countdown effect
  useEffect(() => {
    if (endingCountdown !== null) {
      console.log(`⏰ Ending countdown: ${endingCountdown} seconds remaining`);
      
      if (endingCountdown <= 0) {
        // Countdown finished - end interview
        console.log('⏰ Ending countdown completed, calling onEndInterview');
        console.log('⏰ onEndInterview function:', typeof onEndInterview);
        
        try {
          onEndInterview();
          console.log('✅ onEndInterview called successfully');
        } catch (error) {
          console.error('❌ Error calling onEndInterview:', error);
        }
        return;
      }
      
      // Continue countdown
      const timeout = setTimeout(() => {
        setEndingCountdown(prev => {
          const newValue = prev !== null ? prev - 1 : null;
          console.log(`⏰ Countdown tick: ${prev} -> ${newValue}`);
          return newValue;
        });
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [endingCountdown, onEndInterview]);

  // Enhanced agent transcription handling with better grouping
  useEffect(() => {
    if (agentTranscriptions && agentTranscriptions.length > 0) {
      const latestTranscription = agentTranscriptions[agentTranscriptions.length - 1];
      const trimmedText = latestTranscription.text.trim();
      
      if (trimmedText && trimmedText !== lastAgentTranscriptionRef.current) {
        // Check for repetitive content
        const isRepeat = trimmedText === lastAgentMessage;
        
        if (isRepeat) {
          setConsecutiveRepeats(prev => prev + 1);
          
          // If too many repeats, try to interrupt the agent
          if (consecutiveRepeats >= MAX_CONSECUTIVE_REPEATS) {
            console.warn("Agent repeating content, attempting to break loop");
            // Force a pause by muting temporarily
            setIsMicMuted(true);
            setTimeout(() => setIsMicMuted(false), 3000);
            return;
          }
        } else {
          setConsecutiveRepeats(0);
        }
        
        // Throttle agent responses
        const now = Date.now();
        const timeSinceLastUserSpeech = now - lastUserSpeechRef.current;
        
        if (timeSinceLastUserSpeech < MIN_SILENCE_BETWEEN_RESPONSES) {
          console.log("Throttling agent response - too soon after user speech");
          return;
        }
        
        // Group messages: Update existing agent message if recent, otherwise create new
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          const now = new Date();
          
          // If last message is from agent and within 3 seconds, update it
          if (lastMessage && 
              lastMessage.type === "agent" && 
              (now.getTime() - lastMessage.timestamp.getTime()) < 3000) {
            
            const updatedMessages = [...prev];
            updatedMessages[updatedMessages.length - 1] = {
              ...lastMessage,
              content: trimmedText,
              timestamp: now
            };
            return updatedMessages;
          } else {
            // Create new message
            const newMessage: InterviewTranscriptionMessage = {
              id: `agent-${Date.now()}`,
              type: "agent",
              content: trimmedText,
              timestamp: now
            };
            return [...prev, newMessage];
          }
        });
        
        setLastAgentMessage(trimmedText);
        lastAgentTranscriptionRef.current = trimmedText;
      }
    }
  }, [agentTranscriptions, lastAgentMessage, consecutiveRepeats]);

  // Monitor agent speaking duration to prevent infinite speaking
  useEffect(() => {
    if (state === "speaking") {
      if (!agentSpeakingStartTime) {
        setAgentSpeakingStartTime(Date.now());
      }
      
      // Set timeout to interrupt if agent speaks too long
      if (agentResponseTimeoutRef.current) {
        clearTimeout(agentResponseTimeoutRef.current);
      }
      
      agentResponseTimeoutRef.current = setTimeout(() => {
        console.warn("Agent speaking too long, forcing interruption");
        setIsMicMuted(true);
        setTimeout(() => setIsMicMuted(false), 2000);
      }, MAX_AGENT_SPEAKING_TIME);
      
    } else {
      setAgentSpeakingStartTime(null);
      if (agentResponseTimeoutRef.current) {
        clearTimeout(agentResponseTimeoutRef.current);
      }
    }
    
    return () => {
      if (agentResponseTimeoutRef.current) {
        clearTimeout(agentResponseTimeoutRef.current);
      }
    };
  }, [state]);

  // Custom hook for user transcription with enhanced handling
  function useSafeTrackTranscription() {
    const safePublication: TrackPublication =
      localParticipant?.microphoneTrack ?? ({} as TrackPublication);
    const safeParticipant: Participant =
      localParticipant?.localParticipant ?? ({} as Participant);
    return useTrackTranscription({
      publication: safePublication,
      source: Track.Source.Microphone,
      participant: safeParticipant,
    });
  }

  const { segments: userSegments } = useSafeTrackTranscription();

  // Enhanced user transcription handling with better grouping
  useEffect(() => {
    if (userSegments && userSegments.length > 0) {
      const latestSegment = userSegments[userSegments.length - 1];
      if (latestSegment.final && latestSegment.text.trim()) {
        // Update last user speech time for throttling
        lastUserSpeechRef.current = Date.now();
        
        const trimmedContent = latestSegment.text.trim();
        
        // Group user messages: Update existing user message if recent, otherwise create new
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          const now = new Date();
          
          // If last message is from user and within 2 seconds, update it
          if (lastMessage && 
              lastMessage.type === "user" && 
              (now.getTime() - lastMessage.timestamp.getTime()) < 2000) {
            
            const updatedMessages = [...prev];
            updatedMessages[updatedMessages.length - 1] = {
              ...lastMessage,
              content: lastMessage.content + " " + trimmedContent,
              timestamp: now
            };
            return updatedMessages;
          } else {
            // Create new message
            const newMessage: InterviewTranscriptionMessage = {
              id: `user-${Date.now()}`,
              type: "user",
              content: trimmedContent,
              timestamp: now
            };
            return [...prev, newMessage];
          }
        });
        
        // Reset agent loop detection when user speaks
        setConsecutiveRepeats(0);
      }
    }
  }, [userSegments]);

  // Enhanced speaking detection with feedback prevention
  const isSpeaking = state === "speaking" || (audioTrack && audioTrack.isMuted === false);

  const toggleTranscript = useCallback(() => {
    setIsTranscriptVisible(!isTranscriptVisible);
  }, [isTranscriptVisible]);

  const toggleMicrophone = useCallback(async () => {
    try {
      const newMutedState = !isMicMuted;
      if (localParticipant?.localParticipant) {
        await localParticipant.localParticipant.setMicrophoneEnabled(!newMutedState);
        setIsMicMuted(newMutedState);
      } else {
        setIsMicMuted(newMutedState);
      }
    } catch (error) {
      console.error("Error toggling microphone:", error);
      // On error, just toggle the visual state
      setIsMicMuted(!isMicMuted);
    }
  }, [isMicMuted, localParticipant]);

  const handleTurnOnCamera = useCallback(() => {
    console.log('Turning on camera...');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (agentResponseTimeoutRef.current) {
        clearTimeout(agentResponseTimeoutRef.current);
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/20 relative overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50/40 via-emerald-50/30 to-lime-50/20 pointer-events-none" />
      
      {/* Top Navigation */}
      <header className="relative z-10 flex justify-between items-center p-4 bg-white/10 backdrop-blur-sm">
        <button 
          onClick={onEndInterview}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Exit Interview</span>
        </button>
        <div className="text-sm font-semibold text-emerald-600">
          {sessionConfig.interviewType} Interview - {sessionConfig.position}
        </div>
      </header>

      {/* Main Content Container */}
      <div className="relative z-10 flex h-[calc(100vh-64px)]">
        {/* Left Side - Main Interview Area */}
        <div className={`flex flex-col items-center justify-between p-4 transition-all duration-300 ${
          isTranscriptVisible ? 'w-full lg:w-2/3' : 'w-full'
        }`}>
          
          {/* Top Status and Content */}
          <div className="flex flex-col items-center justify-center flex-1">
            {/* Status Indicators */}
            <div className="flex flex-col items-center mb-6">
              {/* Connection Status */}
              {state === "connecting" && (
                <div className="mb-3 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  Connecting to interviewer...
                </div>
              )}

              {/* AI Speaking Indicator */}
              {isSpeaking && state === "speaking" && (
                <div className="mb-3 px-4 py-2 bg-green-50 text-green-600 rounded-full text-sm font-medium flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  AI Interviewer Speaking
                  {agentSpeakingStartTime && Date.now() - agentSpeakingStartTime > 15000 && (
                    <span className="text-xs text-orange-500 ml-2">(Long response detected)</span>
                  )}
                </div>
              )}

              {/* Listening Indicator */}
              {state === "listening" && (
                <div className="mb-3 px-4 py-2 bg-orange-50 text-orange-600 rounded-full text-sm font-medium flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                  Listening...
                </div>
              )}

              {/* Loop Detection Warning */}
              {consecutiveRepeats > 0 && (
                <div className="mb-3 px-4 py-2 bg-yellow-50 text-yellow-600 rounded-full text-sm font-medium flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                  Repetitive content detected ({consecutiveRepeats}/{MAX_CONSECUTIVE_REPEATS})
                </div>
              )}
            </div>

            {/* Animated Orb */}
            <div className="mb-6">
              <AnimatedOrb isSpeaking={isSpeaking} />
            </div>

            {/* Timer with visual warnings */}
            <div className={`text-xl mb-6 font-mono font-semibold transition-colors duration-300 ${
              endingCountdown !== null ? 'text-red-600 animate-pulse' : // Red and pulsing when ending
              timeRemaining <= 60 ? 'text-red-600 animate-pulse' : // Red and pulsing in last minute
              timeRemaining <= 300 ? 'text-orange-600' : // Orange in last 5 minutes
              'text-gray-600' // Normal gray
            }`}>
              {endingCountdown !== null ? (
                <span className="text-red-500 font-bold animate-pulse">
                  Ending in: {endingCountdown}
                </span>
              ) : (
                timer
              )}
            </div>
          </div>

          {/* Bottom Controls - Always Visible */}
          <div className="flex flex-wrap items-center justify-center gap-3 max-w-lg w-full">
            <Button
              variant="outline"
              onClick={toggleMicrophone}
              className={`px-4 py-2 border transition-colors rounded-full flex items-center gap-2 ${
                isMicMuted 
                  ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' 
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {isMicMuted ? <MicOff size={16} /> : <Mic size={16} />}
              <span className="hidden sm:inline">{isMicMuted ? 'Unmute' : 'Mute'}</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={toggleTranscript}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors rounded-full flex items-center gap-2"
            >
              <span>{isTranscriptVisible ? 'Hide Transcript' : 'Show Transcript'}</span>
            </Button>
            
            <Button
              onClick={onEndInterview}
              className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-full shadow-lg shadow-red-500/30 transition-all duration-200"
            >
              End Interview
            </Button>
            
            {/* Camera Button
            <Button
              variant="outline"
              onClick={handleTurnOnCamera}
              className="px-4 py-2 bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-600 hover:bg-white hover:text-gray-800 transition-all rounded-full flex items-center gap-2"
            >
              <Camera size={16} />
              <span className="hidden sm:inline">Turn On Camera</span>
            </Button> */}
          </div>
        </div>

        {/* Right Side - Live Transcript */}
        {isTranscriptVisible && (
          <div className="w-full lg:w-1/3 bg-white/95 backdrop-blur-sm border-l border-gray-200 flex flex-col h-full">
            <div className="flex-1 overflow-hidden">
              <LiveTranscript messages={messages} />
            </div>
          </div>
        )}
      </div>

      {/* Audio Components for Agent Playback */}
      {remoteParticipants.length > 0 && (
        <div className="absolute top-0 left-0 w-1 h-1 overflow-hidden opacity-0 pointer-events-none">
          {remoteParticipants.map((participant) => {
            const audioPublications = Array.from(participant.audioTrackPublications.values());
            return audioPublications.map((publication) => 
              publication.track && publication.kind === 'audio' ? (
                <AudioTrack
                  key={publication.trackSid}
                  trackRef={{
                    participant,
                    publication,
                    source: publication.source
                  }}
                  volume={1}
                />
              ) : null
            );
          })}
        </div>
      )}
    </div>
  );
};

// Component for when not connected
const DisconnectedVoiceAssistant: React.FC<MockInterviewVoiceAssistantProps> = ({ 
  sessionConfig,
  onEndInterview
}) => {
  const { toast } = useToast();
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isTranscriptVisible, setIsTranscriptVisible] = useState(false);
  const [timer, setTimer] = useState("15:00");
  const [timeRemaining, setTimeRemaining] = useState(900); // Always 15 minutes (900 seconds)
  const [sessionStartTime] = useState(new Date());
  const [warningsShown, setWarningsShown] = useState<Set<number>>(new Set());
  const [endingCountdown, setEndingCountdown] = useState<number | null>(null);

  // Show warning notification
  const showWarning = useCallback((timeRemaining: number) => {
    if (warningsShown.has(timeRemaining)) return;
    
    setWarningsShown(prev => new Set(prev).add(timeRemaining));
    
    let message = '';
    let variant: "default" | "destructive" = "default";
    
    if (timeRemaining === 300) { // 5 minutes
      message = '5 minutes remaining in your interview';
      variant = "default";
    } else if (timeRemaining === 120) { // 2 minutes  
      message = '2 minutes remaining in your interview';
      variant = "default";
    } else if (timeRemaining === 30) { // 30 seconds
      message = '30 seconds remaining - interview will end soon';
      variant = "destructive";
    }
    
    if (message) {
      toast({
        title: "Time Warning",
        description: message,
        variant: variant,
        duration: 4000,
      });
    }
  }, [warningsShown, toast]);

  // Countdown timer effect with 2 second delay - ALWAYS 15 MINUTES
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    // Start countdown timer after 2 second delay
    const delayTimeout = setTimeout(() => {
      interval = setInterval(() => {
        setTimeRemaining((prevTime) => {
          const newTime = prevTime - 1;
          
          // Format time display
          const minutes = Math.floor(Math.max(0, newTime) / 60);
          const seconds = Math.max(0, newTime) % 60;
          setTimer(`${minutes}:${seconds.toString().padStart(2, '0')}`);
          
          // Show progressive warnings
          if (newTime === 300) { // 5 minutes remaining
            showWarning(300);
          } else if (newTime === 120) { // 2 minutes remaining  
            showWarning(120);
          } else if (newTime === 30) { // 30 seconds remaining
            showWarning(30);
          }
          
          // Auto-end interview when time reaches 0
          if (newTime <= 0) {
            console.log('Interview time expired - ending session');
            onEndInterview();
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
    }, 2000);

    return () => {
      clearTimeout(delayTimeout);
      if (interval) clearInterval(interval);
    };
  }, [sessionStartTime, onEndInterview, showWarning]);

  // Ending countdown effect
  useEffect(() => {
    if (endingCountdown !== null) {
      if (endingCountdown <= 0) {
        // Countdown finished - end interview
        console.log('Ending countdown completed, calling onEndInterview');
        onEndInterview();
        return;
      }
      
      // Continue countdown
      const timeout = setTimeout(() => {
        setEndingCountdown(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [endingCountdown, onEndInterview]);

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-50/40 via-emerald-50/30 to-lime-50/20 pointer-events-none" />
      
      <header className="relative z-10 flex justify-between items-center p-4 bg-white/10 backdrop-blur-sm">
        <button 
          onClick={onEndInterview}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Exit Interview</span>
        </button>
        <div className="text-sm font-semibold text-emerald-600">
          {formatInterviewType(sessionConfig.interviewType)} Interview - {sessionConfig.position}
        </div>
      </header>

      <div className="relative z-10 flex h-[calc(100vh-64px)]">
        <div className="flex flex-col items-center justify-between p-4 w-full">
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="mb-3 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              Connecting to interviewer...
            </div>

            <div className="mb-6">
              <AnimatedOrb isSpeaking={false} />
            </div>

            <div className={`text-xl mb-6 font-mono font-semibold transition-colors duration-300 ${
              endingCountdown !== null ? 'text-red-600 animate-pulse' : // Red and pulsing when ending
              timeRemaining <= 60 ? 'text-red-600 animate-pulse' : // Red and pulsing in last minute
              timeRemaining <= 300 ? 'text-orange-600' : // Orange in last 5 minutes
              'text-gray-600' // Normal gray
            }`}>
              {endingCountdown !== null ? (
                <span className="text-red-500 font-bold animate-pulse">
                  Ending in: {endingCountdown}
                </span>
              ) : (
                timer
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 max-w-lg w-full">
            <Button
              onClick={onEndInterview}
              className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-full shadow-lg shadow-red-500/30 transition-all duration-200"
            >
              End Interview
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main component that conditionally renders based on connection state
const MockInterviewVoiceAssistant: React.FC<MockInterviewVoiceAssistantProps> = (props) => {
  return props.connectionDetails ? (
    <ConnectedVoiceAssistant {...props} />
  ) : (
    <DisconnectedVoiceAssistant {...props} />
  );
};

export default MockInterviewVoiceAssistant; 