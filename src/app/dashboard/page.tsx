import { BookOpen, MessageCircle, Users } from "lucide-react";

const statCards = [
  { label: "Entrées KB", value: "0", icon: BookOpen, color: "from-purple-500 to-purple-400" },
  { label: "Conversations", value: "0", icon: MessageCircle, color: "from-blue-500 to-blue-400" },
  { label: "Clients actifs", value: "-", icon: Users, color: "from-emerald-500 to-emerald-400" },
];

export default function DashboardPage() {
  return (
    <div className="animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Vue d&apos;ensemble de votre plateforme</p>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-white rounded-xl border border-gray-100 shadow-card p-6 hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-sm`}>
                <Icon size={20} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-400 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
