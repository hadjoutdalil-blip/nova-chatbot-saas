import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: { userId: string; clientId: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: string; clientId: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

export async function findUserByEmail(email: string) {
  const users = await db.read<any>("users");
  return users.find((u) => u.email === email) || null;
}

export async function findClientBySlug(slug: string) {
  const clients = await db.read<any>("clients");
  return clients.find((c) => c.slug === slug) || null;
}
