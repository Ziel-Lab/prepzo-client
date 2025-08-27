"use client";
import React from "react";
import JobSearchLoader from "@/components/ui/JobSearchLoader";

type FullPageLoaderProps = {
  label?: string;
  sublabel?: string;
};

const FullPageLoader: React.FC<FullPageLoaderProps> = ({ label = "Working on it", sublabel = "Please wait..." }) => {
  return (
    <div className="fixed inset-0 z-[1000] bg-white/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <JobSearchLoader label={label} sublabel={sublabel} />
      </div>
    </div>
  );
};

export default FullPageLoader;


