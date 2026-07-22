import React from "react";
import { UserCheck, UserX, Calendar, Phone, GraduationCap, Layers } from "lucide-react";
import { Dialog } from "./ui/Dialog";
import { Badge } from "./ui/Badge";
import { StudentDetail } from "@/types";

interface StudentDetailsModalProps {
  student: StudentDetail | null;
  onClose: () => void;
}

export const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({ student, onClose }) => {
  if (!student) return null;

  return (
    <Dialog isOpen={!!student} onClose={onClose} title="Student Profile & Attendance History" maxWidth="xl">
      <div className="space-y-6">
        {/* Profile Card Header */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-900/10 via-slate-800/10 to-purple-900/10 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {student.studentId}
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {student.name}
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-2">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> {student.phone}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" /> {student.course}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> {student.batch}
              </span>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Attendance</p>
            <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {student.attendancePercentage}%
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <UserCheck className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{student.presentDays}</p>
            <p className="text-[10px] uppercase font-semibold text-slate-500">Present Days</p>
          </div>

          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
            <UserX className="w-5 h-5 text-rose-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{student.absentDays}</p>
            <p className="text-[10px] uppercase font-semibold text-slate-500">Absent Days</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-500/10 border border-slate-500/20 text-center">
            <Calendar className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{student.totalWorkingDays}</p>
            <p className="text-[10px] uppercase font-semibold text-slate-500">Total Working Days</p>
          </div>
        </div>

        {/* History Timeline */}
        <div>
          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Attendance Log Timeline
          </h4>
          <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
            {student.history.length === 0 ? (
              <p className="p-4 text-xs text-slate-400 text-center">No attendance history records found.</p>
            ) : (
              student.history.map((record, i) => (
                <div key={i} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
                    {record.date}
                  </span>
                  <Badge variant={record.present === 1 ? "success" : "danger"}>
                    {record.present === 1 ? "PRESENT" : "ABSENT"}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
};
