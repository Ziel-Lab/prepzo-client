import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LinkedIn Profile Analyzer | Boost Visibility & Credibility",
  description: "Paste your LinkedIn URL for AI review of headline, summary, keywords and visibility. Get actionable guidance to boost authenticity and recruiter discovery.",
  keywords: [
    "LinkedIn analyzer",
    "LinkedIn optimization",
    "LinkedIn profile review",
    "professional networking",
    "LinkedIn SEO",
    "profile optimization",
    "LinkedIn strategy",
    "professional branding",
    "LinkedIn visibility",
    "recruiter optimization"
  ],
  openGraph: {
    title: "LinkedIn Profile Analyzer | Boost Visibility & Credibility",
    description: "Paste your LinkedIn URL for AI review of headline, summary, keywords and visibility. Get actionable guidance to boost authenticity and recruiter discovery.",
    url: "https://www.prepzo.ai/features/linkedin-analyser",
    siteName: "Prepzo.ai",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkedIn Profile Analyzer | Boost Visibility & Credibility",
    description: "Paste your LinkedIn URL for AI review of headline, summary, keywords and visibility. Get actionable guidance to boost authenticity and recruiter discovery.",
  },
  alternates: {
    canonical: "https://www.prepzo.ai/features/linkedin-analyser",
  },
};

export default function LinkedInAnalyzerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 