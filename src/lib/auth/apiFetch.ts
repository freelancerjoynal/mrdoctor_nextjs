/**
 * Dashboard API fetch: plain fetch + forced login on 401.
 * The proxy already retries once via the refresh token; a 401 reaching
 * here means the session is dead (cookies already cleared server-side),
 * so send the user to /login instead of showing stale error states.
 */
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/login";
    await new Promise<never>(() => {});
  }
  return res;
}
