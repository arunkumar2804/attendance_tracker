"use client";

import React, { useState, useEffect } from "react";
import { Camera, UserPlus, UserCheck, Settings, Sun, Moon } from "lucide-react";
import { Button } from "./ui/Button";

interface NavbarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenRegister: () => void;
  onOpenSettings: () => void;
  onGenerateAbsentees: () => void;
  isLoading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  onToggleDarkMode,
  onOpenRegister,
  onOpenSettings,
  onGenerateAbsentees,
  isLoading,
}) => {
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }) +
          " • " +
          now.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white font-bold">
            <Camera className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-800 dark:from-white dark:via-indigo-200 dark:to-slate-300">
              AttendAI
            </h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Face Recognition Attendance System
            </p>
          </div>
        </div>

        {/* Live Clock & Action Buttons */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-mono font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {timeStr}
          </div>

          <Button
            onClick={onOpenRegister}
            variant="primary"
            size="sm"
            className="gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Register Student</span>
          </Button>

          <Button
            onClick={onGenerateAbsentees}
            disabled={isLoading}
            variant="secondary"
            size="sm"
            className="gap-2"
          >
            <UserCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Mark Absentees</span>
          </Button>

          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            title="Toggle Dark Mode"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
