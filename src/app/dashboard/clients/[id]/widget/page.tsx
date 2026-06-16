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
  const [saveError, setSaveError] = useState("");

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
    setSaveError("");
    const t = token();
    const method = hasConfig ? "PUT" : "POST";
    const res = await fetch("/api/widget", {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ ...form, clientId: id }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setSaveError(d.error || "Erreur"); return; }
    setEditMode(false);
    setHasConfig(true);
  }

  function embedCode() {
    if (!clientSlug) return "";
    return `<script src="${window.location.origin}/api/widget/${clientSlug}/embed"></script>`;
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
            {saveError && <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{saveError}</p>}
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
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Icône avatar</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "robot", label: "Robot", svg: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="4"/><circle cx="8" cy="11" r="1.5" fill="currentColor"/><circle cx="16" cy="11" r="1.5" fill="currentColor"/><path d="M9 16c1 .7 2 1 3 1s2-.3 3-1"/><path d="M12 2v3"/><circle cx="12" cy="2" r="1.5" fill="currentColor"/><path d="M3 19l-2 2M21 19l2 2"/></svg>' },
                  { id: "bot", label: "Bot", svg: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="6" width="16" height="13" rx="3"/><circle cx="9" cy="12" r="1.5" fill="currentColor"/><circle cx="15" cy="12" r="1.5" fill="currentColor"/><path d="M8 17a4 4 0 0 0 8 0"/><ellipse cx="12" cy="6" rx="4" ry="1.5"/><circle cx="12" cy="4.5" r="1" fill="currentColor"/></svg>' },
                  { id: "sparkle", label: "Étincelle", svg: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2 7 7 1.5-7 2-2 7-2-7-7-2 7-1.5z"/><circle cx="12" cy="12" r="2" fill="currentColor" opacity=".35"/></svg>' },
                  { id: "heart", label: "Coeur", svg: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/><path d="M12 8l-1-1" stroke-width="1.5"/><circle cx="12" cy="8" r="1.2" fill="currentColor"/></svg>' },
                  { id: "chat", label: "Chat", svg: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 1-9 9H6l-3 3V9a9 9 0 0 1 9-9h0a9 9 0 0 1 9 12z"/><circle cx="9" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="15" cy="12" r="1.2" fill="currentColor"/></svg>' },
                  { id: "headset", label: "Casque", svg: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13v-2a8 8 0 0 1 16 0v2"/><rect x="2" y="13" width="5" height="7" rx="2.5"/><rect x="17" y="13" width="5" height="7" rx="2.5"/><path d="M12 22v-1"/><circle cx="12" cy="10" r="1.5" fill="currentColor" opacity=".25"/></svg>' },
                  { id: "smile", label: "Sourire", svg: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 10v1"/><path d="M16 10v1"/><circle cx="8" cy="10.5" r="1.2" fill="currentColor"/><circle cx="16" cy="10.5" r="1.2" fill="currentColor"/><path d="M8 15c1.5 2 6.5 2 8 0" stroke-width="2.2"/></svg>' },
                  { id: "zap", label: "Éclair", svg: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10" fill="currentColor" opacity=".2"/><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/><circle cx="12" cy="10" r=".8" fill="currentColor"/></svg>' },
                  { id: "compass", label: "Boussole", svg: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3" fill="currentColor" opacity=".15"/><path d="M16.2 7.8l-2.5 7.5-7.5 2.5 2.5-7.5z" fill="currentColor" opacity=".2"/><path d="M16.2 7.8l-2.5 7.5-7.5 2.5"/></svg>' },
                  { id: "shield", label: "Bouclier", svg: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 3v7c0 5-8 10-8 10s-8-5-8-10V5l8-3z"/><path d="M9 12l2 2 4-4" stroke-width="2.5"/><circle cx="12" cy="10" r="4" fill="currentColor" opacity=".08"/></svg>' },
                  { id: "astronaut", label: "Astronaute", svg: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M7 15c1-2 3-3 5-3s4 1 5 3"/><circle cx="12" cy="9" r="2.5"/><path d="M12 6.5V4"/><circle cx="12" cy="4" r="1.2" fill="currentColor"/><ellipse cx="10" cy="9" rx=".5" ry=".5" fill="currentColor"/><ellipse cx="14" cy="9" rx=".5" ry=".5" fill="currentColor"/></svg>' },
                  { id: "friend", label: "Amical", svg: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="9" cy="11" r="1.5" fill="currentColor"/><circle cx="15" cy="11" r="1.5" fill="currentColor"/><path d="M7 16c1.5 2 8.5 2 10 0" stroke-width="2.2"/></svg>' },
                  { id: "ninja", label: "Ninja", svg: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M5 12h14"/><path d="M8 15c2.5 1.5 5.5 1.5 8 0"/><circle cx="9" cy="11.5" r="1.2" fill="currentColor"/><circle cx="15" cy="11.5" r="1.2" fill="currentColor"/><path d="M8 7L5 4M16 7l3-3"/></svg>' },
                  { id: "genius", label: "Génie", svg: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="6"/><ellipse cx="12" cy="13" rx="4" ry="1.5" fill="currentColor" opacity=".12"/><circle cx="10" cy="12.5" r=".8" fill="currentColor"/><circle cx="14" cy="12.5" r=".8" fill="currentColor"/><path d="M17 6l2-2"/><circle cx="19" cy="4" r="1.5" fill="currentColor" opacity=".25"/></svg>' },
                  { id: "alien", label: "Alien", svg: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="13" rx="8" ry="9"/><ellipse cx="8.5" cy="11.5" rx="2" ry="2.5"/><ellipse cx="15.5" cy="11.5" rx="2" ry="2.5"/><circle cx="8.5" cy="11.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="11.5" r="1.2" fill="currentColor"/><circle cx="12" cy="15" r=".8" fill="currentColor"/><path d="M9 18c1 .7 5 .7 6 0"/></svg>' },
                  { id: "robot2", label: "Robot 2", svg: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="6" width="14" height="12" rx="2"/><circle cx="9" cy="11" r="1.5" fill="currentColor"/><circle cx="15" cy="11" r="1.5" fill="currentColor"/><path d="M8 16a4 4 0 0 0 8 0"/><path d="M12 4v2"/><circle cx="12" cy="4" r="1" fill="currentColor"/><rect x="5" y="13" width="14" height="1" opacity=".3"/><path d="M5 18l-2 2M19 18l2 2"/></svg>' },
                ].map((a) => (
                    <button key={a.id} type="button" onClick={() => setForm({ ...form, avatarIcon: a.id })}
                      className={"flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all " + (form.avatarIcon === a.id ? "border-purple-500 bg-purple-50 shadow-sm" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50")}>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white" dangerouslySetInnerHTML={{ __html: a.svg }} />
                      <span className="text-xs font-medium text-gray-600">{a.label}</span>
                    </button>
                  ))}
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
