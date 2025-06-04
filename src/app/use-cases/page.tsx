"use client";

import React, { useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/navbar/Navbar"; // Assuming Navbar doesn't break app router
import Footer from "@/components/footer/Footer"; // Assuming Footer doesn't break app router
import Link from "next/link"; // Changed from react-router-dom
import { ArrowLeft } from "lucide-react"; // Changed from ArrowRight + rotate

// Renamed component to follow convention
const UseCasesPage = () => {
  // Scroll to top on mount - Client Component behavior
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const useCases = [
    {
      title: "Job Search & Career Transitions",
      description: "Perfect for professionals looking to switch careers or find new opportunities. Get personalized guidance on resume optimization, interview preparation, and job search strategies.",
      features: [
        "Resume tailoring and optimization",
        "Interview preparation and mock interviews",
        "Career transition planning",
        "Salary negotiation tips"
      ]
    },
    {
      title: "Professional Development",
      description: "Advance in your current role with targeted skill development and leadership guidance. Get advice on workplace challenges and growth opportunities.",
      features: [
        "Leadership skill development",
        "Communication improvement",
        "Performance review preparation",
        "Workplace conflict resolution"
      ]
    },
    {
      title: "Entrepreneurship & Startups",
      description: "Get guidance on starting and growing your business. From pitch preparation to team building, Prepzo helps entrepreneurs succeed.",
      features: [
        "Business plan development",
        "Pitch deck creation",
        "Team building strategies",
        "Growth planning"
      ]
    },
    {
      title: "Student Career Planning",
      description: "For students and recent graduates looking to start their careers strong. Get guidance on internships, first jobs, and career path selection.",
      features: [
        "Internship search strategies",
        "Entry-level job preparation",
        "Career path exploration",
        "Skill development planning"
      ]
    }
  ];

  // Added metadata export
  // export const metadata = { title: 'Use Cases' };

  return (
    <div className="bg-background">
      <Navbar/>
      <main className="pt-12 pb-16"> 
        <div className="container mt-16 mb-10">
          <div className="mb-12">
            {/* <Link href="/" className="text-sm text-muted-foreground hover:text-prepzo flex items-center gap-2 mb-4"> 
              <ArrowLeft className="w-4 h-4" /> 
              Back to Home
            </Link> */}
            <h1 className="text-4xl font-bold mb-4">Use Cases</h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Discover how Prepzo helps professionals across different stages of their career journey with personalized AI mentorship.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {useCases.map((useCase, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <h3 className="text-2xl font-semibold mb-4">{useCase.title}</h3>
                  <p className="text-muted-foreground mb-6">{useCase.description}</p>
                  <ul className="space-y-2">
                    {useCase.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <div className="mt-1.5 w-2 h-2 bg-prepzo rounded-full" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer/>
    </div>
  );
};

export default UseCasesPage; 