// Uses only Web Crypto (crypto.subtle) so this works identically in the
// Edge runtime (middleware) and the Node runtime (route handlers).

export const SESSION_COOKIE = "silos_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET env var is not set");
  return secret;
}

async function hmac(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Buffer.from(sig).toString("hex");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(): Promise<string> {
  const issuedAt = Date.now().toString();
  const sig = await hmac(issuedAt, getSecret());
  return `${issuedAt}.${sig}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [issuedAt, sig] = token.split(".");
  if (!issuedAt || !sig) return false;
  const age = Date.now() - Number(issuedAt);
  if (!Number.isFinite(age) || age < 0 || age > SESSION_MAX_AGE_SECONDS * 1000) return false;
  const expected = await hmac(issuedAt, getSecret());
  return timingSafeEqual(expected, sig);
}

export async function checkPassword(candidate: string): Promise<boolean> {
  const expected = process.env.APP_PASSWORD;
  if (!expected) throw new Error("APP_PASSWORD env var is not set");
  // Compare HMAC digests (fixed length) rather than raw strings so the
  // comparison itself doesn't leak the password's length via early exit.
  const secret = getSecret();
  const [a, b] = await Promise.all([hmac(candidate, secret), hmac(expected, secret)]);
  return timingSafeEqual(a, b);
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};

export async function checkImportSecret(header: string | null): Promise<boolean> {
  const expected = process.env.IMPORT_SECRET;
  if (!expected) throw new Error("IMPORT_SECRET env var is not set");
  if (!header) return false;
  const match = header.match(/^Bearer\s+(.+)$/i);
  const token = match ? match[1] : header;
  const secret = getSecret();
  const [a, b] = await Promise.all([hmac(token, secret), hmac(expected, secret)]);
  return timingSafeEqual(a, b);
}
