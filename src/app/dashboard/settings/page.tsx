"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

const PROVIDER_MODELS: Record<string, string[]> = {
  groq: ["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "openai/gpt-oss-20b", "openai/gpt-oss-120b", "qwen/qwen3-32b", "qwen/qwen3.6-27b", "meta-llama/llama-4-scout-17b-16e-instruct"],
  cerebras: ["gpt-oss-120b", "gemma-4-31b", "zai-glm-4.7"],
  xai: ["grok-2-latest", "grok-3-beta"],
  gemini: ["gemini-2.5-flash"],
};

export default function SettingsPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; error?: string }> | null>(null);

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

        <h2 className="font-semibold text-lg border-b pb-2">RAG Vectoriel (Cohere + pgvector)</h2>
        <p className="text-sm text-gray-500 -mt-3">Clé API par défaut pour la recherche sémantique vectorielle.</p>

        <div>
          <label className="block text-sm font-medium mb-1">Clé API Embedding (Cohere)</label>
          <input
            type="password" placeholder="clé API Cohere"
            value={config.hfApiKey || ""}
            onChange={(e) => setConfig({ ...config, hfApiKey: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              setTesting(true);
              setTestResult(null);
              const res = await fetch("/api/test-vector-connection", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
                body: JSON.stringify({ hfApiKey: config.hfApiKey }),
              });
              const text = await res.text();
              setTestResult(JSON.parse(text));
            }}
            disabled={testing || !config.hfApiKey}
            className="flex items-center gap-1.5 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {testing ? <Loader2 size={15} className="animate-spin" /> : null}
            {testing ? "Test en cours..." : "Tester la connexion"}
          </button>
          {testResult && (
            <div className="flex items-center gap-2 text-sm">
              {testResult.embedding && (testResult.embedding.ok ? <span className="flex items-center gap-1 text-green-600"><CheckCircle2 size={14} /> Embedding OK</span> : <span className="flex items-center gap-1 text-red-600"><XCircle size={14} /> Embedding: {testResult.embedding.error}</span>)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50">
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
          {saved && <span className="text-green-600 text-sm">✓ Enregistré</span>}
        </div>

        <MigrateButton token={token} />
      </div>
    </div>
  );
}

function MigrateButton({ token }: { token: () => string }) {
  const [migrating, setMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState<string | null>(null);

  return (
    <div className="border-t border-gray-100 pt-4 mt-4">
      <h3 className="font-semibold text-sm text-gray-700 mb-2">Migration vers pgvector</h3>
      <p className="text-xs text-gray-500 mb-3">Indexe tous les documents et entrées KB existants dans la base vectorielle PostgreSQL.</p>
      <button
        onClick={async () => {
          setMigrating(true);
          setMigrateResult(null);
          try {
            const res = await fetch("/api/migrate-vector", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
            });
            const text = await res.text();
            const data = JSON.parse(text);
            setMigrateResult(JSON.stringify(data.results || data, null, 2));
          } catch (err: any) {
            setMigrateResult(`Erreur: ${err.message}`);
          }
          setMigrating(false);
        }}
        disabled={migrating}
        className="flex items-center gap-1.5 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
      >
        {migrating ? <Loader2 size={15} className="animate-spin" /> : null}
        {migrating ? "Migration en cours..." : "Migrer vers pgvector"}
      </button>
      {migrateResult && (
        <pre className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs font-mono overflow-auto max-h-60 text-gray-700">{migrateResult}</pre>
      )}
    </div>
  );
}
