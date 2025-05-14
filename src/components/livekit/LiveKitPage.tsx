"use client";
declare global {
  interface Window {
    emailRequested?: boolean;
    process: typeof process;
    liveKitRoom?: { disconnect: () => void };
    emailSent?: string;
    resumeRequested?: boolean;
  }
}

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  LiveKitRoom,
  useRoomContext,
} from "@livekit/components-react";
import "@livekit/components-styles";
import SimpleVoiceAssistant from "@/components/livekit/SimpleVoiceAssistant";
import { MediaDeviceFailure, RemoteParticipant, DataPacket_Kind, Room } from "livekit-client";
import type { ConnectionDetails } from "@/app/api/connection-details/route";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import SessionTimer from "@/utils/SessionTimer";
import { TimerIcon } from "lucide-react";
import FeedbackForm from '@/components/feedback/feedbackForm';

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
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <p className="font-bold text-red-500">
            Something went wrong with the LiveKit connection.
          </p>
          <p>Please try again later.</p>
        </div>
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
  const [roomKey, setRoomKey] = useState(Date.now());
  const { toast } = useToast();

  // State for the email popup
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [showResumeUpload, setShowResumeUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for job results markdown
  const [jobResultsMarkdown, setJobResultsMarkdown] = useState<string | null>(null);

  // State to temporarily ignore resume requests after successful upload
  const [ignoreResumeRequestsUntil, setIgnoreResumeRequestsUntil] = useState<number>(0);

  // State to hold the function for sending data via LiveKit (with topic)
  const [sendDataFn, setSendDataFn] = useState<((data: Uint8Array, topic?: string) => Promise<void>) | null>(null);

  // State to control timer visibility
  const [showTimer, setShowTimer] = useState(false);
  const [timerKey, setTimerKey] = useState(0); // Add this to force timer re-render
  const [showFeedback, setShowFeedback] = useState(false);

  // Add debug logging for feedback state
  useEffect(() => {
    console.log("[LiveKitPage] Feedback state changed:", { showFeedback, hasConnectionDetails: !!connectionDetails });
  }, [showFeedback, connectionDetails]);

  // Handlers are defined here, passed down to RoomContextManager
  const handleRequestEmail = useCallback(() => {
    console.log("[LiveKitPage] handleRequestEmail called. Setting showEmailInput to true.");
    setShowEmailInput(true);
  }, []);
  const handleRequestResumeUpload = useCallback(() => {
    if (Date.now() < ignoreResumeRequestsUntil) {
      console.log("Ignoring resume request signal shortly after upload.");
      return;
    }
    console.log("[LiveKitPage] handleRequestResumeUpload called. Setting showResumeUpload to true.");
    setShowResumeUpload(true);
  }, [ignoreResumeRequestsUntil]);
  
  // ***** REMOVE DATA HANDLER FROM HERE *****
  // const handleDataReceived = useCallback(...);

  // Function to handle agent state changes
  const handleAgentStateChange = (state: string) => {
    // Add this log to see all incoming states
    console.log("handleAgentStateChange received state:", state); 
    console.log("Current window flags:", { emailRequested: window.emailRequested, resumeRequested: window.resumeRequested });
    
    const markdownPrefix = "JOB_RESULTS_MARKDOWN:::";
    if (state.startsWith(markdownPrefix)) {
      const markdown = state.substring(markdownPrefix.length);
      console.log("Received job results markdown:", markdown);
      setJobResultsMarkdown(markdown);
      return;
    }

    // Restore checks for window flags and explicit states
    if (state === "email_requested" || window.emailRequested) {
      if(window.emailRequested) window.emailRequested = false;
      handleRequestEmail();
      return;
    }

    if (state === "resume_requested" || window.resumeRequested) {
      if(window.resumeRequested) window.resumeRequested = false;
      handleRequestResumeUpload();
      return;
    }
  };

  // Function to handle storing the email
  const handleSendEmail = async () => {
    if (!email || !email.includes('@')) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please enter a valid email address",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const sessionId = connectionDetails?.roomName;
      if (!sessionId) throw new Error('No active session');

      const cleanSessionId = sessionId.startsWith('voice_assistant_room_') 
        ? sessionId 
        : `voice_assistant_room_${sessionId}`;
      
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

      if (!response.ok) throw new Error('Failed to store email');

      if (typeof window !== 'undefined') localStorage.setItem('prepzo_user_email', email);
      
      setShowEmailInput(false);
      setEmail("");
      window.emailSent = email;
      
      toast({
        title: "Email Saved",
        description: "Your email has been saved successfully",
      });
    } catch (error) {
      console.error('Error storing email:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save your email. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadResume = async () => {
    // **** ADD VERY OBVIOUS LOG ****
    console.error("!!!!!!!!!!!!!!!! handleUploadResume ENTERED !!!!!!!!!!!!!!!!");
    // Log the call
    console.log("handleUploadResume CALLED. Selected file:", selectedFile, "showResumeUpload state:", showResumeUpload);
    
    // **** ADD GUARD ****
    // Only proceed if the popup is supposed to be shown
    if (!showResumeUpload) {
        console.warn("handleUploadResume called but showResumeUpload is false. Aborting.");
        return;
    }
    
    if (!selectedFile) {
      toast({
        variant: "destructive", 
        title: "No File Selected",
        description: "Please select a file to upload.",
      });
      return;
    }
  
    setIsUploading(true);
  
    try {
      const sessionId = connectionDetails?.roomName;
      if (!sessionId) throw new Error('No active session');
  
      const cleanSessionId = sessionId.startsWith('voice_assistant_room_')
        ? sessionId
        : `voice_assistant_room_${sessionId}`;
  
      const formData = new FormData();
      formData.append('resume', selectedFile);
      formData.append('session_id', cleanSessionId);
  
      const response = await fetch('/api/resume-uploads', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(errorData.message || 'Failed to upload resume');
      }
  
      setShowResumeUpload(false);
      setSelectedFile(null);
      setIgnoreResumeRequestsUntil(Date.now() + 3000);
  
      toast({
        title: "Resume Uploaded",
        description: "Your resume has been uploaded successfully.",
      });
  
    } catch (error: unknown) {
      console.error('Error uploading resume:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload your resume. Please try again.";
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: errorMessage,
      });
    } finally {
      setIsUploading(false);
      window.resumeRequested = false;
      console.log("[handleUploadResume] Finished, reset window.resumeRequested");
    }
  };

  const onDeviceFailure = (error?: MediaDeviceFailure) => {
    console.error(error);
    toast({
      variant: "destructive",
      title: "Error",
      description:
        "Error acquiring camera or microphone permissions. Please ensure permissions are granted.",
    });
  };

  const handleError = (error: Error) => {
    console.error("LiveKit error handled:", error);
    toast({
      variant: "destructive",
      title: "Connection Error",
      description: "We encountered an issue with the voice connection. Please try again later.",
    });

    updateConnectionDetails(undefined);
    setRoomKey(Date.now());

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
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to establish a connection. Please try again later.",
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
      // 1. Stop any active LiveKit tracks - ROOM DISCONNECT SHOULD HANDLE THIS

      // 2. Use getUserMedia to get and immediately stop all tracks
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => {
            track.stop();
            console.log("Forcefully stopped getUserMedia audio track:", track.id);
          });
        } catch (gumError) {
          if (gumError instanceof Error && (gumError.name === 'NotAllowedError' || gumError.name === 'NotFoundError')) {
            console.log("getUserMedia failed (likely no permission or device), skipping track stop.");
          } else {
            console.error("Error getting/stopping getUserMedia tracks:", gumError);
          }
        }
      } else {
        console.warn("navigator.mediaDevices.getUserMedia not supported, cannot stop tracks this way.");
      }

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
          console.log("Cleaned up audio element.");
        } catch (e) {
          console.error("Error cleaning up audio element:", e);
        }
      });

      // 4. Check permissions status (optional)
      if ("permissions" in navigator) {
        try {
          const status = await (navigator as any).permissions.query({ name: "microphone" });
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

    // Return a cleanup function that also runs on component unmount (e.g., SPA navigation away)
    return () => {
      console.log("[LiveKitPage] Unmounting - ensuring full disconnect.");
      if (window.liveKitRoom && typeof window.liveKitRoom.disconnect === 'function') {
        console.log("[LiveKitPage] Calling window.liveKitRoom.disconnect() on unmount.");
        window.liveKitRoom.disconnect();
      }
      forceStopAudioCapture(); // Ensure audio is stopped comprehensively
      window.onbeforeunload = originalBeforeUnload; // Restore original handler
    };
  }, []); // Empty dependency array ensures this runs once on mount and cleanup on unmount

  return (
    <div className="relative h-full w-full">
      {/* Restore potential background gradient if needed, assumed commented out */} 
      {/* <BackgroundGradient height="100%" zIndex="-1" /> */}
      <div className="flex h-full w-full flex-col justify-between">
        {!connectionDetails ? (
          <div className="flex h-full items-center justify-center text-lg text-gray-500">
            <p>Loading...</p>
          </div>
        ) : (
          <>
            {showTimer && (
              <SessionTimer 
                key={timerKey}
                className="absolute top-4 right-4 z-50" 
                initialMinutes={15} 
                onTimeUp={() => {
                  console.log("[LiveKitPage] Session timer ended, initiating disconnect.");
                  if (window.liveKitRoom && typeof window.liveKitRoom.disconnect === 'function') {
                    window.liveKitRoom.disconnect();
                  }
                  forceStopAudioCapture();
                  // Don't clear connectionDetails here, just show feedback
                  setShowFeedback(true);
                }}
              />
            )}
            <LiveKitErrorBoundary onError={handleError}>
              <LiveKitRoom
                key={roomKey}
                token={connectionDetails.participantToken}
                serverUrl={connectionDetails.serverUrl}
                connect={true}
                audio={{
                    echoCancellation: true,    // turn on echo cancellation
                    noiseSuppression: true,    // turn on noise suppression
                    autoGainControl: true,   // turn on auto gain control
                }}
                video={false}
                onMediaDeviceFailure={onDeviceFailure}
                onError={(error) => {
                  console.error("LiveKit error:", error);
                  setRoomKey(Date.now());
                  toast({
                    variant: "destructive",
                    title: "Connection Error",
                    description: "An error occurred with the LiveKit connection. Please try again.",
                  });
                }}
                onDisconnected={async () => {
                  console.log("[LiveKitPage] LiveKitRoom disconnected event triggered. Ensuring full cleanup and navigation.");
                  // Don't clear connectionDetails here, just show feedback
                  await forceStopAudioCapture();
                  setShowEmailInput(false);
                  setShowResumeUpload(false);
                  setSendDataFn(null);
                  setShowFeedback(true);
                }}
                className="flex h-full w-full flex-col"
              >
                <RoomContextManager 
                  setSendDataFn={setSendDataFn} 
                  handleRequestEmail={handleRequestEmail}
                  handleRequestResumeUpload={handleRequestResumeUpload}
                />
                
                <SimpleVoiceAssistant
                  onStateChange={handleAgentStateChange}
                  onEndCall={async () => {
                    console.log("[LiveKitPage] onEndCall triggered, showing feedback");
                    setShowFeedback(true);
                  }}
                  jobResultsMarkdown={jobResultsMarkdown}
                  setJobResultsMarkdown={setJobResultsMarkdown}
                  onLoadingComplete={() => {
                    console.log("Loading animation complete, starting timer");
                    setTimerKey(Date.now()); // Force timer re-render
                    setShowTimer(true);
                  }}
                />
              </LiveKitRoom>
            </LiveKitErrorBoundary>
            {showFeedback && connectionDetails && (
              <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50">
                <div className="w-full max-w-md p-4">
                  <FeedbackFormWrapper
                    roomId={connectionDetails.roomName}
                    onDone={() => {
                      console.log("[LiveKitPage] Feedback form done, clearing connection and closing");
                      updateConnectionDetails(undefined);
                      onClose();
                    }}
                    clearConnection={() => updateConnectionDetails(undefined)}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Email Input Popup Overlay - Clean White Background */}
      {showEmailInput && (
        <div
          className={cn(
            "absolute bottom-[120px] left-1/2 z-[100000] w-[90%] max-w-md -translate-x-1/2",
            // White background, black border
            "rounded-md border border-black bg-white p-4 shadow-lg" 
          )}
        >
          {/* Dark text color */}
          <p className="mb-3 text-center text-sm font-medium text-black">
            Please enter your email to stay connected
          </p>
          <div className="mb-3">
            <Input // shadcn Input
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              // Input style for light background
              className="h-10 rounded-md border-gray-300 text-black placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
              disabled={isSubmitting}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button // shadcn Button
              variant="ghost" 
              size="sm"
              onClick={() => {
                setShowEmailInput(false);
                window.emailRequested = false;
                console.log("[Email Popup] Cancelled, reset window.emailRequested");
              }}
              // Ghost button style for light background
              className="text-gray-700 hover:bg-gray-100"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button // shadcn Button (Primary action style - default)
              onClick={handleSendEmail} 
              size="sm"
              disabled={!email.includes('@') || isSubmitting}
              aria-disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      )}
      
      {/* Resume Upload Popup Overlay - Clean White Background & Improved UI */}
      {showResumeUpload && (
        <div
          className={cn(
            "absolute bottom-[120px] left-1/2 z-[100001] w-[90%] max-w-md -translate-x-1/2", 
            // White background, black border
            "rounded-md border border-black bg-white p-4 shadow-lg"
          )}
        >
          {/* Dark text color */}
          <p className="mb-3 text-center text-sm font-medium text-black">
            Please upload your resume (PDF, DOCX)
          </p>
          <div className="mb-3">
            <Input // shadcn Input for file
              id="resume-upload" 
              type="file"
              accept=".pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
              // File input styling for light background - match shadcn default look closer
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-gray-500 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-gray-900 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isUploading}
            />
            {selectedFile && (
              // Dark text color
              <p className="mt-2 text-xs text-gray-600">
                Selected: {selectedFile.name}
              </p>
            )}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button // shadcn Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowResumeUpload(false);
                setSelectedFile(null);
                window.resumeRequested = false;
                console.log("[Resume Popup] Cancelled, reset window.resumeRequested");
              }}
              // Ghost button style for light background
              className="text-gray-700 hover:bg-gray-100"
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button // shadcn Button (Primary action style - default)
              onClick={handleUploadResume}
              size="sm"
              disabled={!selectedFile || isUploading}
              aria-disabled={isUploading}
            >
              {isUploading ? (
                <>
                  {/* Spinner for light background button */}
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : "Upload"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// *** RESTORE RoomContextManager component DEFINITION ***
const RoomContextManager: React.FC<{
  setSendDataFn: React.Dispatch<React.SetStateAction<((data: Uint8Array, topic?: string) => Promise<void>) | null>>;
  handleRequestEmail: () => void;
  handleRequestResumeUpload: () => void;
}> = ({ setSendDataFn, handleRequestEmail, handleRequestResumeUpload }) => {
  // Call useRoomContext HERE
  const room = useRoomContext();

  // **** Use Refs for handlers ****
  const handleRequestEmailRef = useRef(handleRequestEmail);
  const handleRequestResumeUploadRef = useRef(handleRequestResumeUpload);

  // **** Update refs when props change ****
  useEffect(() => {
    handleRequestEmailRef.current = handleRequestEmail;
  }, [handleRequestEmail]);

  useEffect(() => {
    handleRequestResumeUploadRef.current = handleRequestResumeUpload;
  }, [handleRequestResumeUpload]);

  // Log the room object on render
  console.log("[RoomContextManager] Rendering, room object:", room);

  // useEffect for setting up sendDataFn
  useEffect(() => {
    if (room && room.localParticipant) {
      console.log("[RoomContextManager] Setting up sendDataFn.");
      const sender = async (data: Uint8Array, topic?: string) => {
        try {
          if (room.state !== 'connected') {
            console.warn(`[RoomContextManager] Attempted to send data signal while room state is ${room.state}. Aborting.`);
            throw new Error(`Cannot send data when room is not connected (state: ${room.state})`);
          }
          await room.localParticipant.publishData(data, { reliable: true, topic });
          console.log(`[RoomContextManager] Sent data signal. Topic: ${topic || 'none'}`);
        } catch (error) {
          console.error(`[RoomContextManager] Failed to send data signal (Topic: ${topic || 'none'}):`, error);
          throw error;
        }
      };
      setSendDataFn(() => sender);
    } else {
      console.log("[RoomContextManager] Clearing sendDataFn (room or local participant missing).");
      setSendDataFn(null);
    }
    return () => {
      console.log("[RoomContextManager] Cleaning up sendDataFn.");
      setSendDataFn(null);
    };
  }, [room, setSendDataFn]); // Depend on room and setter

  // useEffect for setting up dataReceived listener and exposing room
  useEffect(() => {
    console.log(`[RoomContextManager] Listener effect attempting run. Room state: ${room ? 'available' : 'unavailable'}`);
    if (!room) {
      console.log("[RoomContextManager] Listener effect exiting - room not available.");
      if (typeof window !== 'undefined') window.liveKitRoom = undefined; // Clear if room becomes null
      return; 
    }

    if (typeof window !== 'undefined') window.liveKitRoom = room; // Expose room instance
    
    console.log(`[RoomContextManager] Attaching dataReceived listener for room: ${room.name}`);
    const handleDataReceivedInternal = (
      payload: Uint8Array,
      participant?: RemoteParticipant,
      kind?: DataPacket_Kind,
      topic?: string
    ) => {
      console.log(`[RoomContextManager] Received data - Topic: ${topic}, From: ${participant?.identity}`);
      if (!participant) return;

      const decoder = new TextDecoder();
      let message = '';
      try {
        message = decoder.decode(payload);
      } catch (error) {
        console.error("[RoomContextManager] Error decoding data payload:", error);
        return;
      }

      if (topic === "email_request") {
        console.log("[RoomContextManager] Email request received:", message);
        // **** Call handler via ref ****
        handleRequestEmailRef.current(); 
      } else if (topic === "resume_request") {
        console.log("[RoomContextManager] Resume request received:", message);
        // **** Call handler via ref ****
        handleRequestResumeUploadRef.current(); 
      }
    };

    room.on('dataReceived', handleDataReceivedInternal);
    console.log(`[RoomContextManager] Successfully attached dataReceived listener.`);

    return () => {
      console.log(`[RoomContextManager] Cleaning up listener for room: ${room.name}`);
      room.off('dataReceived', handleDataReceivedInternal);
      if (typeof window !== 'undefined') window.liveKitRoom = undefined; // Clear on cleanup
      console.log(`[RoomContextManager] Successfully detached dataReceived listener.`);
    };
  }, [room]); // Depend ONLY on room

  return null; // This component doesn't render UI
};

function FeedbackFormWrapper({ roomId, onDone, clearConnection }: { roomId: string, onDone: () => void, clearConnection: () => void }) {
  return <FeedbackForm roomId={roomId} onDone={() => { clearConnection(); onDone(); }} />;
}

export default LiveKitPage;