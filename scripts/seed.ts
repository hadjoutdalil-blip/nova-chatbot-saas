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
    email: "admin@cetim.dz",
    password: bcrypt.hashSync("admin123", 10),
    name: "Admin CETIM",
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

db.write("kb_entries", []);
db.write("conversations", []);

console.log("Seed done: client CETIM + admin user created");
