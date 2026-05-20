"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AppDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ kb: 0 });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("/api/kb", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setStats({ kb: data.length }))
      .catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Mon tableau de bord</h1>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">Entrées KB</p>
          <p className="text-3xl font-bold">{stats.kb}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">Conversations</p>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">Statut du chatbot</p>
          <p className="text-3xl font-bold text-green-500">Actif</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => router.push("/app/kb")} className="bg-white p-6 rounded-xl shadow-sm text-left hover:shadow-md transition">
          <p className="text-2xl mb-2">📚</p>
          <p className="font-semibold">Gérer ma base de connaissances</p>
          <p className="text-sm text-gray-400 mt-1">Ajoutez et modifiez les questions/réponses de votre chatbot.</p>
        </button>
        <button onClick={() => router.push("/app/widget")} className="bg-white p-6 rounded-xl shadow-sm text-left hover:shadow-md transition">
          <p className="text-2xl mb-2">💬</p>
          <p className="font-semibold">Personnaliser mon widget</p>
          <p className="text-sm text-gray-400 mt-1">Modifiez l&apos;apparence et le code d&apos;intégration.</p>
        </button>
      </div>
    </div>
  );
}
