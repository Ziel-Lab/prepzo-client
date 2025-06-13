"use client"; // Make this a client component

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import SettingsContent from "@/components/dashboard/settings/SettingsContent";
import { createClient } from "@/utils/supabase/client";

interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
}

const SettingsPage = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          throw new Error("User session not found.");
        }

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
        if (!backendUrl) {
          throw new Error("Backend URL is not configured.");
        }

        const response = await fetch(`${backendUrl}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch user profile.");
        }

        const profileData: UserProfile = await response.json();
        setUserProfile(profileData);
      } catch (err: any) {
        console.error("Error fetching profile:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
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

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-full text-red-500">
          <p>Error: {error}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <SettingsContent
        email={userProfile?.email}
        fullName={userProfile?.full_name}
        avatarUrl={userProfile?.avatar_url}
        // linkedProviders need to be handled differently now
      />
    </DashboardLayout>
  );
};

export default SettingsPage; 