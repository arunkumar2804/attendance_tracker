import { NextResponse } from "next/server";
import { fetchStatsFromGAS } from "@/lib/googleSheets";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gasUrl = searchParams.get("gasUrl") || undefined;

  const stats = await fetchStatsFromGAS(gasUrl);
  return NextResponse.json({ success: true, data: stats });
}
