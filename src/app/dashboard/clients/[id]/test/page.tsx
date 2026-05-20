"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ClientTestPage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<any>(null);
  const [slug, setSlug] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) return;
    fetch(`/api/clients/${id}`, { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((c) => { setClient(c); setSlug(c.slug); });
  }, [id]);

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
        <Link href={`/dashboard/clients/${id}/widget`} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">Widget</Link>
        <Link href={`/dashboard/clients/${id}/test`} className="text-sm px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 font-medium">Tester</Link>
      </div>

      <p className="text-gray-500 mb-6">Prévisualisation du chatbot de {client?.name}. Le widget apparaît en bas à droite.</p>

      <div className="bg-white rounded-xl shadow-sm p-6 border text-sm text-gray-500">
        {slug ? (
          <>
            <p className="mb-4">Le chatbot est chargé ci-dessous. Cliquez sur l&apos;icône en bas à droite pour tester.</p>
            <div className="bg-gray-50 rounded-xl p-4 text-center text-gray-400 text-xs">
              <p>Script injecté : <code className="text-purple-600">/api/widget/{slug}/embed.js</code></p>
              <p className="mt-1">Le widget est actif sur cette page. Cliquez sur le bouton en bas à droite.</p>
            </div>
            <script src={`/api/widget/${slug}/embed.js`} />
          </>
        ) : (
          <p>Chargement...</p>
        )}
      </div>
    </div>
  );
}
