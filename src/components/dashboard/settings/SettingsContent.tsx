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
} from "lucide-react";

const SettingsContent = () => {
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
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Doe" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input id="username" placeholder="johndoe" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Input id="bio" placeholder="Tell us about yourself" className="mt-1" />
            </div>
            <div className="flex items-center space-x-4">
              <img
                src="https://via.placeholder.com/80"
                alt="Profile avatar"
                className="rounded-full"
              />
              <Button size="sm">Change Avatar</Button>
            </div>
            <Button type="submit">Save Profile</Button>
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
            <Button variant="outline">Connect Google</Button>
            <Button variant="outline">Connect GitHub</Button>
            <Button variant="outline">Disconnect Facebook</Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-semibold">
            <LockIcon className="h-5 w-5" />
            Security &amp; Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                className="mt-1"
              />
            </div>
            <Separator className="my-2" />
            <div>
              <Label htmlFor="current_password">Current Password</Label>
              <Input
                id="current_password"
                type="password"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="new_password">New Password</Label>
              <Input
                id="new_password"
                type="password"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="confirm_password">Confirm New Password</Label>
              <Input
                id="confirm_password"
                type="password"
                className="mt-1"
              />
            </div>
            <Button type="submit">Update Security</Button>
          </form>
        </CardContent>
      </Card>

      {/* Subscription Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-semibold">
            <CreditCardIcon className="h-5 w-5" />
            Subscription Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Current Plan: <span className="font-medium">Pro Monthly</span>
          </p>
          <div className="space-y-3">
            <Button>Upgrade to Pro Annual</Button>
            <Button variant="outline">Change Billing Info</Button>
            <Button variant="destructive">Cancel Subscription</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsContent;