"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import GoalsContent from "@/components/dashboard/goals/GoalsContent";
import BlurOverlay from "@/components/dashboard/blurrEffect";

const GoalsPage = () => {
  const [isFeatureAvailable, setIsFeatureAvailable] = useState(false); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <DashboardLayout>
      <div className="relative h-full">
        {!isFeatureAvailable && !loading && <BlurOverlay />}
        <GoalsContent />
      </div>
    </DashboardLayout>
  );
};

export default GoalsPage; 