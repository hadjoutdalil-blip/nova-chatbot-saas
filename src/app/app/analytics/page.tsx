"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Chart from "chart.js/auto";

type AnalyticsData = {
  client: { id: string; name: string; slug: string; kbCount: number };
  kpi: { sessions: number; fcr: number; csat: number; conversion: number; resolvedCount: number; convertedCount: number };
  charts: {
    evolution: { date: string; sessions: number; fcr: number }[];
    weeklyResolution: { week: string; resolved: number; escalated: number; abandoned: number }[];
    categories: { id: string; count: number }[];
    topFallback: { label: string; count: number }[];
    feedbackEvolution: { week: string; positif: number; negatif: number; aucun: number }[];
    funnel: Record<string, number>;
  };
  heatmap: Record<string, Record<number, number>>;
  totals: { total: number; messagesAvg: number; fallback: number; feedbackPos: number; feedbackNeg: number };
};

const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const FUNNEL_STAGES = [
  { id: "widget_opened", label: "Widget ouvert", color: "#1a56db" },
  { id: "message_sent", label: "Message envoyé", color: "#3b82f6" },
  { id: "intent_recognized", label: "Intent reconnu", color: "#d97706" },
  { id: "resolved", label: "Problème résolu", color: "#059669" },
  { id: "satisfied", label: "Client satisfait", color: "#10b981" },
];

const CATEGORY_LABELS: Record<string, string> = {
  devis: "Demande de devis",
  support: "Support technique",
  info: "Information produit",
  reclamation: "Réclamation",
  autre: "Autre",
};

const CATEGORY_COLORS: Record<string, string> = {
  devis: "#1a56db",
  support: "#059669",
  info: "#d97706",
  reclamation: "#dc2626",
  autre: "#9ca3af",
};

const PALETTE = [
  "#1a56db", "#059669", "#d97706", "#dc2626", "#7c3aed",
  "#0891b2", "#be123c", "#4f46e5", "#b45309", "#0d9488",
  "#9333ea", "#0284c7", "#15803d", "#e11d48", "#6366f1",
  "#0e7490", "#a21caf", "#ca8a04", "#65a30d", "#db2777",
];

function getCategoryColor(id: string, index: number): string {
  return CATEGORY_COLORS[id] || PALETTE[index % PALETTE.length];
}

const METRIC_INFO: Record<string, { title: string; tag: string; tagCls: string; desc: string; good: string; medium: string; bad: string; improve: string }> = {
  sessions: {
    title: "Sessions", tag: "Engagement", tagCls: "bg-blue-100 text-blue-700",
    desc: "Une session correspond à une interaction complète entre un visiteur et le chatbot, du premier message à la fin de l'échange.",
    good: "> 200/jour", medium: "50-200/jour", bad: "< 50/jour",
    improve: "Placez le widget sur toutes les pages, utilisez des invites contextuelles, et activez le bouton flottant bien visible.",
  },
  fcr: {
    title: "Taux de résolution (FCR)", tag: "Qualité", tagCls: "bg-green-100 text-green-700",
    desc: "Pourcentage de demandes résolues directement par le chatbot, sans escalade humaine et sans abandon.",
    good: "> 75%", medium: "50-75%", bad: "< 50%",
    improve: "Enrichissez la base de connaissances avec les questions fréquentes, ajoutez des variantes de formulation, analysez les escalades.",
  },
  csat: {
    title: "CSAT (Satisfaction client)", tag: "Satisfaction", tagCls: "bg-amber-100 text-amber-700",
    desc: "Note moyenne de satisfaction sur 5, calculée à partir des feedbacks laissés après chaque interaction.",
    good: "> 4.5", medium: "3.5-4.5", bad: "< 3.5",
    improve: "Personnalisez le ton des réponses, proposez un transfert humain après 2 échecs, ajoutez de la chaleur dans les messages.",
  },
  conversion: {
    title: "Taux de conversion", tag: "Métier", tagCls: "bg-emerald-100 text-emerald-700",
    desc: "Pourcentage de sessions qui aboutissent à une demande de contact commercial (devis, appel, rendez-vous).",
    good: "> 10%", medium: "5-10%", bad: "< 5%",
    improve: "Proposez proactivement un devis, ajoutez un bouton 'Être rappelé', facilitez la prise de contact en fin de session.",
  },
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"today" | "7d" | "30d">("30d");
  const [infoMetric, setInfoMetric] = useState<string | null>(null);
  const [filteredData, setFilteredData] = useState<AnalyticsData | null>(null);

  const chartEvolutionRef = useRef<HTMLCanvasElement>(null);
  const chartResolutionRef = useRef<HTMLCanvasElement>(null);
  const chartCategoriesRef = useRef<HTMLCanvasElement>(null);
  const chartFallbackRef = useRef<HTMLCanvasElement>(null);
  const chartFeedbackRef = useRef<HTMLCanvasElement>(null);
  const chartInstances = useRef<Chart[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`/api/analytics?days=30`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { setData(d); setFilteredData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!data) return;
    const sessionsPerDay = data.charts.evolution.length;
    let cutoff = 30;
    if (period === "today") cutoff = 1;
    else if (period === "7d") cutoff = 7;
    setFilteredData({
      ...data,
      charts: {
        ...data.charts,
        evolution: data.charts.evolution.slice(-cutoff),
        weeklyResolution: data.charts.weeklyResolution.slice(-Math.max(1, Math.ceil(cutoff / 7))),
        feedbackEvolution: data.charts.feedbackEvolution.slice(-Math.max(1, Math.ceil(cutoff / 7))),
      },
    });
  }, [period, data]);

  const destroyCharts = useCallback(() => {
    chartInstances.current.forEach((c) => c.destroy());
    chartInstances.current = [];
  }, []);

  useEffect(() => {
    if (!filteredData) return;
    destroyCharts();

    const evo = document.getElementById("chartEvolution") as HTMLCanvasElement;
    const reso = document.getElementById("chartResolution") as HTMLCanvasElement;
    const cat = document.getElementById("chartCategories") as HTMLCanvasElement;
    const fall = document.getElementById("chartFallback") as HTMLCanvasElement;
    const feed = document.getElementById("chartFeedback") as HTMLCanvasElement;
    if (!evo || !reso || !cat || !fall || !feed) return;

    const instances: Chart[] = [];

    try {
      const c1 = new Chart(evo, {
        type: "line",
        data: {
          labels: filteredData.charts.evolution.map((d) => { const p = d.date.split("-"); return p[2] + "/" + p[1]; }),
          datasets: [
            { label: "Sessions", data: filteredData.charts.evolution.map((d) => d.sessions), borderColor: "#1a56db", backgroundColor: "rgba(26,86,219,.08)", fill: true, tension: .35, pointRadius: 3, pointHoverRadius: 6, yAxisID: "y" },
            { label: "FCR %", data: filteredData.charts.evolution.map((d) => d.fcr), borderColor: "#059669", backgroundColor: "rgba(5,150,105,.08)", fill: true, tension: .35, borderDash: [5, 3], pointRadius: 2, pointHoverRadius: 5, yAxisID: "y1" },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: true,
          interaction: { mode: "index", intersect: false },
          plugins: { legend: { position: "top", labels: { boxWidth: 14, padding: 14, font: { size: 11 } } } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: "rgba(0,0,0,.04)" }, title: { display: true, text: "Sessions" } },
            y1: { beginAtZero: true, max: 100, position: "right", ticks: { font: { size: 10 }, callback: (v) => v + "%" }, grid: { display: false }, title: { display: true, text: "Taux résolution" } },
            x: { ticks: { font: { size: 9 }, maxTicksLimit: period === "30d" ? 15 : period === "7d" ? 7 : 5 }, grid: { display: false } },
          },
        },
      });
      instances.push(c1);
    } catch { /* */ }

    try {
      const wr = filteredData.charts.weeklyResolution;
      const wLabels = wr.map((w) => w.week);
      const c2 = new Chart(reso, {
        type: "bar",
        data: {
          labels: wLabels,
          datasets: [
            { label: "Résolu", data: wr.map((w) => w.resolved), backgroundColor: "#059669", borderRadius: 4 },
            { label: "Escaladé", data: wr.map((w) => w.escalated), backgroundColor: "#d97706", borderRadius: 4 },
            { label: "Abandonné", data: wr.map((w) => w.abandoned), backgroundColor: "#dc2626", borderRadius: 4 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: true,
          plugins: { legend: { position: "top", labels: { boxWidth: 12, padding: 12, font: { size: 11 } } }, tooltip: { callbacks: { label: (ctx) => ctx.dataset.label + ": " + ctx.raw + "%" } } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10 } } },
            y: { beginAtZero: true, max: 100, ticks: { font: { size: 10 }, callback: (v) => v + "%" }, grid: { color: "rgba(0,0,0,.04)" } },
          },
        },
      });
      instances.push(c2);
    } catch { /* */ }

    try {
      const cats = filteredData.charts.categories;
      const catLabels = cats.map((c) => CATEGORY_LABELS[c.id] || c.id);
      const catData = cats.map((c) => c.count);
      const catColors = cats.map((c, i) => getCategoryColor(c.id, i));
      const totalSessions = filteredData.kpi.sessions || 1;
      const c3 = new Chart(cat, {
        type: "doughnut",
        data: {
          labels: catLabels,
          datasets: [{ data: catData, backgroundColor: catColors, borderWidth: 2, borderColor: "#fff" }],
        },
        options: {
          responsive: true, maintainAspectRatio: true, cutout: "60%",
          plugins: {
            legend: { position: "right", labels: { boxWidth: 12, padding: 10, font: { size: 11 } } },
            tooltip: { callbacks: { label: (ctx) => ctx.label + ": " + (ctx.raw as number) + " (" + Math.round((ctx.raw as number) / totalSessions * 100) + "%)" } },
          },
        },
      });
      instances.push(c3);
    } catch { /* */ }

    try {
      const fb = filteredData.charts.topFallback;
      const fbLabels = fb.length > 0 ? fb.map((f) => f.label) : ["Aucun"];
      const fbData = fb.length > 0 ? fb.map((f) => f.count) : [0];
      const fbColors = ["#dc2626", "#ea580c", "#d97706", "#ca8a04", "#65a30d"];
      const c4 = new Chart(fall, {
        type: "bar",
        data: {
          labels: fbLabels,
          datasets: [{ label: "Nombre de fois", data: fbData, backgroundColor: fbColors.slice(0, fbLabels.length), borderRadius: 4 }],
        },
        options: {
          responsive: true, maintainAspectRatio: true, indexAxis: "y",
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ctx.raw + " fois" } } },
          scales: {
            x: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: "rgba(0,0,0,.04)" } },
            y: { ticks: { font: { size: 10 } }, grid: { display: false } },
          },
        },
      });
      instances.push(c4);
    } catch { /* */ }

    try {
      const fe = filteredData.charts.feedbackEvolution;
      const feLabels = fe.map((f) => f.week);
      const c5 = new Chart(feed, {
        type: "bar",
        data: {
          labels: feLabels,
          datasets: [
            { label: "Positif", data: fe.map((f) => f.positif), backgroundColor: "#059669", borderRadius: 4 },
            { label: "Négatif", data: fe.map((f) => f.negatif), backgroundColor: "#dc2626", borderRadius: 4 },
            { label: "Sans avis", data: fe.map((f) => f.aucun), backgroundColor: "#d1d5db", borderRadius: 4 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: true,
          plugins: { legend: { position: "top", labels: { boxWidth: 12, padding: 12, font: { size: 11 } } } },
          scales: {
            x: { stacked: true, grid: { display: false }, ticks: { font: { size: 10 } } },
            y: { stacked: true, beginAtZero: true, ticks: { font: { size: 10 } }, grid: { color: "rgba(0,0,0,.04)" } },
          },
        },
      });
      instances.push(c5);
    } catch { /* */ }

    chartInstances.current = instances;

    return () => { instances.forEach((c) => c.destroy()); };
  }, [filteredData, period, destroyCharts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!filteredData) {
    return <p className="text-gray-500">Impossible de charger les statistiques.</p>;
  }

  const { kpi, charts, heatmap, totals } = filteredData;
  const kpiItems = [
    { key: "sessions", label: "Sessions", value: kpi.sessions, fmt: (v: number) => v.toString(), sub: `${totals.total} session${totals.total > 1 ? "s" : ""}`, badge: "Engagement", badgeCls: "bg-blue-100 text-blue-700", icon: "💬" },
    { key: "fcr", label: "Taux résolution (FCR)", value: kpi.fcr, fmt: (v: number) => v + "%", sub: `${kpi.resolvedCount} résolue${kpi.resolvedCount > 1 ? "s" : ""}`, badge: "Qualité", badgeCls: "bg-green-100 text-green-700", icon: "✅" },
    { key: "csat", label: "CSAT moyen", value: kpi.csat, fmt: (v: number) => v.toFixed(1) + "/5", sub: `Basé sur ${totals.total} sessions`, badge: "Satisfaction", badgeCls: "bg-amber-100 text-amber-700", icon: "⭐" },
    { key: "conversion", label: "Taux conversion", value: kpi.conversion, fmt: (v: number) => v + "%", sub: `${kpi.convertedCount} conversion${kpi.convertedCount > 1 ? "s" : ""}`, badge: "Métier", badgeCls: "bg-emerald-100 text-emerald-700", icon: "📈" },
  ];

  const funnelTotal = charts.funnel["widget_opened"] || 1;
  const funnelItems = FUNNEL_STAGES.map((stage, i) => {
    const count = charts.funnel[stage.id] || 0;
    const pct = Math.round(count / funnelTotal * 100);
    const prevCount = i > 0 ? (charts.funnel[FUNNEL_STAGES[i - 1].id] || 0) : funnelTotal;
    const drop = i > 0 ? Math.round((1 - count / prevCount) * 100) : 0;
    return { ...stage, count, pct, drop };
  });

  let heatmapMax = 0;
  for (const d of DAYS) {
    for (let h = 0; h < 24; h++) {
      if ((heatmap[d]?.[h] || 0) > heatmapMax) heatmapMax = heatmap[d]?.[h] || 0;
    }
  }
  heatmapMax = Math.max(heatmapMax, 1);

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statistiques</h1>
          <p className="text-gray-500 text-sm">
            Analyse des performances — {filteredData.client.name}
          </p>
        </div>
        <div className="flex gap-2">
          {(["today", "7d", "30d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                period === p
                  ? "bg-emerald-600 text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-emerald-300"
              }`}
            >
              {p === "today" ? "Aujourd'hui" : p === "7d" ? "7 jours" : "30 jours"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {kpiItems.map((item) => (
          <div key={item.key} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-1">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base" style={{ background: "var(--bg)", color: "var(--clr)" }}>
                {item.icon}
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.badgeCls}`}>{item.badge}</span>
            </div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-2">
              {item.label}
              <button
                className="ml-1 text-gray-300 hover:text-emerald-600 align-text-top text-sm"
                onClick={() => setInfoMetric(item.key)}
              >ⓘ</button>
            </p>
            <p className="text-3xl font-extrabold text-gray-900 mt-0.5">{item.fmt(item.value)}</p>
            <p className="text-xs text-gray-400 mt-1">{item.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-5">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-1">
          📈 Évolution des sessions
          <button className="text-gray-300 hover:text-emerald-600 text-sm" onClick={() => setInfoMetric("sessions")}>ⓘ</button>
        </h3>
        <p className="text-xs text-gray-400 mb-3">Nombre de sessions par jour et taux de résolution (FCR)</p>
        <canvas id="chartEvolution" ref={chartEvolutionRef} style={{ maxHeight: 280 }} />
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5 max-lg:grid-cols-1">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-1">
            📊 Résolution vs escalade vs abandon
            <button className="text-gray-300 hover:text-emerald-600 text-sm" onClick={() => setInfoMetric("fcr")}>ⓘ</button>
          </h3>
          <p className="text-xs text-gray-400 mb-3">Répartition des issues par semaine</p>
          <canvas id="chartResolution" ref={chartResolutionRef} style={{ maxHeight: 260 }} />
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-1">
            🧩 Catégories de demandes
            <button className="text-gray-300 hover:text-emerald-600 text-sm" onClick={() => setInfoMetric("csat")}>ⓘ</button>
          </h3>
          <p className="text-xs text-gray-400 mb-3">Répartition des sujets traités</p>
          <canvas id="chartCategories" ref={chartCategoriesRef} style={{ maxHeight: 260 }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5 max-lg:grid-cols-1">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-1">
            🔍 Top 5 intents non reconnus
            <button className="text-gray-300 hover:text-emerald-600 text-sm" onClick={() => setInfoMetric("fcr")}>ⓘ</button>
          </h3>
          <p className="text-xs text-gray-400 mb-3">Demandes que le chatbot n&apos;a pas su comprendre</p>
          <canvas id="chartFallback" ref={chartFallbackRef} style={{ maxHeight: 260 }} />
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-1">
            ⭐ Évolution des feedbacks
            <button className="text-gray-300 hover:text-emerald-600 text-sm" onClick={() => setInfoMetric("csat")}>ⓘ</button>
          </h3>
          <p className="text-xs text-gray-400 mb-3">Avis positifs, négatifs et sans avis par semaine</p>
          <canvas id="chartFeedback" ref={chartFeedbackRef} style={{ maxHeight: 260 }} />
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-5">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-1">
          🥾 Entonnoir du parcours utilisateur
          <button className="text-gray-300 hover:text-emerald-600 text-sm" onClick={() => setInfoMetric("conversion")}>ⓘ</button>
        </h3>
        <p className="text-xs text-gray-400 mb-4">Taux de passage à chaque étape — visualisez où les clients décrochent</p>
        <div className="flex flex-col gap-2">
          {funnelItems.map((item, i) => (
            <div key={item.id} className="flex items-center gap-3">
              <span className="text-xs font-medium text-gray-600 w-36 text-right shrink-0 max-sm:w-24">{item.label}</span>
              <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                <div
                  className="h-full rounded-lg flex items-center px-3 text-xs font-bold text-white transition-all duration-700"
                  style={{ width: Math.max(item.pct, 3) + "%", background: item.color }}
                >
                  {item.count} session{item.count > 1 ? "s" : ""}
                </div>
              </div>
              <span className="text-xs font-semibold text-gray-500 w-10 shrink-0">{item.pct}%</span>
              {item.drop > 0 && <span className="text-xs text-red-500 w-14 shrink-0">-{item.drop}% ↘</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-1">
          🕐 Heatmap des heures de pic
          <button className="text-gray-300 hover:text-emerald-600 text-sm">ⓘ</button>
        </h3>
        <p className="text-xs text-gray-400 mb-3">Intensité d&apos;utilisation par jour de la semaine et heure</p>
        <div className="overflow-x-auto">
          <div className="grid gap-0.5 text-xs" style={{ gridTemplateColumns: "40px repeat(24, 1fr)", minWidth: 680 }}>
            <div />
            {HOURS.map((h) => (
              <div key={h} className="text-center font-semibold text-gray-400 py-0.5 text-[9px]">{h}h</div>
            ))}
            {DAYS.map((day) => (
              <>
                <div key={`l-${day}`} className="flex items-center justify-end pr-1.5 font-semibold text-gray-500 h-7">{day}</div>
                {HOURS.map((hour) => {
                  const val = heatmap[day]?.[hour] || 0;
                  const intensity = val / heatmapMax;
                  const r = Math.round(220 - intensity * 170);
                  const g = Math.round(245 - intensity * 150);
                  const b = Math.round(245 - intensity * 180);
                  const bg = val > 0 ? `rgb(${r},${g},${b})` : "#f3f4f6";
                  return (
                    <div
                      key={`${day}-${hour}`}
                      className="h-7 rounded flex items-center justify-center text-[9px] font-semibold text-gray-600 cursor-pointer transition-transform hover:scale-125 hover:z-10 hover:shadow-md"
                      style={{ background: bg }}
                      title={`${day} ${hour}h — ${val} session${val > 1 ? "s" : ""}`}
                    >
                      {val > 0 ? val : ""}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 justify-end mt-2 text-xs text-gray-500">
          <span>Faible</span>
          <span className="w-3.5 h-3.5 rounded" style={{ background: "rgb(220,245,245)" }} />
          <span className="w-3.5 h-3.5 rounded" style={{ background: "rgb(170,220,220)" }} />
          <span className="w-3.5 h-3.5 rounded" style={{ background: "rgb(100,180,180)" }} />
          <span className="w-3.5 h-3.5 rounded" style={{ background: "rgb(50,150,150)" }} />
          <span className="w-3.5 h-3.5 rounded" style={{ background: "rgb(20,110,110)" }} />
          <span>Élevé</span>
        </div>
      </div>

      {infoMetric && METRIC_INFO[infoMetric] && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setInfoMetric(null)} />
          <div className="fixed top-0 right-0 w-96 h-full bg-white shadow-2xl z-50 overflow-y-auto p-6 animate-slide-in max-sm:w-full">
            <button className="float-right text-gray-400 hover:text-gray-600 text-xl" onClick={() => setInfoMetric(null)}>✕</button>
            <div className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-3 ${METRIC_INFO[infoMetric].tagCls}`}>{METRIC_INFO[infoMetric].tag}</div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">{METRIC_INFO[infoMetric].title}</h2>
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-700 mb-1">🔍 Ce que ça mesure</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{METRIC_INFO[infoMetric].desc}</p>
            </div>
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-700 mb-1">📊 Benchmark</h3>
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p><strong className="text-green-700">✅ Bon :</strong> {METRIC_INFO[infoMetric].good}</p>
                <p><strong className="text-amber-700">⚠️ Moyen :</strong> {METRIC_INFO[infoMetric].medium}</p>
                <p><strong className="text-red-700">❌ À améliorer :</strong> {METRIC_INFO[infoMetric].bad}</p>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-700 mb-1">💡 Comment améliorer</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{METRIC_INFO[infoMetric].improve}</p>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slide-in { animation: slideIn .3s cubic-bezier(.4,0,.2,1); }
      `}</style>
    </div>
  );
}
