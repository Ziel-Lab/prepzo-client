"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, TrendingUp, Award } from "lucide-react";
import { LineChart as RechartLineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { format, parseISO } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

// Data structure with time-based progress points for each skill
const skillsData = [
  {
    category: "Technical Skills",
    skills: [
      { 
        name: "React Development", 
        maxPoints: 1000,
        progress: [
          { date: "2025-01-05", points: 600 },
          { date: "2025-02-10", points: 720 },
          { date: "2025-03-15", points: 780 },
          { date: "2025-04-20", points: 850 }
        ],
        description: "Built multiple React applications using hooks, context API, and custom components. Completed advanced courses on state management and performance optimization."
      },
      { 
        name: "System Design", 
        maxPoints: 1000,
        progress: [
          { date: "2025-01-05", points: 300 },
          { date: "2025-02-10", points: 400 },
          { date: "2025-03-15", points: 520 },
          { date: "2025-04-20", points: 600 }
        ],
        description: "Studied system design principles and patterns. Designed scalable architectures for two medium-sized applications and participated in architecture reviews."
      },
      { 
        name: "Data Structures & Algorithms", 
        maxPoints: 1000,
        progress: [
          { date: "2025-01-05", points: 450 },
          { date: "2025-02-10", points: 580 },
          { date: "2025-03-15", points: 650 },
          { date: "2025-04-20", points: 750 }
        ],
        description: "Solved 150+ algorithmic problems on coding platforms. Mastered common patterns like two-pointers, sliding window, and dynamic programming approaches."
      },
      { 
        name: "Backend Development", 
        maxPoints: 1000,
        progress: [
          { date: "2025-01-05", points: 350 },
          { date: "2025-02-10", points: 480 },
          { date: "2025-03-15", points: 600 },
          { date: "2025-04-20", points: 700 }
        ],
        description: "Developed RESTful APIs using Node.js and Express. Implemented authentication, database integration, and deployed serverless functions for production use."
      }
    ]
  },
  {
    category: "Soft Skills",
    skills: [
      { 
        name: "Communication", 
        maxPoints: 1000,
        progress: [
          { date: "2025-01-05", points: 650 },
          { date: "2025-02-10", points: 750 },
          { date: "2025-03-15", points: 820 },
          { date: "2025-04-20", points: 900 }
        ],
        description: "Delivered technical presentations to both technical and non-technical stakeholders. Improved written communication through documentation and technical blogs."
      },
      { 
        name: "Problem Solving", 
        maxPoints: 1000,
        progress: [
          { date: "2025-01-05", points: 600 },
          { date: "2025-02-10", points: 700 },
          { date: "2025-03-15", points: 780 },
          { date: "2025-04-20", points: 850 }
        ],
        description: "Led troubleshooting sessions for complex production issues. Developed systematic approaches to break down and solve multi-faceted technical challenges."
      },
      { 
        name: "Team Collaboration", 
        maxPoints: 1000,
        progress: [
          { date: "2025-01-05", points: 700 },
          { date: "2025-02-10", points: 800 },
          { date: "2025-03-15", points: 880 },
          { date: "2025-04-20", points: 950 }
        ],
        description: "Actively participated in agile ceremonies and pair programming sessions. Mentored junior team members and facilitated knowledge sharing workshops."
      },
      { 
        name: "Leadership", 
        maxPoints: 1000,
        progress: [
          { date: "2025-01-05", points: 500 },
          { date: "2025-02-10", points: 620 },
          { date: "2025-03-15", points: 720 },
          { date: "2025-04-20", points: 800 }
        ],
        description: "Led feature development teams of 3-5 people. Took ownership of planning and delivery for multiple project milestones with successful outcomes."
      }
    ]
  }
];

// Format date for display on the x-axis
const formatDate = (dateStr: string) => {
  const date = parseISO(dateStr);
  return format(date, "MMM dd");
};

const SkillsContent = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Skills Growth</h1>
        <p className="text-sm md:text-base text-gray-600 mt-1">Track your learning progress over time</p>
      </div>

      <div className="space-y-8 md:space-y-12">
        {skillsData.map((category, index) => (
          <div key={index} className="space-y-4 md:space-y-6">
            <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
              <Award className="h-5 w-5" />
              {category.category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              {category.skills.map((skill, skillIndex) => (
                <Card key={skillIndex} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base md:text-lg">{skill.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8 sm:space-y-10 md:space-y-12">
                    <div className="h-[250px] sm:h-[280px] md:h-[320px] w-full">
                      <ChartContainer config={{}}>
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartLineChart 
                            data={skill.progress} 
                            margin={{ 
                              top: 20, 
                              right: isMobile ? 10 : 20, 
                              left: isMobile ? 0 : 30, 
                              bottom: isMobile ? 40 : 60
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis 
                              dataKey="date" 
                              tickFormatter={formatDate}
                              tick={{ fontSize: isMobile ? 10 : 12 }}
                              padding={{ left: isMobile ? 5 : 15, right: isMobile ? 5 : 15 }}
                              height={isMobile ? 40 : 50}
                            />
                            <YAxis 
                              domain={[0, skill.maxPoints]}
                              tick={{ fontSize: isMobile ? 10 : 12 }}
                              width={isMobile ? 30 : 40}
                              padding={{ top: 10, bottom: isMobile ? 25 : 35 }}
                            />
                            <ChartTooltip
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                return (
                                  <ChartTooltipContent>
                                    <div className="space-y-1">
                                      <div>Date: {formatDate(payload[0].payload.date)}</div>
                                      <div>Points: {payload[0].value}</div>
                                    </div>
                                  </ChartTooltipContent>
                                );
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="points"
                              stroke="#12231B"
                              strokeWidth={2}
                              dot={{ fill: "#12231B", r: isMobile ? 3 : 4 }}
                              activeDot={{ r: isMobile ? 5 : 6 }}
                            />
                          </RechartLineChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>
                    <div className="bg-slate-50 p-3 sm:p-4 md:p-5 rounded-md text-xs sm:text-sm mt-6 sm:mt-8 md:mt-10">
                      <h4 className="font-medium text-gray-900 mb-1 md:mb-2">Development Progress:</h4>
                      <p className="text-gray-600">{skill.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillsContent; 