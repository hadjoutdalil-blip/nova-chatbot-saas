"use client";

import { useEffect, useState } from "react";
import { Database, BookOpen, AlertTriangle, HelpCircle, TrendingUp } from "lucide-react";

interface StatsData {
  total: number;
  bySource: Record<string, number>;
  summary: { rag: number; kb: number; escalade: number; fallback: number; intent: number };
  ragPercent: number;
  daily: Record<string, Record<string, number>>;
}

const SOURCE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  rag: { bg: "bg-emerald-500", text: "text-emerald-600", label: "RAG (Vectoriel)" },
  kb: { bg: "bg-blue-500", text: "text-blue-600", label: "KB (Base connaissances)" },
  qa: { bg: "bg-purple-500", text: "text-purple-600", label: "KB + IA (Reformulation)" },
  escalade: { bg: "bg-orange-500", text: "text-orange-600", label: "Escalade" },
  fallback: { bg: "bg-gray-400", text: "text-gray-600", label: "Fallback" },
  small_talk: { bg: "bg-pink-500", text: "text-pink-600", label: "Small talk" },
  hors_sujet: { bg: "bg-red-400", text: "text-red-600", label: "Hors sujet" },
  avis: { bg: "bg-yellow-500", text: "text-yellow-600", label: "Avis" },
};

function getBarColor(source: string) {
  return SOURCE_COLORS[source] || { bg: "bg-gray-400", text: "text-gray-600", label: source };
}

interface Props {
  clientId: string;
  token: () => string;
}

export default function RAGStatsTab({ clientId, token }: Props) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  function loadStats() {
    setLoading(true);
    const params = new URLSearchParams({ clientId, days: String(days) });
    fetch(`/api/conversations/stats?${params}`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { loadStats(); }, [clientId, days]);

  if (loading) {
    return <div className="flex items-center justify-center py-12"><p className="text-gray-400 text-sm">Chargement des statistiques...</p></div>;
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
          <TrendingUp size={24} className="text-gray-400" />
        </div>
        <p className="text-gray-400 text-sm">Aucune réponse enregistrée pour cette période.</p>
      </div>
    );
  }

  const allSources = Object.entries(stats.bySource).sort((a, b) => b[1] - a[1]);
  const dailyDays = Object.keys(stats.daily).sort();

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Période :</span>
        {[7, 15, 30, 90].map(d => (
          <button key={d} onClick={() => setDays(d)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${days === d ? "bg-emerald-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {d}j
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 font-medium mb-1">Réponses totales</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100">
          <p className="text-xs text-gray-400 font-medium mb-1">Via base vectorielle</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.summary.rag}</p>
          <p className="text-xs text-emerald-500 mt-0.5">{stats.ragPercent}% du total</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
          <p className="text-xs text-gray-400 font-medium mb-1">Via KB</p>
          <p className="text-2xl font-bold text-blue-600">{stats.summary.kb}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-100">
          <p className="text-xs text-gray-400 font-medium mb-1">Escalades</p>
          <p className="text-2xl font-bold text-orange-600">{stats.summary.escalade}</p>
        </div>
      </div>

      {/* RAG % bar */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={16} className="text-emerald-600" />
          <h2 className="font-semibold text-sm">Répartition des sources de réponse</h2>
        </div>

        {/* Main bar */}
        <div className="h-8 rounded-full overflow-hidden flex bg-gray-100 mb-4">
          {allSources.map(([src, count]) => {
            const pct = (count / stats.total) * 100;
            if (pct < 1) return null;
            const c = getBarColor(src);
            return (
              <div key={src} className={`${c.bg} h-full transition-all duration-500 relative group cursor-default`}
                style={{ width: `${pct}%` }}
                title={`${c.label}: ${count} (${Math.round(pct)}%)`}>
                {pct > 8 && <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">{Math.round(pct)}%</span>}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {allSources.map(([src, count]) => {
            const c = getBarColor(src);
            return (
              <div key={src} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${c.bg} shrink-0`} />
                <span className="text-sm text-gray-600">{c.label}</span>
                <span className="text-sm font-semibold text-gray-900 ml-auto">{count}</span>
                <span className="text-xs text-gray-400">{Math.round((count / stats.total) * 100)}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily timeline */}
      {dailyDays.length > 1 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Database size={16} className="text-emerald-600" />
            <h2 className="font-semibold text-sm">Évolution quotidienne</h2>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Header */}
              <div className="flex items-end gap-0.5 mb-2">
                {dailyDays.map(day => {
                  const dayTotal = Object.values(stats.daily[day]).reduce((a, b) => a + b, 0);
                  return (
                    <div key={day} className="flex-1 text-center">
                      <span className="text-[10px] text-gray-400">{day.slice(5)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Bars */}
              <div className="flex items-end gap-0.5" style={{ height: "120px" }}>
                {dailyDays.map(day => {
                  const dayData = stats.daily[day];
                  const dayTotal = Object.values(dayData).reduce((a, b) => a + b, 0);
                  const maxDay = Math.max(...dailyDays.map(d => Object.values(stats.daily[d]).reduce((a, b) => a + b, 0)));
                  const h = maxDay > 0 ? (dayTotal / maxDay) * 100 : 0;

                  return (
                    <div key={day} className="flex-1 flex flex-col-reverse" style={{ height: "100%" }}>
                      <div className="flex gap-px rounded-t" style={{ height: `${h}%` }}>
                        {Object.entries(dayData).sort((a, b) => b[1] - a[1]).map(([src, count]) => {
                          const c = getBarColor(src);
                          return (
                            <div key={src} className={`${c.bg} flex-1 min-w-[2px]`}
                              title={`${c.label}: ${count}`} />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail table */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-sm mb-3">Détail par source</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="pb-2 font-medium">Source</th>
              <th className="pb-2 font-medium text-right">Nombre</th>
              <th className="pb-2 font-medium text-right">Pourcentage</th>
              <th className="pb-2 font-medium">Barre</th>
            </tr>
          </thead>
          <tbody>
            {allSources.map(([src, count]) => {
              const c = getBarColor(src);
              const pct = Math.round((count / stats.total) * 100);
              return (
                <tr key={src} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${c.bg}`} />
                      <span className="text-gray-700 font-medium">{c.label}</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4 text-right font-semibold text-gray-900">{count}</td>
                  <td className="py-2.5 pr-4 text-right text-gray-500">{pct}%</td>
                  <td className="py-2.5">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden" style={{ maxWidth: "200px" }}>
                      <div className={`h-full rounded-full ${c.bg}`} style={{ width: `${pct}%` }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
