"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { verifyToken } from "@/lib/auth";

function getPayload(): { userId: string; clientId: string; role: string } | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload;
  } catch {
    return null;
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [payload, setPayload] = useState<any>(null);

  useEffect(() => {
    const p = getPayload();
    if (!p) { router.push("/"); return; }
    setPayload(p);
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/");
  }

  if (!payload) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <nav className="w-64 bg-white border-r p-6 flex flex-col">
        <h2 className="text-lg font-bold mb-8">Nova SaaS</h2>
        <div className="flex flex-col gap-2 flex-1">
          <Link href="/dashboard" className="px-3 py-2 rounded-lg hover:bg-gray-100">Dashboard</Link>
          <Link href="/dashboard/kb" className="px-3 py-2 rounded-lg hover:bg-gray-100">Base de connaissances</Link>
          <Link href="/dashboard/widget" className="px-3 py-2 rounded-lg hover:bg-gray-100">Widget</Link>
          <Link href="/dashboard/analytics" className="px-3 py-2 rounded-lg hover:bg-gray-100">Statistiques</Link>
          <Link href="/dashboard/settings" className="px-3 py-2 rounded-lg hover:bg-gray-100">Paramètres</Link>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500 text-left">Déconnexion</button>
      </nav>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
