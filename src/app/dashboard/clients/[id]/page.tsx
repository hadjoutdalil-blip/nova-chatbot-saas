"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import KBModal from "@/components/admin/KBModal";

const PLANS = [
  { id: "ecommerce", name: "Chatbot E-commerce", price: "$299/mois" },
  { id: "support", name: "Chatbot Support Client", price: "$399/mois" },
  { id: "realestate", name: "Chatbot Immobilier", price: "$499/mois" },
  { id: "custom", name: "Sur Mesure", price: "Devis" },
];

const PROVIDERS = [
  { id: "groq", name: "Groq", models: ["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "mixtral-8x7b-32768", "gemma2-9b-it"] },
  { id: "cerebras", name: "Cerebras", models: ["llama3.1-8b", "llama3.1-70b"] },
];

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

const TABS = [
  { id: "general", label: "Général" },
  { id: "ai", label: "IA" },
  { id: "stats", label: "Stats" },
  { id: "kb", label: "Base de connaissances" },
  { id: "widget", label: "Widget" },
  { id: "test", label: "Test" },
];

export default function EditClientPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState("general");
  const [form, setForm] = useState<any>(null);
  const [error, setError] = useState("");
  const [keyTest, setKeyTest] = useState<{ loading?: boolean; valid?: boolean; error?: string }>({});
  const [importing, setImporting] = useState(false);

  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [kbSearch, setKbSearch] = useState("");
  const [kbCatFilter, setKbCatFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KBEntry | null>(null);
  const [kbImporting, setKbImporting] = useState(false);

  const [widgetForm, setWidgetForm] = useState<any>(null);
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  function token() { return localStorage.getItem("token") || ""; }

  useEffect(() => {
    const t = token();
    fetch(`/api/clients/${id}`, { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((data) => setForm(data));
    loadKb();
  }, [id]);

  async function loadKb() {
    const t = token();
    const res = await fetch(`/api/kb?clientId=${id}`, { headers: { Authorization: `Bearer ${t}` } });
    if (res.ok) setEntries(await res.json());
  }

  const categories = useMemo(() => {
    const cats = new Set(entries.map((e) => e.category).filter(Boolean));
    return [...cats].sort();
  }, [entries]);

  const filtered = useMemo(() => {
    let out = entries;
    if (kbSearch) {
      const s = kbSearch.toLowerCase();
      out = out.filter((e) => e.question.toLowerCase().includes(s) || e.answer.toLowerCase().includes(s) || e.keywords.toLowerCase().includes(s));
    }
    if (kbCatFilter) out = out.filter((e) => e.category === kbCatFilter);
    return out;
  }, [entries, kbSearch, kbCatFilter]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch(`/api/clients/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }
    router.push("/dashboard/clients");
  }

  async function testKey() {
    setKeyTest({ loading: true });
    const res = await fetch("/api/chat/test-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: form.apiKey, provider: form.aiProvider }),
    });
    const data = await res.json();
    setKeyTest({ loading: false, valid: data.valid, error: data.error });
  }

  async function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const text = await file.text();
    const res = await fetch(`/api/clients/${id}/import-context`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    if (res.ok) {
      setForm({ ...form, siteContext: data.siteContext });
    } else {
      setError("Erreur lors de l'import");
    }
    setImporting(false);
    e.target.value = "";
  }

  async function handleKbSave(data: any) {
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
    await loadKb();
  }

  async function handleKbDelete(kid: string) {
    if (!confirm("Supprimer cette entrée ?")) return;
    await fetch(`/api/kb/${kid}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
    await loadKb();
  }

  function openEdit(e: KBEntry) {
    setEditingEntry(e);
    setModalOpen(true);
  }

  function openAdd() {
    setEditingEntry(null);
    setModalOpen(true);
  }

  function handleExport() {
    window.open(`/api/kb/export?clientId=${id}`, "_blank");
  }

  async function handleKbImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setKbImporting(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("Format invalide");
      await fetch("/api/kb/import-kb", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ clientId: id, entries: parsed, replace: true }),
      });
      await loadKb();
    } catch { setError("Erreur d'import"); }
    setKbImporting(false);
    e.target.value = "";
  }

  async function loadWidget() {
    if (!form?.slug) return;
    const res = await fetch(`/api/widget/${form.slug}`, { cache: "no-store" });
    const data = await res.json();
    if (data.widgetConfig) {
      setWidgetForm(data.widgetConfig);
    } else {
      setWidgetForm({
        welcomeTitle: "Bienvenue !",
        welcomeSub: "Comment puis-je vous aider ?",
        showBrand: true,
        position: "right",
        marginBottom: 20,
        marginRight: 20,
      });
    }
    setWidgetLoaded(true);
  }

  useEffect(() => {
    if (tab === "widget" && !widgetLoaded && form?.slug) loadWidget();
  }, [tab, form, widgetLoaded]);

  async function handleWidgetSave(e: React.FormEvent) {
    e.preventDefault();
    const t = token();
    const hasConfig = widgetForm?.id != null;
    const method = hasConfig ? "PUT" : "POST";
    await fetch("/api/widget", {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ ...widgetForm, clientId: id }),
    });
    setWidgetLoaded(false);
    await loadWidget();
  }

  const models = PROVIDERS.find((p) => p.id === form?.aiProvider)?.models || PROVIDERS[0].models;

  if (!form) return <p className="text-gray-500">Chargement...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{form.name}</h1>
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">{form.plan}</span>
        </div>
      </div>

      <div className="flex gap-1 mb-6 border-b overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`text-sm px-4 py-3 font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id ? "border-purple-600 text-purple-700" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {/* ── General ── */}
      {tab === "general" && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 max-w-2xl space-y-6">
          <h2 className="font-semibold text-lg border-b pb-2">Informations générales</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Pack</label>
            <select value={form.plan || "custom"} onChange={(e) => setForm({ ...form, plan: e.target.value })} className="w-full border rounded-lg px-3 py-2">
              {PLANS.map((p) => (<option key={p.id} value={p.id}>{p.name} ({p.price})</option>))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nom</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Logo (URL)</label>
              <input value={form.logo || ""} onChange={(e) => setForm({ ...form, logo: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Couleur primaire</label>
              <input type="color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} className="w-full h-10 rounded-lg border cursor-pointer" />
            </div>
          </div>

          <h2 className="font-semibold text-lg border-b pb-2">Contexte entreprise</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Contexte du site</label>
            <textarea value={form.siteContext || ""} onChange={(e) => setForm({ ...form, siteContext: e.target.value })} rows={4} className="w-full border rounded-lg px-3 py-2" placeholder="Décrivez l'activité de l'entreprise, ses services, son public cible..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Importer un fichier de contexte</label>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-purple-300 transition cursor-pointer" onClick={() => document.getElementById("ctx-file")?.click()}>
              {importing ? (
                <p className="text-sm text-gray-500">Import en cours...</p>
              ) : (
                <>
                  <p className="text-sm text-gray-500 mb-1">Glissez ou cliquez pour importer</p>
                  <p className="text-xs text-gray-400">.txt, .docx ou .pdf</p>
                </>
              )}
              <input id="ctx-file" type="file" accept=".txt,.docx,.pdf" className="hidden" onChange={handleFileImport} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700">Enregistrer</button>
          </div>
        </form>
      )}

      {/* ── AI Config ── */}
      {tab === "ai" && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 max-w-2xl space-y-6">
          <h2 className="font-semibold text-lg border-b pb-2">Configuration IA</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fournisseur</label>
              <select value={form.aiProvider} onChange={(e) => setForm({ ...form, aiProvider: e.target.value, aiModel: "" })} className="w-full border rounded-lg px-3 py-2">
                {PROVIDERS.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Modèle</label>
              <select value={form.aiModel} onChange={(e) => setForm({ ...form, aiModel: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                <option value="">— Sélectionner —</option>
                {models.map((m) => (<option key={m} value={m}>{m}</option>))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Clé API</label>
            <div className="flex gap-2">
              <input value={form.apiKey} onChange={(e) => { setForm({ ...form, apiKey: e.target.value }); setKeyTest({}); }} type="password" className="flex-1 border rounded-lg px-3 py-2" />
              <button type="button" onClick={testKey} disabled={keyTest.loading || !form.apiKey} className="text-sm px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50">
                {keyTest.loading ? "Test..." : "Tester"}
              </button>
            </div>
            {keyTest.valid === true && <p className="text-green-600 text-xs mt-1">✓ Clé valide ({form.aiProvider})</p>}
            {keyTest.valid === false && <p className="text-red-500 text-xs mt-1">✗ {keyTest.error}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Seuil de confiance KB : {form.kbThreshold ?? 60}%</label>
            <input type="range" min={10} max={100} value={form.kbThreshold ?? 60} onChange={(e) => setForm({ ...form, kbThreshold: +e.target.value })} className="w-full" />
            <div className="flex justify-between text-xs text-gray-400"><span>10%</span><span>100%</span></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Relance IA</label>
              <select value={form.relanceActive ? "true" : "false"} onChange={(e) => setForm({ ...form, relanceActive: e.target.value === "true" })} className="w-full border rounded-lg px-3 py-2">
                <option value="true">Active</option>
                <option value="false">Désactivée</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Texte de relance personnalisé (optionnel)</label>
            <textarea value={form.relanceText || ""} onChange={(e) => setForm({ ...form, relanceText: e.target.value })} rows={2} className="w-full border rounded-lg px-3 py-2" placeholder="Exemple : Souhaitez-vous que je vous donne plus de détails sur ce sujet ?" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700">Enregistrer</button>
          </div>
        </form>
      )}

      {/* ── Stats ── */}
      {tab === "stats" && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">Entrées KB</p>
            <p className="text-3xl font-bold">{entries.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">Catégories</p>
            <p className="text-3xl font-bold">{categories.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500">Priorité moyenne</p>
            <p className="text-3xl font-bold">
              {entries.length > 0 ? (entries.reduce((a, e) => a + (e.priority ?? 5), 0) / entries.length).toFixed(1) : "-"}
            </p>
          </div>
        </div>
      )}

      {/* ── KB ── */}
      {tab === "kb" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-3 flex-1">
              <input value={kbSearch} onChange={(e) => setKbSearch(e.target.value)} placeholder="Rechercher..." className="flex-1 border rounded-lg px-3 py-2 text-sm max-w-xs" />
              <select value={kbCatFilter} onChange={(e) => setKbCatFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
                <option value="">Toutes catégories</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={handleExport} className="text-sm border rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50">Exporter</button>
              <label className="text-sm border rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50 cursor-pointer">
                {kbImporting ? "Import..." : "Importer"}
                <input type="file" accept=".json" className="hidden" onChange={handleKbImport} disabled={kbImporting} />
              </label>
            </div>
            <button onClick={openAdd} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 shrink-0">+ Ajouter</button>
          </div>

          {filtered.length === 0 ? (
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
                      <button onClick={() => handleKbDelete(e.id)} className="text-red-500 hover:underline text-xs">Supprimer</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <KBModal
            open={modalOpen}
            onClose={() => { setModalOpen(false); setEditingEntry(null); }}
            onSave={handleKbSave}
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
      )}

      {/* ── Widget ── */}
      {tab === "widget" && (
        <div className="max-w-lg">
          {form.slug && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium text-green-800 mb-2">Code d'intégration</p>
              <code className="text-xs bg-white px-3 py-2 rounded border block break-all select-all">{`<script src="${typeof window !== "undefined" ? window.location.origin : ""}/api/widget/${form.slug}/embed"></script>`}</code>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm p-6">
            {widgetLoaded && widgetForm ? (
              <form onSubmit={handleWidgetSave} className="space-y-4">
                <h2 className="font-semibold text-lg border-b pb-2">Configuration du widget</h2>
                <div>
                  <label className="block text-sm font-medium mb-1">Titre de bienvenue</label>
                  <input value={widgetForm.welcomeTitle} onChange={(e) => setWidgetForm({ ...widgetForm, welcomeTitle: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sous-titre</label>
                  <input value={widgetForm.welcomeSub} onChange={(e) => setWidgetForm({ ...widgetForm, welcomeSub: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Position</label>
                    <select value={widgetForm.position} onChange={(e) => setWidgetForm({ ...widgetForm, position: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                      <option value="right">Droite</option>
                      <option value="left">Gauche</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Marge bas (px)</label>
                    <input type="number" value={widgetForm.marginBottom} onChange={(e) => setWidgetForm({ ...widgetForm, marginBottom: +e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Marge {widgetForm.position === "right" ? "droite" : "gauche"} (px)</label>
                    <input type="number" value={widgetForm.marginRight} onChange={(e) => setWidgetForm({ ...widgetForm, marginRight: +e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                  </div>
                </div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={widgetForm.showBrand} onChange={(e) => setWidgetForm({ ...widgetForm, showBrand: e.target.checked })} className="rounded" />
                  <span className="text-sm">Afficher "Propulsé par Nova"</span>
                </label>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-purple-700">Enregistrer</button>
                </div>
              </form>
            ) : (
              <p className="text-gray-500 text-sm">Chargement...</p>
            )}
          </div>
        </div>
      )}

      {/* ── Test ── */}
      {tab === "test" && (
        <div>
          <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
            <h2 className="font-semibold text-lg mb-4">Tester le chatbot</h2>
            <p className="text-gray-600 text-sm mb-4">Accédez à la page de test complète avec un aperçu réaliste du chatbot sur une landing page générique.</p>
            <div className="flex gap-3">
              <a
                href={`/dashboard/clients/${id}/test`}
                className="bg-purple-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 inline-block"
              >
                Ouvrir la page de test
              </a>
              {form.slug && (
                <a
                  href={`/api/widget/${form.slug}/embed`}
                  target="_blank"
                  className="border px-6 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 inline-block"
                >
                  Voir le script embed
                </a>
              )}
            </div>

            <div className="mt-6 border-t pt-6">
              <h3 className="font-medium text-sm mb-3">Aperçu rapide</h3>
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border">
                <div className="flex items-center gap-3 mb-4">
                  {form.logo ? (
                    <img src={form.logo} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-lg">🤖</div>
                  )}
                  <div>
                    <p className="font-semibold text-sm">{form.name}</p>
                    <p className="text-xs text-gray-500">Assistant virtuel</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">Le chatbot apparaît en bas à droite sur le site de {form.name}.</p>
                <p className="text-xs text-gray-400">Endpoint : <code className="text-purple-600">/api/chat/{form.slug}</code></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
