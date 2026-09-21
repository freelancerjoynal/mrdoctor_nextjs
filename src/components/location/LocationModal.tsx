"use client";

import { useEffect, type ReactNode } from "react";

/**
 * Universal modal shell — centered in the viewport with a blurred
 * backdrop and a springy scale-in entrance (`.loc-modal-pop`).
 * Backdrop click, ✕ button, or Esc closes it. The ✕ spins 360° on hover.
 */
export function LocationModal({
  title = "📍 আপনার এলাকা বেছে নিন",
  subtitle = "নিচে জেলা সিলেক্ট করুন, তারপর উপজেলা (ঐচ্ছিক) — সরাসরি সেই এলাকার ডাক্তার ও হাসপাতালের পোর্টালে নিয়ে যাওয়া হবে।",
  onClose,
  children,
}: {
  title?: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="loc-backdrop fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="loc-modal-pop relative w-full max-w-md rounded-3xl bg-white p-5 text-slate-900 shadow-2xl ring-1 ring-amber-200 sm:p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="h-1 rounded-full bg-gradient-to-r from-emerald-400 via-fuchsia-400 to-amber-400" />
        <button
          onClick={onClose}
          aria-label="বন্ধ করুন"
          title="বন্ধ করুন"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg font-black text-slate-500 ring-1 ring-slate-200 transition-all duration-500 hover:rotate-[360deg] hover:bg-red-50 hover:text-red-500 hover:ring-red-200 active:scale-90"
        >
          ✕
        </button>
        <p className="mt-3 pr-10 font-black">{title}</p>
        <p className="mt-1 pr-10 text-xs text-slate-500">{subtitle}</p>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}
