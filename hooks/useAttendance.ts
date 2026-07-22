"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Student, AttendanceRecord, AttendanceStats, FilterOptions, StudentDetail } from "@/types";
import { apiService } from "@/services/api";

export function useAttendance(appsScriptUrl?: string) {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    attendanceRate: 0,
    workingDays: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null);

  // Filters state
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: "",
    dateFilter: "all",
    course: "all",
    batch: "all",
  });

  const showToast = useCallback((text: string, type: "success" | "error" | "info" = "info") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [studRes, attRes, statRes] = await Promise.all([
        apiService.getStudents(appsScriptUrl),
        apiService.getAttendance(appsScriptUrl),
        apiService.getStats(appsScriptUrl),
      ]);

      setStudents(studRes);
      setAttendance(attRes);
      setStats(statRes);
    } catch (err) {
      console.error("Failed to load attendance data:", err);
      showToast("Error loading data from Google Sheets API", "error");
    } finally {
      setIsLoading(false);
    }
  }, [appsScriptUrl, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle live recognition trigger
  const handleMarkAttendance = useCallback(
    async (student: Student) => {
      try {
        const res = await apiService.markAttendance(student.studentId, appsScriptUrl);
        if (res.success) {
          showToast(`Attendance marked for ${student.name}`, "success");
          loadData();
        } else if (res.alreadyMarked) {
          showToast(`Attendance already marked for ${student.name} today.`, "info");
        } else {
          showToast(res.error || "Failed to mark attendance", "error");
        }
      } catch (err) {
        showToast((err as Error).message, "error");
      }
    },
    [appsScriptUrl, loadData, showToast]
  );

  // Automatic absent generation
  const handleGenerateAbsentees = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiService.generateAbsentees(appsScriptUrl);
      if (res.success) {
        showToast(res.message || "Absentee generation completed successfully.", "success");
        await loadData();
      } else {
        showToast(res.error || "Failed to generate absentees.", "error");
      }
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setIsLoading(false);
    }
  }, [appsScriptUrl, loadData, showToast]);

  // View student details
  const viewStudentDetails = useCallback(
    (studentId: string) => {
      const student = students.find((s) => s.studentId === studentId);
      if (!student) return;

      const history = attendance.filter((r) => r.studentId === studentId);
      const presentDays = history.filter((r) => r.present === 1).length;
      const absentDays = history.filter((r) => r.present === 0).length;
      const totalWorkingDays = history.length;

      const detail: StudentDetail = {
        ...student,
        presentDays,
        absentDays,
        totalWorkingDays,
        history,
      };

      setSelectedStudent(detail);
    },
    [students, attendance]
  );

  // Unique list of Courses and Batches for dropdown filters
  const courses = useMemo(() => {
    const set = new Set(students.map((s) => s.course).filter(Boolean));
    return Array.from(set);
  }, [students]);

  const batches = useMemo(() => {
    const set = new Set(students.map((s) => s.batch).filter(Boolean));
    return Array.from(set);
  }, [students]);

  // Filtered Students list
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        s.phone.includes(filters.searchQuery) ||
        s.studentId.toLowerCase().includes(filters.searchQuery.toLowerCase());
      const matchesCourse = filters.course === "all" || s.course === filters.course;
      const matchesBatch = filters.batch === "all" || s.batch === filters.batch;
      return matchesSearch && matchesCourse && matchesBatch;
    });
  }, [students, filters]);

  // Filtered Attendance History records
  const filteredAttendance = useMemo(() => {
    return attendance.filter((r) => {
      const student = students.find((s) => s.studentId === r.studentId);
      const studentName = r.studentName || student?.name || "";
      const matchesSearch =
        studentName.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        r.studentId.toLowerCase().includes(filters.searchQuery.toLowerCase());
      const matchesCourse = filters.course === "all" || (r.course || student?.course) === filters.course;
      const matchesBatch = filters.batch === "all" || (r.batch || student?.batch) === filters.batch;
      return matchesSearch && matchesCourse && matchesBatch;
    });
  }, [attendance, students, filters]);

  return {
    students: filteredStudents,
    rawStudents: students,
    attendance: filteredAttendance,
    rawAttendance: attendance,
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
  };
}
