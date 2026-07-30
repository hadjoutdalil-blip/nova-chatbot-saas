"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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

interface GoogleUser {
  email: string;
  name: string;
  picture: string;
}

function GoogleLoginButton({ onSuccess }: { onSuccess: (user: GoogleUser) => void }) {
  const btnRef = useRef<HTMLDivElement>(null);
  const [gsiReady, setGsiReady] = useState(false);

  useEffect(() => {
    if ((window as any).google?.accounts) {
      setGsiReady(true);
      return;
    }
    const check = setInterval(() => {
      if ((window as any).google?.accounts) {
        setGsiReady(true);
        clearInterval(check);
      }
    }, 200);
    return () => clearInterval(check);
  }, []);

  useEffect(() => {
    if (!gsiReady || !btnRef.current) return;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;
    (window as any).google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response: any) => {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: response.credential }),
        });
        if (!res.ok) return;
        const user: GoogleUser = await res.json();
        localStorage.setItem("google_user", JSON.stringify(user));
        onSuccess(user);
      },
    });
    (window as any).google.accounts.id.renderButton(btnRef.current, {
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular",
    });
  }, [gsiReady, onSuccess]);

  return <div ref={btnRef} className="flex justify-center" />;
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
  const [selTheme, setSelTheme] = useState("");
  const [customTheme, setCustomTheme] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [answering, setAnswering] = useState<string | null>(null);
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [gsiLoaded, setGsiLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("google_user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
  }, []);

  useEffect(() => {
    if ((window as any).google?.accounts) {
      setGsiLoaded(true);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => setGsiLoaded(true);
    document.head.appendChild(s);
    return () => { s.remove(); };
  }, []);

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
        body: JSON.stringify({ question: question.trim(), answer: ans.trim(), theme: selTheme === "__other__" ? customTheme.trim() : selTheme, submitter: user?.email || "" }),
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

  const handleLogout = () => {
    localStorage.removeItem("google_user");
    setUser(null);
  };

  const filtered = themeFilter ? proposals.filter((p) => p.theme === themeFilter) : proposals;
  const grouped = filtered.reduce<Record<string, Proposal[]>>((acc, p) => {
    const t = p.theme || "Sans thème";
    if (!acc[t]) acc[t] = [];
    acc[t].push(p);
    return acc;
  }, {});

  if (loading) return <div className="p-8 text-center text-gray-600 font-medium">Chargement...</div>;
  if (!client) return <div className="p-8 text-center text-gray-600 font-medium">Client introuvable.</div>;

  const pc = client.primaryColor;

  return (
    <div className="min-h-screen bg-gray-50" style={{ "--primary": pc } as React.CSSProperties}>
      <div style={{ background: `linear-gradient(135deg, ${pc}, ${pc}dd)` }} className="p-5 sm:p-6 text-white">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-0 sm:justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            {client.logo && <img src={client.logo} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-white/30 flex-shrink-0" />}
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold">{client.name}</h1>
              <p className="text-xs sm:text-sm opacity-90">Proposez vos questions et suggestions</p>
            </div>
          </div>
          {user && (
            <div className="flex items-center gap-2 sm:gap-3 bg-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 self-start sm:self-auto">
              {user.picture && <img src={user.picture} alt="" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full ring-2 ring-white/40" />}
              <span className="text-xs sm:text-sm font-medium truncate max-w-[140px] sm:max-w-[200px]">{user.email}</span>
              <button onClick={handleLogout}
                className="text-xs font-semibold bg-white/20 hover:bg-white/35 px-2.5 py-1 rounded-lg transition flex-shrink-0">
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
        {statusMsg && (
          <div className="bg-green-100 border-2 border-green-400 text-green-800 font-semibold px-4 py-3 rounded-xl text-sm shadow-sm">{statusMsg}</div>
        )}

        {!user ? (
          <section className="bg-white border-2 border-gray-200 rounded-xl p-6 sm:p-8 shadow-md text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl" style={{ background: pc + "15" }}>
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke={pc} stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><circle cx="9" cy="10" r="1"/><circle cx="12" cy="10" r="1"/><circle cx="15" cy="10" r="1"/></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{client.name}</h2>
            <p className="text-sm text-gray-600 mb-5 leading-relaxed max-w-md mx-auto">
              Bienvenue sur l'espace propositions. Partagez vos questions et suggestions avec notre équipe.
              Ce service est propulsé par <strong>Nova Chat Platform</strong> — une solution chatbot développée par <strong>ESTIN NOVA TECH</strong> pour les entreprises, universités et institutions.
            </p>
            <div className="border-t border-gray-100 pt-5">
              <p className="text-sm font-semibold text-gray-800 mb-3">Connectez-vous avec votre compte Gmail pour soumettre une proposition</p>
              {gsiLoaded ? (
                <GoogleLoginButton onSuccess={setUser} />
              ) : (
                <p className="text-sm text-gray-600 font-medium">Chargement de Google Sign-In...</p>
              )}
            </div>
          </section>
        ) : (
          <section className="bg-white border-2 border-gray-200 rounded-xl p-5 sm:p-6 shadow-md">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-5">Soumettre une proposition</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1.5">Question <span className="text-red-600">*</span></label>
                <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={3}
                  className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition placeholder-gray-400"
                  required placeholder="Ex: Comment obtenir une copie conforme de mon diplôme ?" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1.5">Thème</label>
                  <select value={selTheme} onChange={(e) => setSelTheme(e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition bg-white">
                    <option value="">Sélectionner un thème</option>
                    {themes.map((t) => <option key={t} value={t}>{t}</option>)}
                    <option value="__other__">Autre (saisir ci-dessous)</option>
                  </select>
                  {selTheme === "__other__" && (
                    <input value={customTheme} onChange={(e) => setCustomTheme(e.target.value)}
                      className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-base mt-2 focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition"
                      placeholder="Nouveau thème..." required />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1.5">Votre email</label>
                  <input value={user.email} readOnly
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-base bg-gray-100 text-gray-700 font-medium cursor-not-allowed" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1.5">Réponse proposée <span className="text-gray-500 font-normal">(optionnelle)</span></label>
                <textarea value={ans} onChange={(e) => setAns(e.target.value)} rows={3}
                  className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition placeholder-gray-400"
                  placeholder="Si vous connaissez la réponse, proposez-la ici" />
              </div>
              <button type="submit"
                className="w-full sm:w-auto px-8 py-3.5 text-white rounded-xl text-base font-bold hover:brightness-110 active:brightness-95 transition shadow-lg shadow-[var(--primary)]/25"
                style={{ background: pc }}>
                Envoyer la proposition
              </button>
            </form>
          </section>
        )}

        {user && (
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Propositions ({filtered.length})</h2>
              <select value={themeFilter} onChange={(e) => setThemeFilter(e.target.value)}
                className="border-2 border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-[var(--primary)] bg-white">
                <option value="">Tous les thèmes</option>
                {themes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {Object.entries(grouped).length === 0 ? (
              <p className="text-gray-600 font-medium text-center py-10 bg-white border-2 border-gray-200 rounded-xl">Aucune proposition pour le moment.</p>
            ) : (
              <div className="space-y-6">
                {Object.entries(grouped).map(([theme, items]) => (
                  <div key={theme}>
                    <h3 className="text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider mb-2.5 px-1">{theme}</h3>
                    <div className="space-y-3">
                      {items.map((p) => (
                        <div key={p.id} className="bg-white border-2 border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm">
                          <p className="font-bold text-gray-900 text-sm sm:text-base">{p.question}</p>
                          {p.submitter && <p className="text-xs sm:text-sm text-gray-600 mt-1 font-medium">— {p.submitter}</p>}
                          {p.answer ? (
                            <div className="mt-3 bg-gray-100 border border-gray-200 rounded-xl p-3 sm:p-4 text-sm sm:text-base text-gray-800 leading-relaxed">
                              <p>{p.answer}</p>
                              {p.confidence > 0 && (
                                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-200">
                                  <span className="text-xs font-semibold text-gray-600">Confiance :</span>
                                  <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <span key={star}
                                        className={`text-base sm:text-lg ${star <= p.confidence ? "text-amber-500" : "text-gray-300"}`}>
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
                                  body: JSON.stringify({ question: p.question, answer: ans.trim(), theme: p.theme, confidence: conf, submitter: user.email }),
                                });
                                if (res.ok) { fetchData(); setAnswering(null); setAns(""); setConf(0); }
                              } catch {}
                            }} className="mt-3 space-y-3">
                              <textarea value={ans} onChange={(e) => setAns(e.target.value)} rows={3}
                                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition"
                                placeholder="Votre réponse..." required />
                              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs sm:text-sm font-semibold text-gray-700">Confiance :</span>
                                  <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button key={star} type="button" onClick={() => setConf(star)}
                                        className={`text-xl sm:text-2xl ${star <= conf ? "text-amber-500" : "text-gray-300"} hover:text-amber-400 transition`}>
                                        ★
                                      </button>))}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button type="submit"
                                    className="px-5 py-2 text-white text-sm font-bold rounded-xl hover:brightness-110 transition shadow-md"
                                    style={{ background: pc }}>
                                    Répondre
                                  </button>
                                  <button type="button" onClick={() => setAnswering(null)}
                                    className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl transition">
                                    Annuler
                                  </button>
                                </div>
                              </div>
                            </form>
                          ) : (
                            <button onClick={() => { setAnswering(p.id); setAns(""); setConf(0); }}
                              className="mt-2 text-sm font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl transition">
                              + Proposer une réponse
                            </button>
                          )}
                          <p className="text-xs text-gray-500 font-medium mt-2">{new Date(p.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      <footer className="text-center py-6 px-4 border-t border-gray-200 bg-white">
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          Propulsé par <strong>Nova Chat Platform</strong> — Développé par <strong>ESTIN NOVA TECH</strong>.
          Intégration chatbot pour sites web : entreprises nationales, universités, privé.
          Clients : ESTIN &amp; CETIM.
        </p>
      </footer>
    </div>
  );
}
