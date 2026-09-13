"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buildPortalUrl } from "@/lib/portal";

/**
 * Dashboard footer — full-width solid bar with essential links + powered-by line.
 * The public-profile link points at the owner's subdomain portal
 * (`<username>.domain.com` for doctors, `<slug>.domain.com` for hospitals),
 * resolved from the current host so it works on localhost and production.
 *
 * The absolute URL needs `window.location.host`, which doesn't exist during
 * SSR — so the first render uses the `/s/<sub>` path (exactly what the server
 * renders) and upgrades to the subdomain URL after mount. This keeps server
 * and client HTML identical and avoids a hydration mismatch.
 */
export function DashboardFooter({
  portalSubdomain,
  portalKind,
}: {
  /** Doctor username or hospital slug — null when the role has no public portal. */
  portalSubdomain: string | null;
  /** Which public portal the link should open. */
  portalKind: "doctor" | "hospital" | null;
}) {
  // SSR-safe: initial value matches the server render (`/s/<sub>` path,
  // since the server has no window.host); upgraded after mount.
  const serverSafeUrl = portalSubdomain
    ? `/s/${encodeURIComponent(portalSubdomain.trim().toLowerCase())}`
    : null;
  const [portalUrl, setPortalUrl] = useState<string | null>(serverSafeUrl);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional post-hydration upgrade to the subdomain URL
    if (portalSubdomain) setPortalUrl(buildPortalUrl(portalSubdomain));
  }, [portalSubdomain]);
  const portalLabel =
    portalKind === "hospital" ? "🏥 হাসপাতাল প্রোফাইল দেখুন" : "🩺 ডাক্তার প্রোফাইল দেখুন";

  return (
    <footer className="w-full bg-slate-900 text-white">
      <div className="px-4 py-6 sm:px-6 sm:py-8">
        <nav
          aria-label="ফুটার"
          className="flex flex-wrap items-center justify-center gap-2 text-sm font-bold"
        >
          <Link
            href="/dashboard"
            className="rounded-full bg-white/10 px-4 py-2 text-white transition hover:bg-white/20"
          >
            🏠 ড্যাশবোর্ড
          </Link>
          {portalUrl && portalKind && (
            <a
              href={portalUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-emerald-500 px-4 py-2 text-white shadow transition hover:bg-emerald-400"
            >
              {portalLabel} ↗
            </a>
          )}
          <a
            href="https://mrdoctor.com.bd"
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-white/10 px-4 py-2 text-white transition hover:bg-white/20"
          >
            🌐 mrdoctor.com.bd
          </a>
        </nav>
        <p className="mt-4 border-t border-white/10 pt-4 text-center text-xs font-semibold text-white/70 sm:text-sm">
          Powered by{" "}
          <a
            href="https://mrdoctor.com.bd"
            target="_blank"
            rel="noreferrer"
            className="font-black text-white hover:underline"
          >
            mrdoctor.com.bd
          </a>
        </p>
      </div>
    </footer>
  );
}
