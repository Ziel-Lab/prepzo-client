"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LiveKitPage from '@/components/livekit/LiveKitPage';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster if using shadcn/ui toast
import { useAuth } from '@/hooks/use-auth'; // Import useAuth

export default function LiveKitSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Added
  const { isAuthenticated, isLoading: isAuthLoading, triggerAuthCheck } = useAuth(); // Added triggerAuthCheck

  const [hasAttemptedForcedCheck, setHasAttemptedForcedCheck] = useState(false); // Added state

  useEffect(() => {
    const justVerified = searchParams.get('verified') === 'true';

    if (!isAuthLoading) { // Auth check is complete (either initial or forced)
      if (!isAuthenticated) { // And user is NOT authenticated
        if (justVerified && !hasAttemptedForcedCheck) {
          console.log('LiveKitSessionPage: Hinted verification, but not authenticated. Triggering a focused auth check.');
          triggerAuthCheck();
          setHasAttemptedForcedCheck(true);
          // Don't redirect yet. isAuthLoading will become true, then false. Effect will run again.
        } else {
          // Not just verified, or forced check already attempted and failed.
          console.log('LiveKitSessionPage: User not authenticated (or forced check failed), redirecting to home.');
          router.push('/');
        }
      } else {
        // User is authenticated. If justVerified was true, reset the forced check attempt state (might not be strictly necessary but good for consistency).
        if (justVerified) {
          setHasAttemptedForcedCheck(false); 
        }
      }
    }
  }, [isAuthenticated, isAuthLoading, triggerAuthCheck, searchParams, router, hasAttemptedForcedCheck]);

  // Separate useEffect for cleaning up the URL query parameter
  useEffect(() => {
    const justVerified = searchParams.get('verified') === 'true';
    // Clean up URL if the flag was present and user is either authenticated or the forced check has been made
    if (justVerified && (isAuthenticated || hasAttemptedForcedCheck)) {
        router.replace('/prepzo-session', { scroll: false });
    }
  }, [isAuthenticated, hasAttemptedForcedCheck, searchParams, router]);

  const handleClose = () => {
    console.log('LiveKit session closed, navigating to feedback page.');
    // Navigate to the sign-up page
    router.push('/auth/sign-up'); 
  };
  <LiveKitPage onClose={handleClose} />

  if (isAuthLoading) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        {/* You can replace this with a more sophisticated loading spinner */}
        <p className="text-lg text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  // If auth check is complete but user is not authenticated, 
  // useEffect will handle redirection. Show a message in the meantime.
  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Access denied. Redirecting to homepage...</p>
      </div>
    );
  }

  // If authenticated, render the page content
  return (
    <div className="h-screen w-screen bg-background">
      {/* Ensure the Toaster is rendered if LiveKitPage relies on shadcn/ui toast */}
      <Toaster /> 
      <LiveKitPage onClose={handleClose} />
    </div>
  );
}
