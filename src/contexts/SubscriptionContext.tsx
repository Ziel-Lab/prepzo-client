"use client";

import { createContext, useState, useEffect, useCallback, useContext, ReactNode, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';

// Interfaces based on the backend schema, shared across components
export interface SubscriptionPlan {
  id: string | number;
  name: string;
  price: number;
  resume_limit_per_month: number;
  cover_letter_limit_per_month: number;
  linkedin_optimize_limit_per_month: number;
  job_search_results_limit_per_month?: number;
}

export interface FeatureUsage {
  resume_count: number;
  cover_letter_count: number;
  linkedin_optimize_count: number;
  job_application_count: number;
  job_search_results_count?: number;
}

export interface SubscriptionStatus {
  status: 'free' | 'free_trial' | 'past_due' | 'active' | 'processing' | 'canceling' | 'canceled';
  current_period_start: string;
  current_period_end: string;
  subscription_plans: SubscriptionPlan;
  usage: FeatureUsage;
}

// The shape of the context
interface SubscriptionContextType {
  subscription: SubscriptionStatus | null;
  isPro: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchSubscriptionStatus = useCallback(async () => {
    if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        setIsLoading(false);
        setSubscription(null);
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
      if (!backendUrl) throw new Error("Backend URL is not configured.");

      const response = await fetch(`${backendUrl}/subscription/status`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch subscription status.");
      
      setSubscription(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []); // Fetch only on initial mount

  useEffect(() => {
     const channel = supabase
       .channel("user-subscriptions-changes")
       .on(
         "postgres_changes",
         { event: "*", schema: "public", table: "user_subscriptions" },
         () => {
            fetchSubscriptionStatus()
         }
       )
       .subscribe();

     return () => {
       supabase.removeChannel(channel);
     };
  }, [supabase, fetchSubscriptionStatus]);

  const isPro = useMemo(() => {
    if (!subscription) return false;
    const proStatus: Array<SubscriptionStatus['status']> = ['active', 'canceling', 'processing'];
    return proStatus.includes(subscription.status);
  }, [subscription]);

  const value = { subscription, isPro, isLoading, error, refetch: fetchSubscriptionStatus };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}; 