"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

const conversations = [
  {
    id: 1,
    title: "Career Strategy Session",
    date: "Today",
    summary: "Discussed leadership opportunities and skill development",
  },
  {
    id: 2,
    title: "Interview Preparation",
    date: "Yesterday",
    summary: "Practiced common interview questions for tech roles",
  },
  {
    id: 3,
    title: "Resume Review",
    date: "2 days ago",
    summary: "Updated resume with recent projects and achievements",
  },
];

const RecentConversations = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Recent Conversations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className="flex flex-col space-y-1 border-b border-gray-100 last:border-0 pb-3 last:pb-0"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-medium">{conversation.title}</h3>
                <span className="text-sm text-gray-500">{conversation.date}</span>
              </div>
              <p className="text-sm text-gray-600">{conversation.summary}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentConversations;
