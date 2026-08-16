"use client";

import { useEffect, useState } from "react";
import { Plus, X, Edit3, Trash2, Upload, Image as ImageIcon, Star, Loader2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  keywords: string;
  imageUrl: string;
  badge: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

interface Props {
  token: () => string;
  clientId?: string;
}

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  category: "",
  keywords: "",
  imageUrl: "",
  badge: "",
  active: true,
  sortOrder: 0,
};

export default function ProductManager({ token, clientId }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

  function qs() {
    return clientId ? `?clientId=${encodeURIComponent(clientId)}` : "";
  }

  function load() {
    setLoading(true);
    fetch(`/api/products${qs()}`, { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setProducts(data); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [clientId]);

  function openNew() { setEditing(null); setForm(EMPTY_FORM); setError(""); setShowForm(true); }

  function openEdit(p: Product) {
    setEditing(p.id);
    setForm({ name: p.name, description: p.description, price: p.price, category: p.category, keywords: p.keywords, imageUrl: p.imageUrl, badge: p.badge, active: p.active, sortOrder: p.sortOrder });
    setError("");
    setShowForm(true);
  }

  async function handleUploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/products/upload-image", {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur d'upload"); return; }
      setForm((f) => ({ ...f, imageUrl: data.imageUrl }));
    } catch {
      setError("Erreur d'upload de l'image");
    }
    setUploading(false);
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) { setError("Nom du produit requis"); return; }
    setSaving(true);
    try {
      const body = { ...form, clientId };
      const res = await fetch(editing ? `/api/products/${editing}` : "/api/products", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur d'enregistrement"); setSaving(false); return; }
      setShowForm(false);
      load();
    } catch {
      setError("Erreur d'enregistrement");
    }
    setSaving(false);
  }

  async function handleDelete(p: Product) {
    if (!confirm(`Supprimer "${p.name}" ?`)) return;
    const res = await fetch(`/api/products/${p.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) load();
  }

  async function toggleActive(p: Product) {
    const res = await fetch(`/api/products/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ active: !p.active }),
    });
    if (res.ok) load();
  }

  const filtered = products.filter((p) =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.keywords || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="relative w-full max-w-xs">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un produit..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm bg-white/80 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" /></svg>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-200">
          <Plus size={16} /> Nouveau produit
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-4">Les produits actifs sont proposés automatiquement par le chatbot lorsque le visiteur demande le catalogue, les produits ou les prix. Chaque produit devient un chunk RAG "catalogue" (avec son image).</p>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl text-center py-16 text-gray-400 shadow-elevated">
          {products.length === 0 ? (
            <div><ImageIcon size={40} className="mx-auto mb-3 text-gray-300" /><p>Aucun produit.</p><p className="text-sm mt-1">Cliquez sur "Nouveau produit" pour commencer.</p></div>
          ) : "Aucun résultat."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <div key={p.id} className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden shadow-elevated hover:shadow-lg transition-all flex flex-col">
              <div className="relative aspect-video bg-gray-50 flex items-center justify-center overflow-hidden">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={40} className="text-gray-300" />
                )}
                {p.badge && (
                  <span className="absolute top-3 left-3 bg-amber-400 text-amber-950 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">{p.badge}</span>
                )}
                <button
                  onClick={() => toggleActive(p)}
                  className={`absolute top-3 right-3 flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm transition-all ${p.active ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500"}`}
                  title={p.active ? "Actif (proposé par le chatbot)" : "Inactif (masqué)"}
                >
                  <Star size={12} /> {p.active ? "Actif" : "Inactif"}
                </button>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{p.name}</h3>
                    {p.category && <p className="text-xs text-gray-400">{p.category}</p>}
                  </div>
                  {p.price && <span className="text-sm font-bold text-emerald-600 shrink-0">{p.price}</span>}
                </div>
                {p.description && <p className="text-sm text-gray-600 mt-1.5 line-clamp-2 leading-relaxed">{p.description}</p>}
                {p.keywords && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {p.keywords.split(",").map((k, i) => (
                      <span key={i} className="text-xs bg-emerald-50 px-2 py-0.5 rounded-full text-emerald-600 font-medium">{k.trim()}</span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">Ordre : {p.sortOrder}</span>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"><Edit3 size={15} /></button>
                    <button onClick={() => handleDelete(p)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 size={15} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">{editing ? "Modifier le produit" : "Nouveau produit"}</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

              <div className="flex gap-4">
                <div className="shrink-0">
                  <div className="w-32 h-24 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden">
                    {form.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={28} className="text-gray-300" />
                    )}
                  </div>
                  <label className={`flex items-center justify-center gap-1.5 mt-2 w-full text-xs font-medium rounded-lg px-2 py-1.5 cursor-pointer transition-all ${uploading ? "bg-gray-100 text-gray-400" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}>
                    {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} {form.imageUrl ? "Changer" : "Image"}
                    <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleUploadImage} disabled={uploading} />
                  </label>
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom du produit *</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prix</label>
                      <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="ex: 1 200 DA / kg" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Badge</label>
                      <input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="ex: Nouveau, Promo" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="Caractéristiques, conditionnement, usage..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                  <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="ex: Huiles" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mots-clés (recherche)</label>
                  <input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="séparés par des virgules" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ordre d'affichage</label>
                  <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: +e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
                    <span className="text-sm font-medium text-gray-700">Produit actif (proposé par le chatbot)</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:from-emerald-700 hover:to-emerald-600 transition-all disabled:opacity-50">
                  {saving && <Loader2 size={15} className="animate-spin" />} {editing ? "Enregistrer" : "Ajouter"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700 text-sm px-4">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
