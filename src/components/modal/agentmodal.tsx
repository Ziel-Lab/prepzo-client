"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RippleButton } from "@/components/ripple-button";
import { CheckCircle2, Lightbulb, Rocket, AlertTriangle, Info, LockKeyhole, ArrowLeft, ArrowRight } from "lucide-react";
import { useAuth } from '@/hooks/use-auth';
import { cn } from "@/lib/utils";

// Define backend URL
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTalking: () => void;
}

// Card Components
const OverviewCard: React.FC = () => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold">
      What You Can Do with Prepzo
    </h3>
    <ul className="space-y-3">
      {[
        {
          title: "Improve Your Resume",
          description: "Say: \"Hey, can you help improve my CV?\" → Get tailored edits and role-specific insights."
        },
        {
          title: "Practice for Interviews",
          description: "Ask for a mock interview in your domain. Get feedback, structure, and tips. Try this prompt: \"Run a mock interview for a senior marketing role\""
        },
        {
          title: "Plan Your Career Next Step",
          description: "Say: \"Map a 3-month learning path for me\" or \"How do I move into product from design?\""
        },
        {
          title: "Send Yourself a Summary",
          description: "At any point: \"Email me this session.\" Boom — it's in your inbox."
        },
        {
          title: "Think Through Work Problems",
          description: "From negotiation tactics to growth plateaus: just ask. \"How do I navigate a salary negotiation meeting with my manager?\""
        },
      ].map((item, index) => (
        <li key={index} className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-sm font-medium text-foreground">{item.title}</span>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </div>
        </li>
      ))}
    </ul>
  </div>
);

const SessionInfoCard: React.FC = () => (
  <div className="space-y-3">
    <h3 className="text-lg font-semibold flex items-center gap-2">
      <Lightbulb className="w-5 h-5 text-blue-500" />
      Before You Start
    </h3>
    <ul className="space-y-3">
      {[
        {
          title: "Stay on the same tab",
          description: "Don't refresh or close the browser to maintain context."
        },
        {
          title: "Resume uploads work via prompt",
          description: "After uploading, say: \"Here's my resume…\""
        },
        {
          title: "More detail = better responses",
          description: "Provide specific context for tailored advice."
        },
        {
          title: "Use \"Email this\" anytime",
          description: "Save key moments of your conversation to your inbox."
        },
      ].map((item, index) => (
        <li key={index} className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-sm font-medium text-foreground">{item.title}</span>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </div>
        </li>
      ))}
    </ul>
  </div>
);

const cardComponents = [OverviewCard, SessionInfoCard];

const AgentModal: React.FC<AgentModalProps> = ({
  isOpen,
  onClose,
  onStartTalking,
}) => {
  const router = useRouter();
  const { triggerAuthCheck, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [showPasswordEntry, setShowPasswordEntry] = useState(false);
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAwaitingRedirect, setIsAwaitingRedirect] = useState(false);

  // Reset state when modal is closed/opened
  useEffect(() => {
    if (!isOpen) {
      setShowPasswordEntry(false);
      setPassword('');
      setIsVerifying(false);
      setError(null);
      setCurrentStep(0); // Reset to first card
      setIsAwaitingRedirect(false); // Reset redirect state
    }
  }, [isOpen]);

  // Effect to handle redirection after auth check is triggered
  useEffect(() => {
    if (isAwaitingRedirect && !isAuthLoading && isAuthenticated) {
      router.push('/prepzo-session?verified=true');
      onClose(); // Close modal AFTER successful redirect initiation
      setIsAwaitingRedirect(false); // Reset state
    } else if (isAwaitingRedirect && !isAuthLoading && !isAuthenticated) {
      // Auth check completed but user is not authenticated
      console.error("AgentModal: Auth check completed, but user not authenticated post-verification.");
      setError("Authentication failed after verification. Please try again.");
      setIsAwaitingRedirect(false);
      setIsVerifying(false); // Reset verifying spinner from password input
    }
  }, [isAwaitingRedirect, isAuthLoading, isAuthenticated, router, onClose, setError]);

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
    setError(null); // Clear error on typing
  };

  const handleInitialButtonClick = () => {
    setError(null);
    setShowPasswordEntry(true);
  };

  const handleVerifyAndStart = async () => {
    if (!password) {
      setError("Password cannot be empty.");
      return;
    }
    setIsVerifying(true);
    setError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/api/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include', 
      });

      if (!response.ok) {
        let errorMsg = 'Invalid password. Please try again.';
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
        } catch (e) { /* Ignore JSON parsing error */ }
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      console.log('AgentModal: Password verification successful.');
      triggerAuthCheck(); 
      onStartTalking(); 
      setIsAwaitingRedirect(true); // Set state to await redirect decision from useEffect

    } catch (err: any) {
      console.error("AgentModal: Password verification error:", err);
      if (!error && err instanceof Error) {
         setError(err.message || 'An error occurred during verification.');
      }
      setIsVerifying(false); // Ensure verifying is reset on error
      setIsAwaitingRedirect(false); // Ensure redirect state is reset
    } finally {
      // setIsVerifying(false); // Moved to specific paths (success/error) to allow useEffect to use it
    }
  };
  
  const handleNextStep = () => {
    if (currentStep < cardComponents.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Reset showPasswordEntry if the modal is closed externally, also reset step
  useEffect(() => {
    if (!isOpen) {
      setShowPasswordEntry(false);
      setError(null);
      setPassword('');
      setIsVerifying(false);
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null; // Explicitly return null if not open, satisfying FC type
  }

  const CurrentCard = cardComponents[currentStep];

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
              <p className="text-sm text-muted-foreground flex items-center">
                <AlertTriangle className="w-4 h-4 text-red-500 mr-1.5 flex-shrink-0" />
                <span className="font-semibold text-primary dark:text-primary-foreground">Guide to using Prepzo.</span>
              </p>
            </div>
            <div className="flex-shrink-0">
              <img
                src="/media/prepzo-agent.png"
                alt="Prepzo AI Agent Illustration"
                className="w-20 h-20 md:w-32 md:h-32 object-contain"
              />
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Body - Now renders the current card */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
          <CurrentCard />
        </div>

        {/* Footer - Conditionally shows password input or step navigation/start button */}
        <DialogFooter className={cn(
            "w-full p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0 relative"
          )}
        >
          {showPasswordEntry ? (
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-3 w-full">
              <div className="relative w-full sm:flex-1 min-h-[60px] flex items-center">
                <div className="w-full">
                  <Label htmlFor="agent-modal-password" className="sr-only">Enter Password to Proceed</Label> 
                  <Input
                    id="agent-modal-password"
                    type="password"
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="Enter password to proceed"
                    required
                    className={cn(
                      "h-10 w-full", 
                      error ? 'border-destructive focus:ring-destructive pr-4' : 'border-input focus:ring-primary'
                    )}
                    aria-invalid={!!error}
                    aria-describedby={error ? 'password-modal-error' : undefined}
                    disabled={isVerifying}
                  />
                  {error && (
                    <div 
                      id="password-modal-error" 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-destructive flex items-center"
                    >
                    </div>
                  )}
                  {error && (
                    <div className="text-xs text-destructive mt-2 px-3 flex items-center absolute left-0 bottom-0 -mb-2">
                      {error}
                    </div>
                  )}
                </div>
              </div>
              <RippleButton
                className="group px-5 py-2 text-base bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-[0_0_15px_2px_rgba(180,180,255,0.3)] hover:shadow-[0_0_25px_5px_rgba(180,180,255,0.4)] 
                  transition-transform duration-300 ease-in-out hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:scale-100 
                  flex-shrink-0 h-10 w-full sm:w-auto" 
                onClick={handleVerifyAndStart}
                disabled={isVerifying || !password}
              >
                <LockKeyhole className="mr-2 h-5 w-5" />
                {isVerifying ? 'Verifying...' : 'Verify & Start'}
              </RippleButton>
            </div>
          ) : (
            <div className="w-full flex justify-between items-center">
              <RippleButton
                onClick={handlePrevStep}
                disabled={currentStep === 0}
                className={cn(
                  "px-4 py-2 text-sm",
                  "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground", 
                  currentStep === 0 ? "opacity-50 cursor-not-allowed" : "",
                  currentStep === cardComponents.length - 1 ? "opacity-75 px-2" : "",
                  "flex-shrink-0"
                )}
              >
                <ArrowLeft className={cn("h-4 w-4", currentStep < cardComponents.length - 1 ? "mr-2" : "")} />
                {currentStep < cardComponents.length - 1 && "Previous"}
              </RippleButton>

              {currentStep < cardComponents.length - 1 && (
                <div className="flex-1 mx-4">
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div 
                      className="h-2 bg-primary rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${((currentStep + 1) / cardComponents.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {currentStep < cardComponents.length - 1 ? (
                <RippleButton
                  onClick={handleNextStep}
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 flex-shrink-0"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </RippleButton>
              ) : (
                <RippleButton
                  className="group px-5 py-2 text-base bg-gradient-to-r from-green-800 to-green-950 text-white shadow-[0_0_15px_2px_rgba(200,200,255,0.3)] hover:shadow-[0_0_25px_5px_rgba(200,200,255,0.4)] 
                  transition-transform duration-300 ease-in-out hover:scale-105 flex-shrink-0"
                  onClick={handleInitialButtonClick} 
                >
                  <Rocket className="mr-2 h-5 w-5 group-hover:animate-vibrate" />
                  Great — Start Talking to Prepzo Now!
                </RippleButton>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AgentModal;
  