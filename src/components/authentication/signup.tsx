"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

const SignUpForm = () => {
  const [isOAuthLoading, setIsOAuthLoading] = useState<null | 'google' | 'linkedin'>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const handleOAuthSignUp = async (provider: 'google' | 'linkedin') => {
    setIsOAuthLoading(provider);
    setError(null);
    const supabaseProvider = provider === 'linkedin' ? 'linkedin_oidc' : provider;

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: supabaseProvider,
        options: {
          // Revert to using dynamic window.location.origin
          redirectTo: `${window.location.origin}/auth/callback`, 
        },
      });

      if (oauthError) throw oauthError;

    } catch (error: any) {
      console.error(`Error signing in with ${supabaseProvider}:`, error);
      setError(`Failed to sign in with ${supabaseProvider}: ${error.message || 'Please try again.'}`);
      setIsOAuthLoading(null);
    }
  };

  return (
    <>
      <Card className="w-full max-w-md mx-auto border-none shadow-none bg-transparent px-4 sm:px-0">
        <CardContent className="space-y-6 pt-6">
          {error && (
              <p className="text-sm text-destructive text-center pt-2">{error}</p>
            )}

          <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-4">
            Join the Waitlist Now!
          </h2>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-2 text-muted-foreground">
                with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 pt-2 items-center">
             <Button
               variant="outline"
               className="w-full h-14 flex items-center justify-center p-0"
               onClick={() => handleOAuthSignUp('google')}
               disabled={!!isOAuthLoading}
             >
               {isOAuthLoading === 'google' ? (
                 <span className="animate-spin h-10 w-10 border-2 border-foreground border-t-transparent rounded-full"></span>
               ) : (
                 <>
                   <img src="/static/images/Google-Logo.wine.svg" alt="Google logo" className="w-full h-full object-contain" /> 
                 </>
               )}
             </Button>

            <div className="flex items-center justify-center h-14">
              <span className="text-sm text-muted-foreground">or</span>
            </div>

             <Button
               variant="outline"
               className="w-full h-14 flex items-center justify-center p-0"
               onClick={() => handleOAuthSignUp('linkedin')}
               disabled={!!isOAuthLoading}
             >
               {isOAuthLoading === 'linkedin' ? (
                 <span className="animate-spin h-10 w-10 border-2 border-foreground border-t-transparent rounded-full"></span>
               ) : (
                  <>
                   <img src="/static/images/LinkedIn-Logo.wine.svg" alt="LinkedIn logo" className="w-full h-full object-contain" /> 
                 </>
               )}
             </Button>
          </div>

        </CardContent>
      </Card>
    </>
  );
};

export default SignUpForm;
