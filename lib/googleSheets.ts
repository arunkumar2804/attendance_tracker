import { Student, AttendanceRecord, AttendanceStats } from "@/types";
import { getTodayFormatted } from "./utils";

// Local fallback store for immediate testing before Google Apps Script deployment
let localStudents: Student[] = [
  {
    studentId: "STD001",
    name: "Rahul Sharma",
    phone: "9876543210",
    course: "Computer Science",
    batch: "2024-A",
    attendancePercentage: 85.5,
    faceDescriptor: [], // Empty for initial mock or filled upon scan
    createdAt: new Date().toISOString(),
  },
  {
    studentId: "STD002",
    name: "Ananya Patel",
    phone: "9876543211",
    course: "Information Technology",
    batch: "2024-B",
    attendancePercentage: 92.0,
    faceDescriptor: [],
    createdAt: new Date().toISOString(),
  },
  {
    studentId: "STD003",
    name: "Vikram Singh",
    phone: "9876543212",
    course: "Computer Science",
    batch: "2024-A",
    attendancePercentage: 78.0,
    faceDescriptor: [],
    createdAt: new Date().toISOString(),
  },
];

let localAttendance: AttendanceRecord[] = [
  {
    date: getTodayFormatted(),
    studentId: "STD001",
    present: 1,
    studentName: "Rahul Sharma",
    phone: "9876543210",
    course: "Computer Science",
    batch: "2024-A",
  },
];

export async function fetchStudentsFromGAS(gasUrl?: string): Promise<Student[]> {
  const url = gasUrl || process.env.NEXT_PUBLIC_GAS_WEB_APP_URL;

  if (!url) {
    return localStudents;
  }

  try {
    const res = await fetch(`${url}?action=getStudents`, { cache: "no-store" });
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data;
    }
    return localStudents;
  } catch (err) {
    console.warn("GAS fetch error, using local fallback:", err);
    return localStudents;
  }
}

export async function fetchAttendanceFromGAS(gasUrl?: string): Promise<AttendanceRecord[]> {
  const url = gasUrl || process.env.NEXT_PUBLIC_GAS_WEB_APP_URL;

  if (!url) {
    return localAttendance;
  }

  try {
    const res = await fetch(`${url}?action=getAttendance`, { cache: "no-store" });
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data;
    }
    return localAttendance;
  } catch (err) {
    console.warn("GAS fetch error, using local fallback:", err);
    return localAttendance;
  }
}

export async function fetchStatsFromGAS(gasUrl?: string): Promise<AttendanceStats> {
  const url = gasUrl || process.env.NEXT_PUBLIC_GAS_WEB_APP_URL;

  if (!url) {
    const total = localStudents.length;
    const today = getTodayFormatted();
    const todayRecords = localAttendance.filter((r) => r.date === today);
    const presentToday = todayRecords.filter((r) => r.present === 1).length;
    const absentToday = todayRecords.filter((r) => r.present === 0).length;
    const rate = total > 0 ? Math.round((presentToday / total) * 100) : 0;
    const uniqueDates = new Set(localAttendance.map((r) => r.date));

    return {
      totalStudents: total,
      presentToday,
      absentToday,
      attendanceRate: rate,
      workingDays: uniqueDates.size || 1,
    };
  }

  try {
    const res = await fetch(`${url}?action=getStats`, { cache: "no-store" });
    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
  } catch (err) {
    console.warn("GAS stats fetch error:", err);
  }

  return {
    totalStudents: localStudents.length,
    presentToday: 0,
    absentToday: 0,
    attendanceRate: 0,
    workingDays: 1,
  };
}

export async function saveStudentToGAS(
  studentData: { name: string; phone: string; course: string; batch: string; faceDescriptor: number[] },
  gasUrl?: string
): Promise<{ success: boolean; student?: Student; error?: string }> {
  const url = gasUrl || process.env.NEXT_PUBLIC_GAS_WEB_APP_URL;

  if (!url) {
    // Local duplicate check
    const exists = localStudents.some((s) => s.phone.trim() === studentData.phone.trim());
    if (exists) {
      return { success: false, error: "Student with this phone number already registered." };
    }

    const nextId = `STD${String(localStudents.length + 1).padStart(3, "0")}`;
    const newStudent: Student = {
      studentId: nextId,
      name: studentData.name,
      phone: studentData.phone,
      course: studentData.course,
      batch: studentData.batch,
      attendancePercentage: 0,
      faceDescriptor: studentData.faceDescriptor,
      createdAt: new Date().toISOString(),
    };

    localStudents.push(newStudent);
    return { success: true, student: newStudent };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, // GAS CORS standard
      body: JSON.stringify({
        action: "saveStudent",
        ...studentData,
      }),
    });
    const json = await res.json();
    return json;
  } catch (err) {
    return { success: false, error: (err as Error).toString() };
  }
}

export async function saveAttendanceToGAS(
  studentId: string,
  gasUrl?: string
): Promise<{ success: boolean; message?: string; alreadyMarked?: boolean; error?: string }> {
  const url = gasUrl || process.env.NEXT_PUBLIC_GAS_WEB_APP_URL;
  const today = getTodayFormatted();

  if (!url) {
    const existing = localAttendance.find((r) => r.date === today && r.studentId === studentId);
    if (existing) {
      return { success: false, alreadyMarked: true, message: "Attendance already marked." };
    }

    const student = localStudents.find((s) => s.studentId === studentId);
    localAttendance.push({
      date: today,
      studentId,
      present: 1,
      studentName: student?.name || "Student",
      phone: student?.phone || "",
      course: student?.course || "",
      batch: student?.batch || "",
    });

    // Update local percentage
    if (student) {
      const studentRecords = localAttendance.filter((r) => r.studentId === studentId);
      const presentCount = studentRecords.filter((r) => r.present === 1).length;
      student.attendancePercentage = Math.round((presentCount / studentRecords.length) * 100);
    }

    return { success: true, message: "Attendance marked successfully." };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "saveAttendance",
        studentId,
        date: today,
      }),
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: (err as Error).toString() };
  }
}

export async function generateAbsenteesInGAS(
  gasUrl?: string
): Promise<{ success: boolean; absenteesCount?: number; message?: string; error?: string }> {
  const url = gasUrl || process.env.NEXT_PUBLIC_GAS_WEB_APP_URL;
  const today = getTodayFormatted();

  if (!url) {
    const todayScannedIds = new Set(localAttendance.filter((r) => r.date === today).map((r) => r.studentId));
    let count = 0;

    localStudents.forEach((student) => {
      if (!todayScannedIds.has(student.studentId)) {
        localAttendance.push({
          date: today,
          studentId: student.studentId,
          present: 0,
          studentName: student.name,
          phone: student.phone,
          course: student.course,
          batch: student.batch,
        });
        count++;

        // Update percentage
        const studentRecords = localAttendance.filter((r) => r.studentId === student.studentId);
        const presentCount = studentRecords.filter((r) => r.present === 1).length;
        student.attendancePercentage = Math.round((presentCount / studentRecords.length) * 100);
      }
    });

    return {
      success: true,
      absenteesCount: count,
      message: `Generated ${count} absentee record(s) for today.`,
    };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "generateAbsentees",
        date: today,
      }),
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: (err as Error).toString() };
  }
}
