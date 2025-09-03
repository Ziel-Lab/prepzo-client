"use client";
import React from "react";

type JobSearchLoaderProps = {
  label?: string;
  sublabel?: string;
  className?: string;
};

const JobSearchLoader: React.FC<JobSearchLoaderProps> = ({ label = "Searching jobs", sublabel = "Fetching latest listings...", className = "" }) => {
  return (
    <div className={`w-full rounded-lg border border-gray-200 bg-white p-4 sm:p-5 shadow-sm ${className}`}>
      <div className="flex items-center gap-3">
        <div className="relative h-6 w-6">
          <div className="absolute inset-0 rounded-full border-2 border-blue-200"></div>
          <div className="absolute inset-0 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900">{label}</div>
          <div className="text-xs text-gray-500">{sublabel}</div>
        </div>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded bg-gray-100">
        <div className="h-full w-1/3 animate-[loader_1.2s_ease-in-out_infinite] rounded bg-blue-600/70"></div>
      </div>

      <style jsx>{`
        @keyframes loader {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(30%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default JobSearchLoader;


