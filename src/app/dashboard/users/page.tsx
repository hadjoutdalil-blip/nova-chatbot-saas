"use client";

import { useEffect, useState } from "react";
import { Plus, Edit3, Trash2, X, Shield, User as UserIcon } from "lucide-react";

interface UserEntry {
  id: string;
  email: string;
  name: string;
  role: string;
  clientId: string;
  clientName: string;
}

interface ClientOption {
  id: string;
  name: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", password: "", name: "", role: "client", clientId: "" });
  const [error, setError] = useState("");

  function token() { return localStorage.getItem("token") || ""; }

  function load() {
    Promise.all([
      fetch("/api/users", { headers: { Authorization: `Bearer ${token()}` } }).then((r) => r.json()),
      fetch("/api/clients", { headers: { Authorization: `Bearer ${token()}` } }).then((r) => r.json()),
    ]).then(([usersData, clientsData]) => {
      setUsers(usersData);
      setClients(clientsData);
      setLoading(false);
    });
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const url = editing ? `/api/users/${editing}` : "/api/users";
    const method = editing ? "PUT" : "POST";
    const body: any = { name: form.name, role: form.role };
    if (form.email) body.email = form.email;
    if (form.password) body.password = form.password;
    if (form.clientId) body.clientId = form.clientId;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error); return; }
    setForm({ email: "", password: "", name: "", role: "client", clientId: "" });
    setEditing(null);
    setShowForm(false);
    load();
  }

  function handleEdit(u: UserEntry) {
    setForm({ email: u.email, password: "", name: u.name, role: u.role, clientId: u.clientId });
    setEditing(u.id);
    setShowForm(true);
  }

  function handleCancel() {
    setForm({ email: "", password: "", name: "", role: "client", clientId: "" });
    setEditing(null);
    setError("");
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cet utilisateur ?")) return;
    await fetch(`/api/users/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
    load();
  }

  if (loading) return <p className="text-gray-500">Chargement...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-sm text-gray-400 mt-1">Gestion des comptes clients et administrateurs</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm({ email: "", password: "", name: "", role: "client", clientId: clients[0]?.id || "" }); }}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-200"
        >
          <Plus size={16} /> Nouvel utilisateur
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={handleCancel}>
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-full max-w-lg max-h-[90vh] overflow-y-auto m-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">{editing ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</h2>
              <button onClick={handleCancel} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" required={!editing} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe {editing && <span className="text-gray-400 font-normal">(laisser vide pour conserver)</span>}
                </label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" required={!editing} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">
                  <option value="client">Client</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>

              {form.role === "client" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client rattaché</label>
                  <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" required>
                    <option value="">— Sélectionner —</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="submit" className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:from-emerald-700 hover:to-emerald-600 transition-all">
                  {editing ? "Enregistrer" : "Créer"}
                </button>
                <button type="button" onClick={handleCancel} className="text-gray-500 hover:text-gray-700 text-sm px-4">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="px-4 py-3 font-medium text-gray-600">Nom</th>
              <th className="px-4 py-3 font-medium text-gray-600">Rôle</th>
              <th className="px-4 py-3 font-medium text-gray-600">Client</th>
              <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-gray-700">{u.email}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                    u.role === "admin" ? "bg-emerald-50 text-emerald-700" : "bg-gray-50 text-gray-600"
                  }`}>
                    {u.role === "admin" ? <Shield size={12} /> : <UserIcon size={12} />}
                    {u.role === "admin" ? "Admin" : "Client"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{u.clientName}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <button onClick={() => handleEdit(u)} className="text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded text-xs font-medium transition-colors">
                      <Edit3 size={12} className="inline mr-1" />Modifier
                    </button>
                    <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:bg-red-50 px-2 py-1 rounded text-xs font-medium transition-colors">
                      <Trash2 size={12} className="inline mr-1" />Suppr.
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Aucun utilisateur</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
