import { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ExitIntentModalProps {
  onClose?: () => void;
}

export function ExitIntentModal({ onClose }: ExitIntentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger if mouse leaves from top of viewport (closing tab behavior)
      if (e.clientY <= 5 && !hasTriggered) {
        setIsOpen(true);
        setHasTriggered(true);
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [hasTriggered]);

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleTryFreeQuestion = () => {
    console.log("Try free question clicked");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md border-primary/20 p-0 overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        {/* Gradient header */}
        <div className="glass-panel p-6 text-center">
          <span className="text-4xl mb-2 block">👋</span>
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-white">
              Wait! Before you go...
            </DialogTitle>
            <p className="text-white/80 text-base">
              Try 1 free interview question
            </p>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-muted-foreground text-center text-sm">
            No signup required – see how AI-powered interview practice works!
          </p>
          
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full min-h-[48px] gap-2"
              onClick={handleTryFreeQuestion}
            >
              <Sparkles className="w-5 h-5" />
              Try Free Question
            </Button>
            
            <Button
              variant="ghost"
              className="w-full min-h-[44px] text-muted-foreground hover:text-foreground"
              onClick={handleClose}
            >
              No thanks, I'll sign up
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
