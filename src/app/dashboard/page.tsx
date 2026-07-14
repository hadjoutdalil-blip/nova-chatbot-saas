"use client";

import { useEffect, useState } from "react";
import { BookOpen, MessageCircle, Users, Brain, Cpu, Building2, Trophy } from "lucide-react";

const PLAN_LABELS: Record<string, string> = {
  ecommerce: "E-commerce",
  support: "Support Client",
  realestate: "Immobilier",
  custom: "Sur Mesure",
};

const PLAN_COLORS: Record<string, string> = {
  ecommerce: "bg-emerald-100 text-emerald-700",
  support: "bg-indigo-100 text-indigo-700",
  realestate: "bg-blue-100 text-blue-700",
  custom: "bg-gray-100 text-gray-600",
};

export default function DashboardPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [usage, setUsage] = useState<any[]>([]);
  const [byClient, setByClient] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("/api/clients", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setClients(data));
    fetch("/api/ai-usage", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        setUsage(data.byProvider || []);
        setByClient(data.byClient || []);
      });
  }, []);

  const totalConversations = byClient.reduce((s, c) => s + (c.conversations || 0), 0);
  const totalTokens = byClient.reduce((s, c) => s + (c.totalTokens || 0), 0);
  const totalKb = byClient.reduce((s, c) => s + (c.kbCount || 0), 0);

  const planCounts: Record<string, number> = {};
  for (const c of clients) {
    planCounts[c.plan] = (planCounts[c.plan] || 0) + 1;
  }

  const topClients = [...byClient].sort((a, b) => (b.conversations || 0) - (a.conversations || 0)).slice(0, 10);

  const statCards = [
    { label: "Clients", value: String(clients.length), icon: Building2, color: "from-emerald-500 to-emerald-400" },
    { label: "Conversations", value: String(totalConversations), icon: MessageCircle, color: "from-blue-500 to-blue-400" },
    { label: "Entrées KB", value: String(totalKb), icon: BookOpen, color: "from-emerald-500 to-emerald-400" },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Vue d&apos;ensemble de votre plateforme</p>
      </div>

      <div className="grid grid-cols-3 gap-5 mb-6">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-card p-6 hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-sm`}>
                <Icon size={20} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-400 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Plan distribution */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={18} className="text-emerald-600" />
            <h2 className="font-semibold text-gray-900">Clients par pack</h2>
          </div>
          {Object.keys(planCounts).length === 0 ? (
            <p className="text-sm text-gray-400 italic">Aucun client</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(planCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([plan, count]) => (
                  <div key={plan} className="flex items-center justify-between">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PLAN_COLORS[plan] || PLAN_COLORS.custom}`}>
                      {PLAN_LABELS[plan] || plan}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${(count / clients.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Top clients */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={18} className="text-amber-500" />
            <h2 className="font-semibold text-gray-900">Top Clients</h2>
          </div>
          {topClients.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Aucune donnée</p>
          ) : (
            <div className="space-y-2">
              {topClients.map((c, i) => (
                <div key={c.clientId} className="flex items-center gap-3 py-1.5">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    i === 0 ? "bg-amber-100 text-amber-700" :
                    i === 1 ? "bg-gray-100 text-gray-600" :
                    i === 2 ? "bg-orange-100 text-orange-700" :
                    "bg-gray-50 text-gray-400"
                  }`}>
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900 flex-1 truncate">{c.clientName}</span>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{c.conversations} conv.</span>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{c.kbCount} KB</span>
                  <span className="text-xs font-semibold text-emerald-700 whitespace-nowrap w-20 text-right">{(c.totalTokens || 0).toLocaleString()} tok.</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
        <div className="flex items-center gap-2 mb-1">
          <Brain size={18} className="text-emerald-600" />
          <h2 className="font-semibold text-gray-900">Utilisation IA par fournisseur / modèle</h2>
        </div>
        <p className="text-sm text-gray-400 mb-4">{totalTokens.toLocaleString()} tokens consommés</p>

        {usage.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Aucune donnée d&apos;utilisation pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2.5 px-3 font-semibold text-gray-600">Fournisseur</th>
                  <th className="text-left py-2.5 px-3 font-semibold text-gray-600">Modèle</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-gray-600">Appels</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-gray-600">Tokens prompt</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-gray-600">Tokens complétion</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-gray-600">Total tokens</th>
                </tr>
              </thead>
              <tbody>
                {usage.map((u) => (
                  <tr key={`${u.provider}:${u.model}`} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full ${
                        u.provider === "groq" ? "bg-orange-50 text-orange-700" :
                        u.provider === "cerebras" ? "bg-blue-50 text-blue-700" :
                        "bg-gray-50 text-gray-700"
                      }`}>
                        <Cpu size={12} /> {u.provider}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-700 font-medium">{u.model}</td>
                    <td className="py-2.5 px-3 text-right text-gray-700">{u.calls}</td>
                    <td className="py-2.5 px-3 text-right text-gray-600">{u.promptTokens.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right text-gray-600">{u.completionTokens.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-gray-900">{u.totalTokens.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
