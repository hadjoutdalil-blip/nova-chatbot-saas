"use client";

import { useEffect, useState } from "react";
import { BookOpen, MessageCircle, PieChart } from "lucide-react";

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
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Statistiques</h1>
      <p className="text-gray-500 mb-8">Suivez les performances de votre chatbot.</p>

      <div className="grid grid-cols-3 gap-5">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-elevated">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <BookOpen size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Entrées KB</p>
              <p className="text-3xl font-bold text-gray-900">{stats.kb}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-elevated">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <MessageCircle size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Conversations</p>
              <p className="text-3xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-elevated">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
              <PieChart size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Taux réponse KB</p>
              <p className="text-3xl font-bold text-gray-900">-</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
