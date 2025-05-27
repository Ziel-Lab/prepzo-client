"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ConversationsContent from "@/components/dashboard/conversations/ConversationsContent";
import BlurOverlay from "@/components/dashboard/blurrEffect";

const ConversationsPage = () => {
  const [isFeatureAvailable, setIsFeatureAvailable] = useState(false); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <DashboardLayout>
      <div className="relative h-full">
        {!isFeatureAvailable && !loading && <BlurOverlay />}
        <ConversationsContent />
      </div>
    </DashboardLayout>
  );
};

export default ConversationsPage;
