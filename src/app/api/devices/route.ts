import { NextResponse } from "next/server";
import { requireAuth, apiError } from "@/lib/api-helpers";
import { listDevices, addDevice } from "@/lib/traccar";

export async function GET() {
  try {
    await requireAuth();
    const devices = await listDevices();
    return NextResponse.json({ devices });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(req: Request) {
  try {
    await requireAuth();
    const body = await req.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const uniqueId = typeof body?.uniqueId === "string" ? body.uniqueId.trim() : "";

    if (!name) return NextResponse.json({ error: "Nama aset wajib diisi." }, { status: 400 });
    if (!uniqueId) return NextResponse.json({ error: "ID unik tracker wajib diisi." }, { status: 400 });

    const device = await addDevice(name, uniqueId);
    return NextResponse.json({ ok: true, device });
  } catch (e) {
    return apiError(e);
  }
}
