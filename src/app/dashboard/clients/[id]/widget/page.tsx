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
  });
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
          });
          setShowButtonLabel(!!wc.buttonLabel);
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
    const body = { ...form, buttonLabel: showButtonLabel ? form.buttonLabel : "" };
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
