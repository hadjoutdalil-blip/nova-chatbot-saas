"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Building2, Brain, BarChart3, BookOpen, FlaskConical, CheckSquare,
  Download, Plus, Search, FileText, Inbox, Edit3, Trash2, Thermometer, Layers, PanelRightClose,
  Globe, MessageSquare, ThumbsUp,
} from "lucide-react";
import { Tabs, Button, Card, Input, Badge, StatCard } from "@/components/ui";
import KBModal from "@/components/admin/KBModal";

const PLANS = [
  { id: "ecommerce", name: "Chatbot E-commerce", price: "$299/mois" },
  { id: "support", name: "Chatbot Support Client", price: "$399/mois" },
  { id: "realestate", name: "Chatbot Immobilier", price: "$499/mois" },
  { id: "custom", name: "Sur Mesure", price: "Devis" },
];

const PROVIDERS = [
  { id: "groq", name: "Groq (gratuit)", models: ["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "mixtral-8x7b-32768", "gemma2-9b-it"] },
  { id: "cerebras", name: "Cerebras (gratuit)", models: ["llama3.1-8b", "llama3.1-70b"] },
  { id: "xai", name: "xAI Grok", models: ["grok-2-latest", "grok-3-beta"] },
  { id: "gemini", name: "Google Gemini", models: ["gemini-2.5-flash"] },
];

interface KBEntry {
  id: string;
  tag?: string;
  question: string;
  alt_questions: string;
  short_resp?: string;
  answer: string;
  category: string;
  keywords: string;
  priority: number;
  related_tags: string;
  icon: string;
}

interface AnalyticsData {
  conversations: { total: number };
  connectionsByLocation: { country: string; city: string; count: number }[];
  satisfaction: { total: number; avgRating: number; distribution: Record<string, number> };
  recentConversations: {
    id: string; title: string; country: string; city: string;
    messages: { role: string; content: string }[];
    createdAt: string;
  }[];
}

const TABS = [
  { id: "general", label: "Général", icon: <Building2 size={16} /> },
  { id: "ai", label: "IA", icon: <Brain size={16} /> },
  { id: "stats", label: "Stats", icon: <BarChart3 size={16} /> },
  { id: "analytics", label: "Analytiques", icon: <BarChart3 size={16} /> },
  { id: "kb", label: "Base de connaissances", icon: <BookOpen size={16} /> },
  { id: "test", label: "Test", icon: <FlaskConical size={16} /> },
  { id: "evaluation", label: "Évaluation", icon: <CheckSquare size={16} /> },
];

export default function EditClientPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState("general");
  const [form, setForm] = useState<any>(null);
  const [error, setError] = useState("");
  const [keyTest, setKeyTest] = useState<{ loading?: boolean; valid?: boolean; error?: string }>({});
  const [importing, setImporting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [kbSearch, setKbSearch] = useState("");
  const [kbCatFilter, setKbCatFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KBEntry | null>(null);
  const [kbImporting, setKbImporting] = useState(false);

  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // widget tab removed — config gérée depuis /app/widget

  function token() { return localStorage.getItem("token") || ""; }

  useEffect(() => {
    const t = token();
    fetch(`/api/clients/${id}`, { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((data) => setForm(data));
    loadKb();
  }, [id]);

  useEffect(() => {
    if (tab !== "analytics" || !id) return;
    setAnalyticsLoading(true);
    fetch(`/api/clients/${id}/analytics`)
      .then((r) => r.json())
      .then((data) => setAnalytics(data))
      .catch(() => setAnalytics(null))
      .finally(() => setAnalyticsLoading(false));
  }, [tab, id]);

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

  const stats = useMemo(() => ({
    entries: entries.length,
    categories: categories.length,
    avgPriority: entries.length > 0 ? (entries.reduce((a, e) => a + (e.priority ?? 5), 0) / entries.length).toFixed(1) : "-",
  }), [entries, categories]);

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
      body: JSON.stringify({ text, fileName: file.name }),
    });
    const data = await res.json();
    if (res.ok) setForm({ ...form, siteContext: data.siteContext });
    else setError("Erreur lors de l'import");
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

  async function handleExport() {
    const res = await fetch(`/api/kb/export?clientId=${id}`, { headers: { Authorization: `Bearer ${token()}` } });
    if (!res.ok) { const d = await res.json(); alert(d.error || "Erreur"); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "kb-export.json"; a.click();
    URL.revokeObjectURL(url);
  }

  async function handleExportPDF() {
    const res = await fetch(`/api/kb/export-pdf?clientId=${id}`, { headers: { Authorization: `Bearer ${token()}` } });
    if (!res.ok) { const d = await res.json(); alert(d.error || "Erreur"); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "kb-export.pdf"; a.click();
    URL.revokeObjectURL(url);
  }

  async function handleKbImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setKbImporting(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("Format invalide");
      const replace = entries.length > 0 && confirm(`${parsed.length} entrées trouvées. Remplacer toute la base (${entries.length} entrées existantes) ? "Annuler" = ajouter.`);
      const res = await fetch("/api/kb/import-kb", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ clientId: id, entries: parsed, replace }),
      });
      if (res.ok) await loadKb();
    } catch { setError("Erreur d'import"); }
    setKbImporting(false);
    e.target.value = "";
  }

  const models = PROVIDERS.find((p) => p.id === form?.aiProvider)?.models || PROVIDERS[0].models;

  if (!form) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center animate-fadeIn">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center mx-auto mb-3">
          <span className="text-xl animate-spin">⏳</span>
        </div>
        <p className="text-gray-400 text-sm">Chargement...</p>
      </div>
    </div>
  );

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{form.name}</h1>
          <Badge variant="purple">{form.plan}</Badge>
        </div>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-2.5 mt-4 flex items-center gap-2">
          <span className="text-red-500 text-sm">✕</span>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="mt-6">
        {/* ── General ── */}
        {tab === "general" && (
          <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
            <Card>
              <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-50">
                <Building2 size={18} className="text-purple-600" />
                <h2 className="font-semibold text-gray-900">Informations générales</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Pack</label>
                  <select
                    value={form.plan || "custom"}
                    onChange={(e) => setForm({ ...form, plan: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all duration-150"
                  >
                    {PLANS.map((p) => (<option key={p.id} value={p.id}>{p.name} ({p.price})</option>))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Nom" id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  <Input label="Slug" id="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Logo (URL)" id="logo" value={form.logo || ""} onChange={(e) => setForm({ ...form, logo: e.target.value })} />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Couleur primaire</label>
                    <input type="color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} className="w-full h-10 rounded-xl border border-gray-200 cursor-pointer bg-white" />
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-50">
                <FileText size={18} className="text-purple-600" />
                <h2 className="font-semibold text-gray-900">Contexte entreprise</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Contexte du site</label>
                  <textarea
                    value={form.siteContext || ""}
                    onChange={(e) => setForm({ ...form, siteContext: e.target.value })}
                    rows={4}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all duration-150"
                    placeholder="Décrivez l'activité de l'entreprise, ses services, son public cible..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Importer un fichier de contexte</label>
                  <div
                    className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-purple-300 hover:bg-purple-50/30 transition-all duration-150 cursor-pointer group"
                    onClick={() => document.getElementById("ctx-file")?.click()}
                  >
                    {importing ? (
                      <p className="text-sm text-gray-500">Import en cours...</p>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-2 group-hover:bg-purple-50 transition-colors">
                          <span className="text-lg">📄</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-0.5">Glissez ou cliquez pour importer</p>
                        <p className="text-xs text-gray-400">.txt, .docx ou .pdf</p>
                      </>
                    )}
                    <input id="ctx-file" type="file" accept=".txt,.docx,.pdf" className="hidden" onChange={handleFileImport} />
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex gap-3">
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        )}

        {/* ── AI Config ── */}
        {tab === "ai" && (
          <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
            <Card>
              <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-50">
                <Brain size={18} className="text-purple-600" />
                <h2 className="font-semibold text-gray-900">Configuration IA</h2>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Fournisseur</label>
                    <select
                      value={form.aiProvider}
                      onChange={(e) => setForm({ ...form, aiProvider: e.target.value, aiModel: "" })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all duration-150"
                    >
                      {PROVIDERS.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Modèle</label>
                    <select
                      value={form.aiModel}
                      onChange={(e) => setForm({ ...form, aiModel: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all duration-150"
                    >
                      <option value="">— Sélectionner —</option>
                      {models.map((m) => (<option key={m} value={m}>{m}</option>))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Clé API (détection auto)</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={form.apiKey}
                      onChange={(e) => { setForm({ ...form, apiKey: e.target.value }); setKeyTest({}); }}
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all duration-150"
                    />
                    <Button variant="secondary" type="button" onClick={testKey} disabled={keyTest.loading || !form.apiKey}>
                      {keyTest.loading ? "Test..." : "Tester"}
                    </Button>
                  </div>
                  {keyTest.valid === true && <p className="text-green-600 text-xs mt-1.5">✓ Clé valide ({form.aiProvider})</p>}
                  {keyTest.valid === false && <p className="text-red-500 text-xs mt-1.5">✗ {keyTest.error}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Seuil QA (N1) : <span className="text-purple-600 font-semibold">{form.kbThreshold ?? 80}%</span>
                    </label>
                    <input
                      type="range" min={10} max={100}
                      value={form.kbThreshold ?? 80}
                      onChange={(e) => setForm({ ...form, kbThreshold: +e.target.value })}
                      className="w-full accent-purple-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1"><span>10%</span><span>100%</span></div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Seuil RAG (N2) : <span className="text-purple-600 font-semibold">{form.ragThreshold ?? 72}%</span>
                    </label>
                    <input
                      type="range" min={10} max={100}
                      value={form.ragThreshold ?? 72}
                      onChange={(e) => setForm({ ...form, ragThreshold: +e.target.value })}
                      className="w-full accent-purple-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1"><span>10%</span><span>100%</span></div>
                  </div>
                </div>
                <div>
                  <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium">
                    <Thermometer size={14} /> Paramètres avancés {showAdvanced ? "▲" : "▼"}
                  </button>
                </div>
                {showAdvanced && (
                  <div className="space-y-4 pl-4 border-l-2 border-purple-100">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Temp. QA (N1)</label>
                        <input type="number" step={0.01} min={0} max={1} value={form.tempQA ?? 0.05} onChange={(e) => setForm({ ...form, tempQA: +e.target.value })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Temp. RAG (N2)</label>
                        <input type="number" step={0.01} min={0} max={1} value={form.tempRAG ?? 0.10} onChange={(e) => setForm({ ...form, tempRAG: +e.target.value })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Temp. Escalade (N3)</label>
                        <input type="number" step={0.01} min={0} max={1} value={form.tempEscalade ?? 0.20} onChange={(e) => setForm({ ...form, tempEscalade: +e.target.value })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Taille chunk (car.)</label>
                        <input type="number" min={100} max={5000} step={100} value={form.chunkSize ?? 500} onChange={(e) => setForm({ ...form, chunkSize: +e.target.value })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Top N chunks RAG</label>
                        <input type="number" min={1} max={20} value={form.topNChunks ?? 3} onChange={(e) => setForm({ ...form, topNChunks: +e.target.value })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Relance IA</label>
                  <select
                    value={form.relanceActive ? "true" : "false"}
                    onChange={(e) => setForm({ ...form, relanceActive: e.target.value === "true" })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all duration-150"
                  >
                    <option value="true">Active</option>
                    <option value="false">Désactivée</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Texte de relance personnalisé (optionnel)</label>
                  <textarea
                    value={form.relanceText || ""}
                    onChange={(e) => setForm({ ...form, relanceText: e.target.value })}
                    rows={2}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all duration-150"
                    placeholder="Exemple : Souhaitez-vous que je vous donne plus de détails sur ce sujet ?"
                  />
                </div>
              </div>
            </Card>
            <div className="flex gap-3">
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        )}

        {/* ── Stats ── */}
        {tab === "stats" && (
          <div className="grid grid-cols-3 gap-5">
            <StatCard label="Entrées KB" value={stats.entries} icon={BookOpen} color="from-purple-500 to-purple-400" />
            <StatCard label="Catégories" value={stats.categories} icon={BarChart3} color="from-blue-500 to-blue-400" />
            <StatCard label="Priorité moyenne" value={stats.avgPriority} icon={BarChart3} color="from-emerald-500 to-emerald-400" />
          </div>
        )}

        {/* ── Analytics ── */}
        {tab === "analytics" && (
          <div className="space-y-6">
            {analyticsLoading && (
              <div className="flex items-center justify-center py-12">
                <p className="text-gray-400 text-sm">Chargement des données...</p>
              </div>
            )}
            {!analyticsLoading && !analytics && (
              <Card padding="lg" className="text-center">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                  <BarChart3 size={24} className="text-gray-400" />
                </div>
                <p className="text-gray-400 text-sm">Aucune donnée disponible.</p>
              </Card>
            )}
            {analytics && (
              <>
                <div className="grid grid-cols-3 gap-5">
                  <StatCard label="Conversations" value={analytics.conversations.total} icon={MessageSquare} color="from-purple-500 to-purple-400" />
                  <StatCard label="Taux satisfaction" value={analytics.satisfaction.total > 0 ? `${analytics.satisfaction.avgRating}/5` : "—"} icon={ThumbsUp} color="from-emerald-500 to-emerald-400" />
                  <StatCard label="Localisations" value={analytics.connectionsByLocation.length} icon={Globe} color="from-blue-500 to-blue-400" />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-50">
                      <Globe size={18} className="text-blue-600" />
                      <h2 className="font-semibold text-gray-900">Connexions par localisation</h2>
                    </div>
                    {analytics.connectionsByLocation.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-6">Aucune donnée de localisation.</p>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {analytics.connectionsByLocation.map((loc: any, i: number) => (
                          <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{loc.country === "Inconnu" && loc.city === "Inconnu" ? "🌍" : "📍"}</span>
                              <span className="text-sm text-gray-700">
                                {loc.city !== "Inconnu" ? loc.city : ""}{loc.city !== "Inconnu" && loc.country !== "Inconnu" ? ", " : ""}{loc.country !== "Inconnu" ? loc.country : "Inconnu"}
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-gray-900">{loc.count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  <Card>
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-50">
                      <ThumbsUp size={18} className="text-emerald-600" />
                      <h2 className="font-semibold text-gray-900">Satisfaction par vote</h2>
                    </div>
                    {analytics.satisfaction.total === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-6">Aucun vote utilisateur.</p>
                    ) : (
                      <div className="space-y-3">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = analytics.satisfaction.distribution[String(star)] || 0;
                          const pct = analytics.satisfaction.total > 0 ? (count / analytics.satisfaction.total) * 100 : 0;
                          const colors = ["", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-lime-400", "bg-emerald-400"];
                          const labels = ["", "Très mauvais", "Mauvais", "Moyen", "Bien", "Excellent"];
                          return (
                            <div key={star} className="flex items-center gap-3">
                              <span className="text-sm font-medium w-24 text-gray-600">{labels[star]}</span>
                              <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-300 ${colors[star]}`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-sm font-semibold text-gray-900 w-10 text-right">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                </div>

                <Card>
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-50">
                    <MessageSquare size={18} className="text-purple-600" />
                    <h2 className="font-semibold text-gray-900">Conversations récentes</h2>
                  </div>
                  {analytics.recentConversations.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-6">Aucune conversation.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-500 border-b border-gray-100">
                            <th className="pb-2 font-medium">Titre</th>
                            <th className="pb-2 font-medium">Localisation</th>
                            <th className="pb-2 font-medium">Messages</th>
                            <th className="pb-2 font-medium">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.recentConversations.map((c: any) => (
                            <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                              <td className="py-2.5 pr-4">
                                <span className="text-gray-900 font-medium truncate block max-w-[200px]">{c.title || "Sans titre"}</span>
                              </td>
                              <td className="py-2.5 pr-4">
                                <span className="text-gray-500 text-xs">
                                  {[c.city, c.country].filter(Boolean).join(", ") || "—"}
                                </span>
                              </td>
                              <td className="py-2.5 pr-4">
                                <span className="text-gray-700">{c.messages?.length || 0}</span>
                              </td>
                              <td className="py-2.5">
                                <span className="text-gray-400 text-xs">{new Date(c.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </>
            )}
          </div>
        )}

        {/* ── KB ── */}
        {tab === "kb" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-3 flex-1">
                <div className="relative flex-1 max-w-xs">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={kbSearch}
                    onChange={(e) => setKbSearch(e.target.value)}
                    placeholder="Rechercher..."
                    className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all duration-150"
                  />
                </div>
                <select
                  value={kbCatFilter}
                  onChange={(e) => setKbCatFilter(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all duration-150"
                >
                  <option value="">Toutes catégories</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <Button variant="secondary" onClick={handleExportPDF}>
                  <FileText size={14} />
                  Exporter PDF
                </Button>
                <Button variant="secondary" onClick={handleExport}>
                  <Download size={14} />
                  Exporter JSON
                </Button>
                <label className="cursor-pointer">
                  <span className="inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 bg-white text-gray-700 border border-gray-200 shadow-sm hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 text-sm rounded-xl">
                    {kbImporting ? "Import..." : "Importer"}
                  </span>
                  <input type="file" accept=".json" className="hidden" onChange={handleKbImport} disabled={kbImporting} />
                </label>
              </div>
              <Button onClick={openAdd}>
                <Plus size={16} />
                Ajouter
              </Button>
            </div>

            {filtered.length === 0 ? (
              <Card padding="lg" className="text-center">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                  {entries.length === 0 ? <Inbox size={24} className="text-gray-400" /> : <Search size={24} className="text-gray-400" />}
                </div>
                <p className="text-gray-400 text-sm">
                  {entries.length === 0 ? "Aucune entrée pour ce client." : "Aucun résultat."}
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filtered.map((e) => (
                  <Card key={e.id} padding="sm" hover>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {e.icon && <span className="mr-1.5">{e.icon}</span>}
                          {e.question}
                        </h3>
                        {e.short_resp && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{e.short_resp}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-1.5 whitespace-pre-wrap line-clamp-2 leading-relaxed">{e.answer}</p>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {e.category && <Badge>{e.category}</Badge>}
                          {e.keywords && <Badge variant="purple">{e.keywords}</Badge>}
                          <Badge variant={(e.priority ?? 5) >= 7 ? "red" : (e.priority ?? 5) >= 4 ? "yellow" : "default"}>
                            P{e.priority ?? 5}
                          </Badge>
                          {e.alt_questions && (
                            <Badge variant="blue" title={e.alt_questions}>
                              +{e.alt_questions.split("||").length} var.
                            </Badge>
                          )}
                          {e.related_tags && <Badge variant="green">{e.related_tags}</Badge>}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(e)}>
                          <Edit3 size={12} />
                          Modifier
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleKbDelete(e.id)}>
                          <Trash2 size={12} />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <KBModal
              open={modalOpen}
              onClose={() => { setModalOpen(false); setEditingEntry(null); }}
              onSave={handleKbSave}
              initialData={editingEntry ? {
                tag: editingEntry.tag || "",
                question: editingEntry.question,
                alt_questions: editingEntry.alt_questions || "",
                short_resp: editingEntry.short_resp || "",
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
        {/* ── Test ── */}
        {tab === "test" && (
          <div className="max-w-2xl">
            <Card>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-50">
                <FlaskConical size={18} className="text-purple-600" />
                <h2 className="font-semibold text-gray-900">Tester le chatbot</h2>
              </div>
              <p className="text-gray-500 text-sm mb-5 leading-relaxed">
                Accédez à la page de test complète avec un aperçu réaliste du chatbot sur une landing page générique.
              </p>
              <div className="flex gap-3">
                <a
                  href={`/dashboard/clients/${id}/test`}
                  className="inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 bg-purple-600 text-white shadow-sm hover:bg-purple-700 active:bg-purple-800 px-6 py-2.5 text-sm rounded-xl"
                >
                  Ouvrir la page de test
                </a>
                {form.slug && (
                  <a
                    href={`/api/widget/${form.slug}/embed`}
                    target="_blank"
                    className="inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 bg-white text-gray-700 border border-gray-200 shadow-sm hover:bg-gray-50 active:bg-gray-100 px-6 py-2.5 text-sm rounded-xl"
                  >
                    Voir le script embed
                  </a>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="font-medium text-sm text-gray-700 mb-4">Aperçu rapide</h3>
                <div className="bg-gradient-to-br from-purple-50/80 via-white to-blue-50/80 rounded-xl p-6 border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    {form.logo ? (
                      <img src={form.logo} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center shadow-sm">
                        <span className="text-lg">🤖</span>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{form.name}</p>
                      <p className="text-xs text-gray-400">Assistant virtuel</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">
                    Le chatbot est configurable par le client depuis son espace.
                  </p>
                  <p className="text-xs text-gray-400">
                    Endpoint : <code className="text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded font-mono">/api/chat/{form.slug}</code>
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
        {/* ── Évaluation ── */}
        {tab === "evaluation" && (
          <div className="max-w-2xl">
            <Card>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-50">
                <CheckSquare size={18} className="text-purple-600" />
                <h2 className="font-semibold text-gray-900">Évaluation des réponses</h2>
              </div>
              <p className="text-gray-500 text-sm mb-5 leading-relaxed">
                Analyse des questions/réponses avec leurs scores de correspondance KB. Permet d&apos;identifier les questions mal matchées.
              </p>
              <div className="flex gap-3">
                <a
                  href={`/dashboard/clients/${id}/evaluation`}
                  className="inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 bg-purple-600 text-white shadow-sm hover:bg-purple-700 active:bg-purple-800 px-6 py-2.5 text-sm rounded-xl"
                >
                  Ouvrir la page d&apos;évaluation
                </a>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
