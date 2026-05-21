"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import KBModal from "@/components/admin/KBModal";

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

export default function ClientKBPage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<any>(null);
  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KBEntry | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

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
    fetch(`/api/kb?clientId=${id}`, { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((data) => { setEntries(data); setLoading(false); });
  }

  useEffect(() => {
    fetch(`/api/clients/${id}`, { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((data) => { setClient(data); load(); })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleSave(data: any) {
    const t = token();
    const url = editingEntry ? `/api/kb/${editingEntry.id}` : "/api/kb";
    const method = editingEntry ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify(editingEntry ? data : { ...data, clientId: id }),
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
    setEditingEntry(null);
    load();
  }

  function openEdit(e: KBEntry) {
    setEditingEntry(e);
    setModalOpen(true);
  }

  function openAdd() {
    setEditingEntry(null);
    setModalOpen(true);
  }

  async function handleDelete(kid: string) {
    if (!confirm("Supprimer cette entrée ?")) return;
    await fetch(`/api/kb/${kid}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
    load();
  }

  function handleExport() {
    window.open(`/api/kb/export?clientId=${id}`, "_blank");
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("Format invalide");
      await fetch("/api/kb/import-kb", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ clientId: id, entries: parsed, replace: true }),
      });
      load();
    } catch { setError("Erreur d'import"); }
    setImporting(false);
    e.target.value = "";
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/dashboard/clients/${id}`} className="text-gray-400 hover:text-gray-600 text-sm">&larr; {client?.name || "Client"}</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold">Base de connaissances</h1>
      </div>

      <p className="text-gray-500 mb-6">Gérez la base de connaissances de {client?.name}.</p>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-3 flex-1">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="flex-1 border rounded-lg px-3 py-2 text-sm max-w-xs" />
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
            <option value="">Toutes catégories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={handleExport} className="text-sm border rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50">Exporter</button>
          <label className="text-sm border rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50 cursor-pointer">
            {importing ? "Import..." : "Importer"}
            <input type="file" accept=".json" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
        </div>
        <button onClick={openAdd} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 shrink-0">+ Ajouter</button>
      </div>

      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-400 text-center py-8 bg-white rounded-xl">
          {entries.length === 0 ? "Aucune entrée pour ce client." : "Aucun résultat."}
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
                  <button onClick={() => openEdit(e)} className="text-purple-600 hover:underline text-xs">Modifier</button>
                  <button onClick={() => handleDelete(e.id)} className="text-red-500 hover:underline text-xs">Supprimer</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <KBModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingEntry(null); }}
        onSave={handleSave}
        initialData={editingEntry ? {
          question: editingEntry.question,
          alt_questions: editingEntry.alt_questions || "",
          answer: editingEntry.answer,
          category: editingEntry.category,
          keywords: editingEntry.keywords,
          priority: editingEntry.priority ?? 5,
          related_tags: editingEntry.related_tags || "",
          icon: editingEntry.icon || "",
        } : null}
        categories={categories}
      />
    </div>
  );
}
