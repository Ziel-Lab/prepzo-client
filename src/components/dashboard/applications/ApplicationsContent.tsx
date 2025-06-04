"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import ApplicationTracker from "@/components/dashboard/ApplicationTracker";
import NewApplicationDialog from "@/components/dashboard/applications/NewApplicationDialog";
import BlurOverlay from "@/components/dashboard/blurrEffect";

interface ApplicationsContentProps {
  isFeatureAvailable: boolean;
  isLoading: boolean;
  onOverlayCtaClick?: () => void;
}

const ApplicationsContent: React.FC<ApplicationsContentProps> = ({ isFeatureAvailable, isLoading, onOverlayCtaClick }) => {
  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-600 mt-1">Track your job applications and progress</p>
        </div>
        <div className={`${!isFeatureAvailable ? 'opacity-50 pointer-events-none' : ''}`}>
          <NewApplicationDialog />
        </div>
      </div>
      <div className="relative flex-grow min-h-0">
        {!isFeatureAvailable && !isLoading && (
          <BlurOverlay 
            message="Upgrade to Pro to track your applications."
            ctaText="Upgrade to Pro"
            onCtaClick={onOverlayCtaClick} 
          />
        )}
        <div className={`${!isFeatureAvailable ? 'opacity-50 pointer-events-none' : ''} h-full`}>
          <ApplicationTracker />
        </div>
      </div>
    </div>
  );
};

export default ApplicationsContent; 