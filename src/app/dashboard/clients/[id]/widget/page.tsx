"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ClientWidgetPage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<any>(null);
  const [clientSlug, setClientSlug] = useState("");
  const [form, setForm] = useState({
    welcomeTitle: "Bienvenue !",
    welcomeSub: "Comment puis-je vous aider ?",
    showBrand: true,
    position: "right",
    marginBottom: 20,
    marginRight: 20,
    avatarIcon: "robot",
  });
  const [hasConfig, setHasConfig] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  function token() { return localStorage.getItem("token") || ""; }

  useEffect(() => {
    const t = token();
    fetch(`/api/clients/${id}`, { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then(async (c) => {
        setClient(c);
        setClientSlug(c.slug);
        const res = await fetch(`/api/widget/${c.slug}`, { cache: "no-store" });
        const data = await res.json();
        if (data.widgetConfig) {
          setHasConfig(true);
          setForm({
            welcomeTitle: data.widgetConfig.welcomeTitle,
            welcomeSub: data.widgetConfig.welcomeSub,
            showBrand: data.widgetConfig.showBrand,
            position: data.widgetConfig.position,
            marginBottom: data.widgetConfig.marginBottom,
            marginRight: data.widgetConfig.marginRight,
            avatarIcon: data.widgetConfig.avatarIcon,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const t = token();
    const method = hasConfig ? "PUT" : "POST";
    await fetch("/api/widget", {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ ...form, clientId: id }),
    });
    setSaving(false);
    setEditMode(false);
    setHasConfig(true);
  }

  function embedCode() {
    if (!clientSlug) return "";
    return `<script src="${window.location.origin}/api/widget/${clientSlug}/embed.js"></script>`;
  }

  if (loading) return <p className="text-gray-500">Chargement...</p>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/clients" className="text-gray-400 hover:text-gray-600 text-sm">&larr; Clients</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold">{client?.name || "..."}</h1>
      </div>

      <div className="flex gap-2 mb-6">
        <Link href={`/dashboard/clients/${id}`} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">Modifier</Link>
        <Link href={`/dashboard/clients/${id}/kb`} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">Base connaissances</Link>
        <Link href={`/dashboard/clients/${id}/widget`} className="text-sm px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 font-medium">Widget</Link>
        <Link href={`/dashboard/clients/${id}/test`} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">Tester</Link>
      </div>

      {clientSlug && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-medium text-green-800 mb-2">Code d&apos;intégration</p>
          <code className="text-xs bg-white px-3 py-2 rounded border block break-all select-all">{embedCode()}</code>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6 max-w-lg">
        {!editMode ? (
          <div>
            <div className="space-y-3 mb-6">
              <p><span className="text-gray-500 text-sm">Titre :</span> <span className="font-medium">{form.welcomeTitle}</span></p>
              <p><span className="text-gray-500 text-sm">Sous-titre :</span> <span>{form.welcomeSub}</span></p>
              <p><span className="text-gray-500 text-sm">Position :</span> <span>{form.position === "right" ? "Droite" : "Gauche"}</span></p>
              <p><span className="text-gray-500 text-sm">Marges :</span> <span>bas {form.marginBottom}px</span></p>
            </div>
            <button onClick={() => setEditMode(true)} className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-purple-700">Modifier</button>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Titre de bienvenue</label>
              <input value={form.welcomeTitle} onChange={(e) => setForm({ ...form, welcomeTitle: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sous-titre</label>
              <input value={form.welcomeSub} onChange={(e) => setForm({ ...form, welcomeSub: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Position</label>
                <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                  <option value="right">Droite</option>
                  <option value="left">Gauche</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Icône avatar</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "robot", label: "Robot", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/></svg>' },
                    { id: "bot", label: "Bot", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="16" height="12" rx="3"/><circle cx="9" cy="13" r="1.5" fill="currentColor"/><circle cx="15" cy="13" r="1.5" fill="currentColor"/><path d="M8 17a4 4 0 0 0 8 0"/></svg>' },
                    { id: "sparkle", label: "Étincelle", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12,2 15,9 22,12 15,15 12,22 9,15 2,12 9,9"/></svg>' },
                    { id: "heart", label: "Cœur", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' },
                    { id: "chat", label: "Chat", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' },
                    { id: "headset", label: "Casque", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14v-3a8 8 0 0 1 16 0v3"/><rect x="2" y="14" width="4" height="6" rx="1"/><rect x="18" y="14" width="4" height="6" rx="1"/></svg>' },
                  ].map((a) => (
                    <button key={a.id} type="button" onClick={() => setForm({ ...form, avatarIcon: a.id })}
                      className={"flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all " + (form.avatarIcon === a.id ? "border-purple-500 bg-purple-50 shadow-sm" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50")}>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white" dangerouslySetInnerHTML={{ __html: a.svg }} />
                      <span className="text-xs font-medium text-gray-600">{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Marge bas (px)</label>
                <input type="number" value={form.marginBottom} onChange={(e) => setForm({ ...form, marginBottom: +e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Marge {form.position === "right" ? "droite" : "gauche"} (px)</label>
                <input type="number" value={form.marginRight} onChange={(e) => setForm({ ...form, marginRight: +e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.showBrand} onChange={(e) => setForm({ ...form, showBrand: e.target.checked })} className="rounded" />
              <span className="text-sm">Afficher "Propulsé par Nova"</span>
            </label>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button type="button" onClick={() => setEditMode(false)} className="text-gray-500 hover:text-gray-700 text-sm">Annuler</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
