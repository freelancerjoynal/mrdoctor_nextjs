"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/auth/apiFetch";
import { toBn } from "@/lib/bn";

interface HospitalOverview {
  hospital: {
    id: string;
    name: string;
    slug: string;
    division: string;
    district: string;
    thana: string;
    addressLine: string | null;
    phone: string | null;
    status: string;
    user: { email: string } | null;
    _count: { chambers: number };
  };
  doctorsCount: number;
  bookings: { pending: number; confirmed: number; served: number };
  income: {
    servedTotal: number;
    servedToday: number;
    pendingExpected: number;
    paidOut: number;
    onlineBalance: number;
    lifetimeOnline: number;
  };
}

const tk = (n: number) => `৳${toBn(Math.round(n))}`;

/**
 * /admin/hospitals/[id] — one hospital's bookings + income + payouts.
 * Data: GET /api/admin/hospitals/:id/overview (single round trip).
 */
export function HospitalDetailPanel({ id }: { id: string }) {
  const [data, setData] = useState<HospitalOverview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await apiFetch(`/api/backend/api/admin/hospitals/${id}/overview`);
        const json = (await res.json().catch(() => null)) as { data?: HospitalOverview; error?: string } | null;
        if (!res.ok) throw new Error(json?.error || "লোড করা যায়নি।");
        if (alive && json?.data) setData(json.data);
      } catch (err: unknown) {
        if (alive) setError(err instanceof Error ? err.message : "লোড করা যায়নি।");
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (error) {
    return <p className="rounded-2xl bg-white p-5 text-sm font-bold text-red-600 ring-1 ring-slate-100">{error}</p>;
  }
  if (!data) {
    return <div className="h-64 animate-pulse rounded-2xl bg-white ring-1 ring-slate-100" />;
  }

  const { hospital: h, bookings: b, income: i } = data;
  const stats = [
    { emoji: "⏳", label: "বিচারাধীন বুকিং", value: toBn(b.pending), hint: "রোগীর অনুরোধ" },
    { emoji: "📋", label: "নিশ্চিত (সেবা বাকি)", value: toBn(b.confirmed), hint: "সেবা এখনো হয়নি" },
    { emoji: "✅", label: "সেবা সম্পন্ন", value: toBn(b.served), hint: "সর্বমোট" },
    { emoji: "💰", label: "মোট আদায়", value: tk(i.servedTotal), hint: "সেবা-আয় (লাইফটাইম)" },
    { emoji: "📅", label: "আজকের আদায়", value: tk(i.servedToday), hint: "আজকের সেবা-আয়" },
    { emoji: "⏳", label: "বকেয়া প্রত্যাশিত", value: tk(i.pendingExpected), hint: "নিশ্চিত কিন্তু সেবা বাকি" },
    { emoji: "💸", label: "পরিশোধিত", value: tk(i.paidOut), hint: "এ পর্যন্ত পেআউট" },
    { emoji: "🏦", label: "অনলাইন ব্যালেন্স", value: tk(i.onlineBalance), hint: `লাইফটাইম অনলাইন ${tk(i.lifetimeOnline)}` },
    { emoji: "🧑‍⚕️", label: "ডাক্তার", value: toBn(data.doctorsCount), hint: "এই হাসপাতালে সিডিউল" },
  ];

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <p className="text-lg font-black text-slate-900">🏥 {h.name}</p>
        <p className="mt-1 text-sm font-bold text-slate-500">
          📍 {[h.addressLine, h.thana, h.district, h.division].filter(Boolean).join(", ")}
        </p>
        <p className="mt-1 text-xs font-bold text-slate-400">
          /{h.slug} · {h.phone ?? ""} · {h.user?.email ?? ""} · 🚪 {toBn(h._count?.chambers ?? 0)} চেম্বার ·{" "}
          {h.status === "APPROVED" ? "✅ অনুমোদিত" : "⏳ বিচারাধীন"}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <p className="text-xl">{s.emoji}</p>
            <p className="mt-1 text-lg font-black tracking-tight text-slate-900">{s.value}</p>
            <p className="text-xs font-bold text-slate-700">{s.label}</p>
            <p className="text-[11px] text-slate-400">{s.hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
