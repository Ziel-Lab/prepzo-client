'use client';

import CoverLetterContent from '@/components/dashboard/tools/coverLetter/coverLetterContent';
import DashboardLayout from '@/components/dashboard/DashboardLayout'; // Assuming you have a common dashboard layout

const CoverLetterGeneratorPage = () => {
  return (
    <DashboardLayout>
      <CoverLetterContent />
    </DashboardLayout>
  );
};

export default CoverLetterGeneratorPage;
