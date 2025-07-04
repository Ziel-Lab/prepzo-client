"use client";

// This page relies on client-only hooks (e.g. useSearchParams).
// Mark it as dynamic so Next.js skips static prerender at build time.
export const dynamic = 'force-dynamic';

import React, { useEffect, useState, Suspense } from "react";
import { Hammer, Sparkles, Timer, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { createClient } from "@/utils/supabase/client";
import OverviewContent from "@/components/dashboard/overview/overviewContent";
import OnBoardingQues from "@/components/dashboard/OnBoardingQues";
import { User } from "@supabase/supabase-js";
import { useSearchParams } from "next/navigation";
import { useSubscription } from "@/contexts/SubscriptionContext";


const quotes = [
  { quote: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { quote: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { quote: "Great things are not done by impulse, but by a series of small things brought together.", author: "Vincent Van Gogh" },
  { quote: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { quote: "Success is not final, failure is not fatal: It is the courage to continue that counts.", author: "Winston Churchill" },
  { quote: "Dream big. Start small. Act now.", author: "Robin Sharma" },
  { quote: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { quote: "Small deeds done are better than great deeds planned.", author: "Peter Marshall" },
  { quote: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { quote: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { quote: "If you're working on something exciting, it will keep you motivated.", author: "Steve Jobs" },
  { quote: "Opportunities don't happen. You create them.", author: "Chris Grosser" },
  { quote: "Never doubt that a small group of thoughtful, committed people can change the world.", author: "Margaret Mead" },
];

interface Quote {
  quote: string;
  author: string;
}

const DashboardContent = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const supabase = createClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true); // Set loading true at the start of fetch
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          console.error("User not authenticated or error fetching user. Clearing session and redirecting.", authError);
          await supabase.auth.signOut(); // Clear the invalid session
          window.location.href = '/auth/sign-up'; 
          return; 
        }
        setUser(user);

        // Ensure user subscription and usage tables are populated
        await fetch('/api/updateTable', { method: 'POST' });

        const fetchedFullName = user.user_metadata?.full_name;
        
        setUserName((fetchedFullName?.split(' ')[0]) || 'there');
      } catch (error) {
        console.error("An error occurred during user data fetch:", error);
        // Set a default name or handle the error appropriately
        setUserName('there');
      } finally {
        setLoading(false); // Set loading to false after all fetching is done
      }
    };

    fetchUserData();
    setCurrentQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    
  }, [supabase]);

  // Nested component that can safely access SubscriptionContext
  const AmplitudeSignup = ({ user }: { user: User | null }) => {
    const { subscription } = useSubscription();

    useEffect(() => {
      if (!user) return;

      if (searchParams.get('login') === 'success') {
        // Determine the OAuth provider used during signup
        let storedSource: string | null = 'Google';
        try {
          if (typeof window !== 'undefined') {
            storedSource = localStorage.getItem('signup_source');
          }
        } catch (e) {
          console.warn('Unable to read signup_source from localStorage:', e);
        }

        const source = storedSource === 'linkedin' ? 'Linkedin' : 'Google';

        // Determine subscription info
        const subscription_status = subscription?.status ?
          subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1) : 'Active';

        const subscription_plan = subscription?.subscription_plans?.name ||
          (subscription_status === 'Pro' ? 'Pro' : 'Free');

        fetch('/api/amplitude-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_uuid: user.id,
            user_email: user.email,
            user_name: user.user_metadata?.full_name,
            source,
            subscription_status,
            subscription_plan,
          }),
        });
      }
    }, [searchParams, user, subscription]);

    return null;
  };

  return (
    <DashboardLayout>
      <OnBoardingQues user={user} />
      {/* Track signup event once SubscriptionProvider is in context */}
      <AmplitudeSignup user={user} />
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      ) : (
        <OverviewContent userName={userName} currentQuote={currentQuote} />
      )}
    </DashboardLayout>
  );
};

const DashboardPage = () => {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-full">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
};

export default DashboardPage;
