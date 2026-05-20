"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ClientTestPage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<any>(null);
  const [slug, setSlug] = useState("");
  const [messages, setMessages] = useState<{ text: string; role: string; source?: string; score?: number; provider?: string; clientName?: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiMode, setAiMode] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) return;
    fetch(`/api/clients/${id}`, { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((c) => { setClient(c); setSlug(c.slug); });
  }, [id]);

  async function sendMessage(text: string) {
    if (!text.trim() || !slug) return;
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
      setMessages((prev) => [...prev, { text: data.response, role: "bot", source: data.source, score: data.score, provider: data.provider, clientName: data.clientName }]);
      setHistory((prev) => [...prev, { role: "user", content: text }, { role: "assistant", content: data.response }].slice(-20));
    } catch {
      setMessages((prev) => [...prev, { text: "Erreur réseau", role: "bot", source: "fallback" }]);
    }
    setLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") sendMessage(input);
  }

  function colorClass(score?: number) {
    if (score == null) return "";
    return score > 70 ? "text-green-600" : score > 40 ? "text-orange-500" : "text-red-500";
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/clients" className="text-gray-400 hover:text-gray-600 text-sm">&larr; Clients</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold">{client?.name || "..."}</h1>
      </div>

      <div className="flex gap-2 mb-4">
        <Link href={`/dashboard/clients/${id}`} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">Modifier</Link>
        <Link href={`/dashboard/clients/${id}/kb`} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">Base connaissances</Link>
        <Link href={`/dashboard/clients/${id}/widget`} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">Widget</Link>
        <Link href={`/dashboard/clients/${id}/test`} className="text-sm px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 font-medium">Tester</Link>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">Mode IA</span>
          <button
            onClick={() => setAiMode(!aiMode)}
            className={`w-10 h-5 rounded-full transition-colors relative ${aiMode ? "bg-purple-600" : "bg-gray-300"}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${aiMode ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </label>
        {slug && (
          <span className="text-xs text-gray-400">
            Endpoint: <code className="text-purple-600">/api/chat/{slug}</code>
          </span>
        )}
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border h-[400px] overflow-y-auto p-4 space-y-3 mb-4">
          {messages.length === 0 ? (
            <p className="text-gray-400 text-center py-12 text-sm">Posez une question pour tester le chatbot.</p>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`max-w-[80%] ${m.role === "user" ? "ml-auto" : ""}`}>
                <div className={`p-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-purple-600 text-white rounded-br-sm" : "bg-gray-100 text-gray-900 rounded-bl-sm"}`}>
                  {m.text}
                </div>
                {m.role === "bot" && m.source && (
                  <div className="flex items-center gap-2 mt-1 text-xs">
                    {m.source === "kb" && m.score != null && (
                      <span className={`font-semibold ${colorClass(m.score)}`}>
                        ✓ {m.score}%
                      </span>
                    )}
                    <span className="text-gray-400">
                      {m.source === "kb" ? "Base de connaissances" : m.source === "ai" ? `IA (${m.provider || ""}${m.clientName ? " + " + m.clientName : ""})` : "Fallback"}
                    </span>
                  </div>
                )}
                {m.role === "bot" && m.source !== "fallback" && i + 1 < messages.length && messages[i + 1]?.role === "user" && m.source && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-xs bg-gray-50 border px-2 py-1 rounded-full text-gray-500 cursor-pointer hover:border-purple-300" onClick={() => sendMessage(messages[i + 1]?.text || "En savoir plus")}>
                      En savoir plus
                    </span>
                    <span className="text-xs bg-gray-50 border px-2 py-1 rounded-full text-gray-500 cursor-pointer hover:border-purple-300" onClick={() => sendMessage("Pouvez-vous détailler ?")}>
                      Plus de détails
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
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Posez votre question..."
            className="flex-1 border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-400"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="bg-purple-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
          >
            Envoyer
          </button>
          <button
            onClick={() => { setMessages([]); setHistory([]); }}
            className="text-gray-400 hover:text-red-500 text-sm px-3"
            title="Effacer la discussion"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 p-4 bg-white rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500 mb-2">
            <span className="font-medium">Widget prévisualisation :</span> Le widget apparaît en bas à droite.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 text-center text-gray-400 text-xs">
            <p>Script injecté : <code className="text-purple-600">/api/widget/{slug}/embed.js</code></p>
          </div>
          {slug && <script src={`/api/widget/${slug}/embed.js`} />}
        </div>
      </div>
    </div>
  );
}
