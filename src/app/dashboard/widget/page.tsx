"use client";

import { useEffect, useState } from "react";

const ANIMATIONS = ["pulse", "bounce", "ring", "shimmer", "rotate", "breath", "none"];

interface WidgetConfig {
  id: string;
  welcomeTitle: string;
  welcomeSub: string;
  showBrand: boolean;
  position: string;
  marginBottom: number;
  marginRight: number;
  avatarIcon: string;
  buttonAnimation: string;
  buttonLabel: string;
  buttonLabelDuration: number;
  clientId: string;
  aiColor: string;
}

export default function WidgetPage() {
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientSlug, setClientSlug] = useState("");
  const [form, setForm] = useState({
    welcomeTitle: "Bienvenue !",
    welcomeSub: "Comment puis-je vous aider ?",
    showBrand: true,
    position: "right",
    marginBottom: 20,
    marginRight: 20,
    buttonAnimation: "pulse",
    buttonLabel: "",
    buttonLabelDuration: 8,
    avatarIcon: "robot",
    aiColor: "#7c3aed",
  });
  const [showButtonLabel, setShowButtonLabel] = useState(false);
  const [editMode, setEditMode] = useState(false);

  function token() { return localStorage.getItem("token") || ""; }

  useEffect(() => {
    const t = token();
    if (!t) return;
    const payload = JSON.parse(atob(t.split(".")[1]));
    setClientSlug("");

    fetch("/api/clients", { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then(async (clients) => {
        const client = clients.find((c: any) => c.id === payload.clientId);
        if (client) setClientSlug(client.slug);

        const res = await fetch(`/api/widget/${client?.slug || ""}`, { cache: "no-store" });
        const data = await res.json();
        if (data.widgetConfig) {
          setConfig(data.widgetConfig);
          const wc = data.widgetConfig;
          setForm({
            welcomeTitle: wc.welcomeTitle,
            welcomeSub: wc.welcomeSub,
            showBrand: wc.showBrand,
            position: wc.position,
            marginBottom: wc.marginBottom,
            marginRight: wc.marginRight,
            buttonAnimation: wc.buttonAnimation || "pulse",
            buttonLabel: wc.buttonLabel || "",
            buttonLabelDuration: wc.buttonLabelDuration ?? 8,
            avatarIcon: wc.avatarIcon || "robot",
            aiColor: wc.aiColor || "#7c3aed",
          });
          setShowButtonLabel(!!wc.buttonLabel);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const t = token();
    const payload = JSON.parse(atob(t.split(".")[1]));

    const body = { ...form, buttonLabel: showButtonLabel ? form.buttonLabel : "" };

    if (config) {
      await fetch(`/api/widget/${clientSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify({ ...body, clientId: payload.clientId }),
      });
    } else {
      await fetch("/api/widget", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify({ ...body, clientId: payload.clientId }),
      });
    }
    setSaving(false);
    setEditMode(false);
  }

  function embedCode(slug: string) {
    return `<script src="${window.location.origin}/api/widget/${slug}/embed.js"></script>`;
  }

  if (loading) return <p className="text-gray-500">Chargement...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Configuration du widget</h1>

      {clientSlug && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-medium text-green-800 mb-2">Code d'intégration</p>
          <code className="text-xs bg-white px-3 py-2 rounded border block break-all select-all">
            {embedCode(clientSlug)}
          </code>
          <p className="text-xs text-green-600 mt-2">Copiez ce script et insérez-le dans le &lt;head&gt; de votre site.</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6 max-w-lg">
        {!editMode ? (
          <div>
            <div className="space-y-3 mb-6">
              <p><span className="text-gray-500 text-sm">Titre :</span> <span className="font-medium">{form.welcomeTitle}</span></p>
              <p><span className="text-gray-500 text-sm">Sous-titre :</span> <span>{form.welcomeSub}</span></p>
              <p><span className="text-gray-500 text-sm">Position :</span> <span>{form.position === "right" ? "Droite" : "Gauche"}</span></p>
              <p><span className="text-gray-500 text-sm">Marges :</span> <span>bas {form.marginBottom}px / {form.position === "right" ? "droite" : "gauche"} {form.marginRight}px</span></p>
              <p><span className="text-gray-500 text-sm">Animation :</span> <span className="capitalize">{form.buttonAnimation}</span></p>
              <p><span className="text-gray-500 text-sm">Message :</span> <span>{form.buttonLabel || "—"}</span></p>
              <p><span className="text-gray-500 text-sm">Marque :</span> <span>{form.showBrand ? "Affichée" : "Masquée"}</span></p>
              <p><span className="text-gray-500 text-sm">Couleur IA :</span> <span className="inline-block w-4 h-4 rounded align-middle" style={{ background: form.aiColor }} /> <span className="text-xs font-mono">{form.aiColor}</span></p>
            </div>
            <button onClick={() => setEditMode(true)} className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700">Modifier</button>
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

            <div>
              <label className="block text-sm font-medium mb-2">Animation du bouton</label>
              <div className="flex flex-wrap gap-2">
                {ANIMATIONS.map((a) => (
                  <button key={a} type="button" onClick={() => setForm({ ...form, buttonAnimation: a })}
                    className={"px-4 py-2 rounded-lg border text-sm capitalize transition-all " + (form.buttonAnimation === a ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-medium" : "border-gray-200 hover:border-gray-300")}>
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 mb-2">
                <input type="checkbox" checked={showButtonLabel} onChange={(e) => setShowButtonLabel(e.target.checked)} className="rounded" />
                <span className="text-sm font-medium">Afficher un message d'accueil sur le bouton</span>
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
              <div>
                <label className="block text-sm font-medium mb-1">Marge bas (px)</label>
                <input type="number" value={form.marginBottom} onChange={(e) => setForm({ ...form, marginBottom: +e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Marge {form.position === "right" ? "droite" : "gauche"} (px)</label>
                <input type="number" value={form.marginRight} onChange={(e) => setForm({ ...form, marginRight: +e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.showBrand} onChange={(e) => setForm({ ...form, showBrand: e.target.checked })} className="rounded" />
              <span className="text-sm">Afficher "Propulsé par Nova"</span>
            </label>
            <div>
              <label className="block text-sm font-medium mb-1">Couleur mode IA</label>
              <div className="flex items-center gap-3">
                <input type="color" value={form.aiColor} onChange={(e) => setForm({ ...form, aiColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer border" />
                <input value={form.aiColor} onChange={(e) => setForm({ ...form, aiColor: e.target.value })} placeholder="#7c3aed" className="w-28 border rounded-lg px-3 py-2 text-sm font-mono" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
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
