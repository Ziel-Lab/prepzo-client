"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ToolsContent from "@/components/dashboard/tools/ToolsContent";
import BlurOverlay from "@/components/dashboard/blurrEffect";

const ToolsPage = () => {
  const [isFeatureAvailable, setIsFeatureAvailable] = useState(false); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <DashboardLayout>
      <div className="relative h-full">
        {!isFeatureAvailable && !loading && <BlurOverlay />}
        <ToolsContent />
      </div>
    </DashboardLayout>
  );
};

export default ToolsPage; 