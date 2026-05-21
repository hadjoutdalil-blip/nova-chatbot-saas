export default function DashboardPage() {
  const stats = [
    { label: "Entrées KB", value: "0", icon: "📚", color: "from-purple-500 to-purple-400" },
    { label: "Conversations", value: "0", icon: "💬", color: "from-blue-500 to-blue-400" },
    { label: "Clients actifs", value: "-", icon: "👥", color: "from-emerald-500 to-emerald-400" },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Vue d'ensemble de votre plateforme</p>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-gray-100 shadow-card p-6 hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-lg shadow-sm`}>
                {s.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
