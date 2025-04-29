import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Example font, adjust if needed
import "@/app/globals.css"; // Updated import path
import React from "react";
import { ClientProviders } from "@/app/client-providers"; // Import the new client component
import { cn } from "@/lib/utils"; // Assuming you use cn for class merging

const inter = Inter({ subsets: ["latin"] }); // Example font setup

export const metadata: Metadata = {
  title: "Prepzo", // Adjust title as needed
  description: "Your AI voice assistant for personalized career guidance.", // Adjust description
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
      </body>
    </html>
  );
} 