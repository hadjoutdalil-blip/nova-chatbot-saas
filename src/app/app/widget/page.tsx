"use client";

import { useEffect, useState } from "react";
import { Save, Eye, Bell, MessageCircle, Timer, ScrollText, MousePointer2 } from "lucide-react";

export default function AppWidgetPage() {
  const [clientSlug, setClientSlug] = useState("");
  const [form, setForm] = useState({
    welcomeTitle: "Bienvenue !",
    welcomeSub: "Comment puis-je vous aider ?",
    showBrand: true,
    position: "right",
    marginBottom: 20,
    marginRight: 20,
    avatarIcon: "robot",
    proactiveEnabled: false,
    autoOpenDelay: 5,
    showNotification: true,
    notificationText: "",
    sendGreeting: false,
    scrollTrigger: 0,
    exitIntent: false,
  });
  const [hasConfig, setHasConfig] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  function token() { return localStorage.getItem("token") || ""; }

  useEffect(() => {
    const t = token();
    if (!t) return;
    const payload = JSON.parse(atob(t.split(".")[1]));
    fetch("/api/clients", { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then(async (clients) => {
        const client = clients.find((c: any) => c.id === payload.clientId);
        if (!client) return;
        setClientSlug(client.slug);
        const res = await fetch(`/api/widget/${client.slug}`, { cache: "no-store" });
        const data = await res.json();
        if (data.widgetConfig) {
          setHasConfig(true);
          setForm({
            welcomeTitle: data.widgetConfig.welcomeTitle,
            welcomeSub: data.widgetConfig.welcomeSub,
            showBrand: data.widgetConfig.showBrand,
            position: data.widgetConfig.position,
            marginBottom: data.widgetConfig.marginBottom,
            marginRight: data.widgetConfig.marginRight,
            avatarIcon: data.widgetConfig.avatarIcon,
            proactiveEnabled: data.widgetConfig.proactiveEnabled === true,
            autoOpenDelay: data.widgetConfig.autoOpenDelay ?? 5,
            showNotification: data.widgetConfig.showNotification !== false,
            notificationText: data.widgetConfig.notificationText || "",
            sendGreeting: data.widgetConfig.sendGreeting === true,
            scrollTrigger: data.widgetConfig.scrollTrigger ?? 0,
            exitIntent: data.widgetConfig.exitIntent === true,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const [saveError, setSaveError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    const t = token();
    const payload = JSON.parse(atob(t.split(".")[1]));
    const method = hasConfig ? "PUT" : "POST";
    const res = await fetch("/api/widget", {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ ...form, clientId: payload.clientId }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setSaveError(d.error || "Erreur"); return; }
    setEditMode(false);
    setHasConfig(true);
  }

  function embedCode() {
    if (!clientSlug) return "";
    return `<script src="${window.location.origin}/api/widget/${clientSlug}/embed"></script>`;
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Chargement...</div>;

  const avatarOptions = [
    { id: "robot", label: "Robot", svg: '<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="26" fill="#4A90D9"/><circle cx="22" cy="28" r="7" fill="#fff"/><circle cx="42" cy="28" r="7" fill="#fff"/><circle cx="22" cy="28" r="3.5" fill="#1a1a2e"/><circle cx="42" cy="28" r="3.5" fill="#1a1a2e"/><path d="M24 46Q32 54 40 46" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/><rect x="29" y="8" width="6" height="10" rx="3" fill="#4A90D9"/><circle cx="32" cy="6" r="4.5" fill="#FFD700"/></svg>' },
    { id: "bot", label: "Bot", svg: '<svg viewBox="0 0 64 64" width="24" height="24"><rect x="10" y="14" width="44" height="38" rx="10" fill="#2ECC71"/><rect x="18" y="24" width="10" height="10" rx="2" fill="#fff"/><rect x="36" y="24" width="10" height="10" rx="2" fill="#fff"/><rect x="18" y="24" width="5" height="10" fill="#1a1a2e"/><rect x="36" y="24" width="5" height="10" fill="#1a1a2e"/><rect x="24" y="42" width="16" height="4" rx="2" fill="#fff"/><rect x="29" y="6" width="6" height="10" rx="3" fill="#2ECC71"/><circle cx="32" cy="4" r="3.5" fill="#E74C3C"/></svg>' },
    { id: "sparkle", label: "Étincelle", svg: '<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="26" fill="#9B59B6"/><path d="M32 8l4 12 12-4-8 10 8 12-12-4-4 12-4-12-12 4 8-12-8-10 12 4z" fill="#FFD700" opacity=".3"/><circle cx="22" cy="28" r="7" fill="#fff"/><circle cx="42" cy="28" r="7" fill="#fff"/><circle cx="22" cy="28" r="4" fill="#fff"/><circle cx="42" cy="28" r="4" fill="#fff"/><path d="M24 46Q32 54 40 46" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>' },
    { id: "heart", label: "Cœur", svg: '<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="26" fill="#E74C3C"/><path d="M18 26Q22 18 26 26Q30 18 32 26" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/><path d="M32 26Q34 18 38 26Q42 18 46 26" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/><circle cx="18" cy="26" r="1.5" fill="#E74C3C"/><circle cx="32" cy="26" r="1.5" fill="#E74C3C"/><circle cx="46" cy="26" r="1.5" fill="#E74C3C"/><path d="M24 46Q32 54 40 46" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="16" cy="40" r="4.5" fill="#fff" opacity=".25"/><circle cx="48" cy="40" r="4.5" fill="#fff" opacity=".25"/></svg>' },
    { id: "chat", label: "Chat", svg: '<svg viewBox="0 0 64 64" width="24" height="24"><path d="M32 10L18 24h-6v30h40V24h-6L32 10z" fill="#FF6B6B"/><circle cx="22" cy="30" r="7" fill="#fff"/><circle cx="42" cy="30" r="7" fill="#fff"/><circle cx="22" cy="30" r="3.5" fill="#1a1a2e"/><circle cx="42" cy="30" r="3.5" fill="#1a1a2e"/><path d="M24 46Q32 54 40 46" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M14 38L10 42M50 38L54 42" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>' },
    { id: "headset", label: "Casque", svg: '<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="24" fill="#1ABC9C"/><rect x="6" y="30" width="10" height="18" rx="5" fill="#16A085"/><rect x="48" y="30" width="10" height="18" rx="5" fill="#16A085"/><circle cx="22" cy="28" r="7" fill="#fff"/><circle cx="42" cy="28" r="7" fill="#fff"/><circle cx="22" cy="28" r="3.5" fill="#1a1a2e"/><circle cx="42" cy="28" r="3.5" fill="#1a1a2e"/><path d="M24 46Q32 54 40 46" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="32" cy="48" r="2.5" fill="#E74C3C"/></svg>' },
    { id: "smile", label: "Sourire", svg: '<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="26" fill="#F1C40F"/><circle cx="22" cy="28" r="7" fill="#fff"/><circle cx="42" cy="28" r="7" fill="#fff"/><circle cx="22" cy="28" r="4" fill="#333"/><circle cx="42" cy="28" r="4" fill="#333"/><circle cx="16" cy="40" r="5" fill="#E74C3C" opacity=".35"/><circle cx="48" cy="40" r="5" fill="#E74C3C" opacity=".35"/><path d="M22 48Q32 58 42 48" stroke="#333" stroke-width="4" fill="none" stroke-linecap="round"/></svg>' },
    { id: "zap", label: "Éclair", svg: '<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="26" fill="#F39C12"/><path d="M32 8l-8 20h8l-4 24 16-28h-8l8-16z" fill="#E67E22" opacity=".4"/><circle cx="22" cy="28" r="7" fill="#fff"/><circle cx="42" cy="28" r="7" fill="#fff"/><circle cx="22" cy="28" r="3.5" fill="#333"/><circle cx="42" cy="28" r="3.5" fill="#333"/><path d="M24 46Q32 54 40 46" stroke="#333" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>' },
    { id: "compass", label: "Boussole", svg: '<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="26" fill="#3F51B5"/><circle cx="32" cy="28" r="10" fill="#fff" opacity=".15"/><path d="M32 22v12M26 28h12" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><circle cx="22" cy="28" r="7" fill="#fff"/><circle cx="42" cy="28" r="7" fill="#fff"/><circle cx="22" cy="28" r="3.5" fill="#1a1a2e"/><circle cx="42" cy="28" r="3.5" fill="#1a1a2e"/><path d="M24 46Q32 54 40 46" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>' },
    { id: "shield", label: "Bouclier", svg: '<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="26" fill="#546E7A"/><path d="M32 14l14 5v12c0 10-14 17-14 17s-14-7-14-17V19l14-5z" fill="#78909C" opacity=".5"/><circle cx="22" cy="28" r="7" fill="#fff"/><circle cx="42" cy="28" r="7" fill="#fff"/><circle cx="22" cy="28" r="3.5" fill="#1a1a2e"/><circle cx="42" cy="28" r="3.5" fill="#1a1a2e"/><path d="M24 46Q32 54 40 46" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M32 14l14 5v12c0 10-14 17-14 17s-14-7-14-17V19l14-5z" stroke="#fff" stroke-width="2.5" fill="none"/></svg>' },
    { id: "astronaut", label: "Astronaute", svg: '<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="26" fill="#2C3E50"/><circle cx="32" cy="34" r="20" fill="#B0BEC5"/><circle cx="22" cy="28" r="7" fill="#fff"/><circle cx="42" cy="28" r="7" fill="#fff"/><circle cx="22" cy="28" r="3.5" fill="#1a1a2e"/><circle cx="42" cy="28" r="3.5" fill="#1a1a2e"/><path d="M24 46Q32 54 40 46" stroke="#1a1a2e" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="44" cy="52" r="4" fill="#fff" opacity=".25"/></svg>' },
    { id: "friend", label: "Amical", svg: '<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="26" fill="#E91E8A"/><path d="M18 28Q22 20 26 28Q30 20 34 28Q38 20 42 28Q46 20 46 28" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/><path d="M24 46Q32 54 40 46" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="16" cy="40" r="4.5" fill="#fff" opacity=".3"/><circle cx="48" cy="40" r="4.5" fill="#fff" opacity=".3"/></svg>' },
    { id: "ninja", label: "Ninja", svg: '<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="26" fill="#6C5CE7"/><rect x="14" y="14" width="36" height="18" rx="9" fill="#2D1B69"/><circle cx="22" cy="28" r="5" fill="#fff"/><circle cx="42" cy="28" r="5" fill="#fff"/><circle cx="22" cy="28" r="2.5" fill="#1a1a2e"/><circle cx="42" cy="28" r="2.5" fill="#1a1a2e"/><path d="M26 46Q32 52 38 46" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="32" cy="8" r="4" fill="#FFD700"/></svg>' },
    { id: "genius", label: "Génie", svg: '<svg viewBox="0 0 64 64" width="24" height="24"><circle cx="32" cy="34" r="26" fill="#E67E22"/><circle cx="32" cy="10" r="8" fill="#FFD700"/><path d="M32 6v8M28 10h8" stroke="#E67E22" stroke-width="2.5" stroke-linecap="round"/><circle cx="22" cy="30" r="7" fill="#fff"/><circle cx="42" cy="30" r="7" fill="#fff"/><circle cx="22" cy="30" r="3.5" fill="#333"/><circle cx="42" cy="30" r="3.5" fill="#333"/><rect x="16" y="26" width="32" height="4" rx="2" fill="#333" opacity=".5"/><path d="M26 46Q32 52 38 46" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></svg>' },
    { id: "alien", label: "Alien", svg: '<svg viewBox="0 0 64 64" width="24" height="24"><ellipse cx="32" cy="36" rx="28" ry="22" fill="#00E676"/><circle cx="20" cy="28" r="8" fill="#fff"/><circle cx="44" cy="28" r="8" fill="#fff"/><circle cx="32" cy="36" r="5" fill="#fff"/><circle cx="20" cy="28" r="4" fill="#1a1a2e"/><circle cx="44" cy="28" r="4" fill="#1a1a2e"/><circle cx="32" cy="36" r="2.5" fill="#1a1a2e"/><path d="M24 48Q32 54 40 48" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M12 20Q8 12 16 14" stroke="#00E676" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M52 20Q56 12 48 14" stroke="#00E676" stroke-width="3" fill="none" stroke-linecap="round"/></svg>' },
    { id: "robot2", label: "Robot 2", svg: '<svg viewBox="0 0 64 64" width="24" height="24"><rect x="10" y="14" width="44" height="40" rx="8" fill="#95A5A6"/><circle cx="22" cy="30" r="7" fill="#fff"/><circle cx="42" cy="30" r="7" fill="#fff"/><circle cx="22" cy="30" r="3.5" fill="#333"/><circle cx="42" cy="30" r="3.5" fill="#333"/><rect x="26" y="44" width="12" height="4" rx="2" fill="#333"/><rect x="14" y="12" width="8" height="3" rx="1.5" fill="#E74C3C"/><rect x="28" y="12" width="8" height="3" rx="1.5" fill="#F1C40F"/><rect x="42" y="12" width="8" height="3" rx="1.5" fill="#2ECC71"/></svg>' },
    { id: "color1", label: "Robot jaune", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 53.8 45"><defs><style>.cls-1{fill:#f4dd45;}.cls-1,.cls-2,.cls-3,.cls-4{fill-rule:evenodd;}.cls-2{fill:#aaf4a5;}.cls-3{fill:#def6ff;}.cls-4{fill:#dd636e;}.cls-5{fill:none;stroke:#000;stroke-linecap:round;stroke-linejoin:round;}</style></defs><g><polygon class="cls-1" points="53.3 44.5 0.5 44.5 0.5 40.1 53.3 40.1 53.3 44.5 53.3 44.5"/><path class="cls-2" d="M48.9,22.5a22,22,0,0,0-22-22h0a22,22,0,0,0-22,22V40.1h44V22.5Z"/><path class="cls-3" d="M26.9,9.3c9.72,0,17.6,5.92,17.6,13.2S36.62,35.7,26.9,35.7,9.3,29.79,9.3,22.5,17.19,9.3,26.9,9.3Z"/><path class="cls-4" d="M26.9,19.61a2.31,2.31,0,0,1,3.71-.91c.92.91.92,2.73,0,4.56A10.87,10.87,0,0,1,26.9,26.9a10.84,10.84,0,0,1-3.7-3.64c-.93-1.83-.93-3.65,0-4.56a2.31,2.31,0,0,1,3.7.91Z"/><path class="cls-5" d="M26.35,44.5h1.1m3.85,0h22V40.1H.5v4.4h22m26.4-22a22,22,0,0,0-22-22h0a22,22,0,0,0-22,22V40.1h44V22.5ZM26.9,9.3c9.72,0,17.6,5.92,17.6,13.2S36.62,35.7,26.9,35.7,9.3,29.79,9.3,22.5,17.19,9.3,26.9,9.3Zm0,10.31a2.31,2.31,0,0,1,3.71-.91c.92.91.92,2.73,0,4.56A10.87,10.87,0,0,1,26.9,26.9a10.84,10.84,0,0,1-3.7-3.64c-.93-1.83-.93-3.65,0-4.56a2.31,2.31,0,0,1,3.7.91Zm7.62,7.29a8.79,8.79,0,0,1-7.62,4.4M19.28,18.1a8.8,8.8,0,0,1,7.62-4.4M3.76,2.85A4.4,4.4,0,1,1,.65,8.24M50.19,2.85A4.4,4.4,0,1,0,53.3,8.24"/></g></svg>' },
    { id: "color2", label: "Robot vert", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 53.8 45"><defs><style>.cls-1{fill:#aaf4a5;}.cls-1,.cls-2,.cls-3{fill-rule:evenodd;}.cls-2{fill:#f4dd45;}.cls-3{fill:#dd636e;}.cls-4{fill:none;stroke:#000;stroke-linecap:round;stroke-linejoin:round;}</style></defs><g><polygon class="cls-1" points="48.9 13.7 4.9 13.7 4.9 44.5 48.9 44.5 48.9 13.7 48.9 13.7"/><path class="cls-2" d="M44.5,29.1a11,11,0,0,0-11-11H20.3a11,11,0,0,0-11,11h0a11,11,0,0,0,11,11H33.5a11,11,0,0,0,11-11ZM48.9.5a4.4,4.4,0,1,0,4.4,4.4A4.4,4.4,0,0,0,48.9.5ZM4.9.5A4.4,4.4,0,1,1,.5,4.9,4.4,4.4,0,0,1,4.9.5Z"/><path class="cls-3" d="M26.9,31.3a2.2,2.2,0,1,1-2.2,2.2,2.2,2.2,0,0,1,2.2-2.2Zm8.8,0a2.2,2.2,0,1,1-2.2,2.2,2.2,2.2,0,0,1,2.2-2.2Zm-17.6,0a2.2,2.2,0,1,1-2.2,2.2,2.2,2.2,0,0,1,2.2-2.2Zm11-8.8H24.7v8.8h4.4V22.5Zm8.8,0H33.5v8.8h4.4V22.5Zm-17.6,0H15.9v8.8h4.4V22.5Z"/><path class="cls-4" d="M26.35,44.5h1.1m3.85,0H48.9V13.7H4.9V44.5H22.5m22-15.4a11,11,0,0,0-11-11H20.3a11,11,0,0,0-11,11h0a11,11,0,0,0,11,11H33.5a11,11,0,0,0,11-11ZM26.9,31.3a2.2,2.2,0,1,1-2.2,2.2,2.2,2.2,0,0,1,2.2-2.2Zm8.8,0a2.2,2.2,0,1,1-2.2,2.2,2.2,2.2,0,0,1,2.2-2.2Zm-17.6,0a2.2,2.2,0,1,1-2.2,2.2,2.2,2.2,0,0,1,2.2-2.2ZM4.9.5A4.4,4.4,0,1,1,.5,4.9,4.4,4.4,0,0,1,4.9.5ZM9.3,7.83l8.8,5.87M48.9.5a4.4,4.4,0,1,0,4.4,4.4A4.4,4.4,0,0,0,48.9.5ZM44.5,7.83,35.7,13.7m-6.6,8.8H24.7v8.8h4.4V22.5Zm8.8,0H33.5v8.8h4.4V22.5Zm-17.6,0H15.9v8.8h4.4V22.5Z"/></g></svg>' },
    { id: "color3", label: "Étoile", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 53.8 53.8"><defs><style>.cls-1{fill:#dd636e;}.cls-1,.cls-2,.cls-3{fill-rule:evenodd;}.cls-2{fill:#def6ff;}.cls-3{fill:#aaf4a5;}.cls-4{fill:none;stroke:#000;stroke-linecap:round;stroke-linejoin:round;}</style></defs><g><path class="cls-1" d="M30.72.78a26.43,26.43,0,0,0-7.64,0L21.83,5A22.41,22.41,0,0,0,15,7.86l-3.9-2.13a26.57,26.57,0,0,0-5.4,5.4L7.86,15A22.41,22.41,0,0,0,5,21.83L.78,23.08a26.43,26.43,0,0,0,0,7.64L5,32a22.47,22.47,0,0,0,2.82,6.81L5.73,42.67a26.37,26.37,0,0,0,5.4,5.41L15,45.94a22.16,22.16,0,0,0,6.8,2.82L23.08,53a26.43,26.43,0,0,0,7.64,0L32,48.76a22.22,22.22,0,0,0,6.81-2.82l3.89,2.14a26.17,26.17,0,0,0,5.41-5.41l-2.14-3.89A22.22,22.22,0,0,0,48.76,32L53,30.72a26.43,26.43,0,0,0,0-7.64l-4.27-1.25A22.16,22.16,0,0,0,45.94,15l2.14-3.9a26.37,26.37,0,0,0-5.41-5.4L38.78,7.86A22.47,22.47,0,0,0,32,5L30.72.78Z"/><path class="cls-2" d="M26.9,9.3A17.6,17.6,0,1,1,9.3,26.9,17.61,17.61,0,0,1,26.9,9.3Z"/><path class="cls-3" d="M37.9,22.5h-22V32.83c0,2.72,2.46,4.91,5.5,4.91h11a5.85,5.85,0,0,0,3.89-1.43,4.66,4.66,0,0,0,1.61-3.47V22.5Zm-11-7.28a2.2,2.2,0,1,1-2.2,2.2,2.2,2.2,0,0,1,2.2-2.2Z"/><path class="cls-4" d="M5,21.83.78,23.08a26.43,26.43,0,0,0,0,7.64L5,32a22.47,22.47,0,0,0,2.82,6.81L5.73,42.67a26.37,26.37,0,0,0,5.4,5.41L15,45.94a22.16,22.16,0,0,0,6.8,2.82L23.08,53a26.43,26.43,0,0,0,7.64,0L32,48.76a22.22,22.22,0,0,0,6.81-2.82l3.89,2.14a26.17,26.17,0,0,0,5.41-5.41l-2.14-3.89a22.54,22.54,0,0,0,1.61-3.08M48.76,32,53,30.72a26.43,26.43,0,0,0,0-7.64l-4.27-1.25A22.16,22.16,0,0,0,45.94,15l2.14-3.9a26.37,26.37,0,0,0-5.41-5.4L38.78,7.86A22.47,22.47,0,0,0,32,5L30.72.78a26.43,26.43,0,0,0-7.64,0L21.83,5A22.41,22.41,0,0,0,15,7.86l-3.9-2.13a26.57,26.57,0,0,0-5.4,5.4L7.86,15a22.37,22.37,0,0,0-1.6,3.07M26.9,9.3A17.6,17.6,0,1,1,9.3,26.9,17.61,17.61,0,0,1,26.9,9.3Zm11,13.2h-22V32.83c0,2.72,2.46,4.91,5.5,4.91h11a5.85,5.85,0,0,0,3.89-1.43,4.66,4.66,0,0,0,1.61-3.47V22.5ZM26.9,22v-2m0-4.85a2.2,2.2,0,1,1-2.2,2.2,2.2,2.2,0,0,1,2.2-2.2ZM21.32,26.9l2.47,1.63m8.69-1.63L30,28.53m.17,5.39H23.61"/></g></svg>' },
    { id: "color4", label: "Nuage", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 53.8 45"><defs><style>.cls-1{fill:#62acf6;}.cls-1,.cls-2,.cls-3{fill-rule:evenodd;}.cls-2{fill:#def6ff;}.cls-3{fill:#f4dd45;}.cls-4{fill:none;stroke:#000;stroke-linecap:round;stroke-linejoin:round;}</style></defs><g><path class="cls-1" d="M11.5,44.5A11,11,0,0,1,6.08,23.93a12.06,12.06,0,0,1,4.64-8.22,12.45,12.45,0,0,1-.08-1.5A13.71,13.71,0,0,1,38,13.35a7.91,7.91,0,0,1,1.63-.16,8.37,8.37,0,0,1,7.57,11.92A7.9,7.9,0,0,1,48.9,30a8.2,8.2,0,0,1-.17,1.66,6.6,6.6,0,0,1-2,12.88Z"/><path class="cls-2" d="M26.9,14.07A12.84,12.84,0,1,1,14.07,26.9,12.84,12.84,0,0,1,26.9,14.07Z"/><path class="cls-3" d="M34.6,26.9A2.57,2.57,0,0,0,32,24.33H21.77a2.57,2.57,0,0,0,0,5.14H32A2.57,2.57,0,0,0,34.6,26.9Zm5.6-1.42a3.24,3.24,0,0,0-1.14-6.28,3.07,3.07,0,0,0-1.1.2l2.24,6.08Zm-26.59,0a3.24,3.24,0,0,1,1.13-6.28,3.17,3.17,0,0,1,1.11.2l-2.24,6.08Z"/><path class="cls-4" d="M27.45,44.5h-1.1m-3.85,0h-11A11,11,0,0,1,6.08,23.93a12.06,12.06,0,0,1,4.64-8.22,12.45,12.45,0,0,1-.08-1.5A13.71,13.71,0,0,1,38,13.35a7.91,7.91,0,0,1,1.63-.16,8.37,8.37,0,0,1,7.57,11.92A7.9,7.9,0,0,1,48.9,30a8.2,8.2,0,0,1-.17,1.66,6.6,6.6,0,0,1-2,12.88H31.3M26.9,14.07A12.84,12.84,0,1,1,14.07,26.9,12.84,12.84,0,0,1,26.9,14.07Zm0-4.77v8.8m7.7,8.8A2.57,2.57,0,0,0,32,24.33H21.77a2.57,2.57,0,0,0,0,5.14H32A2.57,2.57,0,0,0,34.6,26.9Zm-21-1.42a3.24,3.24,0,0,1,1.13-6.28,3.17,3.17,0,0,1,1.11.2M40.2,25.48a3.24,3.24,0,0,0-1.14-6.28,3.07,3.07,0,0,0-1.1.2"/></g></svg>' },
    { id: "color5", label: "Smiley", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 53.8 45"><defs><style>.cls-1{fill:#f4dd45;}.cls-1,.cls-2,.cls-3,.cls-4{fill-rule:evenodd;}.cls-2{fill:#def6ff;}.cls-3{fill:#aaf4a5;}.cls-4{fill:#dd636e;}.cls-5{fill:none;stroke:#000;stroke-linecap:round;stroke-linejoin:round;}</style></defs><g><path class="cls-1" d="M26.9.5a22,22,0,1,1-22,22,22,22,0,0,1,22-22Z"/><path class="cls-2" d="M26.9,4.9A17.6,17.6,0,1,1,9.3,22.5,17.61,17.61,0,0,1,26.9,4.9Z"/><path class="cls-3" d="M4.11,20.06A5.56,5.56,0,0,1,6.06,9.3,5.65,5.65,0,0,1,8,9.63L4.11,20.06Zm45.58,0A5.56,5.56,0,0,0,47.75,9.3a5.66,5.66,0,0,0-1.9.33l3.84,10.43Z"/><path class="cls-4" d="M26.9,31.3a2.2,2.2,0,1,1-2.2,2.2,2.2,2.2,0,0,1,2.2-2.2Zm0-8.8a4.4,4.4,0,1,0-4.4-4.4H18.1a8.8,8.8,0,1,1,11,8.52V29.1H24.7V22.5Z"/><path class="cls-5" d="M15.13,3.91l.49-.3m3-1.49A21.79,21.79,0,0,1,26.9.5,22,22,0,1,1,12.37,6M26.9,4.9A17.6,17.6,0,1,1,9.3,22.5,17.61,17.61,0,0,1,26.9,4.9Zm0,26.4a2.2,2.2,0,1,1-2.2,2.2,2.2,2.2,0,0,1,2.2-2.2ZM4.11,20.06A5.56,5.56,0,0,1,6.06,9.3,5.65,5.65,0,0,1,8,9.63M49.69,20.06A5.56,5.56,0,0,0,47.75,9.3a5.66,5.66,0,0,0-1.9.33M26.9,22.5a4.4,4.4,0,1,0-4.4-4.4H18.1a8.8,8.8,0,1,1,11,8.52V29.1H24.7V22.5Z"/></g></svg>' },
    { id: "color6", label: "Bulles", svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 53.8 45"><defs><style>.cls-1{fill:#f4dd45;}.cls-1,.cls-3,.cls-4{fill-rule:evenodd;}.cls-2{fill:none;stroke:#000;stroke-linecap:round;stroke-linejoin:round;}.cls-3{fill:#def6ff;}.cls-4{fill:#62acf6;}</style></defs><g><path class="cls-1" d="M48.9,9.3H4.9V33.5a11,11,0,0,0,11,11h22a11,11,0,0,0,11-11V9.3Z"/><path class="cls-2" d="M26.9,9.3V4.9M40.1,20.3l-4.4,2.2,4.4,2.2"/><path class="cls-3" d="M44.5,18.1a2.2,2.2,0,0,0-2.2-2.2H11.5a2.21,2.21,0,0,0-2.2,2.2V35.7a2.2,2.2,0,0,0,2.2,2.2H42.3a2.19,2.19,0,0,0,2.2-2.2V18.1Z"/><path class="cls-4" d="M35.7,29.1H18.1a4.4,4.4,0,0,0,4.4,4.4h8.8a4.4,4.4,0,0,0,4.4-4.4ZM4.9,22.5a4.4,4.4,0,0,0,0,8.8V22.5Zm44,0a4.4,4.4,0,0,1,0,8.8V22.5Zm-33-2.2a2.2,2.2,0,1,1-2.2,2.2,2.2,2.2,0,0,1,2.2-2.2ZM26.9.5a2.2,2.2,0,1,1-2.2,2.2A2.2,2.2,0,0,1,26.9.5Z"/><path class="cls-2" d="M26.35,44.5h1.1m3.85,0h6.61a11,11,0,0,0,11-11V9.3H4.9V33.5a11,11,0,0,0,11,11h6.6M4.9,22.5a4.4,4.4,0,0,0,0,8.8V22.5Zm44,0a4.4,4.4,0,0,1,0,8.8V22.5ZM26.9.5a2.2,2.2,0,1,1-2.2,2.2A2.2,2.2,0,0,1,26.9.5Zm0,8.8V4.9m-11,15.4a2.2,2.2,0,1,1-2.2,2.2,2.2,2.2,0,0,1,2.2-2.2Zm24.2,0-4.4,2.2,4.4,2.2m-4.4,4.4H18.1a4.4,4.4,0,0,0,4.4,4.4h8.8a4.4,4.4,0,0,0,4.4-4.4Zm8.8-11a2.2,2.2,0,0,0-2.2-2.2H11.5a2.21,2.21,0,0,0-2.2,2.2V35.7a2.2,2.2,0,0,0,2.2,2.2H42.3a2.19,2.19,0,0,0,2.2-2.2V18.1Z"/></g></svg>' },
  ];
  const avatarGridCols = avatarOptions.length > 6 ? "grid-cols-4" : "grid-cols-3";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Mon widget</h1>
      <p className="text-gray-500 mb-6">Configurez l&apos;apparence et récupérez le code à installer sur votre site.</p>

      {clientSlug && (
        <div className="bg-green-50/80 backdrop-blur-sm border border-green-200/60 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Eye size={16} className="text-green-600" />
            <p className="text-sm font-medium text-green-800">Code d&apos;intégration</p>
          </div>
          <code className="text-xs bg-white/90 px-4 py-2.5 rounded-xl border border-green-100 block break-all select-all font-mono">{embedCode()}</code>
          <p className="text-xs text-green-600 mt-2">Copiez ce script dans le &lt;head&gt; de votre site.</p>
        </div>
      )}

      <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-elevated p-6 max-w-lg">
        {!editMode ? (
          <div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm"><span className="text-gray-400 w-24">Titre :</span><span className="font-medium text-gray-900">{form.welcomeTitle}</span></div>
              <div className="flex items-center gap-2 text-sm"><span className="text-gray-400 w-24">Sous-titre :</span><span className="text-gray-600">{form.welcomeSub}</span></div>
              <div className="flex items-center gap-2 text-sm"><span className="text-gray-400 w-24">Position :</span><span className="text-gray-900">{form.position === "right" ? "Droite" : "Gauche"}</span></div>
              <div className="flex items-center gap-2 text-sm"><span className="text-gray-400 w-24">Marges :</span><span className="text-gray-900">bas {form.marginBottom}px</span></div>
              <div className="flex items-center gap-2 text-sm"><span className="text-gray-400 w-24">Proactif :</span><span className={form.proactiveEnabled ? "text-green-600 font-medium" : "text-gray-400"}>{form.proactiveEnabled ? "Activé" : "Désactivé"}</span></div>
            </div>
            <button onClick={() => setEditMode(true)} className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:from-purple-700 hover:to-purple-600 transition-all shadow-lg shadow-purple-200">
              Modifier
            </button>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            {saveError && <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{saveError}</p>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Titre de bienvenue</label>
              <input value={form.welcomeTitle} onChange={(e) => setForm({ ...form, welcomeTitle: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sous-titre</label>
              <input value={form.welcomeSub} onChange={(e) => setForm({ ...form, welcomeSub: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Icône avatar</label>
              <div className={"grid " + avatarGridCols + " gap-2"}>
                {avatarOptions.map((a) => (
                  <button key={a.id} type="button" onClick={() => setForm({ ...form, avatarIcon: a.id })}
                    className={"flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all " + (form.avatarIcon === a.id ? "border-purple-500 bg-purple-50 shadow-sm" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50")}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white" dangerouslySetInnerHTML={{ __html: a.svg }} />
                    <span className="text-xs font-medium text-gray-600">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Position</label>
                <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none">
                  <option value="right">Droite</option>
                  <option value="left">Gauche</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Marge bas (px)</label>
                <input type="number" value={form.marginBottom} onChange={(e) => setForm({ ...form, marginBottom: +e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Marge {form.position === "right" ? "droite" : "gauche"} (px)</label>
                <input type="number" value={form.marginRight} onChange={(e) => setForm({ ...form, marginRight: +e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
              </div>
            </div>

            <label className="flex items-center gap-2.5 py-1">
              <input type="checkbox" checked={form.showBrand} onChange={(e) => setForm({ ...form, showBrand: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
              <span className="text-sm text-gray-700">Afficher &quot;Propulsé par Nova&quot;</span>
            </label>

            <div className="border-t border-gray-100 pt-5 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <Bell size={16} className="text-purple-600" />
                <h3 className="font-semibold text-sm text-gray-800">Engagement visiteur</h3>
              </div>

              <label className="flex items-center gap-2.5 mb-4">
                <input type="checkbox" checked={form.proactiveEnabled} onChange={(e) => setForm({ ...form, proactiveEnabled: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                <span className="text-sm text-gray-700 font-medium">Activer le mode proactif</span>
              </label>

              {form.proactiveEnabled && (
                <div className="space-y-4 pl-6 border-l-2 border-purple-100">
                  <div className="flex items-center gap-3">
                    <Timer size={14} className="text-gray-400" />
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-1">Ouverture automatique (secondes)</label>
                      <input type="number" min="0" max="60" value={form.autoOpenDelay} onChange={(e) => setForm({ ...form, autoOpenDelay: +e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <ScrollText size={14} className="text-gray-400" />
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-1">Déclencheur au scroll (%)</label>
                      <input type="number" min="0" max="100" value={form.scrollTrigger} onChange={(e) => setForm({ ...form, scrollTrigger: +e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                      <p className="text-xs text-gray-400 mt-1">0 = désactivé</p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2.5">
                    <MousePointer2 size={14} className="text-gray-400" />
                    <input type="checkbox" checked={form.exitIntent} onChange={(e) => setForm({ ...form, exitIntent: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                    <span className="text-sm text-gray-700">Détecter la sortie de page</span>
                  </label>

                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageCircle size={14} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Notification & message</span>
                    </div>

                    <label className="flex items-center gap-2.5 mb-3">
                      <input type="checkbox" checked={form.showNotification} onChange={(e) => setForm({ ...form, showNotification: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                      <span className="text-sm text-gray-700">Afficher une notification</span>
                    </label>

                    {form.showNotification && (
                      <div className="mb-3">
                        <label className="block text-sm text-gray-600 mb-1">Texte de la notification</label>
                        <input value={form.notificationText} onChange={(e) => setForm({ ...form, notificationText: e.target.value })}
                          placeholder="Une question ?"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                      </div>
                    )}

                    <label className="flex items-center gap-2.5">
                      <input type="checkbox" checked={form.sendGreeting} onChange={(e) => setForm({ ...form, sendGreeting: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                      <span className="text-sm text-gray-700">Envoyer un message de bienvenue à l&apos;ouverture</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:from-purple-700 hover:to-purple-600 transition-all disabled:opacity-50 shadow-lg shadow-purple-200">
                <Save size={16} /> {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button type="button" onClick={() => setEditMode(false)} className="text-gray-500 hover:text-gray-700 text-sm px-4">Annuler</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
