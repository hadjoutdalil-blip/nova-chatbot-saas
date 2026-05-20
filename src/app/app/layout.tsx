"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

function getPayload(): { userId: string; clientId: string; role: string } | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

const NAV = [
  { href: "/app", label: "Dashboard", icon: "📊" },
  { href: "/app/kb", label: "Base de connaissances", icon: "📚" },
  { href: "/app/widget", label: "Mon widget", icon: "💬" },
  { href: "/app/analytics", label: "Statistiques", icon: "📈" },
  { href: "/app/settings", label: "Paramètres", icon: "⚙️" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [payload, setPayload] = useState<any>(null);
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    const p = getPayload();
    if (!p) { router.push("/login"); return; }
    if (p.role === "admin") { router.push("/dashboard"); return; }
    setPayload(p);
    fetch("/api/clients", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((r) => r.json())
      .then((clients) => {
        const c = clients.find((c: any) => c.id === p.clientId);
        if (c) setClient(c);
      })
      .catch(() => {});
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  if (!payload) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <nav className="w-64 bg-white border-r p-6 flex flex-col">
        <Link href="/app" className="flex items-center gap-2 mb-8 no-underline text-gray-900">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: client?.primaryColor || "#7c3aed" }}>
            {client?.name?.charAt(0) || "N"}
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">{client?.name || "Mon espace"}</p>
            <p className="text-xs text-gray-400">Mon tableau de bord</p>
          </div>
        </Link>
        <div className="flex flex-col gap-1 flex-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  active ? "bg-purple-50 text-purple-700" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-500 text-left px-3 py-2">
          Déconnexion
        </button>
      </nav>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
