import { cookies } from "next/headers";
import crypto from "node:crypto";

const COOKIE_NAME = "admin_session";
const SECRET = process.env.SESSION_SECRET ?? "change-me-in-production";

export function signSession(payload: { email: string; exp: number }): string {
  const data = JSON.stringify(payload);
  const sig = crypto.createHmac("sha256", SECRET).update(data).digest("hex");
  return Buffer.from(data, "utf8").toString("base64url") + "." + sig;
}

export function verifySession(token: string): { email: string } | null {
  const [raw, sig] = token.split(".");
  if (!raw || !sig) return null;
  try {
    const data = Buffer.from(raw, "base64url").toString("utf8");
    const payload = JSON.parse(data) as { email: string; exp: number };
    if (payload.exp < Date.now()) return null;
    const expected = crypto.createHmac("sha256", SECRET).update(data).digest("hex");
    if (sig !== expected) return null;
    return { email: payload.email };
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<{ email: string } | null> {
  const c = await cookies();
  const token = c.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export function createSessionToken(email: string): string {
  return signSession({
    email,
    exp: Date.now() + 24 * 60 * 60 * 1000,
  });
}

export { COOKIE_NAME };
