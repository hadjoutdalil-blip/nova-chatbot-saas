"use client";

import { useState, useEffect } from "react";

const ICONS = ["💬", "📦", "🚚", "💰", "🔧", "📞", "🏠", "📋", "⭐", "🔒", "📅", "🎯", "📝", "🛡️", "⚡", "💡", "📎", "🔔"];

interface FormData {
  tag?: string;
  question: string;
  alt_questions: string;
  short_resp: string;
  answer: string;
  category: string;
  keywords: string;
  priority: number;
  related_tags: string;
  icon: string;
}

interface KBModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: FormData) => Promise<void>;
  initialData?: FormData | null;
  categories: string[];
  title?: string;
}

export default function KBModal({ open, onClose, onSave, initialData, categories, title }: KBModalProps) {
  const [form, setForm] = useState<FormData>({
    tag: "", question: "", alt_questions: "", short_resp: "", answer: "", category: "", keywords: "", priority: 5, related_tags: "", icon: "",
  });
  const [altInput, setAltInput] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm(initialData);
      } else {
        setForm({ tag: "", question: "", alt_questions: "", short_resp: "", answer: "", category: "", keywords: "", priority: 5, related_tags: "", icon: "" });
      }
      setError("");
      setAltInput("");
    }
  }, [open, initialData]);

  function addAltQuestion() {
    const tag = altInput.trim();
    if (!tag) return;
    const existing = form.alt_questions ? form.alt_questions.split(",").map((s) => s.trim()) : [];
    if (existing.includes(tag)) return;
    existing.push(tag);
    setForm({ ...form, alt_questions: existing.join(", ") });
    setAltInput("");
  }

  function removeAltQuestion(idx: number) {
    const arr = form.alt_questions ? form.alt_questions.split(",").map((s) => s.trim()) : [];
    arr.splice(idx, 1);
    setForm({ ...form, alt_questions: arr.join(", ") });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'enregistrement");
    }
    setSaving(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold">{title || (initialData ? "Modifier l'entrée" : "Nouvelle entrée")}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div>
            <label className="block text-sm font-medium mb-1">Question principale</label>
            <input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tag (identifiant unique)</label>
              <input value={form.tag || ""} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="ex: presentation" className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Icône</label>
              <select value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                <option value="">—</option>
                {ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Questions alternatives</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.alt_questions ? form.alt_questions.split(",").map((q, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs px-2 py-1 rounded-full">
                  {q.trim()}
                  <button type="button" onClick={() => removeAltQuestion(i)} className="text-emerald-400 hover:text-red-500">&times;</button>
                </span>
              )) : null}
            </div>
            <div className="flex gap-2">
              <input value={altInput} onChange={(e) => setAltInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAltQuestion(); } }} placeholder="Variante de question..." className="flex-1 border rounded-lg px-3 py-2 text-sm" />
              <button type="button" onClick={addAltQuestion} className="text-sm text-emerald-600 hover:text-emerald-800 font-medium">+ Ajouter</button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Réponse courte</label>
            <input value={form.short_resp} onChange={(e) => setForm({ ...form, short_resp: e.target.value })} placeholder="Résumé en une phrase" className="w-full border rounded-lg px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Réponse détaillée</label>
            <textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} rows={5} className="w-full border rounded-lg px-3 py-2" required />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Catégorie</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} list="modal-cats" className="w-full border rounded-lg px-3 py-2" />
              <datalist id="modal-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mots-clés</label>
              <input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="séparés par des virgules" className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Priorité ({form.priority})</label>
              <input type="range" min={1} max={10} value={form.priority} onChange={(e) => setForm({ ...form, priority: +e.target.value })} className="w-full" />
              <div className="flex justify-between text-xs text-gray-400"><span>1</span><span>10</span></div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tags associés</label>
            <input value={form.related_tags} onChange={(e) => setForm({ ...form, related_tags: e.target.value })} placeholder="séparés par des virgules" className="w-full border rounded-lg px-3 py-2" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
            <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700 text-sm">Annuler</button>
          </div>
        </form>
      </div>
    </div>
  );
}
