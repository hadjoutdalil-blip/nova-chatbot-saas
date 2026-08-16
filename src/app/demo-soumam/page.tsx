"use client";

import Script from "next/script";
import Link from "next/link";

const PRIMARY = "#0da1fd";

const PRODUCTS = [
  { icon: "🍦", name: "Skyr", desc: "Spécialité lactée islandaise, 0% MG, riche en protéines — nature, fraise, ananas-passion." },
  { icon: "🥛", name: "Grec", desc: "Texture crémeuse et onctueuse à base de crème fraîche, sans arôme ni colorant artificiel." },
  { icon: "🌾", name: "Céréalo", desc: "Spécialité laitière à boire à base de céréales et de miel, riche en fibres." },
  { icon: "🧀", name: "Délices", desc: "Fromage fondu à tartiner à base de cheddar et de beurre, en 8, 16 et 24 portions." },
  { icon: "🥛", name: "Lait UHT", desc: "Entier, demi-écrémé, Vitamilk et Minceur — riche en calcium, plus de 2,8% MG." },
  { icon: "🍶", name: "Crème légère", desc: "Crème liquide UHT allégée à 12% MG, l'alliée de vos recettes salées et sucrées." },
  { icon: "🍮", name: "Lait gélifié", desc: "Crème dessert caramel et chocolat, un dessert lacté pour toute la famille." },
];

const FIGURES = [
  { value: "1993", label: "Année de fondation" },
  { value: "2000", label: "Emplois permanents" },
  { value: "51", label: "Lignes de production" },
  { value: "183", label: "Références produits" },
];

export default function SoumamDemoPage() {
  const openChat = () => {
    const b = document.getElementById("nb") as HTMLButtonElement | null;
    if (b) b.click();
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100" style={{ background: `${PRIMARY}08` }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ background: PRIMARY }}
            >
              S
            </div>
            <span className="font-bold text-lg" style={{ color: PRIMARY }}>Laiterie Soummam</span>
          </div>
          <button
            type="button"
            onClick={openChat}
            className="text-sm text-white px-5 py-2 rounded-lg font-medium transition hover:opacity-90"
            style={{ background: PRIMARY }}
          >
            Discuter avec le chatbot
          </button>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 max-w-3xl mx-auto leading-tight">
          Un assistant virtuel pour la <span style={{ color: PRIMARY }}>Laiterie Soummam</span>
        </h1>
        <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Une page de démonstration publique embarquant le chatbot Nova, alimenté par la base de
          connaissances Soummam : produits, histoire, collecte de lait, recettes… Posez-lui une question !
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={openChat}
            className="px-8 py-3 rounded-xl font-semibold text-lg text-white shadow-lg transition hover:opacity-90"
            style={{ background: PRIMARY, boxShadow: `${PRIMARY}44 0 10px 30px` }}
          >
            💬 Ouvrir le chatbot
          </button>
        </div>
      </section>

      <section className="border-t border-gray-100 bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-12">Soummam en chiffres</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {FIGURES.map((f, i) => (
              <div key={i} className="text-center bg-white rounded-2xl border p-8 shadow-sm">
                <p className="text-4xl font-extrabold" style={{ color: PRIMARY }}>{f.value}</p>
                <p className="mt-2 text-sm text-gray-500">{f.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-gray-100 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-3">La gamme Soummam</h2>
          <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
            Plus de 183 références réparties en 4 familles : yaourts et desserts, boissons lactées, lait UHT et fromages.
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {PRODUCTS.map((p, i) => (
              <div key={i} className="rounded-2xl border p-6 bg-white shadow-sm">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                  style={{ background: `${PRIMARY}14` }}
                >
                  {p.icon}
                </div>
                <h3 className="font-semibold text-lg mb-1">{p.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="bg-gradient-to-br py-16" style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY}cc)` }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Une question sur Soummam ?</h2>
          <p className="text-white/90 mb-8 text-lg">Demandez au chatbot : produits, histoire, recettes…</p>
          <button
            type="button"
            onClick={openChat}
            className="inline-block bg-white font-bold rounded-xl py-3 px-8 transition hover:bg-gray-50"
            style={{ color: PRIMARY }}
          >
            Démarrer la discussion
          </button>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} Laiterie Soummam — Démo propulsée par{" "}
            <Link href="/" className="hover:text-gray-600 underline">Nova Chatbot</Link>
          </p>
        </div>
      </footer>

      <Script src="/api/widget/SOUMMAM/embed" strategy="afterInteractive" />
    </div>
  );
}
