"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/use-auth";

// Create a client instance INSIDE the Client Component or keep it stable
// It's often recommended to keep the client stable across renders, 
// so creating it once with useState is a good pattern.
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Configure default query options if needed
        staleTime: 60 * 1000, // 1 minute
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important so we don't re-make a new client if React
    // suspends during the initial render. See:
    // https://tanstack.com/query/v5/docs/react/ssr
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
  // NOTE: Avoid useState for queryClient instability issues. ref: https://tanstack.com/query/v5/docs/react/examples/react/nextjs-app-router-client-component
  const queryClient = getQueryClient();

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {children} {/* Render the actual page content passed down */}
          {/* Render Toasters here so they are within the client context */}
          <ShadcnToaster />
          <SonnerToaster />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
} 