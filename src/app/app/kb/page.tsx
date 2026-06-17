"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Search, Download, Upload, Edit3, Trash2, X } from "lucide-react";

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

export default function AppKBPage() {
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

  function load() {
    fetch("/api/kb", { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((data) => { setEntries(data); setLoading(false); });
  }

  useEffect(() => { load(); }, []);

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
    load();
  }

  function handleEdit(e: KBEntry) {
    setForm({ question: e.question, alt_questions: e.alt_questions || "", answer: e.answer, category: e.category, keywords: e.keywords, priority: e.priority ?? 5, related_tags: e.related_tags || "", icon: e.icon || "", source: e.source || "", source_url: e.source_url || "", valid_until: e.valid_until || "" });
    setEditing(e.id);
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette entrée ?")) return;
    await fetch(`/api/kb/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
    load();
  }

  function handleCancel() {
    setForm({ question: "", alt_questions: "", answer: "", category: "", keywords: "", priority: 5, related_tags: "", icon: "", source: "", source_url: "", valid_until: "" });
    setEditing(null);
    setError("");
    setAltInput("");
    setShowForm(false);
  }

  function handleExport() {
    window.open("/api/kb/export", "_blank");
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
      if (res.ok) load();
    } catch { setError("Erreur d'import"); }
    setImporting(false);
    e.target.value = "";
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Base de connaissances</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ question: "", alt_questions: "", answer: "", category: "", keywords: "", priority: 5, related_tags: "", icon: "", source: "", source_url: "", valid_until: "" }) }} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:from-purple-700 hover:to-purple-600 transition-all shadow-lg shadow-purple-200">
          <Plus size={16} /> Nouvelle entrée
        </button>
      </div>
      <p className="text-gray-500 mb-6">Ajoutez les questions que votre chatbot connaîtra automatiquement.</p>

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
          <button onClick={handleExport} className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600 hover:bg-white/80 transition-all"><Download size={15} /> Exporter</button>
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
    </div>
  );
}
