"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface KBEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string;
}

export default function ClientKBPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ question: "", answer: "", category: "", keywords: "" });
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");

  function token() { return localStorage.getItem("token") || ""; }

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const url = editing ? `/api/kb/${editing}` : "/api/kb";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify(editing ? form : { ...form, clientId: id }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error); return; }
    setForm({ question: "", answer: "", category: "", keywords: "" });
    setEditing(null);
    load();
  }

  function handleEdit(e: KBEntry) {
    setForm({ question: e.question, answer: e.answer, category: e.category, keywords: e.keywords });
    setEditing(e.id);
  }

  async function handleDelete(kid: string) {
    if (!confirm("Supprimer cette entrée ?")) return;
    await fetch(`/api/kb/${kid}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
    load();
  }

  function handleCancel() {
    setForm({ question: "", answer: "", category: "", keywords: "" });
    setEditing(null);
    setError("");
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/clients" className="text-gray-400 hover:text-gray-600 text-sm">&larr; Clients</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold">{client?.name || "..."}</h1>
      </div>

      <div className="flex gap-2 mb-6">
        <Link href={`/dashboard/clients/${id}`} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">Modifier</Link>
        <Link href={`/dashboard/clients/${id}/kb`} className="text-sm px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 font-medium">Base connaissances</Link>
        <Link href={`/dashboard/clients/${id}/widget`} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">Widget</Link>
        <Link href={`/dashboard/clients/${id}/test`} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">Tester</Link>
      </div>

      <p className="text-gray-500 mb-6">Gérez la base de connaissances de {client?.name}.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 mb-6 max-w-2xl space-y-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <h2 className="font-semibold text-lg">{editing ? "Modifier" : "Nouvelle entrée"}</h2>
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
            <label className="block text-sm font-medium mb-1">Mots-clés</label>
            <input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-purple-700">
            {editing ? "Enregistrer" : "Ajouter"}
          </button>
          {editing && <button type="button" onClick={handleCancel} className="text-gray-500 hover:text-gray-700 text-sm">Annuler</button>}
        </div>
      </form>

      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : entries.length === 0 ? (
        <p className="text-gray-400 text-center py-8 bg-white rounded-xl">Aucune entrée pour ce client.</p>
      ) : (
        <div className="space-y-3">
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
