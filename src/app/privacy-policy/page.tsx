"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect } from "react";

const PrivacyPolicyPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const lastUpdatedDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  }); // Format date nicely

  return (
    <div className="bg-background py-12">
      <div className="container max-w-3xl mx-auto px-4 sm:px-6 lg:px-8"> {/* Added responsive padding and centering */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4 text-sm text-muted-foreground hover:text-foreground">
              ← Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Privacy Policy</h1> {/* Adjusted heading size */}
          <p className="text-sm text-muted-foreground mb-4">Last updated: {lastUpdatedDate}</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6"> {/* Use prose for nice typography */}
          <section>
            <h2 className="text-xl md:text-2xl font-semibold mb-3">1. Introduction</h2>
            <p>
              Welcome to Prepzo. We are committed to protecting your personal information and your right to privacy. This Privacy Policy outlines how we collect, use, and share your information when you use our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold mb-3">2. Information We Collect</h2>
            <p>
              We collect information you provide directly to us, including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-4"> {/* Indent list */}
              <li><strong>Account Information:</strong> Name, email address, password, and account details from third-party logins (Google, LinkedIn).</li>
              <li><strong>Profile Information:</strong> Information you provide for your user profile.</li>
              <li><strong>Communication Preferences:</strong> How you prefer to receive communications from us.</li>
              <li><strong>Usage Data and Analytics:</strong> Information on how you interact with our platform and service.</li>
              <li><strong>User-Generated Content:</strong> Conversations, documents, and other information you upload or create within our service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold mb-3">3. Third-Party Services</h2>
            <p>
              We utilize third-party services to enhance our functionality:
            </p>
             <ul className="list-disc list-inside space-y-1 pl-4">
              <li><strong>Authentication:</strong> Google and LinkedIn login services for seamless account creation and access.</li>
              <li><strong>Analytics:</strong> Vercel analytics to understand how our platform is used and to improve your experience.</li>
              <li><strong>Data Processing:</strong> Google Gemini and OpenAI technologies are used to process, analyze, and improve the quality of your interactions and documents on our platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold mb-3">4. How We Use Your Information</h2>
            <p>
              We use the collected information to:
            </p>
             <ul className="list-disc list-inside space-y-1 pl-4">
              <li>Provide and maintain our service.</li>
              <li>Improve, personalize, and expand your experience.</li>
              <li>Process your conversations and documents using AI tools (Google Gemini, OpenAI) to enhance our product capabilities.</li>
              <li>Communicate with you about updates, changes, and service-related notifications.</li>
              <li>Ensure the security and integrity of our platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold mb-3">5. Information Sharing</h2>
             <p>
              We do not sell your personal information. Your data may be shared with:
            </p>
             <ul className="list-disc list-inside space-y-1 pl-4">
              <li>Third-party service providers who assist us in operating and maintaining our service.</li>
              <li>Compliance with laws or to respond to lawful requests and legal processes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold mb-3">6. Data Security</h2>
            <p>
              We implement robust security measures to protect your data. However, no method of transmission or electronic storage is completely secure. We cannot guarantee absolute security but are committed to maintaining best practices.
            </p>
          </section>

           <section>
            <h2 className="text-xl md:text-2xl font-semibold mb-3">7. Changes to This Policy</h2>
            <p>
              We may update our Privacy Policy periodically. Changes will be communicated via email or prominent notifications on our platform. We encourage you to review our policy regularly to stay informed.
            </p>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-semibold mb-3">8. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
              <br />
              Email: <a href="mailto:hello@prepzo.co" className="text-primary hover:underline">hello@prepzo.co</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage; 