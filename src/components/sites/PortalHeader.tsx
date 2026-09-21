"use client";

import type { ReactNode } from "react";
import { useHideOnScroll } from "@/components/ui/useHideOnScroll";

/**
 * Shared portal header — MrDoctor logo left (big), and on the right the
 * context pill FIRST, then section nav, then the CTA.
 * - Thana portal: pill = 📍 থানা/জেলা.
 * - Doctor portal: pill = 🩺 speciality (category), never location.
 * - Hospital portal: pill = 📍 chamber area.
 * `identity` renders compactly next to the logo (doctor portrait+name,
 * hospital initial+name) so personal branding survives the unified bar.
 */
export function PortalHeader({
  logoHref,
  logoAriaLabel = "মিস্টার ডাক্তার",
  identity,
  pill,
  nav,
  navClassName = "",
  actions,
  mobilePanel,
}: {
  logoHref: string;
  logoAriaLabel?: string;
  identity?: ReactNode;
  /** FIRST element on the right side. */
  pill?: ReactNode;
  nav: { href: string; label: string }[];
  navClassName?: string;
  actions?: ReactNode;
  mobilePanel?: ReactNode;
}) {
  // Same hide-on-scroll behaviour as every other site header —
  // design/content untouched, only the bar slides away on scroll down.
  const { hidden } = useHideOnScroll();

  return (
    <header
      className={`header-enter sticky top-0 z-50 border-b border-slate-200/70 bg-white/95 backdrop-blur transition-transform duration-300 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-2 gap-y-1.5 px-4 py-1.5 sm:gap-3 sm:px-6 sm:py-2">
        <a href={logoHref} className="flex min-w-0 shrink-0 items-center gap-2.5" aria-label={logoAriaLabel}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-main.png"
            alt="মিস্টার ডাক্তার"
            width={200}
            className="h-auto w-[150px] shrink-0 object-contain sm:w-[200px]"
          />
          {identity}
        </a>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-2">
          {pill}
          {nav.length > 0 ? (
            <nav className={`items-center gap-1 ${navClassName}`}>
              {nav.map((n) => (
                <a
                  key={n.href}
                  href={n.href}
                  className="rounded-xl px-2.5 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  {n.label}
                </a>
              ))}
            </nav>
          ) : null}
          {actions}
        </div>
      </div>
      {mobilePanel}
    </header>
  );
}
