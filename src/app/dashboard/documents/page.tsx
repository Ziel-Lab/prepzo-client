"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DocumentsContent from "@/components/dashboard/documents/DocumentsContent";
import BlurOverlay from "@/components/dashboard/blurrEffect";

const DocumentsPage = () => {
  const [isFeatureAvailable, setIsFeatureAvailable] = useState(false); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <DashboardLayout>
      <div className="relative h-full">
        {!isFeatureAvailable && !loading && <BlurOverlay />}
        <DocumentsContent />
      </div>
    </DashboardLayout>
  );
};

export default DocumentsPage;
