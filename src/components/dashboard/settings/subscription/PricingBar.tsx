"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  Star,
  Loader2,
  Crown,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PricingBarProps {
  currentPlanId: string | number | undefined;
  isProcessingAction: boolean;
  handleUpgrade: (plan: "pro" | "premium") => void;
  handleFreeSignup?: () => void;
}

const PricingBar: React.FC<PricingBarProps> = ({
  currentPlanId,
  isProcessingAction,
  handleUpgrade,
  handleFreeSignup,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const isPro = currentPlanId === 2;
  const isPremium = currentPlanId === 3;
  const isFree = currentPlanId === 1;

  const plans = [
    // {
    //   id: 'free',
    //   name: 'Free',
    //   price: '€0',
    //   period: '/month',
    //   description: 'Perfect for getting started',
    //   icon: Zap,
    //   color: 'from-gray-500 to-gray-600',
    //   features: [
    //     '2 Resume Analyses',
    //     '2 Cover Letters', 
    //     'Unlimited Document Uploads'
    //   ],
    //   isCurrent: isFree,
    //   isBlocked: isPro || isPremium,
    //   action: handleFreeSignup || (() => {}),
    //   actionLabel: isFree ? 'Current Plan' : 'Get Started Free'
    // },
    {
      id: 'pro',
      name: 'Pro',
      price: '€7.99',
      period: '/month',
      description: 'For serious job seekers',
      icon: Star,
      color: 'from-blue-500 to-blue-600',
      features: [
        '10 Resume Analyses',
        '10 Cover Letters',
        '2 LinkedIn Optimizations',
        // '200 Job Reveals',
        'Unlimited Document Uploads'
      ],
      isCurrent: isPro,
      isBlocked: isPremium,
      action: () => handleUpgrade("pro"),
      actionLabel: isPro ? 'Current Plan' : 'Get Pro'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '€19.99',
      period: '/month',
      description: 'For the ultimate power user',
      icon: Crown,
      color: 'from-purple-500 to-purple-600',
      features: [
        'Unlimited Resumes',
        'Unlimited Cover Letters',
        'Unlimited LinkedIn Optimizations',
        // '500 Job Reveals',
        'Unlimited Document Uploads'
      ],
      isCurrent: isPremium,
      isBlocked: false,
      action: () => handleUpgrade("premium"),
      actionLabel: isPremium ? 'Current Plan' : 'Get Premium'
    }
  ];

  const handlePlanClick = (planId: string) => {
    if (selectedPlan === planId && isExpanded) {
      setIsExpanded(false);
      setSelectedPlan(null);
    } else {
      setSelectedPlan(planId);
      setIsExpanded(true);
    }
  };

  return (
    <div className="w-full">
      {/* Compact Pricing Bar */}
      <Card className="mb-6 overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-900">
              Choose Your Plan
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? (
                <>
                  <ChevronUp size={16} className="mr-1" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown size={16} className="mr-1" />
                  Compare Plans
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Compact Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isSelected = selectedPlan === plan.id;
              
              return (
                <motion.div
                  key={plan.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative"
                >
                  <Card 
                    className={`cursor-pointer transition-all duration-200 ${
                      plan.isCurrent 
                        ? 'border-2 border-purple-500 shadow-lg bg-purple-50' 
                        : isSelected
                        ? 'border-2 border-blue-400 shadow-md'
                        : 'border border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                    onClick={() => handlePlanClick(plan.id)}
                  >
                    {plan.isCurrent && (
                      <div className="absolute -top-2 -right-2">
                        <Badge className="bg-purple-600 text-white text-xs">
                          Current
                        </Badge>
                      </div>
                    )}
                    
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${plan.color}`}>
                            <Icon size={16} className="text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                            <p className="text-xs text-gray-500">{plan.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            {plan.price}
                            <span className="text-sm font-normal text-gray-500">
                              {plan.period}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          plan.action();
                        }}
                        disabled={plan.isBlocked || isProcessingAction || plan.isCurrent}
                        variant={plan.isCurrent ? "outline" : "default"}
                        size="sm"
                        className="w-full"
                      >
                        {isProcessingAction ? (
                          <Loader2 size={14} className="mr-2 animate-spin" />
                        ) : null}
                        {plan.actionLabel}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Expanded Details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="border-t pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Detailed Comparison
                  </h4>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {plans.map((plan) => {
                      const Icon = plan.icon;
                      const isHighlighted = selectedPlan === plan.id || plan.isCurrent;
                      
                      return (
                        <motion.div
                          key={plan.id}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                        >
                          <Card className={`h-full ${
                            isHighlighted ? 'border-2 border-blue-400 shadow-lg' : 'border border-gray-200'
                          }`}>
                            <CardHeader className="text-center pb-4">
                              <div className="flex justify-center mb-3">
                                <div className={`p-3 rounded-full bg-gradient-to-r ${plan.color}`}>
                                  <Icon size={24} className="text-white" />
                                </div>
                              </div>
                              <CardTitle className="text-xl">{plan.name}</CardTitle>
                              <div className="text-3xl font-bold text-gray-900">
                                {plan.price}
                                <span className="text-lg font-normal text-gray-500">
                                  {plan.period}
                                </span>
                              </div>
                              <p className="text-gray-600">{plan.description}</p>
                            </CardHeader>
                            
                            <CardContent>
                              <ul className="space-y-3 mb-6">
                                {plan.features.map((feature, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-gray-700">{feature}</span>
                                  </li>
                                ))}
                              </ul>
                              
                              <Button 
                                onClick={plan.action}
                                disabled={plan.isBlocked || isProcessingAction || plan.isCurrent}
                                variant={plan.isCurrent ? "outline" : "default"}
                                className="w-full"
                              >
                                {isProcessingAction ? (
                                  <Loader2 size={16} className="mr-2 animate-spin" />
                                ) : null}
                                {plan.actionLabel}
                              </Button>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
};

export default PricingBar; 