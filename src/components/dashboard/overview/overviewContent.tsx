"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Loader2, AlertCircle, Wand2, FileText, Linkedin, BarChart2, ArrowRight, Briefcase, MessageSquare } from 'lucide-react';

interface OverviewContentProps {
  userName: string | null;
  currentQuote: {
    quote: string;
    author: string;
  } | null;
}

const tools = [
  {
    title: 'Resume Generator',
    description: 'Generate and optimize your resume with AI-powered suggestions.',
    link: '/dashboard/tools/resume-generator',
    icon: <FileText className="h-8 w-8 text-blue-500" />,
  },
  {
    title: 'Cover Letter Generator',
    description: 'Create a tailored cover letter in seconds for any job application.',
    link: '/dashboard/tools/cover-letter',
    icon: <Wand2 className="h-8 w-8 text-purple-500" />,
  },
  // {
  //   title: 'LinkedIn Optimizer',
  //   description: 'Enhance your LinkedIn profile to attract recruiters and opportunities.',
  //   link: '/dashboard/tools/linkedin-optimizer',
  //   icon: <Linkedin className="h-8 w-8 text-sky-600" />,
  // },
  {
    title: 'Mock Interview',
    description: 'Practice interviews with AI and get detailed feedback to improve.',
    link: '/dashboard/tools/mock-Interview',
    icon: <MessageSquare className="h-8 w-8 text-emerald-500" />,
  },
  // {
  //   title: 'Applications',
  //   description: 'Track and manage your job applications with detailed analytics.',
  //   link: '/dashboard/applications',
  //   icon: <Briefcase className="h-8 w-8 text-green-500" />,
  // },
];

const OverviewContent: React.FC<OverviewContentProps> = ({ userName, currentQuote }) => {
  const { subscription, isLoading: isSubscriptionLoading, error: subscriptionError } = useSubscription();

  // Usage metrics with Premium user filtering (same logic as SubscriptionContent.tsx)
  let usageMetrics = (subscription && subscription.usage) ? [
    {
      name: "Resume Generations",
      used: subscription.usage.resume_period_count,
      limit: subscription.subscription_plans?.resume_limit_per_month ?? 'N/A',
    },
    {
      name: "Cover Letters",
      used: subscription.usage.cover_letter_period_count,
      limit: subscription.subscription_plans?.cover_letter_limit_per_month ?? 'N/A',
    },
    // {
    //   name: "LinkedIn Optimizations",
    //   used: subscription.usage.linkedin_optimize_period_count,
    //   limit: subscription.subscription_plans?.linkedin_optimize_limit_per_month ?? 'N/A',
    // },
    {
      name: "Mock Interview Sessions",
      used: (subscription.usage as any).mock_interview_session_lifetime_count ?? 0,
      limit: (subscription.subscription_plans as any)?.mock_interview_session ?? 0,
    },
    // {
    //   name: "Job Reveals",
    //   used: subscription.usage.job_search_results_period_count ?? 0,
    //   limit: subscription.subscription_plans.job_search_results_limit_per_month ?? 0,
    // },
  ] : [];

  // Filter metrics for Premium users (plan_id = 3) - only show Job Reveals and Mock Interview Sessions since they have unlimited access to others
  if (subscription?.subscription_plans?.id === 3) {
    usageMetrics = usageMetrics.filter(
      (metric) => metric.name === "Job Reveals" || metric.name === "Mock Interview Sessions"
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
                    ✨ Unlimited Resume, Cover Letter, LinkedIn & Mock Interview access
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSubscriptionLoading ? (
                <div className="flex flex-col items-center justify-center h-40 space-y-3">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium text-gray-700">Setting up your account...</p>
                    <p className="text-xs text-gray-500">This may take a few moments for new users</p>
                  </div>
                </div>
              ) : subscriptionError ? (
                <div className="flex flex-col items-center justify-center h-40 space-y-3">
                  <AlertCircle className="h-6 w-6 text-amber-500" />
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium text-amber-700">Loading your usage data...</p>
                    <p className="text-xs text-gray-500">Please wait while we set up your account</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.location.reload()}
                    className="mt-2"
                  >
                    Refresh
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {usageMetrics.map((m) => (
                    <div key={m.name}>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-medium">{m.name}</p>
                        <p className="text-sm text-gray-500">
                          {m.used} / {subscription?.subscription_plans?.id === 3 ? "unlimited" : m.limit}
                        </p>
                      </div>
                      <Progress value={subscription?.subscription_plans?.id === 3 ? 0 : (typeof m.limit === 'number' && m.limit > 0 ? (m.used / m.limit) * 100 : 0)} />
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
