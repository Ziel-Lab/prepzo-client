import { BarChart, MessageSquare, FileText, TrendingUp } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import RecentConversations from "@/components/dashboard/RecentConversations";
import ApplicationTracker from "@/components/dashboard/ApplicationTracker";

const Index = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-[#12231B]">Welcome back, Alex!</h1>
          <p className="text-gray-600 mt-1">Track your career progress and growth</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Career Sessions"
            value="12"
            icon={<MessageSquare className="h-4 w-4 text-[#12231B]" />}
          />
          <StatsCard
            title="Applications"
            value="5"
            icon={<FileText className="h-4 w-4 text-[#12231B]" />}
          />
          <StatsCard
            title="Skills Growth"
            value="+15%"
            icon={<TrendingUp className="h-4 w-4 text-[#12231B]" />}
          />
          <StatsCard
            title="Goals Progress"
            value="75%"
            icon={<BarChart className="h-4 w-4 text-[#12231B]" />}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <RecentConversations />
          <ApplicationTracker />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
