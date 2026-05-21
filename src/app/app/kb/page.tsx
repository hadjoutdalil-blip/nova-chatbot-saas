"use client";

import { useEffect, useState, useMemo } from "react";

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
}

const ICONS = ["💬", "📦", "🚚", "💰", "🔧", "📞", "🏠", "📋", "⭐", "🔒", "📅", "🎯", "📝", "🛡️", "⚡", "💡", "📎", "🔔"];

export default function AppKBPage() {
  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ question: "", alt_questions: "", answer: "", category: "", keywords: "", priority: 5, related_tags: "", icon: "" });
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [altInput, setAltInput] = useState("");
  const [importing, setImporting] = useState(false);

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
    setForm({ question: "", alt_questions: "", answer: "", category: "", keywords: "", priority: 5, related_tags: "", icon: "" });
    setEditing(null);
    setAltInput("");
    load();
  }

  function handleEdit(e: KBEntry) {
    setForm({ question: e.question, alt_questions: e.alt_questions || "", answer: e.answer, category: e.category, keywords: e.keywords, priority: e.priority ?? 5, related_tags: e.related_tags || "", icon: e.icon || "" });
    setEditing(e.id);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette entrée ?")) return;
    await fetch(`/api/kb/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
    load();
  }

  function handleCancel() {
    setForm({ question: "", alt_questions: "", answer: "", category: "", keywords: "", priority: 5, related_tags: "", icon: "" });
    setEditing(null);
    setError("");
    setAltInput("");
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
      const entries = JSON.parse(text);
      if (!Array.isArray(entries)) throw new Error("Format invalide");
      const replace = entries.length > 0 && confirm(`${entries.length} entrées trouvées. Remplacer toute la base (${entries.length} existantes) ? "Annuler" = ajouter.`);
      const res = await fetch("/api/kb/import-kb", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ entries, replace }),
      });
      if (res.ok) load();
    } catch { setError("Erreur d'import"); }
    setImporting(false);
    e.target.value = "";
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Base de connaissances</h1>
      <p className="text-gray-500 mb-6">Ajoutez les questions que votre chatbot connaîtra automatiquement.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 mb-6 max-w-2xl space-y-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <h2 className="font-semibold text-lg">{editing ? "Modifier l'entrée" : "Nouvelle entrée"}</h2>

        <div className="grid grid-cols-[1fr_auto] gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Question principale</label>
            <input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Icône</label>
            <select value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="w-20 border rounded-lg px-2 py-2">
              <option value="">—</option>
              {ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Questions alternatives (variantes)</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {form.alt_questions ? form.alt_questions.split(",").map((q, i) => (
              <span key={i} className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-full">
                {q.trim()}
                <button type="button" onClick={() => removeAltQuestion(i)} className="text-purple-400 hover:text-red-500">&times;</button>
              </span>
            )) : null}
          </div>
          <div className="flex gap-2">
            <input value={altInput} onChange={(e) => setAltInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAltQuestion(); } }} placeholder="Variante de question..." className="flex-1 border rounded-lg px-3 py-2 text-sm" />
            <button type="button" onClick={addAltQuestion} className="text-sm text-purple-600 hover:text-purple-800 font-medium">+ Ajouter</button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Réponse</label>
          <textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} rows={4} className="w-full border rounded-lg px-3 py-2" required />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Catégorie</label>
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} list="cats" className="w-full border rounded-lg px-3 py-2" />
            <datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mots-clés</label>
            <input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="séparés par des virgules" className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Priorité ({form.priority})</label>
            <input type="range" min={1} max={10} value={form.priority} onChange={(e) => setForm({ ...form, priority: +e.target.value })} className="w-full" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tags associés</label>
          <input value={form.related_tags} onChange={(e) => setForm({ ...form, related_tags: e.target.value })} placeholder="séparés par des virgules" className="w-full border rounded-lg px-3 py-2" />
        </div>

        <div className="flex gap-3">
          <button type="submit" className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-purple-700">
            {editing ? "Enregistrer" : "Ajouter"}
          </button>
          {editing && <button type="button" onClick={handleCancel} className="text-gray-500 hover:text-gray-700 text-sm">Annuler</button>}
        </div>
      </form>

      {entries.length > 0 && (
        <div className="flex gap-3 mb-4 items-start">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher dans la KB..." className="flex-1 border rounded-lg px-3 py-2 text-sm" />
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
            <option value="">Toutes catégories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button type="button" onClick={handleExport} className="text-sm border rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50">Exporter</button>
          <label className="text-sm border rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50 cursor-pointer">
            {importing ? "Import..." : "Importer"}
            <input type="file" accept=".json" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-400 text-center py-8 bg-white rounded-xl">
          {entries.length === 0 ? "Aucune entrée pour l'instant." : "Aucun résultat."}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => (
            <div key={e.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{e.icon && <span className="mr-1">{e.icon}</span>}{e.question}</h3>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap line-clamp-2">{e.answer}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {e.category && <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-500">{e.category}</span>}
                    {e.keywords && <span className="text-xs bg-purple-50 px-2 py-1 rounded-full text-purple-600">{e.keywords}</span>}
                    <span className={`text-xs px-2 py-1 rounded-full ${(e.priority ?? 5) >= 7 ? "bg-red-50 text-red-600" : (e.priority ?? 5) >= 4 ? "bg-yellow-50 text-yellow-700" : "bg-gray-50 text-gray-500"}`}>
                      P{e.priority ?? 5}
                    </span>
                    {e.alt_questions && (
                      <span className="text-xs bg-blue-50 px-2 py-1 rounded-full text-blue-600" title={e.alt_questions}>
                        +{e.alt_questions.split(",").length} var.
                      </span>
                    )}
                    {e.related_tags && <span className="text-xs bg-green-50 px-2 py-1 rounded-full text-green-600">{e.related_tags}</span>}
                  </div>
                </div>
                <div className="flex gap-2 ml-4 shrink-0">
                  <button onClick={() => handleEdit(e)} className="text-purple-600 hover:underline text-xs">Modifier</button>
                  <button onClick={() => handleDelete(e.id)} className="text-red-500 hover:underline text-xs">Supprimer</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
