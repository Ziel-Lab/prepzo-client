"use client";
import React, { useState, useEffect } from 'react';
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import SkillsContent from "@/components/dashboard/skills/SkillsContent";
import BlurOverlay from "@/components/dashboard/blurrEffect";

const SkillsPage = () => {
  const [isFeatureAvailable, setIsFeatureAvailable] = useState(false); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <DashboardLayout>
      <div className="relative h-full">
        {!isFeatureAvailable && !loading && <BlurOverlay />}
        <SkillsContent />
      </div>
    </DashboardLayout>
  );
};

export default SkillsPage; 