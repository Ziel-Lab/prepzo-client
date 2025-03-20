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
  
  const handleDisconnect = async () => {
    console.log("Handle disconnect called, showing confirmation dialog");
    
    // Show confirmation dialog first
    const wantToFollowUpEmail = window.confirm("Do you want to catch up with us over email?");
    
    // Store response for later processing
    if (wantToFollowUpEmail) {
      // You could store this in localStorage or any other state management
      localStorage.setItem('prepzo_email_followup', 'true');
      console.log("User wants email follow-up");
    } else {
      console.log("User declined email follow-up");
    }
    
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
  );
};

const SimpleVoiceAssistant: React.FC<SimpleVoiceAssistantProps> = ({ onStateChange, onEndCall }) => {
  const { state, agentTranscriptions, audioTrack } = useSafeVoiceAssistant();
  const { segments: userTranscriptions } = useSafeTrackTranscription();

  const [messages, setMessages] = useState<TranscriptionMessage[]>([]);
  const [showThinking, setShowThinking] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const lastMessageTypeRef = useRef<"agent" | "user" | null>(null);
  const thinkingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

export default SimpleVoiceAssistant;
