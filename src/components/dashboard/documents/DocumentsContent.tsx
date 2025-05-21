"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

const documentsData = [
  {
    id: 1,
    title: "Software Engineer Resume",
    type: "Resume",
    createdAt: "2025-04-20",
    lastModified: "2025-04-22",
    status: "Final"
  },
  {
    id: 2,
    title: "Cover Letter - Tech Lead Position",
    type: "Cover Letter",
    createdAt: "2025-04-19",
    lastModified: "2025-04-21",
    status: "Final"
  },
  {
    id: 3,
    title: "Project Manager Resume",
    type: "Resume",
    createdAt: "2025-04-15",
    lastModified: "2025-04-18",
    status: "Draft"
  },
  {
    id: 4,
    title: "Thank You Note - Google Interview",
    type: "Other",
    createdAt: "2025-04-14",
    lastModified: "2025-04-14",
    status: "Final"
  },
  {
    id: 5,
    title: "Cover Letter - Product Manager",
    type: "Cover Letter",
    createdAt: "2025-04-10",
    lastModified: "2025-04-12",
    status: "Draft"
  }
];

const DocumentsContent = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#12231B]">My Documents</h1>
        <p className="text-gray-600 mt-1">Track your career documents and materials</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {documentsData.map((doc) => (
          <Card key={doc.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#12231B]" />
                  {doc.title}
                </div>
                <span 
                  className={`text-sm px-2 py-1 rounded-full ${
                    doc.status === "Final" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {doc.status}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Type: {doc.type}</div>
                <div className="text-sm text-gray-600">Created: {doc.createdAt}</div>
                <div className="text-sm text-gray-600">Last Modified: {doc.lastModified}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DocumentsContent; 