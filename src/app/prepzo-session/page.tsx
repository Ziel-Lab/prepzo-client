"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import LiveKitPage from '@/components/livekit/LiveKitPage';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster if using shadcn/ui toast

export default function LiveKitSessionPage() {
  const router = useRouter();

  const handleClose = () => {
    console.log('LiveKit session closed, navigating to sign-up page.');
    // Navigate to the sign-up page
    router.push('/auth/sign-up'); 
  };

  return (
    <div className="h-screen w-screen bg-background">
      {/* Ensure the Toaster is rendered if LiveKitPage relies on shadcn/ui toast */}
      <Toaster /> 
      <LiveKitPage onClose={handleClose} />
    </div>
  );
}
