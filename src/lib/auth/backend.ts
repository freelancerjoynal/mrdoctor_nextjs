const BACKEND_URL =
  process.env.BACKEND_URL ?? "http://localhost:8000";

export async function backendFetch(
  path: string,
  init: RequestInit & { accessToken?: string; refreshToken?: string } = {},
) {
  const { accessToken, refreshToken, headers, ...rest } = init;
  const cookieParts: string[] = [];
  if (accessToken) cookieParts.push(`accessToken=${accessToken}`);
  if (refreshToken) cookieParts.push(`refreshToken=${refreshToken}`);

  return fetch(`${BACKEND_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(cookieParts.length ? { Cookie: cookieParts.join("; ") } : {}),
      ...(headers ?? {}),
    },
    cache: "no-store",
  });
}
