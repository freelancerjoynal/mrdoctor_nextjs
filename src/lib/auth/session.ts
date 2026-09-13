import { cookies } from "next/headers";
import { backendFetch } from "./backend";
import { decodeJwt, isExpired } from "./jwt";
import type { Session, UserProfile } from "./types";

const ACCESS = "accessToken";
const REFRESH = "refreshToken";

/** Read session from httpOnly cookies. Refreshes access token when expired. */
export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  // Empty-string cookies (leftover from clearing) count as missing.
  const access = jar.get(ACCESS)?.value || undefined;
  const refresh = jar.get(REFRESH)?.value || undefined;
  if (!access && !refresh) return null;

  // The middleware already refreshes the cookie on the way in, so a live
  // access token is the common case. Only fall back to a one-off backend
  // refresh for the value itself — cookie writes are owned by middleware
  // and route handlers (writing here throws inside Server Components).
  let payload = access ? decodeJwt(access) : null;
  if (payload && !isExpired(payload)) {
    return { userId: payload.userId, role: payload.role };
  }
  if (!refresh) return null;
  const fresh = await tryRefresh(refresh);
  if (!fresh) return null;
  payload = decodeJwt(fresh);
  if (!payload) return null;
  return { userId: payload.userId, role: payload.role };
}

async function tryRefresh(refreshToken: string): Promise<string | null> {
  try {
    const res = await backendFetch("/api/auth/refresh", {
      method: "POST",
      refreshToken,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { accessToken?: string };
    if (!data.accessToken) return null;
    return data.accessToken;
  } catch {
    return null;
  }
}

/** Full user object for role-based UI. Falls back to JWT-only session. */
export async function getProfile(): Promise<{
  session: Session;
  profile: UserProfile | null;
} | null> {
  const session = await getSession();
  if (!session) return null;
  const jar = await cookies();
  const access = jar.get(ACCESS)?.value || undefined;
  if (!access) return { session, profile: null };
  try {
    const res = await backendFetch("/api/users/profile", { accessToken: access });
    if (!res.ok) return { session, profile: null };
    const data = (await res.json()) as {
      profile?: UserProfile;
      user?: UserProfile;
    };
    return { session, profile: data.profile ?? data.user ?? null };
  } catch {
    return { session, profile: null };
  }
}
