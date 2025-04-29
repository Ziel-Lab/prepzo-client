// This component is likely static content, suitable for a Server Component.

import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import Link from "next/link"; // Changed from react-router-dom

// Renamed component to follow convention
const WaitlistPage = () => {

  // Added metadata export
  // export const metadata = { title: 'Waitlist Confirmation' };

  return (
    // Removed min-h-screen, layout handles vertical sizing
    <div className="flex items-center justify-center bg-gradient-to-b from-prepzo/5 to-prepzo/10 py-16"> {/* Adjusted padding */} 
      <div className="container max-w-3xl mx-auto px-4 text-center">
        <div className="space-y-6">
          <div className="inline-block p-4 bg-prepzo/10 rounded-full mb-4">
            <Mail className="w-8 h-8 text-prepzo" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-prepzo">
            You're on the waitlist!
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Thank you for your interest in Prepzo! Our team is working hard to bring you the best AI-powered career guidance platform. We'll notify you as soon as we're ready to welcome you aboard.
          </p>
          
          <div className="pt-8">
            <Link href="/"> {/* Changed to next/link and href */}
              <Button variant="outline" size="lg" className="border-prepzo text-prepzo hover:bg-prepzo hover:text-white">
                Return Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitlistPage; 