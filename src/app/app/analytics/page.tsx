"use client";

import { useEffect, useState } from "react";

export default function AppAnalyticsPage() {
  const [stats, setStats] = useState({ kb: 0 });

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) return;
    fetch("/api/kb", { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((data) => setStats({ kb: data.length }))
      .catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Statistiques</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">Entrées KB</p>
          <p className="text-3xl font-bold">{stats.kb}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">Conversations</p>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">Taux de réponse KB</p>
          <p className="text-3xl font-bold">-</p>
        </div>
      </div>
    </div>
  );
}
