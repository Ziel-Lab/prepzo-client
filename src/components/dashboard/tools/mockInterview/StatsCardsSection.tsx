"use client";

import React from 'react';
import { Calendar, Clock, Award, TrendingUp } from 'lucide-react';
import SessionStatsCard from './SessionStatsCard';

interface StatsCardsSectionProps {
  liveStats: any;
  statsLoading: boolean;
  localStats: {
    total: number;
    completed: number;
    avgScore: string;
    totalTime: number;
  };
}

const SkeletonStatsCard = () => (
  <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-lg p-4 sm:p-6">
    <div className="flex items-center gap-3 sm:gap-4">
      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-lg animate-pulse"></div>
      <div className="flex-1">
        <div className="h-3 bg-gray-200 rounded animate-pulse mb-2"></div>
        <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
      </div>
    </div>
  </div>
);

const StatsCardsSection: React.FC<StatsCardsSectionProps> = ({
  liveStats,
  statsLoading,
  localStats
}) => {
  // Show skeleton loading for initial load
  if (statsLoading && !liveStats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <SkeletonStatsCard />
        <SkeletonStatsCard />
        <SkeletonStatsCard />
        <SkeletonStatsCard />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      <SessionStatsCard
        title="Total Sessions"
        value={liveStats?.total_sessions?.toString() || localStats.total.toString()}
        icon={Calendar}
        color="blue"
      />
      <SessionStatsCard
        title="Completed"
        value={liveStats?.completed_sessions?.toString() || localStats.completed.toString()}
        icon={Clock}
        color="green"
      />
      <SessionStatsCard
        title="Avg Score"
        value={liveStats?.avg_score_display || `${localStats.avgScore}/10`}
        icon={Award}
        color="purple"
      />
      <SessionStatsCard
        title="Total Time"
        value={liveStats?.total_time_display || `${Math.floor(localStats.totalTime / 60)}h ${localStats.totalTime % 60}m`}
        icon={TrendingUp}
        color="orange"
      />
    </div>
  );
};

export default StatsCardsSection;
