"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  AlertCircle,
  Star,
  XCircle,
  CheckCircle,
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { createClient } from "@/utils/supabase/client";
import SubscriptionHistory from "./subscriptionHistory";
import SubscriptionPricing from "./subscriptionPricing";
import PricingBar from "./PricingBar";

// --- Interfaces based on your backend schema ---

interface SubscriptionPlanBase {
  id: string | number;
  name: string;
  price: number;
  resume_limit_per_month: number;
  cover_letter_limit_per_month: number;
  linkedin_optimize_limit_per_month: number;
  job_application_limit_per_month: number;
  job_search_results_limit_per_month?: number;
}

interface SubscriptionPlanExtended extends SubscriptionPlanBase {
  mock_interview_session: number;
  stripe_price_id: string;
}

type SubscriptionPlan = SubscriptionPlanBase & Partial<SubscriptionPlanExtended>;

interface FeatureUsageBase {
  resume_period_count: number;
  cover_letter_period_count: number;
  linkedin_optimize_period_count: number;
  job_search_results_period_count: number;
}

interface FeatureUsageExtended extends FeatureUsageBase {
  mock_interview_session_lifetime_count: number;
  mock_interview_session_period_count: number;
}

type FeatureUsage = FeatureUsageBase & Partial<FeatureUsageExtended>;

type SubscriptionStatusType = 
  | "trialing"
  | "past_due"
  | "active"
  | "processing"
  | "canceling"
  | "canceled"
  | "free"  // Keep for backward compatibility during transition
  | "free_trial";  // Keep for backward compatibility during transition

interface SubscriptionStatus {
  status: SubscriptionStatusType;
  current_period_start: string;
  current_period_end: string;    // now your single source of truth
  subscription_plans: SubscriptionPlan;
  usage: FeatureUsage;
}

const SubscriptionContent = () => {
  const { subscription, isLoading, error: contextError, refetch } = useSubscription();
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowSuccessMessage(true);
      const timer = setTimeout(() => {
        router.push("/dashboard/settings/subscription");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  const handleUpgrade = async (plan: "pro" | "premium") => {
    setIsProcessingAction(true);
    setActionError(null);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("Could not retrieve user session for upgrade.");
      }

      // --- DEBUGGING STEP ---
      console.log("Looking for payment link for plan:", plan);
      // --- END DEBUGGING STEP ---

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
      if (!backendUrl) {
        throw new Error("Backend URL is not configured.");
      }

      const response = await fetch(`${backendUrl}/subscription/create-checkout-session`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          planId: plan === "pro" ? 2 : 3
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to create checkout session");
      }

      const { id: sessionId } = await response.json();
      
      // Redirect to Stripe Checkout
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      if (!stripe) {
        throw new Error("Failed to load Stripe");
      }
      
      const { error } = await stripe.redirectToCheckout({
        sessionId
      });

      if (error) {
        throw error;
      }
    } catch (err) {
      const error = err as Error;
      setActionError(error.message);
      setIsProcessingAction(false);
    }
  };

  const handleCancel = async () => {
    setIsProcessingAction(true);
    setActionError(null);
    try {
       const { data: sessionData, error: sessionError } =
         await supabase.auth.getSession();
       if (sessionError || !sessionData?.session?.access_token) {
         throw new Error("Could not retrieve user session for cancellation.");
       }
 
       const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL!;
       const res = await fetch(
         `${backendUrl}/subscription/stripe/cancel-subscription`,
         {
           method: "POST",
           headers: {
             Authorization: `Bearer ${sessionData.session.access_token}`,
           },
         }
       );
       const data = await res.json();
       if (!res.ok) {
         throw new Error(data.error || "Could not cancel subscription.");
       }
 
       await refetch();
    } catch (err) {
      const error = err as Error;
       setActionError(error.message);
    } finally {
        setIsProcessingAction(false);
    }
  };

  const handleReactivate = async () => {
    setIsProcessingAction(true);
    setActionError(null);
    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError || !sessionData?.session?.access_token) {
        throw new Error("Could not retrieve user session for reactivation.");
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL!;
      const res = await fetch(
        `${backendUrl}/subscription/stripe/reactivate-subscription`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not reactivate subscription.");
      }

      await refetch(); // Refetch subscription status to update the UI
    } catch (err) {
      const error = err as Error;
      setActionError(error.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleManageBilling = async () => {
    setIsProcessingAction(true);
    setActionError(null);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("Could not retrieve user session to manage billing.");
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL!;
      const res = await fetch(`${backendUrl}/subscription/customer-portal`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || "Could not create billing management session."
        );
      }

      window.location.href = data.url;
    } catch (err) {
      const error = err as Error;
      setActionError(error.message);
      setIsProcessingAction(false);
    }
  };

  // --- Loading / Error States ---
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }
  const error = contextError || actionError;
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  if (!subscription) {
    return <p>No subscription details found.</p>;
  }

  // --- parse the date strings one time ---
  const periodEnd = new Date(subscription.current_period_end);
  const formattedEnd = periodEnd.toLocaleDateString();

  // --- Status flags ---
  const isTrialing = subscription.status === ("trialing" as SubscriptionStatusType) || subscription.status === ("free_trial" as SubscriptionStatusType);
  const isProUser =
    (subscription.status === "active" || isTrialing) &&
    subscription.subscription_plans.name.toLowerCase().includes("pro");
  const isPremiumUser =
    (subscription.status === "active" || isTrialing) &&
    subscription.subscription_plans.name.toLowerCase().includes("premium");
  const isPaidUser = isProUser || isPremiumUser;
  const isCanceling = subscription.status === "canceling";
  const isExpired = subscription.status === "canceled";

  // --- Usage metrics ---
  let usageMetrics = [
    {
      name: "Resume Analyses",
      used: subscription.usage.resume_period_count,
      limit: subscription.subscription_plans.resume_limit_per_month,
    },
    {
      name: "Cover Letters",
      used: subscription.usage.cover_letter_period_count,
      limit: subscription.subscription_plans.cover_letter_limit_per_month,
    },
    {
      name: "LinkedIn Optimizations",
      used: subscription.usage.linkedin_optimize_period_count,
      limit: subscription.subscription_plans.linkedin_optimize_limit_per_month,
    },
    {
      name: "Mock Interview Sessions",
      used: (subscription.usage as FeatureUsageExtended).mock_interview_session_lifetime_count ?? 0,
      limit: (subscription.subscription_plans as SubscriptionPlanExtended).mock_interview_session ?? 0,
    },
    {
      name: "Job Reveals",
      used: subscription.usage.job_search_results_period_count,
      limit: subscription.subscription_plans.job_search_results_limit_per_month ?? 0,
    },
  ];

  if (subscription.subscription_plans.id == 3) {
    usageMetrics = usageMetrics.filter(
      (metric) => metric.name === "Job Reveals" || metric.name === "Mock Interview Sessions"
    );
  }

  return (
    <>
      {showSuccessMessage && (
        <Alert
          variant="default"
          className="mb-4 bg-green-50 border-green-200"
        >
          <CheckCircle className="h-4 w-4 text-green-700" />
          <AlertTitle>Upgrade Successful!</AlertTitle>
          <AlertDescription>
            Your plan has been upgraded and your 3-day free trial has started. You will be redirected in 5
            seconds.
          </AlertDescription>
        </Alert>
      )}

      {isTrialing && (
        <Alert
          variant="default"
          className="mb-4 bg-blue-50 border-blue-200"
        >
          <Star className="h-4 w-4 text-blue-700" />
          <AlertTitle>Free Trial Active</AlertTitle>
          <AlertDescription>
            You're currently in your 3-day free trial period. Your first payment will be processed on {formattedEnd}.
          </AlertDescription>
        </Alert>
      )}

      {isExpired && (
        <Alert
          variant="default"
          className="mb-4 bg-yellow-50 border-yellow-200"
        >
          <XCircle className="h-4 w-4 text-yellow-700" />
          <AlertTitle>Subscription Ended</AlertTitle>
          <AlertDescription>
            Your Pro plan expired on {formattedEnd}. You can upgrade again
            anytime.
          </AlertDescription>
        </Alert>
      )}

      {isCanceling && (
        <Alert
          variant="default"
          className="mb-4 bg-yellow-50 border-yellow-200"
        >
          <AlertCircle className="h-4 w-4 text-yellow-700" />
          <AlertTitle>Cancellation Scheduled</AlertTitle>
          <AlertDescription>
            Your subscription will be canceled on {formattedEnd}.
          </AlertDescription>
        </Alert>
      )}

      <PricingBar
        currentPlanId={subscription.subscription_plans?.id}
        isProcessingAction={isProcessingAction}
        handleUpgrade={handleUpgrade}
      />

      {isPaidUser && (
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Monthly Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {usageMetrics.map((m) => (
                <div key={m.name}>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-sm text-gray-500">
                      {m.used} / {subscription.subscription_plans.id === 3 ? "unlimited" : (m.limit ?? "—")}
                    </p>
                  </div>
                  <Progress
                    value={subscription.subscription_plans.id === 3 ? 0 : (m.limit > 0 ? (m.used / m.limit) * 100 : 0)}
                  />
                </div>
              ))}
              
              {/* Premium user unlimited access message */}
              {subscription.subscription_plans.id === 3 && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <Star className="h-5 w-5" />
                    <span className="font-semibold">Premium Benefits</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    ✨ You have unlimited access to Resume Analyses, Cover Letter Generation, LinkedIn Optimizations, and Mock Interview Sessions
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 flex justify-center items-center flex-wrap gap-4">
        {(isPaidUser || isCanceling) && (
          <Button
            variant="outline"
            onClick={handleManageBilling}
            disabled={isProcessingAction}
          >
            {isProcessingAction ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Manage Billing
          </Button>
        )}
        {isCanceling && (
          <Button onClick={handleReactivate} disabled={isProcessingAction}>
            {isProcessingAction ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Reactivate Subscription
          </Button>
        )}
        {isPaidUser && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" disabled={isProcessingAction}>
                {isProcessingAction ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                Cancel Subscription
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Cancellation</DialogTitle>
                <DialogDescription>
                  You'll keep your Pro benefits until your current period ends, then you'll
                  be downgraded to the Free plan. This can be undone by
                  reactivating anytime before the period ends.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">Nevermind</Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={isProcessingAction}
                >
                  {isProcessingAction ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Yes, Cancel Now"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="mt-8">
        <SubscriptionHistory />
      </div>
    </>
  );
};

export default SubscriptionContent;
