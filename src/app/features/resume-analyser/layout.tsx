import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resume Analyzer & ATS Optimizer | Score & Improve Your CV",
  description: "Upload your resume plus a job description to get a 10-point score, ATS-ready format, keyword feedback and a polished version recruiters won't ignore.",
  keywords: [
    "resume analyzer",
    "AI resume analysis",
    "ATS optimization", 
    "resume optimization",
    "resume feedback",
    "career tools",
    "job search",
    "resume score",
    "recruiter optimization",
    "resume improvement"
  ],
  openGraph: {
    title: "Resume Analyzer & ATS Optimizer | Score & Improve Your CV",
    description: "Upload your resume plus a job description to get a 10-point score, ATS-ready format, keyword feedback and a polished version recruiters won't ignore.",
    url: "https://www.prepzo.ai/features/resume-analyser",
    siteName: "Prepzo.ai",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Resume Analyzer & ATS Optimizer | Score & Improve Your CV",
    description: "Upload your resume plus a job description to get a 10-point score, ATS-ready format, keyword feedback and a polished version recruiters won't ignore.",
  },
  alternates: {
    canonical: "https://www.prepzo.ai/features/resume-analyser",
  },
};

export default function ResumeAnalyzerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 