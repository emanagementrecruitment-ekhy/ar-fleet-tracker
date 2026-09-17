import { NextResponse } from "next/server";
import { requireAuth, apiError } from "@/lib/api-helpers";
import { positionHistory } from "@/lib/traccar";

export async function GET(req: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const deviceId = Number(searchParams.get("deviceId"));
    const fromRaw = searchParams.get("from");
    const toRaw = searchParams.get("to");

    if (!Number.isFinite(deviceId)) {
      return NextResponse.json({ error: "deviceId wajib diisi." }, { status: 400 });
    }
    const from = fromRaw ? new Date(fromRaw) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const to = toRaw ? new Date(toRaw) : new Date();
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return NextResponse.json({ error: "Tanggal tidak valid." }, { status: 400 });
    }

    const positions = await positionHistory(deviceId, from, to);
    return NextResponse.json({ positions });
  } catch (e) {
    return apiError(e);
  }
}
