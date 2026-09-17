import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (!rateLimit(`login:ip:${clientIp(req)}`, 10, 10 * 60_000)) {
    return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  const expected = process.env.APP_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: "APP_PASSWORD belum diset di server." }, { status: 500 });
  }
  if (password !== expected) {
    return NextResponse.json({ error: "Password salah." }, { status: 401 });
  }

  await createSession();
  return NextResponse.json({ ok: true });
}
