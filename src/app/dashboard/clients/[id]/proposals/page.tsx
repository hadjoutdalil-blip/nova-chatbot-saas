"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  MessageSquare, CheckCircle2, XCircle, Clock, Download,
  BookOpen, Star, RefreshCw, ExternalLink, Trash2,
} from "lucide-react";

interface Proposal {
  id: string;
  question: string;
  answer: string;
  theme: string;
  confidence: number;
  status: string;
  submitter: string;
  createdAt: string;
}

export default function AdminProposalsPage() {
  const { id } = useParams<{ id: string }>();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [stats, setStats] = useState<any>({});
  const [themes, setThemes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [themeFilter, setThemeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [editProposal, setEditProposal] = useState<Proposal | null>(null);
  const [editAnswer, setEditAnswer] = useState("");
  const [editConf, setEditConf] = useState(0);

  const token = () => localStorage.getItem("token");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${id}/proposals`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      setProposals(data.proposals);
      setStats(data.stats);
      setThemes(data.themes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const updateProposal = async (proposalId: string, data: any) => {
    await fetch(`/api/clients/${id}/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ action: "update", proposalId, ...data }),
    });
    fetchData();
  };

  const convertToKb = async (proposalId: string) => {
    const res = await fetch(`/api/clients/${id}/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ action: "convert-to-kb", proposalId }),
    });
    if (res.ok) fetchData();
  };

  const filtered = useMemo(() => {
    return proposals.filter((p) => {
      if (themeFilter && p.theme !== themeFilter) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      if (search && !p.question.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [proposals, themeFilter, statusFilter, search]);

  const exportData = () => {
    const csv = [
      ["Question", "Réponse", "Thème", "Confiance", "Statut", "Soumetteur", "Date"].join(","),
      ...proposals.map((p) =>
        [`"${p.question.replace(/"/g, '""')}"`, `"${p.answer.replace(/"/g, '""')}"`, p.theme, p.confidence, p.status, p.submitter, p.createdAt].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `propositions-${id}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-8 text-gray-400 text-center">Chargement...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-emerald-600" /> Propositions
        </h1>
        <div className="flex gap-2">
          <button onClick={fetchData}
            className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 transition">
            <RefreshCw size={14} /> Actualiser
          </button>
          <button onClick={exportData}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
            <Download size={14} /> Exporter CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} icon={<MessageSquare size={18} />} />
        <StatCard label="En attente" value={stats.pending} icon={<Clock size={18} />} color="amber" />
        <StatCard label="Avec réponse" value={stats.answered} icon={<CheckCircle2 size={18} />} color="emerald" />
        <StatCard label="Approuvées" value={stats.approved} icon={<Star size={18} />} color="blue" />
      </div>

      {stats.themeCounts && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(stats.themeCounts as Record<string, number>).map(([theme, count]) => (
            <div key={theme} className="bg-white border rounded-lg px-4 py-3 text-sm">
              <span className="text-gray-500">{theme}</span>
              <span className="ml-2 font-semibold">{count as number}</span>
            </div>
          ))}
        </div>
      )}

      {editProposal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setEditProposal(null)}>
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-3">Modifier la proposition</h3>
            <p className="text-sm text-gray-600 mb-4">{editProposal.question}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Réponse</label>
                <textarea value={editAnswer} onChange={(e) => setEditAnswer(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Confiance</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} type="button" onClick={() => setEditConf(s)}
                      className={`text-2xl ${s <= editConf ? "text-yellow-400" : "text-gray-200"} hover:text-yellow-400 transition`}>
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setEditProposal(null)}
                  className="px-4 py-1.5 text-sm border rounded-lg hover:bg-gray-50">Annuler</button>
                <button onClick={async () => {
                  await updateProposal(editProposal.id, { answer: editAnswer, confidence: editConf });
                  setEditProposal(null);
                }}
                  className="px-4 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher..." className="border rounded-lg px-3 py-1.5 text-sm flex-1 min-w-[200px]" />
        <select value={themeFilter} onChange={(e) => setThemeFilter(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm">
          <option value="">Tous les thèmes</option>
          {themes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm">
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="approved">Approuvé</option>
          <option value="rejected">Rejeté</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Aucune proposition</p>
        ) : (
          filtered.map((p) => (
            <div key={p.id} className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{p.question}</p>
                  {p.submitter && <p className="text-xs text-gray-400 mt-0.5">— {p.submitter}</p>}
                  {p.theme && <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-xs rounded-full text-gray-600">{p.theme}</span>}
                  {p.answer && (
                    <div className="mt-2 bg-gray-50 rounded-lg p-3 text-sm text-gray-700">{p.answer}</div>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                    {p.confidence > 0 && (
                      <span className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span key={s} className={s <= p.confidence ? "text-yellow-400" : "text-gray-200"}>★</span>
                        ))}
                      </span>
                    )}
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                      p.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                      p.status === "rejected" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {p.status === "pending" ? "En attente" : p.status === "approved" ? "Approuvé" : "Rejeté"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  {p.status !== "approved" && (
                    <button onClick={() => updateProposal(p.id, { status: "approved" })}
                      className="flex items-center gap-1 px-3 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition">
                      <CheckCircle2 size={12} /> Approuver
                    </button>
                  )}
                  {p.answer && p.status !== "approved" && (
                    <button onClick={() => convertToKb(p.id)}
                      className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition">
                      <BookOpen size={12} /> Convertir en KB
                    </button>
                  )}
                  <button onClick={() => {
                    setEditProposal(p);
                    setEditAnswer(p.answer);
                    setEditConf(p.confidence);
                  }}
                    className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition">
                    <ExternalLink size={12} /> Modifier
                  </button>
                  {p.status !== "rejected" && (
                    <button onClick={() => updateProposal(p.id, { status: "rejected" })}
                      className="flex items-center gap-1 px-3 py-1 text-xs bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition">
                      <XCircle size={12} /> Rejeter
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color = "gray" }: { label: string; value: number; icon: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    gray: "bg-gray-50 border-gray-200",
    amber: "bg-amber-50 border-amber-200",
    emerald: "bg-emerald-50 border-emerald-200",
    blue: "bg-blue-50 border-blue-200",
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color] || colors.gray}`}>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">{icon} {label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
