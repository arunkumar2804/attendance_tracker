import { NextResponse } from "next/server";
import { fetchStudentsFromGAS, saveStudentToGAS } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gasUrl = searchParams.get("gasUrl") || undefined;
  const students = await fetchStudentsFromGAS(gasUrl);
  return NextResponse.json({ success: true, data: students });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gasUrl, ...studentData } = body;

    if (!studentData.name || !studentData.phone || !studentData.course || !studentData.batch) {
      return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
    }

    if (!Array.isArray(studentData.faceDescriptor) || studentData.faceDescriptor.length === 0) {
      return NextResponse.json({ success: false, error: "Face descriptor is required." }, { status: 400 });
    }

    const result = await saveStudentToGAS(studentData, gasUrl);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
