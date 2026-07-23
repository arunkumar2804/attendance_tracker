import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { AttendanceRecord } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getTodayFormatted(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export function getYesterdayFormatted(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export function generateStudentId(existingCount: number = 0): string {
  const num = existingCount + 1;
  return `STD${String(num).padStart(3, "0")}`;
}

export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((val) => {
          const str = String(val ?? "");
          return str.includes(",") ? `"${str.replace(/"/g, '""')}"` : str;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printAttendanceReport(title: string, records: AttendanceRecord[]) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; color: #1e293b; }
          h1 { margin-bottom: 8px; font-size: 24px; }
          p { margin-bottom: 20px; color: #64748b; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #e2e8f0; padding: 10px 14px; text-align: left; font-size: 13px; }
          th { background-color: #f8fafc; font-weight: 600; color: #334155; }
          tr:nth-child(even) { background-color: #f1f5f9; }
          .badge-present { color: #166534; background: #dcfce7; padding: 4px 8px; border-radius: 9999px; font-weight: 600; }
          .badge-absent { color: #991b1b; background: #fee2e2; padding: 4px 8px; border-radius: 9999px; font-weight: 600; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Student ID</th>
              <th>Name</th>
              <th>Course</th>
              <th>Batch</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${records
              .map(
                (r) => `
              <tr>
                <td>${r.date}</td>
                <td>${r.time || "-"}</td>
                <td>${r.studentId}</td>
                <td>${r.studentName || "N/A"}</td>
                <td>${r.course || "N/A"}</td>
                <td>${r.batch || "N/A"}</td>
                <td>
                  <span class="${r.present === 1 ? "badge-present" : "badge-absent"}">
                    ${r.present === 1 ? "PRESENT" : "ABSENT"}
                  </span>
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
