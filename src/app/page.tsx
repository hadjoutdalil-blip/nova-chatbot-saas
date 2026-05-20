import Link from "next/link";

const PLANS = [
  {
    id: "ecommerce",
    name: "Chatbot E-commerce",
    price: 299,
    period: "/mois",
    description: "Boostez vos ventes et automatisez le support client de votre boutique en ligne.",
    features: [
      "Questions sur les produits et le stock",
      "Suivi de commande et livraison",
      "Retours et remboursements",
      "Recommandations produits",
      "Catalogue jusqu'à 500 produits",
      "Disponible en 48h",
    ],
    color: "purple",
  },
  {
    id: "support",
    name: "Chatbot Support Client",
    price: 399,
    period: "/mois",
    description: "Automatisez votre service client avec une base de connaissances intelligente.",
    features: [
      "FAQ et base de connaissances illimitée",
      "Création de tickets automatique",
      "Transfert vers un humain si nécessaire",
      "Horaires et disponibilité",
      "Processus et procédures",
      "Disponible en 72h",
    ],
    color: "indigo",
    popular: true,
  },
  {
    id: "realestate",
    name: "Chatbot Immobilier",
    price: 499,
    period: "/mois",
    description: "Qualifiez vos leads et répondez aux questions de vos prospects 24h/24.",
    features: [
      "Recherche de biens par critères",
      "Visites et disponibilités",
      "Simulation de crédit",
      "Documents et procédures",
      "Qualification des leads",
      "Disponible en 72h",
    ],
    color: "blue",
  },
  {
    id: "custom",
    name: "Sur Mesure",
    price: null,
    period: "",
    description: "Un chatbot adapté à votre secteur d'activité spécifique.",
    features: [
      "Analyse de vos besoins",
      "Base de connaissances personnalisée",
      "Workflows et scénarios avancés",
      "Formation de l'IA sur vos données",
      "Intégration API sur mesure",
      "Livraison sous 5 à 7 jours",
    ],
    color: "gray",
    badge: "Nous contacter",
  },
];

const colorMap: Record<string, { bg: string; text: string; ring: string; dark: string; light: string }> = {
  purple: { bg: "bg-purple-600", text: "text-purple-600", ring: "ring-purple-500", dark: "hover:bg-purple-700", light: "bg-purple-50" },
  indigo: { bg: "bg-indigo-600", text: "text-indigo-600", ring: "ring-indigo-500", dark: "hover:bg-indigo-700", light: "bg-indigo-50" },
  blue: { bg: "bg-blue-600", text: "text-blue-600", ring: "ring-blue-500", dark: "hover:bg-blue-700", light: "bg-blue-50" },
  gray: { bg: "bg-gray-700", text: "text-gray-600", ring: "ring-gray-500", dark: "hover:bg-gray-800", light: "bg-gray-100" },
};

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
          Vendez des chatbots IA à vos clients{" "}
          <span className="bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-transparent">sans développer</span>
        </h1>
        <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Nova Chatbot est une plateforme SaaS multi-tenant qui vous permet de créer, gérer et déployer
          des chatbots intelligents pour vos clients. Chaque client reçoit son propre widget et son
          panneau d&apos;administration — le tout depuis une seule interface.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="#pricing" className="bg-purple-600 text-white px-8 py-3 rounded-xl font-semibold text-lg hover:bg-purple-700 shadow-lg shadow-purple-200 transition">
            Voir les offres
          </Link>
          <a href="#features" className="border border-gray-300 text-gray-700 px-8 py-3 rounded-xl font-semibold text-lg hover:bg-gray-50 transition">
            En savoir plus
          </a>
        </div>
      </section>

      <section id="pricing" className="border-t border-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Des packs prêts à l&apos;emploi</h2>
          <p className="text-gray-500 text-center mb-14 max-w-xl mx-auto">
            Choisissez le pack adapté à votre client. Nous livrons le chatbot clé en main en 48 à 72h.
          </p>
          <div className="grid md:grid-cols-4 gap-6">
            {PLANS.map((plan) => {
              const c = colorMap[plan.color];
              return (
                <div key={plan.id} className={`relative rounded-2xl border p-6 flex flex-col bg-white ${plan.popular ? "ring-2 ring-purple-500 shadow-lg" : "shadow-sm"}`}>
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                      Populaire
                    </span>
                  )}
                  <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mb-4 min-h-[40px]">{plan.description}</p>
                  <div className="mb-6">
                    {plan.price !== null ? (
                      <>
                        <span className="text-3xl font-bold">{plan.price}$</span>
                        <span className="text-gray-400 text-sm">{plan.period}</span>
                      </>
                    ) : (
                      <span className="text-xl font-semibold text-gray-400">{plan.badge}</span>
                    )}
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 mt-0.5 text-green-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/login"
                    className={`w-full text-center py-2.5 rounded-xl font-semibold text-sm text-white ${c.bg} ${c.dark} transition`}
                  >
                    {plan.price !== null ? "Commencer" : "Nous contacter"}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-gray-50 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1">
              <p className="text-purple-600 font-semibold text-sm tracking-wide uppercase">Cas client</p>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">CETIM Algérie</h2>
              <p className="text-gray-500 mt-4 leading-relaxed">
                CETIM Algérie utilise Nova Chatbot pour offrir un support client instantané sur son site.
                Le chatbot répond aux questions techniques grâce à sa base de connaissances, et
                transmet les demandes complexes à l&apos;équipe. Résultat : un taux de réponse
                immédiat de 70 % et une satisfaction client en hausse.
              </p>
              <div className="flex gap-8 mt-6">
                <div>
                  <p className="text-2xl font-bold text-gray-900">70 %</p>
                  <p className="text-sm text-gray-400">Réponses instantanées</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">24/7</p>
                  <p className="text-sm text-gray-400">Disponibilité</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">1</p>
                  <p className="text-sm text-gray-400">Ligne de code</p>
                </div>
              </div>
            </div>
            <div className="flex-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 w-full max-w-sm">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">C</div>
                <div>
                  <p className="font-semibold text-sm">CETIM Algérie</p>
                  <p className="text-xs text-gray-400">Support client</p>
                </div>
                <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">En ligne</span>
              </div>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-2xl rounded-bl-sm p-3 text-sm text-gray-700 max-w-[85%]">
                  Bonjour, comment puis-je vous aider ?
                </div>
                <div className="bg-purple-600 text-white rounded-2xl rounded-br-sm p-3 text-sm max-w-[85%] ml-auto">
                  Quels sont les délais de livraison pour l&apos;Algérie ?
                </div>
                <div className="bg-gray-50 rounded-2xl rounded-bl-sm p-3 text-sm text-gray-700 max-w-[85%]">
                  Les délais sont de 5 à 7 jours ouvrés. Souhaitez-vous suivre votre commande ?
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-gray-100 bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Ce que vous vendez à vos clients</h2>
          <p className="text-gray-500 text-center mb-14 max-w-xl mx-auto">
            Une solution clé en main que vous pouvez revendre à vos clients sans développement.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: "🛠️", title: "Administration complète", desc: "Chaque client a son propre panneau d'administration pour gérer sa base de connaissances, personnaliser son widget et suivre ses conversations." },
              { icon: "💬", title: "Widget intelligent", desc: "Un widget JavaScript à intégrer en une ligne de code. Base de connaissances + IA générative pour répondre automatiquement aux visiteurs." },
              { icon: "🎨", title: "Marque blanche", desc: "Personnalisez les couleurs, le logo, les messages et la position du widget. Le chatbot porte l'identité de votre client." },
              { icon: "🧠", title: "IA + base de connaissances", desc: "Le chatbot pioche d'abord dans la base de connaissances du client. Si aucune réponse n'est trouvée, l'IA prend le relais intelligemment." },
              { icon: "📊", title: "Tableau de bord analytics", desc: "Suivez les conversations, le taux de réponses automatiques, et l'engagement des visiteurs pour chaque client." },
              { icon: "🔌", title: "Intégration instantanée", desc: "Un script à copier-coller dans le site de votre client. Aucune installation serveur, aucun développeur nécessaire." },
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
            Créez un compte, ajoutez un client, intégrez le widget. C&apos;est tout.
          </p>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { n: "1", title: "Ajoutez un client", desc: "Créez un client dans votre tableau de bord. Configurez son modèle IA, sa couleur et son logo en quelques clics." },
              { n: "2", title: "Remplissez sa base de connaissances", desc: "Ajoutez les questions et réponses fréquentes de votre client. Le chatbot y répondra automatiquement, 24h/24." },
              { n: "3", title: "Intégrez le widget sur son site", desc: "Copiez le script généré et collez-le sur le site de votre client. Le chatbot est opérationnel immédiatement." },
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

      <section className="bg-gradient-to-br from-purple-600 to-indigo-600 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Prêt à proposer Nova Chatbot à vos clients ?</h2>
          <p className="text-purple-200 mb-2 text-lg">
            Créez votre compte gratuitement et commencez à déployer des chatbots intelligents en minutes.
          </p>
          <p className="text-purple-300 text-sm mb-10">
            Aucune carte bancaire requise. Accès à toutes les fonctionnalités pendant 14 jours.
          </p>
          <Link href="/login" className="inline-block bg-white text-purple-600 px-10 py-4 rounded-xl font-bold text-lg hover:bg-purple-50 shadow-xl transition">
            Créer mon compte gratuit
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
