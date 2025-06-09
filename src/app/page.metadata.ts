import type { Metadata } from 'next';

export const Sitemetadata: Metadata = {
  title: "Prepzo - AI Interview & Resume Builder",
  description: "Ace your interviews and build winning resumes with Prepzo's AI-powered tools. Practice, get feedback, and land your dream job.",
  metadataBase: new URL("https://www.prepzo.ai"),
  applicationName: "Prepzo",
  keywords: [
    "AI interview", "resume builder", "job search", "career tools", "Prepzo"
  ],
  robots: "index, follow",
  openGraph: {
    title: "Prepzo - AI Interview & Resume Builder",
    description: "Ace your interviews and build winning resumes with Prepzo's AI-powered tools. Practice, get feedback, and land your dream job.",
    url: "https://www.prepzo.ai/",
    siteName: "Prepzo",
    images: [
      {
        url: "https://www.prepzo.ai/og.jpeg", // Replace with your OG image URL
        width: 1200,
        height: 630,
        alt: "Prepzo - AI Interview & Resume Builder",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@prepzo",
    creator: "@prepzo",
    title: "Prepzo - AI Interview & Resume Builder",
    description: "Ace your interviews and build winning resumes with Prepzo's AI-powered tools. Practice, get feedback, and land your dream job.",
    images: ["https://www.prepzo.ai/og-image.png"], // Replace with your OG image URL
  },
  alternates: {
    canonical: "https://www.prepzo.ai/",
  },
}; 