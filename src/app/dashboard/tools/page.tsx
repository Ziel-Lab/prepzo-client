"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ToolsContent from "@/components/dashboard/tools/ToolsContent";

const ToolsPage = () => {
  const [isFeatureAvailable, setIsFeatureAvailable] = useState(false); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <DashboardLayout>
      <div className="relative h-full">
        <ToolsContent />
      </div>
    </DashboardLayout>
  );
};

export default ToolsPage; 