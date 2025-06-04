"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ChallengesContent from "@/components/dashboard/challenges/challengesContent";
// BlurOverlay is no longer directly used here, it will be used within ChallengesContent
// import BlurOverlay from "@/components/dashboard/blurrEffect";
// No need for createClient or useRouter if it's just a "coming soon" message with no CTA action

const ChallengesPage = () => {
  // For a "coming soon" message, we can assume the feature is not yet available (like not being a Pro user)
  const [isFeatureAvailable, setIsFeatureAvailable] = useState(false); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading or any initial checks if needed
    setLoading(false);
  }, []);

  return (
    <DashboardLayout>
      <div className="flex-grow flex flex-col h-full">
        {/* Pass isFeatureAvailable and loading to ChallengesContent */}
        {/* The padding for the content area is now within the page structure */}
        <div className="flex-grow p-4 md:p-6 lg:p-8">
            <ChallengesContent 
              isFeatureAvailable={isFeatureAvailable} 
              isLoading={loading} 
            />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChallengesPage;