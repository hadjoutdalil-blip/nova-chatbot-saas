"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Search, Download, Upload, Edit3, Trash2, X, FileText, BookOpen, Eye, Building2, Save } from "lucide-react";

interface KBEntry {
  id: string;
  question: string;
  alt_questions: string;
  answer: string;
  category: string;
  keywords: string;
  priority: number;
  related_tags: string;
  icon: string;
  source: string;
  source_url: string;
  valid_until: string;
}

const ICONS = ["💬", "📦", "🚚", "💰", "🔧", "📞", "🏠", "📋", "⭐", "🔒", "📅", "🎯", "📝", "🛡️", "⚡", "💡", "📎", "🔔"];

const TABS = [
  { id: "kb", label: "KB Experte", icon: BookOpen },
  { id: "documents", label: "Documents contextuels", icon: FileText },
];

function parseContextChunks(siteContext: string) {
  if (!siteContext) return [];
  const regex = /\[CHUNK:([^\]]+)\]([\s\S]*?)(?=\[CHUNK:|$)/g;
  const chunks: { name: string; index: number; content: string }[] = [];
  let m;
  while ((m = regex.exec(siteContext)) !== null) {
    const parts = m[1].split(":");
    const name = parts.slice(0, -1).join(":") || parts[0];
    const idx = parseInt(parts[parts.length - 1], 10);
    chunks.push({ name, index: isNaN(idx) ? 0 : idx, content: m[2].trim() });
  }
  if (chunks.length === 0 && siteContext.trim()) {
    chunks.push({ name: "contexte.txt", index: 0, content: siteContext.trim() });
  }
  return chunks;
}

function downloadContent(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AppKBPage() {
  const [tab, setTab] = useState("kb");
  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ question: "", alt_questions: "", answer: "", category: "", keywords: "", priority: 5, related_tags: "", icon: "", source: "", source_url: "", valid_until: "" });
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [altInput, setAltInput] = useState("");
  const [importing, setImporting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [client, setClient] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [contextChunks, setContextChunks] = useState<{ name: string; index: number; content: string }[]>([]);
  const [viewDoc, setViewDoc] = useState<{ title: string; content: string } | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testQuestion, setTestQuestion] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  function token() { return localStorage.getItem("token") || ""; }

  const categories = useMemo(() => {
    const cats = new Set(entries.map((e) => e.category).filter(Boolean));
    return [...cats].sort();
  }, [entries]);

  const filtered = useMemo(() => {
    let out = entries;
    if (search) {
      const s = search.toLowerCase();
      out = out.filter((e) => e.question.toLowerCase().includes(s) || e.answer.toLowerCase().includes(s) || e.keywords.toLowerCase().includes(s));
    }
    if (catFilter) out = out.filter((e) => e.category === catFilter);
    return out;
  }, [entries, search, catFilter]);

  function loadKB() {
    fetch("/api/kb", { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((data) => { setEntries(data); setLoading(false); });
  }

  function loadDocuments() {
    fetch("/api/client-documents", { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then(setDocuments);
  }

  useEffect(() => {
    fetch("/api/clients", { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((clients) => {
        const payload = JSON.parse(atob(token().split(".")[1]));
        const c = clients.find((c: any) => c.id === payload.clientId);
        if (c) { setClient(c); setContextChunks(parseContextChunks(c.siteContext || "")); }
      });
    loadKB();
    loadDocuments();
  }, []);

  function addAltQuestion() {
    const tag = altInput.trim();
    if (!tag) return;
    const existing = form.alt_questions ? form.alt_questions.split(",").map((s) => s.trim()) : [];
    if (existing.includes(tag)) return;
    existing.push(tag);
    setForm({ ...form, alt_questions: existing.join(", ") });
    setAltInput("");
  }

  function removeAltQuestion(idx: number) {
    const arr = form.alt_questions ? form.alt_questions.split(",").map((s) => s.trim()) : [];
    arr.splice(idx, 1);
    setForm({ ...form, alt_questions: arr.join(", ") });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const url = editing ? `/api/kb/${editing}` : "/api/kb";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify(form),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error); return; }
    setForm({ question: "", alt_questions: "", answer: "", category: "", keywords: "", priority: 5, related_tags: "", icon: "", source: "", source_url: "", valid_until: "" });
    setEditing(null);
    setShowForm(false);
    setAltInput("");
    loadKB();
  }

  function handleEdit(e: KBEntry) {
    setForm({ question: e.question, alt_questions: e.alt_questions || "", answer: e.answer, category: e.category, keywords: e.keywords, priority: e.priority ?? 5, related_tags: e.related_tags || "", icon: e.icon || "", source: e.source || "", source_url: e.source_url || "", valid_until: e.valid_until || "" });
    setEditing(e.id);
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette entrée ?")) return;
    await fetch(`/api/kb/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
    loadKB();
  }

  function handleCancel() {
    setForm({ question: "", alt_questions: "", answer: "", category: "", keywords: "", priority: 5, related_tags: "", icon: "", source: "", source_url: "", valid_until: "" });
    setEditing(null);
    setError("");
    setAltInput("");
    setShowForm(false);
  }

  async function handleExport() {
    const res = await fetch("/api/kb/export", { headers: { Authorization: `Bearer ${token()}` } });
    if (!res.ok) { const d = await res.json(); alert(d.error || "Erreur"); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "kb-export.json"; a.click();
    URL.revokeObjectURL(url);
  }

  async function handleExportPDF() {
    const res = await fetch("/api/kb/export-pdf", { headers: { Authorization: `Bearer ${token()}` } });
    if (!res.ok) { const d = await res.json(); alert(d.error || "Erreur"); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "kb-export.pdf"; a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error("Format invalide");
      const replace = data.length > 0 && confirm(`${data.length} entrées trouvées. Remplacer toute la base ? "Annuler" = ajouter.`);
      const res = await fetch("/api/kb/import-kb", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ entries: data, replace }),
      });
      if (res.ok) loadKB();
    } catch { setError("Erreur d'import"); }
    setImporting(false);
    e.target.value = "";
  }

  /* Document handlers */
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/client-documents", {
      method: "POST",
      headers: { Authorization: `Bearer ${token()}` },
      body: fd,
    });
    if (res.ok) {
      const data = await res.json();
      setDocuments((prev) => [...prev, data]);
    } else {
      const err = await res.json();
      alert(err.error || "Erreur d'upload");
    }
    setUploading(false);
    e.target.value = "";
  }

  async function handleDeleteDoc(id: string) {
    if (!confirm("Supprimer ce document ?")) return;
    const res = await fetch(`/api/client-documents/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  async function handleTestRag() {
    if (!testQuestion.trim()) return;
    setTesting(true);
    setTestResults(null);
    const res = await fetch("/api/client-documents/test-rag", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ question: testQuestion }),
    });
    setTestResults(await res.json());
    setTesting(false);
  }

  async function handleTransferToKb() {
    if (!confirm("Transférer tous les documents contextuels et chunks vers la base de connaissances ?")) return;
    setTransferring(true);
    const res = await fetch("/api/documents/transfer-to-kb", {
      method: "POST",
      headers: { Authorization: `Bearer ${token()}` },
    });
    const data = await res.json();
    setTransferring(false);
    if (res.ok) {
      alert(`${data.created} entrée(s) ajoutée(s) à la base de connaissances.`);
      loadKB();
    } else {
      alert(data.error || "Erreur lors du transfert");
    }
  }

  async function handleSaveContext() {
    if (!client) return;
    setSaving(true);
    await fetch(`/api/clients/${client.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ siteContext: client.siteContext }),
    });
    setSaving(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Base de connaissances</h1>
        {tab === "kb" && (
          <button onClick={() => { setShowForm(true); setEditing(null); setForm({ question: "", alt_questions: "", answer: "", category: "", keywords: "", priority: 5, related_tags: "", icon: "", source: "", source_url: "", valid_until: "" }) }} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:from-purple-700 hover:to-purple-600 transition-all shadow-lg shadow-purple-200">
            <Plus size={16} /> Nouvelle entrée
          </button>
        )}
      </div>
      <p className="text-gray-500 mb-4">{tab === "kb" ? "Ajoutez les questions que votre chatbot connaîtra automatiquement." : "Gérez les documents et le contexte entreprise utilisés par la RAG."}</p>

      <div className="flex gap-1 mb-6 bg-gray-100/80 rounded-xl p-1 w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "kb" && (
        <>
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={handleCancel}>
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">{editing ? "Modifier l'entrée" : "Nouvelle entrée"}</h2>
                  <button onClick={handleCancel} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
                  <div className="grid grid-cols-[1fr_auto] gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Question principale</label>
                      <input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Icône</label>
                      <select value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="w-20 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none">
                        <option value="">—</option>
                        {ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Questions alternatives</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {form.alt_questions ? form.alt_questions.split(",").map((q, i) => (
                        <span key={i} className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-xs px-2.5 py-1 rounded-full">
                          {q.trim()}
                          <button type="button" onClick={() => removeAltQuestion(i)} className="text-purple-400 hover:text-red-500">&times;</button>
                        </span>
                      )) : null}
                    </div>
                    <div className="flex gap-2">
                      <input value={altInput} onChange={(e) => setAltInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAltQuestion(); } }} placeholder="Variante de question..." className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                      <button type="button" onClick={addAltQuestion} className="text-sm text-purple-600 hover:text-purple-800 font-medium px-3">+ Ajouter</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Réponse</label>
                    <textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} rows={4} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" required />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                      <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} list="cats" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                      <datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mots-clés</label>
                      <input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="séparés par des virgules" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priorité ({form.priority})</label>
                      <input type="range" min={1} max={10} value={form.priority} onChange={(e) => setForm({ ...form, priority: +e.target.value })} className="w-full accent-purple-600" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags associés</label>
                    <input value={form.related_tags} onChange={(e) => setForm({ ...form, related_tags: e.target.value })} placeholder="séparés par des virgules" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Source & validité</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                        <input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="ex: Documentation CETIM" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">URL source</label>
                        <input value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })} placeholder="https://..." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Valide jusqu'au</label>
                        <input value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} type="date" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:from-purple-700 hover:to-purple-600 transition-all">
                      {editing ? "Enregistrer" : "Ajouter"}
                    </button>
                    <button type="button" onClick={handleCancel} className="text-gray-500 hover:text-gray-700 text-sm px-4">Annuler</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {entries.length > 0 && (
            <div className="flex gap-3 mb-5 items-center">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher dans la KB..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white/80 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" />
              </div>
              <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white/80 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none">
                <option value="">Toutes catégories</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={handleExportPDF} className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600 hover:bg-white/80 transition-all"><FileText size={15} /> Exporter PDF</button>
              <button onClick={handleExport} className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600 hover:bg-white/80 transition-all"><Download size={15} /> Exporter JSON</button>
              <label className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600 hover:bg-white/80 transition-all cursor-pointer">
                <Upload size={15} /> {importing ? "Import..." : "Importer"}
                <input type="file" accept=".json" className="hidden" onChange={handleImport} disabled={importing} />
              </label>
            </div>
          )}

          {loading ? (
            <div className="text-center py-20 text-gray-400">Chargement...</div>
          ) : filtered.length === 0 ? (
            <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl text-center py-16 text-gray-400 shadow-elevated">
              {entries.length === 0 ? (
                <div><Plus size={40} className="mx-auto mb-3 text-gray-300" /><p>Aucune entrée pour l&apos;instant.</p><p className="text-sm mt-1">Cliquez sur &quot;Nouvelle entrée&quot; pour commencer.</p></div>
              ) : "Aucun résultat."}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((e) => (
                <div key={e.id} className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-5 shadow-elevated hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{e.icon && <span className="mr-1.5">{e.icon}</span>}{e.question}</h3>
                      <p className="text-sm text-gray-600 mt-1.5 whitespace-pre-wrap line-clamp-2 leading-relaxed">{e.answer}</p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {e.category && <span className="text-xs bg-gray-100 px-2.5 py-1 rounded-full text-gray-500 font-medium">{e.category}</span>}
                        {e.keywords && <span className="text-xs bg-purple-50 px-2.5 py-1 rounded-full text-purple-600 font-medium">{e.keywords}</span>}
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${(e.priority ?? 5) >= 7 ? "bg-red-50 text-red-600" : (e.priority ?? 5) >= 4 ? "bg-yellow-50 text-yellow-700" : "bg-gray-50 text-gray-500"}`}>
                          P{e.priority ?? 5}
                        </span>
                        {e.alt_questions && (
                          <span className="text-xs bg-blue-50 px-2.5 py-1 rounded-full text-blue-600 font-medium" title={e.alt_questions}>
                            +{e.alt_questions.split(",").length} var.
                          </span>
                        )}
                        {e.related_tags && <span className="text-xs bg-green-50 px-2.5 py-1 rounded-full text-green-600 font-medium">{e.related_tags}</span>}
                        {e.source && <span className="text-xs bg-amber-50 px-2.5 py-1 rounded-full text-amber-700 font-medium" title={e.source_url || e.source}>{e.source}</span>}
                        {e.valid_until && new Date(e.valid_until) < new Date() ? (
                          <span className="text-xs bg-red-50 px-2.5 py-1 rounded-full text-red-600 font-medium">Expirée</span>
                        ) : e.valid_until ? (
                          <span className="text-xs bg-blue-50 px-2.5 py-1 rounded-full text-blue-600 font-medium">Valide</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex gap-1 ml-4 shrink-0">
                      <button onClick={() => handleEdit(e)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all"><Edit3 size={15} /></button>
                      <button onClick={() => handleDelete(e.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 size={15} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "documents" && (
        <div className="space-y-5 max-w-2xl">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-elevated p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
              <Building2 size={18} className="text-purple-600" />
              <h2 className="font-semibold text-gray-900">Contexte entreprise</h2>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description de l&apos;activité (importée automatiquement en chunks)</label>
              {contextChunks.length > 0 && (
                <div className="mb-3 space-y-1.5">
                  <p className="text-xs text-gray-400 mb-1.5">{contextChunks.length} fichier(s) importé(s) :</p>
                  {contextChunks.map((chunk, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={14} className="text-purple-500 shrink-0" />
                        <span className="text-sm text-gray-700 truncate">{chunk.name}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button onClick={() => setViewDoc({ title: chunk.name, content: chunk.content })} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all" title="Visualiser">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => downloadContent(chunk.content, chunk.name)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all" title="Télécharger">
                          <Download size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <textarea value={client?.siteContext || ""} onChange={(e) => setClient({ ...(client || {}), siteContext: e.target.value })} rows={4} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" placeholder="Décrivez votre activité..." />
              <div className="flex justify-end mt-3">
                <button onClick={handleSaveContext} disabled={saving} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:from-purple-700 hover:to-purple-600 transition-all disabled:opacity-50 shadow-lg shadow-purple-200">
                  <Save size={14} /> {saving ? "Enregistrement..." : "Enregistrer le contexte"}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-elevated p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-purple-600" />
                <h2 className="font-semibold text-gray-900">Documents téléchargés</h2>
              </div>
              <label className="flex items-center gap-2 text-xs font-medium text-purple-600 hover:text-purple-700 cursor-pointer transition-colors">
                <Upload size={14} /> {uploading ? "Upload..." : "Ajouter un fichier"}
                <input type="file" accept=".txt,.csv,.json,.md" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
            </div>
            <p className="text-xs text-gray-400">Formats supportés : .txt, .csv, .json, .md (max 5 Mo). Gestion des versions et dates de validité.</p>
            {documents.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Aucun document uploadé.</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => {
                  const isExpired = doc.valid_until ? new Date(doc.valid_until) < new Date() : false;
                  return (
                    <div key={doc.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText size={16} className="text-purple-500 shrink-0" />
                        <span className="text-sm text-gray-700 truncate">{doc.originalName}</span>
                        <span className="text-xs text-gray-400 shrink-0">{(doc.fileSize / 1024).toFixed(1)} Ko</span>
                        {doc.version > 1 && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">v{doc.version}</span>}
                        {doc.valid_from && <span className="text-xs text-gray-400 shrink-0">Du {new Date(doc.valid_from).toLocaleDateString("fr")}</span>}
                        {doc.valid_until ? (
                          <span className={"text-xs shrink-0 " + (isExpired ? "text-red-500" : "text-green-600")}>
                            {isExpired ? "Expiré" : "Valide jusqu'au " + new Date(doc.valid_until).toLocaleDateString("fr")}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button onClick={() => setViewDoc({ title: doc.originalName, content: doc.content })} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all" title="Visualiser">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => window.open(`/api/client-documents/${doc.id}/download`, "_blank")} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all" title="Télécharger">
                          <Download size={14} />
                        </button>
                        <button onClick={() => handleDeleteDoc(doc.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Supprimer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
              <button onClick={() => { setTestQuestion(""); setTestResults(null); setShowTestModal(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-purple-200 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 transition-all">
                <Search size={15} /> Tester le RAG
              </button>
              <button onClick={handleTransferToKb} disabled={transferring} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-orange-200 text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 transition-all disabled:opacity-50">
                <BookOpen size={15} /> {transferring ? "Transfert..." : "Transférer vers la KB"}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setViewDoc(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 truncate">{viewDoc.title}</h3>
              <button onClick={() => setViewDoc(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{viewDoc.content}</pre>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-gray-100">
              <button onClick={() => { downloadContent(viewDoc.content, viewDoc.title); setViewDoc(null); }} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-all">
                <Download size={14} /> Télécharger
              </button>
            </div>
          </div>
        </div>
      )}

      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowTestModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Tester la recherche documentaire (RAG)</h3>
              <button onClick={() => setShowTestModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-4">
              <p className="text-sm text-gray-500">Posez une question pour vérifier que les documents contextuels sont bien indexés et trouvés par le moteur RAG.</p>
              <div className="flex gap-2">
                <input type="text" value={testQuestion} onChange={(e) => setTestQuestion(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleTestRag()} placeholder="Ex: Que contiennent les documents d'entreprise ?" className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" />
                <button onClick={handleTestRag} disabled={testing || !testQuestion.trim()} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-purple-700 transition-all disabled:opacity-50">
                  <Search size={15} /> {testing ? "Recherche..." : "Tester"}
                </button>
              </div>
              {testResults && (
                <div className="space-y-3">
                  {testResults.error ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{testResults.error}</div>
                  ) : testResults.chunks && testResults.chunks.length > 0 ? (
                    <>
                      <div className="text-sm text-gray-500">
                        {testResults.totalChunksFound} extraits analysés, {testResults.chunksReturned} trouvés
                        {testResults.matchedByKeyword ? " par mot-clé (score < seuil RAG)" : " avec un score ≥ seuil RAG"}.
                      </div>
                      {testResults.documentsUsed && testResults.documentsUsed.length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                          <p className="text-xs font-medium text-green-700 mb-1.5">Documents sources utilisés :</p>
                          <div className="space-y-1">
                            {testResults.documentsUsed.map((d: any) => (
                              <div key={d.id} className="flex items-center gap-2 text-sm text-green-800">
                                <FileText size={14} className="shrink-0" />
                                <span className="truncate">{d.originalName}</span>
                                <span className="text-xs text-green-600">({(d.fileSize / 1024).toFixed(1)} Ko)</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Extraits correspondants</p>
                        {testResults.chunks.map((chunk: any, i: number) => (
                          <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <FileText size={14} className="text-purple-500" />
                                <span>{chunk.source}</span>
                                {chunk.section && <span className="text-xs text-gray-400">/ {chunk.section}</span>}
                              </div>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${chunk.score >= 80 ? "bg-green-100 text-green-700" : chunk.score >= 60 ? "bg-yellow-100 text-yellow-700" : "bg-orange-100 text-orange-700"}`}>
                                {chunk.score}%
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">{chunk.content}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">
                      Aucun extrait trouvé pour cette question. Les mots-clés de la question ne figurent dans aucun document ou contexte entreprise.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
