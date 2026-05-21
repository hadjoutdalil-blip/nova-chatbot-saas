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

  function scoreClass(score?: number) {
    if (score == null) return "";
    return score > 70 ? "green" : score > 40 ? "orange" : "red";
  }

  const SparkleIcon = ({ size = 13 }: { size?: number }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }}>
      <path d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z" />
    </svg>
  );

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "system-ui,-apple-system,sans-serif" }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`, color: "#fff", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,.18)", border: "2px solid rgba(255,255,255,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0, position: "relative" }}
          className={aiMode ? "ai-avatar" : ""}>
          {logo ? <img src={logo} alt="" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover" }} /> : <SparkleIcon size={17} />}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>{name}</div>
          <div style={{ fontSize: 11, opacity: 0.85 }}>Assistant virtuel</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
          <button
            onClick={() => setAiMode(!aiMode)}
            style={{
              width: 34, height: 34, borderRadius: 8,
              background: aiMode ? "rgba(168,85,247,.4)" : "rgba(255,255,255,.1)",
              border: "none", color: "#fff", fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s",
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

      {/* Status bar */}
      <div style={{ padding: "7px 14px", fontSize: 11, color: "#6b7280", borderBottom: "1px solid #e5e7eb", background: "#fcfcfe", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexShrink: 0 }}>
        {aiMode && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "linear-gradient(90deg,#7c3aed,#9333ea)", color: "#fff", padding: "2px 9px", borderRadius: 12, fontSize: 10, fontWeight: 600 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 10, height: 10 }}>
              <path d="M12 2a4 4 0 0 1 4 4c0 1.1-.4 2.1-1 2.8V12l-3 3-3-3V8.8A4 4 0 0 1 12 2z" />
              <path d="M8 14v3l4 4 4-4v-3" />
            </svg>
            IA Active
          </span>
        )}
        <span style={{ color: aiMode ? "#6b7280" : "#6b7280" }}>Base de connaissances</span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "18px 16px", display: "flex", flexDirection: "column", gap: 12, background: "#f4f7fb" }}>
        {messages.map((m, i) => (
          m.role === "user" ? (
            <div key={i} style={{ maxWidth: "84%", alignSelf: "flex-end", animation: "nr .28s ease" }}>
              <div style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
                color: "#fff", padding: "12px 15px", borderRadius: "18px 18px 4px 18px",
                fontSize: 13.5, lineHeight: 1.6, boxShadow: `0 3px 10px ${primaryColor}33`,
              }}>{m.text}</div>
            </div>
          ) : (
            <div key={i} style={{ display: "flex", gap: 9, maxWidth: "92%", animation: "nl .28s ease" }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: aiMode || m.source === "ai" ? "linear-gradient(135deg,#7c3aed,#9333ea)" : `linear-gradient(135deg,${primaryColor},#4a90d9)`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#fff", flexShrink: 0, marginTop: 2,
              }}>
                <SparkleIcon size={13} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  background: "#fff", border: "1px solid #e5e7eb", padding: "12px 15px",
                  borderRadius: "18px 18px 18px 4px", fontSize: 13.5, lineHeight: 1.72,
                  color: "#0d1b2a", boxShadow: "0 1px 6px rgba(0,0,0,.05)",
                  borderLeft: aiMode || m.source === "ai" ? "3px solid #7c3aed" : "none",
                  backgroundImage: aiMode || m.source === "ai" ? "linear-gradient(135deg,#fff,#f5f3ff)" : "none",
                }}>
                  {m.text}
                </div>
                {m.source && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
                    {m.source === "kb" && m.score != null && (
                      <span style={{
                        fontSize: 10.5, fontWeight: 600, padding: "1px 6px", borderRadius: 4, lineHeight: 1.4,
                        ...(scoreClass(m.score) === "green" ? { background: "#d1fae5", color: "#065f46" } :
                            scoreClass(m.score) === "orange" ? { background: "#fef3c7", color: "#92400e" } :
                            { background: "#fee2e2", color: "#991b1b" })
                      }}>
                        ✓ {m.score}%
                      </span>
                    )}
                    <span style={{ fontSize: 10.5, color: m.source === "ai" ? "#7c3aed" : "#6b7280", fontWeight: m.source === "ai" ? 500 : 400 }}>
                      {m.source === "kb" ? "Base de connaissances" : m.source === "ai" ? (m.provider ? `Propulsé par ${m.provider}` : "IA") : "Fallback"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 9, maxWidth: "92%", animation: "nl .2s ease" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: aiMode ? "linear-gradient(135deg,#7c3aed,#9333ea)" : `linear-gradient(135deg,${primaryColor},#4a90d9)`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#fff", flexShrink: 0, marginTop: 2,
            }}>
              <SparkleIcon size={13} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", padding: "14px 16px", borderRadius: "18px 18px 18px 4px" }}>
                <div style={{ fontSize: 11, color: "#7c3aed", marginBottom: 6 }}>Réflexion en cours</div>
                <div style={{ display: "flex", gap: 5 }}>
                  {[0, 1, 2].map((j) => (
                    <span key={j} style={{
                      width: 7, height: 7, borderRadius: "50%", background: "#d1d5db",
                      animation: "nb .8s infinite ease-in-out",
                      animationDelay: `${j * 0.16}s`,
                    }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ borderTop: "1px solid #e5e7eb", padding: 14, background: "#fff", flexShrink: 0 }}>
        <div style={{
          display: "flex", alignItems: "flex-end", gap: 9,
          background: "#f4f7fb", border: "2px solid #e5e7eb",
          borderRadius: 18, padding: "5px 5px 5px 14px",
          transition: "all .2s",
        }}
          className={`chat-input-wrap ${aiMode ? "ai-focus" : ""}`}
        >
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 90) + "px";
            }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder="Posez votre question..."
            disabled={loading}
            rows={1}
            style={{ flex: 1, border: "none", outline: "none", fontSize: 14, background: "transparent", color: "#0d1b2a", resize: "none", minHeight: 38, maxHeight: 96, fontFamily: "inherit", lineHeight: 1.5, padding: "7px 0" }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            style={{
              width: 38, height: 38, borderRadius: 12, border: "none",
              background: aiMode ? "#7c3aed" : primaryColor,
              color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, opacity: loading || !input.trim() ? 0.45 : 1,
              transition: "all .14s",
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
        .chat-input-wrap:focus-within {
          border-color: ${aiMode ? "#7c3aed" : primaryColor} !important;
          box-shadow: 0 0 0 4px ${aiMode ? "rgba(124,58,237,.18)" : `${primaryColor}15`} !important;
        }
        .ai-avatar::after {
          content: '';
          position: absolute;
          bottom: 2px; right: 2px;
          width: 11px; height: 11px;
          background: #a855f7;
          border-radius: 50%;
          border: 2px solid ${primaryColor};
          animation: ai-dot 2s infinite;
        }
        @keyframes ai-dot {
          0%,100% { box-shadow: 0 0 0 0 rgba(168,85,247,.7); }
          50% { box-shadow: 0 0 0 5px rgba(168,85,247,0); }
        }
        @keyframes nb {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-9px); }
        }
        @keyframes nr {
          from { opacity: 0; transform: translateX(16px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes nl {
          from { opacity: 0; transform: translateX(-16px); }
          to { opacity: 1; transform: translateX(0); }
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
