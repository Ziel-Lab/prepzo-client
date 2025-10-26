import React, { useState } from "react";
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
  Loader2,
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { createClient } from "@/utils/supabase/client";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SettingsContentProps {
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  linkedProviders?: string[];
}

const SettingsContent: React.FC<SettingsContentProps> = ({ email, fullName, avatarUrl, linkedProviders = [] }) => {
  const isGoogleConnected = linkedProviders.includes('google');
  const isLinkedInConnected = linkedProviders.includes('linkedin');
  const { subscription, isLoading: isSubscriptionLoading, error: subscriptionError } = useSubscription();

  const [isConnecting, setIsConnecting] = useState<null | 'google' | 'linkedin'>(null);
  const [isDisconnecting, setIsDisconnecting] = useState<null | 'google' | 'linkedin'>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    type: 'confirmUnlink' | 'errorUnlink';
    provider?: 'google' | 'linkedin';
  }>({ open: false, type: 'confirmUnlink' });

  const supabase = createClient();

  const handleOAuthSignIn = async (provider: 'google' | 'linkedin') => {
    setIsConnecting(provider);
    setError(null);
    const supabaseProvider = provider === 'linkedin' ? 'linkedin_oidc' : provider;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: supabaseProvider,
      options: {
        redirectTo: `${window.location.origin}/dashboard/settings`,
      },
    });

    if (error) {
      setError(`Error connecting ${provider}: ${error.message}`);
      setIsConnecting(null);
    }
  };

  const handleAttemptUnlink = (provider: 'google' | 'linkedin') => {
    if (linkedProviders.length <= 1) {
      setDialogState({ open: true, type: 'errorUnlink' });
    } else {
      setDialogState({ open: true, type: 'confirmUnlink', provider });
    }
  };
  
  const executeUnlink = async () => {
    const providerToUnlink = dialogState.provider;
    if (!providerToUnlink) return;

    setIsDisconnecting(providerToUnlink);
    setDialogState({ open: false, type: 'confirmUnlink' }); // Close dialog
    setError(null);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Could not retrieve user details to unlink provider.");
      }

      // The provider name in the identity object from Supabase is 'google' or 'linkedin'.
      const identityToUnlink = user.identities?.find(
        (identity) => identity.provider === providerToUnlink
      );

      if (!identityToUnlink) {
        throw new Error(`Could not find a linked ${providerToUnlink} account to disconnect.`);
      }

      const { error: unlinkError } = await supabase.auth.unlinkIdentity(identityToUnlink);

      if (unlinkError) {
        throw unlinkError;
      }

      // Success, reload to reflect the change
      window.location.reload();

    } catch (err: any) {
      setError(`Failed to disconnect ${providerToUnlink}: ${err.message}`);
    } finally {
      setIsDisconnecting(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account, security, and subscription
        </p>
      </div>

       {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>An Error Occurred</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
              <Button variant="outline" onClick={() => handleAttemptUnlink('google')} disabled={isDisconnecting === 'google'} className="justify-start">
                 {isDisconnecting === 'google' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOutIcon className="mr-2 h-4 w-4" />}
                Disconnect Google
              </Button>
            ) : (
              <Button variant="outline" onClick={() => handleOAuthSignIn('google')} disabled={isConnecting === 'google'} className="justify-start">
                {isConnecting === 'google' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogInIcon className="mr-2 h-4 w-4" />}
                Connect Google
              </Button>
            )}

            {isLinkedInConnected ? (
              <Button variant="outline" onClick={() => handleAttemptUnlink('linkedin')} disabled={isDisconnecting === 'linkedin'} className="justify-start">
                 {isDisconnecting === 'linkedin' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOutIcon className="mr-2 h-4 w-4" />}
                Disconnect LinkedIn
              </Button>
            ) : (
              <Button variant="outline" onClick={() => handleOAuthSignIn('linkedin')} disabled={isConnecting === 'linkedin'} className="justify-start">
                {isConnecting === 'linkedin' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogInIcon className="mr-2 h-4 w-4" />}
                Connect LinkedIn
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subscription Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-semibold">
            <CreditCardIcon className="h-5 w-5" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
            {isSubscriptionLoading ? (
                <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading subscription status...</span>
                </div>
            ) : subscriptionError ? (
                <div className="text-red-600 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>{subscriptionError}</span>
                </div>
            ) : (
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-gray-600">Your current plan is</p>
                        <p className="text-lg font-bold text-purple-600 capitalize">
                            {subscription?.subscription_plans.plan_name || '...'}
                        </p>
                    </div>
                    <Link href="/dashboard/settings/subscription" passHref>
                        <Button variant="outline">
                            View My Subscription
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            )}
        </CardContent>
      </Card>

       <Dialog open={dialogState.open} onOpenChange={(open) => setDialogState({ ...dialogState, open })}>
        <DialogContent>
          {dialogState.type === 'errorUnlink' && (
            <>
              <DialogHeader>
                <DialogTitle>Cannot Disconnect Account</DialogTitle>
                <DialogDescription>
                  You must have at least one social account linked to log in. Please connect another account before disconnecting this one.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button">OK</Button>
                </DialogClose>
              </DialogFooter>
            </>
          )}
          {dialogState.type === 'confirmUnlink' && (
            <>
              <DialogHeader>
                <DialogTitle>Are you sure?</DialogTitle>
                <DialogDescription>
                  You are about to disconnect your <span className="font-bold capitalize">{dialogState.provider}</span> account. You will no longer be able to log in using this account.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">Cancel</Button>
                </DialogClose>
                <Button variant="destructive" onClick={executeUnlink}>
                  Yes, Disconnect
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsContent;