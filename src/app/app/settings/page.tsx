"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, LogOut, Brain, SlidersHorizontal, MessageSquareText, Building2, Thermometer, Layers, Upload, FileText, Trash2, Eye, Download, X, FileJson, BookOpen, RefreshCw, Shield } from "lucide-react";
import ApiKeysManager from "@/components/admin/ApiKeysManager";

const TABS = [
  { id: "ia", label: "Configuration IA", icon: Brain },
  { id: "keys", label: "Clés API", icon: Shield },
  { id: "documents", label: "Documents contextuels", icon: FileJson },
];

export default function AppSettingsPage() {
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [contextChunks, setContextChunks] = useState<{ name: string; index: number; content: string }[]>([]);
  const [viewDoc, setViewDoc] = useState<{ title: string; content: string } | null>(null);
  const [tab, setTab] = useState("ia");

  function token() { return localStorage.getItem("token") || ""; }

  function parseContextChunks(siteContext: string) {
    if (!siteContext) return [];
    const regex = /\[CHUNK:([^\]]+)\]([\s\S]*?)(?=\[CHUNK:|$)/g;
    const chunks: { name: string; index: number; content: string }[] = [];
    let m;
    while ((m = regex.exec(siteContext)) !== null) {
      const parts = m[1].split(":");
      const name = parts.slice(0, -1).join(":") || parts[0];
      const idx = parseInt(parts[parts.length - 1], 10);
      chunks.push({ name, index: isNaN(idx) ? 0 : idx, content: m[2].trim() });
    }
    if (chunks.length === 0 && siteContext.trim()) {
      chunks.push({ name: "contexte.txt", index: 0, content: siteContext.trim() });
    }
    return chunks;
  }

  function downloadContent(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    fetch("/api/clients", { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((clients) => {
        const payload = JSON.parse(atob(token().split(".")[1]));
        const c = clients.find((c: any) => c.id === payload.clientId);
        if (c) { setClient(c); setForm({ ...c }); setContextChunks(parseContextChunks(c.siteContext || "")); }
      });
    fetch("/api/client-documents", { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then(setDocuments);
  }, []);

  async function handleSave() {
    if (!form || !client) return;
    setSaving(true);
    const res = await fetch(`/api/clients/${client.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({
        kbThreshold: form.kbThreshold,
        ragThreshold: form.ragThreshold,
        tempQA: form.tempQA,
        tempRAG: form.tempRAG,
        tempEscalade: form.tempEscalade,
        chunkSize: form.chunkSize,
        topNChunks: form.topNChunks,
        relanceActive: form.relanceActive,
        relanceText: form.relanceText,
        siteContext: form.siteContext,
      }),
    });
    setSaving(false);
    if (res.ok) alert("Configuration enregistrée");
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/client-documents", {
      method: "POST",
      headers: { Authorization: `Bearer ${token()}` },
      body: fd,
    });
    if (res.ok) {
      const data = await res.json();
      setDocuments((prev) => [...prev, data]);
    } else {
      const err = await res.json();
      alert(err.error || "Erreur d'upload");
    }
    setUploading(false);
    e.target.value = "";
  }

  async function handleDeleteDoc(id: string) {
    if (!confirm("Supprimer ce document ?")) return;
    const res = await fetch(`/api/client-documents/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  async function handleTransferToKb() {
    if (!confirm("Transférer tous les documents contextuels et chunks vers la base de connaissances ?")) return;
    setTransferring(true);
    const res = await fetch("/api/documents/transfer-to-kb", {
      method: "POST",
      headers: { Authorization: `Bearer ${token()}` },
    });
    const data = await res.json();
    setTransferring(false);
    if (res.ok) {
      alert(`${data.created} entrée(s) ajoutée(s) à la base de connaissances.`);
    } else {
      alert(data.error || "Erreur lors du transfert");
    }
  }

  if (!form) return <div className="text-center py-20 text-gray-400">Chargement...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Paramètres</h1>
      <p className="text-gray-500 mb-6">Configurez votre assistant virtuel.</p>

      <div className="flex gap-1 mb-6 bg-gray-100/80 rounded-xl p-1 w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "ia" && (
        <div className="space-y-5 max-w-2xl">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-elevated p-6 space-y-5">
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center gap-2 mb-4">
                <SlidersHorizontal size={16} className="text-purple-600" />
                <h2 className="font-semibold text-gray-900">Seuils de confiance</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                    Seuil QA (N1) : {form.kbThreshold ?? 80}%
                  </label>
                  <input type="range" min={10} max={100} value={form.kbThreshold ?? 80} onChange={(e) => setForm({ ...form, kbThreshold: +e.target.value })} className="w-full accent-purple-600" />
                  <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>10%</span><span>100%</span></div>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                    Seuil RAG (N2) : {form.ragThreshold ?? 72}%
                  </label>
                  <input type="range" min={10} max={100} value={form.ragThreshold ?? 72} onChange={(e) => setForm({ ...form, ragThreshold: +e.target.value })} className="w-full accent-purple-600" />
                  <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>10%</span><span>100%</span></div>
                </div>
              </div>
            </div>

            <div>
              <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors">
                <Thermometer size={14} /> Paramètres avancés {showAdvanced ? "▲" : "▼"}
              </button>
            </div>

            {showAdvanced && (
              <div className="space-y-4 pl-4 border-l-2 border-purple-100">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Temp. QA (N1)</label>
                    <input type="number" step={0.01} min={0} max={1} value={form.tempQA ?? 0.05} onChange={(e) => setForm({ ...form, tempQA: +e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Temp. RAG (N2)</label>
                    <input type="number" step={0.01} min={0} max={1} value={form.tempRAG ?? 0.10} onChange={(e) => setForm({ ...form, tempRAG: +e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Temp. Escalade (N3)</label>
                    <input type="number" step={0.01} min={0} max={1} value={form.tempEscalade ?? 0.20} onChange={(e) => setForm({ ...form, tempEscalade: +e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Max chars / section</label>
                    <input type="number" min={100} max={5000} step={100} value={form.chunkSize ?? 500} onChange={(e) => setForm({ ...form, chunkSize: +e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Top N chunks RAG</label>
                    <input type="number" min={1} max={20} value={form.topNChunks ?? 3} onChange={(e) => setForm({ ...form, topNChunks: +e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <MessageSquareText size={14} /> Relance IA
              </label>
              <select value={form.relanceActive ? "true" : "false"} onChange={(e) => setForm({ ...form, relanceActive: e.target.value === "true" })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all">
                <option value="true">Active</option>
                <option value="false">Désactivée</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Texte de relance personnalisé</label>
              <textarea value={form.relanceText || ""} onChange={(e) => setForm({ ...form, relanceText: e.target.value })} rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" placeholder="Exemple : Souhaitez-vous plus de détails ?" />
            </div>

            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:from-purple-700 hover:to-purple-600 transition-all disabled:opacity-50 shadow-lg shadow-purple-200">
              <Save size={16} /> {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-elevated p-6">
            <button onClick={() => { localStorage.removeItem("token"); router.push("/login"); }} className="flex items-center gap-2 text-red-500 hover:text-red-700 text-sm font-medium transition-colors">
              <LogOut size={16} /> Déconnexion
            </button>
          </div>
        </div>
      )}

      {tab === "keys" && client && (
        <div className="max-w-2xl">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-elevated p-6">
            <ApiKeysManager clientId={client.id} token={token} />
          </div>
        </div>
      )}

      {tab === "documents" && (
        <div className="space-y-5 max-w-2xl">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-elevated p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
              <Building2 size={18} className="text-purple-600" />
              <h2 className="font-semibold text-gray-900">Contexte entreprise</h2>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description de l&apos;activité (importée automatiquement en chunks)</label>
              {contextChunks.length > 0 && (
                <div className="mb-3 space-y-1.5">
                  <p className="text-xs text-gray-400 mb-1.5">{contextChunks.length} fichier(s) importé(s) :</p>
                  {contextChunks.map((chunk, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={14} className="text-purple-500 shrink-0" />
                        <span className="text-sm text-gray-700 truncate">{chunk.name}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button onClick={() => setViewDoc({ title: chunk.name, content: chunk.content })} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all" title="Visualiser">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => downloadContent(chunk.content, chunk.name)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all" title="Télécharger">
                          <Download size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <textarea value={form.siteContext || ""} onChange={(e) => { setForm({ ...form, siteContext: e.target.value }); setContextChunks(parseContextChunks(e.target.value)); }} rows={4} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" placeholder="Décrivez votre activité..." />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-elevated p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-purple-600" />
                <h2 className="font-semibold text-gray-900">Documents téléchargés</h2>
              </div>
              <label className="flex items-center gap-2 text-xs font-medium text-purple-600 hover:text-purple-700 cursor-pointer transition-colors">
                <Upload size={14} /> {uploading ? "Upload..." : "Ajouter un fichier"}
                <input type="file" accept=".txt,.csv,.json,.md" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
            </div>
            <p className="text-xs text-gray-400">Formats supportés : .txt, .csv, .json, .md (max 5 Mo). Gestion des versions et dates de validité.</p>
            {documents.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Aucun document uploadé.</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => {
                  const isExpired = doc.valid_until ? new Date(doc.valid_until) < new Date() : false;
                  return (
                    <div key={doc.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText size={16} className="text-purple-500 shrink-0" />
                        <span className="text-sm text-gray-700 truncate">{doc.originalName}</span>
                        <span className="text-xs text-gray-400 shrink-0">{(doc.fileSize / 1024).toFixed(1)} Ko</span>
                        {doc.version > 1 && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">v{doc.version}</span>}
                        {doc.valid_from && <span className="text-xs text-gray-400 shrink-0">Du {new Date(doc.valid_from).toLocaleDateString("fr")}</span>}
                        {doc.valid_until ? (
                          <span className={"text-xs shrink-0 " + (isExpired ? "text-red-500" : "text-green-600")}>
                            {isExpired ? "Expiré" : "Valide jusqu'au " + new Date(doc.valid_until).toLocaleDateString("fr")}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button onClick={() => setViewDoc({ title: doc.originalName, content: doc.content })} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all" title="Visualiser">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => window.open(`/api/client-documents/${doc.id}/download`, "_blank")} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all" title="Télécharger">
                          <Download size={14} />
                        </button>
                        <button onClick={() => handleDeleteDoc(doc.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Supprimer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:from-purple-700 hover:to-purple-600 transition-all disabled:opacity-50 shadow-lg shadow-purple-200">
                <Save size={16} /> {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button onClick={handleTransferToKb} disabled={transferring} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-orange-200 text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 transition-all disabled:opacity-50">
                <BookOpen size={15} /> {transferring ? "Transfert..." : "Transférer vers la KB"}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setViewDoc(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 truncate">{viewDoc.title}</h3>
              <button onClick={() => setViewDoc(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{viewDoc.content}</pre>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-gray-100">
              <button onClick={() => { downloadContent(viewDoc.content, viewDoc.title); setViewDoc(null); }} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-all">
                <Download size={14} /> Télécharger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
