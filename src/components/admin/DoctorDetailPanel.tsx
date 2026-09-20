"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/auth/apiFetch";
import { toBn } from "@/lib/bn";

interface DoctorOverview {
  doctor: {
    id: string;
    name: string;
    username: string;
    degree: string;
    speciality: string;
    phone: string;
    status: string;
    profilePicture: string | null;
    user: { email: string } | null;
    chambers: {
      id: string;
      chamberName: string | null;
      addressLine: string | null;
      thana: string | null;
      district: string | null;
      division: string | null;
      newPatientFee: number;
      oldPatientFee: number;
      hospital: { id: string; name: string; slug: string } | null;
    }[];
  };
  bookings: { pending: number; confirmed: number; served: number };
  income: { servedTotal: number; servedToday: number; pendingExpected: number };
}

const tk = (n: number) => `৳${toBn(Math.round(n))}`;

/**
 * /admin/doctors/[id] — one doctor's bookings + income at a glance.
 * Data: GET /api/admin/doctors/:id/overview (single round trip).
 */
export function DoctorDetailPanel({ id }: { id: string }) {
  const [data, setData] = useState<DoctorOverview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await apiFetch(`/api/backend/api/admin/doctors/${id}/overview`);
        const json = (await res.json().catch(() => null)) as { data?: DoctorOverview; error?: string } | null;
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

  const { doctor: d, bookings: b, income: i } = data;
  const stats = [
    { emoji: "⏳", label: "বিচারাধীন বুকিং", value: toBn(b.pending), hint: "রোগীর অনুরোধ" },
    { emoji: "📋", label: "নিশ্চিত (সেবা বাকি)", value: toBn(b.confirmed), hint: "সেবা এখনো হয়নি" },
    { emoji: "✅", label: "সেবা সম্পন্ন", value: toBn(b.served), hint: "সর্বমোট" },
    { emoji: "💰", label: "মোট আদায়", value: tk(i.servedTotal), hint: "সেবা-আয় (লাইফটাইম)" },
    { emoji: "📅", label: "আজকের আদায়", value: tk(i.servedToday), hint: "আজকের সেবা-আয়" },
    { emoji: "⏳", label: "বকেয়া প্রত্যাশিত", value: tk(i.pendingExpected), hint: "নিশ্চিত কিন্তু সেবা বাকি" },
  ];

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <p className="text-lg font-black text-slate-900">🩺 {d.name}</p>
        <p className="mt-1 text-sm font-bold text-slate-500">
          {d.degree} · {d.speciality}
        </p>
        <p className="mt-1 text-xs font-bold text-slate-400">
          @{d.username} · {d.phone} · {d.user?.email ?? ""} ·{" "}
          {d.status === "APPROVED" ? "✅ অনুমোদিত" : "⏳ বিচারাধীন"}
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

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <p className="text-sm font-black text-slate-800">🚪 চেম্বার ({toBn(d.chambers.length)})</p>
        {d.chambers.length === 0 && (
          <p className="mt-2 text-xs font-bold text-slate-400">কোনো চেম্বার নেই।</p>
        )}
        <ul className="mt-2 space-y-2">
          {(d.chambers ?? []).map((c) => (
            <li key={c.id} className="rounded-xl bg-slate-50 p-3 text-xs">
              <p className="font-black text-slate-800">
                {c.chamberName ?? "চেম্বার"}
                {c.hospital ? ` · 🏥 ${c.hospital.name}` : ""}
              </p>
              <p className="mt-0.5 font-bold text-slate-500">
                📍 {[c.addressLine, c.thana, c.district, c.division].filter(Boolean).join(", ")}
              </p>
              <p className="mt-0.5 font-bold text-slate-500">
                নতুন {tk(c.newPatientFee)} · পুরনো {tk(c.oldPatientFee)}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
