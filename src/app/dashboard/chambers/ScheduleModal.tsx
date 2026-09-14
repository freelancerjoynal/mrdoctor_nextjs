"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/auth/apiFetch";
import { DAYS, DAY_BN, DAY_BN_FULL, gradientFor, shortLabel } from "./types";
import type { ChamberRow } from "./types";

async function chamberApi(path: string, init?: RequestInit) {
  const res = await apiFetch(`/api/backend/api/users/chambers${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = (await res.json().catch(() => null)) as {
    data?: unknown;
    error?: string;
  } | null;
  if (!res.ok) throw new Error(data?.error || "অনুরোধ ব্যর্থ হয়েছে।");
  return (data as { data?: unknown })?.data;
}

/** Popup for adding timing: exclusive day boxes + start/end time. */
export function ScheduleModal({
  chamber,
  chamberIndex,
  takenBy,
  allRows,
  onClose,
  onSaved,
  onError,
}: {
  chamber: ChamberRow;
  chamberIndex: number;
  takenBy: Record<string, { chamberId: string; chamberIndex: number }>;
  allRows: ChamberRow[];
  onClose: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}) {
  const grad = gradientFor(chamberIndex);
  const firstFree =
    (DAYS as readonly string[]).find((d) => {
      const t = takenBy[d];
      return !t || t.chamberId === chamber.id;
    }) ?? "SATURDAY";
  const [day, setDay] = useState(firstFree);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("13:00");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const owner = takenBy[day];
    if (owner && owner.chamberId !== chamber.id) {
      const msg = "এই বারটি অন্য চেম্বারে ইতিমধ্যে নেওয়া আছে। শুধু ফাঁকা বার বেছে নিন।";
      setError(msg);
      onError(msg);
      return;
    }
    if (!start || !end) {
      setError("শুরু ও শেষ সময় দিন (HH:MM)।");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await chamberApi("/schedules", {
        method: "POST",
        body: JSON.stringify({ chamberId: chamber.id, dayOfWeek: day, startTime: start, endTime: end }),
      });
      onSaved("সময়সূচি যোগ হয়েছে।");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "সময়সূচি যোগ করা যায়নি।";
      setError(msg);
      onError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-black text-slate-900">⏰ সময় যোগ করুন</p>
            <p className="mt-1 text-sm text-slate-500">
              {chamber.chamberName?.trim() || chamber.addressLine?.trim() || "চেম্বার"} — বার + সময় বেছে
              নিন। নেওয়া বার অন্য চেম্বারে বন্ধ থাকে।
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="shrink-0 rounded-full px-3 py-1.5 text-sm font-bold text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="mt-4 space-y-3">
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {DAYS.map((d) => {
              const t = takenBy[d];
              const mine = !!t && t.chamberId === chamber.id;
              const blocked = !!t && t.chamberId !== chamber.id;
              const selected = day === d;
              if (blocked) {
                const ownerGrad = gradientFor(t!.chamberIndex);
                const owner = allRows[t!.chamberIndex];
                return (
                  <button
                    key={d}
                    type="button"
                    disabled
                    title={`এই বার ${owner ? shortLabel(owner, t!.chamberIndex) : "অন্য চেম্বারে"} নেওয়া`}
                    className={`cursor-not-allowed rounded-xl bg-gradient-to-br px-1 py-2.5 text-center text-white opacity-80 shadow ${ownerGrad}`}
                  >
                    <p className="text-xs font-black">🔒 {DAY_BN[d]}</p>
                    <p className="mt-0.5 truncate text-[10px] font-bold text-white/90">
                      {owner ? shortLabel(owner, t!.chamberIndex) : ""}
                    </p>
                  </button>
                );
              }
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDay(d)}
                  title={mine ? `${DAY_BN_FULL[d]} — এই চেম্বারের` : `${DAY_BN_FULL[d]} — ফাঁকা`}
                  className={`rounded-xl px-1 py-2.5 text-center ring-2 transition ${
                    selected
                      ? `bg-gradient-to-br text-white shadow ${grad} ring-transparent`
                      : mine
                        ? `bg-gradient-to-br text-white opacity-70 ring-transparent ${grad}`
                        : "bg-white text-slate-600 ring-slate-200 hover:ring-emerald-400"
                  }`}
                >
                  <p className="text-xs font-black">{DAY_BN[d]}</p>
                  <p className={`mt-0.5 text-[10px] font-bold ${selected || mine ? "text-white/90" : "text-slate-400"}`}>
                    {mine ? "এই চেম্বার" : "ফাঁকা"}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className={`rounded-xl px-3 py-2 text-sm font-black text-white shadow bg-gradient-to-br ${grad}`}>
              {DAY_BN_FULL[day] ?? day}
            </span>
            <input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
            />
            <input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {error && <p className="text-sm font-bold text-red-600">{error}</p>}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {saving ? "যোগ হচ্ছে…" : "➕ সময় যোগ করুন"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-6 py-2.5 text-sm font-bold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              বাতিল
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
