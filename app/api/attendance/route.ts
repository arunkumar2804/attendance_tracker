import { NextResponse } from "next/server";
import { fetchAttendanceFromGAS, saveAttendanceToGAS } from "@/lib/googleSheets";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gasUrl = searchParams.get("gasUrl") || undefined;
  const attendance = await fetchAttendanceFromGAS(gasUrl);
  return NextResponse.json({ success: true, data: attendance });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, gasUrl } = body;

    if (!studentId) {
      return NextResponse.json({ success: false, error: "studentId is required." }, { status: 400 });
    }

    const result = await saveAttendanceToGAS(studentId, gasUrl);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
