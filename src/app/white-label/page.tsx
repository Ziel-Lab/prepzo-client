"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import WhiteLabelTools from '@/components/white-label/WhiteLabelTools';
import WhiteLabelMockInterview from '@/components/white-label/WhiteLabelMockInterview';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  CheckCircle, 
  Star,
  Users,
  TrendingUp,
  Shield
} from "lucide-react";
import Image from "next/image";

const WhiteLabelLandingPage = () => {
  const router = useRouter();
  const { config, isWhiteLabel } = useWhiteLabel();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setIsLoading(false);
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/auth/sign-up');
    }
  };

  const handleTryTools = () => {
    if (isAuthenticated) {
      router.push('/dashboard/tools');
    } else {
      router.push('/auth/sign-up?redirect=/dashboard/tools');
    }
  };

  const features = [
    {
      icon: <CheckCircle className="h-6 w-6 text-green-500" />,
      title: "AI-Powered Tools",
      description: "Advanced AI technology for personalized career guidance"
    },
    {
      icon: <Shield className="h-6 w-6 text-blue-500" />,
      title: "Secure & Private",
      description: "Your data is protected with enterprise-grade security"
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-purple-500" />,
      title: "Proven Results",
      description: "Join thousands who've improved their career prospects"
    },
    {
      icon: <Users className="h-6 w-6 text-orange-500" />,
      title: "Expert Support",
      description: "Get help from our team of career development experts"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Software Engineer",
      company: "Tech Corp",
      content: "The mock interview feature helped me land my dream job at Google. The AI feedback was incredibly detailed and actionable.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Marketing Manager",
      company: "StartupXYZ",
      content: "The resume generator saved me hours of work and helped me create a professional resume that got me multiple interviews.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Recent Graduate",
      company: "University",
      content: "As a new graduate, these tools gave me the confidence and skills I needed to start my career journey.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary" className="text-sm">
                  Powered by {isWhiteLabel ? config.brandName : 'Prepzo AI'}
                </Badge>
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6">
                {config.heroTitle}
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                {config.heroSubtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={handleGetStarted} className="w-full sm:w-auto">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button variant="outline" size="lg" onClick={handleTryTools} className="w-full sm:w-auto">
                  Try Our Tools
                </Button>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-80 h-80 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center">
                  <div className="text-6xl">🚀</div>
                </div>
                <div className="absolute -top-4 -right-4 bg-green-500 text-white rounded-full p-3">
                  <Star className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose Our Platform?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {config.description}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <WhiteLabelTools />
        </div>
      </section>

      {/* Mock Interview Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <WhiteLabelMockInterview />
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of professionals who've transformed their careers
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Career?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of professionals who've already improved their career prospects with our AI-powered tools.
          </p>
          <Button 
            size="lg" 
            variant="secondary" 
            onClick={handleGetStarted}
            className="text-primary"
          >
            Start Your Journey Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default WhiteLabelLandingPage;
