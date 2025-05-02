"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect } from "react";

const TermsOfServicePage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-background py-12">
      <div className="container max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4 text-sm text-muted-foreground hover:text-foreground">
              ← Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Terms of Service</h1>
          {/* Optional: Add last updated date if needed */}
          {/* <p className="text-sm text-muted-foreground mb-4">Last updated: {new Date().toLocaleDateString()}</p> */}
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl md:text-2xl font-semibold mb-3">1. Agreement to Terms</h2>
            <p>
              By accessing or using Prepzo, you agree to comply with these Terms of Service and all applicable laws and regulations. If you disagree with any part of these terms, you must immediately discontinue use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold mb-3">2. Use License</h2>
            <p>
              Prepzo grants you a limited, non-exclusive, revocable license to use our service for personal, non-commercial purposes only. This license is not a transfer of ownership. Under this license, you may not:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>Modify or copy any content or materials.</li>
              <li>Use any content or materials for commercial purposes or public display.</li>
              <li>Attempt to decompile, reverse engineer, or otherwise exploit any part of the software or services.</li>
              <li>Remove any copyright or proprietary notations from the materials or content.</li>
              <li>Transfer or sublicense the service to another person.</li>
            </ul>
             <p className="mt-2">
               Violation of these restrictions may result in termination of your access to Prepzo.
             </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold mb-3">3. Intellectual Property</h2>
            <p>
              All content, trademarks, service marks, trade names, and other intellectual property rights on Prepzo are owned by or licensed to Prepzo. No right or license is granted to you except as explicitly set forth in these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold mb-3">4. Disclaimer</h2>
            <p>
              Prepzo is provided "as is" and "as available" without any warranties or guarantees. Prepzo disclaims all warranties, whether express or implied, including warranties of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold mb-3">5. Limitation of Liability</h2>
            <p>
              Prepzo and its affiliates, employees, and partners will not be liable for any damages, including but not limited to direct, indirect, incidental, consequential, or punitive damages arising out of your use or inability to use the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold mb-3">6. Changes to Terms</h2>
            <p>
               Prepzo reserves the right to modify these Terms of Service at any time. Any changes will be communicated through email or a prominent notice on our platform. Continued use of the service after changes constitute your acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold mb-3">7. Governing Law</h2>
            <p>
               These terms shall be governed by and construed in accordance with applicable laws and regulations.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold mb-3">8. Contact</h2>
            <p>
               For any questions regarding these Terms of Service, please contact us at:
               <br />
               Email: <a href="mailto:hello@prepzo.co" className="text-primary hover:underline">hello@prepzo.co</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage; 