/**
 * Serial (appointment) deep-link builder.
 * Pattern: `{base}/{username}` → e.g. https://mrdoctor.mdjoynal.com/d/dr-nil-072
 * The backend `/d/:username` route resolves the doctor and
 * redirects into the WhatsApp serial flow.
 */
export function buildSerialUrl(baseUrl: string, username: string): string {
  const base = (baseUrl || "https://mrdoctor.mdjoynal.com/d/").replace(/\/+$/, "");
  return `${base}/${encodeURIComponent(username.trim())}`;
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
