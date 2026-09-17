import { NextResponse } from "next/server";
import { requireAuth, apiError } from "@/lib/api-helpers";
import { latestPositions } from "@/lib/traccar";

export async function GET() {
  try {
    await requireAuth();
    const positions = await latestPositions();
    return NextResponse.json({ positions });
  } catch (e) {
    return apiError(e);
  }
}
