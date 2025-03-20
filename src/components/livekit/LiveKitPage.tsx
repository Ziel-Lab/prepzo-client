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
import { BackgroundGradient } from "@/components/gradients/background-gradient";

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
      url.searchParams.append('_', Date.now().toString());
      
      const response = await fetch(url.toString(), {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
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
    if ('caches' in window) {
      console.log('Clearing caches to ensure fresh connection...');
      
      // Clear fetch cache to ensure we get fresh connection details
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          console.log(`Clearing cache: ${cacheName}`);
          caches.delete(cacheName);
        });
      }).catch(err => console.error('Error clearing caches:', err));
    }
    
    // Clear localStorage items related to LiveKit if any
    try {
      const liveKitKeys = Object.keys(localStorage).filter(key => 
        key.includes('livekit') || key.includes('voice') || key.includes('audio')
      );
      
      liveKitKeys.forEach(key => {
        console.log(`Clearing localStorage key: ${key}`);
        localStorage.removeItem(key);
      });
    } catch (err) {
      console.error('Error clearing localStorage:', err);
    }
    
    // Get fresh connection details
    onConnectButtonClicked();
  }, [onConnectButtonClicked]);

  // Function to forcefully stop all audio capturing
  const forceStopAudioCapture = async () => {
    console.log("Forcefully stopping all audio capture");
    try {
      // 1. Stop any active LiveKit tracks
      if (typeof window !== 'undefined' && (window as unknown as { liveKitRoom?: { disconnect: () => void } }).liveKitRoom) {
        try {
          (window as unknown as { liveKitRoom: { disconnect: () => void } }).liveKitRoom.disconnect();
          console.log("Forcefully disconnected LiveKit room from global reference");
        } catch (e) {
          console.error("Error forcefully disconnecting room:", e);
        }
      }
      
      // 2. Use getUserMedia to get and immediately stop all tracks
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => {
        track.stop();
        console.log("Forcefully stopped audio track:", track.id);
      });
      
      // 3. Find and stop all audio elements
      document.querySelectorAll('audio').forEach(el => {
        try {
          if (el.srcObject) {
            const stream = el.srcObject as MediaStream;
            if (stream && typeof stream.getTracks === 'function') {
              stream.getTracks().forEach(track => track.stop());
            }
            el.srcObject = null;
          }
          el.pause();
          el.removeAttribute('src');
          el.load();
          el.remove();
        } catch (e) {
          console.error("Error cleaning up audio element:", e);
        }
      });
      
      // 4. Check permissions status
      if ('permissions' in navigator) {
        try {
          const status = await (navigator as unknown as { 
            permissions: { 
              query: (options: { name: string }) => Promise<{ state: string }> 
            } 
          }).permissions.query({ name: 'microphone' });
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
    window.onbeforeunload = function(e: BeforeUnloadEvent) {
      forceStopAudioCapture();
      // Call the original handler if it existed
      if (typeof originalBeforeUnload === 'function') {
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
    <Box 
      w="100%" 
      h="100%" 
      position="relative"
      zIndex="99999"
    >
      <BackgroundGradient height="100%" zIndex="-1" />
      <Box w="100%" h="100%" display="flex" flexDirection="column" justifyContent="space-between">
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
              onDisconnected={async () => {
                updateConnectionDetails(undefined);
                
                // Use our comprehensive cleanup function
                await forceStopAudioCapture();
                
                // Remove the popup dialog since it's now shown when End Call is clicked
                onClose();
              }}
              style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}
            >
              <SimpleVoiceAssistant 
                onStateChange={(state) => {
                  console.log("Voice assistant state changed:", state);
                }} 
                onEndCall={() => {
                  console.log("End call button clicked, closing LiveKit page");
                  updateConnectionDetails(undefined);
                  onClose();
                }}
              />
            </LiveKitRoom>
          </LiveKitErrorBoundary>
        )}
      </Box>
    </Box>
  );
};

export default LiveKitPage;
