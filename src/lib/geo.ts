export interface GeoLocation {
  ip: string;
  country: string;
  city: string;
}

export function extractIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "127.0.0.1";
}

export async function lookupGeo(ip: string): Promise<GeoLocation> {
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return { ip, country: "", city: "" };
  }
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,query`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { ip, country: "", city: "" };
    const data = await res.json();
    if (data.status !== "success") return { ip, country: "", city: "" };
    return { ip, country: data.country || "", city: data.city || "" };
  } catch {
    return { ip, country: "", city: "" };
  }
}
