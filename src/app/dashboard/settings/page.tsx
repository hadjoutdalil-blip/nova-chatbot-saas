"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) { router.push("/"); return; }
    const payload = JSON.parse(atob(t.split(".")[1]));
    setUser(payload);
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Paramètres</h1>
      <div className="bg-white rounded-xl shadow-sm p-6 max-w-lg space-y-4">
        <div>
          <p className="text-sm text-gray-500">Utilisateur</p>
          <p className="font-medium">{user?.userId || "-"}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Rôle</p>
          <p className="font-medium capitalize">{user?.role || "-"}</p>
        </div>
        <hr />
        <button onClick={handleLogout} className="text-red-500 hover:text-red-700 text-sm font-medium">
          Déconnexion
        </button>
      </div>
    </div>
  );
}
