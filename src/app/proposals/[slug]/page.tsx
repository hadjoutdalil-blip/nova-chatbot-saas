"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

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

export default function ProposalsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [client, setClient] = useState<{ name: string; logo: string; primaryColor: string } | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [themes, setThemes] = useState<string[]>([]);
  const [themeFilter, setThemeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [ans, setAns] = useState("");
  const [conf, setConf] = useState(0);
  const [submitter, setSubmitter] = useState("");
  const [selTheme, setSelTheme] = useState("");
  const [customTheme, setCustomTheme] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [answering, setAnswering] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/proposals/${slug}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setClient(data.client);
      setProposals(data.proposals);
      setThemes(data.themes);
    } catch {
      setClient(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg("");
    if (!question.trim()) return;
    try {
      const res = await fetch(`/api/proposals/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), answer: ans.trim(), theme: selTheme === "__other__" ? customTheme.trim() : selTheme, submitter: submitter.trim() }),
      });
      if (!res.ok) throw new Error("Erreur");
      const data = await res.json();
      setProposals((prev) => [data.proposal, ...prev]);
      setQuestion("");
      setAns("");
      setConf(0);
      setSelTheme("");
      setCustomTheme("");
      setStatusMsg("Proposition envoyée !");
    } catch {
      setStatusMsg("Erreur lors de l'envoi.");
    }
  };

  const filtered = themeFilter ? proposals.filter((p) => p.theme === themeFilter) : proposals;
  const grouped = filtered.reduce<Record<string, Proposal[]>>((acc, p) => {
    const t = p.theme || "Sans thème";
    if (!acc[t]) acc[t] = [];
    acc[t].push(p);
    return acc;
  }, {});

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>;
  if (!client) return <div className="p-8 text-center text-gray-500">Client introuvable.</div>;

  return (
    <div style={{ "--primary": client.primaryColor } as React.CSSProperties}>
      <div style={{ background: `linear-gradient(135deg, ${client.primaryColor}, ${client.primaryColor}dd)` }} className="p-6 text-white">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          {client.logo && <img src={client.logo} alt="" className="w-10 h-10 rounded-full object-cover" />}
          <div>
            <h1 className="text-xl font-bold">{client.name}</h1>
            <p className="text-sm opacity-80">Proposez vos questions et suggestions</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-8">
        {statusMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{statusMsg}</div>
        )}

        <section className="bg-white border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Soumettre une proposition</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question *</label>
              <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thème</label>
                <select value={selTheme} onChange={(e) => setSelTheme(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2">
                  <option value="">Sélectionner un thème</option>
                  {themes.map((t) => <option key={t} value={t}>{t}</option>)}
                  <option value="__other__">Autre (saisir ci-dessous)</option>
                </select>
                {selTheme === "__other__" && (
                  <input value={customTheme} onChange={(e) => setCustomTheme(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm mt-2 focus:outline-none focus:ring-2"
                    placeholder="Nouveau thème..." required />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Votre nom (optionnel)</label>
                <input value={submitter} onChange={(e) => setSubmitter(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  placeholder="Anonyme" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Réponse proposée (optionnelle)</label>
              <textarea value={ans} onChange={(e) => setAns(e.target.value)} rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
                placeholder="Si vous connaissez la réponse, proposez-la ici" />
            </div>
            <button type="submit"
              className="px-6 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 transition"
              style={{ background: client.primaryColor }}>
              Envoyer la proposition
            </button>
          </form>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Propositions ({filtered.length})</h2>
            <select value={themeFilter} onChange={(e) => setThemeFilter(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm">
              <option value="">Tous les thèmes</option>
              {themes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {Object.entries(grouped).length === 0 ? (
            <p className="text-gray-400 text-center py-8">Aucune proposition pour le moment.</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([theme, items]) => (
                <div key={theme}>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{theme}</h3>
                  <div className="space-y-3">
                    {items.map((p) => (
                      <div key={p.id} className="bg-white border rounded-xl p-4 shadow-sm">
                        <p className="font-medium text-sm">{p.question}</p>
                        {p.submitter && <p className="text-xs text-gray-400 mt-0.5">— {p.submitter}</p>}
                        {p.answer ? (
                          <div className="mt-2 bg-gray-50 rounded-lg p-3 text-sm">
                            <p className="text-gray-700">{p.answer}</p>
                            {p.confidence > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-xs text-gray-400">Confiance :</span>
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <span key={star}
                                      className={`text-sm ${star <= p.confidence ? "text-yellow-400" : "text-gray-200"}`}>
                                      ★
                                    </span>
        ))}</div></div>)}
                          </div>
                        ) : answering === p.id ? (
                          <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (!ans.trim()) return;
                            try {
                              const res = await fetch(`/api/proposals/${slug}`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ question: p.question, answer: ans.trim(), theme: p.theme, confidence: conf }),
                              });
                              if (res.ok) { fetchData(); setAnswering(null); setAns(""); setConf(0); }
                            } catch {}
                          }} className="mt-2 space-y-2">
                            <textarea value={ans} onChange={(e) => setAns(e.target.value)} rows={2}
                              className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Votre réponse..." required />
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Confiance :</span>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button key={star} type="button" onClick={() => setConf(star)}
                                  className={`text-lg ${star <= conf ? "text-yellow-400" : "text-gray-200"} hover:text-yellow-400 transition`}>
                                  ★
                                </button>))}
                              <button type="submit"
                                className="ml-2 px-4 py-1 text-white text-sm rounded-lg hover:opacity-90 transition"
                                style={{ background: client.primaryColor }}>
                                Répondre
                              </button>
                              <button type="button" onClick={() => setAnswering(null)}
                                className="text-xs text-gray-400 hover:text-gray-600">Annuler</button>
                            </div>
                          </form>
                        ) : (
                          <button onClick={() => { setAnswering(p.id); setAns(""); setConf(0); }}
                            className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition">
                            + Proposer une réponse
                          </button>
                        )}
                        <p className="text-xs text-gray-300 mt-1">{new Date(p.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
