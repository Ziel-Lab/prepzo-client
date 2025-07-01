"use client";

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
import { Alert } from "@/components/ui/alert";

interface Plan {
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
  handleFreeSignup?: () => void;
}

const SubscriptionPricing: React.FC<SubscriptionPricingProps> = ({
  currentPlanId,
  isProcessingAction,
  handleUpgrade,
  handleFreeSignup,
}) => {
  // Based on your backend: plan_id 2 = Pro, plan_id 3 = Premium
  const isPro = currentPlanId === 2;
  const isPremium = currentPlanId === 3;

  const plans: Plan[] = [
    {
      name: "Free",
      price: "$0",
      priceSuffix: "/ month",
      description: "Perfect for getting started.",
      features: [
        "2 Resume Analyses",
        "2 Cover Letters",
        "Unlimited Document Uploads",
      ],
      isCurrent: currentPlanId === 1,
      action: handleFreeSignup || (() => {}),
      actionLabel: currentPlanId === 1 ? "Current Plan" : "Get Started Free",
              actionDisabled: (currentPlanId === 1 && !handleFreeSignup) || isProcessingAction,
    },
    {
      name: "Pro",
      price: "$7.99",
      priceSuffix: "/ month",
      description: "For serious job seekers.",
      features: [
        "10 Resume Analyses",
        "10 Cover Letters",
        "2 LinkedIn Optimizations",
        "200 Job Reveals",
        "Unlimited Document Uploads",
      ],
      isCurrent: isPro,
      action: () => handleUpgrade("pro"),
      actionLabel: isPro ? "Current Plan" : "Get Pro",
      actionDisabled: isPro || isProcessingAction,
    },
    {
      name: "Premium",
      price: "$19.99",
      priceSuffix: "/ month",
      description: "For the ultimate power user.",
      features: [
        "Unlimited Resumes",
        "Unlimited Cover Letters",
        "Unlimited LinkedIn Optimizations",
        "500 Job Reveals",
        "Unlimited Document Uploads",
      ],
      isCurrent: isPremium,
      action: () => handleUpgrade("premium"),
      actionLabel: isPremium ? "Current Plan" : "Get Premium",
      actionDisabled: isPremium || isProcessingAction,
    },
  ];

  return (
    <div>
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Find the perfect plan for you
        </h1>
        <p className="mt-3 text-xl text-gray-500 sm:mt-4">
          Simple, transparent pricing. No hidden fees.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`flex flex-col ${
              plan.isCurrent
                ? "border-2 border-purple-600 shadow-xl relative"
                : "shadow-lg"
            }`}
          >
            {plan.isCurrent && (
              <div className="absolute top-0 right-0 -mt-3 -mr-3">
                <div className="bg-purple-600 text-white text-xs font-bold uppercase py-1 px-3 rounded-full">
                  Current Plan
                </div>
              </div>
            )}
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
              <p className="text-4xl font-extrabold text-gray-900 mt-2">
                {plan.price}
                <span className="text-lg font-medium text-gray-500">
                  {plan.priceSuffix}
                </span>
              </p>
              <CardDescription className="mt-4">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                onClick={plan.action}
                disabled={plan.actionDisabled}
                className="w-full"
                variant={plan.isCurrent ? "outline" : "default"}
              >
                {plan.isCurrent ? (
                  "Your Plan"
                ) : isProcessingAction ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  plan.actionLabel
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionPricing;
