"use client";

import { useState } from "react";
import { toBn } from "@/lib/bn";

interface Bucket {
  total: number;
  count: number;
  newCount: number;
  renewCount: number;
}

interface CustomBucket extends Bucket {
  from: string;
  to: string;
}

interface DoneRow {
  id: string;
  patientName: string;
  patientType?: string | null;
  contactPhone: string;
  appointmentDate: string;
  dayLabel?: string | null;
  chamberName?: string | null;
  fee?: number;
}

function taka(n: number): string {
  return `৳${toBn(n)}`;
}

function isoToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Date-range collection: pick dates, see realized (DONE) income + rows. */
export function CollectionPanel({ isDoctor }: { isDoctor: boolean }) {
  const [from, setFrom] = useState(() => isoDaysAgo(6));
  const [to, setTo] = useState(() => isoToday());
  const [result, setResult] = useState<CustomBucket | null>(null);
  const [rows, setRows] = useState<DoneRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (loading || !from || !to) return;
    setLoading(true);
    setError("");
    try {
      const q = `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
      const [sRes, lRes] = await Promise.all([
        fetch(`/api/backend/api/users/appointments/summary${q}`),
        fetch(`/api/backend/api/users/appointments${q}&status=DONE&limit=50`),
      ]);
      const sData = (await sRes.json().catch(() => null)) as {
        data?: { custom?: CustomBucket };
        error?: string;
      } | null;
      const lData = (await lRes.json().catch(() => null)) as {
        data?: DoneRow[];
        error?: string;
      } | null;
      if (!sRes.ok) throw new Error(sData?.error || "লোড করা যায়নি।");
      if (!lRes.ok) throw new Error(lData?.error || "লোড করা যায়নি।");
      const custom = sData?.data?.custom ?? null;
      setResult(custom);
      setRows(Array.isArray(lData?.data) ? (lData?.data ?? []) : []);
      if (custom) {
        setFrom(custom.from);
        setTo(custom.to);
      }
      setSearched(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "লোড করা যায়নি।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* ---------- Date picker ---------- */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
        <p className="text-lg font-black text-slate-900">তারিখ বেছে কালেকশন দেখুন</p>
        {!isDoctor && (
          <p className="mt-1 text-xs text-slate-400">স্টাফ সর্বোচ্চ গত ৭ দিনের মধ্যে দেখতে পারবেন।</p>
        )}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex-1 text-xs font-bold text-slate-500">
            শুরু
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </label>
          <label className="flex-1 text-xs font-bold text-slate-500">
            শেষ
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </label>
          <button
            onClick={() => void search()}
            disabled={loading}
            className="rounded-xl bg-emerald-600 px-8 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? "দেখা হচ্ছে…" : "দেখুন"}
          </button>
        </div>
        {error && <p className="mt-3 text-sm font-bold text-red-600">{error}</p>}
      </section>

      {/* ---------- Result ---------- */}
      {result && (
        <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 p-5 text-white shadow-xl sm:rounded-3xl sm:p-7">
          <p className="text-xs font-bold uppercase tracking-widest text-white/80">
            কালেকশন · {result.from} → {result.to}
          </p>
          <p className="mt-1 text-4xl font-black tracking-tight sm:text-5xl">{taka(result.total)}</p>
          <p className="mt-2 text-sm text-white/85">
            মোট {toBn(result.count)} জন · নতুন {toBn(result.newCount)} · পুরনো {toBn(result.renewCount)}
          </p>
        </section>
      )}

      {/* ---------- DONE rows in range ---------- */}
      {searched && (
        <section>
          <h2 className="mb-3 text-base font-black text-slate-900 sm:text-lg">
            আদায়কৃত তালিকা ({toBn(rows.length)})
          </h2>
          {rows.length === 0 ? (
            <p className="rounded-2xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-100">
              এই সময়ে কোনো সম্পন্ন অ্যাপয়েন্টমেন্ট নেই।
            </p>
          ) : (
            <ul className="space-y-2">
              {rows.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-black text-emerald-800">
                    {(r.patientName.trim()[0] || "অ").toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-black text-slate-900">{r.patientName}</span>
                    <span className="block truncate text-sm text-slate-500">
                      📞 {r.contactPhone}
                      {r.dayLabel ? ` · ${r.dayLabel}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-black text-emerald-700">{r.fee != null ? taka(r.fee) : "—"}</span>
                    <span className="mt-0.5 block text-[11px] font-bold text-slate-400">
                      {r.patientType === "RENEW" ? "পুরনো" : "নতুন"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
