import React from "react";
import { Users, UserCheck, UserX, TrendingUp } from "lucide-react";
import { Card } from "./ui/Card";
import { AttendanceStats } from "@/types";

interface StatsCardsProps {
  stats: AttendanceStats;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const items = [
    {
      title: "Total Students",
      value: stats.totalStudents,
      icon: <Users className="w-6 h-6 text-indigo-500" />,
      bg: "bg-indigo-500/10 border-indigo-500/20",
    },
    {
      title: "Present Today",
      value: stats.presentToday,
      icon: <UserCheck className="w-6 h-6 text-emerald-500" />,
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Absent Today",
      value: stats.absentToday,
      icon: <UserX className="w-6 h-6 text-rose-500" />,
      bg: "bg-rose-500/10 border-rose-500/20",
    },
    {
      title: "Attendance Rate",
      value: `${stats.attendanceRate}%`,
      icon: <TrendingUp className="w-6 h-6 text-amber-500" />,
      bg: "bg-amber-500/10 border-amber-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, idx) => (
        <Card key={idx} className="relative overflow-hidden flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {item.title}
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {item.value}
            </h3>
          </div>
          <div className={`p-3 rounded-2xl border ${item.bg}`}>
            {item.icon}
          </div>
        </Card>
      ))}
    </div>
  );
};
