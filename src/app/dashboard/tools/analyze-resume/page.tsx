"use client"; // Or remove if AnalyzerToolContent handles all client-side logic internally

import AnalyzerToolContent from "@/components/dashboard/tools/resumeAnalyzer/AnalyzerToolContent";
import DashboardLayout from "@/components/dashboard/DashboardLayout"; // Import DashboardLayout
import { Suspense } from "react";

const ResumeAnalyzerPage = () => {
  return (
    <DashboardLayout> {/* Wrap content with DashboardLayout */}
      <div className="container mx-auto p-4 md:p-8"> {/* Existing container for padding */}
        <Suspense fallback={
          <div className="flex justify-center items-center" style={{ height: 'calc(100vh - 150px)' }}> {/* Adjusted height for suspense within layout*/}
            Loading Analyzer...
          </div>
        }>
          <AnalyzerToolContent />
        </Suspense>
      </div>
    </DashboardLayout>
  );
};

export default ResumeAnalyzerPage;
