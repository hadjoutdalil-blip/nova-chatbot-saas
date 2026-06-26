"use client";

import { useEffect, useState } from "react";

const PROVIDER_MODELS: Record<string, string[]> = {
  groq: ["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "mixtral-8x7b-32768", "gemma2-9b-it"],
  cerebras: ["llama3.1-8b", "llama3.1-70b"],
  xai: ["grok-2-latest", "grok-3-beta"],
  gemini: ["gemini-2.5-flash"],
};

export default function SettingsPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function token() { return localStorage.getItem("token") || ""; }

  useEffect(() => {
    fetch("/api/settings", { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then(setConfig);
  }, []);

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify(config),
    });
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    setSaving(false);
  }

  const models = PROVIDER_MODELS[config.defaultAiProvider] || PROVIDER_MODELS.groq;

  if (!config.defaultAiProvider) return <p className="text-gray-500">Chargement...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Paramètres généraux</h1>

      <div className="bg-white rounded-xl shadow-sm p-6 max-w-xl space-y-5">

        <h2 className="font-semibold text-lg border-b pb-2">Configuration IA par défaut</h2>
        <p className="text-sm text-gray-500 -mt-3">Ces valeurs sont utilisées comme valeurs par défaut lors de la création d&apos;un nouveau client.</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Fournisseur par défaut</label>
            <select
              value={config.defaultAiProvider}
              onChange={(e) => setConfig({ ...config, defaultAiProvider: e.target.value, defaultAiModel: "" })}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="groq">Groq</option>
              <option value="cerebras">Cerebras</option>
              <option value="xai">xAI Grok</option>
              <option value="gemini">Google Gemini</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Modèle par défaut</label>
            <select
              value={config.defaultAiModel}
              onChange={(e) => setConfig({ ...config, defaultAiModel: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">— Sélectionner —</option>
              {models.map((m) => (<option key={m} value={m}>{m}</option>))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Seuil de confiance KB par défaut : {config.defaultKbThreshold}%</label>
          <input
            type="range" min={10} max={100}
            value={config.defaultKbThreshold || 60}
            onChange={(e) => setConfig({ ...config, defaultKbThreshold: e.target.value })}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400"><span>10%</span><span>100%</span></div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Relance IA par défaut</label>
          <select
            value={config.defaultRelanceActive || "true"}
            onChange={(e) => setConfig({ ...config, defaultRelanceActive: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="true">Active</option>
            <option value="false">Désactivée</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving} className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50">
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
          {saved && <span className="text-green-600 text-sm">✓ Enregistré</span>}
        </div>
      </div>
    </div>
  );
}
