"use client";

import { useEffect, useState, useCallback } from "react";

interface Device {
  id: number;
  name: string;
  uniqueId: string;
  status: string;
  lastUpdate: string | null;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [name, setName] = useState("");
  const [uniqueId, setUniqueId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/devices");
    if (res.ok) setDevices((await res.json()).devices);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addDevice() {
    if (!name.trim() || !uniqueId.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, uniqueId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menambah aset.");
        return;
      }
      setName("");
      setUniqueId("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function removeDevice(id: number) {
    if (!confirm("Hapus aset ini? Riwayat lokasinya juga akan hilang.")) return;
    await fetch(`/api/devices/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="flex-1 p-6 max-w-3xl mx-auto w-full">
      <h1 className="text-lg font-semibold text-slate-100 mb-1">Kelola Aset</h1>
      <p className="text-sm text-slate-500 mb-6">
        Setiap tracker GPS punya ID unik (biasanya IMEI device) yang harus dicocokkan dengan pengaturan
        pengiriman data di tracker itu sendiri.
      </p>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">
        <div className="text-sm font-medium text-slate-200 mb-3">Tambah Aset Baru</div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1.5">Nama Aset</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Motor Honda B1234XYZ"
              className="w-full py-2.5 px-3.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1.5">ID Unik Tracker</label>
            <input
              value={uniqueId}
              onChange={(e) => setUniqueId(e.target.value)}
              placeholder="Contoh: 865432101234567"
              className="w-full py-2.5 px-3.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm outline-none focus:border-sky-500"
            />
          </div>
        </div>
        <div className="min-h-[18px] text-xs text-red-400 mt-2">{error}</div>
        <button
          disabled={busy || !name.trim() || !uniqueId.trim()}
          onClick={addDevice}
          className="mt-2 py-2.5 px-5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 rounded-lg font-medium text-sm text-slate-950 transition"
        >
          Tambah Aset
        </button>
      </div>

      <div className="text-sm font-medium text-slate-200 mb-3">Daftar Aset ({devices.length})</div>
      <div className="flex flex-col gap-2">
        {devices.map((d) => (
          <div
            key={d.id}
            className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl"
          >
            <div>
              <div className="text-sm font-medium text-slate-100">{d.name}</div>
              <div className="text-xs text-slate-500">
                ID: {d.uniqueId} · {d.status === "online" ? "🟢 Online" : "⚪ Offline"}
              </div>
            </div>
            <button
              onClick={() => removeDevice(d.id)}
              className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-500/10"
            >
              Hapus
            </button>
          </div>
        ))}
        {devices.length === 0 && <div className="text-sm text-slate-500">Belum ada aset terdaftar.</div>}
      </div>
    </div>
  );
}
