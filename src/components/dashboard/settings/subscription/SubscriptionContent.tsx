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
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useSubscription, type SubscriptionStatus } from "@/contexts/SubscriptionContext";
import { createClient } from "@/utils/supabase/client";
import SubscriptionPricing from "./subscriptionPricing";
import PricingBar from "./PricingBar";

type SubscriptionStatusType = SubscriptionStatus['status'];

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

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
      if (!backendUrl) {
        throw new Error("Backend URL is not configured.");
      }

      // Map plan to Stripe price ID
      // TODO: Move these to environment variables or fetch from backend
      const priceIds = {
        pro: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || "price_pro_monthly",
        premium: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID || "price_premium_monthly"
      };

      const successUrl = `${window.location.origin}/dashboard/settings/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${window.location.origin}/dashboard/settings/subscription?canceled=true`;

      const response = await fetch(`${backendUrl}/subscription/create-checkout-session`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          price_id: priceIds[plan],
          success_url: successUrl,
          cancel_url: cancelUrl
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to create checkout session");
      }

      const { checkout_url } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = checkout_url;
    } catch (err) {
      const error = err as Error;
      setActionError(error.message);
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
      const returnUrl = `${window.location.origin}/dashboard/settings/subscription`;
      
      const res = await fetch(`${backendUrl}/subscription/create-portal-session`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          return_url: returnUrl
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || "Could not create billing management session."
        );
      }

      // Redirect to Stripe customer portal
      window.location.href = data.portal_url;
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
    subscription.subscription_plans.plan_name.toLowerCase().includes("pro");
  const isPremiumUser =
    (subscription.status === "active" || isTrialing) &&
    subscription.subscription_plans.plan_name.toLowerCase().includes("premium");
  const isPaidUser = isProUser || isPremiumUser;
  const isCanceling = subscription.status === "canceling";
  const isExpired = subscription.status === "canceled";

  // --- Usage metrics ---
  const usageMetrics = [
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
      name: "Job Reveals",
      used: subscription.usage.job_search_results_period_count,
      limit: subscription.subscription_plans.job_search_results_limit_per_month ?? 0,
    },
  ];

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
            Manage Subscription
          </Button>
        )}
      </div>
    </>
  );
};

export default SubscriptionContent;