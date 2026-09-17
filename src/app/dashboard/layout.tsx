"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "Peta" },
  { href: "/dashboard/devices", label: "Aset" },
  { href: "/dashboard/history", label: "Riwayat" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-slate-100">
          <span className="text-sky-400">📍</span> AR Fleet Tracker
        </div>
        <nav className="flex gap-1 bg-slate-950 rounded-lg p-1">
          {TABS.map((t) => {
            const active = t.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  active ? "bg-sky-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
        <button onClick={logout} className="text-sm text-slate-400 hover:text-slate-200">
          Keluar
        </button>
      </header>
      <main className="flex-1 flex flex-col min-h-0">{children}</main>
    </div>
  );
}
