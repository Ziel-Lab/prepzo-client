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
import VideoInterviewLayout from "./VideoInterviewLayout";
import type { MockInterviewConnectionDetails } from "@/app/api/mock-interview-token/route";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

// Custom hook to safely use voice assistant with enhanced error handling
function useSafeVoiceAssistant() {
  try {
    return useVoiceAssistant();
  } catch (error) {
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
  endingCountdown?: number | null; // Optional countdown from parent RPC handler
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
  onEndInterview,
  endingCountdown: parentEndingCountdown
}) => {
  const { state, agentTranscriptions, audioTrack } = useSafeVoiceAssistant();
  const remoteParticipants = useRemoteParticipants();
  const localParticipant = useLocalParticipant();
  const room = useRoomContext();
  const { toast } = useToast();
  const router = useRouter();
  
  // Listen for participant changes to show notifications
  useEffect(() => {
    if (room) {
      const handleParticipantConnected = (participant: RemoteParticipant) => {
        if (participant.identity?.includes('agent') || participant.identity?.includes('assistant')) {
          toast({
            title: "AI Interviewer Connected",
            description: "The interview will begin shortly.",
            duration: 3000,
          });
        }
      };

      const handleParticipantDisconnected = (participant: RemoteParticipant) => {
        if (participant.identity?.includes('agent') || participant.identity?.includes('assistant')) {
          toast({
            title: "AI Interviewer Disconnected",
            description: "The AI interviewer has left the session.",
            duration: 5000,
          });
        }
      };

      room.on('participantConnected', handleParticipantConnected);
      room.on('participantDisconnected', handleParticipantDisconnected);

      return () => {
        room.off('participantConnected', handleParticipantConnected);
        room.off('participantDisconnected', handleParticipantDisconnected);
      };
    }
  }, [room, toast]);
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
  const [localEndingCountdown, setLocalEndingCountdown] = useState<number | null>(null);
  
  // Use parent's endingCountdown if available, otherwise use local
  const endingCountdown = parentEndingCountdown !== undefined ? parentEndingCountdown : localEndingCountdown;
  

  
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

  // Enhanced navigation helper with proper cleanup
  const navigateToSessionsPage = useCallback(async (delay: number = 1000) => {
    try {
      // Cleanup room if connected
      if (room && room.state === 'connected') {
        await room.disconnect();
      }
      
      setTimeout(() => {
        router.push('/dashboard/tools/mock-Interview');
      }, delay);
    } catch (error) {
      // Fallback navigation even if cleanup fails
      setTimeout(() => {
        router.push('/dashboard/tools/mock-Interview');
      }, delay);
    }
  }, [room, router]);

  // Force disconnect from LiveKit room (frontend timeout system)
  const forceDisconnect = useCallback(async () => {
    try {
      toast({
        title: "Interview Time Expired",
        description: "The 15-minute interview time limit has been reached. Redirecting...",
        duration: 4000,
      });
      
      await navigateToSessionsPage(2000);
    } catch (error) {
      // Fallback to onEndInterview if navigation fails
      onEndInterview();
    }
  }, [toast, navigateToSessionsPage, onEndInterview]);

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
          
          // Force disconnect when time reaches 0 (fallback only)
          if (newTime <= 0) {
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

  // Note: RPC registration is now handled in MockInterviewLiveKit.tsx for proper timing
  // Data channel listener is kept as fallback only for non-RPC communications

  // Ending countdown effect
  useEffect(() => {
    if (endingCountdown !== null) {
      if (endingCountdown <= 0) {
        onEndInterview();
        return;
      }
      
      // Continue countdown
      const timeout = setTimeout(() => {
        setLocalEndingCountdown(prev => (prev !== null ? prev - 1 : null));
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
      // On error, just toggle the visual state
      setIsMicMuted(!isMicMuted);
    }
  }, [isMicMuted, localParticipant]);

  const handleTurnOnCamera = useCallback(() => {
    // Camera functionality
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
    <VideoInterviewLayout
      sessionConfig={sessionConfig}
      isSpeaking={isSpeaking}
      messages={messages}
      timer={timer}
      timeRemaining={timeRemaining}
      endingCountdown={endingCountdown}
      onEndInterview={() => navigateToSessionsPage(500)}
      onNavigateBack={() => navigateToSessionsPage(500)}
    >
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
    </VideoInterviewLayout>
  );
};

// Component for when not connected
const DisconnectedVoiceAssistant: React.FC<MockInterviewVoiceAssistantProps> = ({ 
  sessionConfig,
  onEndInterview,
  endingCountdown: parentEndingCountdown
}) => {
  const { toast } = useToast();
  const router = useRouter();
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isTranscriptVisible, setIsTranscriptVisible] = useState(false);
  const [timer, setTimer] = useState("15:00");
  const [timeRemaining, setTimeRemaining] = useState(900); // Always 15 minutes (900 seconds)
  const [sessionStartTime] = useState(new Date());
  const [warningsShown, setWarningsShown] = useState<Set<number>>(new Set());
  const [localEndingCountdown, setLocalEndingCountdown] = useState<number | null>(null);
  
  // Use parent's endingCountdown if available, otherwise use local
  const endingCountdown = parentEndingCountdown !== undefined ? parentEndingCountdown : localEndingCountdown;

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
        onEndInterview();
        return;
      }
      
      // Continue countdown
      const timeout = setTimeout(() => {
        setLocalEndingCountdown(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [endingCountdown, onEndInterview]);

  return (
    <VideoInterviewLayout
      sessionConfig={sessionConfig}
      isSpeaking={false}
      messages={[]}
      timer={timer}
      timeRemaining={timeRemaining}
      endingCountdown={endingCountdown}
      onEndInterview={() => router.push('/dashboard/tools/mock-Interview')}
      onNavigateBack={() => router.push('/dashboard/tools/mock-Interview')}
    />
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