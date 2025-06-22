"use client";
import { AlertTriangle, Calendar, Check, Clock, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import BlurOverlay from "@/components/dashboard/blurrEffect";

// Mock data for challenges
const challengesData = [
  {
    id: 1,
    title: "Technical Interview Anxiety",
    description: "Freezing up during technical interviews, especially when solving algorithm problems on the spot.",
    status: "Active",
    severity: "High",
    progress: 35,
    actionItems: [
      "Practice mock interviews 3x per week",
      "Join an algorithm study group",
      "Record yourself solving problems to review later",
      "Work through interview anxiety techniques"
    ],
    createdAt: "2025-04-02"
  },
  {
    id: 2,
    title: "System Design Knowledge Gap",
    description: "Lacking confidence and experience with large-scale system design questions during interviews.",
    status: "Active",
    severity: "Medium",
    progress: 50,
    actionItems: [
      "Complete the system design fundamentals course",
      "Review 5 case studies of real-world architecture",
      "Practice explaining designs on whiteboard",
      "Join system design discussion groups"
    ],
    createdAt: "2025-03-15"
  },
  {
    id: 3,
    title: "Resume Not Getting Responses",
    description: "Application submissions aren't resulting in interview calls despite relevant experience.",
    status: "Solved",
    severity: "Medium",
    progress: 100,
    actionItems: [
      "Rewrite resume with ATS-friendly keywords",
      "Add quantifiable achievements to each role",
      "Get professional resume review",
      "Customize resume for each application"
    ],
    createdAt: "2025-02-28"
  },
  {
    id: 4,
    title: "Imposter Syndrome",
    description: "Feeling inadequate compared to peers and doubting own abilities despite evidence of competence.",
    status: "Active",
    severity: "High",
    progress: 25,
    actionItems: [
      "Keep a success journal to document achievements",
      "Connect with a mentor for perspective",
      "Join support groups with other professionals",
      "Practice positive self-talk techniques"
    ],
    createdAt: "2025-04-10"
  }
];

// Props interface for ChallengesContent
interface ChallengesContentProps {
  isFeatureAvailable: boolean;
  isLoading: boolean; 
  // Add any other props if ChallengesContent will receive more in the future
}

// Helper function to get the right status badge color
const getStatusColor = (status: string) => {
  switch (status) {
    case "Active":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
    case "Solved":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
};

// Helper function to get the right severity icon and color
const getSeverityDetails = (severity: string) => {
  switch (severity) {
    case "High":
      return {
        color: "text-red-600",
        bgColor: "bg-red-50",
        icon: <AlertTriangle className="h-4 w-4" />
      };
    case "Medium":
      return {
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        icon: <AlertTriangle className="h-4 w-4" />
      };
    case "Low":
      return {
        color: "text-green-600",
        bgColor: "bg-green-50",
        icon: <AlertTriangle className="h-4 w-4" />
      };
    default:
      return {
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        icon: <AlertTriangle className="h-4 w-4" />
      };
  }
};

const ChallengesContent: React.FC<ChallengesContentProps> = ({ isFeatureAvailable, isLoading }) => {
  const [filteredStatus, setFilteredStatus] = useState<string | null>(null);
  
  const filteredChallenges = filteredStatus 
    ? challengesData.filter(challenge => challenge.status === filteredStatus)
    : challengesData;

  return (
    <div className="space-y-6 md:space-y-8 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Personal Challenges</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">Track and overcome obstacles in your career journey</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant="outline" 
            onClick={() => setFilteredStatus(null)}
            className={filteredStatus === null ? "bg-gray-100" : ""}
            disabled={!isFeatureAvailable}
          >
            All
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setFilteredStatus("Active")}
            className={filteredStatus === "Active" ? "bg-yellow-100" : ""}
            disabled={!isFeatureAvailable}
          >
            Active
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setFilteredStatus("Solved")}
            className={filteredStatus === "Solved" ? "bg-green-100" : ""}
            disabled={!isFeatureAvailable}
          >
            Solved
          </Button>
        </div>
      </div>

      <div className="relative flex-grow min-h-0">
        {!isFeatureAvailable && !isLoading && <BlurOverlay />}
        
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${isFeatureAvailable ? 'overflow-y-auto h-full' : 'h-full'}`}>
          {filteredChallenges.map((challenge) => (
            <Dialog key={challenge.id}>
              <DialogTrigger asChild disabled={!isFeatureAvailable}>
                <Card className={`cursor-pointer hover:shadow-md transition-shadow ${!isFeatureAvailable ? 'opacity-50 pointer-events-none' : ''}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg md:text-xl">{challenge.title}</CardTitle>
                      <Badge className={getStatusColor(challenge.status)}>
                        {challenge.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 md:space-y-4">
                      <p className="text-sm md:text-base text-gray-600 line-clamp-2">
                        {challenge.description}
                      </p>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-full ${getSeverityDetails(challenge.severity).bgColor}`}>
                          {getSeverityDetails(challenge.severity).icon}
                          <span className={getSeverityDetails(challenge.severity).color}>
                            {challenge.severity} severity
                          </span>
                        </span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{challenge.createdAt}</span>
                        </span>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{challenge.progress}%</span>
                        </div>
                        <Progress value={challenge.progress} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              {isFeatureAvailable && (
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="text-xl flex items-center justify-between">
                      <span>{challenge.title}</span>
                      <Badge className={getStatusColor(challenge.status)}>
                        {challenge.status}
                      </Badge>
                    </DialogTitle>
                  </DialogHeader>
                  <div className="mt-4 space-y-5">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">DESCRIPTION</h4>
                      <p className="text-gray-800">{challenge.description}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">SEVERITY</h4>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${getSeverityDetails(challenge.severity).bgColor}`}>
                        {getSeverityDetails(challenge.severity).icon}
                        <span className={getSeverityDetails(challenge.severity).color}>
                          {challenge.severity}
                        </span>
                      </span>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">PROGRESS</h4>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Completion</span>
                        <span>{challenge.progress}%</span>
                      </div>
                      <Progress value={challenge.progress} className="h-2" />
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-3">ACTION ITEMS</h4>
                      <ul className="space-y-2">
                        {challenge.actionItems.map((item, index) => (
                          <li key={index} className="flex items-center gap-2 text-gray-800">
                            <div className="bg-gray-100 rounded-full p-1 flex-shrink-0">
                              {challenge.status === "Solved" ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Clock className="h-4 w-4 text-gray-500" />
                              )}
                            </div>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {challenge.status === "Solved" && (
                      <div className="bg-green-50 p-4 rounded-md flex items-center gap-3">
                        <Trophy className="h-5 w-5 text-green-600" />
                        <p className="text-green-800 font-medium">
                          Challenge successfully overcome!
                        </p>
                      </div>
                    )}
                    
                    <div className="flex justify-end pt-2">
                      <Button variant="outline" className="mr-2">
                        Edit
                      </Button>
                      <Button className="bg-[#12231B] hover:bg-[#1e3529]">
                        {challenge.status === "Solved" ? "Reopen" : "Mark as Solved"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              )}
            </Dialog>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChallengesContent;