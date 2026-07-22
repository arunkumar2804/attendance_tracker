import React, { useState } from "react";
import { Download, Printer, Search, Calendar } from "lucide-react";
import { AttendanceRecord, FilterOptions } from "@/types";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { exportToCsv, printAttendanceReport, getTodayFormatted, getYesterdayFormatted } from "@/lib/utils";

interface AttendanceHistoryProps {
  records: AttendanceRecord[];
  courses: string[];
  batches: string[];
  filters: FilterOptions;
  onFilterChange: (newFilters: FilterOptions) => void;
}

export const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({
  records,
  courses,
  batches,
  filters,
  onFilterChange,
}) => {
  const [dateFilterType, setDateFilterType] = useState<"all" | "today" | "yesterday" | "custom">("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const handleDateQuickFilter = (type: "all" | "today" | "yesterday" | "custom") => {
    setDateFilterType(type);
  };

  const filteredRecords = records.filter((r) => {
    const today = getTodayFormatted();
    const yesterday = getYesterdayFormatted();

    if (dateFilterType === "today" && r.date !== today) return false;
    if (dateFilterType === "yesterday" && r.date !== yesterday) return false;
    if (dateFilterType === "custom" && (startDate || endDate)) {
      // Basic date match if custom values are filled
      if (startDate && r.date < startDate) return false;
      if (endDate && r.date > endDate) return false;
    }
    return true;
  });

  const handleExportCsv = () => {
    const headers = ["Date", "Student ID", "Name", "Course", "Batch", "Status"];
    const rows = filteredRecords.map((r) => [
      r.date,
      r.studentId,
      r.studentName || "N/A",
      r.course || "N/A",
      r.batch || "N/A",
      r.present === 1 ? "PRESENT" : "ABSENT",
    ]);
    exportToCsv(`Attendance_Report_${getTodayFormatted()}`, headers, rows);
  };

  const handlePrint = () => {
    printAttendanceReport(`Attendance History Report`, filteredRecords);
  };

  return (
    <div className="space-y-4">
      {/* Filters & Export Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Date Buttons */}
          <Button
            onClick={() => handleDateQuickFilter("all")}
            variant={dateFilterType === "all" ? "primary" : "outline"}
            size="sm"
          >
            All Dates
          </Button>
          <Button
            onClick={() => handleDateQuickFilter("today")}
            variant={dateFilterType === "today" ? "primary" : "outline"}
            size="sm"
          >
            Today
          </Button>
          <Button
            onClick={() => handleDateQuickFilter("yesterday")}
            variant={dateFilterType === "yesterday" ? "primary" : "outline"}
            size="sm"
          >
            Yesterday
          </Button>

          <select
            value={filters.course}
            onChange={(e) => onFilterChange({ ...filters, course: e.target.value })}
            className="px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Courses</option>
            {courses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={filters.batch}
            onChange={(e) => onFilterChange({ ...filters, batch: e.target.value })}
            className="px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Batches</option>
            {batches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Search & Export Actions */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <Button onClick={handleExportCsv} variant="outline" size="sm" className="gap-1 text-xs">
            <Download className="w-3.5 h-3.5" /> CSV / Excel
          </Button>

          <Button onClick={handlePrint} variant="outline" size="sm" className="gap-1 text-xs">
            <Printer className="w-3.5 h-3.5" /> Print
          </Button>
        </div>
      </div>

      {/* History Log Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Student ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Batch</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">
                  No attendance history logs found.
                </td>
              </tr>
            ) : (
              filteredRecords.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-slate-900 dark:text-white">
                    {r.date}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                    {r.studentId}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                    {r.studentName || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {r.course || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {r.batch || "N/A"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={r.present === 1 ? "success" : "danger"}>
                      {r.present === 1 ? "PRESENT" : "ABSENT"}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
