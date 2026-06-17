"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const ANIMATIONS = ["pulse", "bounce", "ring", "shimmer", "rotate", "breath", "none"];

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
    proactiveEnabled: false,
    autoOpenDelay: 5,
    showNotification: true,
    notificationText: "",
    sendGreeting: false,
    scrollTrigger: 0,
    exitIntent: false,
    buttonAnimation: "pulse",
    buttonLabel: "",
    buttonLabelDuration: 8,
    avatarIcon: "robot",
    buttonIcon: "",
  });
  const [hasCustomIcon, setHasCustomIcon] = useState(false);
  const [showButtonLabel, setShowButtonLabel] = useState(false);
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
          const wc = data.widgetConfig;
          setForm({
            welcomeTitle: wc.welcomeTitle,
            welcomeSub: wc.welcomeSub,
            showBrand: wc.showBrand,
            position: wc.position,
            marginBottom: wc.marginBottom,
            marginRight: wc.marginRight,
            proactiveEnabled: wc.proactiveEnabled === true,
            autoOpenDelay: wc.autoOpenDelay ?? 5,
            showNotification: wc.showNotification !== false,
            notificationText: wc.notificationText || "",
            sendGreeting: wc.sendGreeting === true,
            scrollTrigger: wc.scrollTrigger ?? 0,
            exitIntent: wc.exitIntent === true,
            buttonAnimation: wc.buttonAnimation || "pulse",
            buttonLabel: wc.buttonLabel || "",
            buttonLabelDuration: wc.buttonLabelDuration ?? 8,
            buttonIcon: wc.buttonIcon ?? "",
            avatarIcon: wc.avatarIcon || "robot",
          });
          setShowButtonLabel(!!wc.buttonLabel);
          setHasCustomIcon(!!wc.buttonIcon);
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
    const body = { ...form, buttonLabel: showButtonLabel ? form.buttonLabel : "", buttonIcon: hasCustomIcon ? form.buttonIcon : "" };
    const res = await fetch("/api/widget", {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ ...body, clientId: id }),
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
              <p><span className="text-gray-500 text-sm">Icône :</span> <span>{hasCustomIcon ? <img src={form.buttonIcon} alt="" className="w-6 h-6 rounded-full inline-block object-cover" /> : <span className="font-medium capitalize">{form.avatarIcon}</span>}</span></p>
              <p><span className="text-gray-500 text-sm">Animation :</span> <span className="capitalize">{form.buttonAnimation}</span></p>
              <p><span className="text-gray-500 text-sm">Message :</span> <span>{form.buttonLabel || "—"}</span></p>
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

            {/* Animation selector */}
            <div>
              <label className="block text-sm font-medium mb-2">Animation du bouton</label>
              <div className="flex flex-wrap gap-2">
                {ANIMATIONS.map((a) => (
                  <button key={a} type="button" onClick={() => setForm({ ...form, buttonAnimation: a })}
                    className={"px-4 py-2 rounded-lg border text-sm capitalize transition-all " + (form.buttonAnimation === a ? "border-purple-500 bg-purple-50 text-purple-700 font-medium" : "border-gray-200 hover:border-gray-300")}>
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Button label */}
            <div>
              <label className="flex items-center gap-2 mb-2">
                <input type="checkbox" checked={showButtonLabel} onChange={(e) => setShowButtonLabel(e.target.checked)} className="rounded" />
                <span className="text-sm font-medium">Message d'accueil sur le bouton</span>
              </label>
              {showButtonLabel && (
                <div className="pl-6 space-y-2">
                  <input value={form.buttonLabel} onChange={(e) => setForm({ ...form, buttonLabel: e.target.value })}
                    placeholder="Une question ?"
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">Disparaît après</label>
                    <input type="number" min="2" max="30" value={form.buttonLabelDuration} onChange={(e) => setForm({ ...form, buttonLabelDuration: +e.target.value })}
                      className="w-16 border rounded-lg px-2 py-1 text-sm" />
                    <span className="text-xs text-gray-500">secondes</span>
                  </div>
                </div>
              )}
            </div>

            {/* Avatar picker */}
            <div>
              <label className="block text-sm font-medium mb-2">Icône du bouton</label>

              {hasCustomIcon ? (
                <div className="mb-3 p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <p className="text-xs text-purple-600 mb-2">Icône personnalisée</p>
                  <img src={form.buttonIcon} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-purple-300 mb-2" />
                  <div className="flex gap-2">
                    <label className="cursor-pointer text-xs font-medium text-purple-600 bg-white px-4 py-1.5 rounded-lg border border-purple-200 hover:bg-purple-50 transition-all">
                      Changer
                      <input type="file" accept=".png,.gif" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const fd = new FormData();
                        fd.append("file", file);
                        const t = token();
                        const res = await fetch("/api/widget/upload-icon?clientId=" + id, { method: "POST", headers: { Authorization: `Bearer ${t}` }, body: fd });
                        const data = await res.json();
                        if (data.url) { setForm({ ...form, buttonIcon: data.url }); setHasCustomIcon(true); }
                      }} />
                    </label>
                    <button type="button" onClick={async () => {
                      const t = token();
                      await fetch("/api/widget/delete-icon?clientId=" + id, { method: "DELETE", headers: { Authorization: `Bearer ${t}` } });
                      setForm({ ...form, buttonIcon: "" }); setHasCustomIcon(false);
                    }} className="text-xs text-red-500 bg-white px-4 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-all">
                      Supprimer
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    <label className="cursor-pointer inline-flex items-center gap-2 text-sm font-medium text-purple-600 bg-purple-50 px-4 py-2.5 rounded-xl border border-purple-200 hover:bg-purple-100 transition-all">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      Upload PNG / GIF
                      <input type="file" accept=".png,.gif" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const fd = new FormData();
                        fd.append("file", file);
                        const t = token();
                        const res = await fetch("/api/widget/upload-icon?clientId=" + id, { method: "POST", headers: { Authorization: `Bearer ${t}` }, body: fd });
                        const data = await res.json();
                        if (data.url) { setForm({ ...form, buttonIcon: data.url }); setHasCustomIcon(true); }
                      }} />
                    </label>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">Ou choisissez un avatar :</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: "robot", label: "Robot", svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="12" rx="3"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><path d="M9 16c1 1 2 1 3 0"/><path d="M12 7V4"/><circle cx="12" cy="3" r="1"/></svg>' },
                      { id: "bot", label: "Bot", svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="14" rx="4"/><circle cx="9" cy="11" r="1.5"/><circle cx="15" cy="11" r="1.5"/><rect x="9" y="15" width="6" height="1.5" rx=".75"/><path d="M12 5V3"/><circle cx="12" cy="2" r="1"/></svg>' },
                      { id: "sparkle", label: "Étincelle", svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/><circle cx="9.5" cy="11" r=".5" fill="currentColor"/><circle cx="14.5" cy="11" r=".5" fill="currentColor"/></svg>' },
                      { id: "heart", label: "Coeur", svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' },
                      { id: "chat", label: "Chat", svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="12" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/></svg>' },
                      { id: "headset", label: "Casque", svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14v-3a8 8 0 0 1 16 0v3"/><path d="M18 19c0 1.1-.9 2-2 2h-1v-4h1a2 2 0 0 1 2 2z"/><path d="M6 19c0 1.1.9 2 2 2h1v-4H8a2 2 0 0 0-2 2z"/><circle cx="9" cy="10" r="1"/><circle cx="15" cy="10" r="1"/><path d="M9.5 14c.5.5 2 .5 2.5 0"/></svg>' },
                      { id: "smile", label: "Sourire", svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="8" cy="10" r="1.5"/><circle cx="16" cy="10" r="1.5"/><path d="M8 15c1.5 2 4.5 2 6 0"/></svg>' },
                      { id: "zap", label: "Éclair", svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/></svg>' },
                      { id: "compass", label: "Boussole", svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>' },
                      { id: "shield", label: "Bouclier", svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>' },
                      { id: "astronaut", label: "Astronaute", svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="9" cy="11" r="1.5"/><circle cx="15" cy="11" r="1.5"/><path d="M10 15.5c1 .5 3 .5 4 0"/><path d="M19 12c0 3-3 6-8 6s-7-3-7-6"/></svg>' },
                      { id: "friend", label: "Amical", svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="8" cy="10" r="1.5"/><circle cx="16" cy="10" r="1.5"/><path d="M8 14.5c1.5 2 4.5 2 6 0"/></svg>' },
                      { id: "ninja", label: "Ninja", svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M6 10c0-2 12-2 12 0"/><circle cx="9" cy="11" r="1" fill="currentColor"/><circle cx="15" cy="11" r="1" fill="currentColor"/><path d="M10 15.5l2-2 2 2"/></svg>' },
                      { id: "genius", label: "Génie", svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="8" cy="11" r="3"/><circle cx="16" cy="11" r="3"/><path d="M11 11h2"/><path d="M8 14c1.5 2 4.5 2 6 0"/></svg>' },
                      { id: "alien", label: "Alien", svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="14" rx="9" ry="8"/><ellipse cx="8" cy="12" rx="2" ry="3"/><ellipse cx="16" cy="12" rx="2" ry="3"/><circle cx="12" cy="16" r="1.5"/><path d="M5.5 6.5c-2-2 0-4 2-2"/><path d="M18.5 6.5c2-2 0-4-2-2"/></svg>' },
                      { id: "robot2", label: "Robot 2", svg: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/><circle cx="9" cy="11" r="1.5"/><circle cx="15" cy="11" r="1.5"/><rect x="9" y="15" width="6" height="1.5" rx=".75"/><path d="M12 6V3"/><circle cx="12" cy="2" r="1"/></svg>' },
                    ].map((a) => (
                        <button key={a.id} type="button" onClick={() => setForm({ ...form, avatarIcon: a.id })}
                          className={"flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all " + (form.avatarIcon === a.id ? "border-purple-500 bg-purple-50 shadow-sm" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50")}>
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white" dangerouslySetInnerHTML={{ __html: a.svg }} />
                          <span className="text-xs font-medium text-gray-600">{a.label}</span>
                        </button>
                      ))}
                    </div>
                </>
              )}
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
