"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  // DialogTrigger is handled externally
} from "@/components/ui/dialog";
import { RippleButton } from "@/components/ripple-button";
import { CheckCircle2, Lightbulb, Rocket, AlertTriangle, Info } from "lucide-react"; // Using Lucide icons and added AlertTriangle and Info

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
              <p className="text-sm md:text-md text-muted-foreground">
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

        {/* Footer - Button is group, icon has constant pulse */}
        <DialogFooter className="w-full p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-shrink-0">
          <RippleButton
            className="group mx-auto px-5 py-2 text-base bg-gradient-to-r from-green-800 to-green-950 text-white shadow-[0_0_15px_2px_rgba(200,200,255,0.3)] hover:shadow-[0_0_25px_5px_rgba(200,200,255,0.4)] 
            transition-transform duration-300 ease-in-out hover:scale-105"
            onClick={() => {
              onStartTalking();
              onClose();
            }}
          >
            <Rocket className="mr-2 h-5 w-5 group-hover:animate-vibrate" />
            Great — Start Talking to Prepzo Now!
          </RippleButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AgentModal;
  