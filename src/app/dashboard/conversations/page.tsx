"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ConversationsContent from "@/components/dashboard/conversations/ConversationsContent";
// BlurOverlay will be used within ConversationsContent
// import BlurOverlay from "@/components/dashboard/blurrEffect";

const ConversationsPage = () => {
  const [isFeatureAvailable, setIsFeatureAvailable] = useState(false); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <DashboardLayout>
      <div className="flex-grow flex flex-col h-full">
        {/* Pass isFeatureAvailable and loading to ConversationsContent */}
        <div className="flex-grow p-4 md:p-6 lg:p-8">
            <ConversationsContent 
              isFeatureAvailable={isFeatureAvailable} 
              isLoading={loading} 
            />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ConversationsPage;
