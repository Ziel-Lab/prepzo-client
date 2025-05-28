"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import ApplicationTracker from "@/components/dashboard/ApplicationTracker";

const ApplicationsContent = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-600 mt-1">Track your job applications and progress</p>
        </div>
      </div>
      <ApplicationTracker />
    </div>
  );
};

export default ApplicationsContent; 