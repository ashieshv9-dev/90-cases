import crypto from "node:crypto";
import { cookies } from "next/headers";

export const sessionCookieName = "ninety_cases_session";

const sessionMaxAgeSeconds = 60 * 60 * 24 * 30;

function getSecret() {
  return process.env.SESSION_SECRET || "90-cases-local-development-secret";
}

export function getAdminPin() {
  return process.env.ADMIN_PIN || "2026";
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function createSessionToken() {
  const expiresAt = Date.now() + sessionMaxAgeSeconds * 1000;
  const nonce = crypto.randomBytes(16).toString("hex");
  const payload = `${expiresAt}.${nonce}`;

  return `${payload}.${sign(payload)}`;
}

export function isValidSessionToken(token?: string) {
  if (!token) {
    return false;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return false;
  }

  const [expiresAt, nonce, signature] = parts;
  const payload = `${expiresAt}.${nonce}`;
  const expiryNumber = Number(expiresAt);

  if (!Number.isFinite(expiryNumber) || expiryNumber < Date.now()) {
    return false;
  }

  return safeEqual(sign(payload), signature);
}

export async function hasSession() {
  const cookieStore = await cookies();
  return isValidSessionToken(cookieStore.get(sessionCookieName)?.value);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    maxAge: sessionMaxAgeSeconds,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/"
  };
}
