export interface Student {
  studentId: string;
  name: string;
  phone: string;
  course: string;
  batch: string;
  attendancePercentage: number;
  faceDescriptor: number[]; // 128 floats
  createdAt: string;
}

export interface AttendanceRecord {
  date: string; // DD-MM-YYYY
  time?: string; // HH:MM AM/PM
  studentId: string;
  present: 1 | 0;
  studentName?: string;
  phone?: string;
  course?: string;
  batch?: string;
}

export interface AttendanceStats {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  attendanceRate: number;
  workingDays: number;
}

export interface StudentDetail extends Student {
  presentDays: number;
  absentDays: number;
  totalWorkingDays: number;
  history: AttendanceRecord[];
}

export interface SystemSettings {
  recognitionThreshold: number;
  cameraResolution: '640x480' | '1280x720' | '1920x1080';
  autoScan: boolean;
  successSound: boolean;
  darkMode: boolean;
  appsScriptUrl: string;
}

export interface RegistrationFormData {
  name: string;
  phone: string;
  course: string;
  batch: string;
}

export interface RecognitionMatch {
  student: Student;
  distance: number;
  confidence: number;
}

export interface FilterOptions {
  searchQuery: string;
  dateFilter: 'all' | 'today' | 'yesterday' | 'range';
  startDate?: string;
  endDate?: string;
  course: string;
  batch: string;
}
