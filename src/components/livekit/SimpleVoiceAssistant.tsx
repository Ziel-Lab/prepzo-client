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
import { Box, Flex, Text, VStack, useColorModeValue, Button } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";

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

// Message component with Chakra UI + Framer Motion
const MotionBox = motion.create(Box);

const ThinkingIndicator = () => {
  const textColor = useColorModeValue("blue.500", "blue.300");
  const bgColor = useColorModeValue("gray.50", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  
  return (
    <MotionBox
      width="full"
      display="flex"
      justifyContent="flex-start"
      mb="2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Box
        px="4"
        py="2.5"
        borderRadius="md"
        bg={bgColor}
        borderWidth="1px"
        borderColor={borderColor}
        boxShadow="xs"
      >
        <Box 
          as="span" 
          fontWeight="medium" 
          display="block" 
          fontSize="xs" 
          mb="1"
          color="gray.500"
          letterSpacing="tight"
        >
          Assistant
        </Box>
        <Text
          fontSize="sm"
          color={textColor}
          fontWeight="medium"
          height="1.2em"
          lineHeight="short"
        >
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
        </Text>
      </Box>
    </MotionBox>
  );
};

const Message: React.FC<{ 
  type: "agent" | "user"; 
  text: string;
}> = ({ type, text }) => {
  const isUser = type === "user";
  
  // Refined, minimalistic colors
  const userBgColor = useColorModeValue("blue.50", "blue.900");
  const assistantBgColor = useColorModeValue("gray.50", "gray.800");
  const userBorderColor = useColorModeValue("blue.200", "blue.700");
  const assistantBorderColor = useColorModeValue("gray.200", "gray.700");
  const userTextColor = useColorModeValue("gray.700", "white");
  const assistantTextColor = useColorModeValue("gray.700", "white");
  
  return (
    <MotionBox
      width="full"
      display="flex"
      justifyContent={isUser ? "flex-end" : "flex-start"}
      mb="2"
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Box
        maxWidth="75%"
        bg={isUser ? userBgColor : assistantBgColor}
        color={isUser ? userTextColor : assistantTextColor}
        px="4"
        py="2.5"
        borderRadius="md"
        borderWidth="1px"
        borderColor={isUser ? userBorderColor : assistantBorderColor}
        boxShadow="xs"
      >
        <Box 
          as="span" 
          fontWeight="medium" 
          display="block" 
          fontSize="xs" 
          mb="1"
          color={isUser ? "blue.500" : "gray.500"}
          letterSpacing="tight"
        >
          {isUser ? "You" : "Assistant"}
        </Box>
        <Text
          fontSize="sm"
          whiteSpace="pre-wrap"
          lineHeight="short"
        >
          {text}
        </Text>
      </Box>
    </MotionBox>
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

// Custom Control Bar with End Call Icon
const CustomControlBar = ({ onEndCall }: { onEndCall?: () => void }) => {
  const room = useRoomContext();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  
  // Add state for email collection
  
  
  
  
  
  
  
  const handleDisconnect = async () => {
    console.log("Handle disconnect called, showing confirmation dialog");
    
    // Show email input dialog
    
    
    // Legacy code: prompt for email input using window.prompt
    // This is now replaced with the custom dialog
    /*
    const email = window.prompt("Please enter your email to catch up with us:");
    
    // Store response for later processing
    if (email) {
      // You could store this in localStorage or any other state management
      localStorage.setItem('prepzo_user_email', email);
      console.log("User provided email for follow-up:", email);
    } else {
      console.log("User declined to provide an email for follow-up");
    }
    */
    
    // Log and proceed with disconnection
    console.log("Now stopping all audio capture");
    
    // Immediately stop all live tracks before doing anything else
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
    
    // Function to stop all microphone tracks
    const stopAllMicrophoneTracks = async () => {
      // Try to revoke microphone permissions or at least stop all tracks
      try {
        // First attempt: Get a list of all media devices to ensure we can stop them
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log(`Found ${devices.length} media devices`);
        
        // Second attempt: Create and immediately stop a new stream to force permission reset
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
          console.log("Explicitly stopped track:", track.id);
        });
        
        // Third attempt: Find any MediaRecorder instances that might be running
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
      
      // Additionally, try to stop any Audio Context if it exists
      if (typeof window !== 'undefined') {
        try {
          // Fourth attempt: Close any audio contexts
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
    
    // First, disconnect the room before anything else
    if (room) {
      try {
        room.disconnect();
        console.log("Disconnected from room");
      } catch (e) {
        console.error("Error disconnecting room:", e);
      }
    }
    
    // Then stop all microphone tracks
    await stopAllMicrophoneTracks();
    
    // Force garbage collection of audio elements by nullifying references
    if (typeof window !== 'undefined') {
      // Find and remove any audio elements that might have been created
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach(el => {
        try {
          // Remove src and srcObject
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
          el.load(); // Forces cleanup
          el.remove(); // Remove from DOM
          console.log("Removed audio element from DOM");
        } catch (e) {
          console.error("Error cleaning up audio element:", e);
        }
      });
    }
    
    // Call the onEndCall callback if provided
    if (onEndCall) {
      // Add a small delay to ensure all cleanup has completed
      setTimeout(() => {
        if (onEndCall) onEndCall();
      }, 100);
    }
  };
  
  return (
    <>
      <Flex 
        justifyContent="space-between" 
        alignItems="center" 
        width="auto"
        minWidth="300px"
        maxWidth="450px"
        mx="auto"
        bg={bgColor}
        borderRadius="md"
        py="2"
        px="6"
        borderWidth="1px"
        borderColor={borderColor}
        boxShadow="xs"
      >
        {/* Keep the original control bar for device settings but hide the disconnect button */}
        <Box 
          sx={{
            "& .lk-disconnect-button": {
              display: "none",
            },
            "& .lk-control-bar": {
              padding: 0,
              minWidth: "180px",
              width: "180px",
            }
          }}
          width="180px"
        >
          <VoiceAssistantControlBar 
            controls={{
              microphone: true,
              leave: false
            }} 
          />
        </Box>
        
        <Button
          colorScheme="red"
          variant="solid"
          size="md"
          borderRadius="md"
          aria-label="End call"
          onClick={handleDisconnect}
          ml={3}
          px={6}
          py={2}
          height="auto"
          fontWeight="normal"
          color="white"
          bg="#E53E3E"
          _hover={{ bg: "#C53030" }}
          boxShadow="0px 1px 2px rgba(0, 0, 0, 0.2)"
        >
          End Call
        </Button>
      </Flex>
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
    <Flex height="100%" flexDirection="column">
      {/* Transcript Section */}
      <Box 
        flex="1" 
        overflow="auto" 
        p="4" 
        pt="20"
        ref={transcriptRef}
        bg="transparent"
      >
        <VStack 
          maxWidth="2xl" 
          mx="auto" 
          width="full" 
          spacing="3" 
          pb="24"
          align="stretch"
        >
          {messages.length === 0 && (
            <Box 
              textAlign="center" 
              py="10" 
              color="gray.500" 
              fontSize="sm"
              fontStyle="italic"
            >
              Your conversation will appear here.
            </Box>
          )}
          <AnimatePresence mode="popLayout">
            {messages.map((msg, index) => (
              <Message 
                key={msg.id || index} 
                type={msg.type} 
                text={msg.text} 
              />
            ))}
            
            {/* Show thinking indicator when needed */}
            {showThinking && (
              <ThinkingIndicator key="thinking-indicator" />
            )}
          </AnimatePresence>
        </VStack>
      </Box>

      {/* Control Bar Section */}
      <Box
        p="4"
        bg="transparent"
        backdropFilter="blur(4px)"
      >
        <Box mb="4" display="flex" justifyContent="center">
          <CustomControlBar onEndCall={onEndCall} />
        </Box>
      </Box>
    </Flex>
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
