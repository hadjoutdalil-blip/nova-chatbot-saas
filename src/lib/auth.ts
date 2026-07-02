import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "./db";

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
  return prisma.user.findUnique({ where: { email } });
}

export async function findClientBySlug(slug: string) {
  return prisma.client.findUnique({ where: { slug } });
}
