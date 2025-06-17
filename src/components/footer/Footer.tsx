"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-prepzo text-white">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <Link href="/" className="text-2xl font-bold">Prepzo</Link>
              <span className="ml-2 text-xs py-0.5 px-2 bg-white text-prepzo rounded-full">Beta</span>
            </div>
            <p className="mb-4 text-white/80">
            Your All-in one AI Partner for Job search & Career Success
            </p>
            <div className="flex items-center space-x-4">
              <Link href="https://www.linkedin.com/company/prepzo-ai/" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </Link>
            </div>
          </div>
          
          <div>
            <h3 className="font-bold mb-4">Product</h3>
            <ul className="space-y-2">
              <li><Link href="/#features" className="text-white/80 hover:text-white">Features</Link></li>
              <li><Link href="/use-cases" className="text-white/80 hover:text-white">Use Cases</Link></li>
              <li><Link href="/#testimonials" className="text-white/80 hover:text-white">Testimonials</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link href="/contact" className="text-white/80 hover:text-white">Contact</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-6 border-t border-white/20 flex flex-col md:flex-row justify-between items-center">
          <p className="text-white/60 mb-4 md:mb-0">
            © {new Date().getFullYear()} Prepzo. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/privacy-policy" className="text-white/60 hover:text-white text-sm">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="text-white/60 hover:text-white text-sm">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

