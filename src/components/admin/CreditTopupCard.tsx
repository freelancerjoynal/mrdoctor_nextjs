"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/auth/apiFetch";
import { toBn } from "@/lib/bn";

export type CreditOwner = "DOCTOR" | "HOSPITAL";

interface LedgerRow {
  id: string;
  amount: number;
  balanceAfter: number;
  kind: string;
  refType: string | null;
  note: string | null;
  createdAt: string;
}

interface CreditView {
  ownerName: string;
  balance: number;
  dueLimit: number;
  bookableLeft: number;
  exhausted: boolean;
  ledger: LedgerRow[];
}

function kindLabel(kind: string): string {
  if (kind === "APPOINTMENT_SPEND") return "📋 অ্যাপয়েন্টমেন্ট";
  if (kind === "TOPUP") return "➕ টপ-আপ";
  return "🔧 সমন্বয়";
}

function bnDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${toBn(d.getDate())}/${toBn(d.getMonth() + 1)}/${toBn(d.getFullYear())} ${toBn(p(d.getHours()))}:${toBn(p(d.getMinutes()))}`;
}

/**
 * Admin credit wallet card — drop onto a doctor/hospital detail page.
 * Shows balance + due headroom, tops up, lists the ledger.
 */
export function CreditTopupCard({ ownerType, ownerId }: { ownerType: CreditOwner; ownerId: string }) {
  const [view, setView] = useState<CreditView | null>(null);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("100");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await apiFetch(
        `/api/backend/api/admin/credits?ownerType=${ownerType}&ownerId=${encodeURIComponent(ownerId)}`,
      );
      const json = (await res.json().catch(() => null)) as { data?: CreditView; error?: string } | null;
      if (!res.ok) throw new Error(json?.error || "লোড করা যায়নি।");
      if (json?.data) {
        setView(json.data);
        setError("");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "লোড করা যায়নি।");
    }
  }, [ownerType, ownerId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount fetch syncing external wallet snapshot
    void load();
  }, [load]);

  const topup = async () => {
    const n = Number(String(amount).trim());
    if (!Number.isInteger(n) || n < 1 || n > 100000) {
      setMsg("টপ-আপ ১–১০০০০০ ক্রেডিটের মধ্যে হতে হবে।");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const res = await apiFetch("/api/backend/api/admin/credits/topup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ownerType, ownerId, amount: n, note: note.trim() || undefined }),
      });
      const json = (await res.json().catch(() => null)) as { data?: CreditView; error?: string } | null;
      if (!res.ok) throw new Error(json?.error || "টপ-আপ করা যায়নি।");
      if (json?.data) setView(json.data);
      setAmount("100");
      setNote("");
      setMsg(`✅ ${toBn(n)} ক্রেডিট যোগ হয়েছে।`);
      void load();
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "টপ-আপ করা যায়নি।");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-black text-slate-800">🪙 ক্রেডিট ওয়ালেট</p>
        {view && (
          <p
            className={`rounded-full px-3 py-1 text-sm font-black tabular-nums ${
              view.exhausted ? "bg-red-100 text-red-700" : view.balance < 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-700"
            }`}
          >
            ব্যালেন্স {toBn(view.balance)}
            {view.exhausted ? " · শেষ" : ` · আর ${toBn(view.bookableLeft)}টা বুকিং`}
          </p>
        )}
      </div>
      {error && <p className="mt-2 text-xs font-bold text-red-600">{error}</p>}
      {!view && !error && <div className="mt-3 h-16 animate-pulse rounded-xl bg-slate-50" />}
      {view && (
        <p className="mt-1 text-xs font-bold text-slate-500">
          {view.ownerName} · বাকিতে {toBn(view.dueLimit)} ক্রেডিট পর্যন্ত বুকিং চালু থাকবে
        </p>
      )}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="numeric"
          placeholder="পরিমাণ (যেমন: ১০০)"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 sm:max-w-44"
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="নোট (ঐচ্ছিক)"
          maxLength={200}
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
        <button
          type="button"
          onClick={() => void topup()}
          disabled={busy}
          className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white shadow transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {busy ? "…" : "➕ টপ-আপ"}
        </button>
      </div>
      {msg && <p className="mt-2 text-xs font-bold text-slate-600">{msg}</p>}

      {view && view.ledger.length > 0 && (
        <ul className="mt-3 max-h-64 space-y-1.5 overflow-y-auto">
          {view.ledger.slice(0, 20).map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700"
            >
              <span className="shrink-0">{kindLabel(r.kind)}</span>
              <span className={`shrink-0 tabular-nums ${r.amount < 0 ? "text-red-600" : "text-emerald-600"}`}>
                {r.amount < 0 ? "−" : "+"}
                {toBn(Math.abs(r.amount))}
              </span>
              <span className="min-w-0 flex-1 truncate text-slate-500">
                {r.note || (r.refType === "PendingAppointment" ? "ওয়েবসাইট/হোয়াটসঅ্যাপ" : r.refType === "ConfirmedAppointment" ? "সরাসরি বুকিং" : "")}
              </span>
              <span className="shrink-0 tabular-nums text-slate-400">→ {toBn(r.balanceAfter)}</span>
              <span className="hidden shrink-0 text-slate-400 sm:inline">{bnDateTime(r.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
