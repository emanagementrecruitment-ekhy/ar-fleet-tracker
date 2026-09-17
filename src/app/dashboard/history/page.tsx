"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { MapMarker } from "@/components/FleetMap";

const FleetMap = dynamic(() => import("@/components/FleetMap"), { ssr: false });

interface Device {
  id: number;
  name: string;
}

interface Position {
  deviceId: number;
  latitude: number;
  longitude: number;
  speed: number;
  fixTime: string;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function HistoryPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceId, setDeviceId] = useState<number | null>(null);
  const [date, setDate] = useState(todayStr());
  const [route, setRoute] = useState<[number, number][]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/devices")
      .then((r) => r.json())
      .then((data) => {
        setDevices(data.devices);
        if (data.devices.length > 0) setDeviceId(data.devices[0].id);
      });
  }, []);

  async function loadHistory() {
    if (!deviceId) return;
    setBusy(true);
    setError("");
    try {
      const from = new Date(`${date}T00:00:00`).toISOString();
      const to = new Date(`${date}T23:59:59`).toISOString();
      const res = await fetch(`/api/history?deviceId=${deviceId}&from=${from}&to=${to}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal memuat riwayat.");
        setRoute([]);
        return;
      }
      const positions = data.positions as Position[];
      setRoute(positions.map((p) => [p.latitude, p.longitude]));
      if (positions.length === 0) setError("Tidak ada data lokasi di tanggal ini.");
    } finally {
      setBusy(false);
    }
  }

  const markers: MapMarker[] =
    route.length > 0
      ? [{ id: -1, name: "Titik terakhir", lat: route[route.length - 1][0], lng: route[route.length - 1][1], online: true, speedKmh: 0, lastUpdate: null }]
      : [];

  return (
    <div className="flex flex-1 min-h-0">
      <aside className="w-72 border-r border-slate-800 bg-slate-900/50 p-4 shrink-0">
        <div className="text-sm font-medium text-slate-200 mb-3">Riwayat Perjalanan</div>
        <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1.5">Aset</label>
        <select
          value={deviceId ?? ""}
          onChange={(e) => setDeviceId(Number(e.target.value))}
          className="w-full py-2.5 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm mb-3 outline-none focus:border-sky-500"
        >
          {devices.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1.5">Tanggal</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={todayStr()}
          className="w-full py-2.5 px-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm mb-3 outline-none focus:border-sky-500"
        />
        <button
          disabled={busy || !deviceId}
          onClick={loadHistory}
          className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 rounded-lg font-medium text-sm text-slate-950 transition"
        >
          Tampilkan Rute
        </button>
        {error && <div className="text-xs text-amber-400 mt-3">{error}</div>}
        {route.length > 0 && <div className="text-xs text-slate-500 mt-3">{route.length} titik lokasi</div>}
      </aside>
      <div className="flex-1 min-h-0">
        <FleetMap markers={markers} route={route} />
      </div>
    </div>
  );
}
