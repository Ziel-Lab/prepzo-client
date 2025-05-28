import SignUpForm from '@/components/authentication/signup';
import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const SignUpPage = () => {
  return (
    <div className="relative flex items-center justify-center min-h-screen bg-background p-4">
      <Link href="/" className="absolute top-4 left-4 sm:top-6 sm:left-6 text-muted-foreground hover:text-foreground transition-colors z-10">
        <ArrowLeft className="h-6 w-6" />
        <span className="sr-only">Back to Home</span>
      </Link>
      
      <SignUpForm />
    </div>
  );
};

export default SignUpPage;
