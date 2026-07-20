"use client";

import { useEffect, useState } from "react";
import { Database, Search, ChevronLeft, ChevronRight, Eye, TestTube2, Loader2, Upload } from "lucide-react";

interface ChunkRow {
  id: string;
  docId: string;
  chunkId: string;
  source: string;
  section: string;
  keywords: string;
  content: string;
  source_url: string;
  valid_until: string;
  clientId: string;
  client_name: string;
}

interface TestResult {
  score: string;
  scorePercent: number;
  source: string;
  section: string;
  content: string;
  clientName: string;
  chunkId: string;
  docId: string;
}

interface Props {
  clientId: string;
  token: () => string;
}

export default function VectorStoreTab({ clientId, token }: Props) {
  const [total, setTotal] = useState(0);
  const [perDoc, setPerDoc] = useState<any[]>([]);
  const [chunks, setChunks] = useState<ChunkRow[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [testQuery, setTestQuery] = useState("");
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);
  const [viewChunk, setViewChunk] = useState<ChunkRow | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const text = await file.text();
      let content = text;
      let source = file.name;
      if (file.name.endsWith(".json")) {
        const parsed = JSON.parse(text);
        content = typeof parsed === "string" ? parsed : JSON.stringify(parsed, null, 2);
      }
      const res = await fetch("/api/vector-import", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ clientId, content, source }),
      });
      const data = await res.json();
      if (res.ok) {
        setImportResult(`✓ ${file.name} importé (${data.docId})`);
        loadData(1, search);
      } else {
        setImportResult(`✗ ${data.error}`);
      }
    } catch (err: any) {
      setImportResult(`✗ ${err.message}`);
    }
    setImporting(false);
    e.target.value = "";
  }

  function loadData(p: number, q: string) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "20", clientId });
    if (q) params.set("search", q);
    fetch(`/api/vector-store?${params}`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(d => {
        setPerDoc(d.perDoc);
        setChunks(d.chunks);
        setTotal(d.total);
        setLoading(false);
      });
  }

  useEffect(() => { loadData(1, ""); }, [clientId]);

  function handleSearch() {
    setPage(1);
    loadData(1, search);
  }

  async function handleTest() {
    if (!testQuery.trim()) return;
    setTesting(true);
    setTestResults([]);
    try {
      const res = await fetch("/api/vector-store", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ question: testQuery, clientId, topN: 5 }),
      });
      const data = await res.json();
      if (!data.error) setTestResults(data.results);
    } catch {}
    setTesting(false);
  }

  async function handleMigrate() {
    setMigrating(true);
    setMigrateResult(null);
    try {
      const res = await fetch("/api/migrate-vector", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ clientId }),
      });
      const data = await res.json();
      if (data.error) {
        setMigrateResult(`Erreur: ${data.error}`);
      } else {
        const log = data.results?.[0];
        if (log) {
          setMigrateResult(`${log.documents || 0} document(s), ${log.kbEntries || 0} KB indexé(s)${log.errors?.length ? `, ${log.errors.length} erreur(s)` : ""}`);
        } else {
          setMigrateResult("Migration terminée");
        }
        loadData(1, search);
      }
    } catch (err: any) {
      setMigrateResult(`Erreur: ${err.message}`);
    }
    setMigrating(false);
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <Database size={16} className="text-emerald-600" />
          Documents indexés
        </h2>
        {perDoc.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-400 text-sm mb-3">Aucun document vectorisé pour ce client</p>
            <button
              onClick={handleMigrate}
              disabled={migrating}
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {migrating ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
              {migrating ? "Indexation en cours..." : "Indexer les documents et KB"}
            </button>
            {migrateResult && (
              <p className="text-xs text-gray-500 mt-2">{migrateResult}</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {perDoc.map((d: any) => (
              <div key={d.docId} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 truncate">{d.source}</span>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-emerald-600 font-medium">{d.chunks} chunks</span>
                  <button
                    onClick={handleMigrate}
                    disabled={migrating}
                    className="text-gray-400 hover:text-emerald-600 p-1"
                    title="Re-indexer"
                  >
                    <Database size={13} />
                  </button>
                </div>
              </div>
            ))}
            {migrateResult && (
              <p className="text-xs text-gray-500 mt-1">{migrateResult}</p>
            )}
          </div>
        )}
      </div>

      {/* Importer un fichier */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Upload size={16} className="text-emerald-600" />
          <h2 className="font-semibold text-sm">Importer un fichier</h2>
        </div>
        <p className="text-xs text-gray-500 mb-3">Importez un fichier .txt ou .json directement dans la base vectorielle.</p>
        <div className="flex items-center gap-3">
          <label className="cursor-pointer">
            <span className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
              {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {importing ? "Import..." : "Choisir un fichier"}
            </span>
            <input id="vector-import-file" type="file" accept=".txt,.json" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
          {importResult && <span className="text-xs text-gray-600">{importResult}</span>}
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <TestTube2 size={16} className="text-emerald-600" />
          <h2 className="font-semibold text-sm">Tester la recherche vectorielle</h2>
        </div>
        <div className="flex gap-2 mb-4">
          <input
            value={testQuery}
            onChange={e => setTestQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleTest()}
            placeholder="Posez une question pour tester la similarité..."
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
          />
          <button
            onClick={handleTest}
            disabled={testing || !testQuery.trim()}
            className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            <Search size={14} /> {testing ? "Recherche..." : "Tester"}
          </button>
        </div>
        {testResults.length > 0 && (
          <div className="space-y-2">
            {testResults.map((r, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{r.source}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    r.scorePercent >= 80 ? "bg-green-100 text-green-700" :
                    r.scorePercent >= 60 ? "bg-yellow-100 text-yellow-700" :
                    "bg-orange-100 text-orange-700"
                  }`}>
                    {r.scorePercent}%
                  </span>
                </div>
                {r.section && <p className="text-xs text-gray-400 mb-1">Section: {r.section}</p>}
                <p className="text-xs text-gray-600 line-clamp-3">{r.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm">Chunks ({total} total)</h2>
          <div className="flex gap-2">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Filtrer..."
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-48 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            />
            <button onClick={handleSearch} className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm hover:bg-gray-50">
              <Search size={14} />
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm py-4 text-center">Chargement...</p>
        ) : chunks.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">Aucun chunk trouvé</p>
        ) : (
          <div className="space-y-2">
            {chunks.map(c => (
              <div key={c.id} className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <Database size={12} className="text-emerald-500 shrink-0" />
                    <span className="text-sm font-medium text-gray-700 truncate">{c.source}</span>
                    {c.section && <span className="text-xs text-gray-400">/ {c.section}</span>}
                  </div>
                  <button onClick={() => setViewChunk(c)} className="text-gray-400 hover:text-emerald-600 p-1 shrink-0" title="Voir">
                    <Eye size={13} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{c.content}</p>
                {c.keywords && <p className="text-xs text-emerald-500 mt-1">{c.keywords}</p>}
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => { setPage(p => Math.max(1, p - 1)); loadData(Math.max(1, page - 1), search); }}
              disabled={page === 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-gray-500">Page {page} / {totalPages}</span>
            <button
              onClick={() => { setPage(p => Math.min(totalPages, p + 1)); loadData(Math.min(totalPages, page + 1), search); }}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {viewChunk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setViewChunk(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col m-4" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{viewChunk.source}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{viewChunk.chunkId}</p>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-3">
              {viewChunk.section && (
                <div><span className="text-xs font-medium text-gray-400">Section</span><p className="text-sm">{viewChunk.section}</p></div>
              )}
              {viewChunk.keywords && (
                <div><span className="text-xs font-medium text-gray-400">Mots-clés</span><p className="text-sm text-emerald-600">{viewChunk.keywords}</p></div>
              )}
              <div><span className="text-xs font-medium text-gray-400">Contenu</span><pre className="text-sm text-gray-700 whitespace-pre-wrap mt-1 leading-relaxed">{viewChunk.content}</pre></div>
              {viewChunk.source_url && (
                <div><span className="text-xs font-medium text-gray-400">Source URL</span><p className="text-sm text-blue-600 break-all">{viewChunk.source_url}</p></div>
              )}
              {viewChunk.valid_until && (
                <div><span className="text-xs font-medium text-gray-400">Valide jusqu&apos;au</span><p className="text-sm">{viewChunk.valid_until}</p></div>
              )}
            </div>
            <div className="px-6 py-3 border-t border-gray-100 flex justify-end">
              <button onClick={() => setViewChunk(null)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
