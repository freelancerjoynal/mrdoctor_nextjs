"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/auth/apiFetch";
import { toBn } from "@/lib/bn";

interface CreditBalance {
  ownerType: "DOCTOR" | "HOSPITAL";
  ownerName: string;
  balance: number;
  bookableLeft: number;
  exhausted: boolean;
}

/**
 * Credit wallet pill for doctor / hospital / staff dashboards.
 * Everyone sees their owner's balance: 🪙 balance + how many offline
 * bookings are left (online bookings are free). Red + "contact support"
 * when the balance hits zero.
 * `tone="dark"` for gradient heroes, `"light"` for the white topbar.
 */
export function CreditBalanceBadge({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const [data, setData] = useState<CreditBalance | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await apiFetch("/api/backend/api/users/credits/balance");
        const json = (await res.json().catch(() => null)) as { data?: CreditBalance } | null;
        if (alive && res.ok && json?.data) setData(json.data);
      } catch {
        /* badge stays hidden until it loads */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!data) {
    return (
      <span
        className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ring-1 ${
          tone === "light" ? "bg-slate-100 text-slate-400 ring-slate-200" : "bg-white/10 text-white/70 ring-white/20"
        }`}
      >
        🪙 …
      </span>
    );
  }

  const toneMap =
    tone === "light"
      ? {
          exhausted: "bg-red-100 text-red-700 ring-red-200",
          due: "bg-amber-100 text-amber-800 ring-amber-200",
          ok: "bg-emerald-100 text-emerald-800 ring-emerald-200",
        }
      : {
          exhausted: "bg-red-500/25 text-red-100 ring-red-300/50",
          due: "bg-amber-400/20 text-amber-100 ring-amber-200/50",
          ok: "bg-white/10 text-white ring-white/20",
        };
  // No due system: amber while low (≤10 left), red at zero.
  const toneClass = data.exhausted ? toneMap.exhausted : data.bookableLeft <= 10 ? toneMap.due : toneMap.ok;

  return (
    <span
      title={`${data.ownerName} · প্রতি অফলাইন বুকিংয়ে ১ ক্রেডিট কাটবে · অনলাইন বুকিং ফ্রি`}
      className={`inline-flex w-fit flex-wrap items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ring-1 backdrop-blur ${toneClass}`}
    >
      🪙 ক্রেডিট {toBn(data.balance)}
      {data.exhausted ? (
        <span>· শেষ — সাপোর্টে যোগাযোগ করুন</span>
      ) : (
        <span className="opacity-80">· আর {toBn(data.bookableLeft)}টা বুকিং</span>
      )}
    </span>
  );
}
