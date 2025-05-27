"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ApplicationsContent from "@/components/dashboard/applications/ApplicationsContent";
import BlurOverlay from "@/components/dashboard/blurrEffect";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from 'next/navigation';

const ApplicationsPage = () => {
  const [isProUser, setIsProUser] = useState(false); // Placeholder
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const checkSubscription = async () => {
      setLoading(true);
      // Placeholder: Fetch user subscription status
      const { data: { user } } = await supabase.auth.getUser(); // Get user for ID
      if (user) {
        const { data: subscriptionData, error: subError } = await supabase
           .from('subscriptions')
           .select('status')
           .eq('user_id', user.id)
           .eq('status', 'active')
           .single();
        if (subError && subError.code !== 'PGRST116') {
          console.warn("Error fetching subscription status:", subError);
          setIsProUser(false);
        } else {
          setIsProUser(!!subscriptionData);
        }
      } else {
        setIsProUser(false); // No user, so not pro
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
      <div className="relative h-full"> {/* Ensure parent has dimensions and is relative */}
        {!isProUser && !loading && <BlurOverlay onCtaClick={handleUpgradeClick} />}
        <ApplicationsContent />
      </div>
    </DashboardLayout>
  );
};

export default ApplicationsPage; 