import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resume Generator & ATS Optimizer | Create & Improve Your CV",
  description: "Generate and optimize your resume with AI-powered suggestions to get a 10-point score, ATS-ready format, keyword feedback and a polished version recruiters won't ignore.",
  keywords: [
    "resume generator",
    "AI resume creation",
    "ATS optimization", 
    "resume optimization",
    "resume builder",
    "career tools",
    "job search",
    "resume score",
    "recruiter optimization",
    "resume improvement"
  ],
  openGraph: {
    title: "Resume Generator & ATS Optimizer | Create & Improve Your CV",
    description: "Generate and optimize your resume with AI-powered suggestions to get a 10-point score, ATS-ready format, keyword feedback and a polished version recruiters won't ignore.",
    url: "https://www.prepzo.ai/features/resume-analyser",
    siteName: "Prepzo.ai",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Resume Generator & ATS Optimizer | Create & Improve Your CV",
    description: "Generate and optimize your resume with AI-powered suggestions to get a 10-point score, ATS-ready format, keyword feedback and a polished version recruiters won't ignore.",
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