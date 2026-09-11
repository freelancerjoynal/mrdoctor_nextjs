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
  let access = jar.get(ACCESS)?.value || undefined;
  const refresh = jar.get(REFRESH)?.value || undefined;
  if (!access && !refresh) return null;

  let payload = access ? decodeJwt(access) : null;
  if (!payload || isExpired(payload)) {
    if (!refresh) return null;
    const refreshed = await tryRefresh(refresh);
    if (!refreshed) return null;
    access = refreshed;
    payload = decodeJwt(access);
  }
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
    const jar = await cookies();
    jar.set(ACCESS, data.accessToken, {
      httpOnly: true,
      path: "/",
      maxAge: 15 * 60,
      sameSite: "lax",
    });
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
