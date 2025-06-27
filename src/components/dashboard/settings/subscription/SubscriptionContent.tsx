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
}

interface FeatureUsage {
  resume_period_count: number;
  cover_letter_period_count: number;
  linkedin_optimize_period_count: number;
  job_search_results_period_count: number;
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

  const handleUpgrade = async () => {
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
 
       const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK!;
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
    subscription.status === "past_due";
  const isPaidUser =
    subscription.status === "active" || subscription.status === "processing";
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isPaidUser && <Star className="text-yellow-500" />} Your Plan:{" "}
            <span className="text-purple-600 capitalize">
              {subscription.subscription_plans.name}
            </span>
          </CardTitle>
          {!isFreeUser && <CardDescription>Ends on {formattedEnd}.</CardDescription>}
          {isCanceling && (
            <p className="text-sm text-gray-500 mt-1">
              (You'll revert to Free on {formattedEnd})
            </p>
          )}
        </CardHeader>

        <CardContent>
          <h3 className="text-md font-semibold mb-4">Monthly Usage</h3>
          <div className="space-y-6">
            {usageMetrics.map((m) => (
              <div key={m.name}>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-sm text-gray-500">
                    {m.used} / {m.limit ?? "—"}
                  </p>
                </div>
                <Progress
                  value={m.limit > 0 ? (m.used / m.limit) * 100 : 0}
                />
              </div>
            ))}
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-4">
          {/* Free users see Upgrade */}
          {isFreeUser && (
            <Button onClick={handleUpgrade} disabled={isProcessingAction}>
              {isProcessingAction ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Star className="mr-2 h-4 w-4" />
              )}
              Upgrade to Pro
            </Button>
          )}

          {/* Users with a canceling sub see a Reactivate button */}
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

          {/* Paid/processing users see Cancel */}
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
                    You'll keep Pro until your period end; this cannot be undone.
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
        </CardFooter>
      </Card>

      <div className="mt-8">
        <SubscriptionHistory />
      </div>
    </>
  );
};

export default SubscriptionContent;