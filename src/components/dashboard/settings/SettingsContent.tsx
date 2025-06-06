import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Settings as SettingsIcon,
  User as UserIcon,
  Lock as LockIcon,
  Link as LinkIcon,
  CreditCard as CreditCardIcon,
  LogOut as LogOutIcon,
  LogIn as LogInIcon,
} from "lucide-react";
import SubscriptionContent from "./subscription/SubscriptionContent";

interface SettingsContentProps {
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  linkedProviders?: string[];
}

const handleOAuthSignIn = async (provider: 'google' | 'linkedin') => {
  // Assuming you have a createClient function for Supabase
  // import { createClient } from '@/utils/supabase/client';
  // const supabase = createClient();
  // const { error } = await supabase.auth.signInWithOAuth({
  //   provider: provider,
  //   options: {
  //     redirectTo: window.location.origin + '/auth/callback' // Or your settings page to refresh
  //   }
  // });
  // if (error) console.error(`Error signing in with ${provider}:`, error);
  alert(`Placeholder: Sign in with ${provider}`);
};

const handleOAuthUnlink = async (provider: 'google' | 'linkedin') => {
  alert(`Placeholder: Unlink ${provider} (requires server-side logic or specific Supabase handling)`);
};

const SettingsContent: React.FC<SettingsContentProps> = ({ email, fullName, avatarUrl, linkedProviders = [] }) => {
  const isGoogleConnected = linkedProviders.includes('google');
  const isLinkedInConnected = linkedProviders.includes('linkedin');

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account, security, and subscription
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-semibold">
            <UserIcon className="h-5 w-5" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
          <div className="flex items-center space-x-4">
              <img
                src={avatarUrl || "/static/images/profile-placeholder.png"}
                alt="Profile avatar"
                className="w-16 h-16 rounded-full object-cover"
              />
            </div>
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={fullName || ''} className="mt-1" readOnly disabled />
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Linked Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-semibold">
            <LinkIcon className="h-5 w-5" />
            Linked Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-gray-600">
            Connect or disconnect your social accounts for easy login.
          </p>
          <div className="flex flex-col space-y-3">
            {isGoogleConnected ? (
              <Button variant="outline" onClick={() => handleOAuthUnlink('google')} className="justify-start">
                <LogOutIcon className="mr-2 h-4 w-4" /> Disconnect Google
              </Button>
            ) : (
              <Button variant="outline" onClick={() => handleOAuthSignIn('google')} className="justify-start">
                <LogInIcon className="mr-2 h-4 w-4" /> Connect Google
              </Button>
            )}

            {isLinkedInConnected ? (
              <Button variant="outline" onClick={() => handleOAuthUnlink('linkedin')} className="justify-start">
                <LogOutIcon className="mr-2 h-4 w-4" /> Disconnect LinkedIn
              </Button>
            ) : (
              <Button variant="outline" onClick={() => handleOAuthSignIn('linkedin')} className="justify-start">
                <LogInIcon className="mr-2 h-4 w-4" /> Connect LinkedIn
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subscription Section */}
      <SubscriptionContent />
    </div>
  );
};

export default SettingsContent;