// This component uses client hooks (useLocation, useEffect) from react-router-dom
// The standard Next.js not-found.tsx should be a Server Component.
// We will create a simple Server Component version.
// You might need a client component if you need specific client-side logic on 404.

import Link from 'next/link';
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="text-center space-y-4">
        <h1 className="text-9xl font-bold text-prepzo">404</h1>
        <h2 className="text-3xl font-semibold">Page Not Found</h2>
        <p className="text-muted-foreground">
          Sorry, the page you are looking for does not exist or has been moved.
        </p>
        <Button asChild className="bg-prepzo hover:bg-prepzo-light">
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    </div>
  );
} 