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


const DashboardPage = () => {
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchUserName = async () => {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error("Error fetching auth user:", authError);
        setUserName("there");
        setLoading(false);
        return;
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
      setLoading(false);
    };

    fetchUserName();
  }, [supabase]);

  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  return (
    <DashboardLayout>
      <div className="min-h-[70vh] flex flex-col justify-center items-center text-center space-y-6">
        <div className="flex items-center space-x-2">
          <Hammer className="w-6 h-6 text-[#183723]" />
          <h1 className="text-3xl font-bold text-[#183723]">
            {loading ? "Welcome!" : `Hi ${userName}, we're building something great`}
          </h1>
          <Sparkles className="w-6 h-6 text-[#183723]" />
        </div>

        <p className="text-gray-600 max-w-xl">
          Thanks for being an early user of <strong>Prepzo</strong>. We’re working hard behind the scenes to bring powerful career tools your way.
        </p>

        <div className="bg-[#f4f4f4] rounded-lg px-6 py-4 shadow-md max-w-md">
          <p className="italic text-[#12231B] text-lg">“{randomQuote.quote}”</p>
          <p className="mt-2 text-right text-sm text-gray-700">— {randomQuote.author}</p>
        </div>

        <p className="text-sm text-gray-500 mt-8 flex items-center space-x-2">
          <Timer className="w-4 h-4 inline mr-1" />
          Stay tuned. Features will roll out soon.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
