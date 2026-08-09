"use client";

import Script from "next/script";
import Link from "next/link";

export function DemoClient({ slug, name, primary, logo }: { slug: string; name: string; primary: string; logo: string }) {
  const openChat = () => {
    const b = document.getElementById("nb") as HTMLButtonElement | null;
    if (b) b.click();
  };

  return (
    <div className="min-h-screen bg-white" style={{ ["--demo-primary" as any]: primary }}>
      <header className="border-b border-gray-100" style={{ background: `${primary}08` }}>
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                style={{ background: primary }}
              >
                {name.charAt(0)}
              </div>
            )}
            <span className="font-bold text-lg" style={{ color: primary }}>{name}</span>
          </div>
          <a
            href="#contact"
            className="text-sm text-white px-5 py-2 rounded-lg font-medium transition hover:opacity-90"
            style={{ background: primary }}
          >
            Nous contacter
          </a>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 max-w-3xl mx-auto leading-tight">
          {name} — page de démonstration du chatbot
        </h1>
        <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Ceci est une page de démo publique (sans authentification) qui embarque le widget Nova Chatbot.
          Cliquez sur le bouton flottant en bas de l&apos;écran pour discuter avec le chatbot {slug}.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={openChat}
            className="px-8 py-3 rounded-xl font-semibold text-lg text-white shadow-lg transition hover:opacity-90"
            style={{ background: primary, boxShadow: `${primary}44 0 10px 30px` }}
          >
            Ouvrir le chatbot
          </button>
        </div>
      </section>

      <section className="border-t border-gray-100 bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-12">
            Pourquoi intégrer un chatbot ?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: "💬", title: "24/7", desc: "Répond à vos visiteurs à toute heure, sans attente." },
              { icon: "📚", title: "Base de connaissances", desc: "Des réponses préparées sur votre activité, instantanées." },
              { icon: "🧠", title: "IA + RAG", desc: "L'IA reformule et la recherche documentaire source les réponses." },
            ].map((f, i) => (
              <div key={i} className="text-center bg-white rounded-2xl border p-6 shadow-sm">
                <div className="text-4xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-lg mb-1">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="bg-gradient-to-br py-16" style={{ background: `linear-gradient(135deg, ${primary}, ${primary}cc)` }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Une question ?</h2>
          <p className="text-white/90 mb-8 text-lg">Testez le chatbot qui répond pour vous.</p>
          <button
            type="button"
            onClick={openChat}
            className="inline-block bg-white font-bold rounded-xl py-3 px-8 transition hover:bg-gray-50"
            style={{ color: primary }}
          >
            Démarrer la discussion
          </button>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-5xl mx-auto px-6 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} {name} — Propulsé par{" "}
            <Link href="/" className="hover:text-gray-600 underline">Nova Chatbot</Link>
          </p>
        </div>
      </footer>

      <Script src={`/api/widget/${slug}/embed`} strategy="afterInteractive" />
    </div>
  );
}