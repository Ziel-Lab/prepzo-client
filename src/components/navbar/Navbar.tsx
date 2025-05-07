"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import Link from "next/link";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="fixed w-full bg-background/95 backdrop-blur-sm z-50 py-4 border-b border-border">
      <div className="container flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-prepzo">Prepzo</span>
            <span className="ml-2 text-xs py-0.5 px-2 bg-prepzo text-white rounded-full">Beta</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="#features" className="text-foreground/80 hover:text-prepzo transition-colors">Features</Link>
          <Link href="/use-cases" className="text-foreground/80 hover:text-prepzo transition-colors whitespace-nowrap">Use Cases</Link>
          <Link href="#testimonials" className="text-foreground/80 hover:text-prepzo transition-colors">Testimonials</Link>
          <Link href="/contact" className="text-foreground/80 hover:text-prepzo transition-colors">Contact</Link>
          <Link href="https://www.prepzo.co/" target="_blank" className="text-foreground/80 hover:text-prepzo transition-colors">Legacy Prepzo</Link>
          <Button variant="outline" className="border-prepzo text-prepzo hover:bg-prepzo hover:text-white">
            Login
          </Button>
          <Link href="/auth/sign-up">
            <Button className="bg-prepzo hover:bg-prepzo-light text-white w-full">
              Join Waitlist
            </Button>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <Button variant="ghost" size="icon" onClick={toggleMenu} aria-label="Toggle Menu">
            {isMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden absolute w-full bg-background border-b border-border animate-fade-in">
          <div className="container flex flex-col py-4 space-y-4">
            <Link href="#features" className="text-foreground/80 hover:text-prepzo transition-colors py-2" onClick={toggleMenu}>Features</Link>
            <Link href="/use-cases" className="text-foreground/80 hover:text-prepzo transition-colors py-2" onClick={toggleMenu}>Use Cases</Link>
            <Link href="#testimonials" className="text-foreground/80 hover:text-prepzo transition-colors py-2" onClick={toggleMenu}>Testimonials</Link>
            <Link href="/contact" className="text-foreground/80 hover:text-prepzo transition-colors py-2" onClick={toggleMenu}>Contact</Link>
            <Button variant="outline" className="border-prepzo text-prepzo hover:bg-prepzo hover:text-white w-full">
              Sign In
            </Button>
            <Link href="/auth/sign-up" className="w-full">
              <Button className="bg-prepzo hover:bg-prepzo-light text-white w-full">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

