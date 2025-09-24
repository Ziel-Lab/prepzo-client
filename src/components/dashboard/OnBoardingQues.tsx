"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from '@/utils/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import SubscriptionPricing from "./settings/subscription/subscriptionPricing";

const questions = [
  {
    key: "priority",
    question: "What's your top priority right now?",
    type: "radio",
    options: [
      "Land a new job",
      "Level up where I am",
      "Pivot into something else",
      "Launch a side-gig / freelance",
    ],
  },
  {
    key: "timeframe",
    question: "How soon do you want to hit that?",
    type: "radio",
    options: ["1–3 months", "4–6 months", "6+ months / no rush"],
  },
  {
    key: "career_stage",
    question: "What's your current career stage?",
    type: "radio",
    options: [
      "Just starting (student / grad)",
      "Early (1–4 yrs)",
      "Mid (5–10 yrs)",
      "Senior (10+ yrs)",
    ],
  },
  {
    key: "focus_area",
    question: "Which one area would help you most today?",
    type: "radio",
    options: [
      "Sharpen my resume/portfolio",
      "Practice interviews / presentations",
      "Build network & outreach",
      "Negotiate salary or contracts",
    ],
  },
  {
    key: "blocker",
    question: "What's your single biggest blocker right now?",
    type: "textarea",
    placeholder: `e.g., "I lack a portfolio," "I freeze in interviews," etc.`,
  },
  {
    key: "target_role",
    question: "What role or position are you targeting?",
    type: "text",
    placeholder: `e.g., "Product Manager," "Graphic Designer," "Data Analyst"`,
  },
  {
    key: "source",
    question: "How did you hear about Prepzo.ai?",
    type: "radio",
    options: [
      "LinkedIn",
      "Friend or colleague referral",
      "Google search",
      "Social media (Twitter / Instagram / Facebook)",
      "Webinar or virtual event",
      "Other",
    ],
  },
];

export default function OnBoardingQues({ user }: { user: User | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState<string | number | undefined>(undefined);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("answered, plan_id")
          .eq("user_id", user.id)
          .single();

        // Only open if we successfully fetch the profile AND 'answered' is explicitly false.
        if (!error && data && data.answered === false) {
            setIsOpen(true);
        } else {
          setIsOpen(false);
        }

        // if there's a plan_id saved, store it (used by SubscriptionPricing)
        if (!error && data && data.plan_id !== undefined) {
          setCurrentPlanId(data.plan_id);
        }
      }
    };
    checkOnboardingStatus();
  }, [user, supabase]);

  const progress = useMemo(
    () => ((currentStep + 1) / questions.length) * 100,
    [currentStep]
  );

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleChange = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  // Save profile answers; after successful save, open SubscriptionPricing instead of simply closing
  const handleSubmit = async () => {
    if (!user) return;
    setIsLoading(true);

    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, plan_id')
        .eq('user_id', user.id)
        .single();

    let result;
    if (profileData) {
        // Update existing profile
        result = await supabase
            .from('profiles')
            .update({ ...answers, answered: true, display_name: user.user_metadata.full_name || user.email })
            .eq('user_id', user.id);
    } else {
        // Insert new profile
        result = await supabase.from("profiles").insert([
            {
                ...answers,
                user_id: user.id,
                display_name: user.user_metadata.full_name || user.email,
                answered: true,
            },
        ]);
    }
    
    const { error } = result;

    if (error) {
      console.error("Error saving onboarding data:", error);
      // TODO: show user-facing error toast/alert
    } else {
      // After successful save, open the Pricing chooser so the user can pick a plan
      // Keep the dialog open but replace content with SubscriptionPricing
      // Also refresh server components so the rest of the app sees the updated answered flag
      setShowPricing(true);

      // refresh to update server components (optional; will re-run server code)
      router.refresh();

      // If profileData had plan_id, keep it
      if (profileData?.plan_id !== undefined) {
        setCurrentPlanId(profileData.plan_id);
      }
    }
    setIsLoading(false);
  };

  // Example handleUpgrade - calls a Supabase Edge function or RPC to create a checkout session
  // Replace `create_checkout_session` with your own endpoint/RPC. The function should return { url }.
  const handleUpgrade = async (plan: "pro" | "premium") => {
    if (!user) return;
    setIsProcessingAction(true);
    try {
      // If you have a Supabase Edge function:
      // const { data, error } = await supabase.functions.invoke('create_checkout_session', { body: { plan, user_id: user.id } });
      // or an RPC: const { data, error } = await supabase.rpc('create_checkout_session', { plan_name: plan, user_id: user.id })
      //
      // Below is a placeholder implementation — adapt to your backend.
      const res = await fetch(`/api/checkout/create-session`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan, user_id: user.id }),
      });

      if (!res.ok) {
        throw new Error("Failed to create checkout session");
      }
      const payload = await res.json();
      if (payload?.url) {
        // redirect to Stripe Checkout or billing hosted page
        window.location.href = payload.url;
        return;
      } else if (payload?.sessionId) {
        // if you need to use Stripe client to redirect using sessionId, handle here
        // e.g. stripe.redirectToCheckout({ sessionId: payload.sessionId })
      } else {
        // fallback: mark as processing or show success UI
        console.warn("No checkout redirect url returned", payload);
      }
    } catch (err) {
      console.error("Upgrade error:", err);
      // TODO: show toast/error to user
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleFreeSignup = async () => {
    // Optional: handle free plan selection (if you want to allow selecting free plan here)
    // Example: set user's plan_id to 1 in profiles
    if (!user) return;
    setIsProcessingAction(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ plan_id: 1 })
        .eq("user_id", user.id);
      if (error) throw error;
      setCurrentPlanId(1);
      // close onboarding/pricing or show confirmation
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      console.error("Free signup error:", err);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[700px] p-0" hideCloseButton>
        {!showPricing ? (
          <>
            <div className="p-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">
                  Welcome to Prepzo!
                </DialogTitle>
                <DialogDescription>
                  A few quick questions to personalize your experience.
                </DialogDescription>
              </DialogHeader>
              <div className="my-6">
                <Progress value={progress} className="w-full" />
              </div>
              <div className="space-y-4 min-h-[200px]">
                <Label className="text-lg font-semibold">
                  {currentQuestion.question}
                </Label>
                {currentQuestion.type === "radio" && (
                  <RadioGroup
                    value={answers[currentQuestion.key] || ""}
                    onValueChange={(value) =>
                      handleChange(currentQuestion.key, value)
                    }
                    className="space-y-2"
                  >
                    {currentQuestion.options?.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={option} />
                        <Label htmlFor={option} className="font-normal">{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
                {currentQuestion.type === "text" && (
                  <Input
                    value={answers[currentQuestion.key] || ""}
                    onChange={(e) =>
                      handleChange(currentQuestion.key, e.target.value)
                    }
                    placeholder={currentQuestion.placeholder}
                  />
                )}
                {currentQuestion.type === "textarea" && (
                  <Textarea
                    value={answers[currentQuestion.key] || ""}
                    onChange={(e) =>
                      handleChange(currentQuestion.key, e.target.value)
                    }
                    placeholder={currentQuestion.placeholder}
                  />
                )}
              </div>
            </div>
            <div className="flex justify-between bg-gray-50 p-4 border-t">
                <Button variant="outline" onClick={handleBack} disabled={currentStep === 0 || isLoading}>
                    Back
                </Button>
                <div>
                {isLastStep ? (
                    <Button onClick={handleSubmit} disabled={!answers[currentQuestion.key] || isLoading}>
                    {isLoading ? "Saving..." : "Finish"}
                    </Button>
                ) : (
                    <Button onClick={handleNext} disabled={!answers[currentQuestion.key] || isLoading}>
                    Next
                    </Button>
                )}
                </div>
            </div>
          </>
        ) : (
          // Replace dialog content with the SubscriptionPricing chooser
          <div className="p-6">
            <SubscriptionPricing
              currentPlanId={currentPlanId}
              isProcessingAction={isProcessingAction}
              handleUpgrade={handleUpgrade}
              handleFreeSignup={handleFreeSignup}
            />
            <div className="mt-6 text-right">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsOpen(false);
                  router.refresh();
                }}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}