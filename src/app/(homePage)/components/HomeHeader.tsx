"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LocationPopup } from "@/components/location/LocationPopup";
import { useHideOnScroll } from "@/components/ui/useHideOnScroll";

const MENU_LINKS = [
  { href: "#areas", label: "📍 এলাকা খুঁজুন" },
  { href: "#how", label: "❓ কীভাবে কাজ করে" },
  { href: "#software", label: "🖥️ ফ্রি সফটওয়্যার" },
];

export function HomeHeader() {
  const [locOpen, setLocOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { hidden, scrolled } = useHideOnScroll();

  function scrollToSection(href: string) {
    setMenuOpen(false);
    requestAnimationFrame(() => {
      setTimeout(() => {
        document.querySelector(href)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    });
  }

  return (
    <header
      className={`header-enter sticky top-0 z-40 bg-white/95 backdrop-blur transition-all duration-300 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      } ${
        scrolled
          ? "shadow-[0_16px_44px_-12px_rgba(180,130,20,0.55)]"
          : "shadow-[0_8px_28px_-14px_rgba(180,130,20,0.45)]"
      }`}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-1.5 px-4 py-1.5 sm:px-6 sm:py-2">
        <Link href="/" className="flex items-center" aria-label="মিস্টার ডাক্তার">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-main.png"
            alt="মিস্টার ডাক্তার"
            width={200}
            className="h-auto w-[150px] object-contain sm:w-[200px]"
          />
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/#areas"
            className="hidden rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-amber-50 hover:text-emerald-900 lg:block"
          >
            এলাকা খুঁজুন
          </Link>
          <Link
            href="/#how"
            className="hidden rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-amber-50 hover:text-emerald-900 lg:block"
          >
            কীভাবে কাজ করে
          </Link>
          <Link
            href="/#software"
            className="hidden rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-amber-50 hover:text-emerald-900 lg:block"
          >
            ফ্রি সফটওয়্যার
          </Link>
          <Link
            href="/login"
            className="hidden rounded-xl bg-white px-3 py-2 text-sm font-bold text-emerald-900 ring-1 ring-amber-300 transition hover:bg-amber-50 min-[420px]:block sm:px-4"
          >
            লগইন
          </Link>
          <Link
            href="/apply"
            className="rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 px-3 py-2 text-sm font-black text-emerald-950 shadow-[0_4px_16px_-4px_rgba(200,150,20,0.7)] transition hover:brightness-105 active:scale-95 sm:px-4"
          >
            আবেদন করুন
          </Link>
          {/* Location changer — top-right corner: animated border,
              colorful background + bounce so eyes go straight there.
              Opens a centered animated popup. */}
          <div className="loc-animated-frame rounded-full p-[2.5px]">
            <button
              onClick={() => setLocOpen(true)}
              aria-label="এলাকা বদলান"
              className="loc-attention flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-100 via-yellow-50 to-emerald-100 px-2.5 py-2 text-xs font-black text-emerald-950 transition hover:brightness-105 active:scale-95 sm:gap-1.5 sm:px-4 sm:py-2 sm:text-sm"
            >
              <span className="text-sm sm:text-base">📍</span>
              <span className="hidden min-[380px]:inline sm:inline">এলাকা</span>
            </button>
          </div>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="মেনু"
            aria-expanded={menuOpen}
            className="rounded-xl border border-amber-300 px-3 py-2 text-emerald-950 transition active:scale-95 lg:hidden"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </nav>
      </div>

      {/* Mobile menu panel */}
      <AnimatePresence initial={false}>
        {menuOpen && (
          <motion.nav
            className="overflow-hidden border-t border-amber-100 bg-white px-5 lg:hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="py-3">
              {MENU_LINKS.map((n) => (
                <button
                  key={n.href}
                  onClick={() => scrollToSection(n.href)}
                  className="block w-full border-b border-slate-50 py-2.5 text-left font-bold text-slate-700 last:border-0 hover:text-emerald-800"
                >
                  {n.label}
                </button>
              ))}
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="mt-2 block rounded-xl bg-white px-4 py-2.5 text-center text-sm font-bold text-emerald-900 ring-1 ring-amber-300 min-[420px]:hidden"
              >
                🔑 লগইন করুন
              </Link>
              <Link
                href="/apply"
                onClick={() => setMenuOpen(false)}
                className="mt-2 block rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 px-4 py-2.5 text-center text-sm font-black text-emerald-950"
              >
                📝 আবেদন করুন
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {locOpen && <LocationPopup onClose={() => setLocOpen(false)} />}
    </header>
  );
}
