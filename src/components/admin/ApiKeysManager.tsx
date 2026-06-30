"use client";

import { useEffect, useState } from "react";
import { Plus, Key, Trash2, Edit3, Power, PowerOff, GripVertical, Save, X, RefreshCw, Shield, Eye, EyeOff, FlaskConical } from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";

const PROVIDERS = [
  { id: "groq", name: "Groq", color: "blue", models: ["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "openai/gpt-oss-20b", "openai/gpt-oss-120b", "qwen/qwen3-32b", "qwen/qwen3.6-27b", "meta-llama/llama-4-scout-17b-16e-instruct"] },
  { id: "cerebras", name: "Cerebras", color: "purple", models: ["llama3.1-8b", "llama3.1-70b"] },
  { id: "xai", name: "xAI Grok", color: "green", models: ["grok-2-latest", "grok-3-beta"] },
  { id: "gemini", name: "Google Gemini", color: "yellow", models: ["gemini-2.5-flash"] },
] as const;

interface ApiKeyEntry {
  id: string;
  clientId: string;
  provider: string;
  model?: string | null;
  label: string;
  key: string;
  isActive: boolean;
  priority: number;
  monthlyLimit: number;
  usedTokens: number;
  lastResetAt: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  clientId: string;
  token: () => string;
}

export default function ApiKeysManager({ clientId, token }: Props) {
  const [keys, setKeys] = useState<ApiKeyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; edit?: ApiKeyEntry }>({ open: false });
  const [form, setForm] = useState({ key: "", label: "", provider: "", model: "", monthlyLimit: 0, isActive: true });
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ loading?: boolean; valid?: boolean; error?: string }>({});
  const [showKeys, setShowKeys] = useState<Set<string>>(new Set());

  async function loadKeys() {
    const res = await fetch(`/api/keys?clientId=${clientId}`, { headers: { Authorization: `Bearer ${token()}` } });
    if (res.ok) setKeys(await res.json());
  }

  useEffect(() => { loadKeys().finally(() => setLoading(false)); }, [clientId]);

  function openAdd() {
    setForm({ key: "", label: "", provider: "", model: "", monthlyLimit: 0, isActive: true });
    setTestResult({});
    setModal({ open: true });
  }

  function openEdit(entry: ApiKeyEntry) {
    setForm({ key: entry.key, label: entry.label, provider: entry.provider, model: entry.model || "", monthlyLimit: entry.monthlyLimit, isActive: entry.isActive });
    setTestResult({});
    setModal({ open: true, edit: entry });
  }

  async function handleSave() {
    setSaving(true);
    const isEdit = modal.edit;
    const url = isEdit ? `/api/keys/${modal.edit!.id}` : "/api/keys";
    const method = isEdit ? "PUT" : "POST";
    const body: any = isEdit
      ? { label: form.label, isActive: form.isActive, monthlyLimit: form.monthlyLimit, key: form.key, provider: form.provider, model: form.model || null }
      : { key: form.key, label: form.label, provider: form.provider, monthlyLimit: form.monthlyLimit, isActive: form.isActive, clientId, model: form.model || null };
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      setModal({ open: false });
      await loadKeys();
    } else {
      const data = await res.json();
      alert(data.error || "Erreur");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette clé API ?")) return;
    const res = await fetch(`/api/keys/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
    if (res.ok) await loadKeys();
  }

  async function handleToggleActive(entry: ApiKeyEntry) {
    const res = await fetch(`/api/keys/${entry.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ isActive: !entry.isActive }),
    });
    if (res.ok) await loadKeys();
  }

  async function handleReorder(id: string, direction: "up" | "down") {
    const idx = keys.findIndex(k => k.id === id);
    if (idx < 0) return;
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= keys.length) return;
    const newKeys = [...keys];
    const tmp = newKeys[idx].priority;
    newKeys[idx] = { ...newKeys[idx], priority: newKeys[target].priority };
    newKeys[target] = { ...newKeys[target], priority: tmp };
    const res = await fetch("/api/keys/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ clientId, order: newKeys.map((k, i) => ({ id: k.id, priority: i })) }),
    });
    if (res.ok) setKeys(newKeys);
  }

  async function testKey() {
    if (!form.key) return;
    setTestResult({ loading: true });
    const res = await fetch("/api/chat/test-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: form.key, provider: form.provider || undefined }),
    });
    const data = await res.json();
    setTestResult({ loading: false, valid: data.valid, error: data.error });
    if (data.valid && !form.provider) {
      setForm(f => ({ ...f, provider: data.provider || "" }));
    }
  }

  const providerLabel = (id: string) => PROVIDERS.find(p => p.id === id)?.name || id;
  const providerColor = (id: string) => (PROVIDERS.find(p => p.id === id)?.color || "gray") as any;

  if (loading) return <p className="text-gray-400 text-sm py-8 text-center">Chargement des clés...</p>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Clés API</h2>
          <p className="text-sm text-gray-500 mt-0.5">Gérez plusieurs clés avec rotation, limites mensuelles et priorité.</p>
        </div>
        <Button onClick={openAdd}>
          <Plus size={16} /> Ajouter une clé
        </Button>
      </div>

      {keys.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
            <Key size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-400 text-sm">Aucune clé API configurée.</p>
          <p className="text-gray-400 text-xs mt-1">Ajoutez une clé pour activer la rotation automatique.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {keys.map((entry, idx) => {
            const pct = entry.monthlyLimit > 0 ? Math.round((entry.usedTokens / entry.monthlyLimit) * 100) : 0;
            const usageColor = pct >= 90 ? "bg-red-400" : pct >= 70 ? "bg-yellow-400" : "bg-emerald-400";
            return (
              <Card key={entry.id} padding="sm">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-0.5 pt-1">
                    <button onClick={() => handleReorder(entry.id, "up")} disabled={idx === 0} className="w-5 h-4 flex items-center justify-center text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors">
                      <GripVertical size={12} className="rotate-90" />
                    </button>
                    <span className="text-xs text-gray-400 font-mono">#{idx + 1}</span>
                    <button onClick={() => handleReorder(entry.id, "down")} disabled={idx === keys.length - 1} className="w-5 h-4 flex items-center justify-center text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors">
                      <GripVertical size={12} className="-rotate-90" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={providerColor(entry.provider)}>{providerLabel(entry.provider)}</Badge>
                      <span className="font-medium text-sm text-gray-900">{entry.label}</span>
                      {entry.model && <code className="text-xs text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded font-mono">{entry.model}</code>}
                      {!entry.isActive && <Badge variant="red">Désactivée</Badge>}
                      {entry.priority === 0 && <Badge variant="yellow">Principale</Badge>}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <code className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-0.5 rounded">
                        {showKeys.has(entry.id) ? entry.key : `${entry.key.slice(0, 8)}${"•".repeat(Math.min(entry.key.length - 8, 20))}`}
                      </code>
                      <button onClick={() => { const s = new Set(showKeys); s.has(entry.id) ? s.delete(entry.id) : s.add(entry.id); setShowKeys(s); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                        {showKeys.has(entry.id) ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                    <div className="mt-2.5">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Utilisation mensuelle</span>
                        <span>{entry.usedTokens.toLocaleString()} / {entry.monthlyLimit > 0 ? entry.monthlyLimit.toLocaleString() : "∞"}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-300 ${usageColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleToggleActive(entry)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all" title={entry.isActive ? "Désactiver" : "Activer"}>
                      {entry.isActive ? <Power size={14} /> : <PowerOff size={14} />}
                    </button>
                    <button onClick={() => openEdit(entry)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all" title="Modifier">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => handleDelete(entry.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Supprimer">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setModal({ open: false })}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Key size={18} className="text-purple-600" />
                <h3 className="font-semibold text-gray-900">{modal.edit ? "Modifier la clé" : "Ajouter une clé"}</h3>
              </div>
              <button onClick={() => setModal({ open: false })} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Clé API</label>
                <div className="flex gap-2">
                  <input
                    value={form.key}
                    onChange={(e) => { setForm({ ...form, key: e.target.value }); setTestResult({}); }}
                    type="password"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                    placeholder="gsk_..., csk_..., xai-..., AIza..."
                  />
                  <button type="button" onClick={testKey} disabled={testResult.loading || !form.key} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50">
                    <FlaskConical size={14} /> {testResult.loading ? "..." : "Tester"}
                  </button>
                </div>
                {testResult.valid === true && <p className="text-green-600 text-xs mt-1.5">✓ Clé valide</p>}
                {testResult.valid === false && <p className="text-red-500 text-xs mt-1.5">✗ {testResult.error}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Fournisseur</label>
                  <select
                    value={form.provider}
                    onChange={(e) => { setForm({ ...form, provider: e.target.value, model: "" }); setTestResult({}); }}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                  >
                    <option value="">Détection auto</option>
                    {PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Label</label>
                  <input
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                    placeholder="Ex: Clé principale"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Modèle associé <span className="text-gray-400 font-normal">(optionnel — utilise le modèle par défaut du client si vide)</span></label>
                <select
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                >
                  <option value="">Modèle par défaut du client</option>
                  {(PROVIDERS.find(p => p.id === form.provider)?.models || []).map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Limite mensuelle (tokens) {form.monthlyLimit > 0 ? `— ${form.monthlyLimit.toLocaleString()}` : "(illimité)"}
                </label>
                <input
                  type="range" min={0} max={100_000_000} step={1_000_000}
                  value={form.monthlyLimit}
                  onChange={(e) => setForm({ ...form, monthlyLimit: +e.target.value })}
                  className="w-full accent-purple-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>0 (illimité)</span>
                  <span>100M</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">Clé active</label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setModal({ open: false })}>Annuler</Button>
              <Button onClick={handleSave} disabled={saving || !form.key}>
                <Save size={15} /> {saving ? "Enregistrement..." : modal.edit ? "Enregistrer" : "Ajouter"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
