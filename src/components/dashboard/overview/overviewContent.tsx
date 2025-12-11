"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, Wand2, FileText, BarChart2, ArrowRight, MessageSquare, CheckCircle, Sparkles, TrendingUp, Target, Zap } from 'lucide-react';

interface OverviewContentProps {
  userName: string | null;
  currentQuote: {
    quote: string;
    author: string;
  } | null;
  subscription?: any;
  isLoading?: boolean;
  error?: any;
}

const otherTools = [
  {
    title: 'Resume Generator',
    description: 'AI-powered resume optimization',
    link: '/dashboard/tools/resume-generator',
    icon: <FileText className="h-6 w-6 text-blue-500" />,
  },
  {
    title: 'Cover Letter Generator',
    description: 'Tailored cover letters in seconds',
    link: '/dashboard/tools/cover-letter',
    icon: <Wand2 className="h-6 w-6 text-purple-500" />,
  },
];

const mockInterviewBenefits = [
  {
    icon: <Target className="h-5 w-5 text-white" />,
    title: 'Real Interview Scenarios',
    description: 'Practice with questions from actual job interviews'
  },
  {
    icon: <TrendingUp className="h-5 w-5 text-white" />,
    title: 'Detailed Feedback',
    description: 'Get AI-powered insights to improve your responses'
  },
  {
    icon: <Zap className="h-5 w-5 text-white" />,
    title: 'Build Confidence',
    description: 'Master your interview skills before the big day'
  },
  {
    icon: <CheckCircle className="h-5 w-5 text-white" />,
    title: 'Track Progress',
    description: 'Monitor your improvement over time'
  }
];

const OverviewContent: React.FC<OverviewContentProps> = ({ 
  userName, 
  currentQuote,
  subscription,
  isLoading: isSubscriptionLoading,
  error: subscriptionError 
}) => {
  // Usage metrics with Premium user filtering
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
    {
      name: "Mock Interview Sessions",
      used: (subscription.usage as any).mock_interview_session_lifetime_count ?? 0,
      limit: (subscription.subscription_plans as any)?.mock_interview_session ?? 0,
    },
  ] : [];

  // Filter metrics for Premium users
  if (subscription?.subscription_plans?.id === 3) {
    usageMetrics = usageMetrics.filter(
      (metric) => metric.name === "Mock Interview Sessions"
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
          Master your interviews with AI-powered practice and feedback.
        </p>
      </div>
      
      {/* Hero Section - Mock Interview Spotlight */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-green-800 to-teal-900 p-8 md:p-10 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-600/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>
        
        <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
          {/* Left: Content */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                <Sparkles className="h-3 w-3 mr-1" />
                Featured Tool
              </Badge>
            </div>
            
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-4xl font-bold text-white">Mock Interview</h2>
              </div>
              <p className="text-lg text-white/90">
                Practice with AI, get instant feedback, and ace your next interview with confidence.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                size="lg" 
                className="w-full bg-black text-white hover:bg-gray-900 font-semibold shadow-lg hover:shadow-xl transition-all"
                onClick={() => window.location.href = '/dashboard/tools/mock-Interview'}
              >
                Start Practice Session
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center gap-4 text-white/80 text-sm">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                <span>Unlimited practice</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                <span>AI feedback</span>
              </div>
            </div>
          </div>

          {/* Right: Benefits Grid */}
          <div className="grid grid-cols-2 gap-4">
            {mockInterviewBenefits.map((benefit, index) => (
              <div 
                key={index}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all"
              >
                <div className="bg-white/20 rounded-lg p-2 w-fit mb-3">
                  {benefit.icon}
                </div>
                <h3 className="font-semibold text-white mb-1 text-sm">{benefit.title}</h3>
                <p className="text-xs text-white/70">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8 space-y-8 lg:space-y-0">
        
        {/* Left Side: Other Tools & Quote */}
        <div className="lg:col-span-2 space-y-8">
          {/* Other Tools Section */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold">More Tools</CardTitle>
              <CardDescription>Additional resources to boost your career</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {otherTools.map((tool) => (
                <Card 
                  key={tool.title} 
                  className="h-full hover:shadow-md hover:border-purple-300 transition-all duration-200 cursor-pointer"
                  onClick={() => window.location.href = tool.link}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        {tool.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-base mb-1">{tool.title}</h3>
                        <p className="text-sm text-gray-500">{tool.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Quote of the Day */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6 shadow-sm">
            <blockquote className="text-center">
              <p className="text-lg italic text-purple-800">
                "{currentQuote?.quote || 'Success is not final, failure is not fatal: it is the courage to continue that counts.'}"
              </p>
              <footer className="mt-3 text-sm text-purple-600 font-medium">
                — {currentQuote?.author || 'Winston Churchill'}
              </footer>
            </blockquote>
          </div>
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
                Your plan: <span className="font-bold text-purple-600 capitalize">{subscription?.subscription_plans?.plan_name || '...'}</span>
                {subscription?.subscription_plans?.id === 3 && (
                  <div className="text-xs text-green-600 mt-1">
                    ✨ Unlimited access to all tools
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
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.href = '/dashboard/settings/subscription'}
              >
                Manage My Subscription
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OverviewContent;