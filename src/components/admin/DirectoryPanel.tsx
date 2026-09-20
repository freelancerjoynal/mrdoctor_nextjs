"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/auth/apiFetch";

interface LocationOptions {
  divisions: string[];
  districts: { division: string; districts: string[] }[];
  thanas: { district: string; thanas: string[] }[];
}

interface ChamberLoc {
  id: string;
  chamberName: string | null;
  thana: string | null;
  district: string | null;
  division: string | null;
}

interface DoctorRow {
  id: string;
  name: string;
  username: string;
  degree: string;
  speciality: string;
  phone: string;
  status: string;
  // Optional: older backends omit chambers — cards must never crash on it.
  chambers?: ChamberLoc[];
}

interface HospitalRow {
  id: string;
  name: string;
  slug: string;
  division: string;
  district: string;
  thana: string;
  addressLine: string | null;
  phone: string | null;
  status: string;
  _count?: { chambers: number };
}

type DirType = "HOSPITAL" | "DOCTOR";

/**
 * /admin/directory — location-first browser.
 * Pick division → district → thana (cascading), then open any
 * hospital/doctor to see bookings, income and pending income.
 */
export function DirectoryPanel() {
  const [type, setType] = useState<DirType>("HOSPITAL");
  const [loc, setLoc] = useState<LocationOptions | null>(null);
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [thana, setThana] = useState("");
  const [q, setQ] = useState("");
  const [qSent, setQSent] = useState("");
  const [rows, setRows] = useState<(DoctorRow | HospitalRow)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await apiFetch("/api/backend/api/admin/locations");
        const json = (await res.json().catch(() => null)) as { data?: LocationOptions } | null;
        if (alive && json?.data) setLoc(json.data);
      } catch {
        /* filters stay manual — never blocks the list */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const districtOptions = useMemo(() => {
    if (!division) return [...new Set((loc?.districts ?? []).flatMap((d) => d.districts))].sort();
    return loc?.districts.find((d) => d.division === division)?.districts ?? [];
  }, [loc, division]);

  const thanaOptions = useMemo(() => {
    if (!district) return [...new Set((loc?.thanas ?? []).flatMap((t) => t.thanas))].sort();
    return loc?.thanas.find((t) => t.district === district)?.thanas ?? [];
  }, [loc, district]);

  // Every filter change marks loading here (event handler, not effect) —
  // the effect below only performs async work so no setState runs
  // synchronously inside it.
  const touch = () => setLoading(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const params = new URLSearchParams({ type, take: "100" });
        if (division) params.set("division", division);
        if (district) params.set("district", district);
        if (thana) params.set("thana", thana);
        if (qSent.trim()) params.set("q", qSent.trim());
        const res = await apiFetch(`/api/backend/api/admin/directory?${params.toString()}`);
        const json = (await res.json().catch(() => null)) as {
          data?: (DoctorRow | HospitalRow)[];
          error?: string;
        } | null;
        if (!res.ok) throw new Error(json?.error || "লোড করা যায়নি।");
        if (!alive) return;
        setRows(Array.isArray(json?.data) ? json.data : []);
        setError("");
      } catch (err: unknown) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "লোড করা যায়নি।");
        setRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [type, division, district, thana, qSent]);

  const selectCls =
    "rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-700 focus:border-violet-500 focus:outline-none";

  return (
    <div className="space-y-4">
      {/* Type tabs */}
      <div className="flex gap-2">
        {(["HOSPITAL", "DOCTOR"] as DirType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              touch();
              setType(t);
            }}
            className={`flex-1 rounded-2xl px-4 py-3 text-sm font-black transition ${
              type === t
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25"
                : "bg-white text-slate-600 ring-1 ring-slate-100 hover:bg-slate-50"
            }`}
          >
            {t === "HOSPITAL" ? "🏥 হাসপাতাল" : "🩺 ডাক্তার"}
          </button>
        ))}
      </div>

      {/* Location + search filters */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <select
            value={division}
            onChange={(e) => {
              touch();
              setDivision(e.target.value);
              setDistrict("");
              setThana("");
            }}
            className={selectCls}
          >
            <option value="">সব বিভাগ</option>
            {(loc?.divisions ?? []).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            value={district}
            onChange={(e) => {
              touch();
              setDistrict(e.target.value);
              setThana("");
            }}
            className={selectCls}
          >
            <option value="">সব জেলা</option>
            {districtOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            value={thana}
            onChange={(e) => {
              touch();
              setThana(e.target.value);
            }}
            className={selectCls}
          >
            <option value="">সব থানা</option>
            {thanaOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <form
            className="col-span-2 flex gap-2 sm:col-span-1"
            onSubmit={(e) => {
              e.preventDefault();
              touch();
              setQSent(q);
            }}
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={type === "HOSPITAL" ? "নাম / স্লাগ…" : "নাম / বিশেষজ্ঞতা…"}
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-bold text-slate-700 focus:border-violet-500 focus:outline-none"
            />
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white hover:bg-slate-700"
            >
              🔍
            </button>
          </form>
        </div>
        {(division || district || thana) && (
          <button
            type="button"
            onClick={() => {
              touch();
              setDivision("");
              setDistrict("");
              setThana("");
              setQ("");
              setQSent("");
            }}
            className="mt-2 text-xs font-bold text-violet-600 hover:underline"
          >
            ✕ ফিল্টার মুছুন
          </button>
        )}
      </div>

      {error && <p className="text-sm font-bold text-red-600">{error}</p>}
      {loading && <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-400">লোড হচ্ছে…</p>}

      {!loading && rows.length === 0 && !error && (
        <p className="rounded-xl bg-white p-6 text-center text-sm font-bold text-slate-400 ring-1 ring-slate-100">
          এই লোকেশনে কিছু পাওয়া যায়নি।
        </p>
      )}

      <ul className="space-y-2">
        {rows.map((r) =>
          type === "HOSPITAL" ? (
            <HospitalCard key={r.id} h={r as HospitalRow} />
          ) : (
            <DoctorCard key={r.id} d={r as DoctorRow} />
          ),
        )}
      </ul>
    </div>
  );
}

function statusPill(status: string) {
  return (
    <span
      className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-black ${
        status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
      }`}
    >
      {status === "APPROVED" ? "অনুমোদিত" : status === "PENDING" ? "বিচারাধীন" : status}
    </span>
  );
}

function HospitalCard({ h }: { h: HospitalRow }) {
  return (
    <li>
      <Link
        href={`/admin/hospitals/${h.id}`}
        className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-lg"
      >
        <p className="text-sm font-black text-slate-800">
          🏥 {h.name}
          {statusPill(h.status)}
        </p>
        <p className="mt-1 text-xs font-bold text-slate-500">
          📍 {[h.thana, h.district, h.division].filter(Boolean).join(", ")}
          {h.phone ? ` · ${h.phone}` : ""} · 🚪 {h._count?.chambers ?? 0} চেম্বার
        </p>
        <p className="mt-1 text-xs font-bold text-violet-600">বুকিং ও আয় দেখুন →</p>
      </Link>
    </li>
  );
}

function DoctorCard({ d }: { d: DoctorRow }) {
  const locs = [
    ...new Set(
      (d.chambers ?? [])
        .map((c) => [c.thana, c.district].filter(Boolean).join(", "))
        .filter(Boolean),
    ),
  ];
  return (
    <li>
      <Link
        href={`/admin/doctors/${d.id}`}
        className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-lg"
      >
        <p className="text-sm font-black text-slate-800">
          🩺 {d.name}
          {statusPill(d.status)}
        </p>
        <p className="mt-1 text-xs font-bold text-slate-500">
          {d.speciality} · {d.degree}
        </p>
        {locs.length > 0 && <p className="mt-0.5 text-xs text-slate-500">📍 {locs.join(" · ")}</p>}
        <p className="mt-1 text-xs font-bold text-violet-600">বুকিং ও আয় দেখুন →</p>
      </Link>
    </li>
  );
}
