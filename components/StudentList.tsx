import React from "react";
import { Search, Eye, Filter } from "lucide-react";
import { Student, FilterOptions } from "@/types";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

interface StudentListProps {
  students: Student[];
  courses: string[];
  batches: string[];
  filters: FilterOptions;
  onFilterChange: (newFilters: FilterOptions) => void;
  onViewStudent: (studentId: string) => void;
}

export const StudentList: React.FC<StudentListProps> = ({
  students,
  courses,
  batches,
  filters,
  onFilterChange,
  onViewStudent,
}) => {
  return (
    <div className="space-y-4">
      {/* Search & Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search student by name, ID, phone..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={filters.course}
            onChange={(e) => onFilterChange({ ...filters, course: e.target.value })}
            className="px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
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
            className="px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Batches</option>
            {batches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Student ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Batch</th>
              <th className="px-4 py-3">Attendance %</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {students.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-400">
                  No students found matching your criteria.
                </td>
              </tr>
            ) : (
              students.map((student) => {
                const percentage = student.attendancePercentage || 0;
                let badgeVariant: "success" | "warning" | "danger" = "success";
                if (percentage < 60) badgeVariant = "danger";
                else if (percentage < 80) badgeVariant = "warning";

                return (
                  <tr
                    key={student.studentId}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-medium text-slate-900 dark:text-white">
                      {student.studentId}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {student.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {student.phone}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {student.course}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {student.batch}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className={`h-full ${
                              percentage >= 80
                                ? "bg-emerald-500"
                                : percentage >= 60
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                          />
                        </div>
                        <Badge variant={badgeVariant}>{percentage}%</Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        onClick={() => onViewStudent(student.studentId)}
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
