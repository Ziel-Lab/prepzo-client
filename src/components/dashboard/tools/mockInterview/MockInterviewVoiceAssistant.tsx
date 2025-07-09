"use client";

import {
  useVoiceAssistant,
  useTrackTranscription,
  useLocalParticipant,
  useRemoteParticipants,
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

// Component for when LiveKit is connected
const ConnectedVoiceAssistant: React.FC<MockInterviewVoiceAssistantProps> = ({ 
  sessionConfig,
  connectionDetails,
  onEndInterview
}) => {
  const { state, agentTranscriptions, audioTrack } = useSafeVoiceAssistant();
  const remoteParticipants = useRemoteParticipants();
  const localParticipant = useLocalParticipant();
  const [isTranscriptVisible, setIsTranscriptVisible] = useState(false);
  const [messages, setMessages] = useState<InterviewTranscriptionMessage[]>([]);
  const [sessionStartTime] = useState(new Date());
  const [timer, setTimer] = useState("0:00");
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [lastAgentMessage, setLastAgentMessage] = useState<string>("");
  const [agentSpeakingStartTime, setAgentSpeakingStartTime] = useState<number | null>(null);
  const [consecutiveRepeats, setConsecutiveRepeats] = useState(0);
  
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

  // Timer effect with 2 second delay
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    // Start timer after 2 second delay
    const delayTimeout = setTimeout(() => {
      interval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000) - 2; // Subtract 2 seconds delay
        const minutes = Math.floor(Math.max(0, diff) / 60);
        const seconds = Math.max(0, diff) % 60;
        setTimer(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
    }, 2000);

    return () => {
      clearTimeout(delayTimeout);
      if (interval) clearInterval(interval);
    };
  }, [sessionStartTime]);

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

            {/* Timer */}
            <div className="text-gray-600 text-xl mb-6 font-mono font-semibold">
              {timer}
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
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isTranscriptVisible, setIsTranscriptVisible] = useState(false);
  const [timer, setTimer] = useState("0:00");
  const [sessionStartTime] = useState(new Date());

  // Timer effect with 2 second delay
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    // Start timer after 2 second delay
    const delayTimeout = setTimeout(() => {
      interval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000) - 2; // Subtract 2 seconds delay
        const minutes = Math.floor(Math.max(0, diff) / 60);
        const seconds = Math.max(0, diff) % 60;
        setTimer(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
    }, 2000);

    return () => {
      clearTimeout(delayTimeout);
      if (interval) clearInterval(interval);
    };
  }, [sessionStartTime]);

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
          {sessionConfig.interviewType} Interview - {sessionConfig.position}
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

            <div className="text-gray-600 text-xl mb-6 font-mono font-semibold">
              {timer}
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