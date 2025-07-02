"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Loader2, AlertCircle, Wand2, FileText, Linkedin, BarChart2, ArrowRight } from 'lucide-react';

interface OverviewContentProps {
  userName: string | null;
  currentQuote: {
    quote: string;
    author: string;
  } | null;
}

const tools = [
  {
    title: 'Resume Analyzer',
    description: 'Get AI-powered feedback on your resume against a job description.',
    link: '/dashboard/tools/analyze-resume',
    icon: <FileText className="h-8 w-8 text-blue-500" />,
  },
  {
    title: 'Cover Letter Generator',
    description: 'Create a tailored cover letter in seconds for any job application.',
    link: '/dashboard/tools/cover-letter',
    icon: <Wand2 className="h-8 w-8 text-purple-500" />,
  },
  {
    title: 'LinkedIn Optimizer',
    description: 'Enhance your LinkedIn profile to attract recruiters and opportunities.',
    link: '/dashboard/tools/linkedin-optimizer',
    icon: <Linkedin className="h-8 w-8 text-sky-600" />,
  },
];

const OverviewContent: React.FC<OverviewContentProps> = ({ userName, currentQuote }) => {
  const { subscription, isLoading: isSubscriptionLoading, error: subscriptionError } = useSubscription();

  // Usage metrics with Premium user filtering (same logic as SubscriptionContent.tsx)
  let usageMetrics = (subscription && subscription.usage) ? [
    {
      name: "Resume Analyses",
      used: subscription.usage.resume_period_count,
      limit: subscription.subscription_plans?.resume_limit_per_month ?? 'N/A',
    },
    {
      name: "Cover Letters",
      used: subscription.usage.cover_letter_period_count,
      limit: subscription.subscription_plans?.cover_letter_limit_per_month ?? 'N/A',
    },
    {
      name: "LinkedIn Optimizations",
      used: subscription.usage.linkedin_optimize_period_count,
      limit: subscription.subscription_plans?.linkedin_optimize_limit_per_month ?? 'N/A',
    },
    {
      name: "Job Reveals",
      used: subscription.usage.job_search_results_period_count ?? 0,
      limit: subscription.subscription_plans.job_search_results_limit_per_month ?? 0,
    },
  ] : [];

  // Filter metrics for Premium users (plan_id = 3) - only show Job Reveals since they have unlimited access to others
  if (subscription?.subscription_plans?.id === 3) {
    usageMetrics = usageMetrics.filter(
      (metric) => metric.name === "Job Reveals"
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-800">
          Hi {userName || 'there'}, welcome to Prepzo!
        </h1>
        <p className="text-lg text-gray-600">
          We're working hard to build you the best career toolkit. Here's what you can do today.
        </p>
      </div>
      
      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8 space-y-8 lg:space-y-0">
        
        {/* Left Side: Tools & Quote */}
        <div className="lg:col-span-2 space-y-8">
            {/* Tools Section */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Get Started</CardTitle>
                    <CardDescription>Jump right into our powerful AI tools.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tools.map((tool) => (
                        <Link key={tool.title} href={tool.link} passHref>
                            <Card className="h-full hover:shadow-md hover:border-purple-300 transition-all duration-200 flex flex-col">
                                <CardHeader className="flex-shrink-0">
                                    {tool.icon}
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <h3 className="font-semibold text-lg">{tool.title}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{tool.description}</p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </CardContent>
            </Card>
            {/* Quote of the Day */}
            {currentQuote && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 shadow-sm">
                    <blockquote className="text-center">
                    <p className="text-lg italic text-purple-800">"{currentQuote.quote}"</p>
                    <footer className="mt-3 text-sm text-purple-600 font-medium">— {currentQuote.author}</footer>
                    </blockquote>
                </div>
            )}
        </div>

        {/* Right Side: Usage */}
        <div className="lg:col-span-1">
          <Card className="shadow-sm h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                <BarChart2 className="h-5 w-5" />
                Monthly Usage
              </CardTitle>
              <CardDescription>
                Your plan: <span className="font-bold text-purple-600 capitalize">{subscription?.subscription_plans?.name || '...'}</span>
                {subscription?.subscription_plans?.id === 3 && (
                  <div className="text-xs text-green-600 mt-1">
                    ✨ Unlimited Resume, Cover Letter & LinkedIn access
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSubscriptionLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : subscriptionError ? (
                <div className="text-red-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>Error loading usage.</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {usageMetrics.map((m) => (
                    <div key={m.name}>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-medium">{m.name}</p>
                        <p className="text-sm text-gray-500">
                          {m.used} / {m.limit}
                        </p>
                      </div>
                      <Progress value={typeof m.limit === 'number' && m.limit > 0 ? (m.used / m.limit) * 100 : 0} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
                 <Link href="/dashboard/settings/subscription" passHref className="w-full">
                    <Button variant="outline" className="w-full">
                        Manage My Subscription
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OverviewContent;
