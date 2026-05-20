import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const clientId = randomUUID();
const userId = randomUUID();

db.write("clients", [
  {
    id: clientId,
    name: "CETIM Algérie",
    slug: "cetim",
    plan: "support",
    subdomain: "cetim",
    logo: "",
    primaryColor: "#7c3aed",
    apiKey: "",
    aiModel: "llama-3.1-8b-instant",
    aiProvider: "groq",
    kbThreshold: 60,
    relanceActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]);

db.write("users", [
  {
    id: userId,
    email: "admin@nova.dz",
    password: bcrypt.hashSync("admin123", 10),
    name: "Admin Nova",
    role: "admin",
    clientId,
  },
]);

db.write("widget_configs", [
  {
    id: randomUUID(),
    welcomeTitle: "Bienvenue chez CETIM",
    welcomeSub: "Je combine une base de connaissances et une IA.",
    showBrand: true,
    position: "right",
    marginBottom: 20,
    marginRight: 20,
    avatarIcon: "robot",
    clientId,
  },
]);

db.write("kb_entries", [
  {
    id: randomUUID(),
    question: "Quels sont vos horaires d'ouverture ?",
    answer: "Nous sommes ouverts du lundi au vendredi de 8h30 à 18h00 et le samedi de 9h00 à 12h00.",
    category: "Horaires",
    keywords: "horaires, ouverture, fermeture",
    clientId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: randomUUID(),
    question: "Comment créer un compte ?",
    answer: "Rendez-vous sur notre page d'inscription, renseignez votre email et créez un mot de passe.",
    category: "Compte",
    keywords: "création, compte, inscription",
    clientId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: randomUUID(),
    question: "J'ai oublié mon mot de passe",
    answer: "Cliquez sur 'Mot de passe oublié' sur la page de connexion. Vous recevrez un email avec un lien de réinitialisation.",
    category: "Compte",
    keywords: "mot de passe, oubli, réinitialisation",
    clientId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: randomUUID(),
    question: "Comment résilier mon abonnement ?",
    answer: "Vous pouvez résilier depuis votre espace client > Abonnement > Résilier.",
    category: "Abonnement",
    keywords: "résiliation, abonnement, annuler",
    clientId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: randomUUID(),
    question: "Puis-je changer de formule ?",
    answer: "Oui, vous pouvez changer de formule à tout moment depuis votre espace client.",
    category: "Abonnement",
    keywords: "formule, changement, upgrade",
    clientId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]);

db.write("conversations", []);

console.log("Seed done: client CETIM + admin user created");
