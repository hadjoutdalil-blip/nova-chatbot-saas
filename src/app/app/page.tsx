"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, MessageCircle, CheckCircle, ArrowRight, Brain, Cpu, Gauge, Database } from "lucide-react";

export default function AppDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ kb: 0 });
  const [tokenUsage, setTokenUsage] = useState<any[]>([]);
  const [totals, setTotals] = useState({ totalUsed: 0, totalLimit: 0, totalPct: 0, month: "" });
  const [embedUsage, setEmbedUsage] = useState<{ totalCalls: number; byProvider: Record<string, { calls: number; label: string }>; keys: any[] } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("/api/kb", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setStats({ kb: data.length }))
      .catch(() => {});
    fetch("/api/ai-usage/totals", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        setTokenUsage(data.providers || []);
        setTotals({ totalUsed: data.totalUsed || 0, totalLimit: data.totalLimit || 0, totalPct: data.totalPct || 0, month: data.month || "" });
      })
      .catch(() => {});
    fetch("/api/embedding-usage", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setEmbedUsage)
      .catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Mon tableau de bord</h1>
      <p className="text-gray-500 mb-8">Bienvenue sur votre espace client.</p>

      <div className="grid grid-cols-3 gap-5 mb-8">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-elevated">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <BookOpen size={20} />
            </div>
          </div>
          <p className="text-sm text-gray-500">Entrées KB</p>
          <p className="text-3xl font-bold text-gray-900">{stats.kb}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-elevated">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <MessageCircle size={20} />
            </div>
          </div>
          <p className="text-sm text-gray-500">Conversations</p>
          <p className="text-3xl font-bold text-gray-900">0</p>
        </div>
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-elevated">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
              <CheckCircle size={20} />
            </div>
          </div>
          <p className="text-sm text-gray-500">Statut du chatbot</p>
          <p className="text-3xl font-bold text-green-500">Actif</p>
        </div>
      </div>

      {/* Token Usage per Provider/Model */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-elevated mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-emerald-600" />
            <h2 className="font-semibold text-gray-900">Consommation IA — {totals.month}</h2>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Gauge size={16} className={totals.totalPct >= 80 ? "text-red-500" : totals.totalPct >= 50 ? "text-amber-500" : "text-green-500"} />
            <span className="text-gray-500">
              {totals.totalPct}% utilisé
              <span className="text-gray-400 ml-1">({(totals.totalUsed / 1000).toFixed(0)}K / {(totals.totalLimit / 1000).toFixed(0)}K tokens)</span>
            </span>
          </div>
        </div>

        {tokenUsage.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Aucune consommation pour le moment.</p>
        ) : (
          <div className="space-y-4">
            {tokenUsage.map((u) => (
              <div key={`${u.provider}:${u.model}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      u.provider === "groq" ? "bg-orange-50 text-orange-700" :
                      u.provider === "cerebras" ? "bg-blue-50 text-blue-700" :
                      "bg-gray-50 text-gray-700"
                    }`}>
                      <Cpu size={11} /> {u.provider}
                    </span>
                    <span className="text-sm font-medium text-gray-700">{u.model}</span>
                    <span className="text-xs text-gray-400">{u.calls} appel{u.calls > 1 ? "s" : ""}</span>
                  </div>
                  <span className={`text-xs font-semibold ${
                    u.pct >= 80 ? "text-red-600" : u.pct >= 50 ? "text-amber-600" : "text-green-600"
                  }`}>
                    {u.pct}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      u.pct >= 80 ? "bg-red-500" : u.pct >= 50 ? "bg-amber-500" : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(u.pct, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-0.5">
                  <span className="text-[11px] text-gray-400">
                    {u.used >= 1000000 ? (u.used / 1000000).toFixed(1) + "M" : (u.used >= 1000 ? (u.used / 1000).toFixed(0) + "K" : u.used)} utilisés
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {u.remaining >= 1000000 ? (u.remaining / 1000000).toFixed(1) + "M" : (u.remaining >= 1000 ? (u.remaining / 1000).toFixed(0) + "K" : u.remaining)} restants
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Embedding Usage */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-elevated mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database size={18} className="text-purple-600" />
            <h2 className="font-semibold text-gray-900">Consommation Embedding</h2>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">{embedUsage?.totalCalls ?? 0} appel{(embedUsage?.totalCalls ?? 0) !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {!embedUsage || embedUsage.keys.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Aucune consommation pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {embedUsage.keys.map((k) => (
              <div key={k.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                    {k.provider}
                  </span>
                  <span className="text-sm text-gray-700">{k.label}</span>
                  {!k.isActive && <span className="text-xs text-gray-400">(désactivée)</span>}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{k.usageCount} appel{k.usageCount !== 1 ? "s" : ""}</span>
                  {k.lastUsedAt && <span>Dernier : {new Date(k.lastUsedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
      <div className="grid grid-cols-2 gap-5">
        <button onClick={() => router.push("/app/kb")} className="group bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-left hover:shadow-lg transition-all hover:-translate-y-0.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-emerald-200">
            <BookOpen size={22} />
          </div>
          <p className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">Gérer ma base de connaissances</p>
          <p className="text-sm text-gray-400 mt-1">Ajoutez et modifiez les questions/réponses de votre chatbot.</p>
          <div className="flex items-center gap-1 mt-3 text-sm font-medium text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
            Accéder <ArrowRight size={14} />
          </div>
        </button>
        <button onClick={() => router.push("/app/widget")} className="group bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-left hover:shadow-lg transition-all hover:-translate-y-0.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-200">
            <MessageCircle size={22} />
          </div>
          <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Personnaliser mon widget</p>
          <p className="text-sm text-gray-400 mt-1">Modifiez l&apos;apparence et le code d&apos;intégration.</p>
          <div className="flex items-center gap-1 mt-3 text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
            Accéder <ArrowRight size={14} />
          </div>
        </button>
      </div>
    </div>
  );
}
