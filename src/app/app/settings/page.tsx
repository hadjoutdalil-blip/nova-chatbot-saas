"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, LogOut, Brain, SlidersHorizontal, MessageSquareText, Thermometer, Shield } from "lucide-react";
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
                <SlidersHorizontal size={16} className="text-purple-600" />
                <h2 className="font-semibold text-gray-900">Seuils de confiance</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                    Seuil QA (N1) : {form.kbThreshold ?? 80}%
                  </label>
                  <input type="range" min={10} max={100} value={form.kbThreshold ?? 80} onChange={(e) => setForm({ ...form, kbThreshold: +e.target.value })} className="w-full accent-purple-600" />
                  <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>10%</span><span>100%</span></div>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                    Seuil RAG (N2) : {form.ragThreshold ?? 72}%
                  </label>
                  <input type="range" min={10} max={100} value={form.ragThreshold ?? 72} onChange={(e) => setForm({ ...form, ragThreshold: +e.target.value })} className="w-full accent-purple-600" />
                  <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>10%</span><span>100%</span></div>
                </div>
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
                    <label className="block text-xs font-medium text-gray-600 mb-1">Max chars / section</label>
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
