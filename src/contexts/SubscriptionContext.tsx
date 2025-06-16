"use client";

import React, { createContext, useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

// Define the shape of the subscription data and context
interface SubscriptionPlan {
  id: string | number;
  name: string;
  price: number;
  resume_limit_per_month: number;
  cover_letter_limit_per_month: number;
  linkedin_optimize_limit_per_month: number;
}

interface SubscriptionStatus {
  status: 'active' | 'canceled' | 'past_due' | 'free_trial' | 'free';
  subscription_plans: SubscriptionPlan;
  [key: string]: any; // Allow other properties
}

interface SubscriptionContextType {
  subscription: SubscriptionStatus | null;
  isPro: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Create the context with a default value
const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Create the Provider component
export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;

  const getAuthToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }, [supabase]);

  const fetchSubscriptionStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = await getAuthToken();
    if (!token || !backendUrl) {
      setError("User session or backend URL not found.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/subscription/status`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch subscription status.");
      setSubscription(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [getAuthToken, backendUrl]);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [fetchSubscriptionStatus]);
  
  const isPro = useMemo(() => {
    if (!subscription) return false;
    const planIsActivePaid = subscription.status === 'active' && subscription.subscription_plans?.price > 0;
    const planIsCanceledButActive = subscription.status === 'canceled'; // Still has pro features until period end
    return planIsActivePaid || planIsCanceledButActive;
  }, [subscription]);

  const value = {
    subscription,
    isPro,
    isLoading,
    error,
    refetch: fetchSubscriptionStatus
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// Create a custom hook to use the context
export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}; 