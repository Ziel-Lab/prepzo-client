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
        const [profileResponse, subscriptionResponse] = await Promise.all([
          supabase
            .from("profiles")
            .select("answered, paid_user")
            .eq("user_id", user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single(),
          supabase
            .from("user_subscriptions")
            .select("plan_id")
            .eq("user_id", user.id)
            .single()
        ]);

        if (profileResponse.error) {
          console.error("Error fetching profile:", profileResponse.error);
          const { error: createError } = await supabase
            .from("profiles")
            .insert({
              user_id: user.id,
              display_name: user.user_metadata?.full_name || user.email,
              answered: false,
              paid_user: false,
            })
            .select()
            .single();
    
          if (!createError) {
            setIsOpen(true);
            setShowPricing(false); // Ensure questions show first
          }
          return;
        }

        // First check if questions need to be shown
        if (!profileResponse.data?.answered) {
          setIsOpen(true);
          setShowPricing(false); // Make sure pricing doesn't show during questions
        } else {
          // Only show pricing if questions are answered and user is not paid
          setIsOpen(!profileResponse.data?.paid_user);
          setShowPricing(!profileResponse.data?.paid_user);
        }

        // Set plan ID if available
        if (subscriptionResponse.data?.plan_id) {
          setCurrentPlanId(subscriptionResponse.data.plan_id);
        }
      }
    };

    checkOnboardingStatus();
  }, [user, supabase]);

  const progress = useMemo(() => ((currentStep + 1) / questions.length) * 100, [currentStep]);

  const handleNext = () => {
    if (currentStep < questions.length - 1) setCurrentStep((s) => s + 1);
  };
  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };
  const handleChange = (key: string, value: string) => setAnswers((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, paid_user")
        .eq("user_id", user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let result;
      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from("profiles")
          .update({
            ...answers,
            answered: true,
            display_name: user.user_metadata?.full_name || user.email,
            paid_user: existingProfile.paid_user
          })
          .eq('id', existingProfile.id) // Use specific ID to update
          .select();
      } else {
        result = await supabase
          .from("profiles")
          .insert([
            {
              ...answers,
              user_id: user.id,
              display_name: user.user_metadata?.full_name || user.email,
              answered: true,
              paid_user: false
            },
          ])
        .select();
      }
      if (result.error) throw result.error;

      setShowPricing(true);

      // Check subscription status after updating profile
      const { data: subscriptionData } = await supabase
        .from('user_subscriptions')
        .select('plan_id')
        .eq('user_id', user.id)
        .single();
    
      // Only show pricing if user is not paid
      if (subscriptionData?.plan_id) {
        setCurrentPlanId(subscriptionData.plan_id);
      }
      router.refresh();
    } catch (error) {
      console.error("Error saving onboarding data:", error);
    } finally {
      setIsLoading(false);
    }

  };

  const handleUpgrade = async (plan: "pro" | "premium") => {
    if (!user) return;
    setIsProcessingAction(true);
    try {
      const res = await fetch(`/api/checkout/create-session`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan, user_id: user.id }),
      });
      if (!res.ok) throw new Error("Failed to create checkout session");
      const payload = await res.json();
      if (payload?.url) window.location.href = payload.url;
      else console.warn("No checkout redirect url returned", payload);
    } catch (err) {
      console.error("Upgrade error:", err);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;

  return (
    <Dialog open={isOpen}>
      <DialogContent className="w-full sm:max-w-[980px] p-0 mx-auto rounded-xl shadow-xl" hideCloseButton>
        {!showPricing ? (
          <>
            <div className="p-6 sm:p-8 relative">
              <img
                src="/static/images/logo.svg"
                alt="Prepzo logo"
                loading="lazy"
                className="absolute top-4 left-4 h-8 w-auto sm:top-6 sm:left-6 z-20 pointer-events-none"
              />
              <DialogHeader className="mt-10">
                <DialogTitle className="text-2xl sm:text-3xl font-bold text-center">Welcome to Prepzo!</DialogTitle>
                <DialogDescription className="text-center text-sm text-muted-foreground">
                  A few quick questions to personalize your experience.
                </DialogDescription>
              </DialogHeader>

              <div className="my-4">
                <Progress value={progress} className="w-full h-2 rounded-full" />
              </div>

              {/* unified content wrapper */}
              <div className="min-h-[220px] flex flex-col items-center justify-center text-center px-6 sm:px-12">
                <Label className="text-lg font-semibold mb-3">{currentQuestion.question}</Label>

                <div className="w-full max-w-2xl mx-auto">
                  {currentQuestion.type === "radio" && (
                    <RadioGroup
                      value={answers[currentQuestion.key] || ""}
                      onValueChange={(value) => handleChange(currentQuestion.key, value)}
                      className="flex flex-col space-y-4 w-full"
                    >
                      {currentQuestion.options?.map((option, idx) => (
                        // two-column grid: fixed-width radio column + flexible label column
                        <div
                          key={option}
                          className="grid grid-cols-[44px_1fr] items-center gap-x-4 w-full px-2"
                        >
                          <div className="flex items-center justify-center">
                            {/* Radio control centered in its column */}
                            <RadioGroupItem value={option} id={`${currentQuestion.key}-${idx}`} />
                          </div>

                          <div className="flex items-center">
                            {/* label left-aligned within its column for consistent text flow */}
                            <Label
                              htmlFor={`${currentQuestion.key}-${idx}`}
                              className="font-normal text-left leading-relaxed"
                            >
                              {option}
                            </Label>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {currentQuestion.type === "text" && (
                    <div className="mx-auto w-full max-w-md">
                      <Input
                        value={answers[currentQuestion.key] || ""}
                        onChange={(e) => handleChange(currentQuestion.key, e.target.value)}
                        placeholder={currentQuestion.placeholder}
                      />
                    </div>
                  )}

                  {currentQuestion.type === "textarea" && (
                    <div className="mx-auto w-full max-w-lg">
                      <Textarea
                        value={answers[currentQuestion.key] || ""}
                        onChange={(e) => handleChange(currentQuestion.key, e.target.value)}
                        placeholder={currentQuestion.placeholder}
                        rows={4}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between bg-gray-50 p-4 border-t">
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
          <div className="p-6">
            <SubscriptionPricing
              currentPlanId={currentPlanId}
              isProcessingAction={isProcessingAction}
              handleUpgrade={handleUpgrade}
              compact
            />

            {/* <div className="mt-4 flex justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsOpen(false);
                  router.refresh();
                }}
              >
                Close
              </Button>
            </div> */}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
