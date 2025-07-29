import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css"; 
import React from "react";
import { ClientProviders } from "@/app/client-providers";
import { cn } from "@/lib/utils"; 
import { Analytics } from "@vercel/analytics/react"
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] }); 

export const metadata: Metadata = {
  title: "Prepzo AI: Career Help, Resumes, LinkedIn, Job Search",
  description:
    "Land your dream job faster with AI-powered resumes, cover letters, LinkedIn makeovers & job search tools tailored to you. Try Prepzo for free!",
  keywords: [
    "job search",
    "resume creator",
    "resume optimization",
    "cover letter tool",
    "linkedin optimization",
    "career guidance",
  ],
  manifest: "/static/favicons/site.webmanifest",
  icons: {
    icon: [
      { rel: "icon", url: "/static/favicons/favicon.ico" },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        url: "/static/favicons/favicon-16x16.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        url: "/static/favicons/favicon-32x32.png",
      },
    ],
    apple: [
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        url: "/static/favicons/apple-touch-icon.png",
      },
    ],
  },
  openGraph: {
    title: "Prepzo AI: Career Help, Resumes, LinkedIn, Job Search",
    description:
      "Land your dream job faster with AI-powered resumes, cover letters, LinkedIn makeovers & job search tools tailored to you. Try Prepzo for free!",
    url: "https://www.prepzo.ai/",
    siteName: "Prepzo.ai",
    images: [
      {
        url: "https://www.prepzo.ai/og.jpeg", 
        width: 1200,
        height: 630,
        alt: "Prepzo.ai preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prepzo AI: Career Help, Resumes, LinkedIn, Job Search",
    description:
      "Land your dream job faster with AI-powered resumes, cover letters, LinkedIn makeovers & job search tools tailored to you. Try Prepzo for free!",
    images: ["https://www.prepzo.ai/og.jpeg"], 
    site: "@prepzo_ai",
  },
  alternates: {
    canonical: "https://www.prepzo.ai/",
  },
}; 

// Structured-data schemas ---------------------------------------------------
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Prepzo.ai?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Prepzo.ai is an AI voice assistant that provides personalized strategies for job search, skill development and career growth.",
      },
    },
    {
      "@type": "Question",
      name: "Is Prepzo.ai free to try?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Yes. You can explore a free demo without providing a credit card.",
      },
    },
  ],
} as const;

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  url: "https://www.prepzo.ai/",
  name: "Prepzo.ai",
  logo: "https://www.prepzo.ai/og.jpeg",
  sameAs: [
    "https://www.linkedin.com/company/prepzo-ai/"
  ],
} as const;

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Prepzo.ai",
  operatingSystem: "Web", 
  applicationCategory: "BusinessApplication",
  description:
    "Land your dream job faster with AI-powered resumes, cover letters, LinkedIn makeovers & job search tools tailored to you. Try Prepzo for free!",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  url: "https://www.prepzo.ai/",
  image: "https://www.prepzo.ai/og.jpeg",
} as const;
// --------------------------------------------------------------------------

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning> {/* Add suppressHydrationWarning if needed for dark mode */}
      <head>
        {/* Hotjar Tracking Code */}
        <Script
          id="hotjar-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(h,o,t,j,a,r){
              h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
              h._hjSettings={hjid:6477815,hjsv:6};
              a=o.getElementsByTagName('head')[0];
              r=o.createElement('script');r.async=1;
              r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
              a.appendChild(r);
            })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');`,
          }}
        />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        {/* Use the ClientProviders component to wrap children */}
        <ClientProviders>
          {children} {/* Render the page content */}
        </ClientProviders>
        <Analytics />
        
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-0X56SMJDT3"
          strategy="afterInteractive"
          async
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-0X56SMJDT3');
            `,
          }}
        />

        {/* Amplitude Analytics */}
        <Script
          src="https://cdn.eu.amplitude.com/script/f305ca2d29463ec9b3e855890722bf5.js"
          strategy="afterInteractive"
          async
        />
        <Script
          id="amplitude-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.amplitude.add(window.sessionReplay.plugin({sampleRate: 1}));
              window.amplitude.init('f305ca2d29463ec9b3e855890722bf5', {
                fetchRemoteConfig: true,
                serverZone: 'EU',
                autocapture: true
              });
            `,
          }}
        />
        
        
        {/* JSON-LD structured data  */}
        <Script
          id="faq-schema"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <Script
          id="organization-schema"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <Script
          id="software-schema"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
        />
      </body>
    </html>
  );
} 