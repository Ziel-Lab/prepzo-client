"use client";

import { createContext, useState, useEffect, useCallback, useContext, ReactNode, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { authFetch } from '@/lib/authClient';

// Interfaces based on the actual backend API response
export interface SubscriptionPlan {
  id: string | number;
  plan_name: string;
  price: number;
  resume_limit_per_month: number;
  cover_letter_limit_per_month: number;
  linkedin_optimize_limit_per_month: number;
  job_search_results_limit_per_month?: number;
}

export interface FeatureUsage {
  resume_period_count: number;
  cover_letter_period_count: number;
  linkedin_optimize_period_count: number;
  job_search_results_period_count: number;
}

// Raw API response structure
export interface SubscriptionStatusRaw {
  cancel_at_period_end: boolean;
  current_period_end: string;
  current_period_start: string;
  has_active_subscription: boolean;
  plan_id: number;
  plan_name: string;
  status: 'free' | 'free_trial' | 'past_due' | 'active' | 'processing' | 'canceling' | 'canceled';
}

// Processed subscription status for frontend use
export interface SubscriptionStatus {
  status: 'free' | 'free_trial' | 'past_due' | 'active' | 'processing' | 'canceling' | 'canceled';
  current_period_start: string;
  current_period_end: string;
  subscription_plans: SubscriptionPlan;
  usage: FeatureUsage;
  cancel_at_period_end: boolean;
  has_active_subscription: boolean;
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
  const [retryCount, setRetryCount] = useState(0);
  const supabase = createClient();

  // Helper function to detect if this might be a new user
  const isLikelyNewUser = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('login') === 'success';
  }, []);

  // Helper function to wait
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Helper function to get plan details based on plan_id
  const getPlanDetails = (planId: number): SubscriptionPlan => {
    const plans: Record<number, SubscriptionPlan> = {
      1: {
        id: 1,
        plan_name: "Free",
        price: 0,
        resume_limit_per_month: 2,
        cover_letter_limit_per_month: 2,
        linkedin_optimize_limit_per_month: 1,
        job_search_results_limit_per_month: 5,
      },
      2: {
        id: 2,
        plan_name: "Pro Monthly",
        price: 7.99,
        resume_limit_per_month: 10,
        cover_letter_limit_per_month: 10,
        linkedin_optimize_limit_per_month: 3,
        job_search_results_limit_per_month: 50,
      },
      3: {
        id: 3,
        plan_name: "Premium Monthly",
        price: 19.99,
        resume_limit_per_month: -1, // unlimited
        cover_letter_limit_per_month: -1, // unlimited
        linkedin_optimize_limit_per_month: -1, // unlimited
        job_search_results_limit_per_month: -1, // unlimited
      },
    };
    return plans[planId] || plans[1]; // fallback to free plan
  };

  // Helper function to fetch usage data
  const fetchUsageData = async (): Promise<FeatureUsage> => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
      if (!backendUrl) throw new Error("Backend URL is not configured.");
      
      const response = await authFetch(`${backendUrl}/subscription/usage`);
      if (!response.ok) throw new Error("Failed to fetch usage data.");
      
      return await response.json();
    } catch (error) {
      console.warn("Failed to fetch usage data, using defaults:", error);
      return {
        resume_period_count: 0,
        cover_letter_period_count: 0,
        linkedin_optimize_period_count: 0,
        job_search_results_period_count: 0,
      };
    }
  };

  const fetchSubscriptionStatus = useCallback(async (attemptNumber = 0) => {
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

      // For new users, ensure records exist first
      if (isLikelyNewUser() && attemptNumber === 0) {
        try {
          await fetch('/api/updateTable', { method: 'POST' });
        } catch (updateError) {
          console.warn('Failed to ensure user records exist:', updateError);
        }
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
      if (!backendUrl) throw new Error("Backend URL is not configured.");

      const response = await authFetch(`${backendUrl}/subscription/subscription-status`);
      
      const rawData: SubscriptionStatusRaw = await response.json();
      if (!response.ok) throw new Error("Failed to fetch subscription status.");
      
      // Fetch usage data in parallel
      const usageData = await fetchUsageData();
      
      // Transform the API response to match frontend expectations
      const transformedData: SubscriptionStatus = {
        status: rawData.status,
        current_period_start: rawData.current_period_start,
        current_period_end: rawData.current_period_end,
        cancel_at_period_end: rawData.cancel_at_period_end,
        has_active_subscription: rawData.has_active_subscription,
        subscription_plans: getPlanDetails(rawData.plan_id),
        usage: usageData
      };
      
      setSubscription(transformedData);
      setRetryCount(0); // Reset retry count on success
    } catch (err: any) {
      console.error(`Subscription fetch attempt ${attemptNumber + 1} failed:`, err.message);
      
      // Retry logic with exponential backoff for new users or network errors
      const maxRetries = isLikelyNewUser() ? 3 : 1;
      const shouldRetry = attemptNumber < maxRetries && (
        err.message.includes('Failed to fetch') || 
        err.message.includes('Network') ||
        err.message.includes('timeout') ||
        isLikelyNewUser()
      );

      if (shouldRetry) {
        const retryDelay = Math.min(1000 * Math.pow(2, attemptNumber), 5000); // Max 5 seconds
        console.log(`Retrying subscription fetch in ${retryDelay}ms...`);
        setRetryCount(attemptNumber + 1);
        
        await wait(retryDelay);
        return fetchSubscriptionStatus(attemptNumber + 1);
      } else {
        setError(err.message || "An unexpected error occurred.");
        setRetryCount(0);
      }
    } finally {
      setIsLoading(false);
    }
  }, [supabase, isLikelyNewUser]);

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