"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  // DialogTrigger is handled externally
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RippleButton } from "@/components/ripple-button";
import { CheckCircle2, Lightbulb, Rocket, AlertTriangle, Info, LockKeyhole } from "lucide-react";
import { useAuth } from '@/hooks/use-auth';
import { cn } from "@/lib/utils";

// Define backend URL
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTalking: () => void;
}

const AgentModal: React.FC<AgentModalProps> = ({
  isOpen,
  onClose,
  onStartTalking,
}) => {
  const { triggerAuthCheck } = useAuth();
  const [showPasswordEntry, setShowPasswordEntry] = useState(false);
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal is closed/opened
  useEffect(() => {
    if (!isOpen) {
      setShowPasswordEntry(false);
      setPassword('');
      setIsVerifying(false);
      setError(null);
    }
  }, [isOpen]);

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
    setError(null); // Clear error on typing
  };

  const handleInitialButtonClick = () => {
    setError(null);
    setShowPasswordEntry(true); // Show password input instead of immediately starting
  };

  const handleVerifyAndStart = async () => {
    if (!password) {
      setError("Password cannot be empty.");
      return;
    }
    setIsVerifying(true);
    setError(null);
    try {
      // Target the Flask backend URL and include credentials
      const response = await fetch(`${BACKEND_URL}/api/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include', // Crucial for Flask session cookies
      });

      if (!response.ok) {
        let errorMsg = 'Invalid password. Please try again.';
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
        } catch (e) { /* Ignore JSON parsing error */ }
        setError(errorMsg);
        throw new Error(errorMsg); // Throw error to prevent further execution
      }

      // SUCCESS
      console.log('AgentModal: Password verification successful.');
      triggerAuthCheck(); // Refresh global auth state
      onStartTalking(); // Proceed to start LiveKit connection
      onClose(); // Close this modal

      // No need to reset state here as the modal closes

    } catch (err: any) {
      console.error("AgentModal: Password verification error:", err);
      // Error state is already set in the !response.ok block if applicable
      if (!error && err instanceof Error) { // Set general error if not already set
         setError(err.message || 'An error occurred during verification.');
      }
    } finally {
      setIsVerifying(false);
    }
  };
  
  // Reset showPasswordEntry if the modal is closed externally
  useEffect(() => {
    if (!isOpen) {
      setShowPasswordEntry(false);
      setError(null);
      setPassword('');
      setIsVerifying(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Custom Header Area */}
        <DialogHeader className="p-6 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1 space-y-1">
              <DialogTitle className="text-xl md:text-2xl lg:text-3xl font-bold leading-tight">
                Meet Prepzo — Your Personal AI Career Coach
              </DialogTitle>
              <p className="text-sm md:text-md text-muted-foreground text-left">
                Prepzo isn&apos;t just another chatbot. It&apos;s your career co-pilot — built to help you navigate work, job searches, upskilling, and everything in between.
              </p>
            </div>
            <div className="flex-shrink-0">
              {/* Ensure this path is correct relative to the public folder */}
              <img
                src="/media/prepzo-agent.png"
                alt="Prepzo AI Agent Illustration"
                className="w-20 h-20 md:w-32 md:h-32 object-contain"
              />
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
          {/* Quick Overview Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Quick Overview: What Can Prepzo Do for You?
            </h3>
            <ul className="space-y-2">
              {[
                "Help you find better jobs (and tailor your applications)",
                "Answer questions about skills, career moves, and job trends",
                "Coach you on interview prep, salary negotiations, and workplace situations",
                "Talk through career fears — from AI job disruption to job stagnation",
                "Summarize insights in an email you can keep for reference",
                "Brainstorm strategies to grow, lead, or reconnect with your team",
                "Help you plan when you feel demotivated, stuck, or lost at work",
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{item}</span>
                </li>
              ))}
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">Receive confirmation when your resume is successfully uploaded</span>
              </li>
            </ul>
          </div>

          {/* Important Session Info Section - Added */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Important Session Info
            </h3>
            <div className="bg-amber-50 dark:bg-amber-900/30 border-l-4 border-amber-400 dark:border-amber-600 p-4 rounded-md space-y-2">
              <p className="text-sm text-muted-foreground font-medium">
                Please <span className="font-bold text-amber-700 dark:text-amber-400">do not refresh</span> your browser tab during the session, as this will end your current conversation.
              </p>
              <p className="text-sm text-muted-foreground">
                If you accidentally get disconnected (e.g., network issues, power outage), don&apos;t worry! You can simply <span className="font-semibold">rejoin the session</span> using the same link or button.
              </p>
            </div>
          </div>

          {/* Try Asking Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Try Asking Prepzo:
            </h3>
            <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-400 dark:border-blue-600 p-4 rounded-md space-y-1">
              <p className="italic text-sm text-muted-foreground">“What kind of jobs fit my skills right now?”</p>
              <p className="italic text-sm text-muted-foreground">“I want to switch industries. What should I learn first?”</p>
              <p className="italic text-sm text-muted-foreground">“How can I talk to my manager about a promotion?”</p>
              <p className="italic text-sm text-muted-foreground">“Is AI going to replace my job in marketing?”</p>
              <p className="italic text-sm text-muted-foreground">“Can you email me a plan to improve my career this quarter?”</p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
              <Lightbulb className="w-3 h-3" />
              <span className="font-semibold">Tip:</span> The more honest and personal your questions, the better Prepzo can help.
            </p>
            <p className="mt-3 text-xs text-muted-foreground flex items-start gap-1">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" /> 
              <span><span className="font-semibold">When Uploading:</span> Please let Prepzo know once your resume is uploaded by saying something like "My resume is uploaded" rather than just "Done".</span>
            </p>
          </div>
        </div>

        {/* Footer - Conditionally shows password input or start button */}
        <DialogFooter className={cn(
            "w-full p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-shrink-0 relative", // Added relative for error positioning
            // Responsive layout: Stack vertically by default, horizontal on sm+ screens
            showPasswordEntry ? "flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-3" : "justify-center" 
          )}
        >
          {showPasswordEntry ? (
            <>
              <Label htmlFor="agent-modal-password" className="sr-only">Enter Password to Proceed</Label> 
              <Input
                id="agent-modal-password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter password to proceed"
                required
                className={cn(
                  "h-10 w-full sm:flex-1", // Full width on mobile, flexible on larger
                  error ? 'border-destructive focus:ring-destructive' : 'border-input focus:ring-primary'
                )}
                aria-invalid={!!error}
                aria-describedby={error ? 'password-modal-error' : undefined}
                disabled={isVerifying}
              />
              <RippleButton
                className="group px-5 py-2 text-base bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-[0_0_15px_2px_rgba(180,180,255,0.3)] hover:shadow-[0_0_25px_5px_rgba(180,180,255,0.4)] 
                  transition-transform duration-300 ease-in-out hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:scale-100 
                  flex-shrink-0 h-10 w-full sm:w-auto" // Full width on mobile, auto on larger
                onClick={handleVerifyAndStart}
                disabled={isVerifying || !password}
              >
                <LockKeyhole className="mr-2 h-5 w-5" />
                {isVerifying ? 'Verifying...' : 'Verify & Start'}
              </RippleButton>
              {/* Error positioned below input/button */}
              {error && (
                <p id="password-modal-error" className="text-sm text-destructive text-center w-full pt-1">
                  {error}
                </p>
              )}
            </>
          ) : (
            // Initial "Start Talking" Button
            <RippleButton
              className="group mx-auto px-5 py-2 text-base bg-gradient-to-r from-green-800 to-green-950 text-white shadow-[0_0_15px_2px_rgba(200,200,255,0.3)] hover:shadow-[0_0_25px_5px_rgba(200,200,255,0.4)] 
              transition-transform duration-300 ease-in-out hover:scale-105"
              onClick={handleInitialButtonClick}
            >
              <Rocket className="mr-2 h-5 w-5 group-hover:animate-vibrate" />
              Great — Start Talking to Prepzo Now!
            </RippleButton>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AgentModal;
  