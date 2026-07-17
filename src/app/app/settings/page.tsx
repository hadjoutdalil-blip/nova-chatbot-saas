"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, LogOut, Brain, SlidersHorizontal, MessageSquareText, Thermometer, Shield, Loader2, CheckCircle2, XCircle } from "lucide-react";
import ApiKeysManager from "@/components/admin/ApiKeysManager";

const TABS = [
  { id: "ia", label: "Configuration IA", icon: Brain },
  { id: "keys", label: "Clés API", icon: Shield },
];

export default function AppSettingsPage() {
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tab, setTab] = useState("ia");
  const [testVector, setTestVector] = useState(false);
  const [vectorTestResult, setVectorTestResult] = useState<Record<string, { ok: boolean; error?: string }> | null>(null);

  function token() { return localStorage.getItem("token") || ""; }

  useEffect(() => {
    fetch("/api/clients", { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((clients) => {
        const payload = JSON.parse(atob(token().split(".")[1]));
        const c = clients.find((c: any) => c.id === payload.clientId);
        if (c) { setClient(c); setForm({ ...c }); }
      });
  }, []);

  async function handleSave() {
    if (!form || !client) return;
    setSaving(true);
    const res = await fetch(`/api/clients/${client.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({
        kbThreshold: form.kbThreshold,
        ragThreshold: form.ragThreshold,
        tempQA: form.tempQA,
        tempRAG: form.tempRAG,
        tempEscalade: form.tempEscalade,
        chunkSize: form.chunkSize,
        topNChunks: form.topNChunks,
        relanceActive: form.relanceActive,
        relanceText: form.relanceText,
        useVectorRag: form.useVectorRag,
        hfApiKey: form.hfApiKey,
        chromaUrl: form.chromaUrl,
        chromaApiKey: form.chromaApiKey,
      }),
    });
    setSaving(false);
    if (res.ok) alert("Configuration enregistrée");
  }

  if (!form) return <div className="text-center py-20 text-gray-400">Chargement...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Paramètres</h1>
      <p className="text-gray-500 mb-6">Configurez votre assistant virtuel.</p>

      <div className="flex gap-1 mb-6 bg-gray-100/80 rounded-xl p-1 w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "ia" && (
        <div className="space-y-5 max-w-2xl">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-elevated p-6 space-y-5">
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center gap-2 mb-4">
                <SlidersHorizontal size={16} className="text-emerald-600" />
                <h2 className="font-semibold text-gray-900">Seuils de confiance</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                    Seuil QA (N1) : {form.kbThreshold ?? 80}%
                  </label>
                  <input type="range" min={10} max={100} value={form.kbThreshold ?? 80} onChange={(e) => setForm({ ...form, kbThreshold: +e.target.value })} className="w-full accent-emerald-600" />
                  <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>10%</span><span>100%</span></div>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                    Seuil RAG (N2) : {form.ragThreshold ?? 72}%
                  </label>
                  <input type="range" min={10} max={100} value={form.ragThreshold ?? 72} onChange={(e) => setForm({ ...form, ragThreshold: +e.target.value })} className="w-full accent-emerald-600" />
                  <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>10%</span><span>100%</span></div>
                </div>
              </div>
            </div>

            <div>
              <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
                <Thermometer size={14} /> Paramètres avancés {showAdvanced ? "▲" : "▼"}
              </button>
            </div>

            {showAdvanced && (
              <div className="space-y-4 pl-4 border-l-2 border-emerald-100">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Temp. QA (N1)</label>
                    <input type="number" step={0.01} min={0} max={1} value={form.tempQA ?? 0.05} onChange={(e) => setForm({ ...form, tempQA: +e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Temp. RAG (N2)</label>
                    <input type="number" step={0.01} min={0} max={1} value={form.tempRAG ?? 0.10} onChange={(e) => setForm({ ...form, tempRAG: +e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Temp. Escalade (N3)</label>
                    <input type="number" step={0.01} min={0} max={1} value={form.tempEscalade ?? 0.20} onChange={(e) => setForm({ ...form, tempEscalade: +e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Max chars / section</label>
                    <input type="number" min={100} max={5000} step={100} value={form.chunkSize ?? 500} onChange={(e) => setForm({ ...form, chunkSize: +e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Top N chunks RAG</label>
                    <input type="number" min={1} max={20} value={form.topNChunks ?? 3} onChange={(e) => setForm({ ...form, topNChunks: +e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <MessageSquareText size={14} /> Relance IA
              </label>
              <select value={form.relanceActive ? "true" : "false"} onChange={(e) => setForm({ ...form, relanceActive: e.target.value === "true" })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all">
                <option value="true">Active</option>
                <option value="false">Désactivée</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Texte de relance personnalisé</label>
              <textarea value={form.relanceText || ""} onChange={(e) => setForm({ ...form, relanceText: e.target.value })} rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="Exemple : Souhaitez-vous plus de détails ?" />
            </div>

            <div className="border-t border-gray-100 pt-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <Brain size={16} className="text-emerald-600" />
                <h2 className="font-semibold text-gray-900">RAG Vectoriel</h2>
              </div>
              <label className="flex items-center gap-3 cursor-pointer mb-4">
                <input type="checkbox" checked={!!form.useVectorRag} onChange={(e) => setForm({ ...form, useVectorRag: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                <span className="text-sm font-medium text-gray-700">Activer la recherche vectorielle (Cohere + ChromaDB)</span>
              </label>
              {form.useVectorRag && (
                <div className="space-y-3 pl-6 border-l-2 border-emerald-100">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Clé API Embedding (optionnel, sinon globale)</label>
                    <input type="password" value={form.hfApiKey || ""} onChange={(e) => setForm({ ...form, hfApiKey: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-mono" placeholder="clé API Cohere" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">URL ChromaDB (optionnel, sinon global)</label>
                    <input type="text" value={form.chromaUrl || ""} onChange={(e) => setForm({ ...form, chromaUrl: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-mono" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Clé API ChromaDB (optionnel, sinon globale)</label>
                    <input type="password" value={form.chromaApiKey || ""} onChange={(e) => setForm({ ...form, chromaApiKey: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-mono" />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={async () => {
                        setTestVector(true);
                        setVectorTestResult(null);
                        const res = await fetch("/api/test-vector-connection", {
                          method: "POST",
                          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
                          body: JSON.stringify({ hfApiKey: form.hfApiKey, chromaUrl: form.chromaUrl, chromaApiKey: form.chromaApiKey }),
                        });
                        setVectorTestResult(await res.json());
                        setTestVector(false);
                      }}
                      disabled={testVector || (!form.hfApiKey && !form.chromaUrl)}
                      className="flex items-center gap-1.5 border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                      {testVector ? <Loader2 size={13} className="animate-spin" /> : null}
                      {testVector ? "Test..." : "Tester la connexion"}
                    </button>
                    {vectorTestResult && (
                      <div className="flex items-center gap-2 text-xs">
                        {vectorTestResult.embedding && (vectorTestResult.embedding.ok ? <span className="flex items-center gap-1 text-green-600"><CheckCircle2 size={12} /> Embedding OK</span> : <span className="flex items-center gap-1 text-red-600"><XCircle size={12} /> Embedding</span>)}
                        {vectorTestResult.chroma && (vectorTestResult.chroma.ok ? <span className="flex items-center gap-1 text-green-600"><CheckCircle2 size={12} /> Chroma OK</span> : <span className="flex items-center gap-1 text-red-600"><XCircle size={12} /> Chroma</span>)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:from-emerald-700 hover:to-emerald-600 transition-all disabled:opacity-50 shadow-lg shadow-emerald-200">
              <Save size={16} /> {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-elevated p-6">
            <button onClick={() => { localStorage.removeItem("token"); router.push("/login"); }} className="flex items-center gap-2 text-red-500 hover:text-red-700 text-sm font-medium transition-colors">
              <LogOut size={16} /> Déconnexion
            </button>
          </div>
        </div>
      )}

      {tab === "keys" && client && (
        <div className="max-w-2xl">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-elevated p-6">
            <ApiKeysManager clientId={client.id} token={token} />
          </div>
        </div>
      )}
    </div>
  );
}
