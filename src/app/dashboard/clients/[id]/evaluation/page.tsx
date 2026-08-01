"use client";

import { Fragment, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BarChart3, TrendingUp, TrendingDown, MessageSquare, FileSearch, Download, ChevronDown, ChevronUp } from "lucide-react";

interface TraceStep {
  step: string;
  ms: number;
  [key: string]: any;
}

interface RecentItem {
  id: string;
  question: string;
  response: string;
  score: number;
  source: string;
  provider: string;
  createdAt: string;
  trace?: TraceStep[];
}

interface EvalData {
  total: number;
  rated: number;
  auto: number;
  avgScore: number;
  minScore: number;
  maxScore: number;
  distribution: Record<string, number>;
  sourceDistribution: Record<string, number>;
  lowScoreQuestions: { question: string; response: string; score: number; source: string; createdAt: string }[];
  recent: RecentItem[];
}

const TRACE_LABELS: Record<string, string> = {
  intent_regex: "Intention (regex)",
  intent_ai_override: "Intention (IA)",
  kb_match: "Recherche KB",
  rag_search: "Recherche documentaire (RAG)",
  rag_only_search: "Recherche documentaire (RAG only)",
  ai_response: "Réponse IA",
  direct_response: "Réponse directe",
  escalade: "Escalade IA",
};

function TraceScenario({ trace }: { trace: TraceStep[] }) {
  const totalMs = Math.max(...trace.map((s) => s.ms), 0);
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/70 p-2">
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
        Scénario suivi ({totalMs}ms)
      </div>
      <ol className="space-y-1">
        {trace.map((s, ti) => (
          <li key={ti} className="text-[11px] text-gray-600 flex items-start gap-1.5">
            <span className="text-gray-300 font-mono shrink-0">{s.ms}ms</span>
            <span className="font-medium shrink-0">{TRACE_LABELS[s.step] || s.step}</span>
            <span className="text-gray-400 truncate">
              {s.step === "kb_match" && `score=${s.score}, seuil=${s.kbThreshold}${s.matchedQuestion ? ` → "${s.matchedQuestion.slice(0, 40)}"` : ""}`}
              {s.step === "intent_regex" && s.intent}
              {s.step === "intent_ai_override" && s.intent}
              {(s.step === "rag_search" || s.step === "rag_only_search") && `${s.chunks} chunk${s.chunks > 1 ? "s" : ""}${s.vector ? ` (vectoriel: ${s.vector})` : ""}${s.keyword ? ` (keyword: ${s.keyword})` : ""}`}
              {s.step === "ai_response" && `model=${s.model || ""} (${s.chars || 0} car.)`}
              {s.step === "direct_response" && (s.source || "")}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function EvaluationPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<EvalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch(`/api/evaluation/${id}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  const exportCsv = () => {
    window.open(`/api/evaluation/${id}?format=csv`, "_blank");
  };

  if (loading) return <div className="p-8 text-gray-400">Chargement...</div>;
  if (!data) return <div className="p-8 text-red-500">Erreur de chargement</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-emerald-600" /> Évaluation des réponses
      </h1>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <MessageSquare className="w-4 h-4" /> Total Q&amp;A
          </div>
          <div className="text-2xl font-bold">{data.auto}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <TrendingUp className="w-4 h-4 text-green-600" /> Score moyen
          </div>
          <div className="text-2xl font-bold">{data.avgScore}%</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-600" /> Meilleur score
          </div>
          <div className="text-2xl font-bold">{data.maxScore}%</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <TrendingDown className="w-4 h-4 text-red-600" /> Pire score
          </div>
          <div className="text-2xl font-bold">{data.minScore}%</div>
        </div>
      </div>

      {/* Distribution */}
      <div className="bg-white rounded-xl border p-4">
        <h2 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-1">
          <BarChart3 className="w-4 h-4" /> Distribution des scores
        </h2>
        <div className="flex items-end gap-1 h-28">
          {Object.entries(data.distribution).map(([label, count]) => {
            const max = Math.max(...Object.values(data.distribution), 1);
            const pct = (count / max) * 100;
            const color =
              parseInt(label) >= 80 ? "bg-green-500" :
              parseInt(label) >= 50 ? "bg-yellow-500" : "bg-red-500";
            return (
              <div key={label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-500">{count as number}</span>
                <div className="w-full bg-gray-100 rounded-t" style={{ height: 140 }}>
                  <div className={`${color} rounded-t transition-all`} style={{ height: `${pct}%`, width: "100%" }} />
                </div>
                <span className="text-[10px] text-gray-400">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Source distribution */}
      <div className="bg-white rounded-xl border p-4">
        <h2 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-1">
          <FileSearch className="w-4 h-4" /> Répartition par source
        </h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(data.sourceDistribution).map(([src, count]) => (
            <span key={src} className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
              {src}: {count as number}
            </span>
          ))}
        </div>
      </div>

      {/* Low score questions */}
      {data.lowScoreQuestions.length > 0 && (
        <div className="bg-white rounded-xl border p-4">
          <h2 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-1">
            <TrendingDown className="w-4 h-4 text-red-500" /> Questions à faible score (&lt;50%)
          </h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.lowScoreQuestions.map((q, i) => (
              <div key={i} className="p-2 bg-red-50 rounded text-sm">
                <div className="font-medium text-red-800">Q: {q.question}</div>
                <div className="text-red-600 text-xs mt-0.5">R: {q.response}...</div>
                <div className="text-xs text-gray-500 mt-0.5">Score: {q.score}% | Source: {q.source}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Q&A table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-600">Dernières questions</span>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Exporter CSV
          </button>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left p-2">Question</th>
                <th className="text-left p-2">Réponse</th>
                <th className="text-center p-2 w-16">Score</th>
                <th className="text-center p-2 w-20">Source</th>
                <th className="text-center p-2 w-24">Scénario</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.map((r) => (
                <Fragment key={r.id}>
                  <tr key={r.id} className="border-t hover:bg-gray-50">
                    <td className="p-2 max-w-[200px] truncate font-medium">{r.question}</td>
                    <td className="p-2 max-w-[300px] truncate text-gray-600">
                      {r.response.replace(/\*\*/g, "").replace(/\n/g, " ")}
                    </td>
                    <td className="p-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        r.score >= 80 ? "bg-green-100 text-green-700" :
                        r.score >= 50 ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>{r.score}%</span>
                    </td>
                    <td className="p-2 text-center text-xs text-gray-500">{r.source}</td>
                    <td className="p-2 text-center">
                      {r.trace && r.trace.length > 0 ? (
                        <button
                          onClick={() => setExpanded((e) => ({ ...e, [r.id]: !e[r.id] }))}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          Voir
                          {expanded[r.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                  {expanded[r.id] && r.trace && (
                    <tr key={`${r.id}-trace`} className="border-t bg-gray-50/50">
                      <td colSpan={5} className="p-2">
                        <TraceScenario trace={r.trace} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
