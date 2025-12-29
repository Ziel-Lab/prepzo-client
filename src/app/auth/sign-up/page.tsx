import SignUpForm from '@/components/authentication/signup';
import React, { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const SignUpPage = () => {
  return (
    <div className="relative flex items-center justify-center min-h-screen bg-background">
      {/* <Link href="/" className="absolute top-4 left-4 sm:top-6 sm:left-6 text-muted-foreground hover:text-foreground transition-colors z-10">
        <ArrowLeft className="h-6 w-6" />
        <span className="sr-only">Back to Home</span>
      </Link> */}
      
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      }>
        <SignUpForm />
      </Suspense>
    </div>
  );
};

export default SignUpPage;
