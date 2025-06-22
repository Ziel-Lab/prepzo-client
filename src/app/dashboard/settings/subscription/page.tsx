import React, { Suspense } from 'react';
import SubscriptionContent from '@/components/dashboard/settings/subscription/SubscriptionContent';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';

const SubscriptionPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl mx-auto py-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscription & Usage</h1>
          <p className="text-gray-600 mt-1">Manage your plan and see your feature usage for the current period.</p>
        </div>
        <Suspense fallback={<SubscriptionSkeleton />}>
          <SubscriptionContent />
        </Suspense>
      </div>
    </DashboardLayout>
  );
};

const SubscriptionSkeleton = () => {
  return (
    <div className="space-y-6">
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}

export default SubscriptionPage;
