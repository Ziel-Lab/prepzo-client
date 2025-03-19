"use client";

// Polyfill process for LiveKit if not available
if (typeof window !== 'undefined' && !window.process) {
  // Only provide the minimal process.env.NODE_ENV that LiveKit needs
  // Using unknown type to bypass TypeScript complaints about incomplete Process interface
  window.process = { env: { NODE_ENV: 'production' } } as unknown as typeof process;
}

import React, { useState, useCallback, useEffect } from "react";
import { LiveKitRoom } from "@livekit/components-react";
import "@livekit/components-styles";
import SimpleVoiceAssistant from "@/components/livekit/SimpleVoiceAssistant";
import { MediaDeviceFailure } from "livekit-client";
import type { ConnectionDetails } from "@/app/api/connection-details/route";
import { Box, Center, Text, useToast } from "@chakra-ui/react";

// Error boundary class component
class LiveKitErrorBoundary extends React.Component<
  { children: React.ReactNode, onError: (error: Error) => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode, onError: (error: Error) => void }) {
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
          <Text color="red.500" fontWeight="bold">Something went wrong with the LiveKit connection.</Text>
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
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [connectionDetails, updateConnectionDetails] = useState<ConnectionDetails | undefined>(undefined);
  const [roomKey, setRoomKey] = useState(Date.now()); // Add a key to force remount if needed
  const toast = useToast();

  const onDeviceFailure = (error?: MediaDeviceFailure) => {
    console.error(error);
    toast({
      title: "Error",
      description: "Error acquiring camera or microphone permissions. Please ensure permissions are granted.",
      status: "error",
      duration: 5000,
      isClosable: true,
    });
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const currentY = e.touches[0].clientY;
    if (touchStart !== null && currentY - touchStart > 100) {
      onClose();
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY > 0) {
      onClose();
    }
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
      const url = new URL(
        process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? "/api/connection-details",
        window.location.origin
      );
      const response = await fetch(url.toString());
      const connectionDetailsData = await response.json();
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
    onConnectButtonClicked();
  }, [onConnectButtonClicked]);

  return (
    <Box
      w="100%"
      h="100%"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      <Box w="100%" h="calc(100% - 3rem)">
        {!connectionDetails ? (
          <Center
            h="100%"
            fontSize="1.2rem"
            color="gray.500"
          >
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
              onDisconnected={() => {
                updateConnectionDetails(undefined);
                if (window.confirm("Do you want to catch up with us over email?")) {
                  // Optionally add logic for email follow-up here.
                }
                onClose();
              }}
              style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}
            >
              <SimpleVoiceAssistant onStateChange={() => {}} />
            </LiveKitRoom>
          </LiveKitErrorBoundary>
        )}
      </Box>
    </Box>
  );
};

export default LiveKitPage;
