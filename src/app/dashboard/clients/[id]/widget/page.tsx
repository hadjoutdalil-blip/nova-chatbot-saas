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
    proactiveEnabled: false,
    autoOpenDelay: 5,
    showNotification: true,
    notificationText: "",
    sendGreeting: false,
    scrollTrigger: 0,
    exitIntent: false,
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
            proactiveEnabled: data.widgetConfig.proactiveEnabled === true,
            autoOpenDelay: data.widgetConfig.autoOpenDelay ?? 5,
            showNotification: data.widgetConfig.showNotification !== false,
            notificationText: data.widgetConfig.notificationText || "",
            sendGreeting: data.widgetConfig.sendGreeting === true,
            scrollTrigger: data.widgetConfig.scrollTrigger ?? 0,
            exitIntent: data.widgetConfig.exitIntent === true,
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
              <p><span className="text-gray-500 text-sm">Proactif :</span> <span className={form.proactiveEnabled ? "text-green-600 font-medium" : ""}>{form.proactiveEnabled ? "Activé" : "Désactivé"}</span></p>
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
                  { id: "robot", label: "Robot", svg: '<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="26" fill="#4A90D9"/><circle cx="22" cy="28" r="7" fill="#fff"/><circle cx="42" cy="28" r="7" fill="#fff"/><circle cx="22" cy="28" r="3.5" fill="#1a1a2e"/><circle cx="42" cy="28" r="3.5" fill="#1a1a2e"/><path d="M24 46Q32 54 40 46" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/><rect x="29" y="8" width="6" height="10" rx="3" fill="#4A90D9"/><circle cx="32" cy="6" r="4.5" fill="#FFD700"/></svg>' },
                  { id: "bot", label: "Bot", svg: '<svg viewBox="0 0 64 64" width="24" height="24"><rect x="10" y="14" width="44" height="38" rx="10" fill="#2ECC71"/><rect x="18" y="24" width="10" height="10" rx="2" fill="#fff"/><rect x="36" y="24" width="10" height="10" rx="2" fill="#fff"/><rect x="18" y="24" width="5" height="10" fill="#1a1a2e"/><rect x="36" y="24" width="5" height="10" fill="#1a1a2e"/><rect x="24" y="42" width="16" height="4" rx="2" fill="#fff"/><rect x="29" y="6" width="6" height="10" rx="3" fill="#2ECC71"/><circle cx="32" cy="4" r="3.5" fill="#E74C3C"/></svg>' },
                  { id: "sparkle", label: "Étincelle", svg: '<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="26" fill="#9B59B6"/><path d="M32 8l4 12 12-4-8 10 8 12-12-4-4 12-4-12-12 4 8-12-8-10 12 4z" fill="#FFD700" opacity=".3"/><circle cx="22" cy="28" r="7" fill="#fff"/><circle cx="42" cy="28" r="7" fill="#fff"/><circle cx="22" cy="28" r="4" fill="#fff"/><circle cx="42" cy="28" r="4" fill="#fff"/><path d="M24 46Q32 54 40 46" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>' },
                  { id: "heart", label: "Coeur", svg: '<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="26" fill="#E74C3C"/><path d="M18 26Q22 18 26 26Q30 18 32 26" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/><path d="M32 26Q34 18 38 26Q42 18 46 26" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/><circle cx="18" cy="26" r="1.5" fill="#E74C3C"/><circle cx="32" cy="26" r="1.5" fill="#E74C3C"/><circle cx="46" cy="26" r="1.5" fill="#E74C3C"/><path d="M24 46Q32 54 40 46" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="16" cy="40" r="4.5" fill="#fff" opacity=".25"/><circle cx="48" cy="40" r="4.5" fill="#fff" opacity=".25"/></svg>' },
                  { id: "chat", label: "Chat", svg: '<svg viewBox="0 0 64 64" width="24" height="24"><path d="M32 10L18 24h-6v30h40V24h-6L32 10z" fill="#FF6B6B"/><circle cx="22" cy="30" r="7" fill="#fff"/><circle cx="42" cy="30" r="7" fill="#fff"/><circle cx="22" cy="30" r="3.5" fill="#1a1a2e"/><circle cx="42" cy="30" r="3.5" fill="#1a1a2e"/><path d="M24 46Q32 54 40 46" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M14 38L10 42M50 38L54 42" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>' },
                  { id: "headset", label: "Casque", svg: '<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="24" fill="#1ABC9C"/><rect x="6" y="30" width="10" height="18" rx="5" fill="#16A085"/><rect x="48" y="30" width="10" height="18" rx="5" fill="#16A085"/><circle cx="22" cy="28" r="7" fill="#fff"/><circle cx="42" cy="28" r="7" fill="#fff"/><circle cx="22" cy="28" r="3.5" fill="#1a1a2e"/><circle cx="42" cy="28" r="3.5" fill="#1a1a2e"/><path d="M24 46Q32 54 40 46" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="32" cy="48" r="2.5" fill="#E74C3C"/></svg>' },
                  { id: "smile", label: "Sourire", svg: '<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="26" fill="#F1C40F"/><circle cx="22" cy="28" r="7" fill="#fff"/><circle cx="42" cy="28" r="7" fill="#fff"/><circle cx="22" cy="28" r="4" fill="#333"/><circle cx="42" cy="28" r="4" fill="#333"/><circle cx="16" cy="40" r="5" fill="#E74C3C" opacity=".35"/><circle cx="48" cy="40" r="5" fill="#E74C3C" opacity=".35"/><path d="M22 48Q32 58 42 48" stroke="#333" stroke-width="4" fill="none" stroke-linecap="round"/></svg>' },
                  { id: "zap", label: "Éclair", svg: '<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="26" fill="#F39C12"/><path d="M32 8l-8 20h8l-4 24 16-28h-8l8-16z" fill="#E67E22" opacity=".4"/><circle cx="22" cy="28" r="7" fill="#fff"/><circle cx="42" cy="28" r="7" fill="#fff"/><circle cx="22" cy="28" r="3.5" fill="#333"/><circle cx="42" cy="28" r="3.5" fill="#333"/><path d="M24 46Q32 54 40 46" stroke="#333" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>' },
                  { id: "compass", label: "Boussole", svg: '<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="26" fill="#3F51B5"/><circle cx="32" cy="28" r="10" fill="#fff" opacity=".15"/><path d="M32 22v12M26 28h12" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><circle cx="22" cy="28" r="7" fill="#fff"/><circle cx="42" cy="28" r="7" fill="#fff"/><circle cx="22" cy="28" r="3.5" fill="#1a1a2e"/><circle cx="42" cy="28" r="3.5" fill="#1a1a2e"/><path d="M24 46Q32 54 40 46" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>' },
                  { id: "shield", label: "Bouclier", svg: '<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="26" fill="#546E7A"/><path d="M32 14l14 5v12c0 10-14 17-14 17s-14-7-14-17V19l14-5z" fill="#78909C" opacity=".5"/><circle cx="22" cy="28" r="7" fill="#fff"/><circle cx="42" cy="28" r="7" fill="#fff"/><circle cx="22" cy="28" r="3.5" fill="#1a1a2e"/><circle cx="42" cy="28" r="3.5" fill="#1a1a2e"/><path d="M24 46Q32 54 40 46" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M32 14l14 5v12c0 10-14 17-14 17s-14-7-14-17V19l14-5z" stroke="#fff" stroke-width="2.5" fill="none"/></svg>' },
                  { id: "astronaut", label: "Astronaute", svg: '<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="26" fill="#2C3E50"/><circle cx="32" cy="34" r="20" fill="#B0BEC5"/><circle cx="22" cy="28" r="7" fill="#fff"/><circle cx="42" cy="28" r="7" fill="#fff"/><circle cx="22" cy="28" r="3.5" fill="#1a1a2e"/><circle cx="42" cy="28" r="3.5" fill="#1a1a2e"/><path d="M24 46Q32 54 40 46" stroke="#1a1a2e" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="44" cy="52" r="4" fill="#fff" opacity=".25"/></svg>' },
                  { id: "friend", label: "Amical", svg: '<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="26" fill="#E91E8A"/><path d="M18 28Q22 20 26 28Q30 20 34 28Q38 20 42 28Q46 20 46 28" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/><path d="M24 46Q32 54 40 46" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="16" cy="40" r="4.5" fill="#fff" opacity=".3"/><circle cx="48" cy="40" r="4.5" fill="#fff" opacity=".3"/></svg>' },
                  { id: "ninja", label: "Ninja", svg: '<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="26" fill="#6C5CE7"/><rect x="14" y="14" width="36" height="18" rx="9" fill="#2D1B69"/><circle cx="22" cy="28" r="5" fill="#fff"/><circle cx="42" cy="28" r="5" fill="#fff"/><circle cx="22" cy="28" r="2.5" fill="#1a1a2e"/><circle cx="42" cy="28" r="2.5" fill="#1a1a2e"/><path d="M26 46Q32 52 38 46" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="32" cy="8" r="4" fill="#FFD700"/></svg>' },
                  { id: "genius", label: "Génie", svg: '<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="26" fill="#E67E22"/><circle cx="32" cy="10" r="8" fill="#FFD700"/><path d="M32 6v8M28 10h8" stroke="#E67E22" stroke-width="2.5" stroke-linecap="round"/><circle cx="22" cy="30" r="7" fill="#fff"/><circle cx="42" cy="30" r="7" fill="#fff"/><circle cx="22" cy="30" r="3.5" fill="#333"/><circle cx="42" cy="30" r="3.5" fill="#333"/><rect x="16" y="26" width="32" height="4" rx="2" fill="#333" opacity=".5"/><path d="M26 46Q32 52 38 46" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></svg>' },
                  { id: "alien", label: "Alien", svg: '<svg viewBox="0 0 64 64" width="24" height="24"><ellipse cx="32" cy="36" rx="28" ry="22" fill="#00E676"/><circle cx="20" cy="28" r="8" fill="#fff"/><circle cx="44" cy="28" r="8" fill="#fff"/><circle cx="32" cy="36" r="5" fill="#fff"/><circle cx="20" cy="28" r="4" fill="#1a1a2e"/><circle cx="44" cy="28" r="4" fill="#1a1a2e"/><circle cx="32" cy="36" r="2.5" fill="#1a1a2e"/><path d="M24 48Q32 54 40 48" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M12 20Q8 12 16 14" stroke="#00E676" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M52 20Q56 12 48 14" stroke="#00E676" stroke-width="3" fill="none" stroke-linecap="round"/></svg>' },
                  { id: "robot2", label: "Robot 2", svg: '<svg viewBox="0 0 64 64" width="24" height="24"><rect x="10" y="14" width="44" height="40" rx="8" fill="#95A5A6"/><circle cx="22" cy="30" r="7" fill="#fff"/><circle cx="42" cy="30" r="7" fill="#fff"/><circle cx="22" cy="30" r="3.5" fill="#333"/><circle cx="42" cy="30" r="3.5" fill="#333"/><rect x="26" y="44" width="12" height="4" rx="2" fill="#333"/><rect x="14" y="12" width="8" height="3" rx="1.5" fill="#E74C3C"/><rect x="28" y="12" width="8" height="3" rx="1.5" fill="#F1C40F"/><rect x="42" y="12" width="8" height="3" rx="1.5" fill="#2ECC71"/></svg>' },
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

            <div className="border-t pt-4 mt-3">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">🔔 Engagement visiteur</h3>
              <label className="flex items-center gap-2 mb-3">
                <input type="checkbox" checked={form.proactiveEnabled} onChange={(e) => setForm({ ...form, proactiveEnabled: e.target.checked })} className="rounded" />
                <span className="text-sm font-medium">Activer le mode proactif</span>
              </label>
              {form.proactiveEnabled && (
                <div className="space-y-3 pl-4 border-l-2 border-purple-200">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Ouverture automatique (secondes)</label>
                    <input type="number" min="0" max="60" value={form.autoOpenDelay} onChange={(e) => setForm({ ...form, autoOpenDelay: +e.target.value })} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Déclencheur scroll (%)</label>
                    <input type="number" min="0" max="100" value={form.scrollTrigger} onChange={(e) => setForm({ ...form, scrollTrigger: +e.target.value })} className="w-full border rounded-lg px-3 py-1.5 text-sm" />
                  </div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.exitIntent} onChange={(e) => setForm({ ...form, exitIntent: e.target.checked })} className="rounded" />
                    <span className="text-sm">Détecter la sortie</span>
                  </label>
                  <div className="border-t pt-3">
                    <label className="flex items-center gap-2 mb-2">
                      <input type="checkbox" checked={form.showNotification} onChange={(e) => setForm({ ...form, showNotification: e.target.checked })} className="rounded" />
                      <span className="text-sm">Notification</span>
                    </label>
                    {form.showNotification && (
                      <input value={form.notificationText} onChange={(e) => setForm({ ...form, notificationText: e.target.value })}
                        placeholder="Texte notification" className="w-full border rounded-lg px-3 py-1.5 text-sm mb-2" />
                    )}
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={form.sendGreeting} onChange={(e) => setForm({ ...form, sendGreeting: e.target.checked })} className="rounded" />
                      <span className="text-sm">Message bienvenue auto</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

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
