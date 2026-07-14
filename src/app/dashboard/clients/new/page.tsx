"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PLANS = [
  { id: "ecommerce", name: "Chatbot E-commerce", price: "$299/mois", desc: "Boutique en ligne, commandes, livraison, retours", color: "purple" },
  { id: "support", name: "Chatbot Support Client", price: "$399/mois", desc: "FAQ, tickets, procédures, horaires", color: "indigo" },
  { id: "realestate", name: "Chatbot Immobilier", price: "$499/mois", desc: "Biens, visites, estimation, crédit", color: "blue" },
  { id: "custom", name: "Sur Mesure", price: "Devis", desc: "Secteur spécifique, besoins sur mesure", color: "gray" },
];

const colorClasses: Record<string, string> = {
  purple: "ring-emerald-200 bg-emerald-50 border-emerald-200",
  indigo: "ring-indigo-200 bg-indigo-50 border-indigo-200",
  blue: "ring-blue-200 bg-blue-50 border-blue-200",
  gray: "ring-gray-200 bg-gray-50 border-gray-200",
};

const colorDot: Record<string, string> = {
  purple: "bg-emerald-500",
  indigo: "bg-indigo-500",
  blue: "bg-blue-500",
  gray: "bg-gray-400",
};

export default function NewClientPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    slug: "",
    plan: "support",
    primaryColor: "#059669",
    aiProvider: "groq",
    aiModel: "openai/gpt-oss-20b",
    apiKey: "",
    kbThreshold: 60,
  });
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }
    router.push("/dashboard/clients");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Nouveau client</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 max-w-2xl space-y-6">
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div>
          <label className="block text-sm font-medium mb-3">Pack du chatbot</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PLANS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setForm({ ...form, plan: p.id })}
                className={`text-left p-3 rounded-xl border-2 transition ${
                  form.plan === p.id
                    ? `${colorClasses[p.color]} ring-2`
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className={`block w-2.5 h-2.5 rounded-full mb-2 ${colorDot[p.color]}`} />
                <span className="block font-semibold text-sm">{p.name}</span>
                <span className="block text-xs text-gray-400 mt-0.5">{p.price}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom du client</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Slug (identifiant unique)</label>
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Couleur primaire</label>
          <input type="color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} className="w-full h-10 rounded-lg border cursor-pointer" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Fournisseur IA</label>
            <select value={form.aiProvider} onChange={(e) => setForm({ ...form, aiProvider: e.target.value })} className="w-full border rounded-lg px-3 py-2">
              <option value="groq">Groq</option>
              <option value="cerebras">Cerebras</option>
              <option value="xai">xAI Grok</option>
              <option value="gemini">Google Gemini</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Modèle IA</label>
            <input value={form.aiModel} onChange={(e) => setForm({ ...form, aiModel: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Clé API</label>
          <input value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Seuil KB (%)</label>
          <input type="number" value={form.kbThreshold} onChange={(e) => setForm({ ...form, kbThreshold: +e.target.value })} className="w-full border rounded-lg px-3 py-2" />
        </div>

        <div className="flex gap-3">
          <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700">Créer le client</button>
          <button type="button" onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">Annuler</button>
        </div>
      </form>
    </div>
  );
}
