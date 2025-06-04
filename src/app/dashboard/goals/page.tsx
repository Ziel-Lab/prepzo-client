"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import GoalsContent from "@/components/dashboard/goals/GoalsContent";
// BlurOverlay will be used within GoalsContent, so no direct import needed here
// import BlurOverlay from "@/components/dashboard/blurrEffect";

const GoalsPage = () => {
  const [isFeatureAvailable, setIsFeatureAvailable] = useState(false); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <DashboardLayout>
      <div className="flex-grow flex flex-col h-full">
        {/* Pass isFeatureAvailable and loading to GoalsContent */}
        {/* The padding for the content area is now within the page structure */}
        <div className="flex-grow p-4 md:p-6 lg:p-8">
            <GoalsContent 
              isFeatureAvailable={isFeatureAvailable} 
              isLoading={loading} 
            />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GoalsPage; 