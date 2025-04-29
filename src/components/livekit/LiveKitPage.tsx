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
    resumeRequested?: boolean;
  }
}

import React, { useState, useCallback, useEffect } from "react";
import {
  LiveKitRoom,
  useRoomContext,
} from "@livekit/components-react";
import "@livekit/components-styles";
import SimpleVoiceAssistant from "@/components/livekit/SimpleVoiceAssistant";
import { MediaDeviceFailure } from "livekit-client";
import type { ConnectionDetails } from "@/app/api/connection-details/route";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

// Helper component to access room context and provide sender function
const RoomDataProvider: React.FC<{ 
  setSendDataFn: React.Dispatch<React.SetStateAction<((data: Uint8Array) => Promise<void>) | null>> 
}> = ({ setSendDataFn }) => {
  const room = useRoomContext();

  useEffect(() => {
    if (room && room.localParticipant) {
      // Define the sender function using the current room context
      const sender = async (data: Uint8Array) => {
        try {
          await room.localParticipant.publishData(data, { reliable: true });
          console.log("Sent data signal via RoomDataProvider.");
        } catch (error) {
          console.error("Failed to send data signal via RoomDataProvider:", error);
          throw error; // Re-throw so the caller can handle it (e.g., show toast)
        }
      };
      // Update the parent state with this sender function
      setSendDataFn(() => sender);
    } else {
      // Clear the sender function if the room is not available
      setSendDataFn(null);
    }

    // Cleanup: clear the function when the component unmounts or room changes
    return () => {
      setSendDataFn(null);
    };
  }, [room, setSendDataFn]); // Dependencies: room and the setter function

  return null; // This component does not render anything itself
};

const LiveKitPage: React.FC<LiveKitPageProps> = ({ onClose }) => {
  const [connectionDetails, updateConnectionDetails] = useState<ConnectionDetails | undefined>(undefined);
  const [roomKey, setRoomKey] = useState(Date.now()); // Add a key to force remount if needed
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

  // State to hold the function for sending data via LiveKit
  const [sendDataFn, setSendDataFn] = useState<((data: Uint8Array) => Promise<void>) | null>(null);

  // State to track if we're checking for context-based email requests
  const [isCheckingForEmailRequest, setIsCheckingForEmailRequest] = useState(false);

  // Function to trigger email input display
  const handleRequestEmail = () => {
    setShowEmailInput(true);
  };

  // Function to trigger resume upload display
  const handleRequestResumeUpload = () => {
    // Logic to open resume upload modal
    // Check if we should ignore the request temporarily
    if (Date.now() < ignoreResumeRequestsUntil) {
      console.log("Ignoring resume request signal shortly after upload.");
      return;
    }
    console.log("Resume upload requested by agent.");
    setShowResumeUpload(true);
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
    if (state === "resume_requested") {
      handleRequestResumeUpload();
      return; // Don't handle other states if this one matched
    }
    if (window.resumeRequested) {
      window.resumeRequested = false; // Reset the flag
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
        variant: "destructive",
        title: "Invalid Email",
        description: "Please enter a valid email address",
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
      
      // Hide the popup and clear state immediately on success
      setShowEmailInput(false);
      setEmail("");
      // Set a flag so the voice assistant knows the email was stored
      window.emailSent = email;
      
      // Show success message
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
      if (!sessionId) {
        throw new Error('No active session');
      }
      const cleanSessionId = sessionId.startsWith('voice_assistant_room_')
        ? sessionId
        : `voice_assistant_room_${sessionId}`;

      const formData = new FormData();
      formData.append('resume', selectedFile);
      formData.append('session_id', cleanSessionId);

      // *** IMPORTANT: Replace with your actual API endpoint ***
      const response = await fetch('/api/resume-uploads', {
        method: 'POST',
        body: formData,
        // Note: Don't set Content-Type header when using FormData,
        // the browser sets it automatically with the correct boundary.
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(errorData.message || 'Failed to upload resume');
      }

      // Hide the popup and clear selection immediately on success
      setShowResumeUpload(false);
      setSelectedFile(null);
      // Ignore further resume requests for a short period
      setIgnoreResumeRequestsUntil(Date.now() + 3000); // Ignore for 3 seconds

      // --- Use sendDataFn from state to send signal to agent --- 
      if (sendDataFn) {
        try {
          const payload = JSON.stringify({ type: "resume_upload_success" });
          const encoder = new TextEncoder();
          await sendDataFn(encoder.encode(payload)); // Use the function from state
          console.log("Sent resume_upload_success signal to agent via sendDataFn.");
        } catch (error) {
          console.error("Failed to send resume_upload_success signal via sendDataFn:", error);
          // Optionally, inform the user that the signal failed, but upload was ok
          toast({
            variant: "default",
            title: "Upload Success, Signal Failed",
            description: "Resume uploaded, but couldn't notify the agent automatically. Please mention the upload.",
          });
        }
      } else {
        console.warn("LiveKit room context not available, cannot send resume_upload_success signal.");
        // Inform user upload was ok, but signal failed
         toast({
            variant: "default",
            title: "Upload Success, Agent Not Notified",
            description: "Resume uploaded, but the agent might not be aware yet. Please mention the upload.",
          });
      }
      // --- END OF MODIFIED PART ---

      toast({
        title: "Resume Uploaded",
        description: "Your resume has been uploaded successfully.",
      });

      // Optionally, inform the voice assistant that the upload was successful
      // This might involve sending a message back through LiveKit or setting a window flag

    } catch (error: unknown) {
      console.error('Error uploading resume:', error);
      // Determine the message to show
      let errorMessage = "Failed to upload your resume. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: errorMessage,
      });
    } finally {
      setIsUploading(false);
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
    <div className="relative z-[99999] h-full w-full">
      {/* Assuming BackgroundGradient exists or remove this line */}
      {/* <BackgroundGradient height="100%" zIndex="-1" /> */}
      <div className="flex h-full w-full flex-col justify-between">
        {!connectionDetails ? (
          <div className="flex h-full items-center justify-center text-lg text-gray-500">
            <p>Loading...</p>
          </div>
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
              onError={(error: Error) => {
                console.error("LiveKit error:", error);
                // Force a remount of the LiveKitRoom component
                setRoomKey(Date.now());
                toast({
                  variant: "destructive",
                  title: "Connection Error",
                  description: "An error occurred with the LiveKit connection. Please try again.",
                });
              }}
              onDisconnected={async () => {
                updateConnectionDetails(undefined);
                // Use our comprehensive cleanup function
                await forceStopAudioCapture();
                // Remove the popup dialog since it's now shown when End Call is clicked
                // onClose();
                setShowEmailInput(false);
                setShowResumeUpload(false);
                setSendDataFn(null); // Clear send function on disconnect
              }}
              className="flex h-full w-full flex-col"
            >
              {/* Render the helper component inside LiveKitRoom to get context */}
              <RoomDataProvider setSendDataFn={setSendDataFn} />
              
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
      </div>

      {/* Email Input Popup Overlay - Converted to Tailwind/Shadcn */}
      {showEmailInput && (
        <div
          className={cn(
            "absolute bottom-[120px] left-1/2 z-[100000] w-[90%] max-w-md -translate-x-1/2",
            "rounded-md border bg-background/80 p-4 shadow-lg backdrop-blur-lg dark:bg-background/80"
          )}
        >
          <p className="mb-3 text-center text-sm font-medium text-foreground"> 
            Please enter your email to stay connected
          </p>
          <div className="mb-3">
            <Input
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} // Added type
              className="h-10 rounded-md" 
              disabled={isSubmitting}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowEmailInput(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
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

      {/* Resume Upload Popup Overlay - Converted to Tailwind/Shadcn */}
      {showResumeUpload && (
        <div
          className={cn(
            "absolute bottom-[120px] left-1/2 z-[100001] w-[90%] max-w-md -translate-x-1/2", 
            "rounded-md border bg-background/80 p-4 shadow-lg backdrop-blur-lg dark:bg-background/80"
          )}
        >
          <p className="mb-3 text-center text-sm font-medium text-foreground">
            Please upload your resume (PDF, DOCX)
          </p>
          <div className="mb-3">
            <Input
              type="file"
              accept=".pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedFile(e.target.files ? e.target.files[0] : null)} // Added type
              className="h-10 rounded-md file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" 
              disabled={isUploading}
            />
            {selectedFile && (
              <p className="mt-1 text-xs text-muted-foreground">
                Selected: {selectedFile.name}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowResumeUpload(false);
                setSelectedFile(null); 
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadResume}
              size="sm"
              disabled={!selectedFile || isUploading}
              aria-disabled={isUploading}
            >
               {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveKitPage;
