import Link from "next/link";
import Script from "next/script";

const PLANS = [
  {
    id: "ecommerce",
    name: "E-commerce",
    desc: "Idéal pour les boutiques en ligne qui veulent automatiser le support et booster les ventes.",
    features: ["Réponses sur les produits et stocks", "Suivi de commandes et livraisons", "Gestion des retours et remboursements", "Recommandations produits", "Disponible en 48h"],
    color: "purple",
  },
  {
    id: "support",
    name: "Support Client",
    desc: "Pour les entreprises qui reçoivent beaucoup de questions fréquentes et veulent y répondre 24/7.",
    features: ["FAQ et base de connaissances illimitée", "Création de tickets automatique", "Transfert vers un humain si nécessaire", "Horaires et procédures", "Disponible en 72h"],
    color: "indigo",
    popular: true,
  },
  {
    id: "realestate",
    name: "Immobilier",
    desc: "Conçu pour les agences immobilières qui veulent qualifier leurs leads 24h/24.",
    features: ["Recherche de biens par critères", "Planification de visites", "Simulation de crédit", "Qualification des leads", "Disponible en 72h"],
    color: "blue",
  },
];

const colorMap: Record<string, string> = {
  purple: "bg-emerald-600 hover:bg-emerald-700",
  indigo: "bg-indigo-600 hover:bg-indigo-700",
  blue: "bg-blue-600 hover:bg-blue-700",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 no-underline text-gray-900">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-sm font-bold">N</div>
            <span className="font-bold text-lg">Nova Chatbot</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Connexion</Link>
            <a href="#pricing" className="text-sm bg-emerald-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-emerald-700 transition">
              Nos offres
            </a>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-gray-900 max-w-4xl mx-auto leading-tight">
          Un chatbot IA pour votre site web,{" "}
          <span className="bg-gradient-to-r from-emerald-600 to-indigo-500 bg-clip-text text-transparent">clé en main</span>
        </h1>
        <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Je crée et déploie votre chatbot intelligent avec une base de connaissances adaptée à votre métier.
          Vous recevez un widget à installer sur votre site et un tableau de bord pour tout gérer.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <a href="#pricing" className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-semibold text-lg hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition">
            Voir les formules
          </a>
          <a href="#how" className="border border-gray-300 text-gray-700 px-8 py-3 rounded-xl font-semibold text-lg hover:bg-gray-50 transition">
            Comment ça marche
          </a>
        </div>
      </section>

      <section id="pricing" className="border-t border-gray-100 bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">Des formules adaptées à votre activité</h2>
          <p className="text-gray-500 text-center mb-4 max-w-xl mx-auto">
            Choisissez un pack prêt à l&apos;emploi ou optez pour une solution sur mesure.
          </p>
          <div className="flex justify-center gap-3 mb-12">
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-full border">
              <span>✅</span> Widget + tableau de bord inclus
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-full border">
              <span>✅</span> Base de connaissances pré-remplie
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PLANS.map((plan) => (
              <div key={plan.id} className={`relative rounded-2xl border p-6 flex flex-col bg-white ${plan.popular ? "ring-2 ring-emerald-500 shadow-lg scale-105" : "shadow-sm"}`}>
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-semibold px-4 py-1 rounded-full whitespace-nowrap">
                    Le plus demandé
                  </span>
                )}
                <p className="text-sm text-emerald-600 font-semibold mb-1">Pack</p>
                <h3 className="font-bold text-xl mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-3xl font-bold">Compétitif</span>
                  <div className="mt-1 flex gap-2 text-xs text-gray-400">
                    <span className="bg-gray-100 px-2 py-0.5 rounded">Mensuel</span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded">Annuel</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 mt-0.5 text-green-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="mailto:contact@nova.dz?subject=Demande pack chatbot" className={`w-full text-center py-2.5 rounded-xl font-semibold text-sm text-white ${colorMap[plan.color]} transition`}>
                  Contactez-nous
                </a>
              </div>
            ))}
          </div>
          <div className="text-center mt-10 max-w-md mx-auto bg-white rounded-2xl border p-6 shadow-sm">
            <p className="text-gray-400 text-sm font-semibold mb-1">Pack</p>
            <h3 className="font-bold text-xl mb-1">Sur Mesure</h3>
            <p className="text-sm text-gray-500 mb-4">Vous avez un besoin spécifique ? Contactez-nous pour une solution adaptée à votre métier.</p>
            <a href="mailto:contact@nova.dz?subject=Demande chatbot sur mesure" className="inline-block bg-emerald-600 text-white px-8 py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition">
              Contactez-nous
            </a>
          </div>
        </div>
      </section>

      <section className="border-t border-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-gray-50 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1">
              <p className="text-emerald-600 font-semibold text-sm tracking-wide uppercase">Cas client</p>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">CETIM Algérie</h2>
              <p className="text-gray-500 mt-4 leading-relaxed">
                CETIM Algérie utilise son chatbot pour répondre instantanément aux questions de ses clients
                sur les délais, les commandes et les services. La base de connaissances couvre 70 % des demandes,
                et le reste est transmis à l&apos;équipe.
              </p>
              <div className="flex gap-8 mt-6">
                <div><p className="text-2xl font-bold text-gray-900">70 %</p><p className="text-sm text-gray-400">Réponses automatiques</p></div>
                <div><p className="text-2xl font-bold text-gray-900">24/7</p><p className="text-sm text-gray-400">Disponible</p></div>
                <div><p className="text-2xl font-bold text-gray-900">1</p><p className="text-sm text-gray-400">Ligne de code</p></div>
              </div>
            </div>
            <div className="flex-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 w-full max-w-sm">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">C</div>
                <div><p className="font-semibold text-sm">CETIM Algérie</p><p className="text-xs text-gray-400">Support client</p></div>
                <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">En ligne</span>
              </div>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-2xl rounded-bl-sm p-3 text-sm text-gray-700 max-w-[85%]">Bonjour, comment puis-je vous aider ?</div>
                <div className="bg-emerald-600 text-white rounded-2xl rounded-br-sm p-3 text-sm max-w-[85%] ml-auto">Quels sont les délais de livraison ?</div>
                <div className="bg-gray-50 rounded-2xl rounded-bl-sm p-3 text-sm text-gray-700 max-w-[85%]">Les délais sont de 5 à 7 jours ouvrés.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-14">Ce que vous obtenez</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: "💬", title: "Un widget sur votre site", desc: "Un chatbot élégant intégré en une ligne de code. Vos visiteurs peuvent poser leurs questions à tout moment." },
              { icon: "🛠️", title: "Votre tableau de bord", desc: "Un espace privé pour gérer votre base de connaissances, personnaliser le widget et suivre vos conversations." },
              { icon: "🧠", title: "Base de connaissances", desc: "Des réponses prêtes à l'emploi sur votre métier. Le chatbot répond automatiquement sans intervention humaine." },
              { icon: "🎨", title: "Personnalisation", desc: "Couleurs, logo, messages de bienvenue, position du widget : tout est adapté à votre identité visuelle." },
              { icon: "📊", title: "Statistiques", desc: "Suivez le nombre de conversations, les questions posées et l'efficacité de votre base de connaissances." },
              { icon: "⚡", title: "IA générative", desc: "Si la base de connaissances ne suffit pas, l'IA prend le relais pour répondre intelligemment aux questions." },
            ].map((f, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="border-t border-gray-100 bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-14">Comment ça se passe</h2>
          <div className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto">
            {[
              { n: "1", title: "Vous choisissez une formule", desc: "Pack e-commerce, support client, immobilier ou sur mesure. Je vous accompagne dans le choix." },
              { n: "2", title: "Je crée votre chatbot", desc: "Je configure la base de connaissances, l'IA et le widget. Vous recevez vos identifiants de connexion." },
              { n: "3", title: "Vous intégrez le widget", desc: "Collez le script sur votre site. Le chatbot est opérationnel et vous gérez tout depuis votre tableau de bord." },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl font-bold mx-auto mb-6">{s.n}</div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-emerald-600 to-indigo-600 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Prêt à équiper votre site d&apos;un chatbot intelligent ?</h2>
          <p className="text-emerald-200 mb-8 text-lg">Contactez-moi pour discuter de votre projet. Je vous réponds sous 24h.</p>
          <div className="flex items-center justify-center gap-4">
            <a href="mailto:contact@nova.dz" className="inline-block bg-white text-emerald-600 px-8 py-3 rounded-xl font-bold hover:bg-emerald-50 shadow-xl transition">
              Contactez-nous
            </a>
            <a href="#pricing" className="inline-block border border-white/30 text-white px-8 py-3 rounded-xl font-bold hover:bg-white/10 transition">
              Voir les packs
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-gray-400">
          <span>&copy; {new Date().getFullYear()} Nova Chatbot. Tous droits réservés.</span>
          <Link href="/login" className="hover:text-gray-600">Connexion</Link>
        </div>
      </footer>
      <Script src="/api/widget/NC/embed" strategy="afterInteractive" />
    </div>
  );
}
