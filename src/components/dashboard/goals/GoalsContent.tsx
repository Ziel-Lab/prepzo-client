"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Flag, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const goalsData = [
  {
    title: "Land a Software Engineering Role",
    progress: 75,
    dueDate: "2024-06-30",
    status: "In Progress",
    steps: [
      "Update resume with latest projects",
      "Practice coding interviews daily",
      "Network with 3 industry professionals per week",
      "Complete 2 system design practice sessions",
      "Apply to 5 positions weekly"
    ]
  },
  {
    title: "Complete System Design Course",
    progress: 45,
    dueDate: "2024-05-15",
    status: "In Progress",
    steps: [
      "Complete distributed systems module",
      "Study scalability patterns",
      "Practice 5 system design interviews",
      "Review cloud architecture concepts",
      "Build a scalable project demo"
    ]
  },
  {
    title: "Build 3 Full-Stack Projects",
    progress: 90,
    dueDate: "2024-04-30",
    status: "Almost Complete",
    steps: [
      "Complete e-commerce platform",
      "Deploy real-time chat application",
      "Build portfolio website",
      "Add authentication to all projects",
      "Write technical documentation"
    ]
  }
];

const GoalsContent = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Goals</h1>
        <p className="text-gray-600 mt-1">Track your career goals and milestones</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {goalsData.map((goal, index) => (
          <Dialog key={index}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    {goal.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Progress</span>
                      <span>{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Due: {goal.dueDate}</span>
                      <span className="text-purple-600 font-medium">{goal.status}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {goal.title}
                </DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <h4 className="font-medium mb-3">Steps to achieve this goal:</h4>
                <ul className="space-y-3">
                  {goal.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="flex items-start gap-2">
                      <span className="bg-secondary text-secondary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                        {stepIndex + 1}
                      </span>
                      <span className="text-gray-600">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  );
};

export default GoalsContent; 