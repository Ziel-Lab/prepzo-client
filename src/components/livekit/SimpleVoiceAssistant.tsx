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
import { Box, Flex, VStack, Divider, useColorModeValue, IconButton, chakra } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPhoneOff } from "react-icons/fi";

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
const MotionBox = motion(Box);

const ThinkingIndicator = () => {
  const textColor = useColorModeValue("blue.500", "blue.300");
  
  return (
    <MotionBox
      width="full"
      textAlign="left"
      p="1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Flex>
        <chakra.div
          fontFamily="sans-serif"
          fontSize="xs"
          color={textColor}
          fontWeight="bold"
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
        </chakra.div>
      </Flex>
    </MotionBox>
  );
};

const Message: React.FC<{ 
  type: "agent" | "user"; 
  text: string;
  showDivider?: boolean;
}> = ({ type, text, showDivider = false }) => {
  const textColor = useColorModeValue("#333", "#ccc");
  const prefixColor = useColorModeValue(
    type === "agent" ? "blue.500" : "green.500", 
    type === "agent" ? "blue.300" : "green.300"
  );
  const dividerColor = useColorModeValue("gray.400", "gray.600");
  
  return (
    <MotionBox
      width="full"
      textAlign="left"
      pb={showDivider ? "0" : "1"}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 0 }}
    >
      <chakra.div
        fontFamily="sans-serif"
        fontSize="sm"
        color={textColor}
        whiteSpace="pre-wrap"
        pb="2"
      >
        <chakra.span color={prefixColor} fontWeight="bold" display="inline">
          {type === "agent" ? "Assistant: " : "You: "}
        </chakra.span>
        {text}
      </chakra.div>
      
      {showDivider && (
        <Divider borderColor={dividerColor} borderStyle="solid" opacity={0.7} mb="2" />
      )}
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
const CustomControlBar = () => {
  const room = useRoomContext();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  
  const handleDisconnect = () => {
    if (room) {
      room.disconnect();
    }
  };
  
  return (
    <Flex 
      justifyContent="center" 
      alignItems="center" 
      width="full"
      bg={bgColor}
      borderRadius="full"
      py="2"
      px="4"
      borderWidth="1px"
      borderColor={borderColor}
      boxShadow="sm"
    >
      <IconButton
        icon={<FiPhoneOff />}
        colorScheme="red"
        variant="solid"
        size="md"
        isRound
        aria-label="End call"
        onClick={handleDisconnect}
      />
      
      {/* Keep the original control bar for device settings but hide the disconnect button */}
      <Box sx={{
        "& .lk-disconnect-button": {
          display: "none",
        }
      }}>
        <VoiceAssistantControlBar 
          controls={{
            microphone: true,
            leave: false
          }} 
        />
      </Box>
    </Flex>
  );
};

const SimpleVoiceAssistant: React.FC<SimpleVoiceAssistantProps> = ({ onStateChange }) => {
  const { state, agentTranscriptions, audioTrack } = useSafeVoiceAssistant();
  const { segments: userTranscriptions } = useSafeTrackTranscription();

  const [messages, setMessages] = useState<TranscriptionMessage[]>([]);
  const [showThinking, setShowThinking] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const lastMessageTypeRef = useRef<"agent" | "user" | null>(null);
  const thinkingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Let the audio track create and attach its own audio element.
  useEffect(() => {
    if (!audioTrack) return; // Exit early if no audioTrack
    
    let attachedAudio: HTMLAudioElement | undefined;
    if (audioTrack?.publication?.track) {
      try {
        attachedAudio = new Audio();
        attachedAudio.style.display = "none";
        // Check if the track has an attach method before calling it
        if (typeof audioTrack.publication.track.attach === 'function') {
          audioTrack.publication.track.attach(attachedAudio);
          document.body.appendChild(attachedAudio);
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

  const bgGradient = useColorModeValue(
    "linear(to-t, gray.50, rgba(247, 250, 252, 0.9), rgba(247, 250, 252, 0))",
    "linear(to-t, gray.800, rgba(26, 32, 44, 0.9), rgba(26, 32, 44, 0))"
  );

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
          spacing="0" 
          pb="24"
          align="flex-start"
        >
          <AnimatePresence mode="popLayout">
            {messages.map((msg, index) => {
              // Show a divider when we transition from user to agent or vice versa
              const showDivider = index < messages.length - 1 && 
                                 messages[index + 1].type !== msg.type;
              
              return (
                <Message 
                  key={msg.id || index} 
                  type={msg.type} 
                  text={msg.text} 
                  showDivider={showDivider}
                />
              );
            })}
            
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
        bgGradient={bgGradient}
      >
        <Box mb="4">
          <CustomControlBar />
        </Box>
      </Box>
    </Flex>
  );
};

export default SimpleVoiceAssistant;
