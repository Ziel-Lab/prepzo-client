"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Star, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface LimitReachedProps {
  featureName: string; // e.g., "Resume Analysis"
  featureNamePlural: string; // e.g., "Resume Analyses"
  lifetimeCount?: number;
}

/**
 * A component to display when a user has hit their usage limit for a feature.
 * Provides a clear message and a CTA to upgrade their subscription.
 */
export const LimitReached = ({ featureName, featureNamePlural, lifetimeCount }: LimitReachedProps) => {
  return (
    <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 h-full">
      <Card className="w-full max-w-lg text-center shadow-xl border-yellow-300 dark:border-yellow-700">
        <CardHeader className="items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/50">
                <AlertTriangle className="h-8 w-8 text-yellow-500 dark:text-yellow-400" />
            </div>
            <CardTitle className="mt-4 text-2xl font-bold text-gray-800 dark:text-gray-100">
                Monthly Limit Reached
            </CardTitle>
            <CardDescription className="mt-2 text-md text-gray-600 dark:text-gray-400 px-4">
                You have used all of your available {featureNamePlural.toLowerCase()} for this billing period.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-700 dark:text-gray-300">
            To continue performing {featureNamePlural.toLowerCase()} and unlock unlimited access to all Pro tools, please upgrade your plan.
          </p>
          {typeof lifetimeCount === 'number' && lifetimeCount > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You've used this feature a total of {lifetimeCount} {lifetimeCount === 1 ? 'time' : 'times'}. Keep it up!
            </p>
          )}
          <Link href="/dashboard/settings/subscription" passHref>
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white">
              <Star className="mr-2 h-5 w-5" />
              Upgrade to Pro
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default LimitReached;
