"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LiveKitPage from '@/components/livekit/LiveKitPage';
import { Toaster } from '@/components/ui/toaster';

// Define a fallback component for Suspense
const PageLoader = () => (
  <div className="h-screen w-screen bg-background flex items-center justify-center">
    <p className="text-lg text-muted-foreground">Loading page details...</p>
  </div>
);

const SessionPageClientContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 'initial_check': Verifying the 'ref' query parameter.
  // 'url_cleaning': 'ref' was valid, now cleaning the URL.
  // 'verified': URL is clean, access granted.
  // 'redirecting_home': 'ref' was invalid or missing, redirecting to home.
  const [pageStatus, setPageStatus] = useState<'initial_check' | 'url_cleaning' | 'verified' | 'redirecting_home'>('initial_check');

  useEffect(() => {
    if (pageStatus === 'initial_check') {
      const ref = searchParams.get('ref');
      if (ref === 'agentmodal') {
        setPageStatus('url_cleaning');
        // Replace the URL to remove the 'ref' parameter.
        // The effect will re-run when searchParams changes.
        router.replace('/prepzo-session', { scroll: false });
      } else {
        // 'ref' is missing or invalid.
        setPageStatus('redirecting_home');
        router.push('/');
      }
    } else if (pageStatus === 'url_cleaning') {
      // We are in this state after 'ref' was confirmed valid and URL replacement was initiated.
      // Now, we wait for searchParams to update (ref to be gone).
      if (!searchParams.get('ref')) {
        // 'ref' is now gone, URL is clean.
        setPageStatus('verified');
      }
      // If 'ref' is still present, this effect will run again when searchParams updates after router.replace fully processes.
    }
    // No further actions needed in this effect for 'verified' or 'redirecting_home' states.
  }, [searchParams, router, pageStatus]);

  const handleClose = () => {
    router.push('/'); // Redirect to home on close
  };

  if (pageStatus === 'initial_check' || pageStatus === 'url_cleaning') {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  if (pageStatus === 'redirecting_home') {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Access denied. Redirecting...</p>
      </div>
    );
  }

  // Only render LiveKitPage if pageStatus is 'verified'
  if (pageStatus === 'verified') {
    return (
      <div className="h-screen w-screen bg-background">
        <Toaster />
        <LiveKitPage onClose={handleClose} isOpen={true} />
      </div>
    );
  }

  // Fallback for any unexpected state, though ideally not reached.
  return null;
};

export default function LiveKitSessionPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SessionPageClientContent />
    </Suspense>
  );
}
