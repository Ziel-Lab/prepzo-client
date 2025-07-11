"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench } from "lucide-react";
import Link from "next/link";

const toolsData = [
  {
    id: "linkedin-optimizer",
    title: "LinkedIn Profile Optimizer",
    description: "Enhance your LinkedIn profile with AI-powered suggestions",
    comingSoon: false,
    path: "/dashboard/tools/linkedin-optimizer",
  },
  {
    id: "resume-generator",
    title: "Resume Generator",
    description: "Generate and optimize your resume with AI-powered suggestions.",
    comingSoon: false,
    path: "/dashboard/tools/resume-generator",
  },
  {
    id: "cover-letter-generator",
    title: "Cover Letter Generator",
    description: "Generate customized cover letters for your applications",
    comingSoon: false,
    path: "/dashboard/tools/cover-letter",
  },
  {
    id: "mock-interview-simulator",
    title: "Mock Interview Simulator",
    description: "Practice interviews with AI-powered feedback",
    comingSoon: true,
  }
];

const ToolsContent = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Career Tools</h1>
        <p className="text-gray-600 mt-1">Essential tools for your job search</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {toolsData.map((tool) => (
          <Card key={tool.id} className={tool.comingSoon ? "opacity-70" : ""}>
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                {tool.title}
                {tool.comingSoon && (
                  <span className="text-sm font-normal text-purple-600 ml-2">Coming Soon</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{tool.description}</p>
              {!tool.comingSoon && tool.path && (
                <Link href={tool.path} className="mt-4 inline-block text-purple-600 hover:text-purple-700 font-medium">
                  Launch Tool →
                </Link>
              )}
              {!tool.comingSoon && !tool.path && (
                 <button className="mt-4 text-gray-400 font-medium cursor-not-allowed">
                    Launch Tool → (No path defined)
                  </button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ToolsContent; 