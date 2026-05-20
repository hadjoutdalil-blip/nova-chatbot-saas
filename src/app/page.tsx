import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white text-sm font-bold">N</div>
            <span className="font-bold text-lg">Nova Chatbot</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Connexion</Link>
            <Link href="/login" className="text-sm bg-purple-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-purple-700 transition">
              Essai gratuit
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-gray-900 max-w-4xl mx-auto leading-tight">
          Un chatbot IA intelligent pour{" "}
          <span className="bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-transparent">chaque client</span>
        </h1>
        <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Nova Chatbot est une solution SaaS multi-tenant qui combine base de connaissances et IA générative
          pour offrir un support client instantané et personnalisé.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/login" className="bg-purple-600 text-white px-8 py-3 rounded-xl font-semibold text-lg hover:bg-purple-700 shadow-lg shadow-purple-200 transition">
            Démarrer l&apos;essai gratuit
          </Link>
          <a href="#features" className="border border-gray-300 text-gray-700 px-8 py-3 rounded-xl font-semibold text-lg hover:bg-gray-50 transition">
            En savoir plus
          </a>
        </div>
      </section>

      <section id="features" className="border-t border-gray-100 bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Tout ce dont vous avez besoin</h2>
          <p className="text-gray-500 text-center mb-14 max-w-xl mx-auto">
            Une plateforme complète pour déployer et gérer des chatbots intelligents pour vos clients.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "👥",
                title: "Multi-tenant",
                desc: "Gérez des centaines de clients depuis une seule interface. Chaque client a son propre chatbot, sa base de connaissances et sa configuration.",
              },
              {
                icon: "🧠",
                title: "Base de connaissances",
                desc: "Créez et gérez une base de connaissances par client. Le chatbot répond instantanément aux questions fréquentes avec précision.",
              },
              {
                icon: "⚡",
                title: "IA générative",
                desc: "Propulsé par Groq et les modèles Llama. L'IA comprend le contexte et répond intelligemment quand la KB ne suffit pas.",
              },
              {
                icon: "🎨",
                title: "Widget personnalisable",
                desc: "Un widget JavaScript à intégrer en une ligne de code. Personnalisez les couleurs, la position et les messages de bienvenue.",
              },
              {
                icon: "📊",
                title: "Analytiques",
                desc: "Suivez les conversations, le taux de réponse de la KB et l'engagement utilisateur en temps réel.",
              },
              {
                icon: "🔌",
                title: "Intégration simple",
                desc: "Un script à copier-coller dans votre site. Aucune installation complexe, aucun serveur à gérer.",
              },
            ].map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Comment ça marche</h2>
          <p className="text-gray-500 text-center mb-14 max-w-xl mx-auto">
            Trois étapes pour déployer un chatbot intelligent chez vos clients.
          </p>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { n: "1", title: "Créez un client", desc: "Ajoutez un client, configurez son modèle IA et sa clé API. Tout se fait depuis votre tableau de bord." },
              { n: "2", title: "Remplissez la KB", desc: "Ajoutez des paires question-réponse dans la base de connaissances. Le chatbot y répondra automatiquement." },
              { n: "3", title: "Intégrez le widget", desc: "Copiez le script généré et collez-le sur le site de votre client. Le chatbot est opérationnel immédiatement." },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-2xl font-bold mx-auto mb-6">{s.n}</div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-purple-600 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Prêt à transformer votre support client ?</h2>
          <p className="text-purple-200 mb-10 text-lg">
            Rejoignez les entreprises qui font confiance à Nova Chatbot.
          </p>
          <Link href="/login" className="inline-block bg-white text-purple-600 px-10 py-4 rounded-xl font-bold text-lg hover:bg-purple-50 shadow-xl transition">
            Commencer gratuitement
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-gray-400">
          <span>&copy; {new Date().getFullYear()} Nova Chatbot. Tous droits réservés.</span>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-gray-600">Connexion</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
