"use client";

// Polyfill process for LiveKit if not available
if (typeof window !== 'undefined' && !window.process) {
  // Only provide the minimal process.env.NODE_ENV that LiveKit needs
  // Using unknown type to bypass TypeScript complaints about incomplete Process interface
  window.process = { env: { NODE_ENV: 'production' } } as unknown as typeof process;
}

// Declare custom window properties
declare global {
  interface Window {
    emailRequested?: boolean;
    process: typeof process;
    liveKitRoom?: { disconnect: () => void };
    emailSent?: string;
  }
}

import React, { useState, useCallback, useEffect } from "react";
import { LiveKitRoom } from "@livekit/components-react";
import "@livekit/components-styles";
import SimpleVoiceAssistant from "@/components/livekit/SimpleVoiceAssistant";
import { MediaDeviceFailure } from "livekit-client";
import type { ConnectionDetails } from "@/app/api/connection-details/route";
import { Box, Center, Text, useToast, Input, Button, Flex, useColorModeValue } from "@chakra-ui/react";
import { BackgroundGradient } from "@/components/gradients/background-gradient";

// Error boundary class component
class LiveKitErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (error: Error) => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("LiveKit error caught by boundary:", error);
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Center h="100%" flexDirection="column" gap={4}>
          <Text color="red.500" fontWeight="bold">
            Something went wrong with the LiveKit connection.
          </Text>
          <Text>Please try again later.</Text>
        </Center>
      );
    }

    return this.props.children;
  }
}

interface LiveKitPageProps {
  onClose: () => void;
}

const LiveKitPage: React.FC<LiveKitPageProps> = ({ onClose }) => {
  const [connectionDetails, updateConnectionDetails] = useState<ConnectionDetails | undefined>(undefined);
  const [roomKey, setRoomKey] = useState(Date.now()); // Add a key to force remount if needed
  const toast = useToast();

  // State for the email popup
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for job results markdown
  const [jobResultsMarkdown, setJobResultsMarkdown] = useState<string | null>(null);

  // Pre-calculate color mode values
  const dialogBgColor = useColorModeValue("white", "gray.800");
  const dialogBorderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.700", "gray.300");
  const inputBgColor = useColorModeValue("gray.50", "gray.700");
  const inputBorderColor = useColorModeValue("gray.300", "gray.600");
  const inputTextColor = useColorModeValue("gray.800", "white");
  const cancelButtonColor = useColorModeValue("gray.500", "gray.400");
  const cancelButtonHoverBg = useColorModeValue("gray.100", "gray.700");

  // State to track if we're checking for context-based email requests
  const [isCheckingForEmailRequest, setIsCheckingForEmailRequest] = useState(false);

  // Function to trigger email input display
  const handleRequestEmail = () => {
    setShowEmailInput(true);
  };

  // Function to trigger resume upload display
  const handleRequestResumeUpload = () => {
    // Logic to open resume upload modal
    console.log("Resume upload requested by agent.");
    // You can set a state here to open the modal in SimpleVoiceAssistant
  };

  // Function to handle agent state changes
  const handleAgentStateChange = (state: string) => {
    console.log("Voice assistant state changed:", state);
    
    // Check for job results markdown marker
    const markdownPrefix = "JOB_RESULTS_MARKDOWN:::";
    if (state.startsWith(markdownPrefix)) {
      const markdown = state.substring(markdownPrefix.length);
      console.log("Received job results markdown:", markdown);
      setJobResultsMarkdown(markdown);
      // Don't handle other states if this one matched
      return;
    }

    // Check if this is our custom email request event
    if (state === "email_requested") {
      handleRequestEmail();
      return; // Don't handle other states if this one matched
    }
    if (window.emailRequested) {
      window.emailRequested = false; // Reset the flag
      handleRequestEmail();
      return; // Don't handle other states if this one matched
    }

    // Check if this is our custom resume upload request event
    if (state === "resume_upload_requested") {
      handleRequestResumeUpload();
      return; // Don't handle other states if this one matched
    }
    
    // Now handle specific agent states for contextual prompting
    if (state === "idle" && isCheckingForEmailRequest) {
      // If we were waiting for a response and now got one, reset the flag
      setIsCheckingForEmailRequest(false);
    }
  };

  // Function to handle storing the email
  const handleSendEmail = async () => {
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Set loading state
    setIsSubmitting(true);
    
    try {
      // Get the current session ID from the LiveKit room
      const sessionId = connectionDetails?.roomName;
      if (!sessionId) {
        throw new Error('No active session');
      }

      // Extract just the room ID part if it's a voice assistant room
      const cleanSessionId = sessionId.startsWith('voice_assistant_room_') 
        ? sessionId 
        : `voice_assistant_room_${sessionId}`;
      
      // Call the API to store the email
      const response = await fetch('/api/store-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: cleanSessionId,
          recipient_email: email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to store email');
      }

      // Store the email for potential future use
      if (typeof window !== 'undefined') {
        localStorage.setItem('prepzo_user_email', email);
      }
      
      // Show success message
      toast({
        title: "Email Saved",
        description: "Your email has been saved successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      // Set a flag so the voice assistant knows the email was stored
      window.emailSent = email;
      
      setShowEmailInput(false);
      setEmail("");
    } catch (error) {
      console.error('Error storing email:', error);
      toast({
        title: "Error",
        description: "Failed to save your email. Please try again later.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDeviceFailure = (error?: MediaDeviceFailure) => {
    console.error(error);
    toast({
      title: "Error",
      description:
        "Error acquiring camera or microphone permissions. Please ensure permissions are granted.",
      status: "error",
      duration: 5000,
      isClosable: true,
    });
  };

  const handleError = (error: Error) => {
    console.error("LiveKit error handled:", error);
    toast({
      title: "Connection Error",
      description: "We encountered an issue with the voice connection. Please try again later.",
      status: "error",
      duration: 5000,
      isClosable: true,
    });

    // Reset connection on error and force a remount of the LiveKitRoom component
    updateConnectionDetails(undefined);
    setRoomKey(Date.now());

    // Wait a moment and try to reconnect
    setTimeout(() => {
      onConnectButtonClicked();
    }, 2000);
  };

  const onConnectButtonClicked = useCallback(async () => {
    try {
      console.log("Attempting to connect to LiveKit server...");
      const url = new URL(
        process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? "/api/connection-details",
        window.location.origin
      );
      console.log("Connection URL:", url.toString());

      // Use cache-busting query parameter
      url.searchParams.append("_", Date.now().toString());

      const response = await fetch(url.toString(), {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
      const connectionDetailsData = await response.json();
      console.log("Connection details received:", connectionDetailsData);
      updateConnectionDetails(connectionDetailsData);
    } catch (error) {
      console.error("Failed to fetch connection details:", error);
      toast({
        title: "Connection Error",
        description: "Failed to establish a connection. Please try again later.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [toast]);

  // Automatically fetch connection details when the component mounts.
  useEffect(() => {
    // Clear caches when the component mounts
    if ("caches" in window) {
      console.log("Clearing caches to ensure fresh connection...");

      // Clear fetch cache to ensure we get fresh connection details
      caches
        .keys()
        .then((cacheNames) => {
          cacheNames.forEach((cacheName) => {
            console.log(`Clearing cache: ${cacheName}`);
            caches.delete(cacheName);
          });
        })
        .catch((err) => console.error("Error clearing caches:", err));
    }

    // Clear localStorage items related to LiveKit if any
    try {
      const liveKitKeys = Object.keys(localStorage).filter(
        (key) => key.includes("livekit") || key.includes("voice") || key.includes("audio")
      );

      liveKitKeys.forEach((key) => {
        console.log(`Clearing localStorage key: ${key}`);
        localStorage.removeItem(key);
      });
    } catch (err) {
      console.error("Error clearing localStorage:", err);
    }

    // Get fresh connection details
    onConnectButtonClicked();
  }, [onConnectButtonClicked]);

  // Function to forcefully stop all audio capturing
  const forceStopAudioCapture = async () => {
    console.log("Forcefully stopping all audio capture");
    try {
      // 1. Stop any active LiveKit tracks
      if (
        typeof window !== "undefined" &&
        (window as unknown as { liveKitRoom?: { disconnect: () => void } }).liveKitRoom
      ) {
        try {
          (window as unknown as { liveKitRoom: { disconnect: () => void } }).liveKitRoom.disconnect();
          console.log("Forcefully disconnected LiveKit room from global reference");
        } catch (e) {
          console.error("Error forcefully disconnecting room:", e);
        }
      }

      // 2. Use getUserMedia to get and immediately stop all tracks
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => {
        track.stop();
        console.log("Forcefully stopped audio track:", track.id);
      });

      // 3. Find and stop all audio elements
      document.querySelectorAll("audio").forEach((el) => {
        try {
          if (el.srcObject) {
            const stream = el.srcObject as MediaStream;
            if (stream && typeof stream.getTracks === "function") {
              stream.getTracks().forEach((track) => track.stop());
            }
            el.srcObject = null;
          }
          el.pause();
          el.removeAttribute("src");
          el.load();
          el.remove();
        } catch (e) {
          console.error("Error cleaning up audio element:", e);
        }
      });

      // 4. Check permissions status
      if ("permissions" in navigator) {
        try {
          const status = await (navigator as unknown as {
            permissions: {
              query: (options: { name: string }) => Promise<{ state: string }>;
            };
          }).permissions.query({ name: "microphone" });
          console.log("Microphone permission status after cleanup:", status.state);
        } catch (e) {
          console.error("Error checking microphone permission status:", e);
        }
      }

      console.log("Audio capture cleanup completed");
      return true;
    } catch (e) {
      console.error("Error in forceStopAudioCapture:", e);
      return false;
    }
  };

  useEffect(() => {
    // Save the original unload handler if any
    const originalBeforeUnload = window.onbeforeunload;

    // Add our cleanup as a beforeunload handler to catch browser closes/refreshes
    window.onbeforeunload = function (e: BeforeUnloadEvent) {
      forceStopAudioCapture();
      // Call the original handler if it existed
      if (typeof originalBeforeUnload === "function") {
        return originalBeforeUnload.call(window, e);
      }
      return undefined;
    };

    return () => {
      // Restore the original handler when our component unmounts
      window.onbeforeunload = originalBeforeUnload;

      // Run cleanup when component unmounts
      forceStopAudioCapture();
    };
  }, []);

  return (
    <Box w="100%" h="100%" position="relative" zIndex="99999">
      <BackgroundGradient height="100%" zIndex="-1" />
      <Box w="100%" h="100%" display="flex" flexDirection="column" justifyContent="space-between">
        {!connectionDetails ? (
          <Center h="100%" fontSize="1.2rem" color="gray.500">
            <Text>Loading...</Text>
          </Center>
        ) : (
          <LiveKitErrorBoundary onError={handleError}>
            <LiveKitRoom
              key={roomKey} // Force remount if key changes
              token={connectionDetails.participantToken}
              serverUrl={connectionDetails.serverUrl}
              connect={true}
              audio={true}
              video={false}
              onMediaDeviceFailure={onDeviceFailure}
              onError={(error) => {
                console.error("LiveKit error:", error);
                // Force a remount of the LiveKitRoom component
                setRoomKey(Date.now());
                toast({
                  title: "Connection Error",
                  description: "An error occurred with the LiveKit connection. Please try again.",
                  status: "error",
                  duration: 5000,
                  isClosable: true,
                });
              }}
              onDisconnected={async () => {
                updateConnectionDetails(undefined);
                // Use our comprehensive cleanup function
                await forceStopAudioCapture();
                // Remove the popup dialog since it's now shown when End Call is clicked
                // onClose();
                setShowEmailInput(false);
              }}
              style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}
            >
              
              <SimpleVoiceAssistant
                onStateChange={handleAgentStateChange}
                onEndCall={() => {
                  console.log("End call button clicked, closing LiveKit page");
                  updateConnectionDetails(undefined);
                  onClose();
                }}
                jobResultsMarkdown={jobResultsMarkdown}
                setJobResultsMarkdown={setJobResultsMarkdown}
              />
            </LiveKitRoom>
          </LiveKitErrorBoundary>
        )}
      </Box>

      {/* Email Input Popup Overlay */}
      {showEmailInput && (
        <Box
          position="absolute"
          top="unset"
          bottom="120px"
          left="50%"
          transform="translateX(-50%)"
          bg={dialogBgColor}
          p={4}
          borderRadius="md"
          boxShadow="lg"
          zIndex="100000"
          width="90%"
          maxW="500px"
          backdropFilter="blur(10px)"
          borderWidth="1px"
          borderColor={dialogBorderColor}
        >
          <Text mb={3} fontWeight="medium" fontSize="md" textAlign="center" color={textColor}>
            Please enter your email to stay connected
          </Text>
          <Box mb={3}>
            <Input
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              size="md"
              bg={inputBgColor}
              borderColor={inputBorderColor}
              _hover={{ borderColor: "blue.300" }}
              _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
              color={inputTextColor}
              height="40px"
              borderRadius="md"
              isDisabled={isSubmitting}
            />
          </Box>
          <Flex justify="flex-end">
            <Button 
              variant="ghost" 
              onClick={() => setShowEmailInput(false)}
              mr={2}
              size="sm"
              color={cancelButtonColor}
              _hover={{ bg: cancelButtonHoverBg }}
              isDisabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendEmail} 
              colorScheme="blue"
              size="sm"
              isDisabled={!email.includes('@') || isSubmitting}
              isLoading={isSubmitting}
              loadingText="Submitting"
            >
              Submit
            </Button>
          </Flex>
        </Box>
      )}
    </Box>
  );
};

export default LiveKitPage;
