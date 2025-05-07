"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LiveKitPage from '@/components/livekit/LiveKitPage';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster if using shadcn/ui toast
import { useAuth } from '@/hooks/use-auth'; // Import useAuth

export default function LiveKitSessionPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth(); // Get auth state

  useEffect(() => {
    // Only redirect if auth check is complete and user is not authenticated
    if (!isAuthLoading && !isAuthenticated) {
      console.log('LiveKitSessionPage: User not authenticated, redirecting to home.');
      router.push('/');
    }
  }, [isAuthenticated, isAuthLoading, router]);

  const handleClose = () => {
    console.log('LiveKit session closed, navigating to sign-up page.');
    // Navigate to the sign-up page
    router.push('/auth/sign-up'); 
  };

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
