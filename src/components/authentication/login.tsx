"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft } from 'lucide-react';
import Image from "next/image";

const MinimalLoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<null | 'google' | 'linkedin'>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  
  // Get redirect parameter from URL
  const getRedirectUrl = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('redirect') || '/dashboard';
    }
    return '/dashboard';
  };

  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Error checking session:', sessionError);
      } else if (session) {
        const redirectUrl = getRedirectUrl();
        router.push(redirectUrl);
        return;
      }
      setLoading(false);
    };

    checkSession();
  }, [supabase, router]);

  // Handle OAuth error from URL params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const errorParam = urlParams.get('error');
      if (errorParam === 'oauth_failed') {
        setError('Authentication failed. Please try again or contact support if the issue persists.');
      }
    }
  }, []);

  const handleOAuthSignIn = async (provider: 'google' | 'linkedin') => {
    setIsOAuthLoading(provider);
    setError(null);
    setLoading(true);

    const supabaseProvider = provider === 'linkedin' ? 'linkedin_oidc' : provider;
    const redirectUrl = getRedirectUrl();

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: supabaseProvider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectUrl)}&from=login`
        }
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
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <Link 
        href="/" 
        className="absolute top-4 left-4 sm:top-6 sm:left-6 text-muted-foreground hover:text-foreground transition-colors z-10"
      >
        <ArrowLeft className="h-6 w-6" />
        <span className="sr-only">Back to Home</span>
      </Link>

      <Card className="w-full max-w-md mx-auto border shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-primary">Login to Prepzo</CardTitle>
          <CardDescription className="pt-1">
            Sign in quickly with your preferred service.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
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
              onClick={() => handleOAuthSignIn('google')}
              disabled={!!isOAuthLoading}
            >
              {isOAuthLoading === 'google' ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <Image src="/static/images/Google-Logo.wine.svg" alt="Google" className="w-20 h-20" width={20} height={20} />
                </>
              )}
            </Button>

            <Button
              variant="outline"
              className="h-12 relative"
              onClick={() => handleOAuthSignIn('linkedin')}
              disabled={!!isOAuthLoading}
            >
              {isOAuthLoading === 'linkedin' ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <Image src="/static/images/LinkedIn-Logo.wine.svg" alt="LinkedIn" className="w-20 h-20" width={50} height={50} />
                </>
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            By signing in, you agree to our{' '}
            <Link href="/terms-of-service" className="underline hover:text-primary">Terms of Service</Link>{' '}
            and{' '}
            <Link href="/privacy-policy" className="underline hover:text-primary">Privacy Policy</Link>
          </p>
          <p className="text-sm text-muted-foreground">
            Need an account?{' '}
            <Link 
              href={`/auth/sign-up${typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('redirect') ? `?redirect=${encodeURIComponent(new URLSearchParams(window.location.search).get('redirect')!)}` : ''}`} 
              className="text-primary hover:underline font-medium"
            >
              Sign Up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default MinimalLoginPage;
