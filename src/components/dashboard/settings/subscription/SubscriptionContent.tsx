"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, Star, XCircle, CheckCircle } from "lucide-react";
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

// The SubscriptionPlan and FeatureUsage interfaces will be inferred from the context
// This avoids maintaining duplicate interfaces and prevents type mismatch errors.

interface SubscriptionStatus {
  status: 'active' | 'canceled' | 'past_due' | 'free_trial' | 'free';
  current_period_end: string;
  subscription_plans: { // Use inline or inferred type
    id: string | number;
    name: string;
    price: number;
    resume_limit_per_month: number;
    cover_letter_limit_per_month: number;
    linkedin_optimize_limit_per_month: number;
  };
  usage: {
    resume_count: number;
    cover_letter_count: number;
    linkedin_optimize_count: number;
  };
}

// --- Component ---

const SubscriptionContent = () => {
  const { subscription, isLoading, error: subscriptionError, refetch } = useSubscription();
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const channel = supabase
      .channel('user-subscriptions-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_subscriptions' },
        (payload) => {
          console.log('Subscription change received, refetching data.', payload);
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch, supabase]);

  useEffect(() => {
    // NOTE: For success redirect to work, you must configure your Stripe payment link
    // to redirect to a URL like: /your-page?success=true
    if (searchParams.get('success') === 'true') {
      setShowSuccessMessage(true);
      const timer = setTimeout(() => {
        router.push('/dashboard/settings');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  const handleUpgrade = async () => {
    setIsProcessingAction(true);
    setActionError(null);
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
            throw new Error("Could not retrieve user session for upgrade.");
        }
        const userId = session.user.id;

        const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;
        if (!paymentLink) {
            throw new Error("Stripe payment link is not configured.");
        }
        
        // Dynamically construct the Stripe Payment Link URL with the user's ID.
        const url = new URL(paymentLink);
        url.searchParams.set('client_reference_id', userId);
        
        // Prefill the email on the Stripe checkout page for convenience.
        if (session.user.email) {
            url.searchParams.set('prefilled_email', session.user.email);
        }
        
        // Redirect the user to the constructed Stripe URL.
        window.location.href = url.toString();
    } catch (err: any) {
        setActionError(err.message);
        setIsProcessingAction(false); // Set processing to false only if an error occurs.
    }
  };

  const handleCancel = async () => {
    setIsProcessingAction(true);
    setActionError(null);
    try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData?.session?.access_token) throw new Error("Could not retrieve user session for cancellation.");
        
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
        const response = await fetch(`${backendUrl}/subscription/stripe/cancel-subscription`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not cancel subscription.");
        
        await refetch(); // Refresh status
    } catch (err: any) {
        setActionError(err.message);
    } finally {
        setIsProcessingAction(false);
    }
  };

  const planName = subscription?.subscription_plans.name || '...';
  const planIsActive = subscription?.status === 'active';
  const planIsCanceling = subscription?.status === 'canceling';
  const planIsCanceled = subscription?.status === 'canceled';

  const usageMetrics = subscription ? [
    { name: 'Resume Analyses', used: subscription.usage.resume_count || 0, limit: subscription.subscription_plans.resume_limit_per_month },
    { name: 'Cover Letters', used: subscription.usage.cover_letter_count || 0, limit: subscription.subscription_plans.cover_letter_limit_per_month },
    { name: 'LinkedIn Optimizations', used: subscription.usage.linkedin_optimize_count || 0, limit: subscription.subscription_plans.linkedin_optimize_limit_per_month },
  ] : [];

  if (isLoading) {
    return <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div>;
  }

  const error = subscriptionError || actionError;
  if (error) {
    return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
  }

  if (!subscription) {
     return <p>No subscription details found.</p>;
  }

  return (
    <>
      {showSuccessMessage && (
        <Alert variant="default" className="mb-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-700" />
            <AlertTitle>Upgrade Successful!</AlertTitle>
            <AlertDescription>
              Your plan has been upgraded to Pro. You will be redirected to the settings page in 5 seconds.
            </AlertDescription>
        </Alert>
      )}
      {(planIsCanceling || planIsCanceled) && (
         <Alert variant="default" className="bg-yellow-50 border-yellow-200">
            <XCircle className="h-4 w-4 text-yellow-700" />
            <AlertTitle>Subscription Canceled</AlertTitle>
            <AlertDescription>
              Your Pro plan is canceled. You can still use Pro features until your current period ends on {new Date(subscription.current_period_end).toLocaleDateString()}.
            </AlertDescription>
         </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {planIsActive || planIsCanceling || planIsCanceled ? <Star className="text-yellow-500"/> : null} Your Plan: <span className="text-purple-600 capitalize">{planName}</span>
          </CardTitle>
          <CardDescription>
            Your current billing period ends on {new Date(subscription.current_period_end).toLocaleDateString()}.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <h3 className="text-md font-semibold mb-4">Monthly Usage</h3>
            <div className="space-y-6">
                {usageMetrics.map(metric => (
                    <div key={metric.name}>
                        <div className="flex justify-between items-center mb-1">
                            <p className="text-sm font-medium">{metric.name}</p>
                            <p className="text-sm text-gray-500">{metric.used ?? 0} / {metric.limit}</p>
                        </div>
                        <Progress value={metric.limit > 0 ? ((metric.used ?? 0) / metric.limit) * 100 : 0} />
                    </div>
                ))}
            </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-4">
            {subscription?.status === 'free' && (
                <Button onClick={handleUpgrade} disabled={isProcessingAction}>
                    {isProcessingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Star className="mr-2 h-4 w-4" />}
                     Upgrade to Pro
                </Button>
            )}
            {planIsActive && (
                 <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="destructive" disabled={isProcessingAction}>
                            {isProcessingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <XCircle className="mr-2 h-4 w-4" />}
                            Cancel Subscription
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Are you sure you want to cancel?</DialogTitle>
                            <DialogDescription>
                                You can continue using Pro features until the end of your current billing period. This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="ghost">Nevermind</Button></DialogClose>
                            <Button variant="destructive" onClick={handleCancel} disabled={isProcessingAction}>
                                {isProcessingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Yes, Cancel Now'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </CardFooter>
      </Card>
    </>
  );
};

export default SubscriptionContent; 