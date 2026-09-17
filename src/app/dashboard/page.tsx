"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import type { MapMarker } from "@/components/FleetMap";

const FleetMap = dynamic(() => import("@/components/FleetMap"), { ssr: false });

interface Device {
  id: number;
  name: string;
  uniqueId: string;
  status: string;
  lastUpdate: string | null;
}

interface Position {
  deviceId: number;
  latitude: number;
  longitude: number;
  speed: number;
  fixTime: string;
}

const POLL_MS = 5000;

export default function DashboardPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [positions, setPositions] = useState<Record<number, Position>>({});
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<number | undefined>();

  const refresh = useCallback(async () => {
    try {
      const [devRes, posRes] = await Promise.all([fetch("/api/devices"), fetch("/api/positions")]);
      if (!devRes.ok || !posRes.ok) throw new Error("Gagal memuat data.");
      const devData = await devRes.json();
      const posData = await posRes.json();
      setDevices(devData.devices);
      const byDevice: Record<number, Position> = {};
      for (const p of posData.positions as Position[]) byDevice[p.deviceId] = p;
      setPositions(byDevice);
      setError("");
    } catch {
      setError("Tidak bisa memuat data terbaru — mencoba lagi...");
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const markers: MapMarker[] = devices
    .filter((d) => positions[d.id])
    .map((d) => ({
      id: d.id,
      name: d.name,
      lat: positions[d.id].latitude,
      lng: positions[d.id].longitude,
      online: d.status === "online",
      speedKmh: Math.round(positions[d.id].speed * 1.852),
      lastUpdate: d.lastUpdate,
    }));

  return (
    <div className="flex flex-1 min-h-0">
      <aside className="w-72 border-r border-slate-800 bg-slate-900/50 overflow-y-auto shrink-0">
        <div className="p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-3">
            {devices.length} Aset Terdaftar
          </div>
          {error && <div className="text-xs text-amber-400 mb-3">{error}</div>}
          <div className="flex flex-col gap-2">
            {devices.length === 0 && (
              <div className="text-sm text-slate-500">
                Belum ada aset. Tambah lewat menu &ldquo;Aset&rdquo; di atas.
              </div>
            )}
            {devices.map((d) => {
              const pos = positions[d.id];
              const online = d.status === "online";
              return (
                <button
                  key={d.id}
                  onClick={() => setSelected(d.id)}
                  className={`text-left p-3 rounded-xl border transition ${
                    selected === d.id
                      ? "border-sky-500 bg-sky-500/10"
                      : "border-slate-800 bg-slate-900 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${online ? "bg-green-500" : "bg-slate-600"}`} />
                    <span className="font-medium text-sm text-slate-100">{d.name}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {pos ? `${Math.round(pos.speed * 1.852)} km/j` : "Belum ada sinyal"}
                  </div>
                  <div className="text-xs text-slate-600">
                    {d.lastUpdate ? new Date(d.lastUpdate).toLocaleString("id-ID") : "—"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </aside>
      <div className="flex-1 min-h-0">
        <FleetMap markers={markers} focusId={selected} />
      </div>
    </div>
  );
}
