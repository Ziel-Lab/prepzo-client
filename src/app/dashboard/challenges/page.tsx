"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ChallengesContent from "@/components/dashboard/challenges/challengesContent";
import BlurOverlay from "@/components/dashboard/blurrEffect";
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
      <div className="relative h-full"> 
        {!isFeatureAvailable && !loading && <BlurOverlay />}
        <ChallengesContent />
      </div>
    </DashboardLayout>
  );
};

export default ChallengesPage;