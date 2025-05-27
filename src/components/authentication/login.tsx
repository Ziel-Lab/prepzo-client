"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";

const MinimalLoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<null | 'google' | 'linkedin'>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

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

  const handleOAuthSignIn = async (provider: 'google' | 'linkedin') => {
    setIsOAuthLoading(provider);
    setError(null);
    setLoading(true);

    const supabaseProvider = provider === 'linkedin' ? 'linkedin_oidc' : provider;

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: supabaseProvider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (oauthError) throw oauthError;
    } catch (error: any) {
      console.error(`Error signing in with ${supabaseProvider}:`, error);
      setError(`Failed to sign in with ${supabaseProvider}: ${error.message || 'Please try again.'}`);
      setIsOAuthLoading(null);
      setLoading(false);
    }
  };

  if (loading && !isOAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-xs sm:max-w-sm mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl sm:text-3xl font-bold">Login to Prepzo</CardTitle>
          <CardDescription className="pt-1">
            Sign in quickly with your preferred service.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {error && (
            <p className="text-sm text-destructive text-center pb-2">{error}</p>
          )}

          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full h-14 flex items-center justify-center p-0 text-base sm:text-lg"
              onClick={() => handleOAuthSignIn('google')}
              disabled={!!isOAuthLoading}
            >
              {isOAuthLoading === 'google' ? (
                <span className="animate-spin h-8 w-8 border-2 border-foreground border-t-transparent rounded-full"></span>
              ) : (
                <img src="/static/images/Google-Logo.wine.svg" alt="Google logo" className="h-10 object-contain" /> 
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full h-14 flex items-center justify-center p-0 text-base sm:text-lg"
              onClick={() => handleOAuthSignIn('linkedin')}
              disabled={!!isOAuthLoading}
            >
              {isOAuthLoading === 'linkedin' ? (
                <span className="animate-spin h-8 w-8 border-2 border-foreground border-t-transparent rounded-full"></span>
              ) : (
                <img src="/static/images/LinkedIn-Logo.wine.svg" alt="LinkedIn logo" className="h-10 object-contain" /> 
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2 text-sm pt-6">
            <p className="text-gray-600 text-xs">
              By signing in, you agree to our Terms of Service.
            </p>
            <p className="text-gray-500 text-xs">
                Need an account? <Link href="/auth/sign-up"><span className="text-prepzo hover:underline font-semibold cursor-pointer">Sign Up</span></Link>
            </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default MinimalLoginPage;
