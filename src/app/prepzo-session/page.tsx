"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LiveKitPage from '@/components/livekit/LiveKitPage';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster if using shadcn/ui toast
import { useAuth } from '@/hooks/use-auth'; // Import useAuth

// Define a fallback component for Suspense
const PageLoader = () => (
  <div className="h-screen w-screen bg-background flex items-center justify-center">
    <p className="text-lg text-muted-foreground">Loading page details...</p>
  </div>
);

// This component contains the original logic that uses useSearchParams
const SessionPageClientContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: isAuthLoading, triggerAuthCheck } = useAuth();
  const [hasAttemptedForcedCheck, setHasAttemptedForcedCheck] = useState(false);

  useEffect(() => {
    const justVerified = searchParams.get('verified') === 'true';

    if (!isAuthLoading) {
      if (!isAuthenticated) {
        if (justVerified && !hasAttemptedForcedCheck) {
          triggerAuthCheck();
          setHasAttemptedForcedCheck(true);
        } else {
          console.log('LiveKitSessionPage: User not authenticated (or forced check failed), redirecting to home.');          router.push('/');
        }
      } else {
        if (justVerified) {
          setHasAttemptedForcedCheck(false);
        }
      }
    }
  }, [isAuthenticated, isAuthLoading, triggerAuthCheck, searchParams, router, hasAttemptedForcedCheck]);

  useEffect(() => {
    const justVerified = searchParams.get('verified') === 'true';
    if (justVerified && (isAuthenticated || hasAttemptedForcedCheck)) {
      router.replace('/prepzo-session', { scroll: false });
    }
  }, [isAuthenticated, hasAttemptedForcedCheck, searchParams, router]);

  const handleClose = () => {
    router.push('/auth/sign-up');
  };

  if (isAuthLoading) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Access denied. Redirecting to homepage...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-background">
      <Toaster />
      <LiveKitPage onClose={handleClose} />
    </div>
  );
};

// The main page component now wraps the client content with Suspense
export default function LiveKitSessionPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SessionPageClientContent />
    </Suspense>
  );
}
