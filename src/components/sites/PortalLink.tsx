"use client";

import { useState } from "react";

/**
 * Portal card link with a loading overlay: on click (portal may take a
 * moment — cold start / subdomain hop) it shows a spinner + message like
 * "🩺 ডাক্তার দেখুন…" until the new page loads and unmounts this one.
 */
export function PortalLink({
  href,
  className,
  message,
  children,
}: {
  href: string;
  className?: string;
  message: string;
  children: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <>
      <a href={href} className={className} onClick={() => setBusy(true)}>
        {children}
      </a>
      {busy ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-xs rounded-3xl bg-white p-6 text-center shadow-2xl">
            <span
              aria-hidden
              className="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600"
            />
            <p className="mt-3 font-black text-slate-900">{message}</p>
            <p className="mt-1 text-xs font-bold text-slate-500">পোর্টাল খুলছে…</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
