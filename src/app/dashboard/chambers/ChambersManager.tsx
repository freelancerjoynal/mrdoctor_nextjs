"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/auth/apiFetch";
import { DAY_BN_FULL, buildTakenBy, gradientFor } from "./types";
import type { ChamberRow, HospitalFacets } from "./types";
import { ChambersSkeleton } from "./ChambersSkeleton";
import { ChamberFormModal } from "./ChamberFormModal";
import { ScheduleModal } from "./ScheduleModal";

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

/** Client island — toolbar, chamber cards, popups, mutations + top progress. */
export function ChambersManager({
  initialChambers,
  initialFacets,
}: {
  initialChambers: ChamberRow[];
  initialFacets: HospitalFacets;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<ChamberRow[]>(initialChambers);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [chamberModal, setChamberModal] = useState<null | { mode: "new" } | { mode: "edit"; id: string }>(null);
  const [schedModal, setSchedModal] = useState<string | null>(null);

  const busy = loading || deleting !== null;
  const takenBy = buildTakenBy(rows);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = (await chamberApi("/")) as ChamberRow[];
      setRows(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "লোড করা যায়নি।");
    } finally {
      setLoading(false);
    }
  }, []);

  // Keep client rows in sync if the server revalidates underneath.
  useEffect(() => {
    setRows(initialChambers);
  }, [initialChambers]);

  const afterMutation = async (message: string) => {
    setNotice(message);
    setChamberModal(null);
    setSchedModal(null);
    await refresh();
    router.refresh();
  };

  const removeChamber = async (id: string) => {
    if (!confirm("এই চেম্বারটি মুছে দেবেন? এর সময়সূচিগুলোও মুছে যাবে।")) return;
    setDeleting(id);
    setError("");
    try {
      await chamberApi(`/${id}`, { method: "DELETE" });
      setNotice("চেম্বার মুছে ফেলা হয়েছে।");
      await refresh();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "মোছা যায়নি।");
    } finally {
      setDeleting(null);
    }
  };

  const removeSchedule = async (id: string) => {
    if (!confirm("এই সময়সূচিটি মুছে দেবেন? বারটি আবার ফাঁকা হয়ে যাবে।")) return;
    setDeleting(id);
    setError("");
    try {
      await chamberApi(`/schedules/${id}`, { method: "DELETE" });
      setNotice("সময়সূচি মুছে ফেলা হয়েছে।");
      await refresh();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "মোছা যায়নি।");
    } finally {
      setDeleting(null);
    }
  };

  const editingChamber = chamberModal?.mode === "edit" ? (rows.find((r) => r.id === chamberModal.id) ?? null) : null;
  const schedChamber = schedModal ? (rows.find((r) => r.id === schedModal) ?? null) : null;
  const schedIndex = schedChamber ? rows.findIndex((r) => r.id === schedChamber.id) : 0;

  return (
    <div className="space-y-4">
      {/* Top progress bar while any request is in flight */}
      {busy && (
        <div className="fixed inset-x-0 top-0 z-[60] h-1" aria-hidden="true">
          <div className="h-full animate-pulse bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500" />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          মোট চেম্বার: <b className="text-slate-800">{rows.length}</b> · একই বার দুই চেম্বারে রাখা
          যাবে না।
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => void refresh()}
            disabled={loading}
            className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60"
          >
            {loading ? "লোড হচ্ছে…" : "↻ রিফ্রেশ"}
          </button>
          <button
            onClick={() => {
              setError("");
              setNotice("");
              setChamberModal({ mode: "new" });
            }}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-emerald-700"
          >
            ➕ নতুন চেম্বার
          </button>
        </div>
      </div>

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-600 ring-1 ring-red-200">{error}</p>}
      {notice && (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700 ring-1 ring-emerald-200">{notice}</p>
      )}

      {loading && rows.length === 0 ? (
        <ChambersSkeleton />
      ) : rows.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-100">
          এখনো কোনো চেম্বার যোগ করা হয়নি। <b>নতুন চেম্বার</b> বোতামে ক্লিক করে প্রথম চেম্বার যোগ করুন।
        </p>
      ) : (
        <ul className="space-y-4">
          {rows.map((c, ci) => {
            const grad = gradientFor(ci);
            return (
              <li key={c.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
                <div className={`bg-gradient-to-r px-5 py-4 text-white ${grad}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-black">
                        {c.chamberName?.trim() || c.addressLine?.trim() || `চেম্বার ${ci + 1}`}
                      </p>
                      {(c.addressLine?.trim() || c.thana?.trim() || c.district?.trim()) && (
                        <p className="mt-0.5 truncate text-xs text-white/85">
                          {[c.addressLine, c.thana, c.district].filter((x) => x?.trim()).join(", ")}
                        </p>
                      )}
                      {c.hospital?.name ? (
                        <p className="mt-0.5 truncate text-xs font-bold text-white/90">
                          🏥 {c.hospital.name}
                        </p>
                      ) : null}
                      <p className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] font-black">
                        <span className="rounded-full bg-white/20 px-2.5 py-0.5">নতুন ৳{c.newPatientFee}</span>
                        <span className="rounded-full bg-white/20 px-2.5 py-0.5">পুরনো ৳{c.oldPatientFee}</span>
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => {
                          setError("");
                          setNotice("");
                          setChamberModal({ mode: "edit", id: c.id });
                        }}
                        className="rounded-full bg-white/20 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/40 hover:bg-white/30"
                      >
                        সম্পাদনা
                      </button>
                      <button
                        onClick={() => void removeChamber(c.id)}
                        disabled={deleting === c.id}
                        className="rounded-full bg-black/20 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/40 hover:bg-black/30 disabled:opacity-60"
                      >
                        {deleting === c.id ? "মুছছে…" : "মুছুন"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-black text-slate-700">
                      🕒 সময়সূচি ({c.schedules?.length ?? 0})
                    </p>
                    <button
                      onClick={() => {
                        setError("");
                        setNotice("");
                        setSchedModal(c.id);
                      }}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
                    >
                      ➕ সময় যোগ করুন
                    </button>
                  </div>
                  {(c.schedules?.length ?? 0) > 0 ? (
                    <ul className="mt-2 space-y-1.5">
                      {(c.schedules ?? []).map((s) => (
                        <li
                          key={s.id}
                          className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm ring-1 ring-slate-100"
                        >
                          <span className="font-bold text-slate-800">
                            {DAY_BN_FULL[s.dayOfWeek] ?? s.dayOfWeek} · {s.startTime}–{s.endTime}
                          </span>
                          <button
                            onClick={() => void removeSchedule(s.id)}
                            disabled={deleting === s.id}
                            className="shrink-0 rounded-full px-3 py-1 text-xs font-bold text-red-600 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-60"
                          >
                            {deleting === s.id ? "মুছছে…" : "মুছুন"}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">
                      এখনো কোনো সময় নির্ধারণ করা হয়নি — <b>সময় যোগ করুন</b> বোতামে পপআপ থেকে বার + সময় বেছে নিন।
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Popups */}
      {chamberModal && (chamberModal.mode === "new" || editingChamber) && (
        <ChamberFormModal
          mode={chamberModal.mode}
          chamber={chamberModal.mode === "edit" ? editingChamber : null}
          initialFacets={initialFacets}
          onClose={() => setChamberModal(null)}
          onSaved={(msg) => void afterMutation(msg)}
          onError={(msg) => setError(msg)}
        />
      )}
      {schedChamber && (
        <ScheduleModal
          chamber={schedChamber}
          chamberIndex={schedIndex}
          takenBy={takenBy}
          allRows={rows}
          onClose={() => setSchedModal(null)}
          onSaved={(msg) => void afterMutation(msg)}
          onError={(msg) => setError(msg)}
        />
      )}
    </div>
  );
}
