"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ApplicationsContent from "@/components/dashboard/applications/ApplicationsContent";
// BlurOverlay will be used within ApplicationsContent
// import BlurOverlay from "@/components/dashboard/blurrEffect"; 
import { createClient } from "@/utils/supabase/client";
import { useRouter } from 'next/navigation';

const ApplicationsPage = () => {
  // Renaming isProUser to isFeatureAvailable for consistency with the pattern
  const [isFeatureAvailable, setIsFeatureAvailable] = useState(false); 
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const checkSubscription = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: subscriptionData, error: subError } = await supabase
           .from('subscriptions')
           .select('status')
           .eq('user_id', user.id)
           .eq('status', 'active')
           .single();
        if (subError && subError.code !== 'PGRST116') {
          console.warn("Error fetching subscription status:", subError);
          setIsFeatureAvailable(false);
        } else {
          setIsFeatureAvailable(!!subscriptionData);
        }
      } else {
        setIsFeatureAvailable(false);
      }
      setLoading(false);
    };
    checkSubscription();
  }, [supabase]);

  const handleUpgradeClick = () => {
    router.push('/dashboard/settings#subscription');
  };

  return (
    <DashboardLayout>
      <div className="flex-grow flex flex-col h-full">
        {/* Pass isFeatureAvailable, loading, and onCtaClick to ApplicationsContent */}
        <div className="flex-grow p-4 md:p-6 lg:p-8">
            <ApplicationsContent 
              isFeatureAvailable={isFeatureAvailable} 
              isLoading={loading}
              onOverlayCtaClick={handleUpgradeClick} // Pass the CTA click handler
            />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ApplicationsPage; 