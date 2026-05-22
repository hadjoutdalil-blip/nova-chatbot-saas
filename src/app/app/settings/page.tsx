"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, TestTube, LogOut, Brain, Key, SlidersHorizontal, MessageSquareText, Building2 } from "lucide-react";

const PROVIDERS = [
  { id: "groq", name: "Groq", models: ["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "mixtral-8x7b-32768", "gemma2-9b-it"] },
  { id: "cerebras", name: "Cerebras", models: ["llama3.1-8b", "llama3.1-70b"] },
];

export default function AppSettingsPage() {
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [form, setForm] = useState<any>(null);
  const [keyTest, setKeyTest] = useState<{ loading?: boolean; valid?: boolean; error?: string }>({});
  const [saving, setSaving] = useState(false);

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
        apiKey: form.apiKey,
        aiProvider: form.aiProvider,
        aiModel: form.aiModel,
        kbThreshold: form.kbThreshold,
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
      body: JSON.stringify({ apiKey: form.apiKey, provider: form.aiProvider }),
    });
    const data = await res.json();
    setKeyTest({ loading: false, valid: data.valid, error: data.error });
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
              <Key size={14} /> Clé API
            </label>
            <div className="flex gap-2">
              <input value={form.apiKey} onChange={(e) => { setForm({ ...form, apiKey: e.target.value }); setKeyTest({}); }} type="password" className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" />
              <button type="button" onClick={testKey} disabled={keyTest.loading || !form.apiKey} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-white/80 transition-all disabled:opacity-50">
                <TestTube size={15} /> {keyTest.loading ? "Test..." : "Tester"}
              </button>
            </div>
            {keyTest.valid === true && <p className="text-green-600 text-xs mt-1.5 flex items-center gap-1">✓ Clé valide</p>}
            {keyTest.valid === false && <p className="text-red-500 text-xs mt-1.5">✗ {keyTest.error}</p>}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <SlidersHorizontal size={14} /> Seuil de confiance KB : {form.kbThreshold ?? 60}%
            </label>
            <input type="range" min={10} max={100} value={form.kbThreshold ?? 60} onChange={(e) => setForm({ ...form, kbThreshold: +e.target.value })} className="w-full accent-purple-600" />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>10%</span><span>100%</span></div>
          </div>

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
              <Building2 size={14} /> Contexte de l&apos;entreprise
            </label>
            <textarea value={form.siteContext || ""} onChange={(e) => setForm({ ...form, siteContext: e.target.value })} rows={4} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" placeholder="Décrivez votre activité..." />
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
