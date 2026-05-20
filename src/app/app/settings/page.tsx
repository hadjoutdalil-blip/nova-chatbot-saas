"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

  if (!form) return <div className="text-gray-500 text-center py-20">Chargement...</div>;

  const models = PROVIDERS.find((p) => p.id === form.aiProvider)?.models || PROVIDERS[0].models;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Paramètres</h1>

      <div className="space-y-6 max-w-2xl">
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
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
            {keyTest.valid === true && <p className="text-green-600 text-xs mt-1">✓ Clé valide</p>}
            {keyTest.valid === false && <p className="text-red-500 text-xs mt-1">✗ {keyTest.error}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Seuil de confiance KB : {form.kbThreshold ?? 60}%</label>
            <input type="range" min={10} max={100} value={form.kbThreshold ?? 60} onChange={(e) => setForm({ ...form, kbThreshold: +e.target.value })} className="w-full" />
            <div className="flex justify-between text-xs text-gray-400"><span>10%</span><span>100%</span></div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Relance IA</label>
            <select value={form.relanceActive ? "true" : "false"} onChange={(e) => setForm({ ...form, relanceActive: e.target.value === "true" })} className="w-full border rounded-lg px-3 py-2">
              <option value="true">Active</option>
              <option value="false">Désactivée</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Texte de relance personnalisé</label>
            <textarea value={form.relanceText || ""} onChange={(e) => setForm({ ...form, relanceText: e.target.value })} rows={2} className="w-full border rounded-lg px-3 py-2" placeholder="Exemple : Souhaitez-vous plus de détails ?" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Contexte de l'entreprise</label>
            <textarea value={form.siteContext || ""} onChange={(e) => setForm({ ...form, siteContext: e.target.value })} rows={4} className="w-full border rounded-lg px-3 py-2" placeholder="Décrivez votre activité..." />
          </div>

          <button onClick={handleSave} disabled={saving} className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50">
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <button onClick={() => { localStorage.removeItem("token"); router.push("/login"); }} className="text-red-500 hover:text-red-700 text-sm font-medium">
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}
