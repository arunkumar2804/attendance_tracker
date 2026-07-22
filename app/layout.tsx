import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AttendAI — Face Recognition Attendance Management System",
  description: "AI-powered automated face recognition attendance tracking system built with Next.js, face-api.js, and Google Sheets backend.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
