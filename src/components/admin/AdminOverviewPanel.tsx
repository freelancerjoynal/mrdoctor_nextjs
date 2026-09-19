"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/auth/apiFetch";

interface Overview {
  users: Record<string, number>;
  doctors: { approved: number; pending: number; total: number };
  hospitals: { approved: number; pending: number; total: number };
  joinRequests: { pendingDoctors: number; pendingHospitals: number; pendingTotal: number; total: number };
  blogsPublished: number;
  reviewsPending: number;
}

/**
 * /admin overview: live platform counts from GET /api/admin/overview.
 * Cards link into the matching sidebar sections.
 */
export function AdminOverviewPanel() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await apiFetch("/api/backend/api/admin/overview");
        const json = (await res.json().catch(() => null)) as { data?: Overview; error?: string } | null;
        if (!res.ok) throw new Error(json?.error || "লোড করা যায়নি।");
        if (alive && json?.data) setData(json.data);
      } catch (err: unknown) {
        if (alive) setError(err instanceof Error ? err.message : "লোড করা যায়নি।");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (error) {
    return <p className="rounded-2xl bg-white p-5 text-sm font-bold text-red-600 ring-1 ring-slate-100">{error}</p>;
  }

  if (!data) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-white ring-1 ring-slate-100" />
        ))}
      </div>
    );
  }

  const cards = [
    { emoji: "📥", label: "বিচারাধীন যোগদান", value: data.joinRequests.pendingTotal, hint: `🩺 ${data.joinRequests.pendingDoctors} · 🏥 ${data.joinRequests.pendingHospitals}`, href: "/admin/applications" },
    { emoji: "🩺", label: "ডাক্তার", value: data.doctors.total, hint: `✅ ${data.doctors.approved} অনুমোদিত · ⏳ ${data.doctors.pending} বিচারাধীন`, href: "/admin/create-account" },
    { emoji: "🏥", label: "হাসপাতাল", value: data.hospitals.total, hint: `✅ ${data.hospitals.approved} অনুমোদিত · ⏳ ${data.hospitals.pending} বিচারাধীন`, href: "/admin/create-account" },
    { emoji: "👥", label: "মোট ইউজার", value: data.users.total ?? 0, hint: "সব ভূমিকা মিলিয়ে", href: "/admin" },
    { emoji: "✍️", label: "প্রকাশিত ব্লগ", value: data.blogsPublished, hint: "পাবলিক সাইটে লাইভ", href: "/admin" },
    { emoji: "⭐", label: "বিচারাধীন রিভিউ", value: data.reviewsPending, hint: "অনুমোদনের অপেক্ষায়", href: "/admin" },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <Link
          key={c.label}
          href={c.href}
          className="group rounded-2xl bg-white p-5 text-left shadow-xl shadow-slate-900/5 ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-2xl"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-500 text-lg shadow-lg transition group-hover:scale-110">
            {c.emoji}
          </div>
          <p className="text-2xl font-black tracking-tight text-slate-900">{c.value}</p>
          <p className="font-bold text-slate-900">{c.label}</p>
          <p className="text-sm text-slate-500">{c.hint}</p>
        </Link>
      ))}
    </div>
  );
}
