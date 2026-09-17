import { NextResponse } from "next/server";
import { requireAuth, apiError } from "@/lib/api-helpers";
import { deleteDevice } from "@/lib/traccar";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    const deviceId = Number(id);
    if (!Number.isFinite(deviceId)) {
      return NextResponse.json({ error: "ID aset tidak valid." }, { status: 400 });
    }
    await deleteDevice(deviceId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
