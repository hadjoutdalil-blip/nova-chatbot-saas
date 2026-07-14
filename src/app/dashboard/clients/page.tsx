"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Client {
  id: string;
  name: string;
  slug: string;
  plan: string;
  primaryColor: string;
  aiProvider: string;
  aiModel: string;
  createdAt: string;
}

const PLAN_LABELS: Record<string, string> = {
  ecommerce: "E-commerce",
  support: "Support Client",
  realestate: "Immobilier",
  custom: "Sur Mesure",
};

const PLAN_COLORS: Record<string, string> = {
  ecommerce: "bg-emerald-100 text-emerald-700",
  support: "bg-indigo-100 text-indigo-700",
  realestate: "bg-blue-100 text-blue-700",
  custom: "bg-gray-100 text-gray-600",
};

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/clients", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((r) => r.json())
      .then((data) => { setClients(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce client ? Cette action est irréversible.")) return;
    const res = await fetch(`/api/clients/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (res.ok) setClients((prev) => prev.filter((c) => c.id !== id));
  }

  if (loading) return <p className="text-gray-500">Chargement...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Clients</h1>
        <button
          onClick={() => router.push("/dashboard/clients/new")}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700"
        >
          + Nouveau client
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-600">Nom</th>
              <th className="px-4 py-3 font-medium text-gray-600">Pack</th>
              <th className="px-4 py-3 font-medium text-gray-600">Slug</th>
              <th className="px-4 py-3 font-medium text-gray-600">IA</th>
              <th className="px-4 py-3 font-medium text-gray-600">Créé le</th>
              <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.primaryColor }} />
                  {c.name}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${PLAN_COLORS[c.plan] || PLAN_COLORS.custom}`}>
                    {PLAN_LABELS[c.plan] || c.plan}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{c.slug}</td>
                <td className="px-4 py-3 text-gray-500">{c.aiProvider} / {c.aiModel}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5 flex-wrap">
                    <button onClick={() => router.push(`/dashboard/clients/${c.id}`)} className="text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded text-xs font-medium">Modifier</button>
                    <button onClick={() => router.push(`/dashboard/clients/${c.id}/kb`)} className="text-gray-600 hover:bg-gray-50 px-2 py-1 rounded text-xs">KB</button>
                    <button onClick={() => router.push(`/dashboard/clients/${c.id}/widget`)} className="text-gray-600 hover:bg-gray-50 px-2 py-1 rounded text-xs">Widget</button>
                    <button onClick={() => router.push(`/dashboard/clients/${c.id}/test`)} className="text-gray-600 hover:bg-gray-50 px-2 py-1 rounded text-xs">Tester</button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:bg-red-50 px-2 py-1 rounded text-xs">Suppr.</button>
                  </div>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Aucun client</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
