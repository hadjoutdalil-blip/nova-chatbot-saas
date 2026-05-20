"use client";

import { useRouter } from "next/navigation";

export default function AppSettingsPage() {
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Paramètres</h1>
      <div className="bg-white rounded-xl shadow-sm p-6 max-w-lg space-y-4">
        <p className="text-sm text-gray-500">Bienvenue sur votre espace client. Vous pouvez gérer votre chatbot et votre base de connaissances depuis cette interface.</p>
        <hr />
        <button onClick={handleLogout} className="text-red-500 hover:text-red-700 text-sm font-medium">Déconnexion</button>
      </div>
    </div>
  );
}
