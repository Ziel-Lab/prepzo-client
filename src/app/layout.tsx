import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css"; 
import React from "react";
import { ClientProviders } from "@/app/client-providers";
import { cn } from "@/lib/utils"; 
import { Analytics } from "@vercel/analytics/react"

const inter = Inter({ subsets: ["latin"] }); 

export const metadata: Metadata = {
  title: "Prepzo.ai | AI Career Coach & Job Search Assistant",
  description:
    "Prepzo is an AI voice assistant that helps you overcome career challenges with personalized strategies for job search, skill development, and career growth. Try a free demo—no credit card required.",
  openGraph: {
    title: "Prepzo.ai | AI Career Coach & Job Search Assistant",
    description:
      "Prepzo is an AI voice assistant that helps you overcome career challenges with personalized strategies for job search, skill development, and career growth. Try a free demo—no credit card required.",
    url: "https://prepzo.ai/",
    siteName: "Prepzo.ai",
    images: [
      {
        url: "https://prepzo.ai/og.jpeg", 
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
    title: "Prepzo.ai | AI Career Coach & Job Search Assistant",
    description:
      "Prepzo is an AI voice assistant that helps you overcome career challenges with personalized strategies for job search, skill development, and career growth. Try a free demo—no credit card required.",
    images: ["https://prepzo.ai/og-image.png"], 
  },
}; 
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning> {/* Add suppressHydrationWarning if needed for dark mode */}
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        {/* Use the ClientProviders component to wrap children */}
        <ClientProviders>
          {children} {/* Render the page content */}
        </ClientProviders>
        <Analytics />
      </body>
    </html>
  );
} 