import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mock Interview | AI-Powered by Prepzo",
  description: "Mock Interview with Prepzo AI. Prepzo AI adapts your voice, aligns experience to the job and delivers polished drafts that win recruiter attention.",
  keywords: [
    "mock interview",
    "AI mock interview",
    "mock interview with Prepzo AI",
  ],
  openGraph: {
    title: "Mock Interview | AI-Powered by Prepzo",
    description: "Mock Interview with Prepzo AI. Prepzo AI adapts your voice, aligns experience to the job and delivers polished drafts that win recruiter attention.",
    url: "https://www.prepzo.ai/features/mockinterview",
    siteName: "Prepzo.ai",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mock Interview | AI-Powered by Prepzo",
    description: "Mock Interview with Prepzo AI. Prepzo AI adapts your voice, aligns experience to the job and delivers polished drafts that win recruiter attention.",
  },
  alternates: {
    canonical: "https://www.prepzo.ai/features/mockinterview",
  },
};

export default function MockInterviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 