/**
 * Google Apps Script for Production Face Recognition Attendance Management System
 * Setup Instructions:
 * 1. Open Google Sheets -> Extensions -> Apps Script
 * 2. Replace Code.gs with this file
 * 3. Deploy as Web App (Execute as: Me, Who has access: Anyone)
 * 4. Copy the Web App URL into your Next.js application settings or .env.local
 */

function doGet(e) {
  try {
    const action = e.parameter.action || "getStudents";
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    let payloadData = {};
    if (e.parameter.payload) {
      try {
        payloadData = JSON.parse(e.parameter.payload);
      } catch (err) {
        payloadData = e.parameter;
      }
    } else {
      payloadData = e.parameter;
    }

    if (action === "getStudents") {
      return jsonResponse({ success: true, data: fetchAllStudents(ss) });
    } else if (action === "getAttendance") {
      return jsonResponse({ success: true, data: fetchAllAttendance(ss) });
    } else if (action === "getStats") {
      return jsonResponse({ success: true, data: calculateStats(ss) });
    } else if (action === "saveStudent") {
      return handleSaveStudent(ss, payloadData);
    } else if (action === "saveAttendance") {
      return handleSaveAttendance(ss, payloadData);
    } else if (action === "generateAbsentees") {
      return handleGenerateAbsentees(ss, payloadData);
    } else {
      return jsonResponse({ success: false, error: "Invalid action parameter" });
    }
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function doPost(e) {
  try {
    let postData = {};
    if (e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (err) {
        postData = e.parameter || {};
      }
    } else {
      postData = e.parameter || {};
    }

    const action = postData.action || e.parameter.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === "saveStudent") {
      return handleSaveStudent(ss, postData);
    } else if (action === "saveAttendance") {
      return handleSaveAttendance(ss, postData);
    } else if (action === "generateAbsentees") {
      return handleGenerateAbsentees(ss, postData);
    } else {
      return jsonResponse({ success: false, error: "Invalid post action" });
    }
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * Save new student after checking phone number uniqueness
 */
function handleSaveStudent(ss, data) {
  const sheet = getOrCreateSheet(ss, "Students", [
    "Student ID", "Name", "Phone", "Course", "Batch", "Attendance Percentage", "Face Descriptor", "Created At"
  ]);

  const rows = sheet.getDataRange().getValues();
  const phone = String(data.phone || "").trim();

  // Prevent duplicate phone number
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][2]).trim() === phone) {
      return jsonResponse({
        success: false,
        error: "Student with this phone number already registered."
      });
    }
  }

  const nextId = "STD" + String(rows.length).padStart(3, "0");
  const createdAt = new Date().toISOString();
  
  let descriptor = data.faceDescriptor || [];
  if (typeof descriptor === "string") {
    try {
      descriptor = JSON.parse(descriptor);
    } catch (e) {
      descriptor = [];
    }
  }
  
  const descriptorJson = JSON.stringify(descriptor);

  sheet.appendRow([
    nextId,
    data.name,
    phone,
    data.course,
    data.batch,
    0, // Attendance percentage
    descriptorJson,
    createdAt
  ]);

  const newStudent = {
    studentId: nextId,
    name: data.name,
    phone: phone,
    course: data.course,
    batch: data.batch,
    attendancePercentage: 0,
    faceDescriptor: descriptor,
    createdAt: createdAt
  };

  return jsonResponse({ success: true, student: newStudent });
}

/**
 * Record attendance for student (Present = 1)
 */
function handleSaveAttendance(ss, data) {
  const attSheet = getOrCreateSheet(ss, "Attendance", ["Date", "Time", "Student ID", "Name", "Phone Number", "Course", "Batch Number", "Present"]);
  const dateStr = data.date || getTodayDateString();
  const timeStr = data.time || getTodayTimeString();
  const studentId = data.studentId;

  if (!studentId) {
    return jsonResponse({ success: false, error: "Missing studentId parameter" });
  }

  const students = fetchAllStudents(ss);
  let student = null;
  for (let s of students) {
    if (s.studentId === studentId) {
      student = s;
      break;
    }
  }

  if (!student) {
    return jsonResponse({ success: false, error: "Student not found in database." });
  }

  const rows = attSheet.getDataRange().getDisplayValues();

  // Prevent duplicate entry for today
  for (let i = 1; i < rows.length; i++) {
    const rowDate = String(rows[i][0]).trim();
    const rowId = String(rows[i][2]).trim(); // Student ID is index 2
    if (rowDate === dateStr && rowId === studentId) {
      return jsonResponse({
        success: false,
        alreadyMarked: true,
        message: "Attendance already marked."
      });
    }
  }

  // Insert attendance record
  attSheet.appendRow([dateStr, timeStr, studentId, student.name, student.phone, student.course, student.batch, 1]);

  // Recalculate percentage
  recalculateAttendancePercentage(ss, studentId);

  return jsonResponse({
    success: true,
    message: "Attendance marked successfully."
  });
}

/**
 * Generate attendance (Present = 0) for students who were not scanned today
 */
function handleGenerateAbsentees(ss, data) {
  const students = fetchAllStudents(ss);
  const attSheet = getOrCreateSheet(ss, "Attendance", ["Date", "Time", "Student ID", "Name", "Phone Number", "Course", "Batch Number", "Present"]);
  const dateStr = data.date || getTodayDateString();
  const timeStr = "-"; // Not applicable for absentees generated automatically

  const rows = attSheet.getDataRange().getDisplayValues();
  const existingTodayIds = new Set();

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === dateStr) {
      existingTodayIds.add(String(rows[i][2]).trim()); // Student ID is index 2
    }
  }

  let absenteesCount = 0;
  students.forEach(function(student) {
    if (!existingTodayIds.has(student.studentId)) {
      attSheet.appendRow([dateStr, timeStr, student.studentId, student.name, student.phone, student.course, student.batch, 0]);
      absenteesCount++;
      recalculateAttendancePercentage(ss, student.studentId);
    }
  });

  return jsonResponse({
    success: true,
    message: "Generated " + absenteesCount + " absentee record(s) for today.",
    absenteesCount: absenteesCount
  });
}

/**
 * Automatically calculates and updates attendance percentage in Students sheet
 */
function recalculateAttendancePercentage(ss, studentId) {
  const attSheet = getOrCreateSheet(ss, "Attendance", ["Date", "Time", "Student ID", "Name", "Phone Number", "Course", "Batch Number", "Present"]);
  const studSheet = getOrCreateSheet(ss, "Students", [
    "Student ID", "Name", "Phone", "Course", "Batch", "Attendance Percentage", "Face Descriptor", "Created At"
  ]);

  const attRows = attSheet.getDataRange().getDisplayValues();
  let totalDays = 0;
  let presentDays = 0;

  for (let i = 1; i < attRows.length; i++) {
    if (String(attRows[i][2]).trim() === studentId) {
      totalDays++;
      if (Number(attRows[i][7]) === 1) { // Present is index 7
        presentDays++;
      }
    }
  }

  const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 1000) / 10 : 0;

  const studRows = studSheet.getDataRange().getDisplayValues();
  for (let j = 1; j < studRows.length; j++) {
    if (String(studRows[j][0]).trim() === studentId) {
      studSheet.getRange(j + 1, 6).setValue(percentage);
      break;
    }
  }

  return percentage;
}

/**
 * Fetch all students from Students sheet
 */
function fetchAllStudents(ss) {
  const sheet = getOrCreateSheet(ss, "Students", [
    "Student ID", "Name", "Phone", "Course", "Batch", "Attendance Percentage", "Face Descriptor", "Created At"
  ]);
  const rows = sheet.getDataRange().getDisplayValues();
  const students = [];

  for (let i = 1; i < rows.length; i++) {
    let descriptor = [];
    try {
      descriptor = JSON.parse(rows[i][6] || "[]");
    } catch (e) {
      descriptor = [];
    }

    students.push({
      studentId: String(rows[i][0]),
      name: String(rows[i][1]),
      phone: String(rows[i][2]),
      course: String(rows[i][3]),
      batch: String(rows[i][4]),
      attendancePercentage: Number(rows[i][5] || 0),
      faceDescriptor: descriptor,
      createdAt: String(rows[i][7] || "")
    });
  }

  return students;
}

/**
 * Fetch all attendance logs
 */
function fetchAllAttendance(ss) {
  const attSheet = getOrCreateSheet(ss, "Attendance", ["Date", "Time", "Student ID", "Name", "Phone Number", "Course", "Batch Number", "Present"]);
  const students = fetchAllStudents(ss);
  const studentMap = {};
  students.forEach(function(s) {
    studentMap[s.studentId] = s;
  });

  const rows = attSheet.getDataRange().getDisplayValues();
  const list = [];

  for (let i = 1; i < rows.length; i++) {
    const sid = String(rows[i][2]); // Student ID is index 2
    const student = studentMap[sid] || {};

    list.push({
      date: String(rows[i][0]),
      time: String(rows[i][1]),
      studentId: sid,
      studentName: String(rows[i][3]) || student.name || "Unknown",
      phone: String(rows[i][4]) || student.phone || "",
      course: String(rows[i][5]) || student.course || "",
      batch: String(rows[i][6]) || student.batch || "",
      present: Number(rows[i][7])
    });
  }

  return list;
}

/**
 * Dashboard stats computation
 */
function calculateStats(ss) {
  const students = fetchAllStudents(ss);
  const attList = fetchAllAttendance(ss);
  const todayStr = getTodayDateString();

  const todayRecords = attList.filter(function(r) { return r.date === todayStr; });
  const presentToday = todayRecords.filter(function(r) { return r.present === 1; }).length;
  const absentToday = todayRecords.filter(function(r) { return r.present === 0; }).length;

  const totalStudents = students.length;
  const rate = totalStudents > 0 ? Math.round((presentToday / totalStudents) * 100) : 0;

  return {
    totalStudents: totalStudents,
    presentToday: presentToday,
    absentToday: absentToday,
    attendanceRate: rate
  };
}

/**
 * Helper to ensure sheet exists with headers
 */
function getOrCreateSheet(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  }
  return sheet;
}

/**
 * Return formatted date DD-MM-YYYY
 */
function getTodayDateString() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return day + "-" + month + "-" + year;
}

/**
 * Return formatted time HH:MM AM/PM
 */
function getTodayTimeString() {
  const d = new Date();
  let hours = d.getHours();
  let minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0' + minutes : minutes;
  return hours + ':' + minutes + ' ' + ampm;
}

/**
 * Helper to return JSON with CORS headers
 */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
