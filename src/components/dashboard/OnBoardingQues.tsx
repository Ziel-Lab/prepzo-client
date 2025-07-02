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
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("answered")
          .eq("user_id", user.id)
          .single();

        // Only open if we successfully fetch the profile AND 'answered' is explicitly false.
        if (!error && data && data.answered === false) {
            setIsOpen(true);
        } else {
          setIsOpen(false);
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

  const handleSubmit = async () => {
    if (!user) return;
    setIsLoading(true);

    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
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
      // Handle error notification to user
    } else {
      setIsOpen(false);
      router.refresh(); // Refresh server components on the page
    }
    setIsLoading(false);
  };

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[525px] p-0" hideCloseButton>
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
      </DialogContent>
    </Dialog>
  );
}
