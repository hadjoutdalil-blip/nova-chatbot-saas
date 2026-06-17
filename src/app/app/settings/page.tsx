"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, TestTube, LogOut, Brain, Key, SlidersHorizontal, MessageSquareText, Building2, Thermometer, Layers, PanelRightClose, Upload, FileText, Trash2 } from "lucide-react";

const PROVIDERS = [
  { id: "groq", name: "Groq (gratuit)", models: ["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "mixtral-8x7b-32768", "gemma2-9b-it"] },
  { id: "cerebras", name: "Cerebras (gratuit)", models: ["llama3.1-8b", "llama3.1-70b"] },
  { id: "xai", name: "xAI Grok", models: ["grok-2-latest", "grok-3-beta"] },
];

export default function AppSettingsPage() {
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [form, setForm] = useState<any>(null);
  const [keyTest, setKeyTest] = useState<{ loading?: boolean; valid?: boolean; error?: string }>({});
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  function token() { return localStorage.getItem("token") || ""; }

  useEffect(() => {
    fetch("/api/clients", { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((clients) => {
        const payload = JSON.parse(atob(token().split(".")[1]));
        const c = clients.find((c: any) => c.id === payload.clientId);
        if (c) { setClient(c); setForm({ ...c }); }
      });
    fetch("/api/client-documents", { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then(setDocuments);
  }, []);

  async function handleSave() {
    if (!form || !client) return;
    setSaving(true);
    const res = await fetch(`/api/clients/${client.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({
        apiKey: form.apiKey,
        aiProvider: form.aiProvider,
        aiModel: form.aiModel,
        kbThreshold: form.kbThreshold,
        ragThreshold: form.ragThreshold,
        tempQA: form.tempQA,
        tempRAG: form.tempRAG,
        tempEscalade: form.tempEscalade,
        chunkSize: form.chunkSize,
        topNChunks: form.topNChunks,
        relanceActive: form.relanceActive,
        relanceText: form.relanceText,
        siteContext: form.siteContext,
      }),
    });
    setSaving(false);
    if (res.ok) alert("Configuration enregistrée");
  }

  async function testKey() {
    setKeyTest({ loading: true });
    const res = await fetch("/api/chat/test-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: form.apiKey }),
    });
    const data = await res.json();
    setKeyTest({ loading: false, valid: data.valid, error: data.error });
  }

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

  if (!form) return <div className="text-center py-20 text-gray-400">Chargement...</div>;

  const models = PROVIDERS.find((p) => p.id === form.aiProvider)?.models || PROVIDERS[0].models;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Paramètres</h1>
      <p className="text-gray-500 mb-8">Configurez l&apos;intelligence artificielle de votre chatbot.</p>

      <div className="space-y-5 max-w-2xl">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-elevated p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
            <Brain size={18} className="text-purple-600" />
            <h2 className="font-semibold text-gray-900">Configuration IA</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Fournisseur</label>
              <select value={form.aiProvider} onChange={(e) => setForm({ ...form, aiProvider: e.target.value, aiModel: "" })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all">
                {PROVIDERS.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Modèle</label>
              <select value={form.aiModel} onChange={(e) => setForm({ ...form, aiModel: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all">
                <option value="">— Sélectionner —</option>
                {models.map((m) => (<option key={m} value={m}>{m}</option>))}
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <Key size={14} /> Clé API (détection auto : Grok=xai- / Cerebras=csk_ / autre=Groq)
            </label>
            <div className="flex gap-2">
              <input value={form.apiKey} onChange={(e) => { setForm({ ...form, apiKey: e.target.value }); setKeyTest({}); }} type="password" className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" />
              <button type="button" onClick={testKey} disabled={keyTest.loading || !form.apiKey} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-white/80 transition-all disabled:opacity-50">
                <TestTube size={15} /> {keyTest.loading ? "Test..." : "Tester"}
              </button>
            </div>
            {keyTest.valid === true && <p className="text-green-600 text-xs mt-1.5 flex items-center gap-1">✓ Clé valide ({keyTest.error || form.aiProvider})</p>}
            {keyTest.valid === false && <p className="text-red-500 text-xs mt-1.5">✗ {keyTest.error}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <SlidersHorizontal size={14} /> Seuil QA (N1) : {form.kbThreshold ?? 80}%
              </label>
              <input type="range" min={10} max={100} value={form.kbThreshold ?? 80} onChange={(e) => setForm({ ...form, kbThreshold: +e.target.value })} className="w-full accent-purple-600" />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>10%</span><span>100%</span></div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <Layers size={14} /> Seuil RAG (N2) : {form.ragThreshold ?? 72}%
              </label>
              <input type="range" min={10} max={100} value={form.ragThreshold ?? 72} onChange={(e) => setForm({ ...form, ragThreshold: +e.target.value })} className="w-full accent-purple-600" />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>10%</span><span>100%</span></div>
            </div>
          </div>

          <div>
            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors">
              <Thermometer size={14} /> Paramètres avancés {showAdvanced ? "▲" : "▼"}
            </button>
          </div>

          {showAdvanced && (
            <div className="space-y-4 pl-4 border-l-2 border-purple-100">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Temp. QA (N1)</label>
                  <input type="number" step={0.01} min={0} max={1} value={form.tempQA ?? 0.05} onChange={(e) => setForm({ ...form, tempQA: +e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Temp. RAG (N2)</label>
                  <input type="number" step={0.01} min={0} max={1} value={form.tempRAG ?? 0.10} onChange={(e) => setForm({ ...form, tempRAG: +e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Temp. Escalade (N3)</label>
                  <input type="number" step={0.01} min={0} max={1} value={form.tempEscalade ?? 0.20} onChange={(e) => setForm({ ...form, tempEscalade: +e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Taille chunk (car.)</label>
                  <input type="number" min={100} max={5000} step={100} value={form.chunkSize ?? 500} onChange={(e) => setForm({ ...form, chunkSize: +e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Top N chunks RAG</label>
                  <input type="number" min={1} max={20} value={form.topNChunks ?? 3} onChange={(e) => setForm({ ...form, topNChunks: +e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <MessageSquareText size={14} /> Relance IA
            </label>
            <select value={form.relanceActive ? "true" : "false"} onChange={(e) => setForm({ ...form, relanceActive: e.target.value === "true" })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all">
              <option value="true">Active</option>
              <option value="false">Désactivée</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Texte de relance personnalisé</label>
            <textarea value={form.relanceText || ""} onChange={(e) => setForm({ ...form, relanceText: e.target.value })} rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" placeholder="Exemple : Souhaitez-vous plus de détails ?" />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <Building2 size={14} /> Contexte de l&apos;entreprise (importé automatiquement en chunks)
            </label>
            <textarea value={form.siteContext || ""} onChange={(e) => setForm({ ...form, siteContext: e.target.value })} rows={4} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" placeholder="Décrivez votre activité..." />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700"><FileText size={14} /> Documents contextuels</h3>
              <label className="flex items-center gap-2 text-xs font-medium text-purple-600 hover:text-purple-700 cursor-pointer transition-colors">
                <Upload size={14} /> {uploading ? "Upload..." : "Ajouter un fichier"}
                <input type="file" accept=".txt,.csv,.json,.md" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
            </div>
            <p className="text-xs text-gray-400 mb-3">Formats supportés : .txt, .csv, .json, .md (max 5 Mo). Gestion des versions et dates de validité.</p>
            {documents.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Aucun document uploadé.</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => {
                  const isValid = doc.valid_until ? new Date(doc.valid_until) >= new Date() : true;
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
                      <button onClick={() => handleDeleteDoc(doc.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0 ml-2">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:from-purple-700 hover:to-purple-600 transition-all disabled:opacity-50 shadow-lg shadow-purple-200">
            <Save size={16} /> {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-elevated p-6">
          <button onClick={() => { localStorage.removeItem("token"); router.push("/login"); }} className="flex items-center gap-2 text-red-500 hover:text-red-700 text-sm font-medium transition-colors">
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}
