"use client";

import { useEffect, useState, useRef } from "react";

function ChatTest({ slug, primaryColor, name, logo }: { slug: string; primaryColor: string; name: string; logo?: string }) {
  const [messages, setMessages] = useState<{ text: string; role: string; source?: string; score?: number; provider?: string; messageId?: string; question?: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiMode, setAiMode] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || !navigator.onLine) {
      if (!navigator.onLine) {
        setMessages((prev) => [...prev, { text: "Vous êtes hors ligne. Veuillez vérifier votre connexion.", role: "bot", source: "fallback" }]);
      }
      return;
    }
    setMessages((prev) => [...prev, { text, role: "user" }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history, aiMode }),
      });
      if (res.status === 429) {
        setMessages((prev) => [...prev, { text: "Trop de requêtes. Veuillez patienter quelques secondes.", role: "bot", source: "fallback" }]);
        setLoading(false);
        return;
      }
      if (res.status >= 500) {
        setMessages((prev) => [...prev, { text: "Service temporairement indisponible. Veuillez réessayer.", role: "bot", source: "fallback" }]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setMessages((prev) => [...prev, { text: data.response, role: "bot", source: data.source, score: data.score, provider: data.provider, messageId: data.messageId, question: text }]);
      setHistory((prev) => [...prev, { role: "user", content: text }, { role: "assistant", content: data.response }].slice(-20));
    } catch {
      setMessages((prev) => [...prev, { text: "Je n'ai pas trouvé de réponse. Contactez-nous pour plus d'informations.", role: "bot", source: "fallback" }]);
    }
    setLoading(false);
  }

  async function submitFeedback(messageId: string, rating: number, question: string, response: string, source?: string, score?: number, provider?: string) {
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, messageId, rating, question, response, source, score, provider }),
      });
      setRatings((prev) => ({ ...prev, [messageId]: rating }));
    } catch (err) {
      console.error("Feedback error:", err);
    }
  }

  function scoreClass(score?: number) {
    if (score == null) return "";
    return score > 70 ? "green" : score > 40 ? "orange" : "red";
  }

  const BotDot = ({ size = 13 }: { size?: number }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }}>
      <circle cx="12" cy="12" r="8.5" />
    </svg>
  );

  const [online, setOnline] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  useEffect(() => {
    setOnline(navigator.onLine);
    const go = () => setOnline(true);
    const goff = () => setOnline(false);
    window.addEventListener("online", go);
    window.addEventListener("offline", goff);
    return () => { window.removeEventListener("online", go); window.removeEventListener("offline", goff); };
  }, []);

  function isValidUrl(s: string | undefined | null): boolean {
    return !!s && (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/"));
  }
  function renderMarkdown(t: string): string {
    if (!t) return "";
    let s = t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
    s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/\*(.+?)\*/g, "<em>$1</em>");
    s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    s = s.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    s = s.replace(/^## (.+)$/gm, "<h2>$1</h2>");
    s = s.replace(/^# (.+)$/gm, "<h1>$1</h1>");
    s = s.replace(/^[-*]\s+(.+)$/gm, "<li>$1</li>");
    s = s.replace(/(<li>.*<\/li>(\n|$))+/g, (m) => "<ul>" + m + "</ul>");
    s = s.replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>");
    s = s.replace(/^\|(.+)\|\n\|[-:| ]+\|\n((?:\|.+\|\n?)*)/gm, (_: string, headerRow: string, bodyRows: string) => {
      const headers = headerRow.split("|").map((h: string) => `<th>${h.trim()}</th>`).join("");
      const rows = bodyRows.trim().split("\n").map((row: string) => {
        const cells = row.replace(/^\||\|$/g, "").split("|").map((c: string) => `<td>${c.trim()}</td>`).join("");
        return `<tr>${cells}</tr>`;
      }).join("");
      return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
    });
    s = s.replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br>");
    if (!/^<[hup]/.test(s)) s = "<p>" + s + "</p>";
    return s;
  }

  function formatTime(): string {
    const d = new Date();
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }

  const CopyIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 10, height: 10, display: "inline-block", verticalAlign: "middle", marginRight: 3 }}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden border shadow-sm bg-white" style={{ fontFamily: "system-ui,-apple-system,sans-serif", minHeight: 520 }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`, color: "#fff", padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0, boxShadow: "0 2px 16px rgba(0,0,0,.08)" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,.2)", border: "2px solid rgba(255,255,255,.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0, position: "relative" }}
          className={aiMode ? "ai-avatar" : ""}>
          {isValidUrl(logo) ? <img src={logo} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} /> : <BotDot size={24} />}
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>{name}</div>
          <div style={{ fontSize: 11.5, opacity: 0.9 }}>Assistant virtuel</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
          <button
            onClick={() => setAiMode(!aiMode)}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: aiMode ? "rgba(168,85,247,.4)" : "rgba(255,255,255,.1)",
              border: "none", color: "#fff", fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", transition: "all .18s",
              boxShadow: aiMode ? "0 0 12px rgba(168,85,247,.3)" : "none",
            }}
            title={aiMode ? "Mode IA actif" : "Mode IA désactivé"}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
              <path d="M12 2a4 4 0 0 1 4 4c0 1.1-.4 2.1-1 2.8V12l-3 3-3-3V8.8A4 4 0 0 1 12 2z" />
              <path d="M8 14v3l4 4 4-4v-3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div style={{ padding: "8px 16px", fontSize: 11.5, color: "#64748b", borderBottom: "1px solid #eef2f6", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexShrink: 0 }}>
        {aiMode && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "linear-gradient(90deg,#7c3aed,#9333ea)", color: "#fff", padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: ".3px", boxShadow: "0 2px 8px rgba(124,58,237,.25)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 10, height: 10 }}>
              <path d="M12 2a4 4 0 0 1 4 4c0 1.1-.4 2.1-1 2.8V12l-3 3-3-3V8.8A4 4 0 0 1 12 2z" />
              <path d="M8 14v3l4 4 4-4v-3" />
            </svg>
            IA Active
          </span>
        )}
        <span style={{ color: "#64748b" }}>Tester les réponses</span>
        <span style={{ width: 8, height: 8, borderRadius: "50%", display: "inline-block", flexShrink: 0, marginLeft: "auto", background: online ? "#16a34a" : "#dc2626" }} title={online ? "Connecté" : "Hors ligne"} />
      </div>

      {/* Offline banner */}
      <div style={{ display: online ? "none" : "block", background: "#fef3c7", color: "#92400e", fontSize: 11, fontWeight: 600, textAlign: "center", padding: "5px 12px", borderBottom: "1px solid #fde68a", flexShrink: 0 }}>
        ⚠️ Connexion perdue — vos messages seront envoyés dès la reconnexion
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 14, background: "linear-gradient(180deg,#f8fafc 0%,#f1f5f9 100%)" }}>
        {messages.map((m, i) => (
          m.role === "user" ? (
            <div key={i} style={{ maxWidth: "84%", alignSelf: "flex-end", animation: "nr .28s ease" }}>
              <div style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
                color: "#fff", padding: "12px 16px", borderRadius: "20px 20px 4px 20px",
                fontSize: 14, lineHeight: 1.65, boxShadow: `0 3px 12px ${primaryColor}33`,
                whiteSpace: "pre-wrap", wordBreak: "break-word",
              }}><span dangerouslySetInnerHTML={{ __html: renderMarkdown(m.text) }} /></div>
              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4, textAlign: "right" }}>{formatTime()}</div>
            </div>
          ) : (
            <div key={i} style={{ display: "flex", gap: 10, maxWidth: "92%", animation: "nl .28s ease" }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: aiMode || m.source === "ai" ? "linear-gradient(135deg,#7c3aed,#9333ea)" : `linear-gradient(135deg,${primaryColor},#4a90d9)`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#fff", flexShrink: 0, marginTop: 2,
                boxShadow: aiMode || m.source === "ai" ? "0 2px 8px rgba(124,58,237,.2)" : "0 2px 6px rgba(0,0,0,.08)",
              }}>
                <BotDot size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  background: "#fff", border: "1px solid #eef2f6", padding: "14px 16px",
                  borderRadius: "20px 20px 20px 4px", fontSize: 14, lineHeight: 1.7,
                  color: "#0d1b2a", boxShadow: "0 2px 8px rgba(0,0,0,.04)",
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                  borderLeft: aiMode || m.source === "ai" ? "3px solid #7c3aed" : "none",
                  backgroundImage: aiMode || m.source === "ai" ? "linear-gradient(135deg,#fff,#f8f6ff)" : "none",
                }}>
                  <span dangerouslySetInnerHTML={{ __html: renderMarkdown(m.text) }} />
                </div>
                {m.source && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                    {m.source === "kb" && m.score != null && (
                      <span style={{
                        fontSize: 10.5, fontWeight: 600, padding: "2px 7px", borderRadius: 5, lineHeight: 1.4,
                        ...(scoreClass(m.score) === "green" ? { background: "#d1fae5", color: "#065f46" } :
                            scoreClass(m.score) === "orange" ? { background: "#fef3c7", color: "#92400e" } :
                            { background: "#fee2e2", color: "#991b1b" })
                      }}>
                        ✓ {m.score}%
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: m.source === "ai" ? "#7c3aed" : "#64748b", fontWeight: m.source === "ai" ? 600 : 400, fontStyle: m.source === "ai" ? "normal" : "italic" }}>
                      {m.source === "kb" ? "Base de connaissances" : m.source === "ai" ? (m.provider ? `Propulsé par ${m.provider}` : "IA") : "Fallback"}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(m.text);
                        setCopiedId(`copied-${i}`);
                        setTimeout(() => setCopiedId(null), 1500);
                      }}
                      style={{
                        background: "none", border: "1px solid #e2e8f0", borderRadius: 6,
                        padding: "2px 7px", fontSize: 10, color: copiedId === `copied-${i}` ? "#16a34a" : "#94a3b8",
                        cursor: "pointer", marginLeft: "auto",
                        borderColor: copiedId === `copied-${i}` ? "#d1fae5" : "#e2e8f0",
                        transition: "all .15s",
                      }}
                      title="Copier la réponse"
                    >
                      <CopyIcon />{copiedId === `copied-${i}` ? "Copié !" : "Copier"}
                    </button>
                  </div>
                )}
                {m.messageId && (
                  <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 4 }}>
                    {!ratings[m.messageId] ? (
                      <>
                        <span style={{ fontSize: 10, color: "#94a3b8", marginRight: 2 }}>Noter :</span>
                        {[5,4,3,2,1].map(r => (
                          <button key={r}
                            onClick={() => submitFeedback(m.messageId!, r, m.question || "", m.text, m.source, m.score, m.provider)}
                            style={{
                              width: 20, height: 20, borderRadius: "50%", border: "1px solid #d1d5db",
                              background: "transparent", cursor: "pointer", fontSize: 9, fontWeight: 700,
                              color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center",
                              transition: "all .15s", padding: 0, lineHeight: 1,
                            }}
                            title={r === 5 ? "Excellent" : r === 4 ? "Bien" : r === 3 ? "Moyen" : r === 2 ? "Mauvais" : "Très mauvais"}
                          >{r}</button>
                        ))}
                      </>
                    ) : (
                      <span style={{ fontSize: 10, color: "#16a34a", fontWeight: 600 }}>
                        Noté : {ratings[m.messageId]}/5
                      </span>
                    )}
                  </div>
                )}
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{formatTime()}</div>
              </div>
            </div>
          )
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 10, maxWidth: "92%", animation: "nl .2s ease" }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: aiMode ? "linear-gradient(135deg,#7c3aed,#9333ea)" : `linear-gradient(135deg,${primaryColor},#4a90d9)`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#fff", flexShrink: 0, marginTop: 2,
              boxShadow: aiMode ? "0 2px 8px rgba(124,58,237,.2)" : "0 2px 6px rgba(0,0,0,.08)",
            }}>
              <BotDot size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ background: "#fff", border: "1px solid #eef2f6", padding: "16px 18px", borderRadius: "20px 20px 20px 4px", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
                <div style={{ fontSize: 11.5, color: "#7c3aed", fontWeight: 600, marginBottom: 7 }}>Réflexion en cours</div>
                <div style={{ display: "flex", gap: 5 }}>
                  {[0,1,2].map((i) => (
                    <span key={i} style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: "#7c3aed", display: "inline-block",
                      animation: "nb .6s infinite", animationDelay: `${i*0.12}s`,
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
      <div style={{ flexShrink: 0, borderTop: "1px solid #eef2f6", background: "#fff", padding: "12px 16px" }}>
        <div className="chat-input-wrap" style={{ display: "flex", gap: 10, alignItems: "flex-end", background: "#f8fafc", borderRadius: 16, border: "2px solid #eef2f6", padding: "8px 8px 8px 16px", transition: "all .18s" }}>
          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px"; }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder="Posez votre question..."
            disabled={loading}
            rows={1}
            style={{ flex: 1, border: "none", outline: "none", fontSize: 14.5, background: "transparent", color: "#0d1b2a", resize: "none", minHeight: 40, maxHeight: 100, fontFamily: "inherit", lineHeight: 1.5, padding: "8px 0" }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            style={{
              width: 40, height: 40, borderRadius: 14, border: "none",
              background: aiMode ? "#7c3aed" : primaryColor,
              color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, opacity: loading || !input.trim() ? 0.45 : 1,
              transition: "all .18s",
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        .nmsg-bbl table { border-collapse: collapse; width: 100%; margin: 6px 0; font-size: 12.5px; }
        .nmsg-bbl th, .nmsg-bbl td { border: 1px solid #e2e8f0; padding: 5px 8px; text-align: left; }
        .nmsg-bbl th { background: #f8fafc; font-weight: 700; color: #334155; }
        .nmsg-bbl tr:nth-child(even) td { background: #fafbfc; }
        .chat-input-wrap:focus-within {
          border-color: ${aiMode ? "#7c3aed" : primaryColor} !important;
          box-shadow: 0 0 0 4px ${aiMode ? "rgba(124,58,237,.18)" : `${primaryColor}15`} !important;
          background: #fff !important;
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
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) return;
    const payload = JSON.parse(atob(t.split(".")[1]));
    fetch("/api/clients", { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((clients) => {
        const c = clients.find((c: any) => c.id === payload.clientId);
        if (c) setClient(c);
      });
  }, []);

  if (!client) return <p className="text-gray-500">Chargement...</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Tester votre chatbot</h1>
        <p className="text-sm text-gray-500">Posez des questions pour valider les réponses de votre assistant virtuel.</p>
      </div>
      <ChatTest
        slug={client.slug}
        primaryColor={client.primaryColor || "#7c3aed"}
        name={client.name}
        logo={client.logo}
      />
    </div>
  );
}
