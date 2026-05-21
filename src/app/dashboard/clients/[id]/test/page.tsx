"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

function WidgetLoader({ slug }: { slug: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = document.createElement("script");
    el.src = `/api/widget/${slug}/embed`;
    el.async = true;
    ref.current?.appendChild(el);
    return () => { el.remove(); };
  }, [slug]);

  return <div ref={ref} />;
}

function ChatTest({ slug, client }: { slug: string; client: any }) {
  const [messages, setMessages] = useState<{ text: string; role: string; source?: string; score?: number }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiMode, setAiMode] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

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
      setMessages((prev) => [...prev, { text: data.response, role: "bot", source: data.source, score: data.score }]);
      setHistory((prev) => [...prev, { role: "user", content: text }, { role: "assistant", content: data.response }].slice(-20));
    } catch {
      setMessages((prev) => [...prev, { text: "Erreur réseau", role: "bot", source: "fallback" }]);
    }
    setLoading(false);
  }

  function colorClass(score?: number) {
    if (score == null) return "";
    return score > 70 ? "text-green-600" : score > 40 ? "text-orange-500" : "text-red-500";
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">Mode IA</span>
          <button
            onClick={() => setAiMode(!aiMode)}
            className={`w-10 h-5 rounded-full transition-colors relative ${aiMode ? "bg-purple-600" : "bg-gray-300"}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${aiMode ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </label>
        <span className="text-xs text-gray-400">Endpoint: <code className="text-purple-600">/api/chat/{slug}</code></span>
      </div>

      <div className="bg-white rounded-xl border h-[350px] overflow-y-auto p-4 space-y-3 mb-3">
        {messages.length === 0 ? (
          <p className="text-gray-400 text-center py-12 text-sm">Posez une question pour tester.</p>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`max-w-[80%] ${m.role === "user" ? "ml-auto" : ""}`}>
              <div className={`p-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-purple-600 text-white rounded-br-sm" : "bg-gray-100 text-gray-900 rounded-bl-sm"}`}>
                {m.text}
              </div>
              {m.role === "bot" && m.source && (
                <div className="flex items-center gap-2 mt-1 text-xs">
                  {m.source === "kb" && m.score != null && (
                    <span className={`font-semibold ${colorClass(m.score)}`}>✓ {m.score}%</span>
                  )}
                  <span className="text-gray-400">
                    {m.source === "kb" ? "Base de connaissances" : m.source === "ai" ? "IA" : "Fallback"}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="max-w-[80%]">
            <div className="bg-gray-100 rounded-xl rounded-bl-sm p-4 flex gap-1.5">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") sendMessage(input); }} placeholder="Posez votre question..." className="flex-1 border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400" disabled={loading} />
        <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()} className="bg-purple-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">Envoyer</button>
        <button onClick={() => { setMessages([]); setHistory([]); }} className="text-gray-400 hover:text-red-500 text-sm px-2" title="Effacer">✕</button>
      </div>
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
        <div className="bg-white rounded-xl shadow-sm p-5 border">
          <h2 className="font-semibold text-base mb-3">Test du chat</h2>
          {slug && <ChatTest slug={slug} client={client} />}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border">
          <h2 className="font-semibold text-base mb-3">Aperçu widget</h2>
          <p className="text-xs text-gray-400 mb-4">Le widget s'affiche en bas à droite de cette page.</p>
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center" style={{ background: `${primaryColor}20` }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2" className="w-7 h-7">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 mt-3">Le chatbot est prêt</p>
            <p className="text-xs text-gray-400 mt-1">Cliquez sur l'icône en bas à droite</p>
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
