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
  resume_period_count: number;
  cover_letter_period_count: number;
  linkedin_optimize_period_count: number;
  job_search_results_period_count: number;
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

      const response = await fetch(`${backendUrl}/subscription/status`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch subscription status.");
      
      setSubscription(data);
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