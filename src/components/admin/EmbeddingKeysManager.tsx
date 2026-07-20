"use client";

import { useEffect, useState } from "react";
import { Plus, Key, Trash2, Edit3, Power, PowerOff, Save, X, Eye, EyeOff, FlaskConical } from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";

const PROVIDERS = [
  { id: "cohere", name: "Cohere", color: "blue" },
  { id: "nomic", name: "Nomic Atlas", color: "purple" },
] as const;

interface EmbeddingKeyEntry {
  id: string;
  clientId: string;
  provider: string;
  label: string;
  key: string;
  isActive: boolean;
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  clientId: string;
  token: () => string;
}

export default function EmbeddingKeysManager({ clientId, token }: Props) {
  const [keys, setKeys] = useState<EmbeddingKeyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; edit?: EmbeddingKeyEntry }>({ open: false });
  const [form, setForm] = useState({ key: "", label: "", provider: "cohere", isActive: true });
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ loading?: boolean; valid?: boolean; error?: string }>({});
  const [showKeys, setShowKeys] = useState<Set<string>>(new Set());

  async function loadKeys() {
    const res = await fetch(`/api/embedding-keys?clientId=${clientId}`, { headers: { Authorization: `Bearer ${token()}` } });
    if (res.ok) setKeys(await res.json());
  }

  useEffect(() => { loadKeys().finally(() => setLoading(false)); }, [clientId]);

  function openAdd() {
    setForm({ key: "", label: "", provider: "cohere", isActive: true });
    setTestResult({});
    setModal({ open: true });
  }

  function openEdit(entry: EmbeddingKeyEntry) {
    setForm({ key: entry.key, label: entry.label, provider: entry.provider, isActive: entry.isActive });
    setTestResult({});
    setModal({ open: true, edit: entry });
  }

  async function handleSave() {
    setSaving(true);
    const isEdit = modal.edit;
    const url = isEdit ? `/api/embedding-keys/${modal.edit!.id}` : "/api/embedding-keys";
    const method = isEdit ? "PUT" : "POST";
    const body: any = isEdit
      ? { label: form.label, isActive: form.isActive, key: form.key, provider: form.provider }
      : { key: form.key, label: form.label, provider: form.provider, isActive: form.isActive, clientId };
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
    if (!confirm("Supprimer cette clé d'embedding ?")) return;
    const res = await fetch(`/api/embedding-keys/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
    if (res.ok) await loadKeys();
  }

  async function handleToggleActive(entry: EmbeddingKeyEntry) {
    const res = await fetch(`/api/embedding-keys/${entry.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ isActive: !entry.isActive }),
    });
    if (res.ok) await loadKeys();
  }

  async function testKey() {
    if (!form.key) return;
    setTestResult({ loading: true });
    const res = await fetch("/api/test-vector-connection", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ hfApiKey: form.key }),
    });
    const data = await res.json();
    setTestResult({ loading: false, valid: data.cohere?.ok || data.nomic?.ok, error: data.cohere?.error || data.nomic?.error });
  }

  const providerLabel = (id: string) => PROVIDERS.find(p => p.id === id)?.name || id;
  const providerColor = (id: string) => PROVIDERS.find(p => p.id === id)?.color || "default";

  if (loading) return <p className="text-gray-400 text-sm py-8 text-center">Chargement des clés...</p>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Clés d'embedding</h2>
          <p className="text-sm text-gray-500 mt-0.5">Gérez plusieurs clés API pour l'embedding vectoriel. Une seule peut être active à la fois.</p>
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
          <p className="text-gray-400 text-sm">Aucune clé d'embedding configurée.</p>
          <p className="text-gray-400 text-xs mt-1">Ajoutez une clé pour activer la recherche vectorielle.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {keys.map((entry) => (
            <Card key={entry.id} padding="sm">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={providerColor(entry.provider)}>{providerLabel(entry.provider)}</Badge>
                    <span className="font-medium text-sm text-gray-900">{entry.label}</span>
                    {entry.isActive ? <Badge variant="green">Active</Badge> : <Badge variant="red">Désactivée</Badge>}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <code className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-0.5 rounded">
                      {showKeys.has(entry.id) ? entry.key : `${entry.key.slice(0, 8)}${"•".repeat(Math.min(entry.key.length - 8, 20))}`}
                    </code>
                    <button onClick={() => { const s = new Set(showKeys); s.has(entry.id) ? s.delete(entry.id) : s.add(entry.id); setShowKeys(s); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                      {showKeys.has(entry.id) ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>{entry.usageCount ?? 0} appel{(entry.usageCount ?? 0) !== 1 ? "s" : ""}</span>
                    {entry.lastUsedAt && <span>Dernier usage : {new Date(entry.lastUsedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleToggleActive(entry)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all" title={entry.isActive ? "Désactiver" : "Activer"}>
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
          ))}
        </div>
      )}

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setModal({ open: false })}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Key size={18} className="text-emerald-600" />
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
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    placeholder={form.provider === "cohere" ? "...ou Cohere" : "nomic-..."}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Provider</label>
                  <select
                    value={form.provider}
                    onChange={(e) => setForm({ ...form, provider: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  >
                    {PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Label</label>
                  <input
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    placeholder="Ex: Clé principale"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ekIsActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="ekIsActive" className="text-sm text-gray-700">Clé active</label>
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
