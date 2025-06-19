
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Clock, CheckCircle, XCircle } from "lucide-react";

const ApplicationsStats = () => {
  const stats = [
    {
      title: "Total Applications",
      value: "24",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "In Progress",
      value: "8",
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Interviews",
      value: "5",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Rejected",
      value: "3",
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ApplicationsStats;
