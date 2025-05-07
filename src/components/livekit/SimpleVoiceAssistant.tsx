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
  const userSpeakerColor = "text-blue-500 dark:text-blue-300"; // Adjusted dark mode for user speaker
  const assistantSpeakerColor = "text-gray-500 dark:text-gray-400"; // Adjusted dark mode for assistant speaker
  
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
  const bgColor = "bg-white dark:bg-gray-800";
  const borderColor = "border-gray-200 dark:border-gray-700";
  const sessionId=room?.name;
  const handleDisconnect = async () => {
    console.log("Handle disconnect called, initiating immediate disconnect and UI update.");

    // 1. Disconnect from LiveKit Room immediately
    if (room) {
      try {
        room.disconnect();
        console.log("Disconnected from room (called from CustomControlBar).");
      } catch (e) {
        console.error("Error disconnecting room in CustomControlBar:", e);
      }
    }

    // 2. Call the onEndCall prop to trigger UI changes and further cleanup in LiveKitPage
    if (onEndCall) {
      onEndCall(); 
      console.log("onEndCall prop triggered from CustomControlBar.");
    }

    // 3. Send summary (fire and forget or handle errors without blocking UI)
    if(sessionId){
      fetch(`${process.env.NEXT_PUBLIC_SUMMARY_API_URL}/sendsummary`,{
        method:'POST',
        headers:{
          'Content-Type':'application/json'
        },
        body:JSON.stringify({room_id:sessionId}),
      }).then(()=>{
        console.log("Summary API call initiated.");
      }).catch((e)=>{
        console.error("Error initiating summary API call:",e);
      })
    }
  };

  return (
    <>
      <div 
        className={cn(
          // Changed w-full max-w-sm to w-fit to make the container hug its content
          "flex items-center w-fit mx-auto gap-2 sm:gap-4 rounded-md py-2 px-2 sm:px-4 border shadow-xs", 
          bgColor,
          borderColor
        )}
      >
        {/* Wrapper for LiveKit controls */}
        <div className="lk-voice-control-wrapper min-w-0"> 
          <VoiceAssistantControlBar 
            controls={{
              microphone: true,
              leave: false 
            }} 
          />
        </div>
        
        {/* End Call Button */}
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDisconnect}
          className="px-3 sm:px-5 py-2 h-9 sm:h-10 rounded-md font-normal shadow-sm flex-shrink-0" 
        >
          End Call
        </Button>
      </div>
    </>
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
      
      // Email request detection based on semantic understanding
      if (allMessages[allMessages.length - 1].type === "agent") {
        const lastAgentMessage = allMessages[allMessages.length - 1].text;
        
        // Check if the agent is explicitly requesting an email from context
        if (lastAgentMessage) {
          // Use an intent-based approach rather than just keywords
          // const isEmailRequest = checkIfMessageRequestsEmail(lastAgentMessage);
          
          // if (isEmailRequest) {
          //   console.log("Contextual email request detected");
          //   window.emailRequested = true;
          // }

          // const isResumeRequest = checkIfMessageRequestsResume(lastAgentMessage);
          // if (isResumeRequest) {
          //   console.log("Contextual resume request detected");
          //   window.resumeRequested = true;
          // }
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
        // Adjust padding for smaller screens
        className="flex-1 overflow-auto p-2 pt-16 sm:p-4 sm:pt-20 bg-transparent"
      >
        <div 
          // Allow full width on small screens, constrain on larger
          className="max-w-full sm:max-w-2xl mx-auto w-full space-y-3 pb-24 flex flex-col items-stretch"
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
                // Ensure text is trimmed before passing
                text={msg.text ? msg.text.trim() : ""} 
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
        className="p-4 bg-transparent"
      >
        <div className="mb-4 flex justify-center">
          <CustomControlBar onEndCall={onEndCall} />
        </div>
      </div>
    </div>
  );
};

// Helper function to check if a message is requesting an email based on context
// const checkIfMessageRequestsEmail = (message: string): boolean => {
//   message = message.toLowerCase();
  
//   const exclusionPatterns = [
//     /(email|address) (you|u) (submitted|provided|entered|gave)/i,
//     /(already|previously) (submitted|provided|entered|gave) (your|the) email/i,
//     /(email|address) (is|was) (already|now) (on file|recorded)/i
//   ];
  
//   for (const pattern of exclusionPatterns) {
//     if (pattern.test(message)) {
//       console.log("Exclusion pattern matched - not an email request");
//       return false;
//     }
//   }
//   // Check for our special marker first - highest priority detection
//   if (message.includes('[request_email]')) {
//     console.log("Detected direct [REQUEST_EMAIL] marker in message");
//     return true;
//   }
  
//   // Check for direct email requests with more sophisticated patterns
//   const emailRequestPatterns = [
//     // Question about providing email
//     /would you (like|want|mind|be willing) to (provide|share|give) your email/i,
//     /can (i|we) (have|get|collect) your email/i,
//     /your email (address|please)/i,
//     // Requests for sending something
//     /send you (a|the|this) (summary|transcript|record|recording|conversation)/i,
//     /email you (a|the|this) (summary|transcript|record|recording|conversation)/i,
//     // Statements of intent
//     /i('d| would) (like|love|want) to (send|email) you/i,
//     /i can send (it|this|that|the summary|the transcript) to your email/i,
//     // Direct requests
//     /please (provide|share|enter|type) your email/i,
//     /may i (have|ask for|request|get) your email/i
//   ];
  
//   // Test against each pattern
//   for (const pattern of emailRequestPatterns) {
//     if (pattern.test(message)) {
//       return true;
//     }
//   }
  
//   // Check for combination of keywords in context
//   const emailKeywords = ['email', 'send', 'address', 'contact', 'reach'];
//   const requestKeywords = ['would you', 'can i', 'please', 'could you', 'mind', 'would like'];
//   const purposeKeywords = ['summary', 'transcript', 'record', 'conversation', 'chat', 'interview', 'session'];
  
//   // Count how many of each category appears in the message
//   const emailCount = emailKeywords.filter(word => message.includes(word)).length;
//   const requestCount = requestKeywords.filter(word => message.includes(word)).length;
//   const purposeCount = purposeKeywords.filter(word => message.includes(word)).length;
  
//   // If we have matches in all three categories, likely a contextual email request
//   if (emailCount > 0 && requestCount > 0 && purposeCount > 0) {
//     return true;
//   }
  
//   // Check if message ends with a question mark and contains email
//   if (message.includes('email') && message.trim().endsWith('?')) {
//     return true;
//   }
  
//   return false;
// };

/**
 * Checks if a message from the assistant seems to be requesting a resume upload.
 * Uses similar logic to checkIfMessageRequestsEmail for robustness.
 * @param message The message string from the assistant.
 * @returns True if the message likely requests a resume upload, false otherwise.
 */
// const checkIfMessageRequestsResume = (message: string): boolean => {
//   if (!message) {
//     return false;
//   }

  // const lowerCaseMessage = message.toLowerCase();

  // --- Exclusion Patterns ---
  // Phrases indicating the resume was already received or isn't needed right now.
  // const exclusionPatterns = [
  //   /(resume|cv|document|file) (you|u) (uploaded|submitted|provided|attached|sent)/i,
  //   /(already|previously) (uploaded|submitted|provided|attached|sent) (your|the) (resume|cv)/i,
  //   /got (your|the) (resume|cv|document|file)/i,
  //   /(resume|cv) (is|was) (already|now) (uploaded|received|on file|submitted|saved)/i,
  //   /(don't need|no need for) (a|your) (resume|cv) (yet|now|at the moment)/i,
  //   // Added patterns for confirmation:
  //   /(thanks|thank you) for (uploading|sending|sharing|providing|submitting) (your|the)? (resume|cv)/i,
  //   /i('ve| have) (received|got|saved) (your|the) (resume|cv)/i,
  //   /(resume|cv|file) (successfully|received|saved)/i, // Covers "resume successfully uploaded", "file received", etc.
  //   /okay, (resume|cv) (uploaded|received|saved)/i,
  //   /confirming (receipt|reception) of (your|the) (resume|cv)/i,
  // ];

  // for (const pattern of exclusionPatterns) {
  //   if (pattern.test(lowerCaseMessage)) {
  //     console.log("Exclusion pattern matched - not a resume request:", pattern);
  //     return false;
  //   }
  // }

  // --- Direct Marker ---
  // Check for a specific marker first.
  // if (lowerCaseMessage.includes('[request_resume]')) {
  //   console.log("Detected direct [request_resume] marker in message");
  //   return true;
  // }

  // --- Direct Request Patterns ---
  // More specific regex patterns for common resume requests.
  // const resumeRequestPatterns = [
  //   // Asking for upload/attachment
  //   /(upload|attach|provide|share|send|submit) (your|a) (resume|cv|curriculum vitae)/i,
  //   /can (i|we) (have|get|see|review|receive) (your|a) (resume|cv)/i,
  //   /(your|a) (resume|cv) (please|would be helpful|is needed)/i,
  //   // Question about providing resume
  //   /would you (like|want|mind|be willing) to (upload|attach|provide|share|send|submit) (your|a) (resume|cv)/i,
  //   /do you have (a|your) (resume|cv) (available|to upload|you could share)/i,
  //   // Statements of need
  //   /i('d| would)? (need|like|require) (your|a) (resume|cv)/i,
  //   /we('ll| will) need (your|a) (resume|cv) for this/i,
  //   // Direct requests
  //   /please (upload|attach|provide|share|send|submit) (your|a) (resume|cv)/i,
  //   /may i (have|ask for|request|get) (your|a) (resume|cv)/i,
  // ];

  // Test against each specific pattern
  // for (const pattern of resumeRequestPatterns) {
  //   if (pattern.test(lowerCaseMessage)) {
  //     console.log("Direct resume request pattern matched:", pattern);
  //     return true;
  //   }
  // }

  // --- Keyword Combination Check ---
  // Less strict check based on keywords appearing together.
  // const resumeKeywords = ['resume', 'cv', 'curriculum vitae', 'document', 'file'];
  // const requestKeywords = ['upload', 'attach', 'provide', 'send', 'share', 'submit', 'need', 'require', 'get', 'request', 'ask for'];
  // // Optional: Purpose keywords might be less relevant here than for email, but could include:
  // const purposeKeywords = ['application', 'job', 'position', 'review', 'consideration', 'profile'];

  // const resumeCount = resumeKeywords.filter(word => lowerCaseMessage.includes(word)).length;
  // const requestCount = requestKeywords.filter(word => lowerCaseMessage.includes(word)).length;
  // // const purposeCount = purposeKeywords.filter(word => lowerCaseMessage.includes(word)).length;


  // Check if at least one resume keyword and one request keyword are present.
  // Adjust threshold as needed.
  // if (resumeCount > 0 && requestCount > 0) {
  //    console.log("Keyword combination matched for resume request.");
  //    return true;
  // }

  // --- Ending Question Mark Check ---
  // Check if message ends with a question mark and contains a resume keyword.
//   const endsWithQuestion = lowerCaseMessage.trim().endsWith('?');
//   if (endsWithQuestion && resumeCount > 0) {
//      console.log("Resume keyword found in a question.");
//      return true;
//   }

//   console.log("No resume request detected in message.");
//   return false;
// };

export default SimpleVoiceAssistant;
