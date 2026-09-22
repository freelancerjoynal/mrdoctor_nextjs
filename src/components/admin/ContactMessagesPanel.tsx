"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/auth/apiFetch";

interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  topic: string;
  subject: string | null;
  message: string;
  status: "NEW" | "READ" | "REPLIED" | "ARCHIVED";
  source: string;
  createdAt: string;
}

const TOPIC_BN: Record<string, string> = {
  GENERAL: "সাধারণ",
  BOOKING: "বুকিং",
  REFUND: "রিফান্ড",
  SUPPORT: "সাপোর্ট",
  DOCTOR_JOIN: "ডাক্তার যোগদান",
  HOSPITAL_JOIN: "হাসপাতাল যোগদান",
  FEEDBACK: "মতামত",
};

const STATUS_BN: Record<string, string> = {
  NEW: "নতুন",
  READ: "পড়া হয়েছে",
  REPLIED: "উত্তর দেওয়া",
  ARCHIVED: "আর্কাইভ",
};

/**
 * Admin contact-message inbox (SUPER_ADMIN + ADMIN_MANAGER).
 * /contact form submissions land here as NEW for triage.
 */
export function ContactMessagesPanel() {
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<ContactMessage[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const params = new URLSearchParams();
        if (status) params.set("status", status);
        if (q.trim()) params.set("q", q.trim());
        params.set("limit", "50");
        const res = await apiFetch(`/api/backend/api/admin/contact-messages?${params.toString()}`);
        const data = (await res.json().catch(() => null)) as {
          data?: { data?: ContactMessage[]; counts?: Record<string, number> };
          error?: string;
        } | null;
        if (!res.ok) throw new Error(data?.error || "লোড করা যায়নি।");
        if (!alive) return;
        setRows(Array.isArray(data?.data?.data) ? data.data.data : []);
        setCounts(data?.data?.counts ?? {});
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
  }, [status, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const search = () => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  };

  const setRowStatus = async (id: string, next: string) => {
    if (acting) return;
    setActing(id);
    setNotice("");
    try {
      const res = await apiFetch(`/api/backend/api/admin/contact-messages/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error || "আপডেট করা যায়নি।");
      setNotice("✅ স্ট্যাটাস আপডেট হয়েছে।");
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: next as ContactMessage["status"] } : r)),
      );
    } catch (err: unknown) {
      setNotice(err instanceof Error ? `❌ ${err.message}` : "❌ আপডেট করা যায়নি।");
    } finally {
      setActing(null);
    }
  };

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        {(["", "NEW", "READ", "REPLIED", "ARCHIVED"] as const).map((s) => (
          <button
            key={s || "ALL"}
            onClick={() => {
              setStatus(s);
              setLoading(true);
              setRefreshKey((k) => k + 1);
            }}
            className={`rounded-full px-4 py-1.5 text-xs font-black transition ${
              status === s ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {s === "" ? "সব" : `${STATUS_BN[s]}${counts[s] ? ` (${counts[s]})` : ""}`}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") search();
            }}
            placeholder="নাম / ফোন / বার্তা খুঁজুন…"
            className="w-52 rounded-xl border border-slate-200 px-3 py-1.5 text-sm focus:border-violet-500 focus:outline-none"
          />
          <button
            onClick={search}
            className="rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-black text-white hover:bg-slate-700"
          >
            খুঁজুন
          </button>
        </div>
      </div>

      {notice && <p className="mt-3 text-sm font-bold text-slate-700">{notice}</p>}
      {error && <p className="mt-3 text-sm font-bold text-red-600">{error}</p>}

      <div className="mt-4 space-y-3">
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-400">লোড হচ্ছে…</p>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">কোনো বার্তা নেই।</p>
        ) : (
          rows.map((r) => (
            <article key={r.id} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-black ${
                    r.status === "NEW"
                      ? "bg-amber-100 text-amber-800"
                      : r.status === "READ"
                        ? "bg-sky-100 text-sky-800"
                        : r.status === "REPLIED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {STATUS_BN[r.status] ?? r.status}
                </span>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-black text-violet-700 ring-1 ring-violet-100">
                  {TOPIC_BN[r.topic] ?? r.topic}
                </span>
                <span className="ml-auto text-[11px] text-slate-400">
                  {new Date(r.createdAt).toLocaleString("bn-BD")}
                </span>
              </div>
              <p className="mt-2 text-sm font-black text-slate-900">
                {r.name} · <a href={`tel:${r.phone}`} className="text-violet-700 hover:underline">{r.phone}</a>
                {r.email && (
                  <>
                    {" · "}
                    <a href={`mailto:${r.email}`} className="font-bold text-violet-700 hover:underline">
                      {r.email}
                    </a>
                  </>
                )}
              </p>
              {r.subject && <p className="mt-1 text-sm font-bold text-slate-700">📌 {r.subject}</p>}
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{r.message}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(["READ", "REPLIED", "ARCHIVED"] as const).map((s) => (
                  <button
                    key={s}
                    disabled={acting === r.id || r.status === s}
                    onClick={() => setRowStatus(r.id, s)}
                    className="rounded-lg bg-white px-3 py-1.5 text-[11px] font-black text-slate-600 ring-1 ring-slate-200 hover:bg-slate-900 hover:text-white disabled:opacity-40"
                  >
                    {STATUS_BN[s]}
                  </button>
                ))}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
