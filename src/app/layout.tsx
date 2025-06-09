import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css"; 
import React from "react";
import { ClientProviders } from "@/app/client-providers";
import { cn } from "@/lib/utils"; 
import { Analytics } from "@vercel/analytics/react"

const inter = Inter({ subsets: ["latin"] }); 
import {Sitemetadata} from "./page.metadata";
export const metadata: Metadata = Sitemetadata;

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