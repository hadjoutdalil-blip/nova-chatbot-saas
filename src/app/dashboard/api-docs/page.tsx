"use client";

import { useState } from "react";
import {
  FileText, Send, Shield, Zap, BookOpen, MessageSquare,
  Database, Upload, BarChart3, AlertTriangle, Brain, ChevronDown, ChevronRight,
  Copy, Check
} from "lucide-react";

type Section = {
  id: string;
  title: string;
  icon: any;
  endpoints: {
    method: string;
    path: string;
    desc: string;
    auth: string;
    body?: string;
    response?: string;
    notes?: string;
  }[];
};

const SECTIONS: Section[] = [
  {
    id: "chat",
    title: "Chat & Widget",
    icon: MessageSquare,
    endpoints: [
      {
        method: "POST",
        path: "/api/chat/{slug}",
        desc: "Point d'entrée principal du chatbot. Reçoit un message utilisateur et retourne une réponse IA enrichie.",
        auth: "Widget token (header x-widget-token) ou session publique",
        body: JSON.stringify({ message: "string", history: "[]", sessionType: "widget|iframe", pageUrl: "string", pageTitle: "string", visitorId: "string" }, null, 2),
        response: JSON.stringify({ messageId: "uuid", response: "string", source: "kb|escalade|rag|doc|fallback", provider: "string", score: 0.85, suggestions: [], docLinks: [] }, null, 2),
        notes: "Supporte streaming SSE (Accept: text/event-stream) et réponse JSON. Le score indique la pertinence (0-1).",
      },
    ],
  },
  {
    id: "kb",
    title: "Base de Connaissances",
    icon: BookOpen,
    endpoints: [
      {
        method: "GET",
        path: "/api/kb?clientId={id}",
        desc: "Liste toutes les entrées KB d'un client.",
        auth: "JWT (admin) ou x-import-key",
      },
      {
        method: "POST",
        path: "/api/kb",
        desc: "Crée ou met à jour une entrée KB.",
        auth: "JWT (admin) ou x-import-key",
        body: JSON.stringify({ clientId: "string", question: "string", answer: "string", keywords: "string[]", category: "string" }, null, 2),
      },
      {
        method: "POST",
        path: "/api/kb/import",
        desc: "Import en masse depuis JSON ou texte brut.",
        auth: "JWT (admin) ou x-import-key",
        body: "// JSON format:\n{ \"entries\": [{ \"question\": \"...\", \"answer\": \"...\", \"keywords\": [\"...\"] }] }\n\n// Text format (une paire Q&A par bloc séparé par ---)",
        notes: "Le paramètre ?upsert=1 evite les doublons (match par similarité >80%).",
      },
    ],
  },
  {
    id: "web-import",
    title: "Import Web",
    icon: Zap,
    endpoints: [
      {
        method: "POST",
        path: "/api/web-import",
        desc: "Scrape un site web, extrait le texte et les documents, injecte dans la KB et le vector store.",
        auth: "JWT (admin) ou x-import-key",
        body: JSON.stringify({ clientId: "string", url: "https://...", scrapeDocs: true, mode: "upsert|replace" }, null, 2),
        response: JSON.stringify({ ok: true, textChunks: 12, docsFound: 3, docsStored: 3, kbEntries: 5, duplicatesSkipped: 2 }, null, 2),
        notes: "mode=upsert détecte les pages déjà importées et les skip. scrapeDocs télécharge les PDF/DOCX liés.",
      },
    ],
  },
  {
    id: "local-import",
    title: "Import Local (VM)",
    icon: Upload,
    endpoints: [
      {
        method: "GET",
        path: "/api/local-import/scan?clientId={id}",
        desc: "Scanne le dossier /data/import/{clientSlug}/ et retourne l'état des fichiers.",
        auth: "JWT ou x-import-key",
        notes: "Uniquement disponible en local (pas sur Vercel).",
      },
      {
        method: "POST",
        path: "/api/local-import",
        desc: "Importe les fichiers .txt/.json/.md du dossier local dans la KB + vector store.",
        auth: "JWT ou x-import-key",
        body: JSON.stringify({ clientId: "string", fileName: "optionnel - importe un seul fichier" }, null, 2),
        response: JSON.stringify({ ok: true, filesProcessed: 5, kbEntries: 12, chunks: 48, modified: true }, null, 2),
        notes: "Détecte les changements via hash MD5. Fichiers supprimés = entrées KB supprimées.",
      },
    ],
  },
  {
    id: "docs",
    title: "Documents",
    icon: FileText,
    endpoints: [
      {
        method: "GET",
        path: "/api/docs?clientId={id}",
        desc: "Liste tous les documents d'un client.",
        auth: "JWT ou x-import-key",
      },
      {
        method: "POST",
        path: "/api/docs",
        desc: "Upload un document (PDF, DOCX, TXT). Stocké sur Vercel Blob ou /data/docs/ en local.",
        auth: "JWT ou x-import-key",
        body: "FormData: file (fichier), clientId, title, description",
        notes: "Le contenu texte est extrait automatiquement et indexé dans le vector store.",
      },
      {
        method: "GET",
        path: "/api/docs/{docId}",
        desc: "Télécharge ou affiche un document.",
        auth: "JWT ou x-import-key",
      },
      {
        method: "DELETE",
        path: "/api/docs/{docId}",
        desc: "Supprime un document du stockage et de la base.",
        auth: "JWT (admin)",
      },
    ],
  },
  {
    id: "vector",
    title: "Base Vectorielle",
    icon: Database,
    endpoints: [
      {
        method: "GET",
        path: "/api/vector-store?clientId={id}",
        desc: "Liste les chunks vectoriels d'un client.",
        auth: "JWT (admin)",
      },
      {
        method: "GET",
        path: "/api/vector-index-status?clientId={id}",
        desc: "Retourne le statut d'indexation de chaque document et entrée KB.",
        auth: "JWT (admin)",
        response: JSON.stringify({ documents: [{ id: "string", name: "string", indexed: true, chunkCount: 12 }], kbEntries: [{ id: "string", question: "string", indexed: true, chunkCount: 3 }] }, null, 2),
      },
      {
        method: "POST",
        path: "/api/migrate-vector",
        desc: "Migration complète : réindexe tous les documents et KB d'un client dans pgvector.",
        auth: "JWT (admin)",
        notes: "Opération lourde. Utiliser uniquement lors de la première mise en place ou après une migration DB.",
      },
    ],
  },
  {
    id: "quality",
    title: "Qualité & Auto-amélioration",
    icon: AlertTriangle,
    endpoints: [
      {
        method: "POST",
        path: "/api/quality/check",
        desc: "Analyse la KB : doublons, obsolètes, contradictions, réponses vides, vecteurs orphelins.",
        auth: "JWT (admin) ou x-import-key",
        body: JSON.stringify({ clientId: "string", autoFix: false }, null, 2),
        response: JSON.stringify({ summary: { total: 150, duplicates: 3, obsolete: 1, contradictions: 0, emptyAnswers: 2, missingKeywords: 5, orphanVectors: 0 }, issues: [] }, null, 2),
        notes: "autoFix=true supprime automatiquement les doublons et réponses vides.",
      },
      {
        method: "GET",
        path: "/api/quality/check?clientId={id}",
        desc: "Retourne les alertes qualité récentes.",
        auth: "JWT (admin)",
      },
      {
        method: "POST",
        path: "/api/auto-improvement",
        desc: "Analyse les conversations récentes, identifie les questions récurrentes sans bonne réponse, génère des propositions de KB.",
        auth: "JWT (admin) ou x-import-key",
        body: JSON.stringify({ clientId: "string", days: 30, minOccurrences: 3 }, null, 2),
        response: JSON.stringify({ analyzed: 8, proposals: 5, patterns: [], newProposals: [] }, null, 2),
        notes: "Le seuil de similarité est >60% pour grouper les questions. minOccurrences=3 par défaut.",
      },
      {
        method: "GET",
        path: "/api/auto-improvement?clientId={id}",
        desc: "Liste les propositions d'amélioration et les stats.",
        auth: "JWT (admin) ou x-import-key",
      },
      {
        method: "POST",
        path: "/api/auto-improvement/validate",
        desc: "Approuve ou rejette une proposition. L'approbation crée automatiquement l'entrée KB.",
        auth: "JWT (admin) ou x-import-key",
        body: JSON.stringify({ proposalId: "string", action: "approve|reject" }, null, 2),
      },
    ],
  },
  {
    id: "knowledge-gaps",
    title: "Fenêtres de Connaissance",
    icon: Brain,
    endpoints: [
      {
        method: "GET",
        path: "/api/knowledge-gaps?clientId={id}",
        desc: "Liste les questions sans réponse (escalades) capturées automatiquement.",
        auth: "JWT (admin) ou x-import-key",
      },
      {
        method: "GET",
        path: "/api/knowledge-gaps?clientId={id}&stats=true",
        desc: "Retourne les statistiques des gaps (total, resolved, pending).",
        auth: "JWT (admin) ou x-import-key",
      },
      {
        method: "POST",
        path: "/api/knowledge-gaps/submit",
        desc: "Soumet une réponse experte pour un gap. Si confiance >80%, ajout auto en KB.",
        auth: "JWT (admin) ou x-import-key",
        body: JSON.stringify({ gapId: "string", answer: "string", keywords: "string[]", expertId: "string" }, null, 2),
        notes: "La confiance est calculée sur la longueur, la présence de mots-clés, et la cohérence.",
      },
      {
        method: "GET",
        path: "/api/knowledge-gaps/validate?clientId={id}",
        desc: "Liste les entrées KB en attente de validation (confiance <80%).",
        auth: "JWT (admin) ou x-import-key",
      },
      {
        method: "POST",
        path: "/api/knowledge-gaps/validate",
        desc: "Approuve ou rejette une entrée KB en attente.",
        auth: "JWT (admin) ou x-import-key",
        body: JSON.stringify({ pendingId: "string", action: "approve|reject" }, null, 2),
      },
    ],
  },
  {
    id: "reports",
    title: "Rapports & Analytics",
    icon: BarChart3,
    endpoints: [
      {
        method: "GET",
        path: "/api/reports/activity?clientId={id}&format=json|markdown|html",
        desc: "Génère un rapport d'activité : KB importées, docs indexés, chunks, erreurs, taux de résolution.",
        auth: "JWT (admin) ou x-import-key",
        notes: "Le rapport peut être planifié via n8n pour un envoi hebdomadaire par email.",
      },
    ],
  },
  {
    id: "admin",
    title: "Administration",
    icon: Shield,
    endpoints: [
      {
        method: "GET",
        path: "/api/analytics?clientId={id}",
        desc: "Statistiques détaillées : conversations, tokens utilisés, sources de réponses, scores moyen.",
        auth: "JWT (admin)",
      },
      {
        method: "PUT",
        path: "/api/settings",
        desc: "Met à jour la configuration IA (provider, modèle, température, embeddings).",
        auth: "JWT (admin)",
        body: JSON.stringify({ defaultProvider: "groq", defaultModel: "llama-3.3-70b-versatile", embeddingProvider: "cohere", embeddingApiKey: "sk-..." }, null, 2),
      },
      {
        method: "POST",
        path: "/api/conversations",
        desc: "Liste les conversations d'un client avec filtres (source, date, score).",
        auth: "JWT (admin)",
      },
    ],
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="text-gray-400 hover:text-gray-600 transition-colors"
      title="Copier"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

export default function ApiDocsPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const sections = SECTIONS.filter(s =>
    !filter || s.title.toLowerCase().includes(filter.toLowerCase()) ||
    s.endpoints.some(e => e.path.toLowerCase().includes(filter.toLowerCase()) || e.desc.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <FileText size={28} className="text-blue-600" />
          API & Automation
        </h1>
        <p className="text-gray-500 mt-2">
          Documentation complète de l&apos;API Nova Chatbot. Toutes les routes acceptent l&apos;authentification JWT (Bearer token) ou la clé API (<code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">x-import-key</code>).
        </p>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Rechercher un endpoint..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === section.id ? null : section.id)}
              className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <section.icon size={20} className="text-blue-600 shrink-0" />
              <span className="font-semibold text-gray-900 flex-1">{section.title}</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{section.endpoints.length} endpoints</span>
              {expanded === section.id ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
            </button>

            {expanded === section.id && (
              <div className="border-t border-gray-100">
                {section.endpoints.map((ep, i) => (
                  <div key={i} className={`px-6 py-4 ${i > 0 ? "border-t border-gray-50" : ""}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded ${
                        ep.method === "GET" ? "bg-green-100 text-green-700" :
                        ep.method === "POST" ? "bg-blue-100 text-blue-700" :
                        ep.method === "PUT" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {ep.method}
                      </span>
                      <code className="text-sm text-gray-800 font-mono flex-1">{ep.path}</code>
                      <CopyButton text={ep.path} />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{ep.desc}</p>
                    <div className="text-xs text-gray-400 mb-3">
                      Auth: <span className="text-gray-600">{ep.auth}</span>
                    </div>

                    {ep.body && (
                      <div className="mb-3">
                        <div className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-2">Request Body <CopyButton text={ep.body} /></div>
                        <pre className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs text-gray-700 overflow-x-auto">{ep.body}</pre>
                      </div>
                    )}

                    {ep.response && (
                      <div className="mb-3">
                        <div className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-2">Response <CopyButton text={ep.response} /></div>
                        <pre className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs text-gray-700 overflow-x-auto">{ep.response}</pre>
                      </div>
                    )}

                    {ep.notes && (
                      <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700">
                        {ep.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-10 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
          <Zap size={20} className="text-blue-600" />
          Guide d&apos;automatisation (n8n)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <h3 className="font-semibold mb-2">Automatisations disponibles</h3>
            <ul className="space-y-1.5 text-gray-600">
              <li>Weekly quality check → <code className="text-xs bg-gray-100 px-1">POST /api/quality/check</code></li>
              <li>Weekly activity report → <code className="text-xs bg-gray-100 px-1">GET /api/reports/activity</code></li>
              <li>Periodic local import scan → <code className="text-xs bg-gray-100 px-1">POST /api/local-import/scan</code></li>
              <li>Daily auto-improvement analysis → <code className="text-xs bg-gray-100 px-1">POST /api/auto-improvement</code></li>
              <li>Escalade monitoring → <code className="text-xs bg-gray-100 px-1">GET /api/knowledge-gaps?stats=true</code></li>
            </ul>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <h3 className="font-semibold mb-2">Environnements</h3>
            <ul className="space-y-1.5 text-gray-600">
              <li><strong>Vercel :</strong> KB, docs, vector store, chat, quality, reports, auto-improvement</li>
              <li><strong>VM (Ubuntu) :</strong> + local import, + n8n, + file watcher</li>
              <li><strong>Auth :</strong> Bearer JWT ou header <code className="text-xs bg-gray-100 px-1">x-import-key</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
