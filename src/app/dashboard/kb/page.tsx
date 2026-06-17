"use client";

import { useEffect, useState } from "react";

interface KBEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string;
  createdAt: string;
}

export default function KBPage() {
  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ question: "", answer: "", category: "", keywords: "" });
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");

  function token() { return localStorage.getItem("token") || ""; }

  function load() {
    fetch("/api/kb", { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((data) => { setEntries(data); setLoading(false); });
  }

  useEffect(() => { load(); }, []);

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
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }
    setForm({ question: "", answer: "", category: "", keywords: "" });
    setEditing(null);
    load();
  }

  function handleEdit(e: KBEntry) {
    setForm({ question: e.question, answer: e.answer, category: e.category, keywords: e.keywords });
    setEditing(e.id);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette entrée ?")) return;
    await fetch(`/api/kb/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token()}` },
    });
    load();
  }

  function handleCancel() {
    setForm({ question: "", answer: "", category: "", keywords: "" });
    setEditing(null);
    setError("");
  }

  async function handleExportJSON() {
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Base de connaissances</h1>
        <div className="flex gap-2">
          <button onClick={handleExportPDF} className="text-sm border rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50">Exporter PDF</button>
          <button onClick={handleExportJSON} className="text-sm border rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50">Exporter JSON</button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 mb-6 max-w-2xl space-y-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <h2 className="font-semibold text-lg">{editing ? "Modifier l'entrée" : "Nouvelle entrée"}</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Question</label>
          <input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Réponse</label>
          <textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} rows={4} className="w-full border rounded-lg px-3 py-2" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Catégorie</label>
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mots-clés (séparés par des virgules)</label>
            <input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-purple-700">
            {editing ? "Enregistrer" : "Ajouter"}
          </button>
          {editing && (
            <button type="button" onClick={handleCancel} className="text-gray-500 hover:text-gray-700 text-sm">Annuler</button>
          )}
        </div>
      </form>

      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : (
        <div className="space-y-3">
          {entries.length === 0 && <p className="text-gray-400 text-center py-8">Aucune entrée dans la base de connaissances</p>}
          {entries.map((e) => (
            <div key={e.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium">{e.question}</h3>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{e.answer}</p>
                  <div className="flex gap-2 mt-2">
                    {e.category && <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-500">{e.category}</span>}
                    {e.keywords && <span className="text-xs bg-purple-50 px-2 py-1 rounded-full text-purple-600">{e.keywords}</span>}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
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
