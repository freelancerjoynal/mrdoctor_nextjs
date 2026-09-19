"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { LogoutButton } from "@/components/auth/LogoutButton";

/**
 * Client shell for the /admin section: fixed sidebar on desktop,
 * drawer + topbar on mobile. Server layout guards the role and
 * passes the display name down.
 */
export function AdminShell({
  name,
  roleLabel,
  children,
}: {
  name: string;
  roleLabel: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto bg-white shadow-2xl">
            <Sidebar onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="flex items-center gap-2 px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="মেনু খুলুন"
            >
              ☰
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black tracking-tight text-slate-900 sm:text-base">
                {name}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {roleLabel}
              </p>
            </div>
            <div className="hidden sm:block">
              <LogoutButton />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
