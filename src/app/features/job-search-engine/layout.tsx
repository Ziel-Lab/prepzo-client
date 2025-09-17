import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Global Job Search Engine | 118M Jobs Across 195 Countries",
  description: "Discover 118 million jobs in seconds. Our AI engine unifies 16 platforms across 195 countries with 25+ filters for location, salary, experience and remote roles.",
  keywords: [
    "global job search",
    "job finder",
    "job search platform",
    "career search",
    "employment search",
    "job aggregator",
    "remote jobs",
    "job search filters",
    "AI job matching"
  ],
  openGraph: {
    title: "Global Job Search Engine - Prepzo",
    description: "Search millions of jobs across 16 global platforms with 25+ filters. Find your next opportunity faster with smart matching and advanced filtering.",
    url: "https://www.prepzo.ai/features/job-search-engine",
    siteName: "Prepzo.ai",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Global Job Search Engine - Prepzo",
    description: "Search millions of jobs across 16 global platforms with 25+ filters. Find your next opportunity faster with smart matching and advanced filtering.",
  },
  alternates: {
    canonical: "https://www.prepzo.ai/features/job-search-engine",
  },
};

export default function JobSearchEngineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 