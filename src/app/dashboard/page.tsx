"use client";

import React, { useEffect, useState } from "react";
import { Hammer, Sparkles, Timer } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { createClient } from "@/utils/supabase/client";

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

const DashboardPage = () => {
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchUserData = async () => {
      // setLoading(true); // setLoading is already true by default
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error("User not authenticated or error fetching user. Redirecting to login.", authError);
        window.location.href = '/auth/sign-up'; // Redirect to your login page
        return; // Stop further execution in this effect
      }

      let fetchedFullName = user.user_metadata?.full_name;
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.warn("Error fetching user's full_name:", profileError);
      } else if (profileData?.full_name) {
        fetchedFullName = profileData.full_name;
      }
      setUserName(fetchedFullName || "there");
    };

    fetchUserData();
    
    // Set the random quote only on the client side after mount
    setCurrentQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    setLoading(false); // Set loading to false after all initial data (user + quote) is ready

  }, [supabase]); // supabase client instance is stable, so this effect runs once on mount

  // const randomQuote = quotes[Math.floor(Math.random() * quotes.length)]; // Moved to useEffect

  return (
    <DashboardLayout>
      <div className="min-h-[70vh] flex flex-col justify-center items-center text-center space-y-6">
        <div className="flex items-center space-x-2">
          <Hammer className="w-6 h-6 text-[#183723]" />
          <h1 className="text-3xl font-bold text-[#183723]">
            {loading || !userName ? "Welcome!" : `Hi ${userName}, we're building something great`}
          </h1>
          <Sparkles className="w-6 h-6 text-[#183723]" />
        </div>

        <p className="text-gray-600 max-w-xl">
          Thanks for being an early user of <strong>Prepzo</strong>. We're working hard behind the scenes to bring powerful career tools your way.
        </p>

        {!loading && currentQuote && (
          <div className="bg-[#f4f4f4] rounded-lg px-6 py-4 shadow-md max-w-md">
            <p className="italic text-[#12231B] text-lg">"{currentQuote.quote}"</p>
            <p className="mt-2 text-right text-sm text-gray-700">— {currentQuote.author}</p>
          </div>
        )}
        {/* Show a placeholder or nothing if quote isn't ready yet during loading */}
        {loading && (
          <div className="bg-[#f4f4f4] rounded-lg px-6 py-4 shadow-md max-w-md opacity-50">
            <p className="italic text-[#12231B] text-lg">Loading a bit of inspiration...</p>
          </div>
        )}

        <p className="text-sm text-gray-500 mt-8 flex items-center space-x-2">
          <Timer className="w-4 h-4 inline mr-1" />
          Stay tuned. Features will roll out soon.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
