"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
// Placeholder imports for icons - replace with actual icon components
// import { GoogleIcon } from '@/components/icons/GoogleIcon';
// import { LinkedInIcon } from '@/components/icons/LinkedInIcon';
// import { Eye, EyeOff } from 'lucide-react'; // For password visibility toggle
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

const SignUpForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<null | 'google' | 'linkedin'>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const handleOAuthSignUp = async (provider: 'google' | 'linkedin') => {
    setIsOAuthLoading(provider);
    setError(null);
    console.log(`Initiating OAuth Sign Up with ${provider}...`);

    // Use the correct provider key required by Supabase (linkedin_oidc)
    const supabaseProvider = provider === 'linkedin' ? 'linkedin_oidc' : provider;

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: supabaseProvider, // Use the correct key here
        options: {
          // This URL needs to exist and handle the OAuth callback (code exchange)
          // It should also be added to your Supabase URL Configuration and provider allowed redirect URIs
          // TEMPORARY DEBUGGING: Hardcode the production URL 
          // redirectTo: `${window.location.origin}/auth/callback`, 
          redirectTo: 'https://your-production-domain.com/auth/callback', // <-- REPLACE WITH YOUR ACTUAL DOMAIN
        },
      });

      if (oauthError) {
        throw oauthError;
      }
      // If successful, Supabase redirects the user to the provider's auth page.
      // The browser will navigate away, so no need to reset loading state here.
      console.log(`Redirecting to ${supabaseProvider} for authentication...`);

    } catch (error: any) {
        console.error(`Error signing in with ${supabaseProvider}:`, error);
        setError(`Failed to sign in with ${supabaseProvider}: ${error.message || 'Please try again.'}`);
        setIsOAuthLoading(null); // Reset loading state on error
    }
  };

  const handleEmailSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    console.log('Attempting email sign up with:', { email });
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        // options: { // Optional: Add if you want email confirmation
        //   emailRedirectTo: `${window.location.origin}/auth/callback`, // Redirect after email confirmation click
        // }
      });

      if (signUpError) {
        throw signUpError;
      }

      console.log("Sign up successful, user data:", data.user);
       // alert('Sign up successful! Check your email for confirmation if required.');
       router.push('/waitlist'); // Redirect to waitlist page on success

    } catch (error: any) {
       console.error('Email sign up error:', error);
       setError(`Sign up failed: ${error.message || 'Please try again.'}`);
    } finally {
       setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="w-full max-w-md mx-auto border-none shadow-none bg-transparent px-4 sm:px-0">
        <CardContent className="space-y-6 pt-6">
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder=""
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || !!isOAuthLoading}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5 relative">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder=""
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || !!isOAuthLoading}
                className="h-10"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive text-center pt-2">{error}</p>
            )}

            <Button 
              type="submit" 
              className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isLoading || !!isOAuthLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted-foreground">
                Or Continue With
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
        <CardFooter className="text-sm text-center block mt-4">
          Already have an account?{' '}
          <Link href="/sign-in" className="font-medium text-primary hover:underline">
            Login
          </Link>
        </CardFooter>
      </Card>
    </>
  );
};

export default SignUpForm;
