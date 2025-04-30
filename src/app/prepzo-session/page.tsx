"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import LiveKitPage from '@/components/livekit/LiveKitPage';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster if using shadcn/ui toast

export default function LiveKitSessionPage() {
  const router = useRouter();

  const handleClose = () => {
    console.log('LiveKit session closed, navigating back.');
    // Navigate back to the homepage or previous page
    router.push('/'); // Or use router.back();
  };

  return (
    <div className="h-screen w-screen bg-background">
      {/* Ensure the Toaster is rendered if LiveKitPage relies on shadcn/ui toast */}
      <Toaster /> 
      <LiveKitPage onClose={handleClose} />
    </div>
  );
}
