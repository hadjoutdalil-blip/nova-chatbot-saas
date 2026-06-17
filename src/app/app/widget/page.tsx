"use client";

import { useEffect, useState } from "react";
import { Save, Eye, Bell, MessageCircle, Timer, ScrollText, MousePointer2, Brain, Heart, Sparkles, RefreshCw, Disc3, Waves, X, MessageSquare } from "lucide-react";

const ANIMATIONS = [
  { id: "pulse", label: "Pulse", icon: Heart },
  { id: "bounce", label: "Bounce", icon: MessageCircle },
  { id: "ring", label: "Anneau", icon: Disc3 },
  { id: "shimmer", label: "Shimmer", icon: Sparkles },
  { id: "rotate", label: "Rotation", icon: RefreshCw },
  { id: "breath", label: "Respiration", icon: Waves },
  { id: "none", label: "Aucune", icon: X },
];

export default function AppWidgetPage() {
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
  }, []);

  const [saveError, setSaveError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    const t = token();
    const payload = JSON.parse(atob(t.split(".")[1]));
    const method = hasConfig ? "PUT" : "POST";
    const body = { ...form, clientId: payload.clientId, buttonLabel: showButtonLabel ? form.buttonLabel : "" };
    const res = await fetch("/api/widget", {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify(body),
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
              <div className="flex items-center gap-2 text-sm"><span className="text-gray-400 w-24">Animation :</span><span className="text-gray-900 capitalize">{form.buttonAnimation}</span></div>
              <div className="flex items-center gap-2 text-sm"><span className="text-gray-400 w-24">Message :</span><span className="text-gray-600">{form.buttonLabel || "—"}</span></div>
              <div className="flex items-center gap-2 text-sm"><span className="text-gray-400 w-24">Proactif :</span><span className={form.proactiveEnabled ? "text-green-600 font-medium" : "text-gray-400"}>{form.proactiveEnabled ? "Activé" : "Désactivé"}</span></div>
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

            {/* Animation selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Animation du bouton</label>
              <div className="grid grid-cols-4 gap-2">
                {ANIMATIONS.map((a) => {
                  const Icon = a.icon;
                  return (
                    <button key={a.id} type="button" onClick={() => setForm({ ...form, buttonAnimation: a.id })}
                      className={"flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all " + (form.buttonAnimation === a.id ? "border-purple-500 bg-purple-50 shadow-sm" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50")}>
                      <div className={"w-9 h-9 rounded-xl flex items-center justify-center " + (form.buttonAnimation === a.id ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-500")}>
                        <Icon size={18} />
                      </div>
                      <span className="text-[11px] font-medium text-gray-600">{a.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Button label */}
            <div className="border-t border-gray-100 pt-4">
              <label className="flex items-center gap-2.5 mb-3">
                <input type="checkbox" checked={showButtonLabel} onChange={(e) => setShowButtonLabel(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                <span className="text-sm text-gray-700 font-medium">
                  <MessageSquare size={14} className="inline mr-1.5 text-purple-500" />
                  Afficher un message d&apos;accueil sur le bouton
                </span>
              </label>
              {showButtonLabel && (
                <div className="pl-6 border-l-2 border-purple-100 space-y-3">
                  <input value={form.buttonLabel} onChange={(e) => setForm({ ...form, buttonLabel: e.target.value })}
                    placeholder="Une question ? Besoin d'aide ?"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" />
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Disparaît après (secondes)</label>
                    <input type="number" min="2" max="30" value={form.buttonLabelDuration} onChange={(e) => setForm({ ...form, buttonLabelDuration: +e.target.value })}
                      className="w-24 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" />
                  </div>
                </div>
              )}
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

            <div className="border-t border-gray-100 pt-5 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <Bell size={16} className="text-purple-600" />
                <h3 className="font-semibold text-sm text-gray-800">Engagement visiteur</h3>
              </div>

              <label className="flex items-center gap-2.5 mb-4">
                <input type="checkbox" checked={form.proactiveEnabled} onChange={(e) => setForm({ ...form, proactiveEnabled: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                <span className="text-sm text-gray-700 font-medium">Activer le mode proactif</span>
              </label>

              {form.proactiveEnabled && (
                <div className="space-y-4 pl-6 border-l-2 border-purple-100">
                  <div className="flex items-center gap-3">
                    <Timer size={14} className="text-gray-400" />
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-1">Ouverture automatique (secondes)</label>
                      <input type="number" min="0" max="60" value={form.autoOpenDelay} onChange={(e) => setForm({ ...form, autoOpenDelay: +e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <ScrollText size={14} className="text-gray-400" />
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-1">Déclencheur au scroll (%)</label>
                      <input type="number" min="0" max="100" value={form.scrollTrigger} onChange={(e) => setForm({ ...form, scrollTrigger: +e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                      <p className="text-xs text-gray-400 mt-1">0 = désactivé</p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2.5">
                    <MousePointer2 size={14} className="text-gray-400" />
                    <input type="checkbox" checked={form.exitIntent} onChange={(e) => setForm({ ...form, exitIntent: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                    <span className="text-sm text-gray-700">Détecter la sortie de page</span>
                  </label>

                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageCircle size={14} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Notification & message</span>
                    </div>

                    <label className="flex items-center gap-2.5 mb-3">
                      <input type="checkbox" checked={form.showNotification} onChange={(e) => setForm({ ...form, showNotification: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                      <span className="text-sm text-gray-700">Afficher une notification</span>
                    </label>

                    {form.showNotification && (
                      <div className="mb-3">
                        <label className="block text-sm text-gray-600 mb-1">Texte de la notification</label>
                        <input value={form.notificationText} onChange={(e) => setForm({ ...form, notificationText: e.target.value })}
                          placeholder="Une question ?"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                      </div>
                    )}

                    <label className="flex items-center gap-2.5">
                      <input type="checkbox" checked={form.sendGreeting} onChange={(e) => setForm({ ...form, sendGreeting: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                      <span className="text-sm text-gray-700">Envoyer un message de bienvenue à l&apos;ouverture</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

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
