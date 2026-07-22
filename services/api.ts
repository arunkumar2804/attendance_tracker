import { Student, AttendanceRecord, AttendanceStats, RegistrationFormData } from "@/types";

export const apiService = {
  async getStudents(gasUrl?: string): Promise<Student[]> {
    const url = `/api/students${gasUrl ? `?gasUrl=${encodeURIComponent(gasUrl)}` : ""}`;
    const res = await fetch(url);
    const json = await res.json();
    return json.data || [];
  },

  async registerStudent(
    data: RegistrationFormData & { faceDescriptor: number[] },
    gasUrl?: string
  ): Promise<{ success: boolean; student?: Student; error?: string }> {
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, gasUrl }),
    });
    return await res.json();
  },

  async getAttendance(gasUrl?: string): Promise<AttendanceRecord[]> {
    const url = `/api/attendance${gasUrl ? `?gasUrl=${encodeURIComponent(gasUrl)}` : ""}`;
    const res = await fetch(url);
    const json = await res.json();
    return json.data || [];
  },

  async markAttendance(
    studentId: string,
    gasUrl?: string
  ): Promise<{ success: boolean; message?: string; alreadyMarked?: boolean; error?: string }> {
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, gasUrl }),
    });
    return await res.json();
  },

  async generateAbsentees(
    gasUrl?: string
  ): Promise<{ success: boolean; absenteesCount?: number; message?: string; error?: string }> {
    const res = await fetch("/api/generate-absent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gasUrl }),
    });
    return await res.json();
  },

  async getStats(gasUrl?: string): Promise<AttendanceStats> {
    const url = `/api/stats${gasUrl ? `?gasUrl=${encodeURIComponent(gasUrl)}` : ""}`;
    const res = await fetch(url);
    const json = await res.json();
    return json.data || { totalStudents: 0, presentToday: 0, absentToday: 0, attendanceRate: 0, workingDays: 0 };
  },
};
