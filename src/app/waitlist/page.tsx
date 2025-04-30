// This component is likely static content, suitable for a Server Component.

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Mail } from "lucide-react";
import Link from "next/link"; // Changed from react-router-dom

// Renamed component to follow convention
const WaitlistPage = () => {

  // Added metadata export
  // export const metadata = { title: 'Waitlist Confirmation' };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/50 p-4"> {/* Use theme colors for gradient */}
      <Card className="w-full max-w-lg text-center shadow-lg animate-fade-in"> {/* Wrap in card, add fade-in */}
        <CardHeader className="pt-8 pb-4"> {/* Adjust padding */}
           <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"> {/* Larger, themed icon bg */}
            <Mail className="h-8 w-8 text-primary" /> {/* Use primary color */}
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-foreground"> {/* Standard text color */}
            You're on the waitlist!
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <CardDescription className="text-lg text-muted-foreground"> {/* Larger description text */}
            Thank you for your interest in Prepzo! Our team is working hard to bring you the best AI-powered career guidance platform. We'll notify you by email as soon as we're ready to welcome you aboard.
          </CardDescription>
        </CardContent>
        <CardFooter className="pb-8"> {/* Use CardFooter */}
          <Link href="/" className="w-full max-w-xs mx-auto"> {/* Constrain button width */}
            <Button variant="outline" size="lg" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 ease-in-out group relative overflow-hidden">
               <span className="absolute left-0 top-0 h-full w-0 bg-primary transition-all duration-300 ease-in-out group-hover:w-full"></span>
               <span className="relative z-10">Return Home</span>
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default WaitlistPage; 