import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface SessionStatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const SessionStatsCard: React.FC<SessionStatsCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  trend 
}) => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
          icon: 'text-white',
          iconBg: 'bg-gradient-to-r from-blue-600 to-indigo-600',
          border: 'border-blue-200/50',
          accent: 'text-blue-700'
        };
      case 'green':
        return {
          bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
          icon: 'text-white',
          iconBg: 'bg-gradient-to-r from-green-600 to-emerald-600',
          border: 'border-green-200/50',
          accent: 'text-green-700'
        };
      case 'purple':
        return {
          bg: 'bg-gradient-to-br from-purple-50 to-violet-50',
          icon: 'text-white',
          iconBg: 'bg-gradient-to-r from-purple-600 to-violet-600',
          border: 'border-purple-200/50',
          accent: 'text-purple-700'
        };
      case 'orange':
        return {
          bg: 'bg-gradient-to-br from-orange-50 to-amber-50',
          icon: 'text-white',
          iconBg: 'bg-gradient-to-r from-orange-600 to-amber-600',
          border: 'border-orange-200/50',
          accent: 'text-orange-700'
        };
      case 'red':
        return {
          bg: 'bg-gradient-to-br from-red-50 to-rose-50',
          icon: 'text-white',
          iconBg: 'bg-gradient-to-r from-red-600 to-rose-600',
          border: 'border-red-200/50',
          accent: 'text-red-700'
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-50 to-slate-50',
          icon: 'text-white',
          iconBg: 'bg-gradient-to-r from-gray-600 to-slate-600',
          border: 'border-gray-200/50',
          accent: 'text-gray-700'
        };
    }
  };

  const colorClasses = getColorClasses(color);

  return (
    <Card className={`hover:shadow-xl transition-all duration-300 ${colorClasses.border} border backdrop-blur-sm bg-white/80 hover:-translate-y-1 animate-fade-in shadow-lg`}>
      <CardContent className={`p-6 ${colorClasses.bg} rounded-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
            {trend && (
              <div className="mt-2 flex items-center text-xs">
                <span className={`font-bold px-2 py-1 rounded-full ${trend.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
                </span>
                <span className="text-gray-600 ml-2 font-medium">vs last month</span>
              </div>
            )}
          </div>
          <div className={`p-4 rounded-xl ${colorClasses.iconBg} shadow-lg hover:shadow-xl transition-all duration-200`}>
            <Icon size={28} className={colorClasses.icon} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionStatsCard; 