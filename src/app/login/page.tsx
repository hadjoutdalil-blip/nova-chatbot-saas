"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, X } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    localStorage.setItem("token", data.token);
    router.push(data.user.role === "admin" ? "/dashboard" : "/app");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-emerald-50/30 to-blue-50/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(45%_40%_at_50%_60%,rgba(139,92,246,0.06),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(30%_30%_at_70%_20%,rgba(59,130,246,0.05),transparent)]" />

      <div className="w-full max-w-sm relative animate-fadeIn">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 text-gray-900 no-underline group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center text-white text-base font-bold shadow-lg shadow-emerald-200 group-hover:shadow-emerald-300 transition-shadow">
              N
            </div>
            <div className="text-left">
              <span className="font-bold text-lg block leading-tight">Nova Chatbot</span>
              <span className="text-xs text-gray-400 font-medium">Plateforme IA multi-tenant</span>
            </div>
          </Link>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-elevated border border-gray-100/60">
          <h1 className="text-xl font-bold mb-1 text-center">Connexion</h1>
          <p className="text-sm text-gray-400 text-center mb-6">Accédez à votre tableau de bord</p>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-2.5 mb-4 flex items-center gap-2">
              <X size={14} className="text-red-500 shrink-0" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm bg-white/60 focus:bg-white focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all duration-150"
                  placeholder="exemple@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm bg-white/60 focus:bg-white focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all duration-150"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-2.5 rounded-xl font-medium text-sm hover:from-emerald-700 hover:to-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-lg shadow-emerald-200 active:scale-[0.98]"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Nova Chatbot &copy; {new Date().getFullYear()} &mdash; Solution SaaS
        </p>
      </div>
    </div>
  );
}
