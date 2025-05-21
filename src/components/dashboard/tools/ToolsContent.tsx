"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, FileText, Link as LinkIcon } from "lucide-react";

const toolsData = [
  {
    title: "LinkedIn Profile Optimizer",
    description: "Enhance your LinkedIn profile with AI-powered suggestions",
    comingSoon: false,
  },
  {
    title: "Resume Generator",
    description: "Create ATS-friendly resumes tailored to job descriptions",
    comingSoon: false,
  },
  {
    title: "Cover Letter Generator",
    description: "Generate customized cover letters for your applications",
    comingSoon: false,
  },
  {
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
        {toolsData.map((tool, index) => (
          <Card key={index} className={tool.comingSoon ? "opacity-70" : ""}>
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
              {!tool.comingSoon && (
                <button className="mt-4 text-purple-600 hover:text-purple-700 font-medium">
                  Launch Tool →
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