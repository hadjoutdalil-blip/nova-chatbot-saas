"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  BookOpen,
  MessageCircle,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  FlaskConical,
} from "lucide-react";

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
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/kb", label: "Base de connaissances", icon: BookOpen },
  { href: "/app/test", label: "Tester", icon: FlaskConical },
  { href: "/app/widget", label: "Mon widget", icon: MessageCircle },
  { href: "/app/conversations", label: "Conversations", icon: MessageSquare },
  { href: "/app/analytics", label: "Statistiques", icon: BarChart3 },
  { href: "/app/settings", label: "Paramètres", icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [payload, setPayload] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!client?.slug) return;
    const existing = document.querySelector(`script[src*="/api/widget/${client.slug}/embed"]`);
    if (existing) return;
    const el = document.createElement("script");
    el.src = `/api/widget/${client.slug}/embed?t=${Date.now()}`;
    el.async = true;
    widgetRef.current?.appendChild(el);
    return () => { el.remove(); };
  }, [client?.slug]);

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  if (!payload) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-blue-50/30 flex">
      <nav className="w-64 bg-white/80 backdrop-blur-xl border-r border-white/20 p-6 flex flex-col shrink-0">
        <Link href="/app" className="flex items-center gap-3 mb-8 no-underline">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg" style={{ backgroundColor: client?.primaryColor || "#7c3aed" }}>
            {client?.name?.charAt(0) || "N"}
          </div>
          <div>
            <p className="font-bold text-sm leading-tight text-gray-900">{client?.name || "Mon espace"}</p>
            <p className="text-xs text-gray-400">Mon tableau de bord</p>
          </div>
        </Link>
        <div className="flex flex-col gap-1 flex-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active ? "bg-emerald-100/80 text-emerald-700 shadow-sm" : "text-gray-600 hover:bg-white/60 hover:text-gray-900"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </div>
        <button onClick={handleLogout} className="flex items-center gap-3 text-sm text-gray-400 hover:text-red-500 transition-colors text-left px-4 py-2.5 rounded-xl hover:bg-red-50/50">
          <LogOut size={18} />
          Déconnexion
        </button>
      </nav>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
      <div ref={widgetRef} />
    </div>
  );
}
