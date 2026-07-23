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
 * Record attendance for student in matrix format
 */
function handleSaveAttendance(ss, data) {
  const attSheet = getOrCreateSheet(ss, "Attendance", ["Name", "Phone Number", "Course"]);
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

  // Find or create date column
  const lastCol = attSheet.getLastColumn() || 3;
  const headers = attSheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0];
  let colIndex = headers.indexOf(dateStr);
  if (colIndex === -1) {
    colIndex = headers.length;
    attSheet.getRange(1, colIndex + 1).setValue("'" + dateStr);
    attSheet.getRange(1, colIndex + 1).setFontWeight("bold");
  }

  // Find or create student row based on Phone Number (unique identifier)
  const rows = attSheet.getDataRange().getDisplayValues();
  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][1]).trim() === student.phone) {
      rowIndex = i;
      break;
    }
  }

  if (rowIndex === -1) {
    rowIndex = rows.length;
    attSheet.getRange(rowIndex + 1, 1).setValue(student.name);
    attSheet.getRange(rowIndex + 1, 2).setValue("'" + student.phone);
    attSheet.getRange(rowIndex + 1, 3).setValue(student.course);
  }

  // Check if already marked
  const existingVal = attSheet.getRange(rowIndex + 1, colIndex + 1).getDisplayValue();
  if (existingVal && existingVal !== "A") {
    return jsonResponse({
      success: false,
      alreadyMarked: true,
      message: "Attendance already marked."
    });
  }

  // Mark present (store 1)
  attSheet.getRange(rowIndex + 1, colIndex + 1).setValue(1);

  // Recalculate percentage
  recalculateAttendancePercentage(ss, studentId);

  return jsonResponse({
    success: true,
    message: "Attendance marked successfully."
  });
}

/**
 * Generate attendance (Absent = "A") for students who were not scanned today
 */
function handleGenerateAbsentees(ss, data) {
  const attSheet = getOrCreateSheet(ss, "Attendance", ["Name", "Phone Number", "Course"]);
  const dateStr = data.date || getTodayDateString();
  const students = fetchAllStudents(ss);

  // Ensure date column exists
  const lastCol = attSheet.getLastColumn() || 3;
  const headers = attSheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0];
  let colIndex = headers.indexOf(dateStr);
  if (colIndex === -1) {
    colIndex = headers.length;
    attSheet.getRange(1, colIndex + 1).setValue("'" + dateStr);
    attSheet.getRange(1, colIndex + 1).setFontWeight("bold");
  }

  const rows = attSheet.getDataRange().getDisplayValues();
  let absenteesCount = 0;

  // Add missing students and mark absent
  students.forEach(function(student) {
    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][1]).trim() === student.phone) {
        rowIndex = i;
        break;
      }
    }

    if (rowIndex === -1) {
      rowIndex = attSheet.getLastRow();
      attSheet.getRange(rowIndex + 1, 1).setValue(student.name);
      attSheet.getRange(rowIndex + 1, 2).setValue("'" + student.phone);
      attSheet.getRange(rowIndex + 1, 3).setValue(student.course);
      // Update local array to mimic the newly added row
      rows.push([student.name, student.phone, student.course]);
    }

    const cellVal = attSheet.getRange(rowIndex + 1, colIndex + 1).getDisplayValue();
    if (!cellVal) {
      attSheet.getRange(rowIndex + 1, colIndex + 1).setValue("A");
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
  const attSheet = getOrCreateSheet(ss, "Attendance", ["Name", "Phone Number", "Course"]);
  const studSheet = getOrCreateSheet(ss, "Students", [
    "Student ID", "Name", "Phone", "Course", "Batch", "Attendance Percentage", "Face Descriptor", "Created At"
  ]);

  const students = fetchAllStudents(ss);
  let student = null;
  for (let s of students) {
    if (s.studentId === studentId) {
      student = s;
      break;
    }
  }
  if (!student) return 0;

  const attRows = attSheet.getDataRange().getDisplayValues();
  let totalDays = 0;
  let presentDays = 0;

  // Find student row
  let rowIndex = -1;
  for (let i = 1; i < attRows.length; i++) {
    if (String(attRows[i][1]).trim() === student.phone) {
      rowIndex = i;
      break;
    }
  }

  if (rowIndex !== -1) {
    const rowData = attRows[rowIndex];
    for (let j = 3; j < rowData.length; j++) {
      const val = String(rowData[j]).trim();
      if (val) {
        totalDays++;
        if (val !== "A") {
          presentDays++;
        }
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
 * Fetch all attendance logs from matrix
 */
function fetchAllAttendance(ss) {
  const attSheet = getOrCreateSheet(ss, "Attendance", ["Name", "Phone Number", "Course"]);
  const students = fetchAllStudents(ss);
  const studentMap = {};
  students.forEach(function(s) {
    studentMap[s.phone] = s;
  });

  const rows = attSheet.getDataRange().getDisplayValues();
  const list = [];

  if (rows.length < 2 || rows[0].length < 4) {
    return list;
  }

  const headers = rows[0];

  for (let i = 1; i < rows.length; i++) {
    const phone = String(rows[i][1]).trim();
    const student = studentMap[phone] || {};

    for (let j = 3; j < headers.length; j++) {
      const dateStr = normalizeDateString(headers[j]);
      const cellVal = String(rows[i][j]).trim();

      if (cellVal) {
        const present = cellVal === "A" ? 0 : 1;
        const timeVal = "-"; // Time is no longer stored

        list.push({
          date: dateStr,
          time: timeVal,
          studentId: student.studentId || "Unknown",
          studentName: String(rows[i][0]) || student.name || "Unknown",
          phone: phone,
          course: String(rows[i][2]) || student.course || "",
          batch: student.batch || "",
          present: present
        });
      }
    }
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
  } else if (sheet.getLastRow() === 0) {
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

/**
 * Normalizes date string coming from Google Sheets
 */
function normalizeDateString(val) {
  if (!val) return "";
  let s = String(val).trim();
  if (s.startsWith("'")) s = s.substring(1);
  if (s.includes("GMT") || s.includes("Standard Time") || s.includes("UTC")) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return day + "-" + month + "-" + year;
    }
  }
  return s;
}
