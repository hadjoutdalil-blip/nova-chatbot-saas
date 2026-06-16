"use client";

import { useEffect, useState } from "react";
import { Save, Eye } from "lucide-react";

export default function AppWidgetPage() {
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
    if (!t) return;
    const payload = JSON.parse(atob(t.split(".")[1]));
    fetch("/api/clients", { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then(async (clients) => {
        const client = clients.find((c: any) => c.id === payload.clientId);
        if (!client) return;
        setClientSlug(client.slug);
        const res = await fetch(`/api/widget/${client.slug}`, { cache: "no-store" });
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
  }, []);

  const [saveError, setSaveError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    const t = token();
    const payload = JSON.parse(atob(t.split(".")[1]));
    const method = hasConfig ? "PUT" : "POST";
    const res = await fetch("/api/widget", {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ ...form, clientId: payload.clientId }),
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

  if (loading) return <div className="text-center py-20 text-gray-400">Chargement...</div>;

  const avatarOptions = [
    { id: "robot", label: "Robot", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M5 5L9 9M19 5L15 9M5 19L9 15M19 19L15 15"/><circle cx="9" cy="12" r="1.5" fill="currentColor"/><circle cx="15" cy="12" r="1.5" fill="currentColor"/></svg>' },
    { id: "bot", label: "Bot", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="4"/><circle cx="8.5" cy="12.5" r="1.5" fill="currentColor"/><circle cx="15.5" cy="12.5" r="1.5" fill="currentColor"/><path d="M7 17a5 5 0 0 0 10 0"/><path d="M12 2v5M8 4l4 3 4-3"/></svg>' },
    { id: "sparkle", label: "Étincelle", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5z"/><circle cx="12" cy="12" r="3" fill="currentColor" opacity=".3"/></svg>' },
    { id: "heart", label: "Cœur", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/><path d="M12 8.5l-1.5-1.5" stroke-width="1.5"/><circle cx="12" cy="8.5" r="1" fill="currentColor"/></svg>' },
    { id: "chat", label: "Chat", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 13.5a3 3 0 0 1-3 3H7l-4 4V5a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3v8.5z"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="12" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/></svg>' },
    { id: "headset", label: "Casque", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14v-3a8 8 0 0 1 16 0v3"/><rect x="2" y="13" width="5" height="7" rx="2"/><rect x="17" y="13" width="5" height="7" rx="2"/><path d="M12 22v-2"/><circle cx="12" cy="12" r="2" fill="currentColor" opacity=".2"/></svg>' },
    { id: "smile", label: "Sourire", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/><path d="M8 14s1.5 3 4 3 4-3 4-3"/></svg>' },
    { id: "zap", label: "Éclair", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10" fill="currentColor" opacity=".2"/><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/></svg>' },
    { id: "compass", label: "Boussole", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z" fill="currentColor" opacity=".2"/><path d="M16.24 7.76l-2.12 6.36-6.36 2.12"/></svg>' },
    { id: "shield", label: "Bouclier", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l7 3v7c0 4-7 9-7 9s-7-5-7-9V5l7-3z"/><path d="M9 12l2 2 4-4" stroke-width="2.5"/></svg>' },
    { id: "globe", label: "Globe", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="3" ry="9"/><path d="M3 12h18"/></svg>' },
    { id: "star", label: "Étoile", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" fill="currentColor" opacity=".2"/><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/></svg>' },
    { id: "pulse", label: "Activité", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>' },
    { id: "crystal", label: "Cristal", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>' },
    { id: "moon", label: "Lune", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>' },
    { id: "palette", label: "Palette", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-1 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-4.42-4.5-8-10-8z"/></svg>' },
  ];
  const avatarGridCols = avatarOptions.length > 6 ? "grid-cols-4" : "grid-cols-3";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Mon widget</h1>
      <p className="text-gray-500 mb-6">Configurez l&apos;apparence et récupérez le code à installer sur votre site.</p>

      {clientSlug && (
        <div className="bg-green-50/80 backdrop-blur-sm border border-green-200/60 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Eye size={16} className="text-green-600" />
            <p className="text-sm font-medium text-green-800">Code d&apos;intégration</p>
          </div>
          <code className="text-xs bg-white/90 px-4 py-2.5 rounded-xl border border-green-100 block break-all select-all font-mono">{embedCode()}</code>
          <p className="text-xs text-green-600 mt-2">Copiez ce script dans le &lt;head&gt; de votre site.</p>
        </div>
      )}

      <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-elevated p-6 max-w-lg">
        {!editMode ? (
          <div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm"><span className="text-gray-400 w-24">Titre :</span><span className="font-medium text-gray-900">{form.welcomeTitle}</span></div>
              <div className="flex items-center gap-2 text-sm"><span className="text-gray-400 w-24">Sous-titre :</span><span className="text-gray-600">{form.welcomeSub}</span></div>
              <div className="flex items-center gap-2 text-sm"><span className="text-gray-400 w-24">Position :</span><span className="text-gray-900">{form.position === "right" ? "Droite" : "Gauche"}</span></div>
              <div className="flex items-center gap-2 text-sm"><span className="text-gray-400 w-24">Marges :</span><span className="text-gray-900">bas {form.marginBottom}px</span></div>
            </div>
            <button onClick={() => setEditMode(true)} className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:from-purple-700 hover:to-purple-600 transition-all shadow-lg shadow-purple-200">
              Modifier
            </button>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            {saveError && <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{saveError}</p>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Titre de bienvenue</label>
              <input value={form.welcomeTitle} onChange={(e) => setForm({ ...form, welcomeTitle: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sous-titre</label>
              <input value={form.welcomeSub} onChange={(e) => setForm({ ...form, welcomeSub: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Icône avatar</label>
              <div className={"grid " + avatarGridCols + " gap-2"}>
                {avatarOptions.map((a) => (
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Position</label>
                <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none">
                  <option value="right">Droite</option>
                  <option value="left">Gauche</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Marge bas (px)</label>
                <input type="number" value={form.marginBottom} onChange={(e) => setForm({ ...form, marginBottom: +e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Marge {form.position === "right" ? "droite" : "gauche"} (px)</label>
                <input type="number" value={form.marginRight} onChange={(e) => setForm({ ...form, marginRight: +e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
              </div>
            </div>

            <label className="flex items-center gap-2.5 py-1">
              <input type="checkbox" checked={form.showBrand} onChange={(e) => setForm({ ...form, showBrand: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
              <span className="text-sm text-gray-700">Afficher &quot;Propulsé par Nova&quot;</span>
            </label>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:from-purple-700 hover:to-purple-600 transition-all disabled:opacity-50 shadow-lg shadow-purple-200">
                <Save size={16} /> {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button type="button" onClick={() => setEditMode(false)} className="text-gray-500 hover:text-gray-700 text-sm px-4">Annuler</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
