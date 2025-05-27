"use client"; // Make this a client component

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import SettingsContent from "@/components/dashboard/settings/SettingsContent";
import { createClient } from "@/utils/supabase/client";

interface UserProfile {
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  linkedProviders?: string[]; // Added to store linked provider names
}

const SettingsPage = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error("Error fetching auth user or user not logged in:", authError);
        setLoading(false);
        // Optionally, redirect to login or show an error message
        return;
      }

      let fetchedFullName = user.user_metadata?.full_name;
      let fetchedAvatarUrl = user.user_metadata?.avatar_url;
      let fetchedLinkedProviders: string[] = [];

      if (user.identities) {
        fetchedLinkedProviders = user.identities.map(identity => identity.provider).filter(provider => !!provider) as string[];
      }

      // Attempt to get more details from your custom 'users' table
      const { data: profileData, error: profileError } = await supabase
        .from('users') // Your custom users table
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116: single row not found (can be ignored if metadata is fallback)
        console.warn("Error fetching profile data:", profileError);
      } else if (profileData) {
        fetchedFullName = profileData.full_name || fetchedFullName;
        fetchedAvatarUrl = profileData.avatar_url || fetchedAvatarUrl;
      }
      
      setUserProfile({
        email: user.email,
        fullName: fetchedFullName,
        avatarUrl: fetchedAvatarUrl,
        linkedProviders: fetchedLinkedProviders,
      });
      setLoading(false);
    };

    fetchUserProfile();
  }, [supabase]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-full">
          <p>Loading settings...</p> 
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <SettingsContent 
        email={userProfile?.email}
        fullName={userProfile?.fullName}
        avatarUrl={userProfile?.avatarUrl}
        linkedProviders={userProfile?.linkedProviders}
      />
    </DashboardLayout>
  );
};

export default SettingsPage; 