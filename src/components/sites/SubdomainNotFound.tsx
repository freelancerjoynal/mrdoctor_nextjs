"use client";

import { useEffect, useState } from "react";
import { buildApexUrl } from "@/lib/portal";
import { LocationPopup } from "@/components/location/LocationPopup";

const REDIRECT_SECONDS = 10;

/**
 * Unknown-subdomain page (`xyz.domain.com` with no doctor/hospital record).
 * Shows "page not available" in Bangla, offers the location picker so the
 * visitor can jump straight to a thana portal, and auto-redirects to the
 * main site after a countdown.
 */
export function SubdomainNotFound({ subdomain, host }: { subdomain: string; host: string }) {
  const [seconds, setSeconds] = useState(REDIRECT_SECONDS);
  const [locOpen, setLocOpen] = useState(false);
  // Apex URL computed from the request host (SSR-safe — no window needed).
  const apexHome = buildApexUrl("/", host);

  useEffect(() => {
    if (seconds <= 0) {
      window.location.href = apexHome;
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, apexHome]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* Brand bar */}
      <header className="header-enter border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center px-4 py-1.5 sm:px-6 sm:py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-main.png" alt="মিস্টার ডাক্তার" width={200} className="h-auto w-[150px] object-contain sm:w-[200px]" />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-4 py-10 sm:px-6">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-4xl ring-1 ring-amber-200">
          🔍
        </span>
        <h1 className="mt-4 text-center text-2xl font-black tracking-tight sm:text-3xl">
          এই পেজটি পাওয়া যায়নি
        </h1>
        <p className="mt-2 text-center text-sm font-bold text-slate-500 sm:text-base">
          “<span className="font-mono">{subdomain}</span>” নামে কোনো ডাক্তার বা হাসপাতালের
          পোর্টাল নেই।
        </p>

        {/* Pick a location → thana portal (universal popup) */}
        <div className="mt-6 w-full max-w-md rounded-3xl bg-white p-5 text-center shadow-xl ring-1 ring-amber-200 sm:p-6">
          <div className="h-1 rounded-full bg-gradient-to-r from-emerald-400 via-fuchsia-400 to-amber-400" />
          <p className="mt-3 font-black text-slate-900">📍 আপনার এলাকা বেছে নিন</p>
          <p className="mt-1 text-xs text-slate-500">
            জেলা ও থানা সিলেক্ট করলে সরাসরি সেই এলাকার পোর্টালে নিয়ে যাওয়া হবে।
          </p>
          <div className="loc-animated-frame mx-auto mt-4 w-fit rounded-full p-[2.5px]">
            <button
              onClick={() => setLocOpen(true)}
              className="loc-attention rounded-full bg-gradient-to-r from-amber-100 via-yellow-50 to-emerald-100 px-6 py-2.5 text-sm font-black text-emerald-950 transition hover:brightness-105 active:scale-95"
            >
              📍 এলাকা বেছে নিন →
            </button>
          </div>
        </div>
        {locOpen && <LocationPopup onClose={() => setLocOpen(false)} />}

        <p className="mt-6 text-center text-xs font-bold text-slate-400 sm:text-sm">
          {seconds} সেকেন্ডে মূল সাইটে নিয়ে যাওয়া হচ্ছে…
        </p>
        <a
          href={apexHome}
          className="mt-3 rounded-2xl bg-teal-600 px-6 py-3 text-sm font-black text-white shadow-lg transition hover:bg-teal-700"
        >
          এখনই মূল সাইটে যান →
        </a>
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs font-bold text-slate-400">
        © {new Date().getFullYear()} মিস্টার ডাক্তার — সবার জন্য সময়মতো চিকিৎসা।
      </footer>
    </div>
  );
}
