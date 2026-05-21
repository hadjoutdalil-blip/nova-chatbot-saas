"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

function WidgetLoader({ slug }: { slug: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = document.createElement("script");
    el.src = `/api/widget/${slug}/embed?t=${Date.now()}`;
    el.async = true;
    ref.current?.appendChild(el);
    return () => { el.remove(); };
  }, [slug]);

  return <div ref={ref} />;
}

function ChatTest({ slug, primaryColor, name, logo }: { slug: string; primaryColor: string; name: string; logo?: string }) {
  const [messages, setMessages] = useState<{ text: string; role: string; source?: string; score?: number; provider?: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiMode, setAiMode] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { text, role: "user" }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history, aiMode }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { text: data.response, role: "bot", source: data.source, score: data.score, provider: data.provider }]);
      setHistory((prev) => [...prev, { role: "user", content: text }, { role: "assistant", content: data.response }].slice(-20));
    } catch {
      setMessages((prev) => [...prev, { text: "Je n'ai pas trouvé de réponse. Contactez-nous pour plus d'informations.", role: "bot", source: "fallback" }]);
    }
    setLoading(false);
  }

  function scoreColor(score?: number) {
    if (score == null) return "";
    return score > 70 ? "green" : score > 40 ? "orange" : "red";
  }

  function scoreLabel(score?: number) {
    if (score == null) return "";
    return score > 70 ? "green" : score > 40 ? "orange" : "red";
  }

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "system-ui,-apple-system,sans-serif" }}>
      {/* Header */}
      <div style={{ background: primaryColor, color: "#fff", padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>
          {logo ? <img src={logo} alt="" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover" }} /> : "🤖"}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{name}</div>
          <div style={{ fontSize: 11, opacity: 0.85 }}>Assistant virtuel</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
          <button
            onClick={() => setAiMode(!aiMode)}
            style={{
              width: 30, height: 30, borderRadius: 8,
              background: aiMode ? "rgba(255,255,255,.22)" : "rgba(0,0,0,.12)",
              border: aiMode ? `1px solid rgba(255,255,255,.5)` : "1px solid rgba(255,255,255,.15)",
              boxShadow: aiMode ? `0 0 12px rgba(255,255,255,.2)` : "none",
              color: "#fff", fontSize: 14, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", transition: "all .2s",
            }}
            title={aiMode ? "Mode IA actif" : "Mode IA désactivé"}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}>
              <path d="M12 2a4 4 0 0 1 4 4c0 1.1-.4 2.1-1 2.8V12l-3 3-3-3V8.8A4 4 0 0 1 12 2z" />
              <path d="M8 14v3l4 4 4-4v-3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10, background: "#f8f9fc" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ maxWidth: "82%", alignSelf: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              padding: "10px 14px", fontSize: 13.5, lineHeight: 1.5, wordWrap: "break-word",
              background: m.role === "user" ? primaryColor : "#fff",
              color: m.role === "user" ? "#fff" : "#1f2937",
              borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              boxShadow: m.role === "user" ? "none" : "0 1px 4px rgba(0,0,0,.06)",
            }}>
              {m.text}
            </div>
            {m.role === "bot" && m.source && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                {m.source === "kb" && m.score != null && (
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4, lineHeight: 1.4,
                    ...(scoreLabel(m.score) === "green" ? { background: "#d1fae5", color: "#065f46" } :
                        scoreLabel(m.score) === "orange" ? { background: "#fef3c7", color: "#92400e" } :
                        { background: "#fee2e2", color: "#991b1b" })
                  }}>
                    ✓ {m.score}%
                  </span>
                )}
                <span style={{ fontSize: 10, color: "#6b7280" }}>
                  {m.source === "kb" ? "Base de connaissances" : m.source === "ai" ? (m.provider ? `Propulsé par ${m.provider}` : "IA") : "Fallback"}
                </span>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ maxWidth: "82%", alignSelf: "flex-start" }}>
            <div style={{ background: "#fff", padding: "14px 18px", borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,.06)", display: "flex", gap: 4 }}>
              {[0, 1, 2].map((j) => (
                <span key={j} style={{
                  width: 7, height: 7, borderRadius: "50%", background: "#9ca3af",
                  animation: "nb 1s ease-in-out infinite",
                  animationDelay: `${j * 0.15}s`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ borderTop: "1px solid #e5e7eb", padding: "10px 12px 12px", background: "#fff", flexShrink: 0 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#f3f4f6", borderRadius: 12, padding: "4px 4px 4px 14px",
          border: `1px solid transparent`, transition: "all .2s",
        }}
          className="chat-input-ring"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") sendMessage(input); }}
            placeholder="Posez votre question..."
            disabled={loading}
            style={{ flex: 1, border: "none", outline: "none", fontSize: 13, background: "transparent", color: "#1f2937", padding: "6px 0", minWidth: 0 }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            style={{
              width: 34, height: 34, borderRadius: 10, border: "none",
              background: primaryColor, color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, opacity: loading || !input.trim() ? 0.5 : 1,
              transition: "all .15s",
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        .chat-input-ring:focus-within {
          border-color: ${primaryColor} !important;
          background: #fff !important;
          box-shadow: 0 0 0 3px ${primaryColor}1a !important;
        }
        @keyframes nb {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}

export default function ClientTestPage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<any>(null);
  const [slug, setSlug] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) return;
    fetch(`/api/clients/${id}`, { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((c) => { setClient(c); setSlug(c.slug); });
  }, [id]);

  if (!client) return <p className="text-gray-500 p-8">Chargement...</p>;

  const primaryColor = client.primaryColor || "#7c3aed";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/clients/${id}`} className="text-gray-400 hover:text-gray-600 text-sm">&larr; {client.name}</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold">Test & Aperçu</h1>
      </div>

      {/* Generic landing page preview */}
      <div className="rounded-xl overflow-hidden border shadow-sm bg-white">
        <div className="border-b" style={{ borderColor: `${primaryColor}20` }}>
          <div className="flex items-center justify-between px-6 py-3" style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)` }}>
            <div className="flex items-center gap-3">
              {client.logo ? (
                <img src={client.logo} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-white/50" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm">🤖</div>
              )}
              <span className="text-white font-semibold text-sm">{client.name}</span>
            </div>
            <div className="flex gap-4 text-xs text-white/80">
              <span>Accueil</span>
              <span>Services</span>
              <span>Contact</span>
            </div>
          </div>

          <div className="px-6 py-12 text-center" style={{ background: `linear-gradient(180deg, ${primaryColor}08 0%, transparent 100%)` }}>
            <h2 className="text-2xl font-bold mb-2" style={{ color: primaryColor }}>Bienvenue chez {client.name}</h2>
            <p className="text-gray-500 max-w-lg mx-auto text-sm">Nous sommes là pour vous accompagner. Notre assistant virtuel est disponible 24h/24 pour répondre à vos questions.</p>
          </div>

          <div className="grid grid-cols-3 gap-4 px-6 pb-8">
            {["Service client", "Support technique", "Information"].map((title, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-2xl mb-2">{[ "💬", "🔧", "ℹ️" ][i]}</div>
                <h3 className="font-medium text-sm mb-1">{title}</h3>
                <p className="text-xs text-gray-400">Description du service proposé par {client.name}.</p>
              </div>
            ))}
          </div>

          <div className="border-t px-6 py-4 text-center text-xs text-gray-400" style={{ borderColor: `${primaryColor}10` }}>
            &copy; 2026 {client.name}. Propulsé par Nova Chatbot
          </div>
        </div>
      </div>

      {/* Chat test + widget preview side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col" style={{ minHeight: 520 }}>
          <div className="px-5 pt-4 pb-2 border-b bg-gray-50/50">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-base">Test du chat</h2>
              <span className="text-xs text-gray-400">Endpoint: <code className="text-purple-600">/api/chat/{slug}</code></span>
            </div>
          </div>
          <div className="flex-1 flex flex-col" style={{ height: 470 }}>
            {slug && <ChatTest slug={slug} primaryColor={primaryColor} name={client.name} logo={client.logo} />}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border">
          <h2 className="font-semibold text-base mb-3">Aperçu widget</h2>
          <p className="text-xs text-gray-400 mb-4">Le widget s&apos;affiche en bas à droite de cette page.</p>
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center" style={{ background: `${primaryColor}20` }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2" className="w-7 h-7">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 mt-3">Le chatbot est prêt</p>
            <p className="text-xs text-gray-400 mt-1">Cliquez sur l&apos;icône en bas à droite</p>
          </div>
          <div className="mt-3 flex justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
              Redimensionnable
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              Réinitialisable
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <path d="M12 2a4 4 0 0 1 4 4c0 1.1-.4 2.1-1 2.8V12l-3 3-3-3V8.8A4 4 0 0 1 12 2z" />
                <path d="M8 14v3l4 4 4-4v-3" />
              </svg>
              Mode IA
            </span>
          </div>
          <div className="mt-3 text-xs text-gray-400 text-center">
            Script: <code className="text-purple-600">/api/widget/{slug}/embed</code>
          </div>
        </div>
      </div>

      {slug && <WidgetLoader slug={slug} />}
    </div>
  );
}
