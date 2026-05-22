"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, MessageCircle, CheckCircle, ArrowRight } from "lucide-react";

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
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Mon tableau de bord</h1>
      <p className="text-gray-500 mb-8">Bienvenue sur votre espace client.</p>

      <div className="grid grid-cols-3 gap-5 mb-8">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-elevated">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <BookOpen size={20} />
            </div>
          </div>
          <p className="text-sm text-gray-500">Entrées KB</p>
          <p className="text-3xl font-bold text-gray-900">{stats.kb}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-elevated">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <MessageCircle size={20} />
            </div>
          </div>
          <p className="text-sm text-gray-500">Conversations</p>
          <p className="text-3xl font-bold text-gray-900">0</p>
        </div>
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-elevated">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
              <CheckCircle size={20} />
            </div>
          </div>
          <p className="text-sm text-gray-500">Statut du chatbot</p>
          <p className="text-3xl font-bold text-green-500">Actif</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
      <div className="grid grid-cols-2 gap-5">
        <button onClick={() => router.push("/app/kb")} className="group bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-left hover:shadow-lg transition-all hover:-translate-y-0.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-purple-200">
            <BookOpen size={22} />
          </div>
          <p className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">Gérer ma base de connaissances</p>
          <p className="text-sm text-gray-400 mt-1">Ajoutez et modifiez les questions/réponses de votre chatbot.</p>
          <div className="flex items-center gap-1 mt-3 text-sm font-medium text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
            Accéder <ArrowRight size={14} />
          </div>
        </button>
        <button onClick={() => router.push("/app/widget")} className="group bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-left hover:shadow-lg transition-all hover:-translate-y-0.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-200">
            <MessageCircle size={22} />
          </div>
          <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Personnaliser mon widget</p>
          <p className="text-sm text-gray-400 mt-1">Modifiez l&apos;apparence et le code d&apos;intégration.</p>
          <div className="flex items-center gap-1 mt-3 text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
            Accéder <ArrowRight size={14} />
          </div>
        </button>
      </div>
    </div>
  );
}
