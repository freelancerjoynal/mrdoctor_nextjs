"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/auth/apiFetch";

interface JoinRequest {
  id: string;
  type: "DOCTOR" | "HOSPITAL";
  status: "PENDING" | "APPROVED" | "REJECTED";
  email: string;
  phone: string;
  name: string | null;
  degree: string | null;
  speciality: string | null;
  username: string | null;
  hospitalName: string | null;
  slug: string | null;
  division: string | null;
  district: string | null;
  thana: string | null;
  addressLine: string | null;
  foundUs: string | null;
  joinReason: string | null;
  note: string | null;
  createdAt: string;
}

type StatusFilter = "PENDING" | "APPROVED" | "REJECTED" | "";
type TypeFilter = "DOCTOR" | "HOSPITAL" | "";

/**
 * Admin join-request review queue (SUPER_ADMIN + ADMIN_MANAGER).
 * No approve button by design — a representative calls the applicant
 * to confirm first; the account is then created from the
 * "অ্যাকাউন্ট তৈরি" page. Rejected (bogus/duplicate) requests can
 * still be removed from the queue below.
 */
export function ApplicationsPanel() {
  const [status, setStatus] = useState<StatusFilter>("PENDING");
  const [type, setType] = useState<TypeFilter>("");
  const [apps, setApps] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Loading is marked in event handlers (touch), never synchronously
  // inside the effect below.
  const touch = () => setLoading(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const q = new URLSearchParams();
        if (status) q.set("status", status);
        if (type) q.set("type", type);
        const res = await apiFetch(`/api/backend/api/applications?${q.toString()}`);
        const data = (await res.json().catch(() => null)) as { data?: JoinRequest[]; error?: string } | null;
        if (!res.ok) throw new Error(data?.error || "লোড করা যায়নি।");
        if (!alive) return;
        setApps(Array.isArray(data?.data) ? data.data : []);
        setError("");
      } catch (err: unknown) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "লোড করা যায়নি।");
        setApps([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [status, type, refreshKey]);

  const reject = async (id: string) => {
    if (acting) return;
    if (!window.confirm("এই আবেদনটি বাতিল করবেন?")) return;
    setActing(id);
    setNotice("");
    try {
      const res = await apiFetch(`/api/backend/api/applications/${id}/reject`, { method: "PATCH" });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error || "বাতিল করা যায়নি।");
      setNotice("✅ আবেদন বাতিল করা হয়েছে।");
      touch();
      setRefreshKey((k) => k + 1);
    } catch (err: unknown) {
      setNotice(err instanceof Error ? `❌ ${err.message}` : "❌ বাতিল করা যায়নি।");
    } finally {
      setActing(null);
    }
  };

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-black text-slate-800">📥 যোগদানের আবেদনসমূহ</p>
          <p className="mt-0.5 text-xs font-bold text-slate-400">
            ফোনে নিশ্চিত করে “অ্যাকাউন্ট তৈরি” পেজ থেকে অ্যাকাউন্ট খুলুন
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={type}
            onChange={(e) => {
              touch();
              setType(e.target.value as TypeFilter);
            }}
            className="rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-bold text-slate-700 focus:border-violet-500 focus:outline-none"
          >
            <option value="">সব ধরন</option>
            <option value="DOCTOR">🩺 ডাক্তার</option>
            <option value="HOSPITAL">🏥 হাসপাতাল</option>
          </select>
          <select
            value={status}
            onChange={(e) => {
              touch();
              setStatus(e.target.value as StatusFilter);
            }}
            className="rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-bold text-slate-700 focus:border-violet-500 focus:outline-none"
          >
            <option value="">সব অবস্থা</option>
            <option value="PENDING">⏳ বিচারাধীন</option>
            <option value="APPROVED">✅ অনুমোদিত</option>
            <option value="REJECTED">❌ বাতিল</option>
          </select>
        </div>
      </div>

      {notice && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm font-bold text-slate-700">{notice}</p>}
      {error && <p className="mt-3 text-sm font-bold text-red-600">{error}</p>}
      {loading && <p className="mt-3 rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-400">লোড হচ্ছে…</p>}

      {!loading && apps.length === 0 && (
        <p className="mt-3 rounded-xl bg-slate-50 p-4 text-center text-sm font-bold text-slate-400">
          কোনো আবেদন নেই।
        </p>
      )}

      <ul className="mt-3 space-y-2">
        {apps.map((a) => (
          <li key={a.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-black text-slate-800">
                  {a.type === "DOCTOR" ? "🩺" : "🏥"} {a.type === "DOCTOR" ? a.name : a.hospitalName}
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-black ${
                      a.status === "PENDING"
                        ? "bg-amber-100 text-amber-700"
                        : a.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-600"
                    }`}
                  >
                    {a.status === "PENDING" ? "বিচারাধীন" : a.status === "APPROVED" ? "অনুমোদিত" : "বাতিল"}
                  </span>
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {a.email} · {a.phone}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {a.type === "DOCTOR"
                    ? `${a.degree ?? ""} · ${a.speciality ?? ""}${a.username ? ` · @${a.username}` : ""}`
                    : `${a.division ?? ""}, ${a.district ?? ""}, ${a.thana ?? ""}${a.slug ? ` · /${a.slug}` : ""}`}
                </p>
                {(a.division || a.district || a.thana || a.addressLine) && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    📍 {[a.addressLine, a.thana, a.district, a.division].filter(Boolean).join(", ")}
                  </p>
                )}
                {a.foundUs && (
                  <p className="mt-0.5 text-xs text-slate-500">🔍 আমাদের খুঁজে পেয়েছেন: {a.foundUs}</p>
                )}
                {a.joinReason && (
                  <p className="mt-0.5 text-xs text-slate-500">💬 যোগ দিতে চান কারণ: {a.joinReason}</p>
                )}
                {a.note && <p className="mt-1 text-xs italic text-slate-400">“{a.note}”</p>}
              </div>
              {a.status === "PENDING" && (
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={acting === a.id}
                    onClick={() => void reject(a.id)}
                    className="rounded-xl bg-white px-4 py-2 text-xs font-black text-red-600 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50"
                  >
                    বাতিল
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
