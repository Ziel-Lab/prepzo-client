'use client';

import CoverLetterContent from '@/components/dashboard/tools/coverLetter/coverLetterContent';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Suspense } from "react";

const CoverLetterGeneratorPage = () => {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="flex justify-center items-center" style={{ height: 'calc(100vh - 150px)' }}>
        Loading Cover Letter Generator...
      </div>}>
        <CoverLetterContent />
      </Suspense>
    </DashboardLayout>
  );
};

export default CoverLetterGeneratorPage;
