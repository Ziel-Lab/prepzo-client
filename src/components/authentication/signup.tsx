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

const SignUpForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<null | 'google' | 'linkedin'>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOAuthSignUp = async (provider: 'google' | 'linkedin') => {
    setIsOAuthLoading(provider);
    setError(null);
    console.log(`Initiating Sign Up with ${provider}...`);
    
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

    if (provider === 'google') {
      // Redirect the browser to the backend Google login route
      window.location.href = `${backendUrl}/api/auth/google/login`;
    } else if (provider === 'linkedin') {
      // Redirect the browser to the backend LinkedIn login route
      window.location.href = `${backendUrl}/api/auth/linkedin/login`;
    }
    
    // Note: No need to reset loading state here as the page will redirect immediately.
  };

  const handleEmailSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    console.log('Attempting email sign up with:', { email });
    // Placeholder: Implement actual email/password sign up logic here
    
    // Simulating API call delay for demo
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Replace with actual API call result check
    if(email === 'test@fail.com') {
       setError("This email is already taken.");
    } else {
       console.log("Simulated sign up success");
       // Handle success e.g. redirect or show success message
    }
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto border-none shadow-none bg-transparent">
      {/* Optional: Add a title if needed, image has none within the form area */}
      {/* <CardHeader className="space-y-1 text-center pb-4">
        <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
      </CardHeader> */}
      <CardContent className="space-y-6 pt-6"> {/* Added top padding */}
        {/* Email/Password Form */}
        <form onSubmit={handleEmailSignUp} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="" // No placeholder in image
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || !!isOAuthLoading}
              className="h-10" // Standard height
            />
          </div>
          <div className="space-y-1.5 relative">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              // type={showPassword ? 'text' : 'password'}
              type="password" // Defaulting to password, add toggle if needed
              placeholder="" // No placeholder in image
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || !!isOAuthLoading}
              className="h-10" // Standard height pr-10 for icon space
            />
            {/* Password visibility toggle - uncomment and style if needed
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-[calc(0.375rem+1.5rem)] h-5 w-5 text-muted-foreground" // Adjust positioning
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
             */}
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-sm text-destructive text-center pt-2">{error}</p>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground" // Adjusted styling to use primary color
            disabled={isLoading || !!isOAuthLoading}
          >
            {isLoading ? 'Signing Up...' : 'Sign Up'}
          </Button>
        </form>

        {/* Separator */}
        <div className="relative my-6"> {/* Increased margin */}
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-2 text-muted-foreground"> {/* Use background color */}
              Or Continue With
            </span>
          </div>
        </div>

        {/* OAuth Buttons */}
        <div className="grid grid-cols-2 gap-4"> {/* Use grid for side-by-side */}
           <Button
             variant="outline"
             className="w-full h-14 flex items-center justify-center p-0" // Reverted button height to h-14
             onClick={() => handleOAuthSignUp('google')}
             disabled={isLoading || !!isOAuthLoading}
           >
             {isOAuthLoading === 'google' ? (
               <span className="animate-spin h-10 w-10 border-2 border-foreground border-t-transparent rounded-full"></span> // Reverted spinner size to h-10 w-10
             ) : (
               <>
                 {/* <GoogleIcon /> Placeholder */}
                 <img src="/static/images/Google-Logo.wine.svg" alt="Google logo" className="w-full h-full object-contain" /> 
               </>
             )}
           </Button>
           <Button
             variant="outline"
             className="w-full h-14 flex items-center justify-center p-0" // Reverted button height to h-14
             onClick={() => handleOAuthSignUp('linkedin')}
             disabled={isLoading || !!isOAuthLoading}
           >
             {isOAuthLoading === 'linkedin' ? (
               <span className="animate-spin h-10 w-10 border-2 border-foreground border-t-transparent rounded-full"></span> // Reverted spinner size to h-10 w-10
             ) : (
                <>
                 {/* <LinkedInIcon /> Placeholder */}
                 <img src="/static/images/Linkedin-Logo.wine.svg" alt="LinkedIn logo" className="w-full h-full object-contain" /> 
               </>
             )}
           </Button>
        </div>

      </CardContent>
      <CardFooter className="text-sm text-center block mt-4"> {/* Added margin top */}
        Already have an account?{' '}
        <Link href="/sign-in" className="font-medium text-primary hover:underline"> {/* Use primary color for link */}
          Login
        </Link>
      </CardFooter>
    </Card>
  );
};

export default SignUpForm;
