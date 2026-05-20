"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

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

export default function EditClientPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState<any>(null);
  const [error, setError] = useState("");
  const [keyTest, setKeyTest] = useState<{ loading?: boolean; valid?: boolean; error?: string }>({});
  const [importing, setImporting] = useState(false);

  function token() { return localStorage.getItem("token") || ""; }

  useEffect(() => {
    fetch(`/api/clients/${id}`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then((r) => r.json())
      .then((data) => setForm(data));
  }, [id]);

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

  const models = PROVIDERS.find((p) => p.id === form?.aiProvider)?.models || PROVIDERS[0].models;

  if (!form) return <p className="text-gray-500">Chargement...</p>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">{form.name}</h1>
      </div>
      <div className="flex gap-2 mb-6">
        <span className="text-sm px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 font-medium">Modifier</span>
        <Link href={`/dashboard/clients/${id}/kb`} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">Base connaissances</Link>
        <Link href={`/dashboard/clients/${id}/widget`} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">Widget</Link>
        <Link href={`/dashboard/clients/${id}/test`} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">Tester</Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 max-w-2xl space-y-6">
        {error && <p className="text-red-500 text-sm">{error}</p>}

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
          <div>
            <label className="block text-sm font-medium mb-1">Priorité par défaut</label>
            <input type="number" min={1} max={10} value={form.kbThreshold ?? 60} disabled className="w-full border rounded-lg px-3 py-2 bg-gray-50 text-gray-400" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Texte de relance personnalisé (optionnel)</label>
          <textarea
            value={form.relanceText || ""}
            onChange={(e) => setForm({ ...form, relanceText: e.target.value })}
            rows={2}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Exemple : Souhaitez-vous que je vous donne plus de détails sur ce sujet ?"
          />
        </div>

        <h2 className="font-semibold text-lg border-b pb-2">Contexte entreprise</h2>

        <div>
          <label className="block text-sm font-medium mb-1">Contexte du site</label>
          <textarea
            value={form.siteContext || ""}
            onChange={(e) => setForm({ ...form, siteContext: e.target.value })}
            rows={4}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Décrivez l'activité de l'entreprise, ses services, son public cible..."
          />
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
          <button type="button" onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">Annuler</button>
        </div>
      </form>
    </div>
  );
}
