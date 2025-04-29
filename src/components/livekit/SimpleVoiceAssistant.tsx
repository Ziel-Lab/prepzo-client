"use client";
import {
  useVoiceAssistant,
  VoiceAssistantControlBar,
  useTrackTranscription,
  useLocalParticipant,
  AgentState,
  useRoomContext
} from "@livekit/components-react";
import { Track, TrackPublication, Participant } from "livekit-client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Declare types for window properties
declare global {
  interface Window {
    emailRequested?: boolean;
    resumeRequested?: boolean;
    emailSent?: string;
    resumeSent?: string;
  }
}

// Custom hook to safely use voice assistant
function useSafeVoiceAssistant() {
  try {
    // Try to use the hook safely
    return useVoiceAssistant();
  } catch (error) {
    console.error("Error in useVoiceAssistant:", error);
    // Return fallback values
    return {
      state: "connecting" as AgentState,
      agentTranscriptions: [],
      audioTrack: null,
    };
  }
}

interface SimpleVoiceAssistantProps {
  onStateChange: (state: AgentState) => void;
  onEndCall?: () => void;
  jobResultsMarkdown: string | null;
  setJobResultsMarkdown: (markdown: string | null) => void;
}

export interface TranscriptionSegment {
  id: string;
  text: string;
  language: string;
  startTime: number;
  endTime: number;
  final: boolean;
  firstReceivedTime: number;
  lastReceivedTime: number;
  receivedAtMediaTimestamp: number;
  receivedAt: number;
}

export interface TranscriptionMessage extends TranscriptionSegment {
  type: "agent" | "user";
}

// Message component with Tailwind CSS + Framer Motion
const ThinkingIndicator = () => {
  // Define Tailwind classes directly
  const textColor = "text-blue-500 dark:text-blue-300";
  const bgColor = "bg-gray-50 dark:bg-gray-800";
  const borderColor = "border-gray-200 dark:border-gray-700";
  
  return (
    <motion.div // Use motion.div directly
      className="w-full flex justify-start mb-2" // Tailwind layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        // Apply Tailwind classes for styling
        className={cn(
          "px-4 py-2.5 rounded-md border shadow-xs",
          bgColor,
          borderColor
        )}
      >
        <span 
          className="block font-medium text-xs mb-1 text-gray-500 tracking-tight"
        >
          Assistant
        </span>
        <p
          className={cn(
            "text-sm font-medium h-[1.2em] leading-tight", // Tailwind text styles
            textColor
          )}
        >
          {/* Motion spans remain the same */}
          <motion.span
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.4, times: [0, 0.2, 1] }}
          >
            .
          </motion.span>
          <motion.span
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.4, times: [0, 0.2, 1], delay: 0.2 }}
          >
            .
          </motion.span>
          <motion.span
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.4, times: [0, 0.2, 1], delay: 0.4 }}
          >
            .
          </motion.span>
        </p>
      </div>
    </motion.div>
  );
};

const Message: React.FC<{ 
  type: "agent" | "user"; 
  text: string;
}> = ({ type, text }) => {
  const isUser = type === "user";
  
  // Define Tailwind classes for user and assistant messages
  const userBgColor = "bg-blue-50 dark:bg-blue-900";
  const assistantBgColor = "bg-gray-50 dark:bg-gray-800";
  const userBorderColor = "border-blue-200 dark:border-blue-700";
  const assistantBorderColor = "border-gray-200 dark:border-gray-700";
  const userTextColor = "text-gray-700 dark:text-white";
  const assistantTextColor = "text-gray-700 dark:text-white";
  const userSpeakerColor = "text-blue-500";
  const assistantSpeakerColor = "text-gray-500";
  
  // Trim the text before rendering
  const trimmedText = text.trim();

  return (
    <motion.div // Use motion.div
      // Apply Tailwind flex layout classes
      className={cn(
        "w-full flex mb-2", 
        isUser ? "justify-end" : "justify-start"
      )}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        // Apply Tailwind classes for bubble styling
        className={cn(
          "max-w-[75%] px-4 py-2.5 rounded-md border shadow-xs",
          isUser ? userBgColor : assistantBgColor,
          isUser ? userBorderColor : assistantBorderColor,
          isUser ? userTextColor : assistantTextColor
        )}
      >
        <span 
          // Apply Tailwind classes for speaker text
          className={cn(
            "block font-medium text-xs mb-1 tracking-tight",
            isUser ? userSpeakerColor : assistantSpeakerColor
          )}
        >
          {isUser ? "You" : "Assistant"}
        </span>
        <p
          // Apply Tailwind classes for message text
          className="text-sm whitespace-pre-wrap leading-tight"
        >
          {trimmedText}
        </p>
      </div>
    </motion.div>
  );
};

/**
 * Custom hook that always calls useTrackTranscription.
 */
function useSafeTrackTranscription() {
  const localParticipant = useLocalParticipant();
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

// Custom Control Bar with End Call Icon using Tailwind
const CustomControlBar = ({ onEndCall }: { onEndCall?: () => void }) => {
  const room = useRoomContext();
  // Define Tailwind classes for background and border
  const bgColor = "bg-white dark:bg-gray-800";
  const borderColor = "border-gray-200 dark:border-gray-700";
  
  const handleDisconnect = async () => {
    console.log("Handle disconnect called");
    
    console.log("Now stopping all audio capture");
    
    if (room?.localParticipant) {
      const publications = room.localParticipant.trackPublications;
      publications.forEach(publication => {
        try {
          if (publication.track) {
            publication.track.stop();
            console.log("Stopped track:", publication.trackSid);
          }
        } catch (e) {
          console.error("Error stopping publication track:", e);
        }
      });
    }
    
    const stopAllMicrophoneTracks = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log(`Found ${devices.length} media devices`);
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
          console.log("Explicitly stopped track:", track.id);
        });
        
        if (typeof window !== 'undefined') {
          const globalAny = window as unknown as { 
            mediaRecorders?: Array<{ 
              stop: () => void 
            }> 
          };
          if (globalAny.mediaRecorders && Array.isArray(globalAny.mediaRecorders)) {
            globalAny.mediaRecorders.forEach((recorder) => {
              try {
                if (recorder && typeof recorder.stop === 'function') {
                  recorder.stop();
                  console.log("Stopped media recorder");
                }
              } catch (e) {
                console.error("Error stopping media recorder:", e);
              }
            });
          }
        }
      } catch (err) {
        console.error("Error stopping media tracks:", err);
      }
      
      if (typeof window !== 'undefined') {
        try {
          const AudioContextClass = window.AudioContext || 
                                   ((window as unknown as { webkitAudioContext?: AudioContext }).webkitAudioContext);
          if (AudioContextClass) {
            const tempContext = new AudioContextClass();
            await tempContext.close();
            console.log("Closed temporary audio context");
          }
        } catch (e) {
          console.error("Error handling audio context:", e);
        }
      }
    };
    
    if (room) {
      try {
        room.disconnect();
        console.log("Disconnected from room");
      } catch (e) {
        console.error("Error disconnecting room:", e);
      }
    }
    
    await stopAllMicrophoneTracks();
    
    if (typeof window !== 'undefined') {
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach(el => {
        try {
          if (el.srcObject) {
            try {
              const stream = el.srcObject as MediaStream;
              if (stream && typeof stream.getTracks === 'function') {
                stream.getTracks().forEach(track => {
                  track.stop();
                  console.log("Stopped track in audio element:", track.id);
                });
              }
              el.srcObject = null;
            } catch (err) {
              console.error("Error stopping tracks in srcObject:", err);
            }
          }
          el.removeAttribute('src');
          el.load();
          el.remove();
          console.log("Removed audio element from DOM");
        } catch (e) {
          console.error("Error cleaning up audio element:", e);
        }
      });
    }
    
    if (onEndCall) {
      setTimeout(() => {
        if (onEndCall) onEndCall();
      }, 100);
    }
  };
  
  return (
    <div 
      // Use Tailwind for layout and styling
      className={cn(
        "flex justify-between items-center w-auto min-w-[300px] max-w-[450px] mx-auto rounded-md py-2 px-6 border shadow-xs",
        bgColor,
        borderColor
      )}
    >
      {/* Wrapper div for LiveKit control bar */}
      {/* Attempt to hide LiveKit's disconnect button using a wrapper and potentially CSS if needed */}
      {/* Note: Directly hiding internal elements via CSS might be brittle */}
      <div className="w-[180px] lk-voice-control-wrapper">
          <VoiceAssistantControlBar 
            controls={{
              microphone: true,
              leave: false // Ensure LiveKit's leave button is not shown
            }} 
          />
      </div>
      
      {/* Shadcn Button for End Call */}
      <Button
        variant="destructive" // Use Shadcn destructive variant
        size="default" // Use Shadcn default size or adjust
        onClick={handleDisconnect}
        className="ml-3 px-6 py-2 h-auto rounded-md font-normal shadow-sm" // Add specific classes as needed
      >
        End Call
      </Button>
    </div>
  );
};

const SimpleVoiceAssistant: React.FC<SimpleVoiceAssistantProps> = ({ 
  onStateChange, 
  onEndCall, 
  jobResultsMarkdown, 
  setJobResultsMarkdown 
}) => {
  const { state, agentTranscriptions, audioTrack } = useSafeVoiceAssistant();
  const { segments: userTranscriptions } = useSafeTrackTranscription();

  const [messages, setMessages] = useState<TranscriptionMessage[]>([]);
  const [showThinking, setShowThinking] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const lastMessageTypeRef = useRef<"agent" | "user" | null>(null);
  const thinkingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const emailSentRef = useRef<string | null>(null);

  // Request fresh microphone permissions on mount
  useEffect(() => {
    const refreshMicrophonePermissions = async () => {
      try {
        console.log("Requesting fresh microphone permissions...");
        // Close any existing streams first
        const existingStreams = await navigator.mediaDevices.getUserMedia({ audio: true });
        existingStreams.getTracks().forEach(track => track.stop());
        
        // Request permissions again
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        
        console.log("Microphone permissions granted:", stream.getAudioTracks());
        
        // Don't actually use this stream - LiveKit will handle that
        // Just keeping the reference so it doesn't get garbage collected too soon
        return () => {
          stream.getTracks().forEach(track => track.stop());
        };
      } catch (error) {
        console.error("Error requesting microphone permissions:", error);
      }
    };
    
    refreshMicrophonePermissions();
  }, []);

  // Add logging to debug transcription issues
  useEffect(() => {
    console.log("Agent state:", state);
    console.log("Agent transcriptions:", agentTranscriptions);
    console.log("User transcriptions:", userTranscriptions);
  }, [state, agentTranscriptions, userTranscriptions]);

  // Let the audio track create and attach its own audio element.
  useEffect(() => {
    if (!audioTrack) return; // Exit early if no audioTrack
    
    console.log("Audio track received:", audioTrack);
    
    let attachedAudio: HTMLAudioElement | undefined;
    if (audioTrack?.publication?.track) {
      try {
      attachedAudio = new Audio();
      attachedAudio.style.display = "none";
        // Check if the track has an attach method before calling it
        if (typeof audioTrack.publication.track.attach === 'function') {
      audioTrack.publication.track.attach(attachedAudio);
      document.body.appendChild(attachedAudio);
          console.log("Audio track attached successfully");
        }
      } catch (error) {
        console.error("Error attaching audio track:", error);
      }
    }
    return () => {
      if (attachedAudio) {
        try {
          // Check if the track and detach method exist before calling it
          if (audioTrack?.publication?.track && typeof audioTrack.publication.track.detach === 'function') {
        audioTrack.publication.track.detach(attachedAudio);
          }
        attachedAudio.remove();
        } catch (error) {
          console.error("Error detaching audio track:", error);
        }
      }
    };
  }, [audioTrack]);

  // Handle thinking state based on agent state
  useEffect(() => {
    // Clear any existing timeout
    if (thinkingTimeoutRef.current) {
      clearTimeout(thinkingTimeoutRef.current);
      thinkingTimeoutRef.current = null;
    }

    if (state === "thinking") {
      // If the agent is thinking, show indicator after a short delay
      thinkingTimeoutRef.current = setTimeout(() => {
        setShowThinking(true);
      }, 500); // Small delay to avoid flashing for quick responses
    } else if (state === "speaking") {
      // When agent starts speaking, hide the thinking indicator
      setShowThinking(false);
    } else if (state === "connecting" && lastMessageTypeRef.current === "user") {
      // If agent is connecting after user spoke, show thinking indicator
      thinkingTimeoutRef.current = setTimeout(() => {
        setShowThinking(true);
      }, 1000);
    } else {
      setShowThinking(false);
    }

    return () => {
      if (thinkingTimeoutRef.current) {
        clearTimeout(thinkingTimeoutRef.current);
      }
    };
  }, [state]);

  useEffect(() => {
    const agentMessages: TranscriptionMessage[] = agentTranscriptions
      ? agentTranscriptions.map((t: TranscriptionSegment) => ({
          ...t,
          type: "agent",
        }))
      : [];
    const userMessages: TranscriptionMessage[] = userTranscriptions
      ? userTranscriptions.map((t: TranscriptionSegment) => ({
          ...t,
          type: "user",
        }))
      : [];
    const allMessages = [...agentMessages, ...userMessages].sort(
      (a, b) => a.firstReceivedTime - b.firstReceivedTime
    );
    
    setMessages(allMessages);
    
    // Track the last message type to help determine when to show thinking indicator
    if (allMessages.length > 0) {
      lastMessageTypeRef.current = allMessages[allMessages.length - 1].type;
      
      // Restore request detection logic based on window flags (set by parent)
      if (allMessages[allMessages.length - 1].type === "agent") {
        const lastAgentMessage = allMessages[allMessages.length - 1].text;
        if (lastAgentMessage) {
          // Commented out the internal checkers as the logic moved to parent
          // const isEmailRequest = checkIfMessageRequestsEmail(lastAgentMessage);
          // if (isEmailRequest) window.emailRequested = true;
          // const isResumeRequest = checkIfMessageRequestsResume(lastAgentMessage);
          // if (isResumeRequest) window.resumeRequested = true;
        }
      }
    }
    
    onStateChange(state);
  }, [agentTranscriptions, userTranscriptions, state, onStateChange]);

  // Auto-scroll the transcript container on new messages.
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTo({
        top: transcriptRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, showThinking]);

  useEffect(() => {
    return () => {
      // Cleanup function that runs on component unmount
      console.log("Component unmounting, cleaning up microphone...");
      // Stop any active microphone tracks
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          stream.getTracks().forEach(track => {
            track.stop();
            console.log("Stopped microphone track on unmount");
          });
        })
        .catch(err => console.error("Error stopping microphone on unmount:", err));
    };
  }, []);

  // Check if an email was sent and handle it
  useEffect(() => {
    const checkEmailSent = () => {
      if (window.emailSent && window.emailSent !== emailSentRef.current) {
        emailSentRef.current = window.emailSent;
        
        // Add a "system" message to the conversation about the email
        const emailSentMessage: TranscriptionMessage = {
          id: `email-sent-${Date.now()}`,
          text: `Got it! Your email has been saved. I'll continue to assist you.`,
          type: "agent",
          language: "en-US",
          startTime: Date.now(),
          endTime: Date.now(),
          final: true,
          firstReceivedTime: Date.now(),
          lastReceivedTime: Date.now(),
          receivedAtMediaTimestamp: Date.now(),
          receivedAt: Date.now()
        };
        
        setMessages(prev => [...prev, emailSentMessage]);
        
        // Clear the flag
        window.emailSent = undefined;
      }
    };
    
    // Check immediately and set up an interval
    checkEmailSent();
    const intervalId = setInterval(checkEmailSent, 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Effect to handle displaying job results markdown when received 
  useEffect(() => {
    if (jobResultsMarkdown) {
      console.log("Displaying job results markdown");
      const jobResultMessage: TranscriptionMessage = {
        id: `job-results-${Date.now()}`,
        text: `Okay, here are the job details I found:\n\n${jobResultsMarkdown}`,
        type: "agent", // Display as an agent message
        language: "en-US",
        startTime: Date.now(),
        endTime: Date.now(),
        final: true,
        firstReceivedTime: Date.now(),
        lastReceivedTime: Date.now(),
        receivedAtMediaTimestamp: Date.now(),
        receivedAt: Date.now()
      };

      // Add the message to the chat
      setMessages(prev => [...prev, jobResultMessage]);

      // Clear the markdown state in the parent
      setJobResultsMarkdown(null);
    }
  }, [jobResultsMarkdown, setJobResultsMarkdown]);

  return (
    // Use Tailwind for main layout
    <div className="h-full flex flex-col">
      {/* Transcript Section */} 
      <div 
        ref={transcriptRef}
        // Use Tailwind classes for flex, overflow, padding, background
        className="flex-1 overflow-auto p-4 pt-20 bg-transparent"
      >
        {/* Use Tailwind for inner container and spacing */}
        <div 
          className="max-w-2xl mx-auto w-full space-y-3 pb-24 flex flex-col items-stretch"
        >
          {messages.length === 0 && (
            // Use Tailwind for placeholder text styling
            <div 
              className="text-center py-10 text-gray-500 dark:text-gray-400 text-sm italic"
            >
              Your conversation will appear here.
            </div>
          )}
          <AnimatePresence mode="popLayout">
            {messages.map((msg, index) => (
              <Message 
                key={msg.id || index} 
                type={msg.type} 
                text={msg.text} 
              />
            ))}
            
            {showThinking && (
              <ThinkingIndicator key="thinking-indicator" />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Control Bar Section */} 
      <div
        // Use Tailwind for padding and background effect
        className="p-4 bg-transparent backdrop-blur-sm"
      >
        <div className="mb-4 flex justify-center">
          <CustomControlBar onEndCall={onEndCall} />
        </div>
      </div>
    </div>
  );
};

// Keep commented out helper functions for reference if needed
// const checkIfMessageRequestsEmail = ...
// const checkIfMessageRequestsResume = ...

export default SimpleVoiceAssistant;