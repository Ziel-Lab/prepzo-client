"use client"; 

import { useEffect } from "react";
import Navbar from "@/components/navbar/Navbar";
import HeroSection from "@/components/hero/HeroSection";
import FeaturesSection from "@/components/features/FeaturesSection";
import UseCasesSection from "@/components/usecases/UseCasesSection";
import TestimonialsSection from "@/components/testimonials/TestimonialsSection";
import DemoForm from "@/components/faq/DemoForm";
import Footer from "@/components/footer/Footer";

// Renamed component to follow convention (e.g., Page or HomePage)
const HomePage = () => {
  useEffect(() => {
    // Add intersection observer for animation elements
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const fadeElements = document.querySelectorAll(".fade-in-section");
    fadeElements.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      // Check if observer exists and elements exist before unobserving
      if (observer && fadeElements) {
          fadeElements.forEach((element) => {
            observer.unobserve(element);
        });
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <FeaturesSection />
        <UseCasesSection />
        <TestimonialsSection />
        <DemoForm />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage; 