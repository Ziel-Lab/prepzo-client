import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Personalized Cover Letter Generator | AI-Powered by Prepzo",
  description: "Generate tailored cover letters fast. Prepzo AI adapts your voice, aligns experience to the job and delivers polished drafts that win recruiter attention.",
  keywords: [
    "cover letter generator",
    "AI cover letter", 
    "personalized cover letter",
    "job application",
    "resume",
    "career tools",
    "hiring",
    "recruitment",
    "professional writing",
    "tailored cover letter"
  ],
  openGraph: {
    title: "Personalized Cover Letter Generator | AI-Powered by Prepzo",
    description: "Generate tailored cover letters fast. Prepzo AI adapts your voice, aligns experience to the job and delivers polished drafts that win recruiter attention.",
    url: "https://www.prepzo.ai/features/coverletter-generator",
    siteName: "Prepzo.ai",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Personalized Cover Letter Generator | AI-Powered by Prepzo",
    description: "Generate tailored cover letters fast. Prepzo AI adapts your voice, aligns experience to the job and delivers polished drafts that win recruiter attention.",
  },
  alternates: {
    canonical: "https://www.prepzo.ai/features/coverletter-generator",
  },
};

export default function CoverLetterGeneratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 