"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, CheckCircle } from "lucide-react";

interface Plan {
  key: "pro" | "premium";
  name: string;
  price: string;
  priceSuffix: string;
  description: string;
  features: string[];
  isCurrent: boolean;
  action: () => void;
  actionLabel: string;
  actionDisabled: boolean;
}

interface SubscriptionPricingProps {
  currentPlanId: string | number | undefined;
  isProcessingAction: boolean;
  handleUpgrade: (plan: "pro" | "premium") => void;
  handleFreeSignup?: (plan?: "pro" | "premium") => void;
  compact?: boolean; // new prop: render tighter layout for popups
}

const SubscriptionPricing: React.FC<SubscriptionPricingProps> = ({
  currentPlanId,
  isProcessingAction,
  handleUpgrade,
  handleFreeSignup,
  compact = false,
}) => {
  const currentPlanKey = String(currentPlanId ?? "");
  const isPro = currentPlanKey === "2" || currentPlanKey === "pro";
  const isPremium = currentPlanKey === "3" || currentPlanKey === "premium";

  // Read public env links (available client-side when prefixed with NEXT_PUBLIC_)
  const PRO_LINK = "https://buy.stripe.com/dRm7sKazu1bK6sK7WW00000";
  const PREMIUM_LINK = "https://buy.stripe.com/4gM9ASgXSaMk3gy0uu00001";

  const plans: Plan[] = [
    {
      key: "pro",
      name: "Pro",
      price: "€7.99",
      priceSuffix: "/ month",
      description: "For serious job seekers.",
      features: [
        "10 Resume Analyses",
        "10 Cover Letters",
        "3 Mock Interview Sessions",
        "Unlimited Document Uploads",
      ],
      isCurrent: isPro,
      action: () => handleUpgrade("pro"),
      actionLabel: isPro ? "Current Plan" : "Get Pro",
      actionDisabled: isPro || isPremium || isProcessingAction,
    },
    {
      key: "premium",
      name: "Premium",
      price: "€19.99",
      priceSuffix: "/ month",
      description: "For the ultimate power user - 3 days free trial",
      features: [
        "Unlimited Resumes",
        "Unlimited Cover Letters",
        "Unlimited Mock Interview Sessions",
        "Unlimited Document Uploads",
      ],
      isCurrent: isPremium,
      action: () => handleUpgrade("premium"),
      actionLabel: isPremium ? "Current Plan" : "Get Premium",
      actionDisabled: isPremium || isProcessingAction,
    },
  ];

  // compact sizing tokens
  const containerMax = compact ? "max-w-[760px]" : "max-w-4xl";
  const titleSize = compact ? "text-lg" : "text-2xl";
  const priceSize = compact ? "text-xl" : "text-3xl";
  const cardPadding = compact ? "p-4" : "p-6";
  const cardMinW = compact ? "min-w-[300px]" : "min-w-[360px]";

  // Helper to open payment link (if configured) or fallback to provided handler
  const openPaymentOrFallback = (planKey: "pro" | "premium") => {
    const link = planKey === "pro" ? PRO_LINK : PREMIUM_LINK;
    if (link) {
      // prefer opening in same tab to behave like current window.location assignment
      window.location.href = link;
    } else {
      // fallback to the programmatic checkout flow
      handleUpgrade(planKey);
    }
  };

  // Start trial should use same links per user's request; if no link, fall back to optional handler
  const startTrialOrFallback = (planKey: "pro" | "premium") => {
    const link = planKey === "pro" ? PRO_LINK : PREMIUM_LINK;
    if (link) {
      window.location.href = link;
    } else if (handleFreeSignup) {
      // if user provided a handler, call it (we pass planKey for context if they want it)
      handleFreeSignup(planKey);
    } else {
      // nothing configured — no-op or you could show a toast
      console.warn("No free signup handler or payment link configured for", planKey);
    }
  };

  return (
    <div className={`w-full ${containerMax} mx-auto`}>
      <div className="text-center mb-4">
        <h1 className={`${titleSize} font-extrabold tracking-tight text-black`}>Find the perfect plan for you</h1>
        <p className="mt-1 text-sm text-green-700">Simple, transparent pricing. No hidden fees.</p>
      </div>

      {/* horizontal scroll fallback if the popup is narrow */}
      <div className="w-full overflow-x-auto">
        <div className={`grid grid-cols-2 gap-4 ${compact ? "min-w-[640px]" : "min-w-[720px]"}`}>
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`flex flex-col relative overflow-hidden rounded-xl transition-transform transform-gpu hover:-translate-y-0.5 shadow-md ${cardPadding} ${cardMinW} ${plan.isCurrent ? "border-2 border-green-600 bg-gradient-to-br from-black/80 via-black/70 to-green-900 text-white" : "bg-white"}`}
            >
              {plan.isCurrent && (
                <div className="absolute top-3 right-3">
                  <div className="px-2 py-0.5 rounded-full bg-green-600 text-xs font-semibold text-white">Current</div>
                </div>
              )}

              <CardHeader className="text-center p-0">
                <CardTitle className={`font-semibold ${plan.isCurrent ? "text-white" : "text-black"}`}>{plan.name}</CardTitle>
                <p className={`mt-2 ${priceSize} font-extrabold ${plan.isCurrent ? "text-white" : "text-gray-900"}`}>
                  {plan.price}
                  <span className={`ml-2 text-sm font-medium ${plan.isCurrent ? "text-green-200" : "text-gray-500"}`}>
                    {plan.priceSuffix}
                  </span>
                </p>
                <CardDescription className={`${plan.isCurrent ? "text-green-200/90 mt-2" : "mt-2 text-gray-600"}`}>
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-grow p-0 mt-4">
                <ul className={`space-y-2 ${compact ? "px-2" : "px-4"}`}>
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <CheckCircle className={`h-5 w-5 mr-3 mt-1 flex-shrink-0 ${plan.isCurrent ? "text-green-300" : "text-green-600"}`} />
                      <span className={`${plan.isCurrent ? "text-white" : "text-gray-700"} text-sm`}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className={`pt-4 px-0 pb-0 ${compact ? "mt-3" : ""}`}>
                <div className="w-full px-0">
                  <Button
                    onClick={() => openPaymentOrFallback(plan.key)}
                    disabled={plan.actionDisabled}
                    className={`w-full py-2 font-semibold rounded-md ${plan.isCurrent ? "bg-transparent border border-green-300 text-white cursor-not-allowed" : "bg-black text-white hover:bg-green-700"}`}
                  >
                    {plan.isCurrent ? (
                      "Your Plan"
                    ) : isProcessingAction ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin inline-block" /> Processing…
                      </>
                    ) : (
                      plan.actionLabel
                    )}
                  </Button>

                  {!plan.isCurrent && (
                    <button
                      onClick={() => startTrialOrFallback(plan.key)}
                      disabled={isProcessingAction}
                      className="mt-2 w-full text-sm py-2 rounded-md border border-black/5 hover:bg-black/5 bg-white"
                    >
                      Start trial
                    </button>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPricing;
