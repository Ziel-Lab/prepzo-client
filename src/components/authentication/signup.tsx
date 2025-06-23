"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const SignUpForm = () => {
  const [loading, setLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<null | 'google' | 'linkedin'>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Error checking session:', sessionError);
      } else if (session) {
        router.push('/dashboard');
        return;
      }
      setLoading(false);
    };

    checkSession();
  }, [supabase, router]);

  const handleOAuthSignUp = async (provider: 'google' | 'linkedin') => {
    setIsOAuthLoading(provider);
    setError(null);
    setLoading(true);
    const supabaseProvider = provider === 'linkedin' ? 'linkedin_oidc' : provider;

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: supabaseProvider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (oauthError) throw oauthError;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      console.error(`Error signing in with ${supabaseProvider}:`, error);
      setError(`Failed to sign in with ${supabaseProvider}: ${errorMessage}`);
      setIsOAuthLoading(null);
      setLoading(false);
    }
  };

  if (loading && !isOAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <Card className="w-full max-w-md mx-auto border shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold text-primary">
            Welcome to Prepzo!
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Join 400+ professionals accelerating their career growth
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md text-center">
              {error}
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">
                Continue with
              </span>
            </div>
          </div>

          <div className="grid gap-4">
            <Button
              variant="outline"
              className="h-12 relative"
              onClick={() => handleOAuthSignUp('google')}
              disabled={!!isOAuthLoading}
            >
              {isOAuthLoading === 'google' ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <img src="/static/images/Google-Logo.wine.svg" alt="Google" className="w-5 h-5" />
                  <span>Sign up with Google</span>
                </>
              )}
            </Button>

            <Button
              variant="outline"
              className="h-12 relative"
              onClick={() => handleOAuthSignUp('linkedin')}
              disabled={!!isOAuthLoading}
            >
              {isOAuthLoading === 'linkedin' ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <img src="/static/images/LinkedIn-Logo.wine.svg" alt="LinkedIn" className="w-5 h-5" />
                  <span>Sign up with LinkedIn</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            By signing up, you agree to our{' '}
            <a href="/terms-of-service" className="underline hover:text-primary">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy-policy" className="underline hover:text-primary">
              Privacy Policy
            </a>
          </p>
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignUpForm;
