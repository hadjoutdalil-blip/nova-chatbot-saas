import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.json({ error: "Google OAuth non configuré" }, { status: 500 });
  }

  const { idToken } = await req.json();
  if (!idToken) {
    return NextResponse.json({ error: "idToken requis" }, { status: 400 });
  }

  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
  if (!res.ok) {
    return NextResponse.json({ error: "Token invalide" }, { status: 401 });
  }

  const payload = await res.json();
  if (payload.aud !== GOOGLE_CLIENT_ID) {
    return NextResponse.json({ error: "Token non destiné à cette application" }, { status: 401 });
  }
  if (!payload.email) {
    return NextResponse.json({ error: "Email requis" }, { status: 401 });
  }

  return NextResponse.json({
    email: payload.email,
    name: payload.name || "",
    picture: payload.picture || "",
  });
}
