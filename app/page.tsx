"use client";

export const dynamic = "force-dynamic";

import React, { useState } from "react";
import { Camera, History, UserPlus, Users, RefreshCw } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useWebcam } from "@/hooks/useWebcam";
import { useAttendance } from "@/hooks/useAttendance";
import { useFaceApi } from "@/hooks/useFaceApi";

import { Navbar } from "@/components/Navbar";
import { StatsCards } from "@/components/StatsCards";
import { WebcamPreview } from "@/components/WebcamPreview";
import { StudentList } from "@/components/StudentList";
import { AttendanceHistory } from "@/components/AttendanceHistory";
import { RegistrationModal } from "@/components/RegistrationModal";
import { StudentDetailsModal } from "@/components/StudentDetailsModal";
import { SettingsModal } from "@/components/SettingsModal";
import { Toast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { apiService } from "@/services/api";

export default function DashboardPage() {
  const { settings, updateSettings } = useSettings();
  const { videoRef, isPlaying, error: webcamError, startStream } = useWebcam(settings.cameraResolution);
  const {
    students,
    rawStudents,
    attendance,
    stats,
    isLoading,
    toastMessage,
    selectedStudent,
    filters,
    courses,
    batches,
    setFilters,
    loadData,
    handleMarkAttendance,
    handleGenerateAbsentees,
    viewStudentDetails,
    setSelectedStudent,
    showToast,
  } = useAttendance(settings.appsScriptUrl);

  const { scanStatus, lastRecognizedStudent, confidence } = useFaceApi({
    videoRef,
    isPlaying,
    students: rawStudents,
    threshold: settings.recognitionThreshold,
    autoScan: settings.autoScan,
    soundEnabled: settings.successSound,
    onRecognized: handleMarkAttendance,
  });

  const [activeTab, setActiveTab] = useState<"live" | "history">("live");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleRegisterSubmit = async (data: {
    name: string;
    phone: string;
    course: string;
    batch: string;
    faceDescriptor: number[];
  }) => {
    try {
      const res = await apiService.registerStudent(data, settings.appsScriptUrl);
      if (res.success) {
        showToast(`Student ${data.name} registered successfully!`, "success");
        await loadData();
        return true;
      } else {
        showToast(res.error || "Failed to register student", "error");
        return false;
      }
    } catch (err) {
      showToast((err as Error).message, "error");
      return false;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <Navbar
        darkMode={settings.darkMode}
        onToggleDarkMode={() => updateSettings({ darkMode: !settings.darkMode })}
        onOpenRegister={() => setIsRegisterOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onGenerateAbsentees={handleGenerateAbsentees}
        isLoading={isLoading}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Metric Cards Banner */}
        <StatsCards stats={stats} />

        {/* Tab View Selection Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("live")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "live"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Camera className="w-4 h-4" /> Live Scanner & Directory
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "history"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <History className="w-4 h-4" /> Attendance History
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={loadData}
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Tab 1: Live Scanner & Student Directory */}
        {activeTab === "live" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Camera Preview Section */}
            <div className="lg:col-span-6 xl:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Camera className="w-4 h-4 text-indigo-500" /> Live Webcam Feed
                </h3>
                <span className="text-xs text-slate-400">Resolution: {settings.cameraResolution}</span>
              </div>

              <WebcamPreview
                videoRef={videoRef}
                isPlaying={isPlaying}
                error={webcamError}
                scanStatus={scanStatus}
                lastRecognizedStudent={lastRecognizedStudent}
                confidence={confidence}
                onRefreshStream={startStream}
              />

              <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Continuous Auto Scanning Active</p>
                <p>
                  Position your face clearly within camera view. Upon recognition (confidence &gt;{" "}
                  {Math.round(settings.recognitionThreshold * 100)}%), attendance will be recorded automatically without manual button clicks.
                </p>
              </div>
            </div>

            {/* Student Directory Section */}
            <div className="lg:col-span-6 xl:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" /> Student Directory ({students.length})
                </h3>
                <Button
                  onClick={() => setIsRegisterOpen(true)}
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Quick Register
                </Button>
              </div>

              <StudentList
                students={students}
                courses={courses}
                batches={batches}
                filters={filters}
                onFilterChange={setFilters}
                onViewStudent={viewStudentDetails}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Attendance History Logs */}
        {activeTab === "history" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-500" /> Master Attendance Logs
            </h3>
            <AttendanceHistory
              records={attendance}
              courses={courses}
              batches={batches}
              filters={filters}
              onFilterChange={setFilters}
            />
          </div>
        )}
      </main>

      {/* Modals & Overlay Alerts */}
      <RegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onRegisterSuccess={handleRegisterSubmit}
        existingStudents={rawStudents}
      />

      <StudentDetailsModal
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
      />

      <Toast message={toastMessage} />
    </div>
  );
}
