import { NextResponse } from "next/server";
import { generateAbsenteesInGAS } from "@/lib/googleSheets";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { gasUrl } = body;

    const result = await generateAbsenteesInGAS(gasUrl);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
