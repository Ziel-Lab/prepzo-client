"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

const conversationsData = [
  {
    id: 1,
    title: "Career Strategy Discussion",
    date: "2025-04-23",
    summary: "Discussed long-term career goals and created an action plan",
    duration: "45 minutes",
    topics: ["Career Planning", "Goal Setting"]
  },
  {
    id: 2,
    title: "Resume Review Session",
    date: "2025-04-20",
    summary: "Analyzed current resume and identified areas for improvement",
    duration: "30 minutes",
    topics: ["Resume", "Personal Branding"]
  },
  {
    id: 3,
    title: "Interview Preparation",
    date: "2025-04-18",
    summary: "Practice session for upcoming technical interview",
    duration: "60 minutes",
    topics: ["Interview Skills", "Technical Questions"]
  },
  {
    id: 4,
    title: "LinkedIn Profile Optimization",
    date: "2025-04-15",
    summary: "Enhanced LinkedIn profile for better visibility",
    duration: "25 minutes",
    topics: ["LinkedIn", "Personal Branding"]
  },
  {
    id: 5,
    title: "Skill Development Planning",
    date: "2025-04-10",
    summary: "Created roadmap for acquiring new technical skills",
    duration: "40 minutes",
    topics: ["Skills", "Learning"]
  }
];

const ConversationsContent = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Past Conversations</h1>
        <p className="text-gray-600 mt-1">Review your previous career coaching sessions</p>
      </div>

      <div className="grid gap-4">
        {conversationsData.map((conversation) => (
          <Card key={conversation.id}>
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-purple-500" />
                  {conversation.title}
                </div>
                <span className="text-sm font-normal text-gray-500">{conversation.date}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">{conversation.summary}</p>
                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-500">Duration: {conversation.duration}</div>
                  <div className="flex gap-2">
                    {conversation.topics.map((topic) => (
                      <span
                        key={topic}
                        className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ConversationsContent; 