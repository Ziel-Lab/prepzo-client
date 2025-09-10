"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

interface SubscriptionPlan {
  id: string | number;
  name: string;
  price: number;
  resume_limit_per_month: number;
  cover_letter_limit_per_month: number;
  linkedin_optimize_limit_per_month: number;
  job_application_limit_per_month: number;
  job_search_results_limit_per_month?: number;
  mock_interview_session?: number;
}

interface FeatureUsage {
  resume_period_count: number;
  cover_letter_period_count: number;
  linkedin_optimize_period_count: number;
  job_search_results_period_count: number;
  mock_interview_session_lifetime_count: number;
}

interface SubscriptionStatus {
  status:
    | "free"
    | "free_trial"
    | "past_due"
    | "active"
    | "processing"
    | "canceling"
    | "canceled";
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

      // Direct Stripe payment links (bypassing environment variable issues)
      const paymentLink =
        plan === "pro"
          ? "https://buy.stripe.com/dRm7sKazu1bK6sK7WW00000"  // Pro plan
          : "https://buy.stripe.com/4gM9ASgXSaMk3gy0uu00001"; // Premium plan
      

      if (!paymentLink) {
        throw new Error(
          `The payment link for the ${
            plan === "pro" ? "Pro" : "Premium"
          } plan is not configured. Please contact support.`
        );
      }
      const url = new URL(paymentLink);
      url.searchParams.set("client_reference_id", session.user.id);
      if (session.user.email) {
        url.searchParams.set("prefilled_email", session.user.email);
      }

      window.location.href = url.toString();
    } catch (err: any) {
      setActionError(err.message);
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
    } catch (err: any) {
       setActionError(err.message);
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
    } catch (err: any) {
      setActionError(err.message);
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
    } catch (err: any) {
      setActionError(err.message);
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
  const isFreeUser =
    subscription.status === "free" ||
    subscription.status === "free_trial" ||
    !subscription.status; // Treat null/undefined status as free
  const isProUser =
    subscription.status === "active" &&
    subscription.subscription_plans.name.toLowerCase().includes("pro");
  const isPremiumUser =
    subscription.status === "active" &&
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
      used: (subscription.usage as any).mock_interview_session_lifetime_count ?? 0,
      limit: (subscription.subscription_plans as any).mock_interview_session ?? 0,
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
            Your plan has been upgraded to Pro. You will be redirected in 5
            seconds.
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
            You'll keep Pro until {formattedEnd}, then you'll revert to Free.
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
