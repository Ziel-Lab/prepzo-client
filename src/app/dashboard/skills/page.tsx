"use client";
import React, { useState, useEffect } from 'react';
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import SkillsContent from "@/components/dashboard/skills/SkillsContent";
// BlurOverlay will be used within SkillsContent
// import BlurOverlay from "@/components/dashboard/blurrEffect";

const SkillsPage = () => {
  const [isFeatureAvailable, setIsFeatureAvailable] = useState(false); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <DashboardLayout>
      <div className="flex-grow flex flex-col h-full">
        {/* Pass isFeatureAvailable and loading to SkillsContent */}
        <div className="flex-grow p-4 md:p-6 lg:p-8">
            <SkillsContent 
              isFeatureAvailable={isFeatureAvailable} 
              isLoading={loading} 
            />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SkillsPage; 