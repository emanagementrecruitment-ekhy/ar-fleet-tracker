import "server-only";

const BASE_URL = process.env.TRACCAR_URL ?? "http://localhost:8082";

// One shared Traccar account drives every call from this app — there's no
// need for per-app-user Traccar accounts since app-level auth (see auth.ts)
// already gates who gets in. The cookie is cached at module scope (this
// process stays warm on Railway, same pattern as the Prisma client
// singleton elsewhere) so we don't log in to Traccar on every request.
let sessionCookie: string | null = null;

async function sessionLogin(email: string, password: string): Promise<string | null> {
  const res = await fetch(`${BASE_URL}/api/session`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ email, password }),
  });
  if (!res.ok) return null;
  const cookie = res.headers.get("set-cookie");
  return cookie ? cookie.split(";")[0] : null;
}

async function login(): Promise<string> {
  const email = process.env.TRACCAR_EMAIL;
  const password = process.env.TRACCAR_PASSWORD;
  if (!email || !password) throw new Error("TRACCAR_EMAIL/TRACCAR_PASSWORD belum diset di server.");

  const cookie = await sessionLogin(email, password);
  if (cookie) return cookie;

  // Brand-new Traccar server has no users yet — Traccar lets the very first
  // POST /api/users through unauthenticated and makes it admin. Safe to
  // attempt on every failed login: once a user exists, Traccar rejects this
  // and we fall through to the real error below.
  const createRes = await fetch(`${BASE_URL}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Admin", email, password }),
  });
  if (createRes.ok) {
    const retryCookie = await sessionLogin(email, password);
    if (retryCookie) return retryCookie;
  }

  throw new Error("Login ke Traccar gagal dan pembuatan admin awal juga gagal.");
}

async function request<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
  if (!sessionCookie) sessionCookie = await login();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Cookie: sessionCookie,
    },
    cache: "no-store",
  });

  // Traccar sessions expire — re-login once and retry rather than surfacing
  // a spurious 401 to the dashboard.
  if (res.status === 401 && !retried) {
    sessionCookie = await login();
    return request<T>(path, init, true);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Traccar API ${path} gagal (${res.status}): ${text.slice(0, 200)}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface TraccarDevice {
  id: number;
  name: string;
  uniqueId: string;
  status: "online" | "offline" | "unknown";
  lastUpdate: string | null;
  positionId: number;
  disabled: boolean;
}

export interface TraccarPosition {
  id: number;
  deviceId: number;
  latitude: number;
  longitude: number;
  speed: number; // knots
  course: number;
  altitude: number;
  fixTime: string;
  address: string | null;
  attributes: Record<string, unknown>;
}

export function listDevices(): Promise<TraccarDevice[]> {
  return request<TraccarDevice[]>("/api/devices");
}

export function addDevice(name: string, uniqueId: string): Promise<TraccarDevice> {
  return request<TraccarDevice>("/api/devices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, uniqueId }),
  });
}

export function deleteDevice(id: number): Promise<void> {
  return request<void>(`/api/devices/${id}`, { method: "DELETE" });
}

export function latestPositions(): Promise<TraccarPosition[]> {
  return request<TraccarPosition[]>("/api/positions");
}

export function positionHistory(deviceId: number, from: Date, to: Date): Promise<TraccarPosition[]> {
  const params = new URLSearchParams({
    deviceId: String(deviceId),
    from: from.toISOString(),
    to: to.toISOString(),
  });
  return request<TraccarPosition[]>(`/api/reports/route?${params}`, {
    headers: { Accept: "application/json" },
  });
}

/** Knots -> km/h, the unit the dashboard actually shows. */
export function knotsToKmh(knots: number): number {
  return Math.round(knots * 1.852);
}
