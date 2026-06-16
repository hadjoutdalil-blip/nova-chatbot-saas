"use client";

import { useEffect, useState } from "react";
import { MessageSquare, ChevronDown, ChevronUp, Trash2, Bot, User, Search } from "lucide-react";

interface Conversation {
  id: string;
  title: string;
  messages: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatMsg {
  role: string;
  content: string;
  source?: string;
  provider?: string;
  score?: number;
}

const SOURCE_LABELS: Record<string, string> = {
  kb: "Base de connaissance",
  qa: "QA validée",
  rag: "Documentation",
  escalade: "Escalade",
  fallback: "Fallback",
};

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  function token() { return localStorage.getItem("token") || ""; }

  function load() {
    fetch("/api/conversations", { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((data) => { setConversations(data); setLoading(false); });
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette conversation ?")) return;
    const res = await fetch(`/api/conversations?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) setConversations((prev) => prev.filter((c) => c.id !== id));
  }

  const filtered = search
    ? conversations.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
    : conversations;

  function parseMessages(msgs: string): ChatMsg[] {
    try { return JSON.parse(msgs); } catch { return []; }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Conversations</h1>
        <button onClick={load} className="text-sm text-purple-600 hover:text-purple-800 font-medium">
          Actualiser
        </button>
      </div>
      <p className="text-gray-500 mb-6">Historique des échanges entre les visiteurs et votre chatbot.</p>

      <div className="relative max-w-md mb-6">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une conversation..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white/80 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
        />
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl text-center py-16 text-gray-400 shadow-elevated">
          <MessageSquare size={40} className="mx-auto mb-3 text-gray-300" />
          <p>{conversations.length === 0 ? "Aucune conversation pour l'instant." : "Aucun résultat."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((conv) => {
            const msgs = parseMessages(conv.messages);
            const firstMsg = msgs.find((m) => m.role === "user");
            const isOpen = expanded === conv.id;

            return (
              <div key={conv.id} className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-elevated overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : conv.id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-white/60 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{conv.title || "(Sans titre)"}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(conv.createdAt)}
                      {msgs.length > 0 && <span className="ml-3">{msgs.length} message{msgs.length > 1 ? "s" : ""}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <span className="text-xs bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full font-medium">
                      {msgs.filter((m) => m.role === "user").length} visiteur{msgs.filter((m) => m.role === "user").length > 1 ? "s" : ""}
                    </span>
                    {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-3 max-h-96 overflow-y-auto">
                    {msgs.map((msg, i) => (
                      <div key={i} className={`flex gap-3 ${msg.role === "user" ? "" : ""}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.role === "user" ? "bg-gray-100" : "bg-purple-100"}`}>
                          {msg.role === "user" ? <User size={14} className="text-gray-500" /> : <Bot size={14} className="text-purple-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">{msg.content}</div>
                          {msg.role === "assistant" && (msg.source || msg.provider || msg.score !== undefined) && (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {msg.source && (
                                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                                  {SOURCE_LABELS[msg.source] || msg.source}
                                </span>
                              )}
                              {msg.provider && (
                                <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">
                                  {msg.provider}
                                </span>
                              )}
                              {msg.score !== undefined && (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${msg.score >= 80 ? "bg-green-50 text-green-600" : msg.score >= 60 ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-600"}`}>
                                  Score: {msg.score}%
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(conv.id); }}
                      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors mt-2"
                    >
                      <Trash2 size={12} /> Supprimer
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
