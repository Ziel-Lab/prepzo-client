"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { format } from 'date-fns';

const applications = [
  {
    id: 1,
    company: "Tech Corp",
    position: "Senior Developer",
    status: "Interview",
    date: "2025-04-20",
    resume: "senior-dev-resume.pdf",
    coverLetter: "tech-corp-cover.pdf",
    matchScore: 8.5,
  },
  {
    id: 2,
    company: "Innovation Inc",
    position: "Product Manager",
    status: "Applied",
    date: "2025-04-18",
    resume: "pm-resume.pdf",
    coverLetter: "innovation-cover.pdf",
    matchScore: 7.2,
  },
  {
    id: 3,
    company: "Future Systems",
    position: "Tech Lead",
    status: "Review",
    date: "2025-04-15",
    resume: "tech-lead-resume.pdf",
    coverLetter: "future-systems-cover.pdf",
    matchScore: 9.0,
  },
];

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "interview":
      return "bg-green-100 text-green-800";
    case "applied":
      return "bg-blue-100 text-blue-800";
    case "review":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getMatchScoreColor = (score: number) => {
  if (score >= 8) return "text-green-600";
  if (score >= 6) return "text-yellow-600";
  return "text-red-600";
};

const ApplicationTracker = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Application Tracker
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {applications.map((application) => (
            <Card key={application.id} className="overflow-hidden border">
              <CardContent className="p-4">
                <div className="flex flex-col h-full space-y-3">
                  {/* Company and Status */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg truncate">{application.company}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        application.status
                      )}`}
                    >
                      {application.status}
                    </span>
                  </div>
                  
                  {/* Position and Date */}
                  <div>
                    <p className="text-sm text-gray-700 font-medium">{application.position}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(application.date), 'MMM d, yyyy')}
                    </p>
                  </div>

                  {/* Documents */}
                  <div className="flex flex-col space-y-2 mt-1">
                    <a 
                      href="#" 
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate"
                    >
                      {application.resume}
                    </a>
                    <a 
                      href="#" 
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate"
                    >
                      {application.coverLetter}
                    </a>
                  </div>

                  {/* Match Score */}
                  <div className="pt-2 mt-auto border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Match Score:</span>
                      <span className={`font-medium ${getMatchScoreColor(application.matchScore)}`}>
                        {application.matchScore}/10
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplicationTracker;
