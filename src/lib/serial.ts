/**
 * Serial (appointment) deep-link builder.
 * Canonical pattern: `https://mrdoctor.com.bd/d/{username}` → WhatsApp serial flow.
 * The Next route `/d/:username` resolves the doctor/hospital and
 * redirects into the WhatsApp serial flow (backend `/d/:username` kept
 * for backward compatibility).
 * `baseUrl` comes from WA_BOT_URL env; defaults to the apex short link.
 */
export function buildSerialUrl(baseUrl: string, username: string): string {
  const fallback = "https://mrdoctor.com.bd/d/";
  const base = (baseUrl || fallback).replace(/\/+$/, "");
  return `${base}/${encodeURIComponent(username.trim())}`;
}

/** Apex-relative short link — always `/d/<username>` on the main site. */
export function buildSerialPath(username: string): string {
  return `/d/${encodeURIComponent(username.trim())}`;
}

/**
 * Direct global-WhatsApp link carrying the doctor's own username,
 * same message format the backend `/d/:username` redirect sends so the
 * bot always knows which doctor the serial is for.
 */
export function buildWaHref(waNumber: string, username: string): string {
  const number = (waNumber || "15551967401").replace(/[^\d]/g, "");
  const text = encodeURIComponent(
    `ডাক্তার সাহেব কি আছেন?\n\n🩺✨🏥💊🏥✨🩺\n\n${username.trim()}`,
  );
  return `https://wa.me/${number}?text=${text}`;
}
