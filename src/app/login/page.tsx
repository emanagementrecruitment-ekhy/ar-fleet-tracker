"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!password) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal masuk.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Tidak bisa terhubung ke server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto mb-3 w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 grid place-items-center text-sky-400 text-2xl">
            📍
          </div>
          <h1 className="text-xl font-semibold text-slate-100">AR Fleet Tracker</h1>
          <p className="text-sm text-slate-400 mt-1">Pelacak lokasi aset & kendaraan</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <label className="block text-xs uppercase tracking-wide text-slate-400 mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="w-full py-3 px-4 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 outline-none focus:border-sky-500"
            placeholder="••••••••"
            autoFocus
          />
          <div className="min-h-[20px] text-sm text-red-400 mt-2">{error}</div>
          <button
            disabled={busy || !password}
            onClick={submit}
            className="w-full mt-2 py-3 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 rounded-xl font-semibold text-slate-950 transition"
          >
            Masuk
          </button>
        </div>
      </div>
    </div>
  );
}
