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
    console.log(`Initiating OAuth Sign Up with ${provider}...`);
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
      console.log(`Redirecting to ${supabaseProvider} for authentication...`);

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

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted-foreground">
                Join Waitlist With
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
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
        {/* <CardFooter className="text-sm text-center block mt-6">
          Already have an account?{' '}
          <Link href="/sign-in" className="font-medium text-primary hover:underline">
            Login
          </Link>
        </CardFooter> */}
      </Card>
    </>
  );
};

export default SignUpForm;
