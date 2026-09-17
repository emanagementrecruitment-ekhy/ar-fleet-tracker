import "server-only";
import { NextResponse } from "next/server";
import { hasSession } from "./auth";

export class ApiAuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function requireAuth() {
  if (!(await hasSession())) throw new ApiAuthError(401, "Silakan login kembali.");
}

export function apiError(e: unknown) {
  if (e instanceof ApiAuthError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  console.error(e);
  const message = e instanceof Error ? e.message : "Terjadi kesalahan pada server.";
  return NextResponse.json({ error: message }, { status: 500 });
}
