"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import KBModal from "@/components/admin/KBModal";
import { Plus, Search, Download, Upload, Trash2, FileText, BookOpen, Eye, Building2, Save, X, Database, Loader2, Zap } from "lucide-react";

interface KBEntry {
  id: string;
  tag?: string;
  question: string;
  alt_questions: string;
  short_resp?: string;
  answer: string;
  category: string;
  keywords: string;
  priority: number;
  related_tags: string;
  icon: string;
}

const TABS = [
  { id: "kb", label: "KB Experte", icon: BookOpen },
  { id: "documents", label: "Documents contextuels", icon: FileText },
];

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
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ClientKBPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState("kb");
  const [client, setClient] = useState<any>(null);
  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KBEntry | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [contextChunks, setContextChunks] = useState<{ name: string; index: number; content: string }[]>([]);
  const [viewDoc, setViewDoc] = useState<{ title: string; content: string } | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testQuestion, setTestQuestion] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState<string | null>(null);
  const [directImport, setDirectImport] = useState("");
  const [importSource, setImportSource] = useState("");
  const [importingDirect, setImportingDirect] = useState(false);
  const [directResult, setDirectResult] = useState<string | null>(null);

  function token() { return localStorage.getItem("token") || ""; }

  const categories = useMemo(() => {
    const cats = new Set(entries.map((e) => e.category).filter(Boolean));
    return [...cats].sort();
  }, [entries]);

  const filtered = useMemo(() => {
    let out = entries;
    if (search) {
      const s = search.toLowerCase();
      out = out.filter((e) => e.question.toLowerCase().includes(s) || e.answer.toLowerCase().includes(s) || e.keywords.toLowerCase().includes(s));
    }
    if (catFilter) out = out.filter((e) => e.category === catFilter);
    return out;
  }, [entries, search, catFilter]);

  function loadKB() {
    fetch(`/api/kb?clientId=${id}`, { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((data) => { setEntries(data); setLoading(false); });
  }

  function loadDocuments() {
    fetch(`/api/client-documents?clientId=${id}`, { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then(setDocuments);
  }

  useEffect(() => {
    fetch(`/api/clients/${id}`, { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((data) => { setClient(data); setContextChunks(parseContextChunks(data.siteContext || "")); loadKB(); loadDocuments(); })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleSave(data: any) {
    const t = token();
    const url = editingEntry ? `/api/kb/${editingEntry.id}` : "/api/kb";
    const method = editingEntry ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify(editingEntry ? data : { ...data, clientId: id }),
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
    setEditingEntry(null);
    loadKB();
  }

  function openEdit(e: KBEntry) {
    setEditingEntry(e);
    setModalOpen(true);
  }

  function openAdd() {
    setEditingEntry(null);
    setModalOpen(true);
  }

  async function handleDelete(kid: string) {
    if (!confirm("Supprimer cette entrée ?")) return;
    await fetch(`/api/kb/${kid}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
    loadKB();
  }

  async function handleExport() {
    const res = await fetch(`/api/kb/export?clientId=${id}`, { headers: { Authorization: `Bearer ${token()}` } });
    if (!res.ok) { const d = await res.json(); alert(d.error || "Erreur"); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "kb-export.json"; a.click();
    URL.revokeObjectURL(url);
  }

  async function handleExportPDF() {
    const res = await fetch(`/api/kb/export-pdf?clientId=${id}`, { headers: { Authorization: `Bearer ${token()}` } });
    if (!res.ok) { const d = await res.json(); alert(d.error || "Erreur"); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "kb-export.pdf"; a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("Format invalide");
      const replace = entries.length > 0 && confirm(`${parsed.length} entrées trouvées. Remplacer toute la base (${entries.length} existantes) ? "Annuler" = ajouter.`);
      const res = await fetch("/api/kb/import-kb", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ clientId: id, entries: parsed, replace }),
      });
      if (res.ok) loadKB();
    } catch { setError("Erreur d'import"); }
    setImporting(false);
    e.target.value = "";
  }

  /* Document handlers */
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

  async function handleDirectImport() {
    if (!directImport.trim()) return;
    setImportingDirect(true);
    setDirectResult(null);
    try {
      const res = await fetch("/api/vector-import", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ clientId: id, content: directImport, source: importSource || "import-direct" }),
      });
      const data = await res.json();
      if (res.ok) setDirectResult(`✓ ${data.chunksCount} extraits vectorisés (${data.docId.slice(0, 8)}…)`);
      else setDirectResult(`✗ ${data.error}`);
    } catch (err: any) {
      setDirectResult(`✗ ${err.message}`);
    }
    setImportingDirect(false);
  }

  async function handleDeleteDoc(docId: string) {
    if (!confirm("Supprimer ce document ?")) return;
    const res = await fetch(`/api/client-documents/${docId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) setDocuments((prev) => prev.filter((d) => d.id !== docId));
  }

  async function handleTestRag() {
    if (!testQuestion.trim()) return;
    setTesting(true);
    setTestResults(null);
    const res = await fetch("/api/client-documents/test-rag", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ question: testQuestion }),
    });
    setTestResults(await res.json());
    setTesting(false);
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
      loadKB();
    } else {
      alert(data.error || "Erreur lors du transfert");
    }
  }

  async function handleSaveContext() {
    if (!client) return;
    setSaving(true);
    await fetch(`/api/clients/${client.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ siteContext: client.siteContext }),
    });
    setSaving(false);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/dashboard/clients/${id}`} className="text-gray-400 hover:text-gray-600 text-sm">&larr; {client?.name || "Client"}</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold">Base de connaissances</h1>
      </div>

      <p className="text-gray-500 mb-4">{tab === "kb" ? "Gérez la base de connaissances experte." : "Gérez les documents et le contexte entreprise utilisés par la RAG."}</p>

      <div className="flex gap-1 mb-6 bg-gray-100/80 rounded-xl p-1 w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "kb" && (
        <>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-3 flex-1">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="flex-1 border rounded-lg px-3 py-2 text-sm max-w-xs" />
              <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
                <option value="">Toutes catégories</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={handleExportPDF} className="text-sm border rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50">Exporter PDF</button>
              <button onClick={handleExport} className="text-sm border rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50">Exporter JSON</button>
              <label className="text-sm border rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50 cursor-pointer">
                {importing ? "Import..." : "Importer"}
                <input type="file" accept=".json" className="hidden" onChange={handleImport} disabled={importing} />
              </label>
            </div>
            <button onClick={openAdd} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 shrink-0 flex items-center gap-1"><Plus size={15} /> Ajouter</button>
          </div>

          {loading ? (
            <p className="text-gray-500">Chargement...</p>
          ) : filtered.length === 0 ? (
            <p className="text-gray-400 text-center py-8 bg-white rounded-xl">
              {entries.length === 0 ? "Aucune entrée pour ce client." : "Aucun résultat."}
            </p>
          ) : (
            <div className="space-y-3">
              {filtered.map((e) => (
                <div key={e.id} className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{e.icon && <span className="mr-1">{e.icon}</span>}{e.question}</h3>
                      {e.short_resp && <p className="text-xs text-gray-400 mt-0.5">{e.short_resp}</p>}
                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap line-clamp-2">{e.answer}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {e.category && <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-500">{e.category}</span>}
                        {e.keywords && <span className="text-xs bg-emerald-50 px-2 py-1 rounded-full text-emerald-600">{e.keywords}</span>}
                        <span className={`text-xs px-2 py-1 rounded-full ${(e.priority ?? 5) >= 7 ? "bg-red-50 text-red-600" : (e.priority ?? 5) >= 4 ? "bg-yellow-50 text-yellow-700" : "bg-gray-50 text-gray-500"}`}>
                          P{e.priority ?? 5}
                        </span>
                        {e.alt_questions && (
                          <span className="text-xs bg-blue-50 px-2 py-1 rounded-full text-blue-600" title={e.alt_questions}>
                            +{e.alt_questions.split(",").length} var.
                          </span>
                        )}
                        {e.related_tags && <span className="text-xs bg-green-50 px-2 py-1 rounded-full text-green-600">{e.related_tags}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4 shrink-0">
                      <button onClick={() => openEdit(e)} className="text-emerald-600 hover:underline text-xs">Modifier</button>
                      <button onClick={() => handleDelete(e.id)} className="text-red-500 hover:underline text-xs">Supprimer</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <KBModal
            open={modalOpen}
            onClose={() => { setModalOpen(false); setEditingEntry(null); }}
            onSave={handleSave}
            initialData={editingEntry ? {
              tag: editingEntry.tag || "",
              question: editingEntry.question,
              alt_questions: editingEntry.alt_questions || "",
              short_resp: editingEntry.short_resp || "",
              answer: editingEntry.answer,
              category: editingEntry.category,
              keywords: editingEntry.keywords,
              priority: editingEntry.priority ?? 5,
              related_tags: editingEntry.related_tags || "",
              icon: editingEntry.icon || "",
            } : null}
            categories={categories}
          />
        </>
      )}

      {tab === "documents" && (
        <div className="space-y-5 max-w-2xl">
          <div className="bg-white backdrop-blur-xl border border-white/20 rounded-2xl shadow-elevated p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
              <Building2 size={18} className="text-emerald-600" />
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
                        <FileText size={14} className="text-emerald-500 shrink-0" />
                        <span className="text-sm text-gray-700 truncate">{chunk.name}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button onClick={() => setViewDoc({ title: chunk.name, content: chunk.content })} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all" title="Visualiser">
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
              <textarea value={client?.siteContext || ""} onChange={(e) => setClient({ ...(client || {}), siteContext: e.target.value })} rows={4} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="Décrivez votre activité..." />
              <div className="flex justify-end mt-3">
                <button onClick={handleSaveContext} disabled={saving} className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:from-emerald-700 hover:to-emerald-600 transition-all disabled:opacity-50 shadow-lg shadow-emerald-200">
                  <Save size={14} /> {saving ? "Enregistrement..." : "Enregistrer le contexte"}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white backdrop-blur-xl border border-white/20 rounded-2xl shadow-elevated p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-emerald-600" />
                <h2 className="font-semibold text-gray-900">Documents téléchargés</h2>
              </div>
              <label className="flex items-center gap-2 text-xs font-medium text-emerald-600 hover:text-emerald-700 cursor-pointer transition-colors">
                <Upload size={14} /> {uploading ? "Upload..." : "Ajouter un fichier"}
                <input type="file" accept=".txt,.csv,.json,.md" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
            </div>
            <p className="text-xs text-gray-400">Formats supportés : .txt, .csv, .json, .md (max 5 Mo).</p>
            {documents.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Aucun document uploadé.</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => {
                  const isExpired = doc.valid_until ? new Date(doc.valid_until) < new Date() : false;
                  return (
                    <div key={doc.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText size={16} className="text-emerald-500 shrink-0" />
                        <span className="text-sm text-gray-700 truncate">{doc.originalName}</span>
                        <span className="text-xs text-gray-400 shrink-0">{(doc.fileSize / 1024).toFixed(1)} Ko</span>
                        {doc.version > 1 && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">v{doc.version}</span>}
                        {doc.valid_from && <span className="text-xs text-gray-400 shrink-0">Du {new Date(doc.valid_from).toLocaleDateString("fr")}</span>}
                        {doc.valid_until ? (
                          <span className={"text-xs shrink-0 " + (isExpired ? "text-red-500" : "text-green-600")}>
                            {isExpired ? "Expiré" : "Valide jusqu'au " + new Date(doc.valid_until).toLocaleDateString("fr")}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button onClick={() => setViewDoc({ title: doc.originalName, content: doc.content })} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all" title="Visualiser">
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
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
              <button onClick={() => { setTestQuestion(""); setTestResults(null); setShowTestModal(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-200 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all">
                <Search size={15} /> Tester le RAG
              </button>
              <button
                onClick={async () => {
                  setMigrating(true); setMigrateResult(null);
                  try {
                    const res = await fetch("/api/migrate-vector", {
                      method: "POST",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
                      body: JSON.stringify({ clientId: id }),
                    });
                    const text = await res.text();
                    const data = JSON.parse(text);
                    setMigrateResult(JSON.stringify(data.results || data, null, 2));
                  } catch (err: any) {
                    setMigrateResult(`Erreur: ${err.message}`);
                  }
                  setMigrating(false);
                }}
                disabled={migrating}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-200 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 transition-all disabled:opacity-50"
              >
                {migrating ? <Loader2 size={15} className="animate-spin" /> : <Database size={15} />}
                {migrating ? "Migration..." : "Migrer vers pgvector"}
              </button>
              <button onClick={handleTransferToKb} disabled={transferring} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-orange-200 text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 transition-all disabled:opacity-50">
                <BookOpen size={15} /> {transferring ? "Transfert..." : "Transférer vers la KB"}
              </button>
            </div>
            {migrateResult && (
              <pre className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs font-mono overflow-auto max-h-60 text-gray-700">{migrateResult}</pre>
            )}
          </div>

          <div className="bg-white backdrop-blur-xl border border-white/20 rounded-2xl shadow-elevated p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
              <Zap size={18} className="text-purple-600" />
              <h2 className="font-semibold text-gray-900">Import vectoriel direct</h2>
            </div>
            <p className="text-xs text-gray-400">Collez du texte brut ou JSON pour le vectoriser et l&apos;indexer immédiatement dans pgvector.</p>
            <div className="flex gap-2">
              <input type="text" value={importSource} onChange={(e) => setImportSource(e.target.value)} placeholder="Nom source (optionnel)" className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" />
            </div>
            <textarea value={directImport} onChange={(e) => setDirectImport(e.target.value)} rows={5} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all font-mono" placeholder="Collez ici le contenu à vectoriser..." />
            <div className="flex items-center gap-3">
              <button onClick={handleDirectImport} disabled={importingDirect || !directImport.trim()} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:from-purple-700 hover:to-purple-600 transition-all disabled:opacity-50 shadow-lg shadow-purple-200">
                {importingDirect ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                {importingDirect ? "Vectorisation..." : "Vectoriser et importer"}
              </button>
              {directResult && (
                <span className={`text-sm ${directResult.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>{directResult}</span>
              )}
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
              <button onClick={() => { downloadContent(viewDoc.content, viewDoc.title); setViewDoc(null); }} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all">
                <Download size={14} /> Télécharger
              </button>
            </div>
          </div>
        </div>
      )}

      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowTestModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Tester la recherche documentaire (RAG)</h3>
              <button onClick={() => setShowTestModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-4">
              <p className="text-sm text-gray-500">Posez une question pour vérifier que les documents contextuels sont bien indexés.</p>
              <div className="flex gap-2">
                <input type="text" value={testQuestion} onChange={(e) => setTestQuestion(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleTestRag()} placeholder="Ex: Que contiennent les documents d'entreprise ?" className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
                <button onClick={handleTestRag} disabled={testing || !testQuestion.trim()} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-all disabled:opacity-50">
                  <Search size={15} /> {testing ? "Recherche..." : "Tester"}
                </button>
              </div>
              {testResults && (
                <div className="space-y-3">
                  {testResults.error ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{testResults.error}</div>
                  ) : testResults.chunks && testResults.chunks.length > 0 ? (
                    <>
                      <div className="text-sm text-gray-500">{testResults.totalChunksFound} extraits analysés, {testResults.chunksReturned} trouvés.</div>
                      <div className="space-y-2">
                        {testResults.chunks.map((chunk: any, i: number) => (
                          <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">{chunk.source}</span>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${chunk.score >= 80 ? "bg-green-100 text-green-700" : chunk.score >= 60 ? "bg-yellow-100 text-yellow-700" : "bg-orange-100 text-orange-700"}`}>
                                {chunk.score}%
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">{chunk.content}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">Aucun extrait trouvé.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
